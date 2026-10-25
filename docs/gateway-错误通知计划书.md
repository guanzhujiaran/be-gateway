# 网关（be-gateway）错误通知计划书

## 0. 文档信息

| 项 | 内容 |
|---|---|
| 模块 | `be-gateway` / Express 网关 |
| 状态 | 待实现 |
| 前置结论 | 全站请求均经过网关，业务错误通知统一收口到网关层；最外层 OpenResty 不做 lua 改造，仅保留零代码日志兜底 |

---

## 1. 背景与目标

全站流量统一经过 `be-gateway`（单进程 `app.listen`，无 cluster），因此网关是**唯一能同时看到全部请求与业务身份（mid / 路由 / 上游服务）的观测点**。

当前网关已经具备错误推送能力，但只覆盖「连不上上游」，不覆盖「上游返回 5xx」，且实现方式会在故障时放大问题。

### 目标

1. 上游返回的 4xx/5xx、上游不可达、网关自身异常，全部有通知；
2. 通知**不进入响应链路**，不增加任何请求 RT；
3. 故障风暴下**不等于推送风暴**，同类错误必须聚合；
4. 网关进程退出、启动失败这两个"静默死亡"路径必须有通知。

### 非目标（明确不做）

- 不做请求级明细告警（那是日志/APM 的事，不是手机推送的事）；
- 不做告警值班、升级、静默期、认领等值班系统能力；
- 不改造最外层 OpenResty（不引入 Lua，不引入 lua-resty-http）；
- 不覆盖不经过网关的流量（服务间直连 RPC、定时任务），这部分由各服务自行上报或走日志采集；
- 不做指标持久化（推送即丢弃，不落库）。

---

## 2. 现状问题

### 2.1 推送被 `await` 在响应链路上

```js
// Controller/ProxyHelper.js: 91-106（现状）
async function proxyErrorHandler(err, req, res) {
  console.error(`代理错误 (${req.host}${req.path}):`, err);
  // 转发路由报错时发送系统级推送通知（await 确保推送完成后再返回响应）
  await sendProxyErrorPush(err, req);
  ...
}
```

- 推送目标是公网 `https://push.i-i.me`，`axios.post` **未设置 timeout**；
- 推送慢 → 代理错误请求一起卡；推送挂起 → 请求挂到 `connect-timeout` 的 30s 上限；
- 上游故障时错误请求量激增 → 每个请求一个 axios 连接 → 网关事件循环被占满。

### 2.2 无聚合、无去重

每次错误各推一条。上游挂 1 分钟（按 100 QPS 算）就是 6000 条推送，手机端刷屏，推送服务限流后真正重要的告警被淹没。

### 2.3 上游返回的 5xx 完全采集不到

`http-proxy-middleware` 在拿到上游响应后直接 pipe 给客户端，`on.error` 只在**连接层失败**时触发。上游正常返回 `500` 时，代码里没有任何 hook 被调用。这是当前最大的覆盖缺口。

### 2.4 存在静默死亡路径

```js
// server.js: 31-38（现状）
const messageFailed = failed.find((r) => r.name.includes("be-message-service"));
if (messageFailed) {
  console.error("be-message-service 不可用，网关拒绝启动！");
  ...
  process.exit(1);
}
```

启动失败、`SIGTERM`、`uncaughtException` 三条路径均只打控制台日志，无任何外部通知。

### 2.5 现成推送工具已失效

```js
// BiliPPTR/utils/utils.js: 1369-1371（现状）
push_me: async function (title, msg, pushme_key, push_plus_key, sys_msg = false) {
    if (!pushme_key && !sys_msg) return
    return console.log(`pushme\t${arguments[0]}\t${arguments[1]}`)
```

`utils.my_send_notify.push_me` 已被短路为只打日志。**新模块不得复用该方法**，只复用其 `__push_key` 里的 token。

---

## 3. 总体设计

```
                        ┌─────────────────────────────────────┐
   请求 ──> 网关 ──────> │ 采集点（同步、零 IO、绝不 throw）    │
                        └──────────────┬──────────────────────┘
                                       │ collect(item)
                                       v
                        ┌─────────────────────────────────────┐
                        │ ErrorReporter 内存桶（Map）          │
                        │ key = kind|status|upstream|path|code │
                        │ value = { count, firstAt, lastAt }   │
                        └──────────────┬──────────────────────┘
                                       │ setInterval(10s).unref()
                                       v
                        ┌─────────────────────────────────────┐
                        │ flush：排序 → 截断 → 组装文本        │
                        │ → pushme（失败兜底 pushplus）        │
                        │ → 全程超时 5s，异常只打日志          │
                        └─────────────────────────────────────┘
```

三条铁律：

1. **采集同步化**：`collect()` 只写内存 `Map`，无网络、无文件、无 await；
2. **推送异步化**：所有出网动作只在 timer 回调里发生，与请求生命周期彻底解耦；
3. **失败静默化**：采集/推送任何环节失败都只 `console.warn`，绝不向上抛、绝不 `process.exit`。

---

## 4. 采集点定义

### 4.1 采集点 A：上游返回 5xx（新增，最重要）

挂载位置：`Controller/ProxyEndPort.js`（6 处代理）、`Controller/api/v1/user/UserGatewayProxy.js`（1 处代理）。

```js
proxyRes: (proxyRes, req, res) => {
  const status = proxyRes.statusCode;
  if (status < 500) return;          // 4xx 不进告警（业务侧正常行为）
  errorReporter.collect({
    kind: "upstream_5xx",
    status,
    method: req.method,
    path: req.originalUrl,
    upstream: upstreamName,
    mid: req.userInfoForHeader && req.userInfoForHeader.mid,
    code: "",
  });
}
```

约束：

- `proxyRes` 阶段**只观察，不读取/不修改响应流**，不得消费 body（会破坏 pipe）；
- `http-proxy-middleware@4` 的事件写法为 `on: { proxyRes, error }`；
- 无法拿到上游错误详情（body 已在流中），仅记录状态码，这是可接受的精度。

### 4.2 采集点 B：代理连接层错误（改造现有）

现有 `on.error` 已在全部代理上挂载。改造为「先 `collect`，再走原 `proxyErrorHandler`」，且 `proxyErrorHandler` 内不再 `await` 推送。

```js
error: (err, req, res) => {
  errorReporter.collect({
    kind: "proxy_error",
    status: 0,                       // 无 HTTP 响应
    method: req.method,
    path: req.originalUrl,
    upstream: upstreamName,
    mid: req.userInfoForHeader && req.userInfoForHeader.mid,
    code: (err && err.code) || "",
  });
  return proxyErrorHandler(err, req, res);
}
```

### 4.3 采集点 C：网关自身 5xx

挂载位置：`app.js` 全局错误处理中间件内，`resp.status(500)` 之前；以及超时分支（`err.status === 503/504` → 返回 504）之前。

```js
errorReporter.collect({
  kind: "gateway_5xx",
  status: 500,
  method: req.method,
  path: req.originalUrl,
  upstream: "gateway",
  mid: req.userInfoForHeader && req.userInfoForHeader.mid,
  code: (err && err.code) || "",
});
```

### 4.4 采集点 D：进程级异常

```js
process.on("uncaughtException", (err) => { ... });
process.on("unhandledRejection", (err) => { ... });
```

处理策略：先走 `notifyExit`（同步 curl，见 §6），再记录信息并退出。不尝试用聚合器（进程即将结束，timer 不一定跑得到）。

---

## 5. 聚合器设计（`MiddleWare/ErrorReporter.js`）

### 5.1 桶 key

```
kind | status | upstream | normalizePath(path) | code
```

`normalizePath` 规则（防止动态路径撑爆桶）：

1. 丢弃 query 与 hash（**顺带避免 token / code 等敏感参数进入推送内容**）；
2. `/user/123` → `/user/:id`（连续数字段）；
3. 长度 ≥16 的十六进制串 → `:hash`；
4. 截断到 120 字符。

### 5.2 参数

| 参数 | 值 | 说明 |
|---|---|---|
| `FLUSH_INTERVAL_MS` | 10000 | 聚合窗口 |
| `MAX_BUCKETS` | 500 | 桶上限，超限丢弃新桶（保护内存） |
| `DETAIL_LIMIT` | 20 | 单次推送最多列出的桶数（按 count 降序） |
| `PUSH_TIMEOUT_MS` | 5000 | 单次推送超时 |
| `KIND_THRESHOLD` | 见 5.3 | 各类型推送阈值 |

### 5.3 阈值策略

| kind | 窗口内阈值 | 理由 |
|---|---|---|
| `proxy_error` | 1（立即推） | 上游不可达属严重故障，且低频，不需要聚合门槛 |
| `upstream_5xx` | 5 | 业务 5xx 有正常抖动，低于 5 次不打扰 |
| `gateway_5xx` | 3 | 网关自身异常，容忍度更低 |

未达阈值的桶**不丢弃，继续累积到下一个窗口**，直到达标或超过 `SERIES_TTL`（60s）后清空，避免"每次 4 次永不告警"。

### 5.4 推送内容格式

```
标题：[网关错误聚合] 10s 内 137 次 / 3 类

正文：
时间: 2026-10-25 12:00:00
合计: 137 次，3 类（仅列前 20 类）

[upstream_5xx] HTTP 500 x120
  POST /api/v1/user/:id
  上游: message  mid: 12345

[proxy_error] ECONNREFUSED x15
  GET /api/v1/rpa/task/:id
  上游: rpa  mid: 67890
```

### 5.5 推送通道

复用 `utils.my_send_notify.__push_key` 中的 `pushme` / `push_plus` token，但**自建实现**（现成的 `push_me` 已短路为 `console.log`，见 §2.5）：

1. `POST https://push.i-i.me`，`timeout: 5000`；
2. 失败后兜底 `POST http://www.pushplus.plus/send`，同样 5s 超时；
3. 两者都失败仅 `console.warn`，不重试（下一窗口会自然重发）。

---

## 6. 退出通知（`MiddleWare/ExitNotifier.js`）

```
notifyExit(reason: string, detail?: string): void
```

实现方式：`child_process.execSync` + `curl -s -m 3`。

**必须同步**：进程即将退出，异步 IO 不保证能完成。所有异常吞掉，不得影响退出码与退出时机。

挂载点：

| 位置 | reason |
|---|---|
| `server.js` 的 `process.exit(1)` 前 | `启动失败：上游不可用` |
| `process.on("SIGTERM")` | `收到 SIGTERM` |
| `process.on("SIGINT")` | `收到 SIGINT` |
| `process.on("uncaughtException")` | `未捕获异常` |

覆盖不到的：`kill -9`、OOM killer、宿主机宕机、网络隔离。见 §7。

---

## 7. 最外层 OpenResty 兜底（零代码）

不写 Lua、不改 nginx 配置，仅依赖现有 access log 配一条告警规则：

```
status >= 502 AND upstream_status = ""
```

语义：网关连不上（`$upstream_status` 为空表示没有拿到任何上游响应）。这是 OpenResty 能提供、而网关永远提供不了的信息——**网关自己死了，它报不出来**。

可选增强（不阻塞本次实现）：access log 中已配置 `$upstream_status`、`$request_id` 即可满足上述规则。

---

## 8. 改动清单

| # | 文件 | 类型 | 改动 |
|---|---|---|---|
| 1 | `ExpressServerEnd/MiddleWare/ErrorReporter.js` | 新增 | 聚合器：`collect` / `start` / `flush` |
| 2 | `ExpressServerEnd/MiddleWare/ExitNotifier.js` | 新增 | `notifyExit`（同步 curl） |
| 3 | `ExpressServerEnd/Controller/ProxyHelper.js` | 修改 | 新增 `buildProxyHooks(upstreamName)`；删除 `proxyErrorHandler` 中的 `await sendProxyErrorPush(...)`；`sendProxyErrorPush` 标记 deprecated（保留导出避免外部引用断裂） |
| 4 | `ExpressServerEnd/Controller/ProxyEndPort.js` | 修改 | 6 处代理的 `on` 挂上 `proxyRes`，`error` 换成 `buildProxyHooks` 产出的版本 |
| 5 | `ExpressServerEnd/Controller/api/v1/user/UserGatewayProxy.js` | 修改 | 同上（1 处） |
| 6 | `ExpressServerEnd/app.js` | 修改 | `errorReporter.start()`；全局错误中间件 500 / 504 分支采集；注册 `process.on` 钩子 |
| 7 | `ExpressServerEnd/server.js` | 修改 | `process.exit(1)` 前调用 `notifyExit` |

上游服务命名（用于告警归类）与 `Service/upstream_health_module/upstream_health_service.js` 的 `getUpstreamTargets()` 保持一致，取短名：`crawler` / `rpa` / `casdoor` / `message` / `gateway`。

---

## 9. 降级与失败策略

| 场景 | 行为 |
|---|---|
| 桶数量超过 `MAX_BUCKETS` | 丢弃新桶，已有桶正常累计 |
| `normalizePath` 抛异常 | `collect` 内部 try/catch，整条丢弃 |
| 推送超时 / 网络失败 | 仅 `console.warn`，本窗口数据丢弃（不做落盘重试） |
| flush 自身异常 | `catch` 后 `console.warn`，保持 timer 存活 |
| 定时器阻止进程退出 | `timer.unref()` |

**明确取舍**：宁可丢告警，也不能影响业务。这是本模块所有实现细节的最高优先级。

---

## 10. 验证方案

实现完成后按顺序验证，全部通过才算完成：

1. **上游 5xx 采集**：Mock 一个返回 500 的上游，连续请求 10 次 → 收到 1 条推送，`x10`，路径已归一化；
2. **阈值生效**：连续请求 3 次 → 不推送；再请求 2 次（累计 5）→ 推送；
3. **上游不可达**：停掉上游进程后请求 → 1 次即推送，`kind=proxy_error`，含 `ECONNREFUSED`；
4. **不阻塞响应**：对比改动前后，正常请求与错误请求的 RT 无明显变化（推送服务不可达时同样不应变慢）；
5. **退出通知**：`kill -TERM` 网关 → 收到「收到 SIGTERM」；将 be-message 指向无效地址启动 → 收到「启动失败」；
6. **路径脱敏**：请求 `/api/v1/x?token=abc` 触发 500 → 推送内容中不含 `abc`；
7. **静态检查**：`node -c`（或实际启动）确认无语法错误，`npm run dev` 正常启动且上游健康检查通过。

---

## 11. 风险与回滚

| 风险 | 缓解 |
|---|---|
| `proxyRes` 钩子影响代理性能 | 钩子内只做 `statusCode` 判断 + 内存写入；异常全部吞掉；实跑对比 RT |
| 推送服务本身故障 | 双通道兜底 + 5s 超时 + 不做重试，最坏情况只是告警丢失 |
| 告警噪音导致忽略 | 阈值 + 路径归一化 + 单次最多 20 条明细 |
| 误删 `sendProxyErrorPush` 导致引用断裂 | 本次只删调用点，函数保留并标记 deprecated；全局搜索确认无其他引用 |

回滚方式：删除 `errorReporter.start()` 调用即可让全部采集静默（`collect` 前会判空 timer，未 `start` 时仍会写内存但不会 flush），配置级回滚，无需改代码。

---

## 12. 后续可扩展（本次不做）

- 接入 `be-message` 的结构化告警接口，替代 pushme 文本推送，支持告警分级 / 静默期 / 认领；
- 告警内容带上 `trace_id`，与后端日志串联（需网关生成并透传 `X-Trace-Id`）；
- 基于 `ErrorReporter` 的桶数据做网关侧熔断（同类错误超阈值时直接 503，不打下游）。

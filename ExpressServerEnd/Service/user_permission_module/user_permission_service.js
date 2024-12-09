const {permissionMap} = require("@/ExpressServerEnd/Service/CONST");
const guard = require('express-jwt-permissions')({
    requestProperty: 'auth',
    permissionsProperty: 'role'
})

class TrieNode {
    constructor() {
        this.children = new Map();
        this.permissions = null;
        this.isWildcard = false;
    }
}

function buildTrie(permissionMap) {
    const root = new TrieNode();

    for (const [pattern, permissions] of permissionMap) {
        let currentNode = root;
        const parts = pattern.split('/').filter(part => part !== '');

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            let isLastPart = i === parts.length - 1;

            if (part === '*') {
                currentNode.isWildcard = true;
            }

            if (!currentNode.children.has(part)) {
                currentNode.children.set(part, new TrieNode());
            }

            currentNode = currentNode.children.get(part);

            if (isLastPart) {
                currentNode.permissions = permissions;
            }
        }
    }
    return root;
}

function matchPath(trieRoot, path) {
    const parts = path.split('/').filter(part => part !== '');
    let currentNode = trieRoot;

    function traverse(parts, node) {
        if (parts.length === 0) {
            // 如果已经到达路径末尾，检查当前节点是否有权限或是否为通配符节点
            return node.permissions || (node.isWildcard ? node.permissions : null);
        }

        const [first, ...rest] = parts;

        // 检查是否存在完全匹配的子节点
        if (node.children.has(first)) {
            const result = traverse(rest, node.children.get(first));
            if (result !== null) return result;
        }

        // 如果没有完全匹配的子节点，检查是否存在通配符子节点
        if (node.children.has('*')) {
            return traverse(rest, node.children.get('*'));
        }

        return null;
    }

    return traverse(parts, currentNode);
}

const trieRoot = buildTrie(permissionMap);

function createGuard() {
    return (req, resp, next) => {
        const path = req.path; // 获取当前请求的路径

        const permissions = matchPath(trieRoot, req.path);
        if (permissions) {
            const permission_name = permissions.name;
            guard.check(permissions.permissions)(req, resp,
                (err) => {
                    if (err) {
                        return resp.json({
                            code: 4000009,
                            "data": {},
                            "message": `用户无权限`,
                            "msg": "用户无权限"
                        })
                    } else {
                        next();
                    }
                }
            );
        } else {
            // 如果路径没有定义在权限映射中，默认允许访问或执行其他逻辑
            next();
        }
    };
}

module.exports = {
    createGuard,
}
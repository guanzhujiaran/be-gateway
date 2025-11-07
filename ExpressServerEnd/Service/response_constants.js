const RESPONSE_CODES = {
  // 成功响应
  SUCCESS: { 
    code: 0, 
    msg: '成功' 
  },
  ACCOUNT_CREATE_SUCCESS: { 
    code: 0, 
    msg: '账号账号创建成功！' 
  },
  ACCOUNT_DETAIL_SAVE_SUCCESS: { 
    code: 0, 
    msg: '保存账号详情成功！' 
  },
  COMMENT_ADD_SUCCESS: { 
    code: 0, 
    msg: '评论成功！' 
  },
  COMMENT_GET_SUCCESS: { 
    code: 0, 
    msg: '获取评论成功！' 
  },
  PERSONALIZED_CONTENT_GET_SUCCESS: { 
    code: 0, 
    msg: '获取个性化内容成功！' 
  },
  
  // 错误响应
  ERRORS: {
    // 通用错误
    UNKNOWN_ERROR: { code: 500, msg: '服务器错误喵！别尝试了，喊我修复先！' },
    INVALID_REQUEST: { code: 400, msg: '请求错误' },
    UNAUTHORIZED: { code: -101, msg: '账号未登录' },
    PERMISSION_DENIED: { code: -403, msg: '账号无权限' },
    
    // 账户相关错误 4001x
    ACCOUNT_NAME_EXISTS: { code: 40014, msg: '该昵称已存在' },
    ACCOUNT_CREATION_FAILED: { code: 40015, msg: '账号账号创建失败！' },
    ACCOUNT_INFO_MISSING: { code: 40013, msg: '请输入账号名称或账号ID！' },
    ACCOUNT_NOT_FOUND: { code: 40016, msg: '该账号不存在！' },
    ACCOUNT_NAME_MISMATCH: { code: 40018, msg: '账号名称和COOKIENAME不一致！' },
    ACCOUNT_SAVE_FAILED: { code: 40019, msg: '保存账号详情失败！' },
    
    // 内容相关错误 41000xx
    CONTENT_NOT_FOUND: { code: 4100024, msg: '无内容！' },
    CONTENT_RESOURCE_NOT_FOUND: { code: 4100023, msg: '待回复的资源不存在！' },
    CONTENT_REPLY_NOT_FOUND: { code: 4100025, msg: '回复的内容不存在！' },
    CONTENT_REPLY_LEVEL_ERROR: { code: 4100026, msg: '评论层级错误！' }
  }
};

module.exports = { RESPONSE_CODES };
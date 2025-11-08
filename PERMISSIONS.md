# 用户权限配置说明

## 📋 权限矩阵

| 功能 | admin | developer | tester | user |
|------|:-----:|:---------:|:------:|:----:|
| **用户管理** |
| 查看用户列表 | ✅ | ❌ | ❌ | ❌ |
| 创建用户 | ✅ | ❌ | ❌ | ❌ |
| 修改用户 | ✅ | ❌ | ❌ | ❌ |
| 删除用户 | ✅ | ❌ | ❌ | ❌ |
| **模块管理** |
| 查看模块列表 | ✅ | ✅ | ✅ | ✅ |
| 创建模块 | ✅ | ❌ | ❌ | ❌ |
| 修改模块 | ✅ | ❌ | ❌ | ❌ |
| 删除模块 | ✅ | ❌ | ❌ | ❌ |
| **项目管理** |
| 查看项目列表 | ✅ | ✅ | ✅ | ✅ |
| 创建项目 | ✅ | ❌ | ❌ | ❌ |
| 修改项目 | ✅ | ❌ | ❌ | ❌ |
| 删除项目 | ✅ | ❌ | ❌ | ❌ |
| **固件管理** |
| 查看固件列表 | ✅ | ✅ | ✅ | ✅ |
| 上传固件 | ✅ | ✅ | ❌ | ❌ |
| 下载固件 | ✅ | ✅ | ✅ | ✅ |
| 删除固件 | ✅ | ✅** | ❌ | ❌ |
| **测试管理** |
| 更新固件状态 | ✅ | ❌ | ✅ | ❌ |
| 上传测试报告 | ✅ | ❌ | ✅ | ❌ |
| 下载测试报告 | ✅ | ✅ | ✅ | ✅ |

*注：developer 只能删除自己上传的固件，且不能删除已发布（released）或作废（obsolete）状态的固件

** 限制说明：
- Admin：可以删除任何状态的固件
- Developer：只能删除自己上传的固件，且固件状态必须为 pending、testing、passed 或 failed

## 🔐 角色说明

### Admin (管理员)
- **权限范围**: 完全控制权限
- **典型用户**: 系统管理员
- **主要职责**:
  - 用户账号管理
  - 系统配置管理
  - 模块和项目管理
  - 所有固件操作

### Developer (开发者)
- **权限范围**: 固件开发和发布
- **典型用户**: 软件工程师、固件开发人员
- **主要职责**:
  - 上传新固件版本
  - 下载固件进行测试
  - 查看测试报告
  - 删除自己上传的固件

### Tester (测试人员)
- **权限范围**: 固件测试和验证
- **典型用户**: QA工程师、测试人员
- **主要职责**:
  - 下载固件进行测试
  - 更新固件测试状态
  - 上传测试报告
  - 查看其他测试报告

### User (普通用户)
- **权限范围**: 只读访问
- **典型用户**: 生产人员、客户、其他相关人员
- **主要职责**:
  - 下载已发布的固件
  - 查看测试报告
  - 查看固件信息

## 🛡️ 技术实现

### 中间件

系统使用以下中间件来控制权限：

```javascript
// 页面访问认证（重定向到登录页）
ensureAuthenticated(req, res, next)

// API 访问认证（返回 401 JSON）
requireAuth(req, res, next)

// 管理员权限验证
adminRequired(req, res, next)

// 固件上传权限验证（admin + developer）
canUploadFirmware(req, res, next)

// 测试权限验证（admin + tester）
canTestFirmware(req, res, next)
```

### 路由保护示例

```javascript
// 所有已登录用户可访问
router.get('/api/firmwares', requireAuth, handler);

// 仅管理员可访问
router.post('/api/users', adminRequired, handler);

// 开发者和管理员可访问
router.post('/api/firmwares/upload', canUploadFirmware, handler);

// 测试人员和管理员可访问
router.post('/api/firmwares/:id/test-report', canTestFirmware, handler);
```

## 🔄 权限变更历史

### v1.1.0 (2025-11-08)
- **变更**: 调整下载权限
- **详情**:
  - 所有角色均可下载固件
  - 所有角色均可下载测试报告
  - 添加 `requireAuth` 中间件用于 API 路由认证
- **影响**: 提高了协作效率，所有相关人员都能访问必要资源

### v1.0.0 (2025-11-08)
- **初始版本**: 基础权限系统
- **特性**:
  - 四种用户角色
  - 基于角色的访问控制
  - 中间件权限验证

## 📝 自定义权限

如需自定义权限，请修改以下文件：

### 1. 中间件定义
```javascript
// server/middleware/auth.js
const customPermission = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'role1' || user.role === 'role2')) {
        next();
    } else {
        res.status(403).json({ error: '权限不足' });
    }
};
```

### 2. 路由应用
```javascript
// server/routes/example.js
const { customPermission } = require('../middleware/auth');

router.post('/custom-action', customPermission, (req, res) => {
    // 处理逻辑
});
```

### 3. 更新文档
请记得同步更新本文档和 README.md 中的权限说明。

## ⚠️ 安全建议

1. **最小权限原则**: 仅授予用户完成工作所需的最低权限
2. **定期审计**: 定期检查用户权限，移除不再需要的权限
3. **密码策略**: 强制使用强密码，定期更换
4. **会话管理**: 合理设置 session 过期时间（当前 24 小时）
5. **日志记录**: 记录所有敏感操作的日志
6. **权限变更**: 重要权限变更应有审批流程

## 📞 技术支持

如有权限相关问题，请联系：
- 邮箱: jassimxiong@gmail.com
- 项目: https://github.com/cseek/xfms

---

最后更新: 2025-11-08

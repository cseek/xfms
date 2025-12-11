# 固件管理系统 (Firmware Management System)

一个基于 Node.js + Express + SQLite 的模块化固件管理系统。

## ✨ 特性

- 🔐 用户认证与权限管理
- 📦 固件版本管理
- 🧪 测试流程管理
- 📊 固件状态跟踪
- 📝 测试报告管理
- 🔍 模块和项目管理
- 👥 多角色支持（管理员、开发者、测试员、普通用户）

## 🚀 快速开始

### 环境要求

- Node.js >= 14.x
- npm >= 6.x

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd xfms

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量（特别是 SESSION_SECRET）

# 4. 初始化数据库
npm run init-db

# 5. 启动服务
npm start
```

访问 http://localhost:3000

默认管理员账号：
- 用户: `admin`
- 密码: `admin`

**⚠️ 重要**: 首次登录后请立即修改管理员密码！

## 📚 部署

### 开发环境
```bash
npm run dev  # 使用 nodemon 自动重启
```

### 生产环境
```bash
# 1. 设置环境变量
export NODE_ENV=production
export SESSION_SECRET=your-strong-random-secret

# 2. 启动服务
npm start

# 或使用 PM2
pm2 start server/app.js --name xfms

# 3. linux 使用 service 开机自启动
xfms.service


[Unit]
Description=Node.js Application Service
After=network.target
Wants=network.target

[Service]
Type=simple
WorkingDirectory=/opt/xfms
ExecStart=/usr/bin/node /opt/xfms/server/app.js
ExecStop=/bin/bash -c 'kill -9 $(lsof -ti:3000)'
ExecKill=/bin/bash -c 'kill -9 $(lsof -ti:3000)'
Restart=on-failure

[Install]
WantedBy=multi-user.target
```


## 📖 详细文档

- [权限配置说明](./PERMISSIONS.md) - 详细的角色权限矩阵
- [环境变量配置](./.env.example) - 环境变量模板

## 🏗️ 项目结构

```
xfms/
├── client/                 # 前端资源
│   ├── css/               # 样式文件
│   ├── html/              # HTML 页面
│   └── js/                # JavaScript 文件
├── server/                # 后端服务
│   ├── config/            # 配置文件
│   ├── middleware/        # 中间件
│   ├── routes/            # 路由
│   └── utils/             # 工具函数
├── database/              # SQLite 数据库
├── uploads/               # 上传文件存储
│   ├── firmwares/        # 固件文件
│   └── test-reports/     # 测试报告
├── .env.example          # 环境变量模板
└── package.json          # 项目配置
```

## 🔧 配置说明

主要配置在 `.env` 文件中：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# Session 密钥（生产环境务必修改）
SESSION_SECRET=your-secret-key-here

# 数据库路径
DB_PATH=./database/firmware.db

# 邮件功能（可选）
EMAIL_ENABLED=false
```

详细配置说明请参考 [.env.example](./.env.example)

## 👥 用户角色

| 角色 | 权限 |
|------|------|
| admin | 全部权限 |
| developer | 上传固件、下载固件、下载测试报告 |
| tester | 下载固件、上传测试报告、下载测试报告、更新固件状态 |
| user | 下载固件、下载测试报告 |

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite3
- **Session**: express-session
- **文件上传**: multer
- **密码加密**: bcryptjs
- **邮件**: nodemailer (可选)

## 📝 开发指南

### 添加新路由

```javascript
// server/routes/example.js
const express = require('express');
const { adminRequired } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  // 路由逻辑
});

module.exports = router;
```

### 数据库查询

```javascript
// 使用 req.db（单例连接）
router.get('/', (req, res) => {
  req.db.all('SELECT * FROM table', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json(rows);
  });
});
```

## 🔒 安全建议

1. ✅ 修改默认管理员密码
2. ✅ 设置强 SESSION_SECRET
3. ✅ 生产环境使用 HTTPS
4. ✅ 定期备份数据库
5. ✅ 限制文件上传大小
6. ⚠️ 考虑添加请求限制（rate limiting）

## 📊 API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/check` - 检查登录状态

### 固件管理
- `GET /api/firmwares` - 获取固件列表
- `POST /api/firmwares/upload` - 上传固件
- `GET /api/firmwares/:id/download` - 下载固件
- `PUT /api/firmwares/:id/status` - 更新固件状态
- `DELETE /api/firmwares/:id` - 删除固件

### 用户管理（仅管理员）
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 模块管理
- `GET /api/modules` - 获取模块列表
- `POST /api/modules` - 创建模块（仅管理员）
- `PUT /api/modules/:id` - 更新模块（仅管理员）
- `DELETE /api/modules/:id` - 删除模块（仅管理员）

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目（仅管理员）
- `PUT /api/projects/:id` - 更新项目（仅管理员）
- `DELETE /api/projects/:id` - 删除项目（仅管理员）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

Apache License 2.0

Copyright (c) 2025 by Aurson

## 📧 联系方式

- 作者: Aurson
- Email: jassimxiong@gmail.com

---

⭐ 如果这个项目对你有帮助，请给个 Star！
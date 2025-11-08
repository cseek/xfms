# 代码重构迁移指南

## 🎯 概述

本文档为现有部署的迁移指南。如果你已经有正在运行的旧版本，请按照以下步骤进行升级。

## ⚠️ 重要提醒

1. **备份数据库**: 升级前务必备份 `database/firmware.db`
2. **备份上传文件**: 备份 `uploads/` 目录
3. **向后兼容**: 本次重构完全向后兼容，无需修改数据库结构

## 📝 迁移步骤

### 1. 停止服务

```bash
# 如果使用 PM2
pm2 stop xfms

# 或者直接 Ctrl+C 停止进程
```

### 2. 备份重要数据

```bash
# 备份数据库
cp database/firmware.db database/firmware.db.backup

# 备份上传文件（可选，文件较大可跳过）
# tar -czf uploads_backup.tar.gz uploads/
```

### 3. 拉取最新代码

```bash
# 拉取代码
git pull origin main

# 或者下载最新版本
```

### 4. 安装新依赖

```bash
npm install
```

新增依赖：
- `dotenv` - 环境变量管理

### 5. 创建环境变量文件

```bash
# 复制模板
cp .env.example .env
```

编辑 `.env` 文件，**必须设置**：

```bash
# 生成强随机密钥（重要！）
SESSION_SECRET=$(openssl rand -base64 32)

# 或手动设置
SESSION_SECRET=your-very-strong-random-secret-key-here
```

其他可选配置：

```bash
# 如果端口冲突
PORT=3000

# 如果需要启用邮件通知
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 6. 验证配置

```bash
# 检查配置文件是否存在
ls -la .env

# 确认 SESSION_SECRET 已设置
grep SESSION_SECRET .env
```

### 7. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start

# 使用 PM2
pm2 start server/app.js --name xfms
pm2 save
```

### 8. 验证功能

访问 http://localhost:3000 并测试：

✅ 登录功能
✅ 固件上传
✅ 固件下载
✅ 用户管理（管理员）
✅ 模块/项目管理

## 🔍 故障排除

### 问题 1: 登录失败 "Session 无效"

**原因**: SESSION_SECRET 未设置或改变

**解决**:
```bash
# 检查 .env 文件
cat .env | grep SESSION_SECRET

# 如果没有，手动添加
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env

# 重启服务
```

### 问题 2: 数据库连接错误

**原因**: 数据库路径错误

**解决**:
```bash
# 检查数据库文件
ls -la database/firmware.db

# 如果不存在，重新初始化
npm run init-db

# 如果有备份，恢复
cp database/firmware.db.backup database/firmware.db
```

### 问题 3: 文件上传失败

**原因**: uploads 目录权限问题

**解决**:
```bash
# 检查目录权限
ls -ld uploads/firmwares
ls -ld uploads/test-reports

# 修复权限
chmod -R 755 uploads/
```

### 问题 4: 模块未找到 (Cannot find module 'dotenv')

**原因**: 依赖未安装

**解决**:
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📋 检查清单

升级后请检查：

- [ ] 服务正常启动，无错误日志
- [ ] 可以正常登录
- [ ] 现有用户数据完整
- [ ] 固件列表正常显示
- [ ] 文件上传功能正常
- [ ] 文件下载功能正常
- [ ] 所有页面可正常访问
- [ ] SESSION_SECRET 已设置为强密钥

## 🔄 回滚步骤

如果升级出现问题，可以回滚：

```bash
# 1. 停止服务
pm2 stop xfms

# 2. 恢复代码
git checkout <previous-commit>

# 3. 恢复数据库
cp database/firmware.db.backup database/firmware.db

# 4. 重新安装依赖
npm install

# 5. 启动服务
npm start
```

## 📊 性能提升

升级后你将获得：

- ⚡ 更快的数据库查询（单例连接）
- 🎯 更少的内存占用
- 🛡️ 更安全的配置管理
- 🔧 更易于维护的代码

## 💡 新功能

### 1. 环境变量支持

现在可以通过 `.env` 文件配置所有参数，无需修改代码。

### 2. 邮件通知（可选）

如需启用：

```bash
# .env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📞 获取帮助

遇到问题？

1. 查看日志: `pm2 logs xfms` 或控制台输出
2. 查看文档: [REFACTORING.md](./REFACTORING.md)
3. 提交 Issue: GitHub Issues
4. 联系开发者: jassimxiong@gmail.com

## 🎉 完成

恭喜！你已经成功升级到最新版本。享受更好的性能和可维护性吧！

---

最后更新: 2025-11-08

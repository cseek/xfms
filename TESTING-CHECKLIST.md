# 重命名验证测试清单

## 测试环境
- 浏览器：推荐使用 Chrome/Firefox 的无痕模式（避免缓存问题）
- 测试账号：确保有管理员、研发人员、测试人员三种角色的账号

## 测试步骤

### 1. 基本访问测试
- [ ] 访问 `http://localhost:3000`，能否正常跳转到登录页面
- [ ] 登录后是否跳转到 `/uploads` 而不是 `/firmwares`
- [ ] 访问 `http://localhost:3000/firmwares`，是否自动重定向到 `/uploads`
- [ ] 访问 `http://localhost:3000/dashboard`，是否自动重定向到 `/uploads`

### 2. 导航测试
- [ ] 点击侧边栏"上传列表"菜单，子菜单是否正常展开
- [ ] 点击"所有固件"，页面是否正常加载，URL 是否为 `/uploads?filter=all`
- [ ] 点击"我上传的"，页面是否正常加载，URL 是否为 `/uploads?filter=my-uploaded`
- [ ] 当前激活的菜单项是否正确高亮显示
- [ ] 刷新页面后，菜单高亮状态是否正确保持

### 3. 功能测试
- [ ] 在固件管理页面上传固件，上传成功后是否跳转到 `/uploads`
- [ ] 上传列表中的固件卡片是否正常显示（包括 MD5 校验）
- [ ] 搜索功能是否正常工作
- [ ] 筛选功能是否正常工作（模块筛选、项目筛选等）
- [ ] 分页功能是否正常

### 4. 权限测试
- [ ] 使用非管理员账号尝试访问系统管理页面，是否跳转到 `/uploads` 并显示权限警告
- [ ] 测试人员角色能否正常访问上传列表
- [ ] 研发人员角色能否正常访问所有功能

### 5. API 测试
- [ ] 打开浏览器开发者工具 Network 面板
- [ ] 加载上传列表，API 请求是否为 `/api/firmwares?...`（而不是 `/api/uploads`）
- [ ] 下载固件，API 请求是否为 `/api/firmwares/{id}/download`
- [ ] 上传固件，API 请求是否为 `/api/firmwares/upload`

### 6. 样式检查
- [ ] 页面样式是否正常加载（无 404 错误）
- [ ] 打开开发者工具 Console，检查是否有 CSS/JS 加载错误
- [ ] 检查 Network 面板，确认 `upload-list.css` 和 `upload-list-page.js` 正常加载

### 7. 浏览器缓存清理
如果发现任何问题，尝试以下步骤：
- [ ] 清除浏览器缓存和 Cookie
- [ ] 使用无痕/隐私模式重新测试
- [ ] 强制刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）

## 预期结果

所有测试项都应该通过。如果发现任何问题，请记录：
1. 问题描述
2. 复现步骤
3. 浏览器控制台错误信息
4. Network 面板中失败的请求详情

## 常见问题排查

### 问题：页面样式错乱或 CSS 未加载
**解决方案**：
1. 检查浏览器开发者工具 Console 是否有 404 错误
2. 确认 `client/css/upload-list.css` 文件存在
3. 清除浏览器缓存后重试

### 问题：JavaScript 功能不工作
**解决方案**：
1. 检查浏览器开发者工具 Console 是否有 JS 错误
2. 确认 `client/js/pages/upload-list-page.js` 文件存在
3. 检查文件中的 pageId 是否为 `'upload-list'`

### 问题：菜单高亮不正确
**解决方案**：
1. 检查 `sidebar.html` 中的 data-page 属性是否为 `upload-list`
2. 检查 URL 参数是否正确传递
3. 查看 `common.js` 中的 `highlightActiveNav()` 方法

### 问题：API 请求失败
**解决方案**：
1. 确认服务器正在运行
2. 检查 `server/app.js` 中的 API 路由配置
3. 查看服务器控制台日志

## 回滚计划

如果发现严重问题需要回滚：

```bash
# 1. 停止服务器
# 2. 恢复文件名
cd /home/aurson/X/xfms/client/html
mv upload-list.html firmware-list.html

cd /home/aurson/X/xfms/client/css
mv upload-list.css firmware-list.css

cd /home/aurson/X/xfms/client/js/pages
mv upload-list-page.js firmware-list-page.js

# 3. 使用 git 恢复其他修改的文件
git checkout client/html/partials/sidebar.html
git checkout client/js/dashboard.js
git checkout client/js/common.js
git checkout client/js/login.js
git checkout client/js/firmware_manager.js
git checkout client/css/dashboard.css
git checkout client/css/common.css
git checkout server/app.js

# 4. 重启服务器
```

## 验证完成标志

当所有测试项都通过后，可以认为重命名工作已成功完成。建议：
1. 提交所有更改到版本控制系统
2. 创建一个标签（tag）标记这次重要更新
3. 通知团队成员关于路由变更的信息

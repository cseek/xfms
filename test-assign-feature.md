# 委派固件功能测试指南

## 功能概述
实现了完整的固件委派工作流程:
1. 上传者可以在"上传列表"中点击"委派固件"按钮
2. 弹出对话框,选择测试人员并填写委派说明
3. 固件状态变更为"待发布"(assigned)
4. 被委派的测试人员可以在"测试列表-我测试的"中看到委派过来的固件

## 测试步骤

### 1. 准备测试环境
确保数据库中有:
- ✅ admin用户 (id=1, role=admin)
- ✅ test用户 (id=2, role=tester)
- ✅ develop用户 (id=3, role=developer)
- ✅ 若干pending状态的固件

### 2. 测试委派功能

#### 步骤1: 以admin或developer身份登录
- 访问"固件管理 > 上传列表"
- 找到状态为"待委派"(pending)的固件

#### 步骤2: 点击"委派固件"按钮
- 应该弹出委派对话框
- 对话框标题: "委派固件"
- 包含下拉选择框,列出所有测试人员
- 包含委派说明文本框(可选)

#### 步骤3: 选择测试人员并提交
- 从下拉框选择"test (测试人员邮箱)"
- 可选填写委派说明
- 点击"确认委派"
- 应显示"固件委派成功"消息
- 固件列表自动刷新

#### 步骤4: 验证状态变更
- 该固件状态应变为"待发布"(蓝绿色标记)

#### 步骤5: 登出并以test用户登录
- 访问"固件管理 > 测试列表 > 我测试的"
- 应该能看到刚才被委派的固件
- 固件状态显示为"待发布"

#### 步骤6: 测试人员操作
- 在"我测试的"列表中,该固件应有以下操作按钮:
  - 下载固件
  - 发布固件
  - 驳回固件
- 点击"发布固件"可将状态变更为"已发布"
- 点击"驳回固件"可将状态变更为"已驳回"

## 数据库验证

### 查看委派记录
```bash
sqlite3 database/firmware.db "SELECT id, version, status, assigned_to, assign_note FROM firmwares WHERE assigned_to IS NOT NULL;"
```

### 查看历史记录
```bash
sqlite3 database/firmware.db "SELECT * FROM firmware_history WHERE action='assign' ORDER BY created_at DESC LIMIT 5;"
```

## API端点

### POST /api/firmwares/:id/assign
委派固件给测试人员

**请求体:**
```json
{
  "assigned_to": 2,
  "assign_note": "请测试WiFi连接功能"
}
```

**响应:**
```json
{
  "message": "固件委派成功",
  "assigned_to": "test"
}
```

## 权限控制

- **上传列表:** 只有固件上传者或管理员可以委派固件
- **测试列表:** 只有被委派的测试人员可以看到委派给自己的固件
- **发布列表:** 所有已发布的固件,只能下载

## 状态流转

```
pending (待委派)
    ↓ [委派固件]
assigned (待发布)
    ↓ [发布固件]         ↓ [驳回固件]
released (已发布)    rejected (已驳回)
```

## 已实现的文件修改

1. **client/js/modal_manager.js**
   - 新增 `showAssignFirmwareModal(firmwareId)` - 显示委派对话框
   - 新增 `assignFirmware(firmwareId)` - 提交委派请求

2. **server/routes/firmwares.js**
   - 新增 `POST /:id/assign` - 委派固件API
   - 修改 `tested_by` 过滤逻辑 - 包括委派给当前用户的固件

3. **server/init-db.js**
   - 新增 `assigned_to` 字段 - 委派对象ID
   - 新增 `assign_note` 字段 - 委派说明
   - 新增 `released_by` 字段 - 发布人ID
   - 新增 `released_at` 字段 - 发布时间

4. **client/js/firmware_manager.js**
   - 已在 `handleFirmwareAction()` 中添加 'assign' 和 'reject' 操作处理
   - 已在 `renderActionButtons()` 中为上传列表添加"委派固件"按钮

## 注意事项

- 只有角色为 'tester' 的用户才会出现在委派对话框的下拉列表中
- 委派说明为可选项,可以不填
- 委派成功后会记录到 firmware_history 表中
- 被委派的固件会立即出现在测试人员的"我测试的"列表中

# 数据库错误修复说明

## 问题描述
当点击"确认委派"时,出现"数据库错误"提示。

## 根本原因
数据库中的 `firmwares` 表的 CHECK 约束还是旧的状态值:
```sql
CHECK(status IN ('pending', 'testing', 'passed', 'failed', 'released', 'obsolete'))
```

而代码中已经改为新的4个状态值:
```sql
CHECK(status IN ('pending', 'assigned', 'released', 'rejected'))
```

当尝试将 `status` 更新为 `'assigned'` 时,违反了CHECK约束,导致SQL执行失败。

## 解决方案
由于 SQLite 不支持直接修改 CHECK 约束,需要通过以下步骤重建表:

1. 创建新表 `firmwares_new`,使用正确的 CHECK 约束
2. 将数据从旧表迁移到新表,同时映射旧状态到新状态:
   - `testing`, `passed`, `failed` → `pending` (待委派)
   - `released` → `released` (已发布)
   - `obsolete` → `rejected` (已驳回)
3. 删除旧表
4. 重命名新表为 `firmwares`

## 执行的操作

### 1. 创建迁移脚本
文件: `server/migrate-status.js`

### 2. 执行迁移
```bash
node server/migrate-status.js
```

### 3. 验证结果
```bash
# 查看新的CHECK约束
sqlite3 database/firmware.db "SELECT sql FROM sqlite_master WHERE type='table' AND name='firmwares';"

# 查看状态分布
sqlite3 database/firmware.db "SELECT status, COUNT(*) as count FROM firmwares GROUP BY status;"

# 测试委派功能
sqlite3 database/firmware.db "UPDATE firmwares SET status = 'assigned', assigned_to = 2 WHERE id = 1;"
```

## 迁移结果
✅ CHECK 约束已更新为新的4个状态值
✅ 所有现有固件的状态已映射为 `pending` (待委派)
✅ 委派功能现在可以正常工作

## 状态映射规则

| 旧状态 | 新状态 | 显示名称 |
|--------|--------|----------|
| pending | pending | 待委派 |
| testing | pending | 待委派 |
| passed | pending | 待委派 |
| failed | pending | 待委派 |
| released | released | 已发布 |
| obsolete | rejected | 已驳回 |

## 后续说明

迁移完成后,系统中的所有固件状态值都符合新的约束:
- **pending** (待委派) - 灰色徽章
- **assigned** (待发布) - 蓝绿色徽章
- **released** (已发布) - 绿色徽章
- **rejected** (已驳回) - 红色徽章

现在可以正常使用"委派固件"功能了!

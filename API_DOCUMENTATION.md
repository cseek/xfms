# 固件管理系统 API 接口文档

## 📋 目录

- [数据模型](#数据模型)
- [认证接口](#认证接口)
- [用户管理接口](#用户管理接口)
- [模块管理接口](#模块管理接口)
- [项目管理接口](#项目管理接口)
- [固件管理接口](#固件管理接口)

---

## 📊 数据模型

### 数据库表结构

#### 1. users (用户表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 用户ID |
| username | TEXT | UNIQUE, NOT NULL | 用户名 |
| password | TEXT | NOT NULL | 密码（bcrypt加密） |
| role | TEXT | NOT NULL, CHECK | 角色 (admin/developer/tester/user) |
| email | TEXT | - | 邮箱地址 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**示例数据**:
```json
{
  "id": 1,
  "username": "admin",
  "password": "$2a$10$...", 
  "role": "admin",
  "email": "admin@example.com",
  "created_at": "2025-09-14 10:00:00"
}
```

---

#### 2. modules (模块表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 模块ID |
| name | TEXT | UNIQUE, NOT NULL | 模块名称 |
| description | TEXT | - | 模块描述 |
| created_by | INTEGER | FOREIGN KEY → users(id) | 创建者ID |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**示例数据**:
```json
{
  "id": 1,
  "name": "WiFi Module",
  "description": "Wireless communication module",
  "created_by": 1,
  "created_at": "2025-09-14 10:00:00"
}
```

---

#### 3. projects (项目表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 项目ID |
| name | TEXT | UNIQUE, NOT NULL | 项目名称 |
| description | TEXT | - | 项目描述 |
| created_by | INTEGER | FOREIGN KEY → users(id) | 创建者ID |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**示例数据**:
```json
{
  "id": 1,
  "name": "Smart Home Hub",
  "description": "Central control unit for smart home",
  "created_by": 1,
  "created_at": "2025-09-14 10:00:00"
}
```

---

#### 4. firmwares (固件表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | 固件ID |
| module_id | INTEGER | NOT NULL, FOREIGN KEY → modules(id) | 模块ID |
| project_id | INTEGER | NOT NULL, FOREIGN KEY → projects(id) | 项目ID |
| version | TEXT | NOT NULL | 版本号 (格式: vX.Y.Z) |
| description | TEXT | - | 固件描述 |
| additional_info | TEXT | - | 附加信息 |
| file_path | TEXT | NOT NULL | 文件存储路径 |
| file_size | INTEGER | - | 文件大小（字节） |
| md5 | TEXT | - | MD5校验值 |
| status | TEXT | DEFAULT '待委派', CHECK | 状态 (待委派/待发布/已发布/已驳回) |
| uploaded_by | INTEGER | NOT NULL, FOREIGN KEY → users(id) | 上传者ID |
| assigned_to | INTEGER | FOREIGN KEY → users(id) | 委派给的测试人员ID |
| assign_note | TEXT | - | 委派说明 |
| test_report_path | TEXT | - | 测试报告路径 |
| test_notes | TEXT | - | 测后说明 |
| released_by | INTEGER | FOREIGN KEY → users(id) | 发布者ID |
| released_at | DATETIME | - | 发布时间 |
| reject_reason | TEXT | - | 驳回原因 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间（同时作为上传时间） |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

**状态说明**:
- `待委派`: 待委派（刚上传，等待分配测试人员）
- `待发布`: 待发布（已分配给测试人员，等待测试和发布）
- `已发布`: 已发布（测试通过并正式发布）
- `已驳回`: 已驳回（测试未通过被驳回）

**字段别名说明**（用于前端显示）:
- `version` → `version_name`: 版本号
- `created_at` → `uploaded_at`: 上传时间

**示例数据**:
```json
{
  "id": 1,
  "module_id": 2,
  "project_id": 3,
  "version": "v1.2.3",
  "description": "修复了连接稳定性问题",
  "additional_info": "增加了错误重试机制",
  "file_path": "/uploads/firmwares/firmware-1762681863254-868607222/app.bin",
  "file_size": 1048576,
  "md5": "5d41402abc4b2a76b9719d911017c592",
  "status": "待发布",
  "uploaded_by": 5,
  "assigned_to": 3,
  "assign_note": "请重点测试网络连接稳定性",
  "test_report_path": "/uploads/test-reports/test-report-1762682000000-123456789/report.pdf",
  "test_notes": "测试通过，网络连接稳定",
  "released_by": null,
  "released_at": null,
  "reject_reason": null,
  "created_at": "2025-11-10 10:30:00",
  "updated_at": "2025-11-10 11:00:00"
}
```

---

### 关联查询数据结构

#### 固件列表项（含关联数据）

当获取固件列表时，返回的每条记录包含关联的模块、项目和用户信息：

```json
{
  "id": 1,
  "module_id": 2,
  "project_id": 3,
  "version": "v1.2.3",
  "version_name": "v1.2.3",
  "description": "修复了连接稳定性问题",
  "additional_info": "增加了错误重试机制",
  "file_path": "/uploads/firmwares/firmware-1762681863254-868607222/app.bin",
  "file_size": 1048576,
  "md5": "5d41402abc4b2a76b9719d911017c592",
  "status": "待发布",
  "uploaded_by": 5,
  "assigned_to": 3,
  "assign_note": "请重点测试网络连接稳定性",
  "test_report_path": "/uploads/test-reports/test-report-1762682000000-123456789/report.pdf",
  "test_notes": null,
  "released_by": null,
  "released_at": null,
  "reject_reason": null,
  "created_at": "2025-11-10 10:30:00",
  "uploaded_at": "2025-11-10 10:30:00",
  "updated_at": "2025-11-10 11:00:00",
  "module_name": "WiFi Module",
  "project_name": "Smart Home Hub",
  "uploader_name": "developer1",
  "tester_name": "tester1"
}
```

---

### 分页响应结构

所有支持分页的接口统一返回以下结构：

```typescript
{
  data: Array<T>,           // 数据数组
  pagination: {
    page: number,           // 当前页码（从1开始）
    pageSize: number,       // 每页数量
    total: number,          // 总记录数
    totalPages: number      // 总页数
  }
}
```

**示例**:
```json
{
  "data": [
    { "id": 1, "username": "admin", ... },
    { "id": 2, "username": "developer1", ... }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 8,
    "total": 25,
    "totalPages": 4
  }
}
```

---

## 🔐 认证接口

Base URL: `/api/auth`

### 1. 用户登录

**接口**: `POST /api/auth/login`

**描述**: 用户登录并创建会话

**权限**: 无需认证

**请求头**:
```http
Content-Type: application/json
```

**请求体数据结构**:
```typescript
{
  username: string,    // 必填，用户名
  password: string     // 必填，密码
}
```

**请求示例**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string,     // 成功消息
  user: {
    id: number,        // 用户ID
    username: string,  // 用户名
    role: string,      // 角色 (admin/developer/tester/user)
    email: string      // 邮箱地址
  }
}
```

**成功响应示例**:
```json
{
  "message": "登录成功",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@example.com"
  }
}
```

**错误响应数据结构**:
```typescript
{
  error: string        // 错误描述信息
}
```

**错误响应示例**:

- `400 Bad Request`: 用户名或密码为空
  ```json
  {
    "error": "用户和密码不能为空"
  }
  ```

- `401 Unauthorized`: 用户名或密码错误
  ```json
  {
    "error": "用户或密码错误"
  }
  ```

- `500 Internal Server Error`: 数据库错误
  ```json
  {
    "error": "数据库错误"
  }
  ```

---

### 2. 用户登出

**接口**: `POST /api/auth/logout`

**描述**: 销毁用户会话并登出

**权限**: 无需认证

**无请求体**

**成功响应数据结构** (200):
```typescript
{
  message: string      // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "退出登录成功"
}
```

**错误响应数据结构**:
```typescript
{
  error: string        // 错误描述信息
}
```

**错误响应示例**:

- `500 Internal Server Error`: 退出登录失败
  ```json
  {
    "error": "退出登录失败"
  }
  ```

---

### 3. 检查登录状态

**接口**: `GET /api/auth/check`

**描述**: 检查当前用户是否已登录

**权限**: 无需认证

**无请求体**

**成功响应数据结构** (200):
```typescript
{
  id: number,          // 用户ID
  username: string,    // 用户名
  role: string,        // 角色
  email: string        // 邮箱地址
}
```

**成功响应示例**:
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "email": "admin@example.com"
}
```

**错误响应数据结构**:
```typescript
{
  error: string        // 错误描述信息
}
```

**错误响应示例**:

- `401 Unauthorized`: 未登录
  ```json
  {
    "error": "未登录"
  }
  ```

---

## 👥 用户管理接口

Base URL: `/api/users`

### 1. 获取所有用户

**接口**: `GET /api/users`

**描述**: 获取所有用户列表

**权限**: 仅管理员

**无请求体**

**成功响应数据结构** (200):
```typescript
Array<{
  id: number,              // 用户ID
  username: string,        // 用户名
  role: string,            // 角色 (admin/developer/tester/user)
  email: string,           // 邮箱地址
  created_at: string       // 创建时间 (YYYY-MM-DD HH:mm:ss)
}>
```

**成功响应示例**:
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "email": "admin@example.com",
    "created_at": "2025-09-14 10:00:00"
  },
  {
    "id": 2,
    "username": "developer1",
    "role": "developer",
    "email": "dev1@example.com",
    "created_at": "2025-09-15 11:30:00"
  }
]
```

**错误响应**:

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足（非管理员）
- `500 Internal Server Error`: 数据库错误

---

### 2. 创建用户

**接口**: `POST /api/users`

**描述**: 创建新用户

**权限**: 仅管理员

**请求体数据结构**:
```typescript
{
  username: string,        // 必填，用户名（唯一）
  password: string,        // 必填，密码（将被bcrypt加密）
  role: string,            // 必填，角色 (developer/tester/user)
  email?: string           // 可选，邮箱地址
}
```

**请求示例**:
```json
{
  "username": "developer2",
  "password": "password123",
  "role": "developer",
  "email": "dev2@example.com"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string,         // 成功消息
  userId: number           // 新创建的用户ID
}
```

**成功响应示例**:
```json
{
  "message": "用户创建成功",
  "userId": 3
}
```

**错误响应数据结构**:
```typescript
{
  error: string            // 错误描述信息
}
```

**错误响应示例**:

- `400 Bad Request`: 参数错误
  ```json
  {
    "error": "用户、密码和角色不能为空"
  }
  ```
  ```json
  {
    "error": "角色不合法"
  }
  ```
  ```json
  {
    "error": "用户已存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 3. 更新用户

**接口**: `PUT /api/users/:id`

**描述**: 更新指定用户信息

**权限**: 仅管理员

**URL参数**:
- `id`: 用户ID (number)

**请求体数据结构**:
```typescript
{
  password?: string,       // 可选，新密码
  role: string,            // 必填，角色 (admin/developer/tester/user)
  email?: string           // 可选，邮箱地址
}
```

**请求示例**:
```json
{
  "password": "newpassword123",
  "role": "tester",
  "email": "newemail@example.com"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "用户更新成功"
}
```

**错误响应示例**:

- `404 Not Found`: 用户不存在
  ```json
  {
    "error": "用户不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 4. 删除用户

**接口**: `DELETE /api/users/:id`

**描述**: 删除指定用户

**权限**: 仅管理员

**URL参数**:
- `id`: 用户ID (number)

**无请求体**

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "用户删除成功"
}
```

**错误响应示例**:

- `400 Bad Request`: 不能删除当前登录用户
  ```json
  {
    "error": "不能删除当前登录的用户"
  }
  ```

- `404 Not Found`: 用户不存在
  ```json
  {
    "error": "用户不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

## 📦 模块管理接口

Base URL: `/api/modules`

### 1. 获取所有模块

**接口**: `GET /api/modules`

**描述**: 获取所有模块列表

**权限**: 需要登录

**无请求体**

**成功响应数据结构** (200):
```typescript
Array<{
  id: number,              // 模块ID
  name: string,            // 模块名称
  description: string,     // 模块描述
  created_by: number,      // 创建者ID
  created_at: string       // 创建时间 (YYYY-MM-DD HH:mm:ss)
}>
```

**成功响应示例**:
```json
[
  {
    "id": 1,
    "name": "WiFi Module",
    "description": "Wireless communication module",
    "created_by": 1,
    "created_at": "2025-09-14 10:00:00"
  },
  {
    "id": 2,
    "name": "BLE Module",
    "description": "Bluetooth Low Energy module",
    "created_by": 1,
    "created_at": "2025-09-15 11:30:00"
  }
]
```

**错误响应**:

- `500 Internal Server Error`: 数据库错误

---

### 2. 创建模块

**接口**: `POST /api/modules`

**描述**: 创建新模块

**权限**: 仅管理员

**请求体数据结构**:
```typescript
{
  name: string,            // 必填，模块名称（唯一）
  description?: string     // 可选，模块描述
}
```

**请求示例**:
```json
{
  "name": "GPS Module",
  "description": "Global Positioning System module"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string,         // 成功消息
  moduleId: number         // 新创建的模块ID
}
```

**成功响应示例**:
```json
{
  "message": "模块创建成功",
  "moduleId": 3
}
```

**错误响应示例**:

- `400 Bad Request`: 参数错误
  ```json
  {
    "error": "模块名不能为空"
  }
  ```
  ```json
  {
    "error": "模块名已存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 3. 更新模块

**接口**: `PUT /api/modules/:id`

**描述**: 更新指定模块信息

**权限**: 仅管理员

**URL参数**:
- `id`: 模块ID (number)

**请求体数据结构**:
```typescript
{
  name: string,            // 必填，模块名称
  description?: string     // 可选，模块描述
}
```

**请求示例**:
```json
{
  "name": "WiFi Module V2",
  "description": "Enhanced wireless communication module"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "模块更新成功"
}
```

**错误响应示例**:

- `400 Bad Request`: 参数错误
  ```json
  {
    "error": "模块名不能为空"
  }
  ```
  ```json
  {
    "error": "模块名已存在"
  }
  ```

- `404 Not Found`: 模块不存在
  ```json
  {
    "error": "模块不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 4. 删除模块

**接口**: `DELETE /api/modules/:id`

**描述**: 删除指定模块

**权限**: 仅管理员

**URL参数**:
- `id`: 模块ID (number)

**无请求体**

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "模块删除成功"
}
```

**错误响应示例**:

- `400 Bad Request`: 模块正在使用中
  ```json
  {
    "error": "该模块下还有固件，无法删除"
  }
  ```

- `404 Not Found`: 模块不存在
  ```json
  {
    "error": "模块不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

## 🗂️ 项目管理接口

Base URL: `/api/projects`

### 1. 获取所有项目

**接口**: `GET /api/projects`

**描述**: 获取所有项目列表

**权限**: 需要登录

**无请求体**

**成功响应数据结构** (200):
```typescript
Array<{
  id: number,              // 项目ID
  name: string,            // 项目名称
  description: string,     // 项目描述
  created_by: number,      // 创建者ID
  created_at: string       // 创建时间 (YYYY-MM-DD HH:mm:ss)
}>
```

**成功响应示例**:
```json
[
  {
    "id": 1,
    "name": "Smart Home Hub",
    "description": "Central control unit for smart home",
    "created_by": 1,
    "created_at": "2025-09-14 10:00:00"
  },
  {
    "id": 2,
    "name": "IoT Sensor Node",
    "description": "Remote sensor monitoring device",
    "created_by": 1,
    "created_at": "2025-09-15 11:30:00"
  }
]
```

**错误响应**:

- `500 Internal Server Error`: 数据库错误

---

### 2. 创建项目

**接口**: `POST /api/projects`

**描述**: 创建新项目

**权限**: 仅管理员

**请求体数据结构**:
```typescript
{
  name: string,            // 必填，项目名称（唯一，1-100个字符）
  description?: string     // 可选，项目描述
}
```

**请求示例**:
```json
{
  "name": "Wearable Device",
  "description": "Smart wearable technology"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string,         // 成功消息
  projectId: number        // 新创建的项目ID
}
```

**成功响应示例**:
```json
{
  "message": "项目创建成功",
  "projectId": 3
}
```

**错误响应示例**:

- `400 Bad Request`: 参数错误
  ```json
  {
    "error": "项目名不能为空"
  }
  ```
  ```json
  {
    "error": "项目名称长度应在1-100个字符之间"
  }
  ```
  ```json
  {
    "error": "项目名已存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 3. 更新项目

**接口**: `PUT /api/projects/:id`

**描述**: 更新指定项目信息

**权限**: 仅管理员

**URL参数**:
- `id`: 项目ID (number)

**请求体数据结构**:
```typescript
{
  name: string,            // 必填，项目名称
  description?: string     // 可选，项目描述
}
```

**请求示例**:
```json
{
  "name": "Smart Home Hub V2",
  "description": "Enhanced central control unit for smart home"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "项目更新成功"
}
```

**错误响应示例**:

- `400 Bad Request`: 参数错误
- `404 Not Found`: 项目不存在
- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 4. 删除项目

**接口**: `DELETE /api/projects/:id`

**描述**: 删除指定项目

**权限**: 仅管理员

**URL参数**:
- `id`: 项目ID (number)

**无请求体**

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "项目删除成功"
}
```

**错误响应示例**:

- `400 Bad Request`: 项目正在使用中
  ```json
  {
    "error": "该项目下还有固件，无法删除"
  }
  ```

- `404 Not Found`: 项目不存在
- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

## 💾 固件管理接口

Base URL: `/api/firmwares`

### 1. 获取固件列表

**接口**: `GET /api/firmwares`

**描述**: 获取固件列表，支持分页和多条件筛选

**权限**: 需要登录

**查询参数数据结构**:
```typescript
{
  page?: number,            // 可选，页码，默认1
  pageSize?: number,        // 可选，每页数量，默认8
  module_id?: number,       // 可选，模块ID
  project_id?: number,      // 可选，项目ID
  status?: string,          // 可选，状态，支持多个用逗号分隔
  uploaded_by?: string,     // 可选，上传者用户名
  assigned_to?: string,     // 可选，测试者用户名
  released_by?: string,     // 可选，发布者用户名
  search?: string           // 可选，搜索关键词（在描述中查找）
}
```

**状态值说明**:
- `待委派`: 待委派
- `待发布`: 已委派/待发布
- `已发布`: 已发布
- `已驳回`: 已驳回

**请求示例**:
```
GET /api/firmwares?page=1&pageSize=6&status=待委派,已驳回&module_id=2&search=修复
```

**成功响应数据结构** (200):

根据固件状态返回不同的字段：

**待委派固件** (status = "待委派"):
```typescript
{
  data: Array<{
    id: number,                    // 固件ID
    module_id: number,             // 模块ID
    project_id: number,            // 项目ID
    version_name: string,          // 版本号 (vX.Y.Z) [别名 version]
    description: string,           // 固件描述
    additional_info: string,       // 附加信息
    file_path: string,             // 文件路径
    file_size: number,             // 文件大小（字节）
    md5: string,                   // MD5校验值
    uploaded_by: number,           // 上传者ID
    status: "待委派",              // 状态
    uploaded_at: string,           // 上传时间 [别名 created_at]
    updated_at: string,            // 更新时间
    module_name: string,           // 模块名称（关联查询）
    project_name: string,          // 项目名称（关联查询）
    uploader_name: string          // 上传者用户名（关联查询）
  }>,
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  }
}
```

**待发布固件** (status = "待发布"):
```typescript
{
  data: Array<{
    id: number,                    // 固件ID
    module_id: number,             // 模块ID
    project_id: number,            // 项目ID
    version_name: string,          // 版本号
    description: string,           // 固件描述
    additional_info: string,       // 附加信息
    file_path: string,             // 文件路径
    file_size: number,             // 文件大小（字节）
    md5: string,                   // MD5校验值
    uploaded_by: number,           // 上传者ID
    status: "待发布",              // 状态
    assigned_to: number,           // 委派给的测试人员ID
    assign_note: string,           // 委派说明
    test_report_path: string | null, // 测试报告路径
    uploaded_at: string,           // 上传时间
    updated_at: string,            // 更新时间
    module_name: string,           // 模块名称
    project_name: string,          // 项目名称
    uploader_name: string,         // 上传者用户名
    tester_name: string            // 测试者用户名（关联查询）
  }>,
  pagination: { ... }
}
```

**已发布固件** (status = "已发布"):
```typescript
{
  data: Array<{
    id: number,                    // 固件ID
    module_id: number,             // 模块ID
    project_id: number,            // 项目ID
    version_name: string,          // 版本号
    description: string,           // 固件描述
    additional_info: string,       // 附加信息
    file_path: string,             // 文件路径
    file_size: number,             // 文件大小（字节）
    md5: string,                   // MD5校验值
    uploaded_by: number,           // 上传者ID
    status: "已发布",              // 状态
    assigned_to: number,           // 测试者ID
    test_notes: string,            // 测后说明
    test_report_path: string | null, // 测试报告路径
    released_by: number,           // 发布者ID
    released_at: string,           // 发布时间
    uploaded_at: string,           // 上传时间
    updated_at: string,            // 更新时间
    module_name: string,           // 模块名称
    project_name: string,          // 项目名称
    uploader_name: string,         // 上传者用户名
    tester_name: string            // 测试者用户名
  }>,
  pagination: { ... }
}
```

**已驳回固件** (status = "已驳回"):
```typescript
{
  data: Array<{
    id: number,                    // 固件ID
    module_id: number,             // 模块ID
    project_id: number,            // 项目ID
    version_name: string,          // 版本号
    description: string,           // 固件描述
    additional_info: string,       // 附加信息
    file_path: string,             // 文件路径
    file_size: number,             // 文件大小（字节）
    md5: string,                   // MD5校验值
    uploaded_by: number,           // 上传者ID
    status: "已驳回",              // 状态
    assigned_to: number,           // 测试者ID
    reject_reason: string,         // 驳回原因
    test_report_path: string | null, // 测试报告路径
    uploaded_at: string,           // 上传时间
    updated_at: string,            // 更新时间
    module_name: string,           // 模块名称
    project_name: string,          // 项目名称
    uploader_name: string,         // 上传者用户名
    tester_name: string            // 测试者用户名
  }>,
  pagination: { ... }
}
```
  }>,
  pagination: {
    page: number,                  // 当前页码
    pageSize: number,              // 每页数量
    total: number,                 // 总记录数
    totalPages: number             // 总页数
  }
}
```

**成功响应示例 (待委派固件)**:
```json
{
  "data": [
    {
      "id": 1,
      "module_id": 2,
      "project_id": 3,
      "version_name": "v1.2.3",
      "description": "修复了连接稳定性问题",
      "additional_info": "增加了错误重试机制",
      "file_path": "/uploads/firmwares/firmware-1762681863254-868607222/app.bin",
      "file_size": 1048576,
      "md5": "5d41402abc4b2a76b9719d911017c592",
      "uploaded_by": 5,
      "status": "待委派",
      "uploaded_at": "2025-11-10 10:30:00",
      "updated_at": "2025-11-10 10:30:00",
      "module_name": "WiFi Module",
      "project_name": "Smart Home Hub",
      "uploader_name": "developer1"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 6,
    "total": 25,
    "totalPages": 5
  }
}
```

**错误响应**:

- `500 Internal Server Error`: 数据库错误

---

### 2. 上传固件

**接口**: `POST /api/firmwares/upload`

**描述**: 上传新固件文件

**权限**: 开发者及以上权限

**请求头**:
```http
Content-Type: multipart/form-data
```

**表单字段数据结构**:
```typescript
{
  firmware: File,          // 必填，固件文件
  module_id: number,       // 必填，模块ID
  project_id: number,      // 必填，项目ID
  version: string,         // 必填，版本号，格式：vX.Y.Z (如 v1.5.1)
  description?: string,    // 可选，固件描述
  additional_info?: string // 可选，附加信息
}
```

**版本号格式**: `v主版本.次版本.修订版本`
- 示例: `v1.0.0`, `v2.3.5`, `v1.15.23`

**成功响应数据结构** (200):
```typescript
{
  message: string,         // 成功消息
  firmwareId: number,      // 新创建的固件ID
  md5: string              // 文件MD5校验值
}
```

**成功响应示例**:
```json
{
  "message": "固件上传成功",
  "firmwareId": 1,
  "md5": "5d41402abc4b2a76b9719d911017c592"
}
```

**错误响应示例**:

- `400 Bad Request`: 参数错误
  ```json
  {
    "error": "模块、项目和版本号不能为空"
  }
  ```
  ```json
  {
    "error": "版本号格式不正确，应为 v主版本.次版本.修订版本，例如 v1.5.1"
  }
  ```
  ```json
  {
    "error": "固件文件不能为空"
  }
  ```
  ```json
  {
    "error": "模块不存在"
  }
  ```
  ```json
  {
    "error": "项目不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误或MD5计算失败

---

### 3. 下载固件

**接口**: `GET /api/firmwares/:id/download`

**描述**: 下载固件文件

**权限**: 需要登录

**URL参数**:
- `id`: 固件ID (number)

**成功响应** (200):
- Content-Type: `application/octet-stream`
- Content-Disposition: `attachment; filename="原始文件名"`
- Body: 文件二进制流

**错误响应示例**:

- `404 Not Found`: 固件不存在或文件不存在
  ```json
  {
    "error": "固件不存在"
  }
  ```
  ```json
  {
    "error": "固件文件不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `500 Internal Server Error`: 数据库错误

---

### 4. 更新固件状态

**接口**: `PUT /api/firmwares/:id/status`

**描述**: 更新固件状态

**权限**: 测试人员及以上权限

**URL参数**:
- `id`: 固件ID (number)

**请求体数据结构**:
```typescript
{
  status: string,          // 必填，新状态 (待发布/已发布/已驳回)
  test_notes?: string,     // 可选，测后说明（当status为已发布时）
  release_notes?: string,  // 可选，测后说明的别名（当status为已发布时）
  reject_reason?: string   // 可选，驳回原因（当status为已驳回时）
}
```

**请求示例 - 发布固件**:
```json
{
  "status": "已发布",
  "test_notes": "测试通过，所有功能正常"
}
```

**请求示例 - 驳回固件**:
```json
{
  "status": "已驳回",
  "reject_reason": "测试未通过，存在严重bug"
}
```

**状态转换逻辑**:
- `已发布`: 记录发布者和发布时间，保存测后说明
- `已驳回`: 保持assigned_to值（不清除），保存驳回原因

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "固件状态更新成功"
}
```

**错误响应示例**:

- `400 Bad Request`: 状态不合法
  ```json
  {
    "error": "状态不合法"
  }
  ```

- `404 Not Found`: 固件不存在
  ```json
  {
    "error": "固件不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 5. 委派固件

**接口**: `POST /api/firmwares/:id/assign`

**描述**: 将固件委派给测试人员

**权限**: 开发者及以上权限

**URL参数**:
- `id`: 固件ID (number)

**请求体数据结构**:
```typescript
{
  assigned_to: number,     // 必填，测试人员用户ID
  assign_note?: string     // 可选，委派说明
}
```

**请求示例**:
```json
{
  "assigned_to": 3,
  "assign_note": "请重点测试网络连接稳定性"
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string,         // 成功消息
  assigned_to: string      // 测试人员用户名
}
```

**成功响应示例**:
```json
{
  "message": "固件委派成功",
  "assigned_to": "tester1"
}
```

**错误响应示例**:

- `400 Bad Request`: 参数错误
  ```json
  {
    "error": "测试人员ID不能为空"
  }
  ```
  ```json
  {
    "error": "只能委派给测试人员"
  }
  ```

- `404 Not Found`: 测试人员或固件不存在
  ```json
  {
    "error": "测试人员不存在"
  }
  ```
  ```json
  {
    "error": "固件不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 6. 上传测试报告

**接口**: `POST /api/firmwares/:id/test-report`

**描述**: 上传固件测试报告

**权限**: 测试人员及以上权限

**URL参数**:
- `id`: 固件ID (number)

**请求头**:
```http
Content-Type: multipart/form-data
```

**表单字段数据结构**:
```typescript
{
  test_report: File        // 必填，测试报告文件
}
```

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "测试报告上传成功"
}
```

**错误响应示例**:

- `400 Bad Request`: 文件为空
  ```json
  {
    "error": "测试报告文件不能为空"
  }
  ```

- `404 Not Found`: 固件不存在
  ```json
  {
    "error": "固件不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `403 Forbidden`: 权限不足
- `500 Internal Server Error`: 数据库错误

---

### 7. 下载测试报告

**接口**: `GET /api/firmwares/:id/download-test-report`

**描述**: 下载固件测试报告

**权限**: 需要登录

**URL参数**:
- `id`: 固件ID (number)

**成功响应** (200):
- Content-Type: `application/octet-stream`
- Content-Disposition: `attachment; filename="原始文件名"`
- Body: 文件二进制流

**错误响应示例**:

- `404 Not Found`: 测试报告不存在或文件不存在
  ```json
  {
    "error": "测试报告不存在"
  }
  ```
  ```json
  {
    "error": "测试报告文件不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `500 Internal Server Error`: 数据库错误

---

### 8. 删除固件

**接口**: `DELETE /api/firmwares/:id`

**描述**: 删除固件及其相关文件

**权限**: 
- 管理员：可删除任何固件
- 开发者：只能删除自己上传的、非已发布状态的固件

**URL参数**:
- `id`: 固件ID (number)

**无请求体**

**成功响应数据结构** (200):
```typescript
{
  message: string          // 成功消息
}
```

**成功响应示例**:
```json
{
  "message": "固件删除成功"
}
```

**错误响应数据结构**:
```typescript
{
  error: string,           // 错误描述
  detail?: string          // 可选，详细信息
}
```

**错误响应示例**:

- `403 Forbidden`: 权限不足
  ```json
  {
    "error": "没有权限删除此固件"
  }
  ```
  ```json
  {
    "error": "不能删除已发布的固件",
    "detail": "当前状态: 已发布"
  }
  ```
  ```json
  {
    "error": "没有权限删除固件"
  }
  ```

- `404 Not Found`: 固件不存在
  ```json
  {
    "error": "固件不存在"
  }
  ```

- `401 Unauthorized`: 未登录
- `500 Internal Server Error`: 数据库错误

---

## 📝 通用说明

### 认证方式

系统使用基于 Session 的认证机制：
- 登录成功后，服务器创建 Session 并设置 Cookie (`connect.sid`)
- 后续请求需携带该 Cookie
- Session 有效期由服务器配置决定

### 权限角色

系统定义了以下角色及其权限：

| 角色 | 权限说明 |
|------|----------|
| **admin** | 管理员，拥有所有权限 |
| **developer** | 开发者，可上传固件、委派固件、删除自己的固件 |
| **tester** | 测试人员，可测试固件、上传测试报告、更新固件状态 |
| **user** | 普通用户，只能查看和下载 |

### 统一错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 日期时间格式

所有日期时间字段使用格式: `YYYY-MM-DD HH:mm:ss`

示例: `2025-11-10 10:30:00`

### 文件上传限制

- 固件文件最大大小: 由 `config.upload.firmwareMaxSize` 配置
- 测试报告最大大小: 由 `config.upload.testReportMaxSize` 配置
- 支持的上传格式: `multipart/form-data`

### 固件工作流程

```
上传 (待委派) 
    ↓
委派 (待发布) 
    ↓
发布 (已发布) / 驳回 (已驳回)
```

### 状态值映射

系统内部使用中文状态值：

| 状态显示 | 数据库值 | 说明 |
|---------|---------|------|
| 待委派 | 待委派 | 固件已上传，等待委派给测试人员 |
| 待发布 | 待发布 | 固件已委派，等待测试和发布 |
| 已发布 | 已发布 | 固件已通过测试并发布 |
| 已驳回 | 已驳回 | 固件测试未通过被驳回 |

### 分页查询说明

分页响应统一格式：
```json
{
  "data": [...],
  "pagination": {
    "page": 1,         // 当前页码
    "pageSize": 8,     // 每页数量
    "total": 25,       // 总记录数
    "totalPages": 5    // 总页数
  }
}
```

---

## 📞 联系方式

- **作者**: Aurson
- **邮箱**: jassimxiong@gmail.com
- **许可**: Apache-2.0

---

**版本**: 1.0.0  
**最后更新**: 2025-11-10

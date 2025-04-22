# 用户 API

本文档描述与用户管理相关的API接口，包括用户创建、查询、更新、删除、角色管理等功能。

## 基础路径

所有用户API的基础路径为: `/api/v1/users/`

## 接口列表

### 1. 获取当前用户信息

获取当前登录用户的详细信息。

- **URL**: `/api/v1/users/me/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 登录用户

#### 请求头

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "13812345678",
    "nick_name": "John",
    "first_name": "",
    "last_name": "",
    "is_active": true,
    "avatar": "",
    "tenant": 1,
    "tenant_name": "租户名称",
    "is_admin": false,
    "is_member": true,
    "is_super_admin": false,
    "role": "普通用户",
    "date_joined": "2025-04-22T10:00:00Z"
  }
}
```

### 2. 获取用户列表

获取系统中的用户列表，支持分页、排序和筛选。

- **URL**: `/api/v1/users/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员或租户管理员（租户管理员只能查看本租户的用户）

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| page | integer | 否 | 页码，默认为1 | 1 |
| page_size | integer | 否 | 每页记录数，默认为10 | 10 |
| search | string | 否 | 搜索关键词（用户名、邮箱、手机号） | "john" |
| ordering | string | 否 | 排序字段，前缀'-'表示降序 | "-date_joined" |
| is_admin | boolean | 否 | 筛选管理员用户 | true |
| is_active | boolean | 否 | 筛选活跃状态的用户 | true |
| tenant | integer | 否 | 筛选指定租户的用户 | 1 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 100,
    "next": "http://example.com/api/v1/users/?page=2",
    "previous": null,
    "results": [
      {
        "id": 123,
        "username": "john_doe",
        "nick_name": "John",
        "email": "john@example.com",
        "phone": "13812345678",
        "is_active": true,
        "avatar": "",
        "tenant": 1,
        "tenant_name": "租户名称",
        "is_admin": false,
        "is_member": true,
        "role": "普通用户",
        "date_joined": "2025-04-22T10:00:00Z"
      },
      // 更多用户...
    ]
  }
}
```

### 3. 创建用户

创建新用户。

- **URL**: `/api/v1/users/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员或租户管理员（租户管理员只能在自己的租户下创建用户）

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| username | string | 是 | 用户名（在同一租户内唯一） | "jane_doe" |
| email | string | 是 | 电子邮箱（在同一租户内唯一） | "jane@example.com" |
| phone | string | 否 | 手机号（在同一租户内唯一） | "13987654321" |
| nick_name | string | 否 | 用户昵称 | "Jane" |
| first_name | string | 否 | 名字 | "Jane" |
| last_name | string | 否 | 姓氏 | "Doe" |
| password | string | 是 | 密码（需满足密码强度要求） | "SecurePassword123!" |
| password_confirm | string | 是 | 确认密码（需与密码一致） | "SecurePassword123!" |
| tenant_id | integer | 否 | 租户ID | 1 |
| is_admin | boolean | 否 | 是否为管理员，默认false | false |
| is_member | boolean | 否 | 是否为普通成员，默认true | true |
| avatar | string | 否 | 头像URL | "" |

#### 请求示例

```json
{
  "username": "jane_doe",
  "email": "jane@example.com",
  "phone": "13987654321",
  "nick_name": "Jane",
  "first_name": "Jane",
  "last_name": "Doe",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!",
  "tenant_id": 1,
  "is_admin": false,
  "is_member": true,
  "avatar": ""
}
```

#### 成功响应 (201 Created)

```json
{
  "success": true,
  "code": 2000,
  "message": "创建成功",
  "data": {
    "id": 124,
    "username": "jane_doe",
    "email": "jane@example.com",
    "phone": "13987654321",
    "nick_name": "Jane",
    "first_name": "Jane",
    "last_name": "Doe",
    "is_active": true,
    "avatar": "",
    "tenant": 1,
    "tenant_name": "租户名称",
    "is_admin": false,
    "is_member": true,
    "is_super_admin": false,
    "role": "普通用户",
    "date_joined": "2025-04-22T11:00:00Z"
  }
}
```

#### 错误响应 (400 Bad Request)

```json
{
  "success": false,
  "code": 4000,
  "message": "创建失败",
  "data": {
    "username": ["该租户下此用户名已被使用"],
    "email": ["该租户下此邮箱已被注册"],
    "phone": ["该租户下此手机号已被注册"],
    "password": ["密码过于简单"],
    "password_confirm": ["两次输入的密码不一致"],
    "tenant_id": ["无效的租户ID"]
  }
}
```

### 4. 获取用户详情

获取指定用户的详细信息。

- **URL**: `/api/v1/users/{id}/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以查看任何用户
  - 租户管理员可以查看本租户的任何用户
  - 普通用户只能查看自己的信息

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 用户ID | 123 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "13812345678",
    "nick_name": "John",
    "first_name": "",
    "last_name": "",
    "is_active": true,
    "avatar": "",
    "tenant": 1,
    "tenant_name": "租户名称",
    "is_admin": false,
    "is_member": true,
    "is_super_admin": false,
    "role": "普通用户",
    "date_joined": "2025-04-22T10:00:00Z"
  }
}
```

#### 错误响应 (404 Not Found)

```json
{
  "success": false,
  "code": 4004,
  "message": "用户不存在",
  "data": null
}
```

### 5. 更新用户信息

更新指定用户的信息。

- **URL**: `/api/v1/users/{id}/`
- **方法**: `PUT` 或 `PATCH`（部分更新）
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以更新任何用户
  - 租户管理员可以更新本租户的任何用户
  - 普通用户只能更新自己的信息（有限字段）

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 用户ID | 123 |

#### 请求参数（可以部分提供）

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| phone | string | 否 | 手机号 | "13812345678" |
| nick_name | string | 否 | 用户昵称 | "Johnny" |
| first_name | string | 否 | 名字 | "John" |
| last_name | string | 否 | 姓氏 | "Doe" |
| avatar | string | 否 | 头像URL | "" |
| is_active | boolean | 否 | 是否激活 | true |
| status | string | 否 | 状态 (active/suspended/inactive) | "active" |

#### 请求示例 (PATCH)

```json
{
  "nick_name": "Johnny",
  "phone": "13812345678"
}
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "更新成功",
  "data": {
    "id": 123,
    "phone": "13812345678",
    "nick_name": "Johnny",
    "first_name": "",
    "last_name": "",
    "avatar": "",
    "is_active": true,
    "status": "active"
  }
}
```

### 6. 删除用户

删除（软删除）指定用户。

- **URL**: `/api/v1/users/{id}/`
- **方法**: `DELETE`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以删除任何用户（除了自己）
  - 租户管理员可以删除本租户的普通用户
  - 普通用户不能删除任何用户

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 用户ID | 123 |

#### 成功响应 (204 No Content)

```json
{
  "success": true,
  "code": 2000,
  "message": "删除成功",
  "data": null
}
```

#### 错误响应 (403 Forbidden)

```json
{
  "success": false,
  "code": 4003,
  "message": "无权限执行此操作",
  "data": null
}
```

### 7. 修改密码

修改当前用户的密码。

- **URL**: `/api/v1/users/change-password/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 登录用户

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| old_password | string | 是 | 旧密码 | "OldPassword123!" |
| new_password | string | 是 | 新密码 | "NewPassword123!" |
| new_password_confirm | string | 是 | 确认新密码 | "NewPassword123!" |

#### 请求示例

```json
{
  "old_password": "OldPassword123!",
  "new_password": "NewPassword123!",
  "new_password_confirm": "NewPassword123!"
}
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "密码修改成功",
  "data": null
}
```

#### 错误响应 (400 Bad Request)

```json
{
  "success": false,
  "code": 4000,
  "message": "密码修改失败",
  "data": {
    "old_password": ["旧密码不正确"],
    "new_password": ["密码过于简单"],
    "new_password_confirm": ["两次输入的新密码不一致"]
  }
}
```

### 8. 更新用户角色

更新指定用户的角色。

- **URL**: `/api/v1/users/{id}/change-role/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以更新任何用户的角色
  - 租户管理员可以更新本租户普通用户的角色
  - 普通用户不能更新任何用户的角色

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 用户ID | 123 |

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| is_admin | boolean | 是 | 是否为管理员 | true |

#### 请求示例

```json
{
  "is_admin": true
}
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "角色更新成功",
  "data": {
    "id": 123,
    "is_admin": true,
    "is_member": true
  }
}
```

#### 错误响应 (400 Bad Request)

```json
{
  "success": false,
  "code": 4000,
  "message": "角色更新失败",
  "data": {
    "is_admin": ["租户管理员配额已满"]
  }
}
```

### 9. 创建超级管理员

创建新的超级管理员用户。

- **URL**: `/api/v1/users/super-admin/create/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| username | string | 是 | 用户名 | "admin" |
| email | string | 是 | 电子邮箱 | "admin@example.com" |
| phone | string | 否 | 手机号 | "13900000000" |
| nick_name | string | 否 | 用户昵称 | "管理员" |
| first_name | string | 否 | 名字 | "" |
| last_name | string | 否 | 姓氏 | "" |
| password | string | 是 | 密码 | "AdminPassword123!" |
| password_confirm | string | 是 | 确认密码 | "AdminPassword123!" |
| avatar | string | 否 | 头像URL | "" |

#### 请求示例

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "phone": "13900000000",
  "nick_name": "管理员",
  "password": "AdminPassword123!",
  "password_confirm": "AdminPassword123!"
}
```

#### 成功响应 (201 Created)

```json
{
  "success": true,
  "code": 2000,
  "message": "创建成功",
  "data": {
    "id": 125,
    "username": "admin",
    "email": "admin@example.com",
    "phone": "13900000000",
    "nick_name": "管理员",
    "first_name": "",
    "last_name": "",
    "is_active": true,
    "avatar": "",
    "tenant": null,
    "tenant_name": null,
    "is_admin": true,
    "is_member": false,
    "is_super_admin": true,
    "role": "超级管理员",
    "date_joined": "2025-04-22T12:00:00Z"
  }
}
```

### 10. 授予超级管理员权限

将普通用户或租户管理员提升为超级管理员。

- **URL**: `/api/v1/users/{id}/grant-super-admin/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 用户ID | 123 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "授予超级管理员权限成功",
  "data": {
    "id": 123,
    "is_admin": true,
    "is_super_admin": true,
    "tenant": null
  }
}
```

### 11. 撤销超级管理员权限

将超级管理员降级为普通用户。

- **URL**: `/api/v1/users/{id}/revoke-super-admin/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 用户ID | 125 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "撤销超级管理员权限成功",
  "data": {
    "id": 125,
    "is_admin": false,
    "is_super_admin": false,
    "is_member": true
  }
}
```

### 12. 获取租户用户列表

获取指定租户的用户列表。

- **URL**: `/api/v1/users/tenant/{tenant_id}/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以查看任何租户的用户
  - 租户管理员可以查看自己租户的用户
  - 普通用户不能访问此接口

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| tenant_id | integer | 租户ID | 1 |

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| page | integer | 否 | 页码，默认为1 | 1 |
| page_size | integer | 否 | 每页记录数，默认为10 | 10 |
| search | string | 否 | 搜索关键词（用户名、邮箱、手机号） | "john" |
| ordering | string | 否 | 排序字段，前缀'-'表示降序 | "-date_joined" |
| is_admin | boolean | 否 | 筛选管理员用户 | true |
| is_active | boolean | 否 | 筛选活跃状态的用户 | true |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 50,
    "next": "http://example.com/api/v1/users/tenant/1/?page=2",
    "previous": null,
    "results": [
      {
        "id": 123,
        "username": "john_doe",
        "nick_name": "John",
        "email": "john@example.com",
        "phone": "13812345678",
        "is_active": true,
        "avatar": "",
        "tenant": 1,
        "tenant_name": "租户名称",
        "is_admin": false,
        "is_member": true,
        "role": "普通用户",
        "date_joined": "2025-04-22T10:00:00Z"
      },
      // 更多用户...
    ]
  }
}
```

## 用户状态说明

用户状态包括以下几种：

- `active`: 活跃状态，用户可以正常登录和使用系统
- `suspended`: 暂停状态，用户无法登录，但数据保留
- `inactive`: 未激活状态，通常用于新注册但未确认的用户或被软删除的用户

## 用户角色说明

用户角色包括以下几种：

- 超级管理员（`is_super_admin=true`）: 可以管理所有租户和用户，拥有系统最高权限
- 租户管理员（`is_admin=true, is_super_admin=false`）: 可以管理自己租户内的用户和资源
- 普通用户（`is_member=true, is_admin=false`）: 只能管理自己的账户信息，访问有限的资源 
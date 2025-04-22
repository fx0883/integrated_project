# 多租户系统 API 文档

## 概述

本文档详细描述了多租户系统的 API 接口，供前端开发人员使用。系统采用 RESTful API 设计风格，并使用 JWT 进行身份验证。

## 目录

- [通用信息](#通用信息)
  - [Base URL](#base-url)
  - [认证方式](#认证方式)
  - [请求格式](#请求格式)
  - [响应格式](#响应格式)
  - [错误处理](#错误处理)
  - [分页](#分页)
- [认证 API](#认证-api)
  - [用户注册](#用户注册)
  - [用户登录](#用户登录)
  - [刷新 Token](#刷新-token)
  - [验证 Token](#验证-token)
- [用户管理 API](#用户管理-api)
  - [获取当前用户信息](#获取当前用户信息)
  - [用户列表](#用户列表)
  - [创建用户](#创建用户)
  - [获取用户详情](#获取用户详情)
  - [更新用户](#更新用户)
  - [删除用户](#删除用户)
  - [修改密码](#修改密码)
  - [创建超级管理员](#创建超级管理员)
  - [授予超级管理员权限](#授予超级管理员权限)
  - [撤销超级管理员权限](#撤销超级管理员权限)
  - [更新用户角色](#更新用户角色)
- [租户管理 API](#租户管理-api)
  - [租户列表](#租户列表)
  - [创建租户](#创建租户)
  - [获取租户详情](#获取租户详情)
  - [更新租户](#更新租户)
  - [删除租户](#删除租户)
  - [更新租户配额](#更新租户配额)
  - [获取租户配额使用情况](#获取租户配额使用情况)
  - [暂停租户](#暂停租户)
  - [激活租户](#激活租户)
  - [获取租户用户列表](#获取租户用户列表)

## 通用信息

### Base URL

```
https://api.example.com/api/v1/
```

### 认证方式

本 API 使用 JWT（JSON Web Token）进行身份验证。除了注册和登录接口外，所有的 API 请求都需要在 HTTP 头部包含 `Authorization` 字段：

```
Authorization: Bearer <access_token>
```

其中 `<access_token>` 是用户登录后获取的访问令牌。

### 请求格式

所有 POST、PUT、PATCH 请求的内容类型应为 `application/json`。

### 响应格式

所有 API 的响应均为 JSON 格式，包含以下字段：

- 成功响应：返回相应的数据对象
- 错误响应：包含错误信息，如 `{"detail": "错误信息"}` 或 `{"field_name": ["字段错误信息"]}`

### 错误处理

API 使用标准的 HTTP 状态码来表示请求结果：

- `200 OK`：请求成功
- `201 Created`：资源创建成功
- `204 No Content`：删除成功
- `400 Bad Request`：请求参数错误
- `401 Unauthorized`：认证失败
- `403 Forbidden`：权限不足
- `404 Not Found`：资源不存在
- `500 Internal Server Error`：服务器内部错误

### 分页

列表接口支持分页，可通过以下参数控制：

- `page`：页码，默认为1
- `page_size`：每页记录数，默认为10

分页响应格式为：

```json
{
  "count": 100,               // 总记录数
  "next": "URL to next page", // 下一页URL，如果没有则为null
  "previous": null,           // 上一页URL，如果没有则为null
  "results": []               // 当前页的数据记录
}
```

## 认证 API

### 用户注册

**接口**：`POST /auth/register/`

**权限**：无需认证

**请求参数**：

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138000",
  "nick_name": "John",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "tenant_id": 1  // 可选，指定要加入的租户
}
```

**响应**：

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138000",
  "nick_name": "John",
  "tenant": 1,
  "tenant_name": "Acme Inc",
  "role": "普通用户",
  "token": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### 用户登录

**接口**：`POST /auth/login/`

**权限**：无需认证

**请求参数**：

```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**响应**：

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138000",
  "nick_name": "John",
  "tenant": 1,
  "tenant_name": "Acme Inc",
  "is_admin": false,
  "is_super_admin": false,
  "role": "普通用户",
  "token": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### 刷新 Token

**接口**：`POST /auth/token/refresh/`

**权限**：无需认证

**请求参数**：

```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**响应**：

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 验证 Token

**接口**：`POST /auth/token/verify/`

**权限**：无需认证

**请求参数**：

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**响应**：
- 如果 token 有效，返回 `200 OK` 和空 JSON 对象 `{}`
- 如果 token 无效，返回 `401 Unauthorized`

## 用户管理 API

### 获取当前用户信息

**接口**：`GET /users/current/`

**权限**：需要认证

**响应**：

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138000",
  "nick_name": "John",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "avatar": "https://example.com/avatar.jpg",
  "tenant": 1,
  "tenant_name": "Acme Inc",
  "is_admin": false,
  "is_member": true,
  "is_super_admin": false,
  "role": "普通用户",
  "date_joined": "2023-01-01T12:00:00Z"
}
```

### 用户列表

**接口**：`GET /users/`

**权限**：需要管理员权限

**查询参数**：
- `search`：搜索关键词（用户名、邮箱、昵称、手机号）
- `status`：用户状态
- `is_admin`：是否为管理员（true/false）
- `page`：页码
- `page_size`：每页记录数

**响应**：

```json
{
  "count": 10,
  "next": "http://api.example.com/api/v1/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "phone": "13800138000",
      "nick_name": "John",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "avatar": "https://example.com/avatar.jpg",
      "tenant": 1,
      "tenant_name": "Acme Inc",
      "is_admin": false,
      "is_member": true,
      "is_super_admin": false,
      "role": "普通用户",
      "date_joined": "2023-01-01T12:00:00Z"
    },
    // ... 更多用户
  ]
}
```

### 创建用户

**接口**：`POST /users/`

**权限**：需要管理员权限

**请求参数**：

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138000",
  "nick_name": "John",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "tenant_id": 1,  // 超级管理员可指定租户，普通管理员会自动设置为自己的租户
  "is_admin": false,  // 是否设置为管理员
  "is_member": true,  // 是否设置为成员
  "avatar": "https://example.com/avatar.jpg"  // 可选
}
```

**响应**：

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138000",
  "nick_name": "John",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "avatar": "https://example.com/avatar.jpg",
  "tenant": 1,
  "tenant_name": "Acme Inc",
  "is_admin": false,
  "is_member": true,
  "is_super_admin": false,
  "role": "普通用户",
  "date_joined": "2023-01-01T12:00:00Z"
}
```

### 获取用户详情

**接口**：`GET /users/{id}/`

**权限**：
- 超级管理员可以获取任何用户的详情
- 租户管理员只能获取同一租户下用户的详情
- 普通用户只能获取自己的详情

**响应**：

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138000",
  "nick_name": "John",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "avatar": "https://example.com/avatar.jpg",
  "tenant": 1,
  "tenant_name": "Acme Inc",
  "is_admin": false,
  "is_member": true,
  "is_super_admin": false,
  "role": "普通用户",
  "date_joined": "2023-01-01T12:00:00Z"
}
```

### 更新用户

**接口**：`PUT/PATCH /users/{id}/`

**权限**：
- 超级管理员可以更新任何用户
- 租户管理员只能更新同一租户下的用户
- 普通用户只能更新自己的信息

**请求参数**：

```json
{
  "phone": "13800138001",  // 可选
  "nick_name": "Johnny",  // 可选
  "first_name": "Johnny",  // 可选
  "last_name": "Doe",  // 可选
  "avatar": "https://example.com/new_avatar.jpg",  // 可选
  "is_active": true  // 可选
}
```

**响应**：

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "13800138001",
  "nick_name": "Johnny",
  "first_name": "Johnny",
  "last_name": "Doe",
  "is_active": true,
  "avatar": "https://example.com/new_avatar.jpg",
  "tenant": 1,
  "tenant_name": "Acme Inc",
  "is_admin": false,
  "is_member": true,
  "is_super_admin": false,
  "role": "普通用户",
  "date_joined": "2023-01-01T12:00:00Z"
}
```

### 删除用户

**接口**：`DELETE /users/{id}/`

**权限**：
- 超级管理员可以删除任何用户（除了自己）
- 租户管理员只能删除同一租户下的普通用户
- 普通用户不能删除任何用户，包括自己

**响应**：
- 成功：`204 No Content`

### 修改密码

**接口**：`PUT /users/change-password/`

**权限**：需要认证（只能修改自己的密码）

**请求参数**：

```json
{
  "old_password": "securepassword123",
  "new_password": "newsecurepassword123",
  "new_password_confirm": "newsecurepassword123"
}
```

**响应**：

```json
{
  "detail": "密码修改成功"
}
```

### 创建超级管理员

**接口**：`POST /users/super-admin/`

**权限**：需要超级管理员权限

**请求参数**：

```json
{
  "username": "superadmin",
  "email": "super@example.com",
  "phone": "13900139000",
  "nick_name": "Super",
  "first_name": "Super",
  "last_name": "Admin",
  "password": "supersecurepassword123",
  "password_confirm": "supersecurepassword123",
  "avatar": "https://example.com/super_avatar.jpg"  // 可选
}
```

**响应**：

```json
{
  "id": 2,
  "username": "superadmin",
  "email": "super@example.com",
  "phone": "13900139000",
  "nick_name": "Super",
  "first_name": "Super",
  "last_name": "Admin",
  "is_active": true,
  "avatar": "https://example.com/super_avatar.jpg",
  "tenant": null,
  "tenant_name": null,
  "is_admin": true,
  "is_member": true,
  "is_super_admin": true,
  "role": "超级管理员",
  "date_joined": "2023-01-01T12:00:00Z"
}
```

### 授予超级管理员权限

**接口**：`POST /users/{id}/grant-super-admin/`

**权限**：需要超级管理员权限

**响应**：

```json
{
  "detail": "已将用户 johndoe 提升为超级管理员"
}
```

### 撤销超级管理员权限

**接口**：`POST /users/{id}/revoke-super-admin/`

**权限**：需要超级管理员权限

**响应**：

```json
{
  "detail": "已撤销用户 johndoe 的超级管理员权限"
}
```

### 更新用户角色

**接口**：`POST /users/{id}/role/`

**权限**：
- 超级管理员可以更新任何用户的角色
- 租户管理员只能更新同一租户下普通用户的角色

**请求参数**：

```json
{
  "is_admin": true,
  "is_member": true
}
```

**响应**：

```json
{
  "id": 1,
  "is_admin": true,
  "is_member": true
}
```

## 租户管理 API

### 租户列表

**接口**：`GET /tenants/`

**权限**：需要超级管理员权限

**查询参数**：
- `search`：搜索关键词（租户名称、联系人等）
- `status`：租户状态
- `page`：页码
- `page_size`：每页记录数

**响应**：

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Acme Inc",
      "status": "active",
      "contact_name": "John Smith",
      "contact_email": "john@acme.com",
      "contact_phone": "13800138000",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z"
    },
    // ... 更多租户
  ]
}
```

### 创建租户

**接口**：`POST /tenants/`

**权限**：需要超级管理员权限

**请求参数**：

```json
{
  "name": "New Tenant",
  "contact_name": "Jane Smith",
  "contact_email": "jane@newtenant.com",
  "contact_phone": "13900139000",
  "status": "active"  // active, suspended, pending
}
```

**响应**：

```json
{
  "id": 2,
  "name": "New Tenant",
  "status": "active",
  "contact_name": "Jane Smith",
  "contact_email": "jane@newtenant.com",
  "contact_phone": "13900139000",
  "created_at": "2023-01-01T13:00:00Z",
  "updated_at": "2023-01-01T13:00:00Z"
}
```

### 获取租户详情

**接口**：`GET /tenants/{id}/`

**权限**：需要超级管理员权限

**响应**：

```json
{
  "id": 1,
  "name": "Acme Inc",
  "status": "active",
  "contact_name": "John Smith",
  "contact_email": "john@acme.com",
  "contact_phone": "13800138000",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-01T12:00:00Z",
  "user_count": 10,
  "admin_count": 2
}
```

### 更新租户

**接口**：`PUT/PATCH /tenants/{id}/`

**权限**：需要超级管理员权限

**请求参数**：

```json
{
  "name": "Acme Corporation",  // 可选
  "contact_name": "John Smith Jr",  // 可选
  "contact_email": "john.jr@acme.com",  // 可选
  "contact_phone": "13800138001",  // 可选
  "status": "active"  // 可选
}
```

**响应**：

```json
{
  "id": 1,
  "name": "Acme Corporation",
  "status": "active",
  "contact_name": "John Smith Jr",
  "contact_email": "john.jr@acme.com",
  "contact_phone": "13800138001",
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-01T14:00:00Z"
}
```

### 删除租户

**接口**：`DELETE /tenants/{id}/`

**权限**：需要超级管理员权限

**响应**：
- 成功：`204 No Content`

### 更新租户配额

**接口**：`PUT /tenants/{id}/quota/`

**权限**：需要超级管理员权限

**请求参数**：

```json
{
  "max_users": 100,
  "max_admins": 5,
  "max_storage_mb": 1024,
  "max_products": 50
}
```

**响应**：

```json
{
  "id": 1,
  "tenant": 1,
  "tenant_name": "Acme Corporation",
  "max_users": 100,
  "max_admins": 5,
  "max_storage_mb": 1024,
  "max_products": 50,
  "current_storage_used_mb": 125,
  "created_at": "2023-01-01T12:00:00Z",
  "updated_at": "2023-01-01T15:00:00Z"
}
```

### 获取租户配额使用情况

**接口**：`GET /tenants/{id}/quota/usage/`

**权限**：
- 超级管理员可以获取任何租户的配额使用情况
- 租户管理员只能获取自己租户的配额使用情况

**响应**：

```json
{
  "tenant": 1,
  "tenant_name": "Acme Corporation",
  "max_users": 100,
  "max_admins": 5,
  "max_storage_mb": 1024,
  "max_products": 50,
  "current_storage_used_mb": 125,
  "usage_percentage": {
    "users": 10,    // 使用了10%
    "admins": 40,   // 使用了40%
    "storage": 12,  // 使用了12%
    "products": 30  // 使用了30%
  }
}
```

### 暂停租户

**接口**：`POST /tenants/{id}/suspend/`

**权限**：需要超级管理员权限

**响应**：

```json
{
  "detail": "租户已暂停",
  "tenant": {
    "id": 1,
    "name": "Acme Corporation",
    "status": "suspended",
    "contact_name": "John Smith Jr",
    "contact_email": "john.jr@acme.com",
    "contact_phone": "13800138001",
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-01T16:00:00Z"
  }
}
```

### 激活租户

**接口**：`POST /tenants/{id}/activate/`

**权限**：需要超级管理员权限

**响应**：

```json
{
  "detail": "租户已激活",
  "tenant": {
    "id": 1,
    "name": "Acme Corporation",
    "status": "active",
    "contact_name": "John Smith Jr",
    "contact_email": "john.jr@acme.com",
    "contact_phone": "13800138001",
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-01T17:00:00Z"
  }
}
```

### 获取租户用户列表

**接口**：`GET /tenants/{id}/users/`

**权限**：
- 超级管理员可以获取任何租户的用户列表
- 租户管理员只能获取自己租户的用户列表

**查询参数**：
- `search`：搜索关键词（用户名、邮箱、昵称、手机号）
- `status`：用户状态
- `is_admin`：是否为管理员（true/false）
- `page`：页码
- `page_size`：每页记录数

**响应**：

```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "johndoe",
      "nick_name": "John",
      "email": "john@example.com",
      "phone": "13800138000",
      "is_active": true,
      "avatar": "https://example.com/avatar.jpg",
      "tenant": 1,
      "tenant_name": "Acme Corporation",
      "is_admin": false,
      "is_member": true,
      "role": "普通用户",
      "date_joined": "2023-01-01T12:00:00Z"
    },
    // ... 更多用户
  ]
}
``` 
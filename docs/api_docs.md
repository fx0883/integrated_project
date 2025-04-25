# 多租户系统API文档

本文档详细描述了多租户系统的所有API接口，包括接口说明、请求参数、返回数据、调用权限以及示例数据。文档旨在为后端开发人员提供清晰的API实现指南。

## 目录

1. [用户管理API](#用户管理api)
   1. [获取当前用户信息](#获取当前用户信息)
   2. [更新当前用户信息](#更新当前用户信息)
   3. [获取用户列表](#获取用户列表)
   4. [搜索用户](#搜索用户)
   5. [创建用户](#创建用户)
   6. [获取用户详情](#获取用户详情)
   7. [更新用户信息](#更新用户信息)
   8. [删除用户](#删除用户)
   9. [修改密码](#修改密码)
   10. [创建超级管理员](#创建超级管理员)
   11. [授予超级管理员权限](#授予超级管理员权限)
   12. [撤销超级管理员权限](#撤销超级管理员权限)
   13. [更新用户角色](#更新用户角色)
   14. [获取租户用户列表](#获取租户用户列表)
   15. [创建子账号](#创建子账号)
   16. [上传用户头像](#上传用户头像)
2. [租户管理API](#租户管理api)
   1. [获取租户列表](#获取租户列表)
   2. [搜索租户](#搜索租户)
   3. [创建租户](#创建租户)
   4. [获取租户详情](#获取租户详情)
   5. [更新租户信息](#更新租户信息)
   6. [删除租户](#删除租户)
   7. [获取租户配额](#获取租户配额)
   8. [更新租户配额](#更新租户配额)
   9. [获取租户配额使用情况](#获取租户配额使用情况)
   10. [暂停租户](#暂停租户)
   11. [激活租户](#激活租户)
   12. [获取租户用户列表](#获取租户用户列表-1)

## 通用规范

### 请求格式

所有API请求需要包含以下头信息：

```
Content-Type: application/json
Authorization: Bearer {token}
```

### 响应格式

所有API响应遵循统一的标准格式：

```json
{
  "success": true/false,
  "code": 2000,
  "message": "操作成功/失败消息",
  "data": {
    // 响应数据
  }
}
```

### 状态码说明

| 状态码 | 说明 |
|-------|------|
| 2000 | 操作成功 |
| 4000 | 请求参数错误 |
| 4001 | 未授权 |
| 4003 | 权限不足 |
| 4004 | 资源不存在 |
| 5000 | 服务器内部错误 |

## 用户管理API

> **权限说明**：
> - 超级管理员可以管理所有租户下的所有用户
> - 租户管理员只能管理自己租户标识下的用户
> - 普通用户只能查看和管理自己的账号信息

### 获取当前用户信息

获取当前登录用户的详细信息。

- **URL**: `/api/v1/users/me/`
- **方法**: `GET`
- **权限要求**: 已登录用户

#### 返回参数

| 参数名 | 类型 | 说明 |
|-------|------|-----|
| id | Integer | 用户ID |
| username | String | 用户名 |
| email | String | 电子邮箱 |
| phone | String | 手机号码 |
| nick_name | String | 昵称 |
| first_name | String | 名 |
| last_name | String | 姓 |
| is_active | Boolean | 是否激活 |
| avatar | String | 头像URL |
| tenant | Integer | 所属租户ID |
| tenant_name | String | 所属租户名称 |
| is_admin | Boolean | 是否为管理员 |
| is_member | Boolean | 是否为成员 |
| is_super_admin | Boolean | 是否为超级管理员 |
| role | String | 角色名称 |
| date_joined | String | 注册时间 |

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "phone": "13800138000",
    "nick_name": "系统管理员",
    "first_name": "Admin",
    "last_name": "User",
    "is_active": true,
    "avatar": "https://example.com/media/avatars/admin.jpg",
    "tenant": null,
    "tenant_name": null,
    "is_admin": true,
    "is_member": false,
    "is_super_admin": true,
    "role": "超级管理员",
    "date_joined": "2023-01-01T00:00:00Z"
  }
}
```

### 更新当前用户信息

更新当前登录用户的基本信息。

- **URL**: `/api/v1/users/me/`
- **方法**: `PUT`
- **权限要求**: 已登录用户

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| phone | String | 否 | 手机号码 |
| nick_name | String | 否 | 昵称 |
| first_name | String | 否 | 名 |
| last_name | String | 否 | 姓 |
| avatar | String | 否 | 头像URL |

#### 请求示例

```json
{
  "nick_name": "新昵称",
  "phone": "13900139000",
  "first_name": "New",
  "last_name": "Name"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "更新成功",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "phone": "13900139000",
    "nick_name": "新昵称",
    "first_name": "New",
    "last_name": "Name",
    "is_active": true,
    "avatar": "https://example.com/media/avatars/admin.jpg",
    "tenant": null,
    "tenant_name": null,
    "is_admin": true,
    "is_member": false,
    "is_super_admin": true,
    "role": "超级管理员",
    "date_joined": "2023-01-01T00:00:00Z"
  }
}
```

### 获取用户列表

获取系统中的用户列表，支持分页和过滤。

- **URL**: `/api/v1/users/`
- **方法**: `GET`
- **权限要求**: 管理员用户

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| search | String | 否 | 搜索关键词，支持用户名、邮箱、昵称和手机号搜索 |
| status | String | 否 | 用户状态过滤 |
| is_admin | Boolean | 否 | 是否为管理员 |
| is_member | Boolean | 否 | 是否为成员 |
| page | Integer | 否 | 页码，默认为1 |
| page_size | Integer | 否 | 每页数量，默认为10 |

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 10,
    "next": "http://example.com/api/v1/users/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "phone": "13800138000",
        "nick_name": "系统管理员",
        "first_name": "Admin",
        "last_name": "User",
        "is_active": true,
        "avatar": "https://example.com/media/avatars/admin.jpg",
        "tenant": null,
        "tenant_name": null,
        "is_admin": true,
        "is_member": false,
        "is_super_admin": true,
        "role": "超级管理员",
        "date_joined": "2023-01-01T00:00:00Z"
      },
      // 更多用户...
    ]
  }
}
```

### 搜索用户

通过关键字搜索用户，可在用户名、邮箱、昵称和手机号中匹配。

- **URL**: `/api/v1/users/?search={关键词}`
- **方法**: `GET`
- **权限要求**: 管理员用户

#### 请求示例

```
GET /api/v1/users/?search=test&page=1&page_size=10
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 5,
        "username": "test_user",
        "email": "test@example.com",
        "phone": "13800138005",
        "nick_name": "测试用户",
        "first_name": "Test",
        "last_name": "User",
        "is_active": true,
        "avatar": "",
        "tenant": 1,
        "tenant_name": "测试租户",
        "is_admin": false,
        "is_member": true,
        "is_super_admin": false,
        "role": "普通用户",
        "date_joined": "2023-01-05T00:00:00Z"
      },
      {
        "id": 8,
        "username": "testing",
        "email": "testing@example.com",
        "phone": "13800138008",
        "nick_name": "测试账号",
        "first_name": "",
        "last_name": "",
        "is_active": true,
        "avatar": "",
        "tenant": 1,
        "tenant_name": "测试租户",
        "is_admin": false,
        "is_member": true,
        "is_super_admin": false,
        "role": "普通用户",
        "date_joined": "2023-01-08T00:00:00Z"
      }
    ]
  }
}
```

### 创建用户

创建新用户，可以指定租户和角色。

- **URL**: `/api/v1/users/`
- **方法**: `POST`
- **权限要求**: 管理员用户

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| username | String | 是 | 用户名，唯一 |
| email | String | 是 | 电子邮箱 |
| password | String | 是 | 密码 |
| password_confirm | String | 是 | 确认密码 |
| phone | String | 否 | 手机号码 |
| nick_name | String | 否 | 昵称 |
| first_name | String | 否 | 名 |
| last_name | String | 否 | 姓 |
| avatar | String | 否 | 头像URL |
| tenant_id | Integer | 否 | 所属租户ID（仅超级管理员可设置） |
| is_admin | Boolean | 否 | 是否为管理员 |
| is_member | Boolean | 否 | 是否为成员 |

#### 请求示例

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "SecureP@ssw0rd",
  "password_confirm": "SecureP@ssw0rd",
  "phone": "13800138001",
  "nick_name": "新用户",
  "first_name": "New",
  "last_name": "User",
  "is_admin": false,
  "is_member": true,
  "tenant_id": 1
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "创建成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "phone": "13800138001",
    "nick_name": "新用户",
    "first_name": "New",
    "last_name": "User",
    "is_active": true,
    "avatar": "",
    "tenant": 1,
    "tenant_name": "测试租户",
    "is_admin": false,
    "is_member": true,
    "is_super_admin": false,
    "role": "普通用户",
    "date_joined": "2023-01-02T00:00:00Z"
  }
}
```

## 租户管理API

> **权限说明**：
> - 租户管理API仅供超级管理员使用
> - 普通租户管理员和成员无权访问租户管理API

### 获取租户列表

获取系统中所有租户的列表。

- **URL**: `/api/v1/tenants/`
- **方法**: `GET`
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| search | String | 否 | 搜索关键词，支持租户名称、联系人姓名和联系人邮箱搜索 |
| status | String | 否 | 租户状态过滤，可选值：active（活跃）、suspended（已暂停）|
| page | Integer | 否 | 页码，默认为1 |
| page_size | Integer | 否 | 每页数量，默认为10 |

#### 返回参数

| 参数名 | 类型 | 说明 |
|-------|------|-----|
| count | Integer | 总记录数 |
| next | String | 下一页URL |
| previous | String | 上一页URL |
| results | Array | 租户列表 |

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "测试租户",
        "description": "这是一个测试租户",
        "status": "active",
        "contact_name": "测试联系人",
        "contact_email": "test@example.com",
        "contact_phone": "13800138000",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-10T00:00:00Z"
      },
      {
        "id": 2,
        "name": "示例企业",
        "description": "示例企业租户",
        "status": "active",
        "contact_name": "企业联系人",
        "contact_email": "enterprise@example.com",
        "contact_phone": "13900139000",
        "created_at": "2023-01-02T00:00:00Z",
        "updated_at": "2023-01-10T00:00:00Z"
      }
    ]
  }
}
```

### 搜索租户

通过关键字搜索租户，可在租户名称、联系人姓名和联系人邮箱中匹配。

- **URL**: `/api/v1/tenants/?search={关键词}`
- **方法**: `GET`
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| search | String | 是 | 搜索关键词 |
| page | Integer | 否 | 页码，默认为1 |
| page_size | Integer | 否 | 每页数量，默认为10 |

#### 请求示例

```
GET /api/v1/tenants/?search=测试&page=1&page_size=10
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "测试租户",
        "description": "这是一个测试租户",
        "status": "active",
        "contact_name": "测试联系人",
        "contact_email": "test@example.com",
        "contact_phone": "13800138000",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-10T00:00:00Z"
      }
    ]
  }
}
```

### 创建租户

创建新的租户。

- **URL**: `/api/v1/tenants/`
- **方法**: `POST`
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| name | String | 是 | 租户名称，唯一 |
| description | String | 否 | 租户描述 |
| status | String | 否 | 租户状态，可选值：active（活跃）、suspended（已暂停），默认为active |
| contact_name | String | 是 | 联系人姓名 |
| contact_email | String | 是 | 联系人邮箱 |
| contact_phone | String | 否 | 联系人电话 |

#### 请求示例

```json
{
  "name": "新租户",
  "description": "这是一个新创建的租户",
  "contact_name": "新联系人",
  "contact_email": "new@example.com",
  "contact_phone": "13900139001"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2001,
  "message": "创建成功",
  "data": {
    "id": 3,
    "name": "新租户",
    "description": "这是一个新创建的租户",
    "status": "active",
    "contact_name": "新联系人",
    "contact_email": "new@example.com",
    "contact_phone": "13900139001",
    "created_at": "2023-01-11T00:00:00Z",
    "updated_at": "2023-01-11T00:00:00Z"
  }
}
```

### 获取租户详情

获取指定租户的详细信息。

- **URL**: `/api/v1/tenants/{id}/`
- **方法**: `GET`
- **权限要求**: 超级管理员

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "测试租户",
    "description": "这是一个测试租户",
    "status": "active",
    "contact_name": "测试联系人",
    "contact_email": "test@example.com",
    "contact_phone": "13800138000",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-10T00:00:00Z",
    "quota": {
      "max_users": 100,
      "max_storage": 10240,
      "current_users": 5,
      "current_storage": 1024
    }
  }
}
```

### 更新租户信息

更新指定租户的信息。

- **URL**: `/api/v1/tenants/{id}/`
- **方法**: `PUT`
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| name | String | 否 | 租户名称 |
| description | String | 否 | 租户描述 |
| contact_name | String | 否 | 联系人姓名 |
| contact_email | String | 否 | 联系人邮箱 |
| contact_phone | String | 否 | 联系人电话 |

#### 请求示例

```json
{
  "description": "更新后的租户描述",
  "contact_name": "更新后的联系人"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "测试租户",
    "description": "更新后的租户描述",
    "status": "active",
    "contact_name": "更新后的联系人",
    "contact_email": "test@example.com",
    "contact_phone": "13800138000",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-11T00:00:00Z"
  }
}
```

### 删除租户

软删除指定租户（标记为已删除状态）。

- **URL**: `/api/v1/tenants/{id}/`
- **方法**: `DELETE`
- **权限要求**: 超级管理员

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "删除成功",
  "data": null
}
```

### 获取租户配额

获取指定租户的配额信息。

- **URL**: `/api/v1/tenants/{id}/quota/`
- **方法**: `GET`
- **权限要求**: 超级管理员

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "tenant_id": 1,
    "max_users": 100,
    "max_storage": 10240,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-10T00:00:00Z"
  }
}
```

### 更新租户配额

更新指定租户的配额信息。

- **URL**: `/api/v1/tenants/{id}/quota/`
- **方法**: `PUT`
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| max_users | Integer | 是 | 最大用户数量 |
| max_storage | Integer | 是 | 最大存储空间（MB） |

#### 请求示例

```json
{
  "max_users": 150,
  "max_storage": 20480
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "更新成功",
  "data": {
    "tenant_id": 1,
    "max_users": 150,
    "max_storage": 20480,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-11T00:00:00Z"
  }
}
```

### 获取租户配额使用情况

获取指定租户的配额使用情况。

- **URL**: `/api/v1/tenants/{id}/quota/usage/`
- **方法**: `GET`
- **权限要求**: 超级管理员

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "tenant_id": 1,
    "max_users": 150,
    "current_users": 5,
    "users_usage_percent": 3.33,
    "max_storage": 20480,
    "current_storage": 1024,
    "storage_usage_percent": 5.0
  }
}
```

### 暂停租户

暂停指定租户，使其下的所有用户无法登录。

- **URL**: `/api/v1/tenants/{id}/suspend/`
- **方法**: `POST`
- **权限要求**: 超级管理员

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "租户已暂停",
  "data": {
    "id": 1,
    "name": "测试租户",
    "status": "suspended",
    "updated_at": "2023-01-11T00:00:00Z"
  }
}
```

### 激活租户

激活已暂停的租户。

- **URL**: `/api/v1/tenants/{id}/activate/`
- **方法**: `POST`
- **权限要求**: 超级管理员

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "租户已激活",
  "data": {
    "id": 1,
    "name": "测试租户",
    "status": "active",
    "updated_at": "2023-01-11T00:00:00Z"
  }
}
```

### 获取租户用户列表

获取指定租户下的所有用户列表。

- **URL**: `/api/v1/tenants/{id}/users/`
- **方法**: `GET`
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| search | String | 否 | 搜索关键词 |
| page | Integer | 否 | 页码，默认为1 |
| page_size | Integer | 否 | 每页数量，默认为10 |

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 4,
        "username": "tenant_admin",
        "nick_name": "租户管理员",
        "email": "tenant_admin@example.com",
        "phone": "13800138004",
        "is_active": true,
        "avatar": "",
        "tenant": 1,
        "tenant_name": "测试租户",
        "is_admin": true,
        "is_member": false,
        "role": "租户管理员",
        "date_joined": "2023-01-04T00:00:00Z"
      },
      {
        "id": 5,
        "username": "tenant_user",
        "nick_name": "租户用户",
        "email": "tenant_user@example.com",
        "phone": "13800138005",
        "is_active": true,
        "avatar": "",
        "tenant": 1,
        "tenant_name": "测试租户",
        "is_admin": false,
        "is_member": true,
        "role": "普通用户",
        "date_joined": "2023-01-05T00:00:00Z"
      }
    ]
  }
}
```

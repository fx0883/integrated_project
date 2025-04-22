# 租户 API

本文档描述与租户管理相关的API接口，包括租户创建、查询、更新、删除、配额管理等功能。

## 基础路径

所有租户API的基础路径为: `/api/v1/tenants/`

## 接口列表

### 1. 获取租户列表

获取系统中的租户列表，支持分页、排序和筛选。

- **URL**: `/api/v1/tenants/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员可以查看所有租户，租户管理员只能查看自己的租户

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| page | integer | 否 | 页码，默认为1 | 1 |
| page_size | integer | 否 | 每页记录数，默认为10 | 10 |
| search | string | 否 | 搜索关键词（租户名称、描述） | "company" |
| ordering | string | 否 | 排序字段，前缀'-'表示降序 | "-created_at" |
| status | string | 否 | 筛选指定状态的租户 | "active" |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 50,
    "next": "http://example.com/api/v1/tenants/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "Company A",
        "code": "COMP-A",
        "description": "公司A的描述",
        "status": "active",
        "created_at": "2025-04-01T10:00:00Z",
        "updated_at": "2025-04-22T10:00:00Z",
        "quota": {
          "id": 1,
          "tenant": 1,
          "max_users": 100,
          "max_admins": 5,
          "current_users": 45,
          "current_admins": 2
        }
      },
      // 更多租户...
    ]
  }
}
```

### 2. 创建租户

创建新租户。

- **URL**: `/api/v1/tenants/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| name | string | 是 | 租户名称 | "Company B" |
| code | string | 否 | 租户代码，如不提供将自动生成 | "COMP-B" |
| description | string | 否 | 租户描述 | "公司B的描述" |
| quota | object | 否 | 租户配额设置 | 见下方 |

**quota对象参数**:

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| max_users | integer | 否 | 最大用户数，默认50 | 100 |
| max_admins | integer | 否 | 最大管理员数，默认5 | 10 |

#### 请求示例

```json
{
  "name": "Company B",
  "code": "COMP-B",
  "description": "公司B的描述",
  "quota": {
    "max_users": 100,
    "max_admins": 10
  }
}
```

#### 成功响应 (201 Created)

```json
{
  "success": true,
  "code": 2000,
  "message": "创建成功",
  "data": {
    "id": 2,
    "name": "Company B",
    "code": "COMP-B",
    "description": "公司B的描述",
    "status": "active",
    "created_at": "2025-04-22T12:00:00Z",
    "updated_at": "2025-04-22T12:00:00Z",
    "quota": {
      "id": 2,
      "tenant": 2,
      "max_users": 100,
      "max_admins": 10,
      "current_users": 0,
      "current_admins": 0
    }
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
    "name": ["租户名称已存在"],
    "code": ["租户代码已存在"],
    "quota": {
      "max_users": ["最大用户数不能小于1"],
      "max_admins": ["最大管理员数不能大于最大用户数"]
    }
  }
}
```

### 3. 获取租户详情

获取指定租户的详细信息。

- **URL**: `/api/v1/tenants/{id}/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以查看任何租户
  - 租户管理员和普通用户只能查看自己所属的租户

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 1 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "Company A",
    "code": "COMP-A",
    "description": "公司A的描述",
    "status": "active",
    "created_at": "2025-04-01T10:00:00Z",
    "updated_at": "2025-04-22T10:00:00Z",
    "quota": {
      "id": 1,
      "tenant": 1,
      "max_users": 100,
      "max_admins": 5,
      "current_users": 45,
      "current_admins": 2
    }
  }
}
```

#### 错误响应 (404 Not Found)

```json
{
  "success": false,
  "code": 4004,
  "message": "租户不存在",
  "data": null
}
```

### 4. 更新租户信息

更新指定租户的信息。

- **URL**: `/api/v1/tenants/{id}/`
- **方法**: `PUT` 或 `PATCH`（部分更新）
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 1 |

#### 请求参数（可以部分提供）

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| name | string | 否 | 租户名称 | "Company A Updated" |
| code | string | 否 | 租户代码 | "COMP-A" |
| description | string | 否 | 租户描述 | "公司A的更新描述" |

#### 请求示例 (PATCH)

```json
{
  "name": "Company A Updated",
  "description": "公司A的更新描述"
}
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "Company A Updated",
    "code": "COMP-A",
    "description": "公司A的更新描述",
    "status": "active",
    "created_at": "2025-04-01T10:00:00Z",
    "updated_at": "2025-04-22T14:00:00Z",
    "quota": {
      "id": 1,
      "tenant": 1,
      "max_users": 100,
      "max_admins": 5,
      "current_users": 45,
      "current_admins": 2
    }
  }
}
```

### 5. 删除租户

删除（软删除）指定租户。

- **URL**: `/api/v1/tenants/{id}/`
- **方法**: `DELETE`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 2 |

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

### 6. 更新租户配额

更新指定租户的配额设置。

- **URL**: `/api/v1/tenants/{id}/quota/`
- **方法**: `PUT`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 1 |

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| max_users | integer | 是 | 最大用户数 | 150 |
| max_admins | integer | 是 | 最大管理员数 | 10 |

#### 请求示例

```json
{
  "max_users": 150,
  "max_admins": 10
}
```

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "配额更新成功",
  "data": {
    "id": 1,
    "tenant": 1,
    "max_users": 150,
    "max_admins": 10,
    "current_users": 45,
    "current_admins": 2
  }
}
```

#### 错误响应 (400 Bad Request)

```json
{
  "success": false,
  "code": 4000,
  "message": "配额更新失败",
  "data": {
    "max_users": ["新的最大用户数不能小于当前用户数"],
    "max_admins": ["新的最大管理员数不能小于当前管理员数"]
  }
}
```

### 7. 获取租户配额使用情况

获取指定租户的配额使用情况。

- **URL**: `/api/v1/tenants/{id}/quota/usage/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以查看任何租户的配额使用情况
  - 租户管理员只能查看自己租户的配额使用情况

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 1 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "quota": {
      "max_users": 150,
      "max_admins": 10,
      "current_users": 45,
      "current_admins": 2
    },
    "usage": {
      "users_percentage": 30,
      "admins_percentage": 20
    }
  }
}
```

### 8. 暂停租户

将指定租户状态设置为"暂停"，租户内的用户将无法登录。

- **URL**: `/api/v1/tenants/{id}/suspend/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 1 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "租户已暂停",
  "data": {
    "id": 1,
    "name": "Company A Updated",
    "status": "suspended",
    "updated_at": "2025-04-22T15:00:00Z"
  }
}
```

### 9. 激活租户

将指定租户状态设置为"活跃"，租户内的用户可以正常登录。

- **URL**: `/api/v1/tenants/{id}/activate/`
- **方法**: `POST`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 超级管理员

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 1 |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "租户已激活",
  "data": {
    "id": 1,
    "name": "Company A Updated",
    "status": "active",
    "updated_at": "2025-04-22T15:30:00Z"
  }
}
```

### 10. 获取租户用户列表

获取指定租户内的用户列表。

- **URL**: `/api/v1/tenants/{id}/users/`
- **方法**: `GET`
- **认证要求**: 需要认证（Bearer Token）
- **权限要求**: 
  - 超级管理员可以查看任何租户的用户
  - 租户管理员只能查看自己租户的用户

#### 路径参数

| 参数名 | 类型 | 描述 | 示例 |
|-------|------|------|------|
| id | integer | 租户ID | 1 |

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|-------|------|------|------|------|
| page | integer | 否 | 页码，默认为1 | 1 |
| page_size | integer | 否 | 每页记录数，默认为10 | 10 |
| search | string | 否 | 搜索关键词 | "john" |
| ordering | string | 否 | 排序字段 | "-date_joined" |
| is_admin | boolean | 否 | 筛选管理员 | true |

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 45,
    "next": "http://example.com/api/v1/tenants/1/users/?page=2",
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
        "tenant_name": "Company A Updated",
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

## 租户状态说明

租户状态包括以下几种：

- `active`: 活跃状态，租户正常运行，用户可以登录和使用系统
- `suspended`: 暂停状态，租户被暂停，租户内的用户无法登录，但数据保留
- `inactive`: 未激活或已删除状态，通常表示租户已被软删除

## 租户配额说明

租户配额是控制租户可以拥有的用户数量和管理员数量的限制：

- `max_users`: 最大用户数（包括普通用户和管理员），默认为50
- `max_admins`: 最大管理员数，默认为5
- `current_users`: 当前用户数（包括普通用户和管理员）
- `current_admins`: 当前管理员数 
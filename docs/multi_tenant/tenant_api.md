# 租户管理API

本文档描述了系统的租户管理相关API，包括租户的创建、查询、更新、删除等功能，以及租户配额管理。

## 获取租户列表

获取所有租户列表（需要超级管理员权限）。

**请求URL**：`/api/v1/tenants/`

**请求方式**：`GET`

**请求头**：
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| page | integer | 否 | 页码，默认为1 |
| page_size | integer | 否 | 每页记录数，默认为10，最大为100 |
| search | string | 否 | 搜索关键词，将在租户名称、描述中搜索 |
| status | string | 否 | 租户状态筛选，可选值：active（活跃）、suspended（已暂停）、all（全部） |

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "count": 15,
    "next": "http://api.example.com/api/v1/tenants/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "测试租户1",
        "description": "这是一个测试租户",
        "status": "active",
        "created_at": "2023-09-01T10:30:00Z",
        "updated_at": "2023-10-15T14:20:00Z",
        "user_count": 25,
        "quota": {
          "max_users": 50,
          "max_storage": 10240,
          "max_projects": 100
        }
      },
      {
        "id": 2,
        "name": "测试租户2",
        "description": "这是另一个测试租户",
        "status": "suspended",
        "created_at": "2023-09-10T08:45:00Z",
        "updated_at": "2023-10-20T11:30:00Z",
        "user_count": 10,
        "quota": {
          "max_users": 20,
          "max_storage": 5120,
          "max_projects": 50
        }
      }
      // ... 更多租户
    ]
  }
}
```

**错误响应**：

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "只有超级管理员可以访问此接口"
  }
}
```

## 获取租户详情

获取指定租户的详细信息（需要超级管理员权限或租户管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/`

**请求方式**：`GET`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "测试租户1",
    "description": "这是一个测试租户",
    "status": "active",
    "created_at": "2023-09-01T10:30:00Z",
    "updated_at": "2023-10-15T14:20:00Z",
    "user_count": 25,
    "quota": {
      "max_users": 50,
      "max_storage": 10240,
      "max_projects": 100
    },
    "usage": {
      "users": 25,
      "storage": 5120,
      "projects": 45
    },
    "admins": [
      {
        "id": 101,
        "username": "admin1",
        "email": "admin1@example.com",
        "real_name": "管理员1"
      },
      {
        "id": 102,
        "username": "admin2",
        "email": "admin2@example.com",
        "real_name": "管理员2"
      }
    ]
  }
}
```

**错误响应**：

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "您没有执行该操作的权限"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
```

## 创建租户

创建新租户（需要超级管理员权限）。

**请求URL**：`/api/v1/tenants/`

**请求方式**：`POST`

**请求头**：
- Content-Type: application/json
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| name | string | 是 | 租户名称，长度为3-50个字符 |
| description | string | 否 | 租户描述，最大长度为200个字符 |
| admin_username | string | 是 | 初始管理员用户名，长度为3-30个字符，只能包含字母、数字、下划线 |
| admin_password | string | 是 | 初始管理员密码，长度至少8位，必须包含大小写字母、数字和特殊字符 |
| admin_email | string | 是 | 初始管理员邮箱地址 |
| admin_phone | string | 是 | 初始管理员手机号码 |
| admin_real_name | string | 否 | 初始管理员真实姓名 |
| quota | object | 否 | 租户配额设置 |
| quota.max_users | integer | 否 | 最大用户数，默认为20 |
| quota.max_storage | integer | 否 | 最大存储空间（MB），默认为5120 |
| quota.max_projects | integer | 否 | 最大项目数，默认为50 |

**请求示例**：

```json
{
  "name": "新租户",
  "description": "这是一个新创建的租户",
  "admin_username": "admin",
  "admin_password": "Admin@123",
  "admin_email": "admin@newtenant.com",
  "admin_phone": "13900138888",
  "admin_real_name": "租户管理员",
  "quota": {
    "max_users": 30,
    "max_storage": 8192,
    "max_projects": 80
  }
}
```

**响应示例**：

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "tenant": {
      "id": 3,
      "name": "新租户",
      "description": "这是一个新创建的租户",
      "status": "active",
      "created_at": "2023-10-28T09:30:00Z",
      "updated_at": "2023-10-28T09:30:00Z",
      "quota": {
        "max_users": 30,
        "max_storage": 8192,
        "max_projects": 80
      }
    },
    "admin": {
      "id": 301,
      "username": "admin",
      "email": "admin@newtenant.com",
      "phone": "13900138888",
      "real_name": "租户管理员",
      "is_admin": true
    }
  }
}
```

**错误响应**：

```json
{
  "code": 4000,
  "message": "创建失败",
  "data": {
    "name": ["此租户名称已被使用"],
    "admin_username": ["此用户名已被使用"],
    "admin_email": ["此邮箱已被注册"],
    "admin_phone": ["此手机号已被注册"]
  }
}
```

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "只有超级管理员可以访问此接口"
  }
}
```

## 更新租户信息

更新指定租户的信息（需要超级管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/`

**请求方式**：`PUT`

**请求头**：
- Content-Type: application/json
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| name | string | 是 | 租户名称，长度为3-50个字符 |
| description | string | 否 | 租户描述，最大长度为200个字符 |

**请求示例**：

```json
{
  "name": "更新后的租户名称",
  "description": "这是更新后的租户描述"
}
```

**响应示例**：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "更新后的租户名称",
    "description": "这是更新后的租户描述",
    "status": "active",
    "created_at": "2023-09-01T10:30:00Z",
    "updated_at": "2023-10-28T14:30:00Z",
    "user_count": 25,
    "quota": {
      "max_users": 50,
      "max_storage": 10240,
      "max_projects": 100
    }
  }
}
```

**错误响应**：

```json
{
  "code": 4000,
  "message": "更新失败",
  "data": {
    "name": ["此租户名称已被使用"]
  }
}
```

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "只有超级管理员可以访问此接口"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
```

## 部分更新租户信息

部分更新指定租户的信息（需要超级管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/`

**请求方式**：`PATCH`

**请求头**：
- Content-Type: application/json
- Authorization: Bearer {access_token}

**请求参数**：
与PUT请求相同，但所有字段都是可选的，只更新提供的字段。

**请求示例**：

```json
{
  "description": "这是部分更新的租户描述"
}
```

**响应示例**：
与PUT请求相同，返回更新后的完整租户信息。

**错误响应**：
与PUT请求相同。

## 删除租户

删除指定租户（需要超级管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/`

**请求方式**：`DELETE`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "删除成功",
  "data": {}
}
```

**错误响应**：

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "只有超级管理员可以访问此接口"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
```

## 更新租户配额

更新指定租户的配额（需要超级管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/quota/`

**请求方式**：`PUT`

**请求头**：
- Content-Type: application/json
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| max_users | integer | 是 | 最大用户数 |
| max_storage | integer | 是 | 最大存储空间（MB） |
| max_projects | integer | 是 | 最大项目数 |

**请求示例**：

```json
{
  "max_users": 100,
  "max_storage": 20480,
  "max_projects": 200
}
```

**响应示例**：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "tenant_id": 1,
    "quota": {
      "max_users": 100,
      "max_storage": 20480,
      "max_projects": 200
    }
  }
}
```

**错误响应**：

```json
{
  "code": 4000,
  "message": "更新失败",
  "data": {
    "max_users": ["最大用户数不能小于当前用户数"],
    "max_storage": ["最大存储空间不能小于当前已使用空间"],
    "max_projects": ["最大项目数不能小于当前项目数"]
  }
}
```

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "只有超级管理员可以访问此接口"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
```

## 获取租户配额使用情况

获取指定租户的配额使用情况（需要超级管理员权限或租户管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/quota/usage/`

**请求方式**：`GET`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "tenant_id": 1,
    "quota": {
      "max_users": 50,
      "max_storage": 10240,
      "max_projects": 100
    },
    "usage": {
      "users": 25,
      "storage": 5120,
      "projects": 45
    },
    "percentage": {
      "users": 50,
      "storage": 50,
      "projects": 45
    }
  }
}
```

**错误响应**：

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "您没有执行该操作的权限"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
```

## 暂停租户

暂停指定租户（需要超级管理员权限），暂停后该租户下的所有用户将无法登录。

**请求URL**：`/api/v1/tenants/{id}/suspend/`

**请求方式**：`POST`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "暂停成功",
  "data": {
    "id": 1,
    "name": "测试租户1",
    "status": "suspended",
    "updated_at": "2023-10-28T15:30:00Z"
  }
}
```

**错误响应**：

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "只有超级管理员可以访问此接口"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
```

## 激活租户

激活已暂停的租户（需要超级管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/activate/`

**请求方式**：`POST`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "激活成功",
  "data": {
    "id": 1,
    "name": "测试租户1",
    "status": "active",
    "updated_at": "2023-10-28T16:30:00Z"
  }
}
```

**错误响应**：

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "只有超级管理员可以访问此接口"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
```

## 获取租户用户列表

获取指定租户下的所有用户列表（需要超级管理员权限或租户管理员权限）。

**请求URL**：`/api/v1/tenants/{id}/users/`

**请求方式**：`GET`

**请求头**：
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| page | integer | 否 | 页码，默认为1 |
| page_size | integer | 否 | 每页记录数，默认为10，最大为100 |
| search | string | 否 | 搜索关键词，将在用户名、邮箱、手机号、真实姓名中搜索 |
| is_admin | boolean | 否 | 是否仅显示管理员用户 |
| is_active | boolean | 否 | 是否仅显示活跃用户 |

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "count": 25,
    "next": "http://api.example.com/api/v1/tenants/1/users/?page=2",
    "previous": null,
    "results": [
      {
        "id": 201,
        "username": "user1",
        "email": "user1@example.com",
        "phone": "13900138001",
        "real_name": "张三",
        "avatar": "https://example.com/avatar/201.jpg",
        "is_admin": true,
        "is_active": true,
        "last_login": "2023-10-27T10:30:00Z",
        "date_joined": "2023-10-20T09:30:00Z"
      },
      {
        "id": 202,
        "username": "user2",
        "email": "user2@example.com",
        "phone": "13900138002",
        "real_name": "李四",
        "avatar": "https://example.com/avatar/202.jpg",
        "is_admin": false,
        "is_active": true,
        "last_login": "2023-10-26T15:45:00Z",
        "date_joined": "2023-10-21T11:20:00Z"
      }
      // ... 更多用户
    ]
  }
}
```

**错误响应**：

```json
{
  "code": 4001,
  "message": "验证失败",
  "data": {
    "detail": "令牌无效或已过期"
  }
}
```

```json
{
  "code": 4003,
  "message": "权限不足",
  "data": {
    "detail": "您没有执行该操作的权限"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的租户"
  }
}
``` 
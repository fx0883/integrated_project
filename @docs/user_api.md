# 用户管理API

本文档描述了系统的用户管理相关API，包括获取用户列表、创建用户、更新用户信息等功能。

## 获取当前用户信息

获取当前登录用户的详细信息。

**请求URL**：`/api/v1/users/me/`

**请求方式**：`GET`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 100,
    "username": "testuser",
    "email": "testuser@example.com",
    "phone": "13900138000",
    "real_name": "测试用户",
    "avatar": "https://example.com/avatar/100.jpg",
    "tenant_id": 1,
    "tenant_name": "测试租户1",
    "is_admin": true,
    "is_active": true,
    "last_login": "2023-10-28T15:30:00Z",
    "date_joined": "2023-10-15T10:30:00Z",
    "permissions": [
      "view_user",
      "add_user",
      "change_user",
      "delete_user",
      "view_project",
      "add_project"
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

## 获取用户列表

获取用户列表，需要管理员权限。

**请求URL**：`/api/v1/users/`

**请求方式**：`GET`

**请求头**：
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| page | integer | 否 | 页码，默认为1 |
| page_size | integer | 否 | 每页记录数，默认为10，最大为100 |
| search | string | 否 | 搜索关键词，支持模糊搜索用户名、真实姓名、邮箱、手机号 |
| is_active | boolean | 否 | 过滤活跃状态，true表示只显示活跃用户，false表示只显示非活跃用户 |
| is_admin | boolean | 否 | 过滤管理员状态，true表示只显示管理员，false表示只显示非管理员 |
| sort | string | 否 | 排序字段，可选值：id、username、real_name、email、date_joined、last_login，默认按id排序 |
| order | string | 否 | 排序方向，可选值：asc（升序）、desc（降序），默认为asc |

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "count": 50,
    "next": "http://example.com/api/v1/users/?page=2",
    "previous": null,
    "results": [
      {
        "id": 100,
        "username": "testuser1",
        "email": "testuser1@example.com",
        "phone": "13900138001",
        "real_name": "测试用户1",
        "avatar": "https://example.com/avatar/100.jpg",
        "is_admin": true,
        "is_active": true,
        "last_login": "2023-10-28T15:30:00Z",
        "date_joined": "2023-10-15T10:30:00Z"
      },
      {
        "id": 101,
        "username": "testuser2",
        "email": "testuser2@example.com",
        "phone": "13900138002",
        "real_name": "测试用户2",
        "avatar": "https://example.com/avatar/101.jpg",
        "is_admin": false,
        "is_active": true,
        "last_login": "2023-10-27T14:20:00Z",
        "date_joined": "2023-10-15T10:35:00Z"
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
    "detail": "您没有权限执行此操作"
  }
}
```

## 获取用户详情

获取指定用户的详细信息，需要管理员权限。

**请求URL**：`/api/v1/users/{id}/`

**请求方式**：`GET`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 100,
    "username": "testuser",
    "email": "testuser@example.com",
    "phone": "13900138000",
    "real_name": "测试用户",
    "avatar": "https://example.com/avatar/100.jpg",
    "tenant_id": 1,
    "tenant_name": "测试租户1",
    "is_admin": true,
    "is_active": true,
    "last_login": "2023-10-28T15:30:00Z",
    "date_joined": "2023-10-15T10:30:00Z",
    "permissions": [
      "view_user",
      "add_user",
      "change_user",
      "delete_user",
      "view_project",
      "add_project"
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
    "detail": "您没有权限执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的用户"
  }
}
```

## 创建用户

创建新用户，需要管理员权限。

**请求URL**：`/api/v1/users/`

**请求方式**：`POST`

**请求头**：
- Content-Type: application/json
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名，长度为3-30个字符，只能包含字母、数字、下划线 |
| password | string | 是 | 密码，长度至少8位，必须包含大小写字母、数字和特殊字符 |
| email | string | 是 | 邮箱地址 |
| phone | string | 是 | 手机号码 |
| real_name | string | 否 | 真实姓名 |
| avatar | string | 否 | 头像URL |
| is_admin | boolean | 否 | 是否为管理员，默认为false |
| is_active | boolean | 否 | 是否激活，默认为true |
| tenant_id | integer | 否 | 所属租户ID（如果是超级管理员创建其他租户的用户，需要提供） |

**请求示例**：

```json
{
  "username": "newuser",
  "password": "NewTest@123",
  "email": "newuser@example.com",
  "phone": "13900138888",
  "real_name": "新用户",
  "is_admin": true,
  "is_active": true,
  "tenant_id": 1
}
```

**响应示例**：

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 102,
    "username": "newuser",
    "email": "newuser@example.com",
    "phone": "13900138888",
    "real_name": "新用户",
    "avatar": null,
    "tenant_id": 1,
    "tenant_name": "测试租户1",
    "is_admin": true,
    "is_active": true,
    "date_joined": "2023-10-28T16:45:00Z"
  }
}
```

**错误响应**：

```json
{
  "code": 4000,
  "message": "创建失败",
  "data": {
    "username": ["该租户下此用户名已被使用"],
    "email": ["该租户下此邮箱已被注册"],
    "phone": ["该租户下此手机号已被注册"],
    "password": ["密码强度不足，必须包含大小写字母、数字和特殊字符"]
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
    "detail": "您没有权限执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "指定的租户不存在或已被删除"
  }
}
```

```json
{
  "code": 4009,
  "message": "租户状态异常",
  "data": {
    "detail": "该租户已被暂停，无法创建新用户"
  }
}
```

## 更新用户信息

更新指定用户的信息，需要管理员权限或用户本人。

**请求URL**：`/api/v1/users/{id}/`

**请求方式**：`PUT`

**请求头**：
- Content-Type: application/json
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| username | string | 是 | 用户名，长度为3-30个字符，只能包含字母、数字、下划线 |
| email | string | 是 | 邮箱地址 |
| phone | string | 是 | 手机号码 |
| real_name | string | 否 | 真实姓名 |
| avatar | string | 否 | 头像URL |
| is_admin | boolean | 否 | 是否为管理员，只有管理员可以修改此字段 |
| is_active | boolean | 否 | 是否激活，只有管理员可以修改此字段 |

**请求示例**：

```json
{
  "username": "updateduser",
  "email": "updateduser@example.com",
  "phone": "13900139999",
  "real_name": "更新用户",
  "is_admin": false,
  "is_active": true
}
```

**响应示例**：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 100,
    "username": "updateduser",
    "email": "updateduser@example.com",
    "phone": "13900139999",
    "real_name": "更新用户",
    "avatar": "https://example.com/avatar/100.jpg",
    "tenant_id": 1,
    "tenant_name": "测试租户1",
    "is_admin": false,
    "is_active": true,
    "last_login": "2023-10-28T15:30:00Z",
    "date_joined": "2023-10-15T10:30:00Z"
  }
}
```

**错误响应**：

```json
{
  "code": 4000,
  "message": "更新失败",
  "data": {
    "username": ["该租户下此用户名已被使用"],
    "email": ["该租户下此邮箱已被注册"],
    "phone": ["该租户下此手机号已被注册"]
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
    "detail": "您没有权限执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的用户"
  }
}
```

## 部分更新用户信息

部分更新指定用户的信息，需要管理员权限或用户本人。

**请求URL**：`/api/v1/users/{id}/`

**请求方式**：`PATCH`

**请求头**：
- Content-Type: application/json
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| username | string | 否 | 用户名，长度为3-30个字符，只能包含字母、数字、下划线 |
| email | string | 否 | 邮箱地址 |
| phone | string | 否 | 手机号码 |
| real_name | string | 否 | 真实姓名 |
| avatar | string | 否 | 头像URL |
| is_admin | boolean | 否 | 是否为管理员，只有管理员可以修改此字段 |
| is_active | boolean | 否 | 是否激活，只有管理员可以修改此字段 |

**请求示例**：

```json
{
  "real_name": "更新后的名字",
  "avatar": "https://example.com/new_avatar.jpg"
}
```

**响应示例**：

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 100,
    "username": "testuser",
    "email": "testuser@example.com",
    "phone": "13900138000",
    "real_name": "更新后的名字",
    "avatar": "https://example.com/new_avatar.jpg",
    "tenant_id": 1,
    "tenant_name": "测试租户1",
    "is_admin": true,
    "is_active": true,
    "last_login": "2023-10-28T15:30:00Z",
    "date_joined": "2023-10-15T10:30:00Z"
  }
}
```

**错误响应**：

```json
{
  "code": 4000,
  "message": "更新失败",
  "data": {
    "username": ["该租户下此用户名已被使用"],
    "email": ["该租户下此邮箱已被注册"],
    "phone": ["该租户下此手机号已被注册"]
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
    "detail": "您没有权限执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的用户"
  }
}
```

## 删除用户

删除指定用户，需要管理员权限。

**请求URL**：`/api/v1/users/{id}/`

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
    "detail": "您没有权限执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的用户"
  }
}
```

```json
{
  "code": 4009,
  "message": "操作失败",
  "data": {
    "detail": "无法删除自己的账号"
  }
}
```

## 设置用户为超级管理员

将指定用户设置为超级管理员，需要超级管理员权限。

**请求URL**：`/api/v1/users/{id}/set-superadmin/`

**请求方式**：`POST`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "设置成功",
  "data": {
    "id": 100,
    "username": "testuser",
    "email": "testuser@example.com",
    "phone": "13900138000",
    "real_name": "测试用户",
    "avatar": "https://example.com/avatar/100.jpg",
    "tenant_id": null,
    "tenant_name": null,
    "is_admin": true,
    "is_superadmin": true,
    "is_active": true,
    "last_login": "2023-10-28T15:30:00Z",
    "date_joined": "2023-10-15T10:30:00Z"
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
    "detail": "只有超级管理员可以执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的用户"
  }
}
```

## 取消用户的超级管理员权限

取消指定用户的超级管理员权限，需要超级管理员权限。

**请求URL**：`/api/v1/users/{id}/unset-superadmin/`

**请求方式**：`POST`

**请求头**：
- Authorization: Bearer {access_token}

**响应示例**：

```json
{
  "code": 0,
  "message": "设置成功",
  "data": {
    "id": 100,
    "username": "testuser",
    "email": "testuser@example.com",
    "phone": "13900138000",
    "real_name": "测试用户",
    "avatar": "https://example.com/avatar/100.jpg",
    "tenant_id": null,
    "tenant_name": null,
    "is_admin": true,
    "is_superadmin": false,
    "is_active": true,
    "last_login": "2023-10-28T15:30:00Z",
    "date_joined": "2023-10-15T10:30:00Z"
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
    "detail": "只有超级管理员可以执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的用户"
  }
}
```

```json
{
  "code": 4009,
  "message": "操作失败",
  "data": {
    "detail": "无法取消自己的超级管理员权限"
  }
}
```

## 上传用户头像

上传用户头像图片。

**请求URL**：`/api/v1/users/{id}/avatar/`

**请求方式**：`POST`

**请求头**：
- Content-Type: multipart/form-data
- Authorization: Bearer {access_token}

**请求参数**：

| 参数名 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| avatar | file | 是 | 头像图片文件，支持JPG、PNG、GIF格式，大小不超过2MB |

**响应示例**：

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "avatar": "https://example.com/avatar/100_updated.jpg"
  }
}
```

**错误响应**：

```json
{
  "code": 4000,
  "message": "上传失败",
  "data": {
    "avatar": ["图片格式不支持，请上传JPG、PNG或GIF格式的图片"],
    "avatar": ["图片大小超过限制，最大支持2MB"]
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
    "detail": "您没有权限执行此操作"
  }
}
```

```json
{
  "code": 4004,
  "message": "未找到",
  "data": {
    "detail": "未找到指定的用户"
  }
}
``` 
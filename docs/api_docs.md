# 多租户系统API文档

本文档详细描述了多租户系统的所有API接口，包括接口说明、请求参数、返回数据、调用权限以及示例数据。文档旨在为后端开发人员提供清晰的API实现指南。

## 目录

1. [用户管理API](#用户管理api)
   1. [获取当前用户信息](#获取当前用户信息)
   2. [更新当前用户信息](#更新当前用户信息)
   3. [获取用户列表](#获取用户列表)
   4. [创建用户](#创建用户)
   5. [获取用户详情](#获取用户详情)
   6. [更新用户信息](#更新用户信息)
   7. [删除用户](#删除用户)
   8. [修改密码](#修改密码)
   9. [创建超级管理员](#创建超级管理员)
   10. [授予超级管理员权限](#授予超级管理员权限)
   11. [撤销超级管理员权限](#撤销超级管理员权限)
   12. [更新用户角色](#更新用户角色)
   13. [获取租户用户列表](#获取租户用户列表)
   14. [创建子账号](#创建子账号)
   15. [上传用户头像](#上传用户头像)
2. [租户管理API](#租户管理api)
   1. [获取租户列表](#获取租户列表)
   2. [创建租户](#创建租户)
   3. [获取租户详情](#获取租户详情)
   4. [更新租户信息](#更新租户信息)
   5. [删除租户](#删除租户)
   6. [获取租户配额](#获取租户配额)
   7. [更新租户配额](#更新租户配额)
   8. [获取租户配额使用情况](#获取租户配额使用情况)
   9. [暂停租户](#暂停租户)
   10. [激活租户](#激活租户)
   11. [获取租户用户列表](#获取租户用户列表)

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

### 获取当前用户信息

获取当前登录用户的详细信息。

- **URL**: `/api/users/current/`
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

- **URL**: `/api/users/current/`
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

获取系统中的用户列表，支持搜索和分页。

- **URL**: `/api/users/`
- **方法**: `GET`
- **权限要求**: 管理员用户
  - 超级管理员：可查看所有用户
  - 租户管理员：只能查看自己租户的用户
  - 普通用户：只能查看自己

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| search | String | 否 | 搜索关键词，支持用户名、邮箱、昵称和手机号搜索 |
| status | String | 否 | 用户状态过滤 |
| is_admin | Boolean | 否 | 是否为管理员 |
| is_sub_account | Boolean | 否 | 是否为子账号 |
| parent | Integer | 否 | 父账号ID |
| page | Integer | 否 | 页码，默认为1 |
| page_size | Integer | 否 | 每页数量，默认为10 |

#### 返回参数

| 参数名 | 类型 | 说明 |
|-------|------|-----|
| count | Integer | 总记录数 |
| next | String | 下一页URL |
| previous | String | 上一页URL |
| results | Array | 用户列表 |

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
  "data": {
    "count": 10,
    "next": "http://example.com/api/users/?page=2",
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

### 创建用户

创建新用户。

- **URL**: `/api/users/`
- **方法**: `POST`
- **权限要求**: 管理员用户
  - 超级管理员：可创建任意租户下的用户
  - 租户管理员：只能创建自己租户的用户

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

### 获取用户详情

获取指定用户的详细信息。

- **URL**: `/api/users/{id}/`
- **方法**: `GET`
- **权限要求**:
  - 超级管理员：可查看任何用户
  - 租户管理员：只能查看自己租户的用户
  - 普通用户：只能查看自己

#### 返回参数

同[获取当前用户信息](#获取当前用户信息)的返回参数。

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "获取成功",
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

### 更新用户信息

更新指定用户的信息。

- **URL**: `/api/users/{id}/`
- **方法**: `PUT`
- **权限要求**:
  - 超级管理员：可更新任何用户
  - 租户管理员：只能更新自己租户的用户
  - 普通用户：只能更新自己

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| phone | String | 否 | 手机号码 |
| nick_name | String | 否 | 昵称 |
| first_name | String | 否 | 名 |
| last_name | String | 否 | 姓 |
| avatar | String | 否 | 头像URL |
| is_active | Boolean | 否 | 是否激活 |
| status | String | 否 | 用户状态 |

#### 请求示例

```json
{
  "nick_name": "更新后的昵称",
  "is_active": true,
  "phone": "13900139001"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "更新成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "phone": "13900139001",
    "nick_name": "更新后的昵称",
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

### 删除用户

软删除指定用户（标记为已删除状态）。

- **URL**: `/api/users/{id}/`
- **方法**: `DELETE`
- **权限要求**:
  - 超级管理员：可删除任何用户
  - 租户管理员：只能删除自己租户的用户
  - 普通用户：不能删除用户

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "删除成功",
  "data": null
}
```

### 修改密码

修改当前用户或指定用户的密码。

- **URL**: `/api/users/{id}/change-password/`
- **方法**: `POST`
- **权限要求**: 已登录用户（只能修改自己的密码）

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|-----|-----|
| old_password | String | 是 | 旧密码 |
| new_password | String | 是 | 新密码 |
| new_password_confirm | String | 是 | 确认新密码 |

#### 请求示例

```json
{
  "old_password": "OldPassword123",
  "new_password": "NewSecureP@ssw0rd",
  "new_password_confirm": "NewSecureP@ssw0rd"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "密码修改成功",
  "data": null
}
```

### 创建超级管理员

创建具有超级管理员权限的用户。

- **URL**: `/api/users/super-admin/create/`
- **方法**: `POST`
- **权限要求**: 超级管理员

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

#### 请求示例

```json
{
  "username": "superadmin2",
  "email": "superadmin2@example.com",
  "password": "SuperAdminP@ss123",
  "password_confirm": "SuperAdminP@ss123",
  "nick_name": "超级管理员2",
  "phone": "13800138002"
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 2000,
  "message": "创建超级管理员成功",
  "data": {
    "id": 3,
    "username": "superadmin2",
    "email": "superadmin2@example.com",
    "phone": "13800138002",
    "nick_name": "超级管理员2",
    "first_name": "",
    "last_name": "",
    "is_active": true,
    "avatar": "",
    "tenant": null,
    "tenant_name": null,
    "is_admin": true,
    "is_member": true,
    "is_super_admin": true,
    "role": "超级管理员",
    "date_joined": "2023-01-03T00:00:00Z"
  }
}
```

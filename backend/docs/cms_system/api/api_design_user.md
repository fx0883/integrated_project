# CMS系统API设计文档 - 用户与权限管理

## 1. 用户与权限API概述

用户与权限API提供对CMS系统中用户管理、权限控制、用户等级等功能的支持。这些API符合RESTful设计原则，使用JWT令牌进行身份验证，确保系统安全性和可扩展性。

## 2. 认证API

### 2.1 用户登录

**请求方法**: POST

**URL**: `/api/v1/auth/login`

**功能描述**: 用户登录并获取访问令牌

**请求头**:
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "username": "user@example.com", // 用户名或邮箱
  "password": "user_password",
  "remember_me": true // 是否延长令牌有效期
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 10,
      "username": "demo_user",
      "email": "user@example.com",
      "display_name": "示例用户",
      "avatar": "https://example.com/avatars/demo_user.jpg",
      "role": "author"
    }
  }
}
```

### 2.2 刷新令牌

**请求方法**: POST

**URL**: `/api/v1/auth/refresh`

**功能描述**: 使用刷新令牌获取新的访问令牌

**请求头**:
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Token refreshed",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

### 2.3 注销登录

**请求方法**: POST

**URL**: `/api/v1/auth/logout`

**功能描述**: 使当前令牌失效

**请求头**:
- Authorization: Bearer {token}
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Logout successful"
}
```

### 2.4 重置密码请求

**请求方法**: POST

**URL**: `/api/v1/auth/forgot-password`

**功能描述**: 发送密码重置邮件

**请求头**:
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "email": "user@example.com"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Password reset email sent"
}
```

### 2.5 密码重置

**请求方法**: POST

**URL**: `/api/v1/auth/reset-password`

**功能描述**: 使用重置令牌设置新密码

**请求头**:
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "token": "reset_token_from_email",
  "new_password": "new_secure_password",
  "confirm_password": "new_secure_password"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Password has been reset successfully"
}
```

## 3. 用户管理API

### 3.1 获取用户列表

**请求方法**: GET

**URL**: `/api/v1/users`

**功能描述**: 获取用户列表，支持分页和过滤

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20，最大50 |
| role | query | string | 否 | 按角色过滤，可选值: admin, editor, author, subscriber |
| level_id | query | integer | 否 | 按用户等级ID过滤 |
| status | query | string | 否 | 用户状态过滤，可选值: active, pending, suspended |
| search | query | string | 否 | 搜索关键词，在用户名、邮箱、显示名中匹配 |
| sort | query | string | 否 | 排序字段，默认created_at，可选值: username, email, created_at, last_login |
| sort_direction | query | string | 否 | 排序方向，默认desc，可选值: asc, desc |

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 10,
      "username": "demo_user",
      "email": "user@example.com",
      "display_name": "示例用户",
      "avatar": "https://example.com/avatars/demo_user.jpg",
      "role": "author",
      "level": {
        "id": 2,
        "name": "高级作者",
        "level": 3
      },
      "status": "active",
      "created_at": "2022-12-15T10:30:00Z",
      "last_login": "2023-01-25T14:20:30Z",
      "articles_count": 15
    },
    // 更多用户...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### 3.2 获取单个用户

**请求方法**: GET

**URL**: `/api/v1/users/{id}`
或 `/api/v1/users/by-username/{username}`

**功能描述**: 获取单个用户的详细信息

**路径参数**:
- id: 用户ID
- 或 username: 用户名

**请求头**:
- Authorization: Bearer {token} (必选，用户可查看自己的完整信息，管理员可查看所有用户)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 10,
    "username": "demo_user",
    "email": "user@example.com",
    "display_name": "示例用户",
    "first_name": "张",
    "last_name": "三",
    "avatar": "https://example.com/avatars/demo_user.jpg",
    "bio": "这是用户的个人简介...",
    "website": "https://user-website.com",
    "role": "author",
    "level": {
      "id": 2,
      "name": "高级作者",
      "level": 3,
      "max_articles": 50,
      "max_storage_mb": 500
    },
    "permissions": [
      "create_article",
      "edit_own_article",
      "publish_own_article",
      "view_article_stats"
    ],
    "status": "active",
    "created_at": "2022-12-15T10:30:00Z",
    "updated_at": "2023-01-10T15:45:20Z",
    "last_login": "2023-01-25T14:20:30Z",
    "articles_count": 15,
    "social_links": {
      "twitter": "https://twitter.com/demo_user",
      "linkedin": "https://linkedin.com/in/demo_user",
      "github": "https://github.com/demo_user"
    }
  }
}
```

### 3.3 获取当前用户信息

**请求方法**: GET

**URL**: `/api/v1/users/me`

**功能描述**: 获取当前登录用户的详细信息

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**: 同上述获取单个用户的响应格式

### 3.4 创建用户

**请求方法**: POST

**URL**: `/api/v1/users`

**功能描述**: 创建新用户

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "username": "new_user",
  "email": "new_user@example.com",
  "password": "secure_password",
  "display_name": "新用户",
  "first_name": "李",
  "last_name": "四",
  "role": "author",
  "level_id": 2,
  "status": "active",
  "send_welcome_email": true
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "User created successfully",
  "data": {
    "id": 46,
    "username": "new_user",
    "email": "new_user@example.com",
    "role": "author",
    "created_at": "2023-01-26T15:30:00Z"
  }
}
```

### 3.5 更新用户

**请求方法**: PUT

**URL**: `/api/v1/users/{id}`

**功能描述**: 更新用户信息

**路径参数**:
- id: 用户ID

**请求头**:
- Authorization: Bearer {token} (必选，用户可更新自己的基本信息，管理员可更新所有信息)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "email": "updated_email@example.com",
  "display_name": "更新后的显示名",
  "first_name": "王",
  "last_name": "五",
  "bio": "更新后的个人简介...",
  "website": "https://updated-website.com",
  "social_links": {
    "twitter": "https://twitter.com/updated_user",
    "linkedin": "https://linkedin.com/in/updated_user",
    "github": "https://github.com/updated_user"
  },
  "avatar": "https://example.com/avatars/updated_avatar.jpg"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "User updated successfully",
  "data": {
    "id": 46,
    "display_name": "更新后的显示名",
    "email": "updated_email@example.com",
    "updated_at": "2023-01-26T16:15:30Z"
  }
}
```

### 3.6 更新用户角色和等级

**请求方法**: PATCH

**URL**: `/api/v1/users/{id}/role`

**功能描述**: 更新用户角色和等级，仅管理员可操作

**路径参数**:
- id: 用户ID

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "role": "editor",
  "level_id": 3,
  "level_duration": { // 可选，等级有效期
    "start_time": "2023-01-26T00:00:00Z",
    "end_time": "2023-07-26T23:59:59Z" // null表示永久
  }
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "User role and level updated successfully",
  "data": {
    "id": 46,
    "role": "editor",
    "level": {
      "id": 3,
      "name": "资深编辑",
      "level": 4
    },
    "updated_at": "2023-01-26T16:30:45Z"
  }
}
```

### 3.7 更新用户状态

**请求方法**: PATCH

**URL**: `/api/v1/users/{id}/status`

**功能描述**: 更新用户状态，激活或禁用账户

**路径参数**:
- id: 用户ID

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "status": "suspended", // 可选值: active, pending, suspended
  "suspension_reason": "违反社区规则", // 当status为suspended时可选
  "suspension_end_date": "2023-03-01T00:00:00Z" // 可选，禁用结束时间，null表示永久
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "User status updated successfully",
  "data": {
    "id": 46,
    "status": "suspended",
    "updated_at": "2023-01-26T16:45:15Z"
  }
}
```

### 3.8 更改密码

**请求方法**: POST

**URL**: `/api/v1/users/{id}/change-password`
或 `/api/v1/users/me/change-password`

**功能描述**: 更改用户密码

**路径参数**:
- id: 用户ID（管理员使用）

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "current_password": "old_password", // 用户修改自己密码时必需
  "new_password": "new_secure_password",
  "confirm_password": "new_secure_password"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Password changed successfully"
}
```

### 3.9 删除用户

**请求方法**: DELETE

**URL**: `/api/v1/users/{id}`

**功能描述**: 删除用户账户

**路径参数**:
- id: 用户ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| delete_content | query | boolean | 否 | 是否删除用户创建的内容，默认false |
| force | query | boolean | 否 | 是否强制删除，默认false (false时为软删除) |

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "User deleted successfully"
}
```

## 4. 用户等级管理API

### 4.1 获取用户等级列表

**请求方法**: GET

**URL**: `/api/v1/user-levels`

**功能描述**: 获取系统中定义的用户等级列表

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "初级作者",
      "description": "新注册的作者初始等级",
      "level": 1,
      "max_articles": 10,
      "max_storage_mb": 100,
      "is_default": true,
      "created_at": "2022-12-01T10:00:00Z",
      "updated_at": "2022-12-01T10:00:00Z",
      "users_count": 35
    },
    {
      "id": 2,
      "name": "高级作者",
      "description": "有经验的内容创作者",
      "level": 3,
      "max_articles": 50,
      "max_storage_mb": 500,
      "is_default": false,
      "created_at": "2022-12-01T10:10:00Z",
      "updated_at": "2022-12-01T10:10:00Z",
      "users_count": 8
    },
    // 更多等级...
  ]
}
```

### 4.2 获取单个用户等级

**请求方法**: GET

**URL**: `/api/v1/user-levels/{id}`

**功能描述**: 获取单个用户等级的详细信息

**路径参数**:
- id: 用户等级ID

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 2,
    "name": "高级作者",
    "description": "有经验的内容创作者",
    "level": 3,
    "max_articles": 50,
    "max_storage_mb": 500,
    "permissions": {
      "create_article": true,
      "edit_own_article": true,
      "publish_own_article": true,
      "view_article_stats": true,
      "upload_media": true,
      "create_category": false,
      "moderate_comments": false
    },
    "is_default": false,
    "created_at": "2022-12-01T10:10:00Z",
    "updated_at": "2022-12-01T10:10:00Z",
    "users_count": 8
  }
}
```

### 4.3 创建用户等级

**请求方法**: POST

**URL**: `/api/v1/user-levels`

**功能描述**: 创建新的用户等级

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "特约编辑",
  "description": "特邀的专业编辑",
  "level": 5,
  "max_articles": 100,
  "max_storage_mb": 1000,
  "permissions": {
    "create_article": true,
    "edit_own_article": true,
    "edit_any_article": true,
    "publish_own_article": true,
    "publish_any_article": true,
    "view_article_stats": true,
    "view_detailed_stats": true,
    "upload_media": true,
    "create_category": true,
    "moderate_comments": true
  },
  "is_default": false
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "User level created successfully",
  "data": {
    "id": 5,
    "name": "特约编辑",
    "level": 5,
    "created_at": "2023-01-26T17:20:30Z"
  }
}
```

### 4.4 更新用户等级

**请求方法**: PUT

**URL**: `/api/v1/user-levels/{id}`

**功能描述**: 更新用户等级

**路径参数**:
- id: 用户等级ID

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "资深特约编辑",
  "description": "更新后的特约编辑描述",
  "level": 6,
  "max_articles": 200,
  "max_storage_mb": 2000,
  "permissions": {
    "create_article": true,
    "edit_own_article": true,
    "edit_any_article": true,
    "publish_own_article": true,
    "publish_any_article": true,
    "view_article_stats": true,
    "view_detailed_stats": true,
    "upload_media": true,
    "create_category": true,
    "moderate_comments": true,
    "manage_users": true
  },
  "is_default": false
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "User level updated successfully",
  "data": {
    "id": 5,
    "name": "资深特约编辑",
    "level": 6,
    "updated_at": "2023-01-26T17:45:15Z"
  }
}
```

### 4.5 删除用户等级

**请求方法**: DELETE

**URL**: `/api/v1/user-levels/{id}`

**功能描述**: 删除用户等级

**路径参数**:
- id: 用户等级ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| transfer_users_to | query | integer | 否 | 将该等级用户移动到指定等级ID |

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "User level deleted successfully"
}
```

## 5. 权限管理API

### 5.1 获取权限列表

**请求方法**: GET

**URL**: `/api/v1/permissions`

**功能描述**: 获取系统中所有可用权限的列表

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "key": "create_article",
      "name": "创建文章",
      "description": "允许用户创建新文章",
      "group": "content"
    },
    {
      "key": "edit_own_article",
      "name": "编辑自己的文章",
      "description": "允许用户编辑自己创建的文章",
      "group": "content"
    },
    {
      "key": "edit_any_article",
      "name": "编辑任何文章",
      "description": "允许用户编辑任何人的文章",
      "group": "content"
    },
    // 更多权限...
  ],
  "meta": {
    "groups": [
      {"id": "content", "name": "内容管理"},
      {"id": "users", "name": "用户管理"},
      {"id": "system", "name": "系统管理"}
    ]
  }
}
```

### 5.2 获取角色权限

**请求方法**: GET

**URL**: `/api/v1/roles/{role}/permissions`

**功能描述**: 获取特定角色的权限列表

**路径参数**:
- role: 角色名称，如admin, editor, author, subscriber

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "role": "editor",
    "description": "内容编辑人员",
    "permissions": [
      "create_article",
      "edit_own_article",
      "edit_any_article",
      "publish_own_article",
      "publish_any_article",
      "view_article_stats",
      "view_detailed_stats",
      "upload_media",
      "create_category",
      "edit_category",
      "create_tag",
      "edit_tag",
      "moderate_comments"
    ]
  }
}
```

### 5.3 更新角色权限

**请求方法**: PUT

**URL**: `/api/v1/roles/{role}/permissions`

**功能描述**: 更新特定角色的权限列表

**路径参数**:
- role: 角色名称，如admin, editor, author, subscriber

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "permissions": [
    "create_article",
    "edit_own_article",
    "edit_any_article",
    "publish_own_article",
    "publish_any_article",
    "view_article_stats",
    "view_detailed_stats",
    "upload_media",
    "create_category",
    "edit_category",
    "create_tag",
    "edit_tag",
    "moderate_comments",
    "manage_user_levels"
  ]
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Role permissions updated successfully",
  "data": {
    "role": "editor",
    "permissions_count": 14,
    "updated_at": "2023-01-26T18:30:45Z"
  }
}
```

## 6. 用户资料API

### 6.1 获取用户文章列表

**请求方法**: GET

**URL**: `/api/v1/users/{id}/articles`
或 `/api/v1/users/me/articles`

**功能描述**: 获取用户发布的文章列表

**路径参数**:
- id: 用户ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认10，最大50 |
| status | query | string | 否 | 文章状态过滤，可选值: draft, pending, published, archived |
| sort | query | string | 否 | 排序字段，默认published_at，可选值: created_at, updated_at, published_at, title |
| sort_direction | query | string | 否 | 排序方向，默认desc，可选值: asc, desc |

**请求头**:
- Authorization: Bearer {token} (可选，认证用户可查看自己的草稿文章)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 120,
      "title": "Python开发最佳实践",
      "slug": "python-best-practices",
      "excerpt": "本文介绍Python开发中的一些最佳实践...",
      "status": "published",
      "cover_image": "https://example.com/images/python.jpg",
      "published_at": "2023-01-03T10:25:00Z",
      "views_count": 1250,
      "likes_count": 45,
      "comments_count": 18
    },
    // 更多文章...
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 15,
    "total_pages": 2
  }
}
```

### 6.2 获取用户活动历史

**请求方法**: GET

**URL**: `/api/v1/users/{id}/activities`
或 `/api/v1/users/me/activities`

**功能描述**: 获取用户的活动历史记录

**路径参数**:
- id: 用户ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20，最大100 |
| action | query | string | 否 | 按活动类型过滤 |
| entity_type | query | string | 否 | 按实体类型过滤 |
| date_from | query | string | 否 | 活动起始日期，格式YYYY-MM-DD |
| date_to | query | string | 否 | 活动结束日期，格式YYYY-MM-DD |

**请求头**:
- Authorization: Bearer {token} (必选，用户可查看自己的活动，管理员可查看所有用户活动)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1024,
      "action": "publish",
      "entity_type": "article",
      "entity_id": 120,
      "entity": {
        "id": 120,
        "title": "Python开发最佳实践"
      },
      "created_at": "2023-01-03T10:25:00Z",
      "details": {
        "status": {
          "old": "draft",
          "new": "published"
        }
      }
    },
    {
      "id": 1018,
      "action": "create",
      "entity_type": "article",
      "entity_id": 120,
      "entity": {
        "id": 120,
        "title": "Python开发最佳实践"
      },
      "created_at": "2023-01-02T15:40:30Z",
      "details": null
    },
    // 更多活动...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 56,
    "total_pages": 3
  }
}
```

## 7. 权限要求

| API端点 | 所需权限 |
|---------|---------|
| 认证API (登录、刷新令牌、密码重置) | 匿名可访问 |
| GET /users | 需`view_users`权限 |
| GET /users/{id} | 自己的信息：无需特殊权限<br>他人信息：需`view_users`权限 |
| POST /users | 需`create_user`权限 |
| PUT /users/{id} | 自己的基本信息：无需特殊权限<br>他人信息：需`edit_users`权限 |
| PATCH /users/{id}/role<br>PATCH /users/{id}/status | 需`manage_users`权限 |
| DELETE /users/{id} | 需`delete_users`权限 |
| 用户等级API | 需`manage_user_levels`权限 |
| 权限管理API | 需`manage_permissions`权限 |
| GET /users/{id}/articles | 公开文章：匿名可访问<br>自己的私有文章：无需特殊权限<br>他人私有文章：需`view_users`和`view_all_drafts`权限 |
| GET /users/{id}/activities | 自己的活动：无需特殊权限<br>他人活动：需`view_users`和`view_user_activities`权限 | 
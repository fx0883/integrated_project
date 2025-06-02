# API 文档

## 简介

本文档详细介绍了集成管理系统提供的所有API接口，包括请求参数、响应格式和示例。这些API可用于系统集成、自定义开发和第三方应用对接。

## 通用说明

### 基础URL

所有API请求都应该发送到以下基础URL：

```
https://<域名>/api
```

### 认证方式

系统使用基于Token的认证机制，每次请求需要在HTTP头部包含认证信息：

```
Authorization: Bearer <your_token>
```

获取Token的方法请参考[用户认证](#用户认证)部分。

### 响应格式

所有API返回标准JSON格式，结构如下：

```json
{
  "success": true,       // 请求是否成功
  "code": 200,           // 状态码
  "message": "Success",  // 状态描述
  "data": {}             // 返回数据
}
```

### 错误处理

当API请求失败时，会返回以下格式：

```json
{
  "success": false,
  "code": 400,           // 错误码
  "message": "错误描述",  // 错误信息
  "data": null
}
```

常见错误码：
- 400：请求参数错误
- 401：未授权
- 403：权限不足
- 404：资源不存在
- 500：服务器内部错误

## API列表

### 用户认证

#### 登录

- **URL:** `/auth/login`
- **方法:** POST
- **说明:** 获取访问令牌
- **请求参数:**

```json
{
  "username": "admin",
  "password": "password",
  "remember_me": true
}
```

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "roles": ["super_admin"]
    }
  }
}
```

#### 刷新Token

- **URL:** `/auth/refresh`
- **方法:** POST
- **说明:** 使用刷新令牌获取新的访问令牌
- **请求参数:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

#### 注销

- **URL:** `/auth/logout`
- **方法:** POST
- **说明:** 使当前Token失效
- **请求参数:** 无需参数
- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "已成功注销",
  "data": null
}
```

### 用户管理

#### 获取用户列表

- **URL:** `/users`
- **方法:** GET
- **说明:** 获取用户列表
- **请求参数:**
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认20
  - `keyword`: 搜索关键词
  - `status`: 用户状态筛选
  - `tenant_id`: 租户ID筛选

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "nickname": "超级管理员",
        "status": "active",
        "tenant_id": null,
        "created_at": "2023-08-01T00:00:00Z"
      }
    ],
    "total": 1
  }
}
```

#### 创建用户

- **URL:** `/users`
- **方法:** POST
- **说明:** 创建新用户
- **请求参数:**

```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password",
  "nickname": "新用户",
  "tenant_id": 1,
  "is_admin": false,
  "status": "active"
}
```

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "用户创建成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "user@example.com",
    "nickname": "新用户",
    "status": "active",
    "tenant_id": 1,
    "created_at": "2023-10-19T10:30:00Z"
  }
}
```

### 租户管理

#### 获取租户列表

- **URL:** `/tenants`
- **方法:** GET
- **说明:** 获取租户列表
- **请求参数:**
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认20
  - `keyword`: 搜索关键词
  - `status`: 租户状态筛选

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "测试租户",
        "description": "这是一个测试租户",
        "status": "active",
        "created_at": "2023-08-01T00:00:00Z",
        "user_count": 5
      }
    ],
    "total": 1
  }
}
```

#### 创建租户

- **URL:** `/tenants`
- **方法:** POST
- **说明:** 创建新租户
- **请求参数:**

```json
{
  "name": "新租户",
  "description": "这是一个新租户",
  "status": "active",
  "admin_email": "admin@tenant.com",
  "admin_name": "租户管理员"
}
```

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "租户创建成功",
  "data": {
    "id": 2,
    "name": "新租户",
    "description": "这是一个新租户",
    "status": "active",
    "created_at": "2023-10-19T10:35:00Z"
  }
}
```

### CMS内容管理

#### 获取文章列表

- **URL:** `/cms/articles`
- **方法:** GET
- **说明:** 获取文章列表
- **请求参数:**
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认20
  - `keyword`: 搜索关键词
  - `category_id`: 分类ID筛选
  - `tag_id`: 标签ID筛选
  - `status`: 文章状态筛选

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "测试文章",
        "summary": "这是一篇测试文章",
        "author": "admin",
        "category_name": "技术",
        "view_count": 100,
        "comment_count": 5,
        "created_at": "2023-10-01T00:00:00Z",
        "status": "published"
      }
    ],
    "total": 1
  }
}
```

#### 创建文章

- **URL:** `/cms/articles`
- **方法:** POST
- **说明:** 创建新文章
- **请求参数:**

```json
{
  "title": "新文章",
  "content": "这是新文章的内容...",
  "summary": "文章摘要",
  "category_id": 1,
  "tag_ids": [1, 2],
  "status": "draft",
  "cover_image": "https://example.com/image.jpg"
}
```

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "文章创建成功",
  "data": {
    "id": 2,
    "title": "新文章",
    "summary": "文章摘要",
    "author_id": 1,
    "author": "admin",
    "category_id": 1,
    "created_at": "2023-10-19T10:40:00Z",
    "status": "draft"
  }
}
```

### 打卡系统

#### 获取打卡任务列表

- **URL:** `/check/tasks`
- **方法:** GET
- **说明:** 获取打卡任务列表
- **请求参数:**
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认20
  - `status`: 任务状态筛选

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "每日打卡",
        "description": "工作日每天必须打卡",
        "start_date": "2023-10-01",
        "end_date": "2023-10-31",
        "creator": "admin",
        "status": "active",
        "participant_count": 10
      }
    ],
    "total": 1
  }
}
```

#### 提交打卡记录

- **URL:** `/check/records`
- **方法:** POST
- **说明:** 提交打卡记录
- **请求参数:**

```json
{
  "task_id": 1,
  "check_date": "2023-10-19",
  "content": "今天的打卡内容",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "location": "北京市朝阳区"
}
```

- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "打卡成功",
  "data": {
    "id": 101,
    "task_id": 1,
    "user_id": 1,
    "check_date": "2023-10-19",
    "created_at": "2023-10-19T10:45:00Z",
    "status": "approved"
  }
}
```

### 仪表盘数据

#### 获取超级管理员仪表盘数据

- **URL:** `/dashboard/super-admin`
- **方法:** GET
- **说明:** 获取超级管理员仪表盘数据
- **请求参数:** 无需参数
- **响应示例:**

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {
    "system_overview": {
      "total_users": 100,
      "active_users": 80,
      "total_tenants": 5,
      "active_tenants": 4,
      "total_articles": 200,
      "total_comments": 500,
      "total_check_ins": 1000,
      "check_in_completion_rate": 85,
      "server_status": {
        "cpu_usage": 25,
        "memory_usage": 40,
        "disk_usage": 30,
        "uptime": 864000
      }
    },
    "tenant_statistics": [...],
    "user_activity": [...],
    "content_statistics": [...],
    "check_in_completion": [...]
  }
}
```

## 其他文档

如需了解更多API接口信息，请参考以下详细文档：

1. [用户认证API](./auth.md)
2. [用户管理API](./users.md)
3. [租户管理API](./tenants.md)
4. [CMS管理API](./cms.md)
5. [打卡系统API](./check.md)
6. [数据统计API](./statistics.md)
7. [系统管理API](./system.md) 
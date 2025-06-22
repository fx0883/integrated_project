# CMS系统API接口使用指南

## API接口概述

CMS系统API基于REST架构设计，所有接口均返回JSON格式的数据。API使用JWT认证机制保证安全性，并支持多租户隔离。本文档提供了主要API端点的使用说明和示例。

## 认证方式

大部分API需要认证才能访问，认证方式为JWT Token认证：

```
Authorization: Bearer {your_access_token}
```

对于需要指定租户的请求，需添加租户头信息：

```
X-Tenant-ID: {tenant_id}
```

## 1. 权限控制概述

CMS系统的API权限控制遵循以下规则：

### 查询操作（GET请求）
- 不需要token认证，允许匿名访问
- 需要在请求头中包含`X-Tenant-ID`参数来指定租户
- 如果有token，则通过token获取租户ID
- 如果没有token，则检查`X-Tenant-ID`是否存在，存在则继续，不存在则报错

### 修改操作（POST、PUT、PATCH、DELETE等）
- 需要token认证
- 通过token获取用户关联的租户ID
- 如果用户没有关联租户ID，则报错
- 超级管理员因无关联租户ID，不能操作CMS数据

## 2. 请求头要求

### 查询请求
```
GET /api/cms/articles/
X-Tenant-ID: 1
```

或者（带认证）:
```
GET /api/cms/articles/
Authorization: Bearer <token>
```

### 修改请求
```
POST /api/cms/articles/
Authorization: Bearer <token>
Content-Type: application/json
```

## 3. 租户ID处理流程

1. 首先判断是否是GET请求
   - 如果是GET请求，检查是否有token
     - 有token：通过token获取租户ID
     - 无token：检查`X-Tenant-ID`是否存在
       - 存在：使用`X-Tenant-ID`
       - 不存在：返回错误

2. 对于其他类型的请求（POST、PUT、PATCH、DELETE等）
   - 检查是否有token
     - 有token：通过token获取租户ID，检查用户是否关联租户
       - 关联：继续处理请求
       - 未关联：返回错误
     - 无token：返回未认证错误

## 4. API响应格式

所有API响应（包括成功和错误响应）都遵循以下统一格式：

```json
{
  "success": true/false,     // 布尔值，表示请求是否成功
  "code": 2000,              // 业务状态码，表示具体状态
  "message": "操作成功/失败信息", // 提示消息
  "data": {                  // 响应数据主体
    // 具体业务数据
  }
}
```

### 字段说明

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| success | Boolean | 请求是否成功，true表示成功，false表示失败 |
| code | Integer | 业务状态码，表示具体状态 |
| message | String | 操作结果的文字描述，成功或错误提示 |
| data | Object/Array/null | 响应的具体数据，错误时可能为null或包含错误详情 |

### 常见业务状态码

| 业务状态码 | 描述 | HTTP状态码 |
| --------- | ---- | --------- |
| 2000      | 操作成功 | 200 OK |
| 4000      | 请求参数错误 | 400 Bad Request |
| 4001      | 认证失败 | 401 Unauthorized |
| 4003      | 权限不足 | 403 Forbidden |
| 4004      | 资源不存在 | 404 Not Found |

## 5. 错误处理

### 常见错误响应

1. 未提供租户ID（GET请求）
```json
{
  "success": false,
  "code": 4000,
  "message": "未提供租户ID，无法访问CMS资源",
  "data": null
}
```

2. 未认证（非GET请求）
```json
{
  "success": false,
  "code": 4001,
  "message": "身份认证信息未提供",
  "data": null
}
```

3. 用户未关联租户
```json
{
  "success": false,
  "code": 4003,
  "message": "用户未关联租户，无法访问CMS系统",
  "data": null
}
```

4. 租户ID不匹配
```json
{
  "success": false,
  "code": 4003,
  "message": "无法访问其他租户的资源",
  "data": null
}
```

## 6. 最佳实践

1. 前端应用在初始化时应设置默认的租户ID
2. 对于匿名访问的页面，始终在请求头中包含`X-Tenant-ID`
3. 对于需要认证的操作，确保用户已登录并获取有效token
4. 处理错误响应时，对租户相关错误提供友好的用户提示

## 7. API端点列表

CMS系统提供以下主要API端点：

| 端点 | 方法 | 描述 | 权限要求 |
|------|------|------|----------|
| `/api/cms/articles/` | GET | 获取文章列表 | 匿名访问，需要租户ID |
| `/api/cms/articles/` | POST | 创建文章 | 需认证，需关联租户 |
| `/api/cms/articles/{id}/` | GET | 获取文章详情 | 匿名访问，需要租户ID |
| `/api/cms/articles/{id}/` | PUT | 更新文章 | 需认证，需关联租户 |
| `/api/cms/articles/{id}/` | DELETE | 删除文章 | 需认证，需关联租户 |
| `/api/cms/categories/` | GET | 获取分类列表 | 匿名访问，需要租户ID |
| `/api/cms/tags/` | GET | 获取标签列表 | 匿名访问，需要租户ID |
| `/api/cms/comments/` | GET | 获取评论列表 | 匿名访问，需要租户ID |
| `/api/cms/comments/` | POST | 创建评论 | 需认证，需关联租户 |

## 文章管理API

### 获取文章列表

```
GET /api/cms/articles/
```

#### 查询参数

| 参数 | 类型 | 说明 |
|-----|------|-----|
| page | int | 页码，默认1 |
| per_page | int | 每页数量，默认10，最大50 |
| status | string | 文章状态过滤 (draft, pending, published, archived) |
| category_id | int | 按分类ID过滤 |
| tag_id | int | 按标签ID过滤 |
| author_id | int | 按作者ID过滤 |
| search | string | 搜索关键词，在标题和内容中匹配 |
| sort | string | 排序字段 (created_at, updated_at, published_at, title, views_count) |
| sort_direction | string | 排序方向 (asc, desc) |
| is_featured | boolean | 是否只返回特色文章 |
| is_pinned | boolean | 是否只返回置顶文章 |
| visibility | string | 可见性过滤 (public, private, password) |
| date_from | string | 发布日期起始，格式YYYY-MM-DD |
| date_to | string | 发布日期截止，格式YYYY-MM-DD |

#### 请求示例

```
GET /api/cms/articles/?status=published&category_id=3&search=技术&sort=published_at&sort_direction=desc&page=1&per_page=10
```

#### 响应示例

```json
{
  "count": 42,
  "next": "http://example.com/api/cms/articles/?page=2&per_page=10&status=published",
  "previous": null,
  "results": [
    {
      "id": 123,
      "title": "Django REST框架使用指南",
      "slug": "django-rest-framework-guide",
      "excerpt": "本文将介绍如何使用Django REST框架构建高效的API...",
      "author": 1,
      "author_info": {
        "id": 1,
        "username": "admin",
        "first_name": "系统",
        "last_name": "管理员",
        "email": "admin@example.com"
      },
      "status": "published",
      "is_featured": true,
      "is_pinned": false,
      "cover_image": "https://example.com/images/cover.jpg",
      "published_at": "2023-06-15T08:30:00Z",
      "categories": [
        {"id": 3, "name": "技术教程", "slug": "tech-tutorials"}
      ],
      "tags": [
        {"id": 5, "name": "Django", "slug": "django", "color": "#092e20"},
        {"id": 8, "name": "REST API", "slug": "rest-api", "color": "#7a7a7a"}
      ],
      "comments_count": 12,
      "likes_count": 56,
      "views_count": 1243
    },
    // 更多文章...
  ]
}
```

### 获取单篇文章

```
GET /api/cms/articles/{id}/
```

#### 查询参数

| 参数 | 类型 | 说明 |
|-----|------|-----|
| password | string | 访问密码，当文章可见性为password时需提供 |
| version | int | 文章版本号，默认返回最新版本 |

#### 响应示例

```json
{
  "id": 123,
  "title": "Django REST框架使用指南",
  "slug": "django-rest-framework-guide",
  "content": "# Django REST框架使用指南\n\n本文将介绍如何使用Django REST框架构建高效的API...",
  "content_type": "markdown",
  "excerpt": "本文将介绍如何使用Django REST框架构建高效的API...",
  "author": 1,
  "author_info": {
    "id": 1,
    "username": "admin",
    "first_name": "系统",
    "last_name": "管理员",
    "email": "admin@example.com"
  },
  "status": "published",
  "is_featured": true,
  "is_pinned": false,
  "allow_comment": true,
  "visibility": "public",
  "created_at": "2023-06-10T15:30:00Z",
  "updated_at": "2023-06-15T08:30:00Z",
  "published_at": "2023-06-15T08:30:00Z",
  "cover_image": "https://example.com/images/cover.jpg",
  "template": "default",
  "sort_order": 0,
  "tenant": 1,
  "tenant_info": {
    "id": 1,
    "name": "主站",
    "code": "main"
  },
  "categories": [
    {"id": 3, "name": "技术教程", "slug": "tech-tutorials"}
  ],
  "tags": [
    {"id": 5, "name": "Django", "slug": "django", "color": "#092e20"},
    {"id": 8, "name": "REST API", "slug": "rest-api", "color": "#7a7a7a"}
  ],
  "meta": {
    "id": 123,
    "article": 123,
    "seo_title": "Django REST框架完全使用指南 | 技术博客",
    "seo_description": "本文详细介绍了如何使用Django REST框架构建高效、安全、可扩展的RESTful API",
    "seo_keywords": "Django,REST,API,框架,后端,Python",
    "og_title": "Django REST框架使用指南",
    "og_description": "学习如何使用Django REST框架构建专业级API",
    "og_image": "https://example.com/images/og-cover.jpg",
    "canonical_url": "https://example.com/blog/django-rest-framework-guide",
    "robots": "index,follow",
    "created_at": "2023-06-10T15:30:00Z",
    "updated_at": "2023-06-15T08:30:00Z"
  },
  "stats": {
    "id": 123,
    "article": 123,
    "views_count": 1243,
    "unique_views_count": 986,
    "likes_count": 56,
    "dislikes_count": 2,
    "comments_count": 12,
    "shares_count": 34,
    "bookmarks_count": 78,
    "avg_reading_time": 180,
    "bounce_rate": 25.5,
    "last_updated_at": "2023-06-18T10:15:23Z"
  },
  "version_info": {
    "current_version": 3,
    "last_updated_by": {
      "id": 1,
      "username": "admin",
      "first_name": "系统",
      "last_name": "管理员"
    },
    "last_updated_at": "2023-06-15T08:30:00Z"
  }
}
```

### 创建文章

```
POST /api/cms/articles/
```

#### 请求参数

| 参数 | 类型 | 是否必须 | 说明 |
|-----|------|---------|-----|
| title | string | 是 | 文章标题 |
| content | string | 是 | 文章内容 |
| content_type | string | 否 | 内容类型，默认markdown |
| excerpt | string | 否 | 文章摘要 |
| status | string | 否 | 文章状态，默认draft |
| is_featured | boolean | 否 | 是否特色文章 |
| is_pinned | boolean | 否 | 是否置顶 |
| allow_comment | boolean | 否 | 是否允许评论 |
| visibility | string | 否 | 可见性，默认public |
| password | string | 否 | 访问密码，当visibility为password时需要 |
| cover_image | string | 否 | 封面图片URL |
| template | string | 否 | 文章使用的模板 |
| category_ids | array | 否 | 分类ID数组 |
| tag_ids | array | 否 | 标签ID数组 |
| meta | object | 否 | 文章元数据 |
| create_new_version | boolean | 否 | 是否创建新版本，默认true |
| change_description | string | 否 | 变更描述 |
| publish_now | boolean | 否 | 是否立即发布，默认false |
| scheduled_publish_time | string | 否 | 计划发布时间 |

#### 请求示例

```json
{
  "title": "Django REST框架使用指南",
  "content": "# Django REST框架使用指南\n\n本文将介绍如何使用Django REST框架构建高效的API...",
  "content_type": "markdown",
  "excerpt": "本文将介绍如何使用Django REST框架构建高效的API...",
  "status": "draft",
  "is_featured": false,
  "is_pinned": false,
  "allow_comment": true,
  "visibility": "public",
  "cover_image": "https://example.com/images/cover.jpg",
  "template": "default",
  "category_ids": [3, 5],
  "tag_ids": [5, 8, 12],
  "meta": {
    "seo_title": "Django REST框架完全使用指南 | 技术博客",
    "seo_description": "本文详细介绍了如何使用Django REST框架构建高效、安全、可扩展的RESTful API",
    "seo_keywords": "Django,REST,API,框架,后端,Python"
  },
  "change_description": "初始创建",
  "publish_now": false
}
```

### 更新文章

```
PUT /api/cms/articles/{id}/
PATCH /api/cms/articles/{id}/  // 部分更新
```

请求参数与创建文章相同，PATCH请求可以只包含需要更新的字段。

### 删除文章

```
DELETE /api/cms/articles/{id}/
```

#### 查询参数

| 参数 | 类型 | 说明 |
|-----|------|-----|
| force | boolean | 是否强制删除，默认false (false时为软删除) |

### 文章特定操作

#### 获取文章版本历史

```
GET /api/cms/articles/{id}/versions/
```

#### 获取特定版本的文章

```
GET /api/cms/articles/{id}/versions/{version_number}/
```

#### 获取文章统计数据

```
GET /api/cms/articles/{id}/statistics/
```

#### 记录文章阅读

```
POST /api/cms/articles/{id}/view/
```

请求体：
```json
{
  "session_id": "user-session-123",
  "reading_time": 180,
  "referrer": "https://www.google.com"
}
```

#### 发布文章

```
POST /api/cms/articles/{id}/publish/
```

#### 取消发布文章

```
POST /api/cms/articles/{id}/unpublish/
```

#### 归档文章

```
POST /api/cms/articles/{id}/archive/
```

#### 批量删除文章

```
DELETE /api/cms/articles/batch/
```

请求体：
```json
{
  "article_ids": [1, 2, 3],
  "force": false
}
```

## 分类管理API

### 获取分类列表

```
GET /api/cms/categories/
```

#### 查询参数

| 参数 | 类型 | 说明 |
|-----|------|-----|
| parent | int | 父分类ID |
| is_active | boolean | 是否激活 |
| search | string | 搜索关键词 |

### 获取分类树

```
GET /api/cms/categories/tree/
```

### 创建分类

```
POST /api/cms/categories/
```

#### 请求参数

| 参数 | 类型 | 是否必须 | 说明 |
|-----|------|---------|-----|
| name | string | 是 | 分类名称 |
| slug | string | 否 | URL别名，不提供时自动生成 |
| description | string | 否 | 分类描述 |
| parent | integer | 否 | 父分类ID |
| cover_image | string | 否 | 封面图片URL |
| sort_order | integer | 否 | 排序顺序 |
| is_active | boolean | 否 | 是否激活 |
| seo_title | string | 否 | SEO标题 |
| seo_description | string | 否 | SEO描述 |

### 更新/删除分类

```
PUT /api/cms/categories/{id}/
PATCH /api/cms/categories/{id}/
DELETE /api/cms/categories/{id}/
```

## 标签管理API

### 获取标签组列表

```
GET /api/cms/tag-groups/
```

### 获取标签列表

```
GET /api/cms/tags/
```

#### 查询参数

| 参数 | 类型 | 说明 |
|-----|------|-----|
| group | int | 标签组ID |
| is_active | boolean | 是否激活 |
| search | string | 搜索关键词 |

### 获取标签使用统计

```
GET /api/cms/tags/usage-stats/
```

### 创建标签

```
POST /api/cms/tags/
```

#### 请求参数

| 参数 | 类型 | 是否必须 | 说明 |
|-----|------|---------|-----|
| name | string | 是 | 标签名称 |
| slug | string | 否 | URL别名，不提供时自动生成 |
| description | string | 否 | 标签描述 |
| group | integer | 否 | 标签组ID |
| color | string | 否 | 标签颜色代码 |
| is_active | boolean | 否 | 是否激活 |

### 更新/删除标签

```
PUT /api/cms/tags/{id}/
PATCH /api/cms/tags/{id}/
DELETE /api/cms/tags/{id}/
```

## 评论管理API

### 获取评论列表

```
GET /api/cms/comments/
```

#### 查询参数

| 参数 | 类型 | 说明 |
|-----|------|-----|
| article | int | 文章ID |
| parent | int | 父评论ID |
| user | int | 用户ID |
| status | string | 状态 |
| is_pinned | boolean | 是否置顶 |
| search | string | 搜索关键词 |

### 获取评论回复

```
GET /api/cms/comments/{id}/replies/
```

### 创建评论

```
POST /api/cms/comments/
```

#### 请求参数

| 参数 | 类型 | 是否必须 | 说明 |
|-----|------|---------|-----|
| article | integer | 是 | 文章ID |
| parent | integer | 否 | 父评论ID |
| content | string | 是 | 评论内容 |
| guest_name | string | 条件 | 游客名称（用户未登录时必须） |
| guest_email | string | 条件 | 游客邮箱（用户未登录时必须） |
| guest_website | string | 否 | 游客网站 |

### 评论管理操作

```
POST /api/cms/comments/{id}/approve/     # 批准评论
POST /api/cms/comments/{id}/reject/      # 拒绝评论
POST /api/cms/comments/{id}/mark-spam/   # 标记为垃圾评论
```

### 批量处理评论

```
POST /api/cms/comments/batch/
```

请求体：
```json
{
  "comment_ids": [1, 2, 3],
  "action": "approve"  // approve, reject, spam, delete
}
```

## API文档

完整的API文档可通过Swagger UI查看：

```
/api/schema/swagger-ui/
```

或者通过ReDoc查看：

```
/api/schema/redoc/
``` 
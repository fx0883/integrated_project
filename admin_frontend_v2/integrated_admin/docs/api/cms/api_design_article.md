# CMS系统API设计文档 - 文章管理

## 1. 文章管理API概述

文章管理API提供对CMS系统中文章资源的完整管理功能，包括文章的创建、读取、更新、删除(CRUD)、版本控制、元数据管理等功能。API符合RESTful设计原则，使用JSON格式进行数据交换。

## 2. 文章基础API

### 2.1 获取文章列表

**请求方法**: GET

**URL**: `/api/v1/articles`

**功能描述**: 获取文章列表，支持分页、排序和多种过滤条件

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认10，最大50 |
| status | query | string | 否 | 文章状态过滤，可选值: draft, pending, published, archived |
| category_id | query | integer | 否 | 按分类ID过滤 |
| tag_id | query | integer | 否 | 按标签ID过滤 |
| author_id | query | integer | 否 | 按作者ID过滤 |
| search | query | string | 否 | 搜索关键词，在标题和内容中匹配 |
| sort | query | string | 否 | 排序字段，默认published_at，可选值: created_at, updated_at, published_at, title, views_count |
| sort_direction | query | string | 否 | 排序方向，默认desc，可选值: asc, desc |
| is_featured | query | boolean | 否 | 是否只返回特色文章 |
| is_pinned | query | boolean | 否 | 是否只返回置顶文章 |
| visibility | query | string | 否 | 可见性过滤，可选值: public, private, password |
| date_from | query | string | 否 | 发布日期起始，格式YYYY-MM-DD |
| date_to | query | string | 否 | 发布日期截止，格式YYYY-MM-DD |

**请求头**:
- Authorization: Bearer {token} (可选，认证用户可查看更多状态的文章)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "title": "示例文章标题",
      "slug": "sample-article-title",
      "excerpt": "这是文章摘要内容...",
      "author": {
        "id": 1,
        "username": "author1",
        "display_name": "示例作者"
      },
      "status": "published",
      "is_featured": false,
      "is_pinned": false,
      "cover_image": "https://example.com/images/cover1.jpg",
      "published_at": "2023-01-15T08:30:00Z",
      "categories": [
        {
          "id": 3,
          "name": "技术",
          "slug": "technology"
        }
      ],
      "tags": [
        {
          "id": 5,
          "name": "编程",
          "slug": "programming"
        }
      ],
      "comments_count": 15,
      "likes_count": 42,
      "views_count": 1024
    },
    // 更多文章...
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 156,
    "total_pages": 16
  }
}
```

### 2.2 获取单篇文章

**请求方法**: GET

**URL**: `/api/v1/articles/{id}`
或 `/api/v1/articles/by-slug/{slug}`

**功能描述**: 通过ID或者slug获取单篇文章的详细信息

**路径参数**:
- id: 文章ID
- 或 slug: 文章slug

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| password | query | string | 否 | 访问密码，当文章可见性为password时需提供 |
| version | query | integer | 否 | 文章版本号，默认返回最新版本 |

**请求头**:
- Authorization: Bearer {token} (可选，认证用户可查看草稿等非公开文章)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "title": "示例文章详细标题",
    "slug": "sample-article-detailed-title",
    "content": "这里是文章的详细内容，支持Markdown或HTML格式...",
    "content_type": "markdown",
    "excerpt": "这是文章摘要内容...",
    "author": {
      "id": 1,
      "username": "author1",
      "display_name": "示例作者",
      "avatar": "https://example.com/avatars/author1.jpg",
      "bio": "作者简介..."
    },
    "status": "published",
    "is_featured": false,
    "is_pinned": false,
    "allow_comment": true,
    "visibility": "public",
    "cover_image": "https://example.com/images/cover1.jpg",
    "created_at": "2023-01-10T14:25:30Z",
    "updated_at": "2023-01-14T09:12:45Z",
    "published_at": "2023-01-15T08:30:00Z",
    "categories": [
      {
        "id": 3,
        "name": "技术",
        "slug": "technology"
      }
    ],
    "tags": [
      {
        "id": 5,
        "name": "编程",
        "slug": "programming",
        "color": "#3498db"
      },
      {
        "id": 8,
        "name": "教程",
        "slug": "tutorial",
        "color": "#2ecc71"
      }
    ],
    "meta": {
      "seo_title": "SEO优化的文章标题 - 网站名",
      "seo_description": "为搜索引擎优化的文章描述...",
      "og_image": "https://example.com/images/og_cover1.jpg"
    },
    "stats": {
      "views_count": 1024,
      "likes_count": 42,
      "comments_count": 15,
      "shares_count": 8,
      "bookmarks_count": 20,
      "avg_reading_time": 300
    },
    "version_info": {
      "current_version": 3,
      "last_updated_by": {
        "id": 2,
        "username": "editor1",
        "display_name": "编辑人员"
      },
      "last_updated_at": "2023-01-14T09:12:45Z"
    }
  }
}
```

### 2.3 创建文章

**请求方法**: POST

**URL**: `/api/v1/articles`

**功能描述**: 创建新文章

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "title": "新文章标题",
  "content": "文章详细内容...",
  "content_type": "markdown",
  "excerpt": "文章摘要...",
  "status": "draft",
  "is_featured": false,
  "is_pinned": false,
  "allow_comment": true,
  "visibility": "public",
  "password": null,
  "cover_image": "https://example.com/images/new_cover.jpg",
  "template": null,
  "category_ids": [2, 5],
  "tag_ids": [3, 8, 12],
  "meta": {
    "seo_title": "SEO标题",
    "seo_description": "SEO描述",
    "seo_keywords": "关键词1,关键词2",
    "og_title": "Open Graph标题",
    "og_description": "Open Graph描述",
    "og_image": "https://example.com/images/og_image.jpg"
  },
  "publish_now": false,
  "scheduled_publish_time": "2023-02-01T10:00:00Z"
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "Article created successfully",
  "data": {
    "id": 157,
    "title": "新文章标题",
    "slug": "xin-wen-zhang-biao-ti",
    "status": "draft",
    "created_at": "2023-01-20T15:40:22Z",
    "author": {
      "id": 1,
      "username": "author1",
      "display_name": "示例作者"
    }
  }
}
```

### 2.4 更新文章

**请求方法**: PUT

**URL**: `/api/v1/articles/{id}`

**功能描述**: 全量更新文章

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "title": "更新后的文章标题",
  "content": "更新后的文章内容...",
  "content_type": "markdown",
  "excerpt": "更新后的文章摘要...",
  "status": "pending",
  "is_featured": true,
  "is_pinned": false,
  "allow_comment": true,
  "visibility": "public",
  "password": null,
  "cover_image": "https://example.com/images/updated_cover.jpg",
  "template": null,
  "category_ids": [2, 7],
  "tag_ids": [3, 9],
  "meta": {
    "seo_title": "更新后的SEO标题",
    "seo_description": "更新后的SEO描述",
    "seo_keywords": "关键词1,关键词2,关键词3",
    "og_title": "更新后的Open Graph标题",
    "og_description": "更新后的Open Graph描述",
    "og_image": "https://example.com/images/updated_og_image.jpg"
  },
  "change_description": "更新了文章内容和标签",
  "create_new_version": true
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Article updated successfully",
  "data": {
    "id": 157,
    "title": "更新后的文章标题",
    "slug": "geng-xin-hou-de-wen-zhang-biao-ti",
    "status": "pending",
    "updated_at": "2023-01-21T09:15:30Z",
    "version": 2
  }
}
```

### 2.5 部分更新文章

**请求方法**: PATCH

**URL**: `/api/v1/articles/{id}`

**功能描述**: 部分更新文章，只更新提供的字段

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "status": "published",
  "is_featured": true,
  "published_at": "2023-01-21T10:00:00Z"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Article updated successfully",
  "data": {
    "id": 157,
    "title": "更新后的文章标题",
    "status": "published",
    "is_featured": true,
    "published_at": "2023-01-21T10:00:00Z",
    "updated_at": "2023-01-21T09:45:12Z"
  }
}
```

### 2.6 删除文章

**请求方法**: DELETE

**URL**: `/api/v1/articles/{id}`

**功能描述**: 删除指定ID的文章

**路径参数**:
- id: 文章ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| force | query | boolean | 否 | 是否强制删除，默认false (false时为软删除) |

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Article deleted successfully"
}
```

## 3. 文章扩展API

### 3.1 文章版本管理

#### 3.1.1 获取文章版本历史

**请求方法**: GET

**URL**: `/api/v1/articles/{id}/versions`

**功能描述**: 获取文章的版本历史列表

**路径参数**:
- id: 文章ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20 |

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "version_number": 3,
      "editor": {
        "id": 2,
        "username": "editor1",
        "display_name": "编辑人员"
      },
      "created_at": "2023-01-14T09:12:45Z",
      "change_description": "更新了封面图片和分类"
    },
    {
      "version_number": 2,
      "editor": {
        "id": 1,
        "username": "author1",
        "display_name": "示例作者"
      },
      "created_at": "2023-01-12T14:30:10Z",
      "change_description": "修正了部分拼写错误"
    },
    {
      "version_number": 1,
      "editor": {
        "id": 1,
        "username": "author1",
        "display_name": "示例作者"
      },
      "created_at": "2023-01-10T14:25:30Z",
      "change_description": "初始版本"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 3,
    "total_pages": 1
  }
}
```

#### 3.1.2 获取特定版本文章

**请求方法**: GET

**URL**: `/api/v1/articles/{id}/versions/{version_number}`

**功能描述**: 获取文章的特定版本内容

**路径参数**:
- id: 文章ID
- version_number: 版本号

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "version_number": 2,
    "title": "第二版文章标题",
    "content": "第二版文章内容...",
    "content_type": "markdown",
    "excerpt": "第二版文章摘要...",
    "editor": {
      "id": 1,
      "username": "author1",
      "display_name": "示例作者"
    },
    "created_at": "2023-01-12T14:30:10Z",
    "change_description": "修正了部分拼写错误",
    "diff_data": {
      "title": {
        "old": "第一版文章标题",
        "new": "第二版文章标题"
      },
      "content": {
        "diff": "文本差异内容..."
      }
    }
  }
}
```

#### 3.1.3 恢复到指定版本

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/versions/{version_number}/restore`

**功能描述**: 将文章恢复到指定的历史版本

**路径参数**:
- id: 文章ID
- version_number: 版本号

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "change_description": "恢复到版本2",
  "create_new_version": true
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Article restored to version 2",
  "data": {
    "id": 1,
    "current_version": 4,
    "title": "第二版文章标题",
    "updated_at": "2023-01-21T16:45:30Z"
  }
}
```

### 3.2 文章元数据管理

#### 3.2.1 获取文章元数据

**请求方法**: GET

**URL**: `/api/v1/articles/{id}/meta`

**功能描述**: 获取文章的SEO和社交媒体元数据

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "seo_title": "SEO优化的文章标题 - 网站名",
    "seo_description": "为搜索引擎优化的文章描述...",
    "seo_keywords": "关键词1,关键词2,关键词3",
    "og_title": "Open Graph标题",
    "og_description": "Open Graph描述",
    "og_image": "https://example.com/images/og_image.jpg",
    "schema_markup": "JSON-LD结构化数据...",
    "canonical_url": "https://example.com/articles/sample-article",
    "robots": "index,follow",
    "custom_meta": {
      "twitter:card": "summary_large_image"
    }
  }
}
```

#### 3.2.2 更新文章元数据

**请求方法**: PUT

**URL**: `/api/v1/articles/{id}/meta`

**功能描述**: 更新文章的SEO和社交媒体元数据

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "seo_title": "更新后的SEO标题 - 网站名",
  "seo_description": "更新后的SEO描述...",
  "seo_keywords": "新关键词1,新关键词2,新关键词3",
  "og_title": "更新后的Open Graph标题",
  "og_description": "更新后的Open Graph描述",
  "og_image": "https://example.com/images/new_og_image.jpg",
  "schema_markup": "更新后的JSON-LD数据...",
  "canonical_url": "https://example.com/articles/new-sample-article",
  "robots": "noindex,follow",
  "custom_meta": {
    "twitter:card": "summary",
    "twitter:creator": "@username"
  }
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Article metadata updated successfully",
  "data": {
    "id": 1,
    "updated_at": "2023-01-21T17:20:15Z"
  }
}
```

### 3.3 文章状态管理

#### 3.3.1 发布文章

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/publish`

**功能描述**: 将文章状态改为已发布

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "published_at": "2023-01-22T10:00:00Z", // 可选，不提供则使用当前时间
  "notify_subscribers": true              // 是否通知订阅者
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Article published successfully",
  "data": {
    "id": 1,
    "status": "published",
    "published_at": "2023-01-22T10:00:00Z"
  }
}
```

#### 3.3.2 撤回发布

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/unpublish`

**功能描述**: 撤回已发布的文章，将状态改为草稿

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Article unpublished successfully",
  "data": {
    "id": 1,
    "status": "draft"
  }
}
```

#### 3.3.3 归档文章

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/archive`

**功能描述**: 将文章归档

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Article archived successfully",
  "data": {
    "id": 1,
    "status": "archived"
  }
}
```

### 3.4 文章统计API

#### 3.4.1 获取文章统计数据

**请求方法**: GET

**URL**: `/api/v1/articles/{id}/statistics`

**功能描述**: 获取文章的统计数据

**路径参数**:
- id: 文章ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year, all，默认all |
| start_date | query | string | 否 | 统计起始日期，格式YYYY-MM-DD |
| end_date | query | string | 否 | 统计结束日期，格式YYYY-MM-DD |

**请求头**:
- Authorization: Bearer {token} (可选，认证用户可查看更详细的统计)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "basic_stats": {
      "views_count": 1250,
      "unique_views_count": 980,
      "likes_count": 45,
      "dislikes_count": 2,
      "comments_count": 18,
      "shares_count": 12,
      "bookmarks_count": 25,
      "avg_reading_time": 280,
      "bounce_rate": 15.5
    },
    "time_series": {
      "views": [
        {"date": "2023-01-15", "count": 120},
        {"date": "2023-01-16", "count": 230},
        {"date": "2023-01-17", "count": 180},
        // ...
      ],
      "likes": [
        {"date": "2023-01-15", "count": 5},
        {"date": "2023-01-16", "count": 12},
        {"date": "2023-01-17", "count": 8},
        // ...
      ]
    },
    "demographics": {
      "countries": [
        {"name": "中国", "count": 450},
        {"name": "美国", "count": 320},
        {"name": "日本", "count": 120},
        // ...
      ],
      "devices": [
        {"name": "desktop", "count": 680},
        {"name": "mobile", "count": 420},
        {"name": "tablet", "count": 150}
      ],
      "browsers": [
        {"name": "Chrome", "count": 750},
        {"name": "Safari", "count": 280},
        {"name": "Firefox", "count": 150},
        // ...
      ]
    },
    "referrers": [
      {"source": "Google", "count": 380},
      {"source": "Twitter", "count": 250},
      {"source": "Facebook", "count": 180},
      // ...
    ]
  }
}
```

#### 3.4.2 记录文章阅读

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/view`

**功能描述**: 记录文章的阅读行为，更新阅读统计

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (可选)
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "session_id": "abc123xyz789",
  "reading_time": 320,
  "referrer": "https://www.google.com/search?q=article+topic"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "View recorded successfully"
}
```

### 3.5 文章批量操作

#### 3.5.1 批量删除文章

**请求方法**: DELETE

**URL**: `/api/v1/articles/batch`

**功能描述**: 批量删除多篇文章

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "article_ids": [1, 5, 8, 12],
  "force": false  // 是否强制删除，默认false
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "4 articles deleted successfully"
}
```

#### 3.5.2 批量更新文章状态

**请求方法**: PATCH

**URL**: `/api/v1/articles/batch/status`

**功能描述**: 批量更新多篇文章的状态

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "article_ids": [3, 7, 9],
  "status": "published",
  "published_at": "2023-01-25T10:00:00Z"  // 可选，当status为published时有效
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "3 articles updated successfully"
}
```

#### 3.5.3 批量设置文章分类

**请求方法**: POST

**URL**: `/api/v1/articles/batch/categories`

**功能描述**: 批量设置多篇文章的分类

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "article_ids": [2, 6, 11],
  "category_ids": [4, 9],
  "replace_existing": true  // 是否替换现有分类，false则追加
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Categories updated for 3 articles"
}
```

#### 3.5.4 批量设置文章标签

**请求方法**: POST

**URL**: `/api/v1/articles/batch/tags`

**功能描述**: 批量设置多篇文章的标签

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "article_ids": [2, 6, 11],
  "tag_ids": [5, 8, 12],
  "replace_existing": true  // 是否替换现有标签，false则追加
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Tags updated for 3 articles"
}
```

## 4. 权限要求

| API端点 | 所需权限 |
|---------|---------|
| GET /articles | 公开文章：匿名可访问<br>非公开文章：需`view_article`权限 |
| GET /articles/{id} | 公开文章：匿名可访问<br>草稿/私有文章：需`view_draft_article`权限<br>他人草稿：需`view_all_drafts`权限 |
| POST /articles | 需`create_article`权限 |
| PUT/PATCH /articles/{id} | 自己的文章：需`edit_own_article`权限<br>他人文章：需`edit_any_article`权限 |
| DELETE /articles/{id} | 自己的文章：需`delete_own_article`权限<br>他人文章：需`delete_any_article`权限<br>强制删除：需`force_delete_article`权限 |
| 版本管理API | 需`manage_article_versions`权限 |
| 元数据管理API | 需`manage_article_meta`权限 |
| 状态管理API | 自己的文章：需`publish_own_article`权限<br>他人文章：需`publish_any_article`权限 |
| 统计API (读取) | 基本统计：需`view_article_stats`权限<br>详细统计：需`view_detailed_stats`权限 |
| 批量操作API | 需对应单篇操作的权限，且需`batch_operation`权限 | 
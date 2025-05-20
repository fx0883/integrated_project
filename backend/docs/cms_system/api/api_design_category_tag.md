# CMS系统API设计文档 - 分类与标签管理

## 1. 分类与标签API概述

分类与标签API提供对CMS系统中分类和标签的完整管理功能，包括创建、读取、更新、删除等操作。这些API符合RESTful设计原则，使用JSON格式交换数据。

## 2. 分类管理API

### 2.1 获取分类列表

**请求方法**: GET

**URL**: `/api/v1/categories`

**功能描述**: 获取分类列表，支持分页、排序和层级结构

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20，最大100 |
| parent_id | query | integer | 否 | 父分类ID，不提供则返回所有分类 |
| is_active | query | boolean | 否 | 是否只返回激活状态的分类 |
| sort | query | string | 否 | 排序字段，默认sort_order，可选值: name, created_at, updated_at, sort_order |
| sort_direction | query | string | 否 | 排序方向，默认asc，可选值: asc, desc |
| format | query | string | 否 | 返回格式，flat(平铺)或tree(树形)，默认flat |

**请求头**:
- Authorization: Bearer {token} (可选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "技术",
      "slug": "technology",
      "description": "技术相关文章",
      "parent_id": null,
      "cover_image": "https://example.com/images/tech.jpg",
      "is_active": true,
      "sort_order": 1,
      "article_count": 42,
      "created_at": "2022-12-10T08:30:00Z",
      "updated_at": "2023-01-05T15:40:22Z"
    },
    {
      "id": 2,
      "name": "编程语言",
      "slug": "programming-languages",
      "description": "各种编程语言相关文章",
      "parent_id": 1,
      "cover_image": "https://example.com/images/programming.jpg",
      "is_active": true,
      "sort_order": 1,
      "article_count": 28,
      "created_at": "2022-12-10T09:15:00Z",
      "updated_at": "2023-01-05T15:42:10Z"
    }
    // 更多分类...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

### 2.2 获取单个分类

**请求方法**: GET

**URL**: `/api/v1/categories/{id}`
或 `/api/v1/categories/by-slug/{slug}`

**功能描述**: 获取单个分类的详细信息

**路径参数**:
- id: 分类ID
- 或 slug: 分类slug

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| include_children | query | boolean | 否 | 是否包含子分类，默认false |
| include_articles | query | boolean | 否 | 是否包含分类下的文章列表，默认false |
| article_limit | query | integer | 否 | 返回的文章数量，默认10，最大30 |

**请求头**:
- Authorization: Bearer {token} (可选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "技术",
    "slug": "technology",
    "description": "技术相关文章",
    "parent_id": null,
    "cover_image": "https://example.com/images/tech.jpg",
    "created_at": "2022-12-10T08:30:00Z",
    "updated_at": "2023-01-05T15:40:22Z",
    "is_active": true,
    "sort_order": 1,
    "seo_title": "技术文章 - 网站名",
    "seo_description": "关于技术的各类文章",
    "article_count": 42,
    "children": [
      {
        "id": 2,
        "name": "编程语言",
        "slug": "programming-languages",
        "parent_id": 1,
        "article_count": 28
      },
      {
        "id": 3,
        "name": "Web开发",
        "slug": "web-development",
        "parent_id": 1,
        "article_count": 14
      }
    ],
    "recent_articles": [
      {
        "id": 120,
        "title": "Python开发最佳实践",
        "slug": "python-best-practices",
        "published_at": "2023-01-03T10:25:00Z"
      },
      {
        "id": 118,
        "title": "JavaScript高级技巧",
        "slug": "advanced-javascript-techniques",
        "published_at": "2023-01-01T14:30:00Z"
      }
      // 更多文章...
    ]
  }
}
```

### 2.3 创建分类

**请求方法**: POST

**URL**: `/api/v1/categories`

**功能描述**: 创建新分类

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "新分类名称",
  "slug": "new-category-slug",
  "description": "新分类描述...",
  "parent_id": 1,
  "cover_image": "https://example.com/images/new_category.jpg",
  "is_active": true,
  "sort_order": 5,
  "seo_title": "新分类SEO标题",
  "seo_description": "新分类SEO描述"
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "Category created successfully",
  "data": {
    "id": 16,
    "name": "新分类名称",
    "slug": "new-category-slug",
    "parent_id": 1,
    "created_at": "2023-01-25T09:42:30Z"
  }
}
```

### 2.4 更新分类

**请求方法**: PUT

**URL**: `/api/v1/categories/{id}`

**功能描述**: 更新现有分类

**路径参数**:
- id: 分类ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "更新后的分类名称",
  "slug": "updated-category-slug",
  "description": "更新后的分类描述...",
  "parent_id": 2,
  "cover_image": "https://example.com/images/updated_category.jpg",
  "is_active": true,
  "sort_order": 3,
  "seo_title": "更新后的SEO标题",
  "seo_description": "更新后的SEO描述"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Category updated successfully",
  "data": {
    "id": 16,
    "name": "更新后的分类名称",
    "slug": "updated-category-slug",
    "updated_at": "2023-01-25T10:15:45Z"
  }
}
```

### 2.5 部分更新分类

**请求方法**: PATCH

**URL**: `/api/v1/categories/{id}`

**功能描述**: 部分更新分类，只更新提供的字段

**路径参数**:
- id: 分类ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "is_active": false,
  "sort_order": 10
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Category updated successfully",
  "data": {
    "id": 16,
    "name": "更新后的分类名称",
    "is_active": false,
    "sort_order": 10,
    "updated_at": "2023-01-25T11:05:20Z"
  }
}
```

### 2.6 删除分类

**请求方法**: DELETE

**URL**: `/api/v1/categories/{id}`

**功能描述**: 删除指定ID的分类

**路径参数**:
- id: 分类ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| move_articles_to | query | integer | 否 | 将该分类下的文章移动到指定分类ID |
| delete_articles | query | boolean | 否 | 是否删除该分类下的文章，默认false |

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Category deleted successfully"
}
```

## 3. 标签管理API

### 3.1 获取标签列表

**请求方法**: GET

**URL**: `/api/v1/tags`

**功能描述**: 获取标签列表，支持分页和排序

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认30，最大100 |
| group_id | query | integer | 否 | 按标签组ID过滤 |
| is_active | query | boolean | 否 | 是否只返回激活状态的标签 |
| sort | query | string | 否 | 排序字段，默认name，可选值: name, created_at, updated_at |
| sort_direction | query | string | 否 | 排序方向，默认asc，可选值: asc, desc |
| search | query | string | 否 | 搜索关键词，在标签名和描述中匹配 |

**请求头**:
- Authorization: Bearer {token} (可选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Python",
      "slug": "python",
      "description": "Python编程语言相关",
      "group_id": 2,
      "color": "#3776AB",
      "is_active": true,
      "article_count": 25,
      "created_at": "2022-12-05T14:10:00Z",
      "updated_at": "2023-01-10T09:25:45Z"
    },
    {
      "id": 2,
      "name": "JavaScript",
      "slug": "javascript",
      "description": "JavaScript编程语言相关",
      "group_id": 2,
      "color": "#F7DF1E",
      "is_active": true,
      "article_count": 32,
      "created_at": "2022-12-05T14:15:30Z",
      "updated_at": "2023-01-10T09:30:15Z"
    }
    // 更多标签...
  ],
  "meta": {
    "page": 1,
    "per_page": 30,
    "total": 45,
    "total_pages": 2
  }
}
```

### 3.2 获取单个标签

**请求方法**: GET

**URL**: `/api/v1/tags/{id}`
或 `/api/v1/tags/by-slug/{slug}`

**功能描述**: 获取单个标签的详细信息

**路径参数**:
- id: 标签ID
- 或 slug: 标签slug

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| include_articles | query | boolean | 否 | 是否包含使用该标签的文章列表，默认false |
| article_limit | query | integer | 否 | 返回的文章数量，默认10，最大30 |

**请求头**:
- Authorization: Bearer {token} (可选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Python",
    "slug": "python",
    "description": "Python编程语言相关",
    "group": {
      "id": 2,
      "name": "编程语言",
      "slug": "programming-languages"
    },
    "color": "#3776AB",
    "is_active": true,
    "article_count": 25,
    "created_at": "2022-12-05T14:10:00Z",
    "updated_at": "2023-01-10T09:25:45Z",
    "recent_articles": [
      {
        "id": 120,
        "title": "Python开发最佳实践",
        "slug": "python-best-practices",
        "published_at": "2023-01-03T10:25:00Z"
      },
      {
        "id": 115,
        "title": "Python数据分析入门",
        "slug": "python-data-analysis-introduction",
        "published_at": "2022-12-28T15:40:00Z"
      }
      // 更多文章...
    ]
  }
}
```

### 3.3 创建标签

**请求方法**: POST

**URL**: `/api/v1/tags`

**功能描述**: 创建新标签

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "新标签名称",
  "slug": "new-tag-slug",
  "description": "新标签描述...",
  "group_id": 2,
  "color": "#FF5733",
  "is_active": true
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "Tag created successfully",
  "data": {
    "id": 46,
    "name": "新标签名称",
    "slug": "new-tag-slug",
    "group_id": 2,
    "created_at": "2023-01-26T08:15:30Z"
  }
}
```

### 3.4 更新标签

**请求方法**: PUT

**URL**: `/api/v1/tags/{id}`

**功能描述**: 更新现有标签

**路径参数**:
- id: 标签ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "更新后的标签名称",
  "slug": "updated-tag-slug",
  "description": "更新后的标签描述...",
  "group_id": 3,
  "color": "#27AE60",
  "is_active": true
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Tag updated successfully",
  "data": {
    "id": 46,
    "name": "更新后的标签名称",
    "slug": "updated-tag-slug",
    "updated_at": "2023-01-26T09:30:15Z"
  }
}
```

### 3.5 删除标签

**请求方法**: DELETE

**URL**: `/api/v1/tags/{id}`

**功能描述**: 删除指定ID的标签

**路径参数**:
- id: 标签ID

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Tag deleted successfully"
}
```

## 4. 标签组管理API

### 4.1 获取标签组列表

**请求方法**: GET

**URL**: `/api/v1/tag-groups`

**功能描述**: 获取标签组列表

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20，最大50 |
| is_active | query | boolean | 否 | 是否只返回激活状态的标签组 |

**请求头**:
- Authorization: Bearer {token} (可选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "内容类型",
      "slug": "content-type",
      "description": "文章内容类型分类",
      "is_active": true,
      "tag_count": 8,
      "created_at": "2022-12-01T10:00:00Z",
      "updated_at": "2022-12-01T10:00:00Z"
    },
    {
      "id": 2,
      "name": "编程语言",
      "slug": "programming-languages",
      "description": "编程语言分类",
      "is_active": true,
      "tag_count": 12,
      "created_at": "2022-12-01T10:10:00Z",
      "updated_at": "2022-12-01T10:10:00Z"
    }
    // 更多标签组...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 6,
    "total_pages": 1
  }
}
```

### 4.2 获取单个标签组

**请求方法**: GET

**URL**: `/api/v1/tag-groups/{id}`
或 `/api/v1/tag-groups/by-slug/{slug}`

**功能描述**: 获取单个标签组的详细信息

**路径参数**:
- id: 标签组ID
- 或 slug: 标签组slug

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| include_tags | query | boolean | 否 | 是否包含该组下的标签列表，默认true |

**请求头**:
- Authorization: Bearer {token} (可选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 2,
    "name": "编程语言",
    "slug": "programming-languages",
    "description": "编程语言分类",
    "is_active": true,
    "created_at": "2022-12-01T10:10:00Z",
    "updated_at": "2022-12-01T10:10:00Z",
    "tags": [
      {
        "id": 1,
        "name": "Python",
        "slug": "python",
        "color": "#3776AB",
        "article_count": 25
      },
      {
        "id": 2,
        "name": "JavaScript",
        "slug": "javascript",
        "color": "#F7DF1E",
        "article_count": 32
      }
      // 更多标签...
    ]
  }
}
```

### 4.3 创建标签组

**请求方法**: POST

**URL**: `/api/v1/tag-groups`

**功能描述**: 创建新标签组

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "新标签组",
  "slug": "new-tag-group",
  "description": "新标签组描述...",
  "is_active": true
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "Tag group created successfully",
  "data": {
    "id": 7,
    "name": "新标签组",
    "slug": "new-tag-group",
    "created_at": "2023-01-26T14:20:00Z"
  }
}
```

### 4.4 更新标签组

**请求方法**: PUT

**URL**: `/api/v1/tag-groups/{id}`

**功能描述**: 更新现有标签组

**路径参数**:
- id: 标签组ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "name": "更新后的标签组名称",
  "slug": "updated-tag-group-slug",
  "description": "更新后的标签组描述...",
  "is_active": true
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Tag group updated successfully",
  "data": {
    "id": 7,
    "name": "更新后的标签组名称",
    "slug": "updated-tag-group-slug",
    "updated_at": "2023-01-26T15:35:10Z"
  }
}
```

### 4.5 删除标签组

**请求方法**: DELETE

**URL**: `/api/v1/tag-groups/{id}`

**功能描述**: 删除指定ID的标签组

**路径参数**:
- id: 标签组ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| move_tags_to | query | integer | 否 | 将该组下的标签移动到指定标签组ID |

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Tag group deleted successfully"
}
```

## 5. 权限要求

| API端点 | 所需权限 |
|---------|---------|
| GET /categories<br>GET /tags<br>GET /tag-groups | 公开列表：匿名可访问<br>完整列表：需`view_categories`或`view_tags`权限 |
| GET /categories/{id}<br>GET /tags/{id}<br>GET /tag-groups/{id} | 公开信息：匿名可访问<br>完整信息：需`view_categories`或`view_tags`权限 |
| POST /categories<br>POST /tags<br>POST /tag-groups | 需`create_category`或`create_tag`或`create_tag_group`权限 |
| PUT/PATCH /categories/{id}<br>PUT/PATCH /tags/{id}<br>PUT/PATCH /tag-groups/{id} | 需`edit_category`或`edit_tag`或`edit_tag_group`权限 |
| DELETE /categories/{id}<br>DELETE /tags/{id}<br>DELETE /tag-groups/{id} | 需`delete_category`或`delete_tag`或`delete_tag_group`权限 | 
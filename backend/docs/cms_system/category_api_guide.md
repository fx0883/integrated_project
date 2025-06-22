# CMS分类API使用指南

本文档详细介绍了CMS系统中分类管理API的使用方法，包括请求参数、响应格式和示例代码。

## API概述

分类API提供了对CMS系统中分类的增删改查功能，支持分类的层级结构管理。所有API都遵循RESTful设计原则，支持标准的HTTP方法。

### 基础URL

所有分类API的基础URL为：`/api/v1/cms/categories/`

### 认证要求

- 获取分类列表和分类详情：允许匿名访问
- 创建、更新和删除分类：需要管理员权限

### 租户隔离

所有API都遵循租户隔离原则，通过请求头`X-Tenant-ID`指定租户。

## API端点

### 1. 获取分类列表

获取分类列表，支持分页、过滤和搜索。

```
GET /api/v1/cms/categories/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| parent | integer | query | 否 | 父分类ID，不提供则获取所有分类 |
| is_active | boolean | query | 否 | 是否激活 |
| search | string | query | 否 | 搜索关键词，在名称、别名和描述中匹配 |
| page | integer | query | 否 | 页码，默认为1 |
| page_size | integer | query | 否 | 每页数量，默认为10 |
| ordering | string | query | 否 | 排序字段，如`sort_order`、`name`、`-created_at`(降序) |

#### 响应

```json
{
  "success": true,
  "code": 200,
  "message": "获取分类列表成功",
  "data": {
    "count": 10,
    "next": "http://example.com/api/v1/cms/categories/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "技术博客",
        "slug": "tech-blog",
        "description": "技术相关的文章分类",
        "parent": null,
        "cover_image": "https://example.com/images/tech.jpg",
        "created_at": "2023-01-01T12:00:00Z",
        "updated_at": "2023-01-02T15:30:00Z",
        "sort_order": 0,
        "tenant": 1,
        "is_active": true,
        "seo_title": "技术博客 - 分享技术知识",
        "seo_description": "分享最新的技术知识和教程"
      },
      {
        "id": 2,
        "name": "前端开发",
        "slug": "frontend",
        "description": "前端开发相关的文章",
        "parent": 1,
        "cover_image": "https://example.com/images/frontend.jpg",
        "created_at": "2023-01-01T12:30:00Z",
        "updated_at": "2023-01-02T16:00:00Z",
        "sort_order": 1,
        "tenant": 1,
        "is_active": true,
        "seo_title": "前端开发 - 技术博客",
        "seo_description": "前端开发技术、框架和最佳实践"
      }
    ]
  }
}
```

### 2. 获取分类树

以树形结构获取所有分类。

```
GET /api/v1/cms/categories/tree/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |

#### 响应

```json
{
  "success": true,
  "code": 200,
  "message": "获取分类树成功",
  "data": [
    {
      "id": 1,
      "name": "技术博客",
      "slug": "tech-blog",
      "description": "技术相关的文章分类",
      "is_active": true,
      "sort_order": 0,
      "children": [
        {
          "id": 2,
          "name": "前端开发",
          "slug": "frontend",
          "description": "前端开发相关的文章",
          "is_active": true,
          "sort_order": 1,
          "children": []
        },
        {
          "id": 3,
          "name": "后端开发",
          "slug": "backend",
          "description": "后端开发相关的文章",
          "is_active": true,
          "sort_order": 2,
          "children": [
            {
              "id": 5,
              "name": "Python",
              "slug": "python",
              "description": "Python编程",
              "is_active": true,
              "sort_order": 0,
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": 4,
      "name": "产品设计",
      "slug": "product-design",
      "description": "产品设计相关的文章",
      "is_active": true,
      "sort_order": 1,
      "children": []
    }
  ]
}
```

### 3. 获取单个分类

通过ID获取单个分类的详细信息。

```
GET /api/v1/cms/categories/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 分类ID |

#### 响应

```json
{
  "success": true,
  "code": 200,
  "message": "获取分类详情成功",
  "data": {
    "id": 1,
    "name": "技术博客",
    "slug": "tech-blog",
    "description": "技术相关的文章分类",
    "parent": null,
    "cover_image": "https://example.com/images/tech.jpg",
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-02T15:30:00Z",
    "sort_order": 0,
    "tenant": 1,
    "is_active": true,
    "seo_title": "技术博客 - 分享技术知识",
    "seo_description": "分享最新的技术知识和教程"
  }
}
```

### 4. 创建分类

创建新的分类。

```
POST /api/v1/cms/categories/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| name | string | body | 是 | 分类名称 |
| slug | string | body | 否 | URL别名，不提供时自动生成 |
| description | string | body | 否 | 分类描述 |
| parent | integer | body | 否 | 父分类ID |
| cover_image | string | body | 否 | 封面图片URL |
| sort_order | integer | body | 否 | 排序顺序，默认为0 |
| is_active | boolean | body | 否 | 是否激活，默认为true |
| seo_title | string | body | 否 | SEO标题 |
| seo_description | string | body | 否 | SEO描述 |

#### 请求示例

```json
{
  "name": "移动开发",
  "slug": "mobile-dev",
  "description": "移动应用开发相关的文章",
  "parent": 1,
  "cover_image": "https://example.com/images/mobile.jpg",
  "sort_order": 3,
  "is_active": true,
  "seo_title": "移动开发 - 技术博客",
  "seo_description": "Android和iOS移动应用开发技术"
}
```

#### 响应

```json
{
  "success": true,
  "code": 201,
  "message": "创建分类成功",
  "data": {
    "id": 6,
    "name": "移动开发",
    "slug": "mobile-dev",
    "description": "移动应用开发相关的文章",
    "parent": 1,
    "cover_image": "https://example.com/images/mobile.jpg",
    "created_at": "2023-01-03T10:00:00Z",
    "updated_at": "2023-01-03T10:00:00Z",
    "sort_order": 3,
    "tenant": 1,
    "is_active": true,
    "seo_title": "移动开发 - 技术博客",
    "seo_description": "Android和iOS移动应用开发技术"
  }
}
```

### 5. 更新分类

更新现有分类的信息。

```
PUT /api/v1/cms/categories/{id}/
PATCH /api/v1/cms/categories/{id}/
```

> 注：PUT方法需要提供所有字段，PATCH方法可以只提供需要更新的字段。

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 分类ID |
| name | string | body | 否 | 分类名称 |
| slug | string | body | 否 | URL别名 |
| description | string | body | 否 | 分类描述 |
| parent | integer | body | 否 | 父分类ID |
| cover_image | string | body | 否 | 封面图片URL |
| sort_order | integer | body | 否 | 排序顺序 |
| is_active | boolean | body | 否 | 是否激活 |
| seo_title | string | body | 否 | SEO标题 |
| seo_description | string | body | 否 | SEO描述 |

#### 请求示例 (PATCH)

```json
{
  "name": "移动开发技术",
  "description": "移动应用开发技术和最佳实践",
  "is_active": false
}
```

#### 响应

```json
{
  "success": true,
  "code": 200,
  "message": "更新分类成功",
  "data": {
    "id": 6,
    "name": "移动开发技术",
    "slug": "mobile-dev",
    "description": "移动应用开发技术和最佳实践",
    "parent": 1,
    "cover_image": "https://example.com/images/mobile.jpg",
    "created_at": "2023-01-03T10:00:00Z",
    "updated_at": "2023-01-03T11:30:00Z",
    "sort_order": 3,
    "tenant": 1,
    "is_active": false,
    "seo_title": "移动开发 - 技术博客",
    "seo_description": "Android和iOS移动应用开发技术"
  }
}
```

### 6. 删除分类

删除指定的分类。

```
DELETE /api/v1/cms/categories/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 分类ID |

#### 响应

```json
{
  "success": true,
  "code": 204,
  "message": "删除分类成功",
  "data": null
}
```

## 错误处理

### 常见错误码

| 错误码 | 说明 |
|-------|-----|
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 分类不存在 |
| 409 | 操作冲突，如删除有子分类的分类 |
| 500 | 服务器内部错误 |

### 错误响应示例

```json
{
  "success": false,
  "code": 403,
  "message": "权限不足，无法执行此操作",
  "data": null
}
```

```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "data": {
    "name": ["分类名称不能为空"],
    "parent": ["指定的父分类不存在"]
  }
}
```

## 使用注意事项

1. **分类层级**：分类支持无限层级，但建议不要超过3级，以保持良好的用户体验。

2. **删除限制**：
   - 不能删除有子分类的分类，必须先删除所有子分类
   - 不能删除已关联文章的分类，必须先移除关联的文章

3. **分类别名(slug)**：
   - 用于构建URL，只能包含字母、数字、连字符和下划线
   - 如不提供，系统会根据分类名称自动生成
   - 一旦创建，建议不要修改，以免影响SEO

4. **性能考虑**：
   - 获取大量分类时，建议使用分页
   - 构建分类导航时，推荐使用`/tree/`端点获取完整的分类树结构

## 代码示例

### JavaScript (Fetch API)

```javascript
// 获取分类列表
async function getCategories() {
  const response = await fetch('/api/v1/cms/categories/', {
    method: 'GET',
    headers: {
      'X-Tenant-ID': '1',
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// 创建新分类
async function createCategory(categoryData) {
  const response = await fetch('/api/v1/cms/categories/', {
    method: 'POST',
    headers: {
      'X-Tenant-ID': '1',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify(categoryData)
  });
  return await response.json();
}

// 获取分类树
async function getCategoryTree() {
  const response = await fetch('/api/v1/cms/categories/tree/', {
    method: 'GET',
    headers: {
      'X-Tenant-ID': '1',
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}
```

### Python (Requests)

```python
import requests

# 获取分类列表
def get_categories():
    response = requests.get(
        'https://example.com/api/v1/cms/categories/',
        headers={'X-Tenant-ID': '1'}
    )
    return response.json()

# 创建新分类
def create_category(category_data):
    response = requests.post(
        'https://example.com/api/v1/cms/categories/',
        headers={
            'X-Tenant-ID': '1',
            'Authorization': 'Bearer YOUR_TOKEN'
        },
        json=category_data
    )
    return response.json()

# 更新分类
def update_category(category_id, category_data):
    response = requests.patch(
        f'https://example.com/api/v1/cms/categories/{category_id}/',
        headers={
            'X-Tenant-ID': '1',
            'Authorization': 'Bearer YOUR_TOKEN'
        },
        json=category_data
    )
    return response.json()
``` 
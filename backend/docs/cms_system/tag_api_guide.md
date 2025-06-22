# CMS标签API使用指南

本文档详细介绍了CMS系统中标签管理API的使用方法，包括请求参数、响应格式和示例代码。

## API概述

标签API提供了对CMS系统中标签和标签组的增删改查功能。所有API都遵循RESTful设计原则，支持标准的HTTP方法。

### 基础URL

- 标签API的基础URL为：`/api/v1/cms/tags/`
- 标签组API的基础URL为：`/api/v1/cms/tag-groups/`

### 认证要求

- 获取标签列表和标签详情：允许匿名访问
- 创建、更新和删除标签：需要管理员权限

### 租户隔离

所有API都遵循租户隔离原则，通过请求头`X-Tenant-ID`指定租户。

## 标签组API端点

### 1. 获取标签组列表

获取标签组列表，支持分页、过滤和搜索。

```
GET /api/v1/cms/tag-groups/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| is_active | boolean | query | 否 | 是否激活 |
| search | string | query | 否 | 搜索关键词，在名称和描述中匹配 |
| page | integer | query | 否 | 页码，默认为1 |
| page_size | integer | query | 否 | 每页数量，默认为10 |

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "获取标签组列表成功",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "技术栈",
        "slug": "tech-stack",
        "description": "文章使用的技术栈标签",
        "created_at": "2023-10-15T08:30:00Z",
        "updated_at": "2023-10-15T08:30:00Z",
        "is_active": true,
        "tenant": 1
      },
      {
        "id": 2,
        "name": "文章类型",
        "slug": "article-type",
        "description": "文章类型标签",
        "created_at": "2023-10-15T08:35:00Z",
        "updated_at": "2023-10-15T08:35:00Z",
        "is_active": true,
        "tenant": 1
      }
    ]
  }
}
```

### 2. 获取单个标签组

通过ID获取单个标签组的详细信息。

```
GET /api/v1/cms/tag-groups/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签组ID |

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "获取标签组详情成功",
  "data": {
    "id": 1,
    "name": "技术栈",
    "slug": "tech-stack",
    "description": "文章使用的技术栈标签",
    "created_at": "2023-10-15T08:30:00Z",
    "updated_at": "2023-10-15T08:30:00Z",
    "is_active": true,
    "tenant": 1
  }
}
```

### 3. 创建标签组

创建新的标签组。

```
POST /api/v1/cms/tag-groups/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| name | string | body | 是 | 标签组名称 |
| slug | string | body | 否 | URL别名，不提供则自动生成 |
| description | string | body | 否 | 标签组描述 |
| is_active | boolean | body | 否 | 是否激活，默认为true |

#### 请求示例

```json
{
  "name": "技术栈",
  "slug": "tech-stack",
  "description": "文章使用的技术栈标签",
  "is_active": true
}
```

#### 响应

```json
{
  "success": true,
  "code": 2001,
  "message": "创建标签组成功",
  "data": {
    "id": 1,
    "name": "技术栈",
    "slug": "tech-stack",
    "description": "文章使用的技术栈标签",
    "created_at": "2023-10-15T08:30:00Z",
    "updated_at": "2023-10-15T08:30:00Z",
    "is_active": true,
    "tenant": 1
  }
}
```

### 4. 更新标签组

更新现有的标签组。

```
PUT /api/v1/cms/tag-groups/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签组ID |
| name | string | body | 是 | 标签组名称 |
| slug | string | body | 否 | URL别名 |
| description | string | body | 否 | 标签组描述 |
| is_active | boolean | body | 否 | 是否激活 |

#### 请求示例

```json
{
  "name": "技术栈更新",
  "description": "更新后的技术栈标签组描述",
  "is_active": true
}
```

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "更新标签组成功",
  "data": {
    "id": 1,
    "name": "技术栈更新",
    "slug": "tech-stack",
    "description": "更新后的技术栈标签组描述",
    "created_at": "2023-10-15T08:30:00Z",
    "updated_at": "2023-10-15T09:15:00Z",
    "is_active": true,
    "tenant": 1
  }
}
```

### 5. 部分更新标签组

部分更新标签组信息。

```
PATCH /api/v1/cms/tag-groups/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签组ID |
| name | string | body | 否 | 标签组名称 |
| slug | string | body | 否 | URL别名 |
| description | string | body | 否 | 标签组描述 |
| is_active | boolean | body | 否 | 是否激活 |

#### 请求示例

```json
{
  "description": "更新后的技术栈标签组描述"
}
```

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "更新标签组成功",
  "data": {
    "id": 1,
    "name": "技术栈",
    "slug": "tech-stack",
    "description": "更新后的技术栈标签组描述",
    "created_at": "2023-10-15T08:30:00Z",
    "updated_at": "2023-10-15T09:15:00Z",
    "is_active": true,
    "tenant": 1
  }
}
```

### 6. 删除标签组

删除指定的标签组。

```
DELETE /api/v1/cms/tag-groups/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签组ID |

#### 响应

```
HTTP/1.1 204 No Content
```

## 标签API端点

### 1. 获取标签列表

获取标签列表，支持分页、过滤和搜索。

```
GET /api/v1/cms/tags/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| group | integer | query | 否 | 标签组ID |
| is_active | boolean | query | 否 | 是否激活 |
| search | string | query | 否 | 搜索关键词，在名称、别名和描述中匹配 |
| page | integer | query | 否 | 页码，默认为1 |
| page_size | integer | query | 否 | 每页数量，默认为10 |

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "获取标签列表成功",
  "data": {
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "Python",
        "slug": "python",
        "description": "Python编程语言相关文章",
        "group": 1,
        "group_name": "技术栈",
        "created_at": "2023-10-15T08:40:00Z",
        "updated_at": "2023-10-15T08:40:00Z",
        "color": "#3776AB",
        "is_active": true,
        "tenant": 1
      },
      {
        "id": 2,
        "name": "Django",
        "slug": "django",
        "description": "Django框架相关文章",
        "group": 1,
        "group_name": "技术栈",
        "created_at": "2023-10-15T08:45:00Z",
        "updated_at": "2023-10-15T08:45:00Z",
        "color": "#092E20",
        "is_active": true,
        "tenant": 1
      },
      {
        "id": 3,
        "name": "教程",
        "slug": "tutorial",
        "description": "教程类文章",
        "group": 2,
        "group_name": "文章类型",
        "created_at": "2023-10-15T08:50:00Z",
        "updated_at": "2023-10-15T08:50:00Z",
        "color": "#FF5733",
        "is_active": true,
        "tenant": 1
      }
    ]
  }
}
```

### 2. 获取单个标签

通过ID获取单个标签的详细信息。

```
GET /api/v1/cms/tags/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签ID |

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "获取标签详情成功",
  "data": {
    "id": 1,
    "name": "Python",
    "slug": "python",
    "description": "Python编程语言相关文章",
    "group": 1,
    "group_name": "技术栈",
    "created_at": "2023-10-15T08:40:00Z",
    "updated_at": "2023-10-15T08:40:00Z",
    "color": "#3776AB",
    "is_active": true,
    "tenant": 1
  }
}
```

### 3. 创建标签

创建新的标签。

```
POST /api/v1/cms/tags/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| name | string | body | 是 | 标签名称 |
| slug | string | body | 否 | URL别名，不提供则自动生成 |
| description | string | body | 否 | 标签描述 |
| group | integer | body | 否 | 标签组ID |
| color | string | body | 否 | 标签颜色，十六进制格式 |
| is_active | boolean | body | 否 | 是否激活，默认为true |

#### 请求示例

```json
{
  "name": "Python",
  "slug": "python",
  "description": "Python编程语言相关文章",
  "group": 1,
  "color": "#3776AB",
  "is_active": true
}
```

#### 响应

```json
{
  "success": true,
  "code": 2001,
  "message": "创建标签成功",
  "data": {
    "id": 1,
    "name": "Python",
    "slug": "python",
    "description": "Python编程语言相关文章",
    "group": 1,
    "group_name": "技术栈",
    "created_at": "2023-10-15T08:40:00Z",
    "updated_at": "2023-10-15T08:40:00Z",
    "color": "#3776AB",
    "is_active": true,
    "tenant": 1
  }
}
```

### 4. 更新标签

更新现有的标签。

```
PUT /api/v1/cms/tags/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签ID |
| name | string | body | 是 | 标签名称 |
| slug | string | body | 否 | URL别名 |
| description | string | body | 否 | 标签描述 |
| group | integer | body | 否 | 标签组ID |
| color | string | body | 否 | 标签颜色 |
| is_active | boolean | body | 否 | 是否激活 |

#### 请求示例

```json
{
  "name": "Python 3",
  "description": "Python 3编程语言相关文章",
  "group": 1,
  "color": "#3776AB",
  "is_active": true
}
```

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "更新标签成功",
  "data": {
    "id": 1,
    "name": "Python 3",
    "slug": "python",
    "description": "Python 3编程语言相关文章",
    "group": 1,
    "group_name": "技术栈",
    "created_at": "2023-10-15T08:40:00Z",
    "updated_at": "2023-10-15T09:20:00Z",
    "color": "#3776AB",
    "is_active": true,
    "tenant": 1
  }
}
```

### 5. 部分更新标签

部分更新标签信息。

```
PATCH /api/v1/cms/tags/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签ID |
| name | string | body | 否 | 标签名称 |
| slug | string | body | 否 | URL别名 |
| description | string | body | 否 | 标签描述 |
| group | integer | body | 否 | 标签组ID |
| color | string | body | 否 | 标签颜色 |
| is_active | boolean | body | 否 | 是否激活 |

#### 请求示例

```json
{
  "color": "#4B8BBE"
}
```

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "更新标签成功",
  "data": {
    "id": 1,
    "name": "Python",
    "slug": "python",
    "description": "Python编程语言相关文章",
    "group": 1,
    "group_name": "技术栈",
    "created_at": "2023-10-15T08:40:00Z",
    "updated_at": "2023-10-15T09:25:00Z",
    "color": "#4B8BBE",
    "is_active": true,
    "tenant": 1
  }
}
```

### 6. 删除标签

删除指定的标签。

```
DELETE /api/v1/cms/tags/{id}/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |
| id | integer | path | 是 | 标签ID |

#### 响应

```
HTTP/1.1 204 No Content
```

### 7. 获取标签使用统计

获取各个标签的使用统计信息。

```
GET /api/v1/cms/tags/usage-stats/
```

#### 请求参数

| 参数 | 类型 | 位置 | 是否必须 | 说明 |
|-----|------|------|---------|-----|
| X-Tenant-ID | string | header | 是 | 租户ID |

#### 响应

```json
{
  "success": true,
  "code": 2000,
  "message": "获取标签使用统计成功",
  "data": [
    {
      "id": 1,
      "name": "Python",
      "slug": "python",
      "color": "#3776AB",
      "articles_count": 15,
      "group_name": "技术栈"
    },
    {
      "id": 2,
      "name": "Django",
      "slug": "django",
      "color": "#092E20",
      "articles_count": 8,
      "group_name": "技术栈"
    },
    {
      "id": 3,
      "name": "教程",
      "slug": "tutorial",
      "color": "#FF5733",
      "articles_count": 12,
      "group_name": "文章类型"
    }
  ]
}
```

## 错误处理

### 常见错误码

| 错误码 | 说明 |
|-------|-----|
| 4000 | 请求参数错误 |
| 4001 | 认证失败 |
| 4003 | 权限不足 |
| 4004 | 资源不存在 |
| 4009 | 资源冲突 |
| 5000 | 服务器内部错误 |

### 错误响应示例

```json
{
  "success": false,
  "code": 4004,
  "message": "标签不存在",
  "data": null,
  "errors": {
    "detail": "未找到。"
  }
}
```

## 使用注意事项

### 标签与标签组关系

1. **标签组是可选的**：标签可以不属于任何标签组，但建议使用标签组进行分类管理。
2. **删除标签组影响**：删除标签组不会删除其下的标签，而是将标签的group字段设为null。

### 标签删除限制

1. **关联文章的标签**：如果标签已关联到文章，需要先移除关联关系才能删除标签。
2. **替代方案**：对于不想再使用但已关联文章的标签，可以将其设置为非激活状态（`is_active=false`）。

### 标签别名使用

1. **唯一性**：标签的slug字段在整个系统中必须唯一，用于构建URL。
2. **自动生成**：如果创建标签时未提供slug，系统会根据name字段自动生成。
3. **URL友好**：slug只能包含字母、数字、连字符和下划线，不能包含空格和特殊字符。

### 性能考虑

1. **标签过滤**：使用group参数过滤标签可以提高API响应速度。
2. **批量操作**：对于大量标签的操作，建议分批进行以避免超时。

## 代码示例

### JavaScript示例

```javascript
// 获取标签列表
async function getTags() {
  const response = await fetch('/api/v1/cms/tags/?group=1', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': '1'
    }
  });
  
  const data = await response.json();
  return data.data.results;
}

// 创建新标签
async function createTag(tagData) {
  const response = await fetch('/api/v1/cms/tags/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': '1',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify(tagData)
  });
  
  return await response.json();
}

// 使用示例
const newTag = {
  name: 'React',
  description: 'React前端框架相关文章',
  group: 1,
  color: '#61DAFB'
};

createTag(newTag)
  .then(result => console.log('创建标签成功:', result))
  .catch(error => console.error('创建标签失败:', error));
```

### Python示例

```python
import requests

# API基础URL
base_url = 'http://example.com/api/v1/cms'
headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': '1',
    'Authorization': 'Bearer YOUR_TOKEN'
}

# 获取所有标签组
def get_tag_groups():
    response = requests.get(f'{base_url}/tag-groups/', headers=headers)
    if response.status_code == 200:
        return response.json()['data']['results']
    else:
        print(f'获取标签组失败: {response.status_code}')
        return None

# 创建标签组
def create_tag_group(name, description=None):
    data = {
        'name': name,
        'description': description
    }
    response = requests.post(f'{base_url}/tag-groups/', json=data, headers=headers)
    if response.status_code == 201:
        return response.json()['data']
    else:
        print(f'创建标签组失败: {response.status_code}')
        return None

# 获取标签使用统计
def get_tag_usage_stats():
    response = requests.get(f'{base_url}/tags/usage-stats/', headers=headers)
    if response.status_code == 200:
        return response.json()['data']
    else:
        print(f'获取标签统计失败: {response.status_code}')
        return None

# 使用示例
if __name__ == '__main__':
    # 创建新标签组
    new_group = create_tag_group('前端技术', '前端开发相关技术标签')
    if new_group:
        print(f'创建标签组成功: {new_group["name"]}, ID: {new_group["id"]}')
        
        # 在新标签组下创建标签
        tag_data = {
            'name': 'Vue.js',
            'description': 'Vue.js前端框架相关文章',
            'group': new_group['id'],
            'color': '#4FC08D'
        }
        response = requests.post(f'{base_url}/tags/', json=tag_data, headers=headers)
        if response.status_code == 201:
            print(f'创建标签成功: {response.json()["data"]["name"]}')
        else:
            print(f'创建标签失败: {response.status_code}')
    
    # 获取标签使用统计
    stats = get_tag_usage_stats()
    if stats:
        for tag in stats:
            print(f'标签: {tag["name"]}, 使用次数: {tag["articles_count"]}')
```

## 常见问题解答

### Q: 如何批量创建标签？
A: 目前API不直接支持批量创建标签，需要循环调用单个标签创建API。对于大量标签，建议使用异步方式分批创建。

### Q: 标签名称可以重复吗？
A: 同一租户下的标签名称可以重复，但slug必须唯一。不过，为了避免混淆，建议保持标签名称的唯一性。

### Q: 如何将文章与标签关联？
A: 在创建或更新文章时，通过`tag_ids`字段提供标签ID列表，系统会自动建立关联关系。

### Q: 如何获取特定标签关联的所有文章？
A: 可以使用文章列表API，并添加`tag_id`查询参数进行过滤。 
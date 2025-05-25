# CMS系统API设计文档 - 概述

## 1. 简介

本文档描述CMS系统的API设计，包括接口规范、认证机制以及各类API的概述。这些API基于RESTful设计原则，提供对CMS系统各实体的管理功能。

## 2. API基础规范

### 2.1 基础URL结构

所有API均使用以下基础URL格式:

```
https://{host}/api/v1/{resource}
```

其中:
- `{host}`: 服务器域名
- `v1`: API版本号
- `{resource}`: 资源名称，如articles, categories, tags等

### 2.2 HTTP方法

API遵循标准HTTP方法语义:

| HTTP方法 | 描述 | 示例 |
|---------|------|------|
| GET | 获取资源 | 获取文章列表、获取单篇文章 |
| POST | 创建资源 | 创建新文章、添加评论 |
| PUT | 全量更新资源 | 更新整篇文章内容 |
| PATCH | 部分更新资源 | 更新文章状态、修改分类名称 |
| DELETE | 删除资源 | 删除评论、移除标签 |

### 2.3 状态码

API使用标准HTTP状态码:

| 状态码 | 描述 |
|-------|------|
| 200 OK | 请求成功 |
| 201 Created | 资源创建成功 |
| 204 No Content | 请求成功处理，无返回内容 |
| 400 Bad Request | 请求参数有误 |
| 401 Unauthorized | 未认证或认证已过期 |
| 403 Forbidden | 无权限访问该资源 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突（如重复创建） |
| 422 Unprocessable Entity | 请求格式正确但语义错误 |
| 429 Too Many Requests | 请求频率超限 |
| 500 Internal Server Error | 服务器内部错误 |

### 2.4 通用请求头

| 请求头 | 说明 |
|-------|------|
| Authorization | JWT令牌，格式: `Bearer {token}` |
| Content-Type | 请求体类型，通常为`application/json` |
| Accept | 响应体类型，通常为`application/json` |
| X-Tenant-ID | **租户ID，用于多租户系统，所有API必须提供** |

### 2.5 通用响应格式

#### 2.5.1 成功响应

```json
{
  "code": 200,                // 状态码
  "message": "Success",       // 操作描述
  "data": {                   // 响应数据
    // 资源数据
  },
  "meta": {                   // 元数据，分页情况下使用
    "page": 1,                // 当前页码
    "per_page": 10,           // 每页数量
    "total": 100,             // 总数据量
    "total_pages": 10         // 总页数
  }
}
```

#### 2.5.2 错误响应

```json
{
  "code": 400,                // 错误状态码
  "message": "Bad Request",   // 错误概述
  "errors": [                 // 详细错误说明
    {
      "field": "title",       // 错误字段
      "message": "Title cannot be empty"  // 错误说明
    }
  ]
}
```

### 2.6 认证与授权

#### 2.6.1 认证机制

API采用JWT (JSON Web Token)认证机制:

1. 客户端通过`/api/v1/auth/login`接口获取JWT令牌
2. 请求API时在Authorization请求头中携带令牌
3. 令牌默认有效期为24小时，可通过刷新令牌延长

#### 2.6.2 权限控制

基于用户角色和等级控制API访问权限:

1. 系统管理员拥有所有接口访问权限
2. 内容编辑可管理文章、分类、标签
3. 普通作者仅能管理自己创建的内容
4. 读者仅有评论和互动权限

### 2.7 多租户支持

**所有API均强制要求多租户模式支持:**

1. **客户端必须在请求头中携带`X-Tenant-ID`标识当前租户**
2. **如果未提供租户ID，系统将尝试使用用户关联的租户ID**
3. **API响应仅包含当前租户的数据**
4. **跨租户操作需要特殊权限（仅超级管理员可执行）**
5. **创建资源时，系统会自动设置租户ID**
6. **租户ID不匹配的资源访问将返回403权限错误**

多租户使用示例:
```
GET /api/v1/articles
X-Tenant-ID: 123
Authorization: Bearer <token>
```

注意事项:
- 超级管理员可以操作所有租户的资源
- 普通用户只能操作自己租户下的资源
- 租户ID是必须的，未提供时会尝试使用用户关联的租户ID
- 尝试访问不属于当前租户的资源将返回403错误

### 2.8 限流策略

API实施请求限流保护:

1. 匿名用户: 60次请求/分钟
2. 认证用户: 300次请求/分钟
3. 管理接口: 120次请求/分钟

超过限制将返回429状态码。

## 3. API分类概述

本系统API分为以下几类:

1. **文章管理API** - 提供文章的CRUD操作、状态管理、版本控制等功能
   - 详见 [文章API设计文档](api_design_article.md)

2. **分类与标签API** - 提供分类和标签的管理功能
   - 详见 [分类与标签API设计文档](api_design_category_tag.md)

3. **评论与互动API** - 提供评论、点赞、收藏等互动功能
   - 详见 [评论与互动API设计文档](api_design_comment.md)

4. **用户与权限API** - 提供用户管理、权限控制功能
   - 详见 [用户与权限API设计文档](api_design_user.md)

5. **统计与分析API** - 提供内容访问统计、用户行为分析功能
   - 详见 [统计与分析API设计文档](api_design_statistics.md)

## 4. API版本控制

API版本通过URL路径中的版本号指定:

1. 主版本号变更(如v1到v2)表示不兼容的API变更
2. 同一主版本内的变更保持向后兼容
3. 废弃接口会保留至少6个月，并在响应头中提示
4. 新功能通过Feature-Flag机制逐步开放 
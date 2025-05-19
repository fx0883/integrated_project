# CMS系统API设计文档 - 评论与互动

## 1. 评论与互动API概述

评论与互动API提供对CMS系统中用户互动功能的支持，包括评论管理、点赞、收藏、分享等功能。这些API符合RESTful设计原则，使用JSON格式进行数据交换。

## 2. 评论管理API

### 2.1 获取文章评论列表

**请求方法**: GET

**URL**: `/api/v1/articles/{article_id}/comments`

**功能描述**: 获取指定文章的评论列表

**路径参数**:
- article_id: 文章ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20，最大50 |
| status | query | string | 否 | 评论状态过滤，可选值: pending, approved, spam, trash，默认approved |
| parent_id | query | integer | 否 | 父评论ID，获取指定评论下的回复，null表示顶级评论 |
| sort | query | string | 否 | 排序字段，默认created_at，可选值: created_at, likes_count |
| sort_direction | query | string | 否 | 排序方向，默认desc，可选值: asc, desc |
| format | query | string | 否 | 返回格式，可选值: flat(平铺)或nested(嵌套)，默认flat |

**请求头**:
- Authorization: Bearer {token} (可选，管理员可查看所有状态评论)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "content": "这是一条评论内容",
      "user": {
        "id": 5,
        "username": "user123",
        "display_name": "用户昵称",
        "avatar": "https://example.com/avatars/user123.jpg"
      },
      "parent_id": null,
      "status": "approved",
      "created_at": "2023-01-15T14:30:22Z",
      "updated_at": "2023-01-15T14:30:22Z",
      "is_pinned": false,
      "likes_count": 5,
      "replies_count": 2
    },
    {
      "id": 2,
      "content": "这是对第一条评论的回复",
      "user": {
        "id": 8,
        "username": "user456",
        "display_name": "另一个用户",
        "avatar": "https://example.com/avatars/user456.jpg"
      },
      "parent_id": 1,
      "status": "approved",
      "created_at": "2023-01-15T15:10:45Z",
      "updated_at": "2023-01-15T15:10:45Z",
      "is_pinned": false,
      "likes_count": 2,
      "replies_count": 0
    }
    // 更多评论...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

### 2.2 获取单个评论

**请求方法**: GET

**URL**: `/api/v1/comments/{id}`

**功能描述**: 获取单个评论的详细信息

**路径参数**:
- id: 评论ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| include_replies | query | boolean | 否 | 是否包含回复，默认false |
| replies_limit | query | integer | 否 | 返回的回复数量，默认5，最大20 |

**请求头**:
- Authorization: Bearer {token} (可选，管理员可查看所有状态评论)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "content": "这是一条评论内容",
    "article": {
      "id": 120,
      "title": "文章标题",
      "slug": "article-slug"
    },
    "user": {
      "id": 5,
      "username": "user123",
      "display_name": "用户昵称",
      "avatar": "https://example.com/avatars/user123.jpg"
    },
    "parent_id": null,
    "status": "approved",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
    "created_at": "2023-01-15T14:30:22Z",
    "updated_at": "2023-01-15T14:30:22Z",
    "is_pinned": false,
    "likes_count": 5,
    "replies": [
      {
        "id": 2,
        "content": "这是对第一条评论的回复",
        "user": {
          "id": 8,
          "username": "user456",
          "display_name": "另一个用户",
          "avatar": "https://example.com/avatars/user456.jpg"
        },
        "created_at": "2023-01-15T15:10:45Z",
        "likes_count": 2
      }
      // 更多回复...
    ]
  }
}
```

### 2.3 发表评论

**请求方法**: POST

**URL**: `/api/v1/articles/{article_id}/comments`

**功能描述**: 对文章发表评论

**路径参数**:
- article_id: 文章ID

**请求头**:
- Authorization: Bearer {token} (可选，未登录用户需要提供游客信息)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "content": "这是我的评论内容",
  "parent_id": null,
  "guest_name": "游客昵称",        // 未登录用户必填
  "guest_email": "guest@example.com", // 未登录用户必填
  "guest_website": "https://example.com" // 未登录用户选填
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "Comment submitted successfully",
  "data": {
    "id": 43,
    "content": "这是我的评论内容",
    "status": "pending", // 或approved，取决于系统设置
    "created_at": "2023-01-26T09:15:30Z"
  }
}
```

### 2.4 回复评论

**请求方法**: POST

**URL**: `/api/v1/comments/{id}/replies`

**功能描述**: 回复某条评论

**路径参数**:
- id: 被回复的评论ID

**请求头**:
- Authorization: Bearer {token} (可选，未登录用户需要提供游客信息)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "content": "这是我的回复内容",
  "guest_name": "游客昵称",        // 未登录用户必填
  "guest_email": "guest@example.com", // 未登录用户必填
  "guest_website": "https://example.com" // 未登录用户选填
}
```

**响应示例**:

```json
{
  "code": 201,
  "message": "Reply submitted successfully",
  "data": {
    "id": 44,
    "content": "这是我的回复内容",
    "parent_id": 43,
    "status": "pending", // 或approved，取决于系统设置
    "created_at": "2023-01-26T09:20:15Z"
  }
}
```

### 2.5 更新评论

**请求方法**: PUT

**URL**: `/api/v1/comments/{id}`

**功能描述**: 更新评论内容

**路径参数**:
- id: 评论ID

**请求头**:
- Authorization: Bearer {token} (必选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "content": "更新后的评论内容"
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Comment updated successfully",
  "data": {
    "id": 43,
    "content": "更新后的评论内容",
    "updated_at": "2023-01-26T09:25:40Z"
  }
}
```

### 2.6 更新评论状态

**请求方法**: PATCH

**URL**: `/api/v1/comments/{id}/status`

**功能描述**: 更新评论状态，用于审核、标记垃圾评论等

**路径参数**:
- id: 评论ID

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "status": "approved" // 可选值: pending, approved, spam, trash
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Comment status updated successfully",
  "data": {
    "id": 43,
    "status": "approved",
    "updated_at": "2023-01-26T09:30:20Z"
  }
}
```

### 2.7 置顶/取消置顶评论

**请求方法**: PATCH

**URL**: `/api/v1/comments/{id}/pin`

**功能描述**: 置顶或取消置顶评论

**路径参数**:
- id: 评论ID

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "is_pinned": true // true为置顶，false为取消置顶
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Comment has been pinned",
  "data": {
    "id": 43,
    "is_pinned": true,
    "updated_at": "2023-01-26T09:35:10Z"
  }
}
```

### 2.8 删除评论

**请求方法**: DELETE

**URL**: `/api/v1/comments/{id}`

**功能描述**: 删除评论

**路径参数**:
- id: 评论ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| force | query | boolean | 否 | 是否强制删除，默认false (false时移到trash状态) |
| delete_replies | query | boolean | 否 | 是否同时删除回复，默认true |

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Comment deleted successfully"
}
```

### 2.9 批量处理评论

**请求方法**: POST

**URL**: `/api/v1/comments/batch`

**功能描述**: 批量处理多条评论

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "comment_ids": [43, 44, 45],
  "action": "approve", // 可选值: approve, reject, mark_as_spam, trash, delete, restore
  "force": false // 当action为delete时有效，表示是否强制删除
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "3 comments processed successfully",
  "data": {
    "processed": 3,
    "failed": 0
  }
}
```

## 3. 互动管理API

### 3.1 点赞/取消点赞

#### 3.1.1 点赞文章

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/like`

**功能描述**: 对文章进行点赞

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (可选，匿名用户使用IP记录)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Article liked successfully",
  "data": {
    "likes_count": 43
  }
}
```

#### 3.1.2 取消点赞文章

**请求方法**: DELETE

**URL**: `/api/v1/articles/{id}/like`

**功能描述**: 取消对文章的点赞

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (可选，匿名用户使用IP记录)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Article like removed successfully",
  "data": {
    "likes_count": 42
  }
}
```

#### 3.1.3 点赞评论

**请求方法**: POST

**URL**: `/api/v1/comments/{id}/like`

**功能描述**: 对评论进行点赞

**路径参数**:
- id: 评论ID

**请求头**:
- Authorization: Bearer {token} (可选，匿名用户使用IP记录)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Comment liked successfully",
  "data": {
    "likes_count": 6
  }
}
```

#### 3.1.4 取消点赞评论

**请求方法**: DELETE

**URL**: `/api/v1/comments/{id}/like`

**功能描述**: 取消对评论的点赞

**路径参数**:
- id: 评论ID

**请求头**:
- Authorization: Bearer {token} (可选，匿名用户使用IP记录)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Comment like removed successfully",
  "data": {
    "likes_count": 5
  }
}
```

### 3.2 收藏/取消收藏

#### 3.2.1 收藏文章

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/bookmark`

**功能描述**: 收藏文章

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "folder_id": 2, // 可选，收藏文件夹ID，不提供则添加到默认文件夹
  "note": "这篇文章讲解得很好，收藏备用" // 可选，收藏备注
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Article bookmarked successfully",
  "data": {
    "bookmark_id": 56,
    "created_at": "2023-01-26T10:15:30Z"
  }
}
```

#### 3.2.2 取消收藏文章

**请求方法**: DELETE

**URL**: `/api/v1/articles/{id}/bookmark`

**功能描述**: 取消收藏文章

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Article bookmark removed successfully"
}
```

#### 3.2.3 获取用户收藏列表

**请求方法**: GET

**URL**: `/api/v1/users/me/bookmarks`

**功能描述**: 获取当前用户的收藏列表

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20，最大50 |
| folder_id | query | integer | 否 | 按文件夹ID过滤 |
| sort | query | string | 否 | 排序字段，默认created_at，可选值: created_at, title |
| sort_direction | query | string | 否 | 排序方向，默认desc，可选值: asc, desc |

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
      "id": 56,
      "article": {
        "id": 120,
        "title": "Python开发最佳实践",
        "slug": "python-best-practices",
        "excerpt": "本文介绍Python开发中的一些最佳实践...",
        "cover_image": "https://example.com/images/python.jpg",
        "published_at": "2023-01-03T10:25:00Z"
      },
      "folder": {
        "id": 2,
        "name": "编程技术"
      },
      "note": "这篇文章讲解得很好，收藏备用",
      "created_at": "2023-01-26T10:15:30Z"
    },
    // 更多收藏...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 35,
    "total_pages": 2
  }
}
```

### 3.3 分享统计

#### 3.3.1 记录文章分享

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/share`

**功能描述**: 记录文章分享行为

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (可选)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "platform": "twitter", // 可选值: twitter, facebook, linkedin, wechat, weibo, email, other
  "channel": "app", // 可选值: app, web, desktop
  "custom_platform": "自定义平台名称" // 当platform为other时使用
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Share recorded successfully",
  "data": {
    "shares_count": 28
  }
}
```

#### 3.3.2 获取文章分享统计

**请求方法**: GET

**URL**: `/api/v1/articles/{id}/shares/stats`

**功能描述**: 获取文章分享统计数据

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (需要管理权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "total_shares": 28,
    "by_platform": {
      "twitter": 12,
      "facebook": 8,
      "wechat": 5,
      "email": 2,
      "other": 1
    },
    "by_channel": {
      "app": 15,
      "web": 13
    },
    "timeline": [
      {"date": "2023-01-20", "count": 5},
      {"date": "2023-01-21", "count": 8},
      {"date": "2023-01-22", "count": 6},
      {"date": "2023-01-23", "count": 9}
    ]
  }
}
```

## 4. 举报管理

### 4.1 举报评论

**请求方法**: POST

**URL**: `/api/v1/comments/{id}/report`

**功能描述**: 举报不良评论

**路径参数**:
- id: 评论ID

**请求头**:
- Authorization: Bearer {token} (可选，匿名用户需提供联系方式)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "reason": "spam", // 可选值: spam, offensive, illegal, irrelevant, other
  "description": "这条评论包含广告内容", // 详细说明
  "contact_email": "reporter@example.com" // 匿名用户需提供
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Report submitted successfully",
  "data": {
    "report_id": 12,
    "created_at": "2023-01-26T11:05:20Z"
  }
}
```

### 4.2 举报文章

**请求方法**: POST

**URL**: `/api/v1/articles/{id}/report`

**功能描述**: 举报不良文章

**路径参数**:
- id: 文章ID

**请求头**:
- Authorization: Bearer {token} (可选，匿名用户需提供联系方式)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "reason": "copyright", // 可选值: copyright, offensive, illegal, fake_news, plagiarism, other
  "description": "这篇文章侵犯了我的版权", // 详细说明
  "contact_email": "reporter@example.com", // 匿名用户需提供
  "evidence_links": ["https://original-content.com/my-article"] // 可选，证据链接
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Report submitted successfully",
  "data": {
    "report_id": 15,
    "created_at": "2023-01-26T11:15:40Z"
  }
}
```

### 4.3 获取举报列表

**请求方法**: GET

**URL**: `/api/v1/reports`

**功能描述**: 获取举报列表，仅管理员可用

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| page | query | integer | 否 | 页码，默认1 |
| per_page | query | integer | 否 | 每页数量，默认20，最大50 |
| status | query | string | 否 | 处理状态过滤，可选值: pending, reviewing, resolved, rejected |
| target_type | query | string | 否 | 举报目标类型，可选值: article, comment |
| reason | query | string | 否 | 举报原因过滤 |

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
      "id": 15,
      "target_type": "article",
      "target_id": 105,
      "target": {
        "id": 105,
        "title": "被举报的文章"
      },
      "reporter": {
        "id": 8,
        "username": "reporter_user",
        "display_name": "举报者昵称"
      },
      "reason": "copyright",
      "description": "这篇文章侵犯了我的版权",
      "evidence_links": ["https://original-content.com/my-article"],
      "status": "pending",
      "created_at": "2023-01-26T11:15:40Z",
      "updated_at": "2023-01-26T11:15:40Z"
    },
    // 更多举报...
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 8,
    "total_pages": 1
  }
}
```

### 4.4 处理举报

**请求方法**: PATCH

**URL**: `/api/v1/reports/{id}`

**功能描述**: 处理举报

**路径参数**:
- id: 举报ID

**请求头**:
- Authorization: Bearer {token} (必选，需要管理权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "status": "resolved", // 可选值: pending, reviewing, resolved, rejected
  "resolution_note": "已删除侵权内容",
  "action_taken": "content_removed" // 可选值: no_action, warning_issued, content_removed, account_suspended
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Report processed successfully",
  "data": {
    "id": 15,
    "status": "resolved",
    "updated_at": "2023-01-26T14:20:30Z"
  }
}
```

## 5. 权限要求

| API端点 | 所需权限 |
|---------|---------|
| GET /articles/{id}/comments<br>GET /comments/{id} | 公开评论：匿名可访问<br>所有状态评论：需`moderate_comments`权限 |
| POST /articles/{id}/comments<br>POST /comments/{id}/replies | 取决于系统设置，匿名评论可能需要管理员审核 |
| PUT /comments/{id} | 自己的评论：需`edit_own_comment`权限<br>他人评论：需`edit_any_comment`权限 |
| PATCH /comments/{id}/status<br>PATCH /comments/{id}/pin | 需`moderate_comments`权限 |
| DELETE /comments/{id} | 自己的评论：需`delete_own_comment`权限<br>他人评论：需`delete_any_comment`权限 |
| 点赞/收藏API | 匿名用户可点赞<br>收藏需要用户登录 |
| 举报API | 匿名用户可举报<br>查看和处理举报需要`moderate_reports`权限 | 
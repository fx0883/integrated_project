# CMS系统API设计文档 - 统计与分析

## 1. 统计与分析API概述

统计与分析API提供对CMS系统中数据分析和内容性能监控功能的支持。这些API提供关于文章访问、用户行为、内容互动等方面的统计数据，帮助内容管理者了解站点运营情况并做出数据驱动的决策。

## 2. 内容统计API

### 2.1 获取站点概览统计

**请求方法**: GET

**URL**: `/api/v1/statistics/overview`

**功能描述**: 获取站点整体统计数据

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year, all，默认month |
| start_date | query | string | 否 | 统计起始日期，格式YYYY-MM-DD |
| end_date | query | string | 否 | 统计结束日期，格式YYYY-MM-DD |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "period": {
      "start_date": "2023-01-01",
      "end_date": "2023-01-31",
      "days": 31
    },
    "content": {
      "total_articles": 120,
      "published_articles": 85,
      "draft_articles": 35,
      "total_categories": 12,
      "total_tags": 45,
      "new_articles": 18
    },
    "users": {
      "total_users": 250,
      "active_users": 230,
      "new_users": 15,
      "authors_count": 20
    },
    "engagement": {
      "total_views": 25800,
      "unique_views": 15600,
      "avg_views_per_article": 303,
      "total_comments": 320,
      "total_likes": 540,
      "total_shares": 180
    },
    "performance": {
      "avg_session_duration": 185,
      "bounce_rate": 45.2,
      "most_active_hour": 15,
      "most_active_day": "Wednesday"
    }
  }
}
```

### 2.2 获取内容趋势

**请求方法**: GET

**URL**: `/api/v1/statistics/content/trends`

**功能描述**: 获取内容发布和互动趋势数据

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year，默认month |
| start_date | query | string | 否 | 统计起始日期，格式YYYY-MM-DD |
| end_date | query | string | 否 | 统计结束日期，格式YYYY-MM-DD |
| metrics | query | string | 否 | 需要返回的指标，多个用逗号分隔，如views,comments,shares，默认返回所有 |
| granularity | query | string | 否 | 数据粒度，可选值: hour, day, week, month，默认根据period自动选择 |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "period": {
      "start_date": "2023-01-01",
      "end_date": "2023-01-31",
      "granularity": "day"
    },
    "views": [
      {"date": "2023-01-01", "count": 820},
      {"date": "2023-01-02", "count": 750},
      {"date": "2023-01-03", "count": 920},
      // ...更多数据点
    ],
    "unique_views": [
      {"date": "2023-01-01", "count": 520},
      {"date": "2023-01-02", "count": 480},
      {"date": "2023-01-03", "count": 560},
      // ...更多数据点
    ],
    "comments": [
      {"date": "2023-01-01", "count": 12},
      {"date": "2023-01-02", "count": 8},
      {"date": "2023-01-03", "count": 15},
      // ...更多数据点
    ],
    "likes": [
      {"date": "2023-01-01", "count": 25},
      {"date": "2023-01-02", "count": 18},
      {"date": "2023-01-03", "count": 32},
      // ...更多数据点
    ],
    "publishes": [
      {"date": "2023-01-01", "count": 2},
      {"date": "2023-01-02", "count": 0},
      {"date": "2023-01-03", "count": 3},
      // ...更多数据点
    ]
  }
}
```

### 2.3 获取热门内容

**请求方法**: GET

**URL**: `/api/v1/statistics/content/popular`

**功能描述**: 获取网站热门文章列表

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year, all，默认week |
| metric | query | string | 否 | 排序指标，可选值: views, likes, comments, shares, reading_time，默认views |
| category_id | query | integer | 否 | 按分类ID过滤 |
| limit | query | integer | 否 | 返回数量，默认10，最大50 |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
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
      "author": {
        "id": 10,
        "username": "demo_user",
        "display_name": "示例用户"
      },
      "published_at": "2023-01-03T10:25:00Z",
      "metrics": {
        "views_count": 1250,
        "unique_views_count": 980,
        "likes_count": 45,
        "comments_count": 18,
        "shares_count": 12,
        "avg_reading_time": 300
      }
    },
    // 更多热门文章...
  ]
}
```

### 2.4 获取分类统计

**请求方法**: GET

**URL**: `/api/v1/statistics/categories`

**功能描述**: 获取各分类的内容统计

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year, all，默认month |
| sort | query | string | 否 | 排序指标，可选值: articles_count, views, engagement，默认views |
| limit | query | integer | 否 | 返回数量，默认all |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 3,
      "name": "技术",
      "slug": "technology",
      "articles_count": 42,
      "views_count": 12500,
      "comments_count": 180,
      "likes_count": 450,
      "avg_reading_time": 290,
      "engagement_rate": 8.5
    },
    {
      "id": 5,
      "name": "设计",
      "slug": "design",
      "articles_count": 28,
      "views_count": 8200,
      "comments_count": 120,
      "likes_count": 380,
      "avg_reading_time": 320,
      "engagement_rate": 7.2
    },
    // 更多分类...
  ]
}
```

### 2.5 获取标签统计

**请求方法**: GET

**URL**: `/api/v1/statistics/tags`

**功能描述**: 获取各标签的内容统计

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year, all，默认month |
| sort | query | string | 否 | 排序指标，可选值: articles_count, views, engagement，默认views |
| limit | query | integer | 否 | 返回数量，默认20，最大50 |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 5,
      "name": "Python",
      "slug": "python",
      "articles_count": 25,
      "views_count": 8500,
      "engagement_rate": 9.2
    },
    {
      "id": 8,
      "name": "JavaScript",
      "slug": "javascript",
      "articles_count": 32,
      "views_count": 7800,
      "engagement_rate": 8.5
    },
    // 更多标签...
  ]
}
```

## 3. 用户行为分析API

### 3.1 获取读者地域分布

**请求方法**: GET

**URL**: `/api/v1/statistics/audience/geography`

**功能描述**: 获取读者的地理位置分布

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year, all，默认month |
| level | query | string | 否 | 地理级别，可选值: country, region, city，默认country |
| limit | query | integer | 否 | 每级返回数量，默认10，最大50 |

**请求头**:
- Authorization: Bearer {token} (必选，需要高级统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "countries": [
      {"name": "中国", "code": "CN", "count": 12500, "percentage": 48.5},
      {"name": "美国", "code": "US", "count": 5200, "percentage": 20.2},
      {"name": "日本", "code": "JP", "count": 2100, "percentage": 8.1},
      // 更多国家...
    ],
    "regions": [
      {"country": "CN", "name": "广东省", "count": 3200, "percentage": 25.6},
      {"country": "CN", "name": "北京市", "count": 2800, "percentage": 22.4},
      {"country": "US", "name": "California", "count": 1500, "percentage": 28.8},
      // 更多地区...
    ],
    "cities": [
      {"country": "CN", "region": "广东省", "name": "深圳市", "count": 1800, "percentage": 56.3},
      {"country": "CN", "region": "北京市", "name": "北京市", "count": 2800, "percentage": 100.0},
      {"country": "US", "region": "California", "name": "San Francisco", "count": 850, "percentage": 56.7},
      // 更多城市...
    ]
  }
}
```

### 3.2 获取设备分布

**请求方法**: GET

**URL**: `/api/v1/statistics/audience/devices`

**功能描述**: 获取读者使用的设备和浏览器分布

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year, all，默认month |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "device_types": [
      {"name": "desktop", "count": 15600, "percentage": 60.5},
      {"name": "mobile", "count": 8900, "percentage": 34.5},
      {"name": "tablet", "count": 1300, "percentage": 5.0}
    ],
    "operating_systems": [
      {"name": "Windows", "count": 9800, "percentage": 38.0},
      {"name": "Android", "count": 7200, "percentage": 27.9},
      {"name": "iOS", "count": 5600, "percentage": 21.7},
      {"name": "macOS", "count": 2800, "percentage": 10.9},
      {"name": "Linux", "count": 400, "percentage": 1.5}
    ],
    "browsers": [
      {"name": "Chrome", "count": 14500, "percentage": 56.2},
      {"name": "Safari", "count": 6200, "percentage": 24.0},
      {"name": "Firefox", "count": 2100, "percentage": 8.1},
      {"name": "Edge", "count": 1800, "percentage": 7.0},
      {"name": "Others", "count": 1200, "percentage": 4.7}
    ]
  }
}
```

### 3.3 获取流量来源

**请求方法**: GET

**URL**: `/api/v1/statistics/traffic/sources`

**功能描述**: 获取网站流量来源分析

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month, year，默认month |
| start_date | query | string | 否 | 统计起始日期，格式YYYY-MM-DD |
| end_date | query | string | 否 | 统计结束日期，格式YYYY-MM-DD |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "sources": [
      {"type": "direct", "count": 8500, "percentage": 32.9},
      {"type": "search", "count": 10200, "percentage": 39.5},
      {"type": "social", "count": 4800, "percentage": 18.6},
      {"type": "referral", "count": 1800, "percentage": 7.0},
      {"type": "email", "count": 500, "percentage": 1.9},
      {"type": "other", "count": 0, "percentage": 0.0}
    ],
    "search_engines": [
      {"name": "Google", "count": 8500, "percentage": 83.3},
      {"name": "Bing", "count": 950, "percentage": 9.3},
      {"name": "Baidu", "count": 450, "percentage": 4.4},
      {"name": "Others", "count": 300, "percentage": 2.9}
    ],
    "social_networks": [
      {"name": "Twitter", "count": 1800, "percentage": 37.5},
      {"name": "Facebook", "count": 1250, "percentage": 26.0},
      {"name": "LinkedIn", "count": 850, "percentage": 17.7},
      {"name": "WeChat", "count": 450, "percentage": 9.4},
      {"name": "Others", "count": 450, "percentage": 9.4}
    ],
    "top_referrers": [
      {"domain": "example.com", "count": 450, "percentage": 25.0},
      {"domain": "partner-site.com", "count": 380, "percentage": 21.1},
      {"domain": "news-aggregator.com", "count": 320, "percentage": 17.8},
      // 更多来源...
    ]
  }
}
```

### 3.4 获取用户行为路径

**请求方法**: GET

**URL**: `/api/v1/statistics/user-paths`

**功能描述**: 获取用户在网站上的行为路径分析

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: day, week, month，默认week |
| path_length | query | integer | 否 | 路径长度，默认3，最大5 |
| start_page | query | string | 否 | 起始页面类型，如homepage, article, category |

**请求头**:
- Authorization: Bearer {token} (必选，需要高级统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "common_paths": [
      {
        "path": ["首页", "分类页:技术", "文章页"],
        "user_count": 3200,
        "percentage": 20.5,
        "avg_time": 320
      },
      {
        "path": ["搜索结果", "文章页", "相关文章"],
        "user_count": 2500,
        "percentage": 16.0,
        "avg_time": 280
      },
      {
        "path": ["首页", "热门文章", "作者页面"],
        "user_count": 1800,
        "percentage": 11.5,
        "avg_time": 350
      },
      // 更多路径...
    ],
    "entry_pages": [
      {"type": "首页", "count": 8500, "percentage": 54.5},
      {"type": "文章页", "count": 4200, "percentage": 26.9},
      {"type": "搜索结果", "count": 2900, "percentage": 18.6}
    ],
    "exit_pages": [
      {"type": "文章页", "count": 9800, "percentage": 62.8},
      {"type": "作者页面", "count": 3200, "percentage": 20.5},
      {"type": "首页", "count": 2600, "percentage": 16.7}
    ]
  }
}
```

## 4. 作者统计API

### 4.1 获取作者排行榜

**请求方法**: GET

**URL**: `/api/v1/statistics/authors/ranking`

**功能描述**: 获取作者排行榜数据

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: week, month, year, all，默认month |
| metric | query | string | 否 | 排序指标，可选值: articles_count, views, comments, likes, shares，默认views |
| limit | query | integer | 否 | 返回数量，默认10，最大50 |

**请求头**:
- Authorization: Bearer {token} (必选，需要统计查看权限)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "user_id": 10,
      "username": "demo_user",
      "display_name": "示例用户",
      "avatar": "https://example.com/avatars/demo_user.jpg",
      "articles_count": 15,
      "views_count": 12500,
      "comments_count": 180,
      "likes_count": 450,
      "shares_count": 120,
      "engagement_rate": 8.4
    },
    {
      "user_id": 12,
      "username": "author2",
      "display_name": "另一个作者",
      "avatar": "https://example.com/avatars/author2.jpg",
      "articles_count": 12,
      "views_count": 9800,
      "comments_count": 150,
      "likes_count": 320,
      "shares_count": 90,
      "engagement_rate": 7.2
    },
    // 更多作者...
  ]
}
```

### 4.2 获取单个作者统计

**请求方法**: GET

**URL**: `/api/v1/statistics/authors/{id}`
或 `/api/v1/statistics/authors/me`

**功能描述**: 获取单个作者的统计数据

**路径参数**:
- id: 作者用户ID

**请求参数**:

| 参数名 | 位置 | 类型 | 必选 | 描述 |
|--------|------|------|------|------|
| period | query | string | 否 | 统计周期，可选值: week, month, year, all，默认month |

**请求头**:
- Authorization: Bearer {token} (必选，作者可查看自己的统计，管理员可查看所有)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "author": {
      "id": 10,
      "username": "demo_user",
      "display_name": "示例用户",
      "avatar": "https://example.com/avatars/demo_user.jpg"
    },
    "overview": {
      "total_articles": 15,
      "published_articles": 12,
      "draft_articles": 3,
      "total_views": 12500,
      "total_comments": 180,
      "total_likes": 450,
      "total_shares": 120,
      "avg_views_per_article": 1042,
      "engagement_rate": 8.4
    },
    "top_articles": [
      {
        "id": 120,
        "title": "Python开发最佳实践",
        "views_count": 1250,
        "comments_count": 18,
        "likes_count": 45
      },
      // 更多文章...
    ],
    "trends": {
      "views": [
        {"date": "2023-01-01", "count": 380},
        {"date": "2023-01-02", "count": 420},
        // 更多数据点...
      ],
      "comments": [
        {"date": "2023-01-01", "count": 5},
        {"date": "2023-01-02", "count": 8},
        // 更多数据点...
      ],
      "likes": [
        {"date": "2023-01-01", "count": 12},
        {"date": "2023-01-02", "count": 18},
        // 更多数据点...
      ]
    },
    "audience": {
      "top_countries": [
        {"name": "中国", "percentage": 45.2},
        {"name": "美国", "percentage": 22.5},
        {"name": "日本", "percentage": 8.3}
      ],
      "device_types": [
        {"name": "desktop", "percentage": 58.2},
        {"name": "mobile", "percentage": 36.5},
        {"name": "tablet", "percentage": 5.3}
      ]
    }
  }
}
```

## 5. 导出API

### 5.1 导出统计数据

**请求方法**: POST

**URL**: `/api/v1/statistics/export`

**功能描述**: 导出统计数据报表

**请求头**:
- Authorization: Bearer {token} (必选，需要高级统计查看权限)
- Content-Type: application/json
- X-Tenant-ID: {tenant_id}

**请求体**:

```json
{
  "report_type": "content_performance", // 可选值: content_performance, audience_analysis, author_statistics, custom
  "format": "csv", // 可选值: csv, excel, pdf
  "period": "month", // 可选值: day, week, month, year, custom
  "start_date": "2023-01-01", // 当period为custom时必填
  "end_date": "2023-01-31", // 当period为custom时必填
  "metrics": ["views", "unique_views", "likes", "comments"], // 需要导出的指标
  "filters": { // 可选过滤条件
    "category_id": 3,
    "tag_id": 5,
    "author_id": 10
  },
  "include_charts": true // 是否包含图表(仅PDF格式有效)
}
```

**响应示例**:

```json
{
  "code": 200,
  "message": "Export task created successfully",
  "data": {
    "task_id": "export_12345",
    "status": "processing",
    "estimated_completion_time": "30 seconds"
  }
}
```

### 5.2 检查导出状态

**请求方法**: GET

**URL**: `/api/v1/statistics/export/{task_id}`

**功能描述**: 检查统计数据导出任务状态

**路径参数**:
- task_id: 导出任务ID

**请求头**:
- Authorization: Bearer {token} (必选)
- X-Tenant-ID: {tenant_id}

**响应示例**:

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "task_id": "export_12345",
    "status": "completed", // processing, completed, failed
    "progress": 100,
    "download_url": "https://example.com/downloads/statistics_export_12345.csv",
    "expires_at": "2023-02-02T15:30:45Z"
  }
}
```

## 6. 权限要求

| API端点 | 所需权限 |
|---------|---------|
| GET /statistics/overview | 需`view_statistics`权限 |
| GET /statistics/content/* | 需`view_content_stats`权限 |
| GET /statistics/audience/* | 需`view_audience_stats`权限 |
| GET /statistics/authors/ranking | 需`view_author_stats`权限 |
| GET /statistics/authors/{id} | 自己的统计：需`view_own_stats`权限<br>他人统计：需`view_all_author_stats`权限 |
| GET /statistics/traffic/* | 需`view_traffic_stats`权限 |
| GET /statistics/user-paths | 需`view_advanced_stats`权限 |
| POST /statistics/export | 需`export_statistics`权限 | 
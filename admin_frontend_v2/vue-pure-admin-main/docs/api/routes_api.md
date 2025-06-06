# 路由API文档

## 接口说明

该接口用于获取系统动态路由配置，前端根据返回的路由数据动态生成菜单和路由。

- **接口URL**: `/api/v1/routes`
- **请求方式**: GET
- **认证要求**: 需要认证，请求头需包含有效的 Token

## 响应格式

```json
{
  "success": true,
  "code": 2000,
  "message": "获取路由成功",
  "data": [
    {
      "path": "/tenant",
      "name": "Tenant",
      "component": "Layout",
      "redirect": "/tenant/list",
      "meta": {
        "icon": "ep:office-building",
        "title": "租户管理",
        "rank": 4,
        "roles": ["admin", "tenant_admin"]
      },
      "children": [
        {
          "path": "list",
          "name": "TenantList",
          "component": "/src/views/tenant/list",
          "meta": {
            "title": "租户列表",
            "roles": ["admin", "tenant_admin"]
          }
        },
        {
          "path": "detail/:id",
          "name": "TenantDetail",
          "component": "/src/views/tenant/detail",
          "meta": {
            "title": "租户详情",
            "showLink": false,
            "activePath": "/tenant/list",
            "roles": ["admin", "tenant_admin"]
          }
        },
        {
          "path": "create",
          "name": "TenantCreate",
          "component": "/src/views/tenant/form",
          "meta": {
            "title": "创建租户",
            "showLink": false,
            "activePath": "/tenant/list",
            "roles": ["admin", "tenant_admin"]
          }
        },
        {
          "path": "edit/:id",
          "name": "TenantEdit",
          "component": "/src/views/tenant/form",
          "meta": {
            "title": "编辑租户",
            "showLink": false,
            "activePath": "/tenant/list",
            "roles": ["admin", "tenant_admin"]
          }
        }
      ]
    },
    {
      "path": "/user",
      "name": "User",
      "component": "Layout",
      "redirect": "/user/list",
      "meta": {
        "title": "用户管理",
        "icon": "ri:user-line",
        "rank": 5,
        "roles": ["admin", "tenant_admin"]
      },
      "children": [
        {
          "path": "list",
          "name": "UserList",
          "component": "/src/views/user/list/index",
          "meta": {
            "title": "用户列表",
            "roles": ["admin", "tenant_admin"]
          }
        },
        {
          "path": "detail/:id",
          "name": "UserDetail",
          "component": "/src/views/user/detail/index",
          "meta": {
            "title": "用户详情",
            "showLink": false,
            "activePath": "/user/list",
            "roles": ["admin", "tenant_admin"]
          }
        }
      ]
    },
    {
      "path": "/cms",
      "name": "CMS",
      "component": "Layout", 
      "redirect": "/cms/article/list",
      "meta": {
        "icon": "ri:article-line",
        "title": "内容管理",
        "rank": 2,
        "roles": ["admin", "content_editor"]
      },
      "children": [
        {
          "path": "statistics",
          "name": "CMSStatistics",
          "component": "/src/views/cms/statistics/index",
          "meta": {
            "title": "统计分析",
            "icon": "ep:data-analysis",
            "roles": ["admin", "content_editor"]
          }
        },
        {
          "path": "article",
          "name": "CMSArticle",
          "component": "/src/views/cms/article/index",
          "redirect": "article/list",
          "meta": {
            "icon": "ri:article-line",
            "title": "文章管理",
            "roles": ["admin", "content_editor"]
          },
          "children": [
            {
              "path": "list",
              "name": "ArticleList",
              "component": "/src/views/cms/article/list",
              "meta": {
                "title": "文章列表",
                "roles": ["admin", "content_editor"]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 字段说明

### 顶层字段

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| success | Boolean | 请求是否成功，true表示成功，false表示失败 |
| code | Integer | 业务状态码，2000表示成功 |
| message | String | 操作结果的文字描述 |
| data | Array | 路由配置数组 |

### 路由对象字段

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| path | String | 路由路径 |
| name | String | 路由名称，唯一标识 |
| component | String | 组件路径，"Layout"表示使用布局组件 |
| redirect | String | 重定向路径（可选） |
| meta | Object | 路由元数据 |
| children | Array | 子路由数组（可选） |

### meta字段

| 字段名 | 类型 | 说明 |
|-------|------|-----|
| title | String | 菜单标题 |
| icon | String | 菜单图标 |
| rank | Number | 菜单排序，数字越小越靠前 |
| roles | Array | 可访问该菜单的角色数组 |
| showLink | Boolean | 是否在菜单中显示（可选，默认true） |
| activePath | String | 当前路由激活的菜单路径（可选） |

## 特别说明

1. 超级管理员（super_admin）的菜单由前端硬编码处理，不通过此API获取

2. component字段的值：
   - 如果是布局组件，值为 "Layout"（前端会解析为 `@/layout/index.vue`）
   - 如果是具体页面，值为组件路径，如 "/src/views/tenant/list"

3. 路由结构支持多级嵌套，通过 children 数组定义子路由

4. 前端会根据用户角色过滤这些路由，只显示当前用户有权限访问的菜单 
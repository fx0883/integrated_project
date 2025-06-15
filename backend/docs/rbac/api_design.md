# RBAC API设计

本文档定义了RBAC权限控制系统的API接口设计。

## 1. 权限管理API

### 1.1 获取权限列表

**请求**:
```
GET /api/rbac/permissions/
```

**参数**:
- `category`: 权限类别过滤
- `search`: 搜索关键词
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 100,
    "next": "http://example.com/api/rbac/permissions/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "code": "user:view",
        "name": "查看用户",
        "description": "允许查看用户列表和详情",
        "category": "用户管理",
        "is_system": true,
        "created_at": "2023-01-01T00:00:00Z"
      },
      // ...更多权限
    ]
  }
}
```

### 1.2 创建权限

**请求**:
```
POST /api/rbac/permissions/
```

**请求体**:
```json
{
  "code": "user:create",
  "name": "创建用户",
  "description": "允许创建新用户",
  "category": "用户管理",
  "is_system": false
}
```

**响应**:
```json
{
  "code": 201,
  "message": "权限创建成功",
  "data": {
    "id": 2,
    "code": "user:create",
    "name": "创建用户",
    "description": "允许创建新用户",
    "category": "用户管理",
    "is_system": false,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### 1.3 获取权限详情

**请求**:
```
GET /api/rbac/permissions/{id}/
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "code": "user:view",
    "name": "查看用户",
    "description": "允许查看用户列表和详情",
    "category": "用户管理",
    "is_system": true,
    "created_at": "2023-01-01T00:00:00Z",
    "roles": [
      {
        "id": 1,
        "name": "管理员",
        "code": "admin"
      },
      // ...更多角色
    ]
  }
}
```

### 1.4 更新权限

**请求**:
```
PUT /api/rbac/permissions/{id}/
```

**请求体**:
```json
{
  "name": "查看用户信息",
  "description": "允许查看用户列表和详细信息",
  "category": "用户管理"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "权限更新成功",
  "data": {
    "id": 1,
    "code": "user:view",
    "name": "查看用户信息",
    "description": "允许查看用户列表和详细信息",
    "category": "用户管理",
    "is_system": true,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### 1.5 删除权限

**请求**:
```
DELETE /api/rbac/permissions/{id}/
```

**响应**:
```json
{
  "code": 204,
  "message": "权限删除成功",
  "data": null
}
```

## 2. 角色管理API

### 2.1 获取角色列表

**请求**:
```
GET /api/rbac/roles/
```

**参数**:
- `tenant_id`: 租户ID过滤
- `search`: 搜索关键词
- `is_system`: 是否系统角色
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 50,
    "next": "http://example.com/api/rbac/roles/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "系统管理员",
        "code": "system_admin",
        "description": "系统级管理员角色",
        "is_system": true,
        "tenant": null,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z",
        "permission_count": 50
      },
      // ...更多角色
    ]
  }
}
```

### 2.2 创建角色

**请求**:
```
POST /api/rbac/roles/
```

**请求体**:
```json
{
  "name": "内容编辑",
  "code": "content_editor",
  "description": "内容编辑角色",
  "is_system": false,
  "tenant_id": 1,
  "permissions": [1, 2, 3]
}
```

**响应**:
```json
{
  "code": 201,
  "message": "角色创建成功",
  "data": {
    "id": 2,
    "name": "内容编辑",
    "code": "content_editor",
    "description": "内容编辑角色",
    "is_system": false,
    "tenant": {
      "id": 1,
      "name": "示例租户"
    },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "permissions": [
      {
        "id": 1,
        "code": "content:view",
        "name": "查看内容"
      },
      // ...更多权限
    ]
  }
}
```

### 2.3 获取角色详情

**请求**:
```
GET /api/rbac/roles/{id}/
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "系统管理员",
    "code": "system_admin",
    "description": "系统级管理员角色",
    "is_system": true,
    "tenant": null,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "permissions": [
      {
        "id": 1,
        "code": "user:view",
        "name": "查看用户"
      },
      // ...更多权限
    ],
    "user_count": 5
  }
}
```

### 2.4 更新角色

**请求**:
```
PUT /api/rbac/roles/{id}/
```

**请求体**:
```json
{
  "name": "高级管理员",
  "description": "系统高级管理员角色",
  "permissions": [1, 2, 3, 4, 5]
}
```

**响应**:
```json
{
  "code": 200,
  "message": "角色更新成功",
  "data": {
    "id": 1,
    "name": "高级管理员",
    "code": "system_admin",
    "description": "系统高级管理员角色",
    "is_system": true,
    "tenant": null,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### 2.5 删除角色

**请求**:
```
DELETE /api/rbac/roles/{id}/
```

**响应**:
```json
{
  "code": 204,
  "message": "角色删除成功",
  "data": null
}
```

## 3. 用户角色管理API

### 3.1 获取用户角色列表

**请求**:
```
GET /api/rbac/user-roles/
```

**参数**:
- `user_id`: 用户ID过滤
- `role_id`: 角色ID过滤
- `is_active`: 是否激活
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "count": 20,
    "next": "http://example.com/api/rbac/user-roles/?page=2",
    "previous": null,
    "results": [
      {
        "id": 1,
        "user": {
          "id": 1,
          "username": "admin"
        },
        "role": {
          "id": 1,
          "name": "系统管理员",
          "code": "system_admin"
        },
        "is_active": true,
        "start_time": "2023-01-01T00:00:00Z",
        "end_time": null,
        "created_at": "2023-01-01T00:00:00Z"
      },
      // ...更多用户角色
    ]
  }
}
```

### 3.2 分配用户角色

**请求**:
```
POST /api/rbac/user-roles/
```

**请求体**:
```json
{
  "user_id": 2,
  "role_id": 3,
  "is_active": true,
  "start_time": "2023-01-01T00:00:00Z",
  "end_time": "2023-12-31T23:59:59Z"
}
```

**响应**:
```json
{
  "code": 201,
  "message": "用户角色分配成功",
  "data": {
    "id": 2,
    "user": {
      "id": 2,
      "username": "editor"
    },
    "role": {
      "id": 3,
      "name": "编辑",
      "code": "editor"
    },
    "is_active": true,
    "start_time": "2023-01-01T00:00:00Z",
    "end_time": "2023-12-31T23:59:59Z",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### 3.3 更新用户角色

**请求**:
```
PUT /api/rbac/user-roles/{id}/
```

**请求体**:
```json
{
  "is_active": false,
  "end_time": "2023-06-30T23:59:59Z"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "用户角色更新成功",
  "data": {
    "id": 2,
    "user": {
      "id": 2,
      "username": "editor"
    },
    "role": {
      "id": 3,
      "name": "编辑",
      "code": "editor"
    },
    "is_active": false,
    "start_time": "2023-01-01T00:00:00Z",
    "end_time": "2023-06-30T23:59:59Z",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### 3.4 删除用户角色

**请求**:
```
DELETE /api/rbac/user-roles/{id}/
```

**响应**:
```json
{
  "code": 204,
  "message": "用户角色删除成功",
  "data": null
}
```

## 4. 用户权限API

### 4.1 获取当前用户权限

**请求**:
```
GET /api/rbac/my-permissions/
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "permissions": [
      {
        "code": "user:view",
        "name": "查看用户"
      },
      {
        "code": "user:create",
        "name": "创建用户"
      },
      // ...更多权限
    ],
    "roles": [
      {
        "id": 1,
        "name": "系统管理员",
        "code": "system_admin"
      }
    ]
  }
}
```

### 4.2 检查当前用户是否有特定权限

**请求**:
```
POST /api/rbac/check-permission/
```

**请求体**:
```json
{
  "permission_code": "user:create"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "has_permission": true
  }
}
```

### 4.3 获取用户的权限

**请求**:
```
GET /api/rbac/users/{user_id}/permissions/
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "admin"
    },
    "permissions": [
      {
        "code": "user:view",
        "name": "查看用户"
      },
      // ...更多权限
    ],
    "roles": [
      {
        "id": 1,
        "name": "系统管理员",
        "code": "system_admin"
      }
    ]
  }
}
```

## 5. 权限分类API

### 5.1 获取权限分类列表

**请求**:
```
GET /api/rbac/permission-categories/
```

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "category": "用户管理",
      "count": 10
    },
    {
      "category": "内容管理",
      "count": 15
    },
    // ...更多分类
  ]
}
``` 
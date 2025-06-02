# 集成管理系统API接口文档

本文档详细说明了集成管理系统的前端与后端交互的API接口。系统API采用RESTful设计风格，主要包括认证、用户管理、租户管理和打卡管理等模块。

## 1. 基础信息

- **基础URL**: 根据环境配置决定
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **错误处理**: 统一的错误响应格式

### 错误响应格式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

## 2. 认证API

认证API负责用户登录、注册、密码重置等功能。

### 2.1 用户登录

- **URL**: `/auth/login/`
- **方法**: POST
- **描述**: 用户登录并获取访问令牌
- **请求参数**:

```json
{
  "username": "用户名",
  "password": "密码"
}
```

- **响应**:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "is_admin": true,
    "is_super_admin": true
  }
}
```

### 2.2 用户注册

- **URL**: `/auth/register/`
- **方法**: POST
- **描述**: 注册新用户
- **请求参数**:

```json
{
  "username": "新用户名",
  "email": "user@example.com",
  "password": "密码",
  "confirm_password": "确认密码"
}
```

- **响应**:

```json
{
  "id": 2,
  "username": "新用户名",
  "email": "user@example.com",
  "message": "注册成功"
}
```

### 2.3 密码重置

- **URL**: `/auth/reset-password/`
- **方法**: POST
- **描述**: 发送密码重置邮件
- **请求参数**:

```json
{
  "email": "user@example.com"
}
```

- **响应**:

```json
{
  "message": "密码重置邮件已发送"
}
```

### 2.4 获取用户信息

- **URL**: `/auth/profile/`
- **方法**: GET
- **描述**: 获取当前登录用户信息
- **认证**: 需要令牌
- **响应**:

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "is_admin": true,
  "is_super_admin": true,
  "last_login": "2023-09-30T12:34:56Z"
}
```

## 3. 用户管理API

用户管理API负责用户的CRUD操作。

### 3.1 获取用户列表

- **URL**: `/users/`
- **方法**: GET
- **描述**: 获取用户列表，支持分页、排序和筛选
- **认证**: 需要管理员令牌
- **请求参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `search`: 搜索关键词
  - `sort_by`: 排序字段
  - `order`: 排序方向 (asc/desc)

- **响应**:

```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "is_active": true,
      "created_at": "2023-09-01T10:00:00Z"
    },
    // ...更多用户
  ]
}
```

### 3.2 创建用户

- **URL**: `/users/`
- **方法**: POST
- **描述**: 创建新用户
- **认证**: 需要管理员令牌
- **请求参数**:

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password",
  "is_active": true,
  "is_admin": false
}
```

- **响应**:

```json
{
  "id": 3,
  "username": "newuser",
  "email": "newuser@example.com",
  "is_active": true,
  "is_admin": false,
  "created_at": "2023-10-01T10:00:00Z"
}
```

### 3.3 获取用户详情

- **URL**: `/users/{id}/`
- **方法**: GET
- **描述**: 获取指定用户详情
- **认证**: 需要管理员令牌
- **响应**:

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "is_active": true,
  "is_admin": true,
  "is_super_admin": true,
  "created_at": "2023-09-01T10:00:00Z",
  "last_login": "2023-09-30T12:34:56Z"
}
```

### 3.4 更新用户

- **URL**: `/users/{id}/`
- **方法**: PUT
- **描述**: 更新指定用户信息
- **认证**: 需要管理员令牌
- **请求参数**:

```json
{
  "username": "updated_user",
  "email": "updated@example.com",
  "is_active": true,
  "is_admin": true
}
```

- **响应**:

```json
{
  "id": 1,
  "username": "updated_user",
  "email": "updated@example.com",
  "is_active": true,
  "is_admin": true,
  "is_super_admin": true,
  "updated_at": "2023-10-01T12:00:00Z"
}
```

### 3.5 删除用户

- **URL**: `/users/{id}/`
- **方法**: DELETE
- **描述**: 删除指定用户
- **认证**: 需要管理员令牌
- **响应**: HTTP 204 No Content

## 4. 租户管理API

租户管理API负责租户的CRUD操作，仅超级管理员可访问。

### 4.1 获取租户列表

- **URL**: `/tenants/`
- **方法**: GET
- **描述**: 获取租户列表
- **认证**: 需要超级管理员令牌
- **请求参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `search`: 搜索关键词

- **响应**:

```json
{
  "total": 50,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 1,
      "name": "企业A",
      "code": "ENT_A",
      "is_active": true,
      "created_at": "2023-09-01T10:00:00Z"
    },
    // ...更多租户
  ]
}
```

### 4.2 创建租户

- **URL**: `/tenants/`
- **方法**: POST
- **描述**: 创建新租户
- **认证**: 需要超级管理员令牌
- **请求参数**:

```json
{
  "name": "企业B",
  "code": "ENT_B",
  "is_active": true,
  "admin_email": "admin@entb.com",
  "admin_username": "entb_admin",
  "admin_password": "password"
}
```

- **响应**:

```json
{
  "id": 2,
  "name": "企业B",
  "code": "ENT_B",
  "is_active": true,
  "created_at": "2023-10-01T10:00:00Z",
  "admin_user": {
    "id": 10,
    "username": "entb_admin",
    "email": "admin@entb.com"
  }
}
```

### 4.3 获取租户详情

- **URL**: `/tenants/{id}/`
- **方法**: GET
- **描述**: 获取指定租户详情
- **认证**: 需要超级管理员令牌
- **响应**:

```json
{
  "id": 1,
  "name": "企业A",
  "code": "ENT_A",
  "is_active": true,
  "created_at": "2023-09-01T10:00:00Z",
  "updated_at": "2023-09-30T12:34:56Z",
  "user_count": 50,
  "admin_users": [
    {
      "id": 5,
      "username": "enta_admin",
      "email": "admin@enta.com"
    }
  ]
}
```

### 4.4 更新租户

- **URL**: `/tenants/{id}/`
- **方法**: PUT
- **描述**: 更新指定租户信息
- **认证**: 需要超级管理员令牌
- **请求参数**:

```json
{
  "name": "企业A更新",
  "code": "ENT_A_NEW",
  "is_active": true
}
```

- **响应**:

```json
{
  "id": 1,
  "name": "企业A更新",
  "code": "ENT_A_NEW",
  "is_active": true,
  "updated_at": "2023-10-01T12:00:00Z"
}
```

### 4.5 删除租户

- **URL**: `/tenants/{id}/`
- **方法**: DELETE
- **描述**: 删除指定租户
- **认证**: 需要超级管理员令牌
- **响应**: HTTP 204 No Content

## 5. 打卡管理API

打卡管理API负责打卡类型、任务和记录的CRUD操作。

### 5.1 打卡类型管理

#### 5.1.1 获取打卡类型列表

- **URL**: `/check-system/task-categories/`
- **方法**: GET
- **描述**: 获取打卡类型列表
- **认证**: 需要管理员令牌
- **请求参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `search`: 搜索关键词

- **响应**:

```json
{
  "total": 20,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 1,
      "name": "上班打卡",
      "description": "工作日上班打卡",
      "icon": "work.png",
      "color": "#FF5733",
      "is_active": true,
      "created_at": "2023-09-01T10:00:00Z"
    },
    // ...更多打卡类型
  ]
}
```

#### 5.1.2 创建打卡类型

- **URL**: `/check-system/task-categories/`
- **方法**: POST
- **描述**: 创建新打卡类型
- **认证**: 需要管理员令牌
- **请求参数**:

```json
{
  "name": "健身打卡",
  "description": "每日健身记录",
  "icon": "fitness.png",
  "color": "#33FF57",
  "is_active": true
}
```

- **响应**:

```json
{
  "id": 3,
  "name": "健身打卡",
  "description": "每日健身记录",
  "icon": "fitness.png",
  "color": "#33FF57",
  "is_active": true,
  "created_at": "2023-10-01T10:00:00Z"
}
```

#### 5.1.3 获取打卡类型详情

- **URL**: `/check-system/task-categories/{id}/`
- **方法**: GET
- **描述**: 获取指定打卡类型详情
- **认证**: 需要管理员令牌
- **响应**:

```json
{
  "id": 1,
  "name": "上班打卡",
  "description": "工作日上班打卡",
  "icon": "work.png",
  "color": "#FF5733",
  "is_active": true,
  "created_at": "2023-09-01T10:00:00Z",
  "updated_at": "2023-09-30T12:34:56Z",
  "tasks_count": 5
}
```

#### 5.1.4 更新打卡类型

- **URL**: `/check-system/task-categories/{id}/`
- **方法**: PUT
- **描述**: 更新指定打卡类型
- **认证**: 需要管理员令牌
- **请求参数**:

```json
{
  "name": "工作打卡",
  "description": "工作日签到",
  "icon": "work_new.png",
  "color": "#FF8C33",
  "is_active": true
}
```

- **响应**:

```json
{
  "id": 1,
  "name": "工作打卡",
  "description": "工作日签到",
  "icon": "work_new.png",
  "color": "#FF8C33",
  "is_active": true,
  "updated_at": "2023-10-01T12:00:00Z"
}
```

#### 5.1.5 删除打卡类型

- **URL**: `/check-system/task-categories/{id}/`
- **方法**: DELETE
- **描述**: 删除指定打卡类型
- **认证**: 需要管理员令牌
- **响应**: HTTP 204 No Content

### 5.2 打卡任务管理

#### 5.2.1 获取任务列表

- **URL**: `/tasks/`
- **方法**: GET
- **描述**: 获取打卡任务列表
- **认证**: 需要管理员令牌
- **请求参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `search`: 搜索关键词
  - `category_id`: 类型ID筛选
  - `status`: 状态筛选

- **响应**:

```json
{
  "total": 30,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 1,
      "title": "每日上班打卡",
      "description": "工作日9:00前打卡",
      "category": {
        "id": 1,
        "name": "上班打卡"
      },
      "start_time": "09:00:00",
      "end_time": "18:00:00",
      "is_active": true,
      "created_at": "2023-09-01T10:00:00Z"
    },
    // ...更多任务
  ]
}
```

#### 5.2.2 创建任务

- **URL**: `/tasks/`
- **方法**: POST
- **描述**: 创建新打卡任务
- **认证**: 需要管理员令牌
- **请求参数**:

```json
{
  "title": "每周健身打卡",
  "description": "每周至少3次健身记录",
  "category_id": 3,
  "start_time": null,
  "end_time": null,
  "is_active": true,
  "rules": {
    "min_times_per_week": 3
  }
}
```

- **响应**:

```json
{
  "id": 5,
  "title": "每周健身打卡",
  "description": "每周至少3次健身记录",
  "category": {
    "id": 3,
    "name": "健身打卡"
  },
  "start_time": null,
  "end_time": null,
  "is_active": true,
  "rules": {
    "min_times_per_week": 3
  },
  "created_at": "2023-10-01T10:00:00Z"
}
```

### 5.3 打卡记录管理

#### 5.3.1 获取打卡记录列表

- **URL**: `/check-records/`
- **方法**: GET
- **描述**: 获取打卡记录列表
- **认证**: 需要管理员令牌
- **请求参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `user_id`: 用户ID筛选
  - `task_id`: 任务ID筛选
  - `start_date`: 开始日期
  - `end_date`: 结束日期

- **响应**:

```json
{
  "total": 500,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "username": "employee1"
      },
      "task": {
        "id": 1,
        "title": "每日上班打卡"
      },
      "check_time": "2023-09-01T08:55:00Z",
      "location": {
        "latitude": 39.9042,
        "longitude": 116.4074
      },
      "status": "approved",
      "created_at": "2023-09-01T08:55:00Z"
    },
    // ...更多记录
  ]
}
```

## 6. 统计分析API

### 6.1 获取打卡统计数据

- **URL**: `/check-system/statistics/`
- **方法**: GET
- **描述**: 获取打卡统计数据
- **认证**: 需要管理员令牌
- **请求参数**:
  - `start_date`: 开始日期
  - `end_date`: 结束日期
  - `category_id`: 类型ID筛选
  - `task_id`: 任务ID筛选

- **响应**:

```json
{
  "total_records": 500,
  "on_time_rate": 0.85,
  "daily_stats": [
    {
      "date": "2023-09-01",
      "count": 50,
      "on_time_count": 45,
      "late_count": 5
    },
    // ...更多日期数据
  ],
  "category_stats": [
    {
      "category_id": 1,
      "category_name": "上班打卡",
      "count": 300,
      "on_time_rate": 0.9
    },
    // ...更多类型数据
  ],
  "user_stats": [
    {
      "user_id": 2,
      "username": "employee1",
      "count": 20,
      "on_time_rate": 0.95
    },
    // ...更多用户数据
  ]
}
``` 
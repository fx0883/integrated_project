# 客户会员关系API接口文档

## 概述

本文档详细说明了客户会员关系管理相关的API接口，包括获取客户关联的会员列表、创建会员关系、更新会员关系和删除会员关系等操作。这些接口用于实现客户与会员之间的关联关系管理功能。

## 基础信息

- **基础URL**: `http://localhost:8000/api/v1`
- **认证方式**: Bearer Token
- **请求格式**: JSON
- **响应格式**: JSON

## 通用响应格式

所有API响应都遵循以下格式：

```json
{
  "success": true|false,
  "code": 2000,
  "message": "操作成功|失败原因",
  "data": { ... }
}
```

- `success`: 布尔值，表示请求是否成功
- `code`: 数字，表示状态码，2000表示成功
- `message`: 字符串，表示操作结果描述
- `data`: 对象或数组，包含响应数据

## API接口列表

### 1. 获取客户关联的会员列表

获取指定客户ID下的所有会员信息。

**请求**:

```
GET /customers/members/relations/customer-members/?customer_id={customer_id}
```

**查询参数**:

| 参数名 | 类型 | 必填 | 描述 |
|-------|-----|------|-----|
| customer_id | number | 是 | 客户ID |
| page | number | 否 | 页码，默认为1 |
| page_size | number | 否 | 每页条数，默认为10 |
| search | string | 否 | 搜索关键词 |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "results": [
      {
        "id": 32,
        "username": "AD9VRO-RMqzQM",
        "email": "user@example.com",
        "phone": "string",
        "nick_name": "string",
        "first_name": "string",
        "last_name": "string",
        "is_active": false,
        "avatar": "http://localhost:8000/string",
        "tenant": 17,
        "tenant_name": "cms_espressox",
        "is_sub_account": false,
        "parent": null,
        "parent_username": null,
        "date_joined": "2025-07-06T00:40:03.837536Z",
        "status": "inactive"
      }
    ],
    "pagination": {
      "count": 1,
      "page": 1,
      "page_size": 10,
      "total_pages": 1
    }
  }
}
```

### 2. 创建客户会员关系

创建客户与会员之间的关联关系。

**请求**:

```
POST /customers/members/relations/
```

**请求体**:

```json
{
  "customer_id": 6,
  "member_id": 12,
  "role": "技术联系人",
  "is_primary": false,
  "department": "IT部门",
  "notes": "负责技术对接"
}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|-------|-----|------|-----|
| customer_id | number | 是 | 客户ID |
| member_id | number | 是 | 会员ID |
| role | string | 是 | 会员角色 |
| is_primary | boolean | 否 | 是否为主要联系人，默认为false |
| department | string | 否 | 部门 |
| notes | string | 否 | 备注 |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "创建关系成功",
  "data": {
    "id": 45,
    "customer": {
      "id": 6,
      "name": "示例客户"
    },
    "member": {
      "id": 12,
      "username": "member001",
      "email": "member001@example.com",
      "phone": "13800138000",
      "nick_name": "张三"
    },
    "role": "技术联系人",
    "is_primary": false,
    "department": "IT部门",
    "notes": "负责技术对接",
    "created_at": "2023-07-06T10:40:03.837536Z",
    "updated_at": "2023-07-06T10:40:03.837536Z"
  }
}
```

### 3. 获取客户会员关系详情

获取特定的客户会员关系详情。

**请求**:

```
GET /customers/{customer_id}/members/{relation_id}/
```

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|-----|------|
| customer_id | number | 客户ID |
| relation_id | number | 关系ID |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "id": 45,
    "customer": {
      "id": 6,
      "name": "示例客户"
    },
    "member": {
      "id": 12,
      "username": "member001",
      "email": "member001@example.com",
      "phone": "13800138000",
      "nick_name": "张三"
    },
    "role": "技术联系人",
    "is_primary": false,
    "department": "IT部门",
    "notes": "负责技术对接",
    "created_at": "2023-07-06T10:40:03.837536Z",
    "updated_at": "2023-07-06T10:40:03.837536Z"
  }
}
```

### 4. 更新客户会员关系

更新特定的客户会员关系信息。

**请求**:

```
PUT /customers/{customer_id}/members/{relation_id}/
```

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|-----|------|
| customer_id | number | 客户ID |
| relation_id | number | 关系ID |

**请求体**:

```json
{
  "role": "高级技术联系人",
  "is_primary": true,
  "department": "研发部",
  "notes": "负责核心技术对接"
}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|-------|-----|------|-----|
| role | string | 否 | 会员角色 |
| is_primary | boolean | 否 | 是否为主要联系人 |
| department | string | 否 | 部门 |
| notes | string | 否 | 备注 |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "更新关系成功",
  "data": {
    "id": 45,
    "customer": {
      "id": 6,
      "name": "示例客户"
    },
    "member": {
      "id": 12,
      "username": "member001",
      "email": "member001@example.com",
      "phone": "13800138000",
      "nick_name": "张三"
    },
    "role": "高级技术联系人",
    "is_primary": true,
    "department": "研发部",
    "notes": "负责核心技术对接",
    "created_at": "2023-07-06T10:40:03.837536Z",
    "updated_at": "2023-07-06T11:20:15.123456Z"
  }
}
```

### 5. 删除客户会员关系

删除特定的客户会员关系。

**请求**:

```
DELETE /customers/{customer_id}/members/{relation_id}/
```

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|-----|------|
| customer_id | number | 客户ID |
| relation_id | number | 关系ID |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "删除关系成功",
  "data": null
}
```

### 6. 设置主要会员联系人

将特定会员设置为客户的主要联系人。

**请求**:

```
POST /customers/{customer_id}/members/{relation_id}/set-primary/
```

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|-----|------|
| customer_id | number | 客户ID |
| relation_id | number | 关系ID |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "设置主要联系人成功",
  "data": {
    "id": 45,
    "customer": {
      "id": 6,
      "name": "示例客户"
    },
    "member": {
      "id": 12,
      "username": "member001",
      "email": "member001@example.com",
      "phone": "13800138000",
      "nick_name": "张三"
    },
    "role": "高级技术联系人",
    "is_primary": true,
    "department": "研发部",
    "notes": "负责核心技术对接",
    "created_at": "2023-07-06T10:40:03.837536Z",
    "updated_at": "2023-07-06T11:30:45.789012Z"
  }
}
```

### 7. 获取客户的主要联系人

获取客户的主要联系人信息。

**请求**:

```
GET /customers/{customer_id}/members/primary/
```

**路径参数**:

| 参数名 | 类型 | 描述 |
|-------|-----|------|
| customer_id | number | 客户ID |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "id": 45,
    "customer": {
      "id": 6,
      "name": "示例客户"
    },
    "member": {
      "id": 12,
      "username": "member001",
      "email": "member001@example.com",
      "phone": "13800138000",
      "nick_name": "张三"
    },
    "role": "高级技术联系人",
    "is_primary": true,
    "department": "研发部",
    "notes": "负责核心技术对接",
    "created_at": "2023-07-06T10:40:03.837536Z",
    "updated_at": "2023-07-06T11:30:45.789012Z"
  }
}
```

### 8. 批量删除会员关系

批量删除客户与多个会员之间的关系。

**请求**:

```
POST /customers/members/relations/member-customers/delete/
```

**请求体**:

```json
{
  "customer_id": 6,
  "member_ids": [12, 13, 14]
}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 描述 |
|-------|-----|------|-----|
| customer_id | number | 是 | 客户ID |
| member_ids | array | 是 | 会员ID数组 |

**响应**:

```json
{
  "success": true,
  "code": 2000,
  "message": "批量删除关系成功",
  "data": {
    "deleted_count": 3,
    "failed_count": 0,
    "failed_ids": []
  }
}
```

## 错误码说明

| 错误码 | 描述 |
|-------|-----|
| 2000 | 操作成功 |
| 4000 | 请求参数错误 |
| 4001 | 认证失败 |
| 4003 | 权限不足 |
| 4004 | 资源不存在 |
| 4009 | 资源已存在 |
| 5000 | 服务器内部错误 |

## 使用示例

### 获取客户关联的会员列表

```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/customers/members/relations/customer-members/?customer_id=6' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNCwidXNlcm5hbWUiOiJhZG1pbl9jbXMiLCJleHAiOjE3NTE5MjI3OTMsIm1vZGVsX3R5cGUiOiJ1c2VyIiwiaXNfYWRtaW4iOnRydWUsImlzX3N1cGVyX2FkbWluIjpmYWxzZX0.VSbaLm9t668csj1pnDbQbf-42vwTi_436ZsAg_qkKeE'
```

### 创建客户会员关系

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/customers/members/relations/' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNCwidXNlcm5hbWUiOiJhZG1pbl9jbXMiLCJleHAiOjE3NTE5MjI3OTMsIm1vZGVsX3R5cGUiOiJ1c2VyIiwiaXNfYWRtaW4iOnRydWUsImlzX3N1cGVyX2FkbWluIjpmYWxzZX0.VSbaLm9t668csj1pnDbQbf-42vwTi_436ZsAg_qkKeE' \
  -d '{
    "customer_id": 6,
    "member_id": 12,
    "role": "技术联系人",
    "is_primary": false,
    "department": "IT部门",
    "notes": "负责技术对接"
  }'
```

## 注意事项

1. 所有请求都需要包含有效的Bearer Token进行认证
2. 创建和更新操作需要确保数据符合格式要求
3. 设置主要联系人会自动将其他联系人设为非主要联系人
4. 批量操作可能会部分成功，需要检查响应中的失败列表 
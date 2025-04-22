# API 测试示例

本文档提供了多租户系统API的测试示例，包括使用Postman和Curl等工具的请求示例和预期响应。

## 目录

- [准备工作](#准备工作)
- [认证API测试](#认证api测试)
  - [用户注册](#用户注册)
  - [用户登录](#用户登录)
  - [刷新Token](#刷新token)
- [用户管理API测试](#用户管理api测试)
  - [获取当前用户信息](#获取当前用户信息)
  - [创建用户](#创建用户)
  - [更新用户](#更新用户)
- [租户管理API测试](#租户管理api测试)
  - [创建租户](#创建租户)
  - [获取租户配额使用情况](#获取租户配额使用情况)

## 准备工作

### 环境配置

1. **基础URL**: `https://api.example.com/api/v1/`
2. **内容类型**: 所有请求使用 `application/json`
3. **认证**: 使用 Bearer Token (`Authorization: Bearer <access_token>`)

### Postman 设置

1. 创建一个新的环境，设置以下变量:
   - `base_url`: `https://api.example.com/api/v1`
   - `access_token`: 留空，后续会自动填充
   - `refresh_token`: 留空，后续会自动填充

2. 设置全局请求头:
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer {{access_token}}`

## 认证API测试

### 用户注册

**Postman 测试**

1. **请求配置**:
   - 方法: `POST`
   - URL: `{{base_url}}/auth/register/`
   - Body:
     ```json
     {
       "username": "testuser",
       "email": "test@example.com",
       "phone": "13800138000",
       "nick_name": "测试用户",
       "password": "Secure@Password123",
       "password_confirm": "Secure@Password123"
     }
     ```

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("注册成功", function() {
     pm.response.to.have.status(201);
   });
   
   // 保存token
   var jsonData = pm.response.json();
   if (jsonData.token) {
     pm.environment.set("access_token", jsonData.token.access);
     pm.environment.set("refresh_token", jsonData.token.refresh);
   }
   
   // 验证返回字段
   pm.test("返回正确的用户信息", function() {
     pm.expect(jsonData.username).to.eql("testuser");
     pm.expect(jsonData.email).to.eql("test@example.com");
   });
   ```

**Curl 测试**

```bash
curl -X POST https://api.example.com/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800138000",
    "nick_name": "测试用户",
    "password": "Secure@Password123",
    "password_confirm": "Secure@Password123"
  }'
```

**预期响应**:

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "phone": "13800138000",
  "nick_name": "测试用户",
  "tenant": null,
  "tenant_name": null,
  "role": "普通用户",
  "token": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### 用户登录

**Postman 测试**

1. **请求配置**:
   - 方法: `POST`
   - URL: `{{base_url}}/auth/login/`
   - Body:
     ```json
     {
       "username": "testuser",
       "password": "Secure@Password123"
     }
     ```

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("登录成功", function() {
     pm.response.to.have.status(200);
   });
   
   // 保存token
   var jsonData = pm.response.json();
   if (jsonData.token) {
     pm.environment.set("access_token", jsonData.token.access);
     pm.environment.set("refresh_token", jsonData.token.refresh);
   }
   ```

**Curl 测试**

```bash
curl -X POST https://api.example.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Secure@Password123"
  }'
```

**预期响应**:

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "phone": "13800138000",
  "nick_name": "测试用户",
  "tenant": null,
  "tenant_name": null,
  "is_admin": false,
  "is_super_admin": false,
  "role": "普通用户",
  "token": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### 刷新Token

**Postman 测试**

1. **请求配置**:
   - 方法: `POST`
   - URL: `{{base_url}}/auth/token/refresh/`
   - Body:
     ```json
     {
       "refresh_token": "{{refresh_token}}"
     }
     ```

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("Token刷新成功", function() {
     pm.response.to.have.status(200);
   });
   
   // 更新token
   var jsonData = pm.response.json();
   if (jsonData.access) {
     pm.environment.set("access_token", jsonData.access);
     
     if (jsonData.refresh) {
       pm.environment.set("refresh_token", jsonData.refresh);
     }
   }
   ```

**Curl 测试**

```bash
curl -X POST https://api.example.com/api/v1/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }'
```

**预期响应**:

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 用户管理API测试

### 获取当前用户信息

**Postman 测试**

1. **请求配置**:
   - 方法: `GET`
   - URL: `{{base_url}}/users/current/`
   - Headers:
     - `Authorization`: `Bearer {{access_token}}`

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("获取当前用户信息成功", function() {
     pm.response.to.have.status(200);
   });
   
   // 验证返回的用户信息
   var jsonData = pm.response.json();
   pm.test("返回的用户名正确", function() {
     pm.expect(jsonData.username).to.eql("testuser");
   });
   ```

**Curl 测试**

```bash
curl -X GET https://api.example.com/api/v1/users/current/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**预期响应**:

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "phone": "13800138000",
  "nick_name": "测试用户",
  "first_name": "",
  "last_name": "",
  "is_active": true,
  "avatar": null,
  "tenant": null,
  "tenant_name": null,
  "is_admin": false,
  "is_member": true,
  "is_super_admin": false,
  "role": "普通用户",
  "date_joined": "2023-07-01T10:30:00Z"
}
```

### 创建用户

**Postman 测试** (需要管理员权限)

1. **请求配置**:
   - 方法: `POST`
   - URL: `{{base_url}}/users/`
   - Headers:
     - `Authorization`: `Bearer {{access_token}}`
   - Body:
     ```json
     {
       "username": "newuser",
       "email": "new@example.com",
       "phone": "13900139001",
       "nick_name": "新用户",
       "first_name": "New",
       "last_name": "User",
       "password": "Secure@Password123",
       "password_confirm": "Secure@Password123",
       "tenant_id": 1,
       "is_admin": false,
       "is_member": true
     }
     ```

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("创建用户成功", function() {
     pm.response.to.have.status(201);
   });
   
   // 验证返回的用户信息
   var jsonData = pm.response.json();
   pm.test("返回的用户名正确", function() {
     pm.expect(jsonData.username).to.eql("newuser");
     pm.expect(jsonData.email).to.eql("new@example.com");
   });
   ```

**Curl 测试**

```bash
curl -X POST https://api.example.com/api/v1/users/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "new@example.com",
    "phone": "13900139001",
    "nick_name": "新用户",
    "first_name": "New",
    "last_name": "User",
    "password": "Secure@Password123",
    "password_confirm": "Secure@Password123",
    "tenant_id": 1,
    "is_admin": false,
    "is_member": true
  }'
```

**预期响应**:

```json
{
  "id": 2,
  "username": "newuser",
  "email": "new@example.com",
  "phone": "13900139001",
  "nick_name": "新用户",
  "first_name": "New",
  "last_name": "User",
  "is_active": true,
  "avatar": null,
  "tenant": 1,
  "tenant_name": "测试租户",
  "is_admin": false,
  "is_member": true,
  "is_super_admin": false,
  "role": "普通用户",
  "date_joined": "2023-07-01T11:00:00Z"
}
```

### 更新用户

**Postman 测试**

1. **请求配置**:
   - 方法: `PATCH`
   - URL: `{{base_url}}/users/1/`
   - Headers:
     - `Authorization`: `Bearer {{access_token}}`
   - Body:
     ```json
     {
       "nick_name": "已更新的昵称",
       "phone": "13800138002"
     }
     ```

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("更新用户成功", function() {
     pm.response.to.have.status(200);
   });
   
   // 验证返回的更新信息
   var jsonData = pm.response.json();
   pm.test("返回的更新数据正确", function() {
     pm.expect(jsonData.nick_name).to.eql("已更新的昵称");
     pm.expect(jsonData.phone).to.eql("13800138002");
   });
   ```

**Curl 测试**

```bash
curl -X PATCH https://api.example.com/api/v1/users/1/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "nick_name": "已更新的昵称",
    "phone": "13800138002"
  }'
```

**预期响应**:

```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "phone": "13800138002",
  "nick_name": "已更新的昵称",
  "first_name": "",
  "last_name": "",
  "is_active": true,
  "avatar": null,
  "tenant": null,
  "tenant_name": null,
  "is_admin": false,
  "is_member": true,
  "is_super_admin": false,
  "role": "普通用户",
  "date_joined": "2023-07-01T10:30:00Z"
}
```

## 租户管理API测试

### 创建租户

**Postman 测试** (需要超级管理员权限)

1. **请求配置**:
   - 方法: `POST`
   - URL: `{{base_url}}/tenants/`
   - Headers:
     - `Authorization`: `Bearer {{access_token}}`
   - Body:
     ```json
     {
       "name": "测试租户",
       "contact_name": "租户联系人",
       "contact_email": "contact@tenant.com",
       "contact_phone": "13700137000",
       "status": "active"
     }
     ```

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("创建租户成功", function() {
     pm.response.to.have.status(201);
   });
   
   // 验证返回的租户信息
   var jsonData = pm.response.json();
   pm.test("返回的租户名称正确", function() {
     pm.expect(jsonData.name).to.eql("测试租户");
     pm.expect(jsonData.status).to.eql("active");
   });
   
   // 保存租户ID供后续测试使用
   pm.environment.set("tenant_id", jsonData.id);
   ```

**Curl 测试**

```bash
curl -X POST https://api.example.com/api/v1/tenants/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试租户",
    "contact_name": "租户联系人",
    "contact_email": "contact@tenant.com",
    "contact_phone": "13700137000",
    "status": "active"
  }'
```

**预期响应**:

```json
{
  "id": 1,
  "name": "测试租户",
  "status": "active",
  "contact_name": "租户联系人",
  "contact_email": "contact@tenant.com",
  "contact_phone": "13700137000",
  "created_at": "2023-07-01T12:00:00Z",
  "updated_at": "2023-07-01T12:00:00Z"
}
```

### 获取租户配额使用情况

**Postman 测试** (需要管理员权限)

1. **请求配置**:
   - 方法: `GET`
   - URL: `{{base_url}}/tenants/{{tenant_id}}/quota/usage/`
   - Headers:
     - `Authorization`: `Bearer {{access_token}}`

2. **测试脚本**:
   ```javascript
   // 检查状态码
   pm.test("获取租户配额使用情况成功", function() {
     pm.response.to.have.status(200);
   });
   
   // 验证返回的配额信息
   var jsonData = pm.response.json();
   pm.test("返回的租户配额数据结构正确", function() {
     pm.expect(jsonData).to.have.property("max_users");
     pm.expect(jsonData).to.have.property("usage_percentage");
     pm.expect(jsonData.usage_percentage).to.have.property("users");
   });
   ```

**Curl 测试**

```bash
curl -X GET https://api.example.com/api/v1/tenants/1/quota/usage/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**预期响应**:

```json
{
  "tenant": 1,
  "tenant_name": "测试租户",
  "max_users": 50,
  "max_admins": 5,
  "max_storage_mb": 1024,
  "max_products": 100,
  "current_storage_used_mb": 0,
  "usage_percentage": {
    "users": 2,     // 使用了2%
    "admins": 0,    // 使用了0%
    "storage": 0,   // 使用了0%
    "products": 0   // 使用了0%
  }
}
```

## 测试自动化建议

### 持续集成测试

设置自动化测试流程，可以使用 Newman (Postman 的命令行工具) 在 CI/CD 管道中运行：

```bash
# 安装 Newman
npm install -g newman

# 运行测试集合
newman run your_collection.json -e your_environment.json
```

### 测试顺序建议

1. 先测试注册/登录，获取有效的 token
2. 测试获取当前用户信息，确认认证成功
3. 测试创建租户
4. 测试创建用户
5. 测试更新用户和租户信息
6. 测试配额和使用情况
7. 测试删除操作

### 安全测试考虑

1. 测试无效/过期 token 的情况
2. 测试权限边界（例如非管理员尝试执行管理员操作）
3. 测试输入验证（例如无效的邮箱格式）
4. 测试并发请求的处理 
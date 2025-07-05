# 客户管理功能设计方案

## 1. 功能概述

客户管理功能旨在提供完整的客户信息管理系统，允许管理员创建、查看、编辑和删除客户信息，以及管理客户与联系人、客户与租户之间的关系。该功能参考租户管理的实现方式，采用Vue 3组合式API和Element Plus组件库开发。

### 1.1 核心功能

1. **客户基础管理**
   - 客户列表展示（支持分页、搜索、筛选）
   - 客户详情查看
   - 客户创建
   - 客户编辑
   - 客户删除（软删除）

2. **客户-联系人关系管理**
   - 查看客户的联系人列表
   - 添加联系人关系
   - 编辑联系人关系
   - 删除联系人关系
   - 设置主要联系人

3. **客户-租户关系管理**
   - 查看客户的租户关系列表
   - 添加租户关系
   - 编辑租户关系
   - 删除租户关系
   - 设置主要租户关系

4. **批量操作**
   - 批量创建客户
   - 批量更新客户
   - 批量删除客户

5. **统计数据**
   - 客户总数统计
   - 客户分类统计（按类型、价值等级、状态等）

### 1.2 用户角色

- **超级管理员**：拥有所有客户管理功能的权限
- **租户管理员**：仅能查看与自己租户相关的客户信息

## 2. 页面设计

### 2.1 客户列表页面 (index.vue)

客户列表页面是客户管理的主入口，提供客户列表展示、搜索、筛选和基本操作功能。

#### 功能特点：

- 表格展示客户列表，包含基本信息
- 支持按名称、类型、状态等搜索和筛选
- 分页功能
- 客户创建、编辑、详情查看和删除操作
- 批量操作功能

#### 主要组件：

- 搜索表单
- 客户列表表格
- 操作按钮组
- 分页控件
- 创建客户对话框
- 确认删除对话框

### 2.2 客户详情页面 (detail.vue)

客户详情页面展示客户的详细信息，并提供相关操作功能。

#### 功能特点：

- 展示客户基本信息
- 使用标签页分隔不同类型的信息
- 提供客户状态管理
- 管理客户与联系人的关系
- 管理客户与租户的关系

#### 主要组件：

- 客户信息卡片
- 标签页组件
- 联系人关系表格
- 租户关系表格
- 操作按钮组
- 确认对话框

### 2.3 客户创建页面 (create.vue)

创建新客户的页面，提供表单填写客户信息。

#### 功能特点：

- 提供完整的客户信息表单
- 表单验证
- 提交和取消操作

#### 主要组件：

- 客户表单组件

### 2.4 客户编辑页面 (edit.vue)

编辑现有客户信息的页面。

#### 功能特点：

- 预填充现有客户信息
- 提供完整的客户信息表单
- 表单验证
- 提交和取消操作

#### 主要组件：

- 客户表单组件

## 3. 组件设计

### 3.1 CustomerForm.vue

客户表单组件，用于创建和编辑客户信息。

#### 属性：

- `customer`：客户对象（可选，编辑模式下提供）
- `loading`：加载状态
- `mode`：模式（create或edit）

#### 事件：

- `submit`：表单提交事件，携带表单数据
- `cancel`：取消操作事件

#### 表单字段：

- 基本信息：名称、类型、价值等级、状态
- 公司信息：营业执照号、税号、注册资本、法人代表等
- 联系信息：主要联系人姓名、电话、邮箱等
- 其他信息：银行账户、信用评级、付款条件等

### 3.2 CustomerRelationForm.vue

客户关系表单组件，用于创建和编辑客户与联系人或租户的关系。

#### 属性：

- `relation`：关系对象（可选，编辑模式下提供）
- `loading`：加载状态
- `mode`：模式（create或edit）
- `type`：关系类型（member或tenant）

#### 事件：

- `submit`：表单提交事件，携带表单数据
- `cancel`：取消操作事件

#### 表单字段：

- 联系人/租户选择
- 角色/关系类型
- 是否为主要关系
- 备注信息

### 3.3 ConfirmDialog.vue

确认对话框组件，用于确认各种操作。

#### 属性：

- `visible`：对话框可见性
- `title`：对话框标题
- `content`：对话框内容
- `type`：对话框类型（warning、danger、info）
- `loading`：加载状态
- `confirmButtonText`：确认按钮文本
- `cancelButtonText`：取消按钮文本

#### 事件：

- `confirm`：确认操作事件
- `cancel`：取消操作事件
- `update:visible`：更新可见性事件

### 3.4 CustomerStatusTag.vue

客户状态标签组件，用于显示客户状态。

#### 属性：

- `status`：客户状态

#### 功能：

- 根据不同状态显示不同颜色的标签

### 3.5 CustomerValueTag.vue

客户价值标签组件，用于显示客户价值等级。

#### 属性：

- `value`：客户价值等级

#### 功能：

- 根据不同价值等级显示不同颜色的标签

### 3.6 BatchOperationForm.vue

批量操作表单组件，用于批量创建、更新或删除客户。

#### 属性：

- `operation`：操作类型（create、update、delete）
- `loading`：加载状态

#### 事件：

- `submit`：表单提交事件，携带表单数据
- `cancel`：取消操作事件

## 4. 数据类型设计

在`src/types/customer.ts`中定义客户管理相关的TypeScript类型：

```typescript
// 客户类型
export type CustomerType = 'company' | 'individual' | 'government' | 'non_profit';

// 客户价值等级
export type CustomerValueLevel = 'vip' | 'high' | 'normal' | 'low';

// 客户状态
export type CustomerStatus = 'active' | 'inactive' | 'potential' | 'deleted';

// 客户基本信息接口
export interface Customer {
  id: number;
  name: string;
  type: CustomerType;
  value_level: CustomerValueLevel;
  status: CustomerStatus;
  business_license_number?: string;
  tax_identification_number?: string;
  registered_capital?: string;
  legal_representative?: string;
  registered_address?: string;
  business_address?: string;
  business_scope?: string;
  industry_type?: string;
  company_size?: string;
  establishment_date?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  primary_contact_email?: string;
  bank_name?: string;
  bank_account?: string;
  credit_rating?: string;
  payment_terms?: string;
  special_requirements?: string;
  notes?: string;
  source?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// 客户列表请求参数接口
export interface CustomerListParams {
  search?: string;
  type?: CustomerType;
  value_level?: CustomerValueLevel;
  status?: CustomerStatus;
  industry_type?: string;
  company_size?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

// 创建/更新客户请求参数接口
export interface CustomerCreateUpdateParams {
  name: string;
  type: CustomerType;
  value_level: CustomerValueLevel;
  status: CustomerStatus;
  business_license_number?: string;
  tax_identification_number?: string;
  registered_capital?: string;
  legal_representative?: string;
  registered_address?: string;
  business_address?: string;
  business_scope?: string;
  industry_type?: string;
  company_size?: string;
  establishment_date?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_phone?: string;
  primary_contact_email?: string;
  bank_name?: string;
  bank_account?: string;
  credit_rating?: string;
  payment_terms?: string;
  special_requirements?: string;
  notes?: string;
  source?: string;
}

// 客户-联系人关系接口
export interface CustomerMemberRelation {
  id: number;
  customer: {
    id: number;
    name: string;
  };
  member: {
    id: number;
    username: string;
    name: string;
    phone: string;
    email: string;
  };
  role: string;
  position: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// 创建/更新客户-联系人关系请求参数接口
export interface CustomerMemberRelationCreateUpdateParams {
  customer_id?: number;
  member_id: number;
  role: string;
  position?: string;
  is_primary: boolean;
  notes?: string;
}

// 客户-租户关系接口
export interface CustomerTenantRelation {
  id: number;
  customer: {
    id: number;
    name: string;
  };
  tenant: {
    id: number;
    name: string;
    code: string;
  };
  relation_type: string;
  is_primary: boolean;
  start_date?: string;
  end_date?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// 创建/更新客户-租户关系请求参数接口
export interface CustomerTenantRelationCreateUpdateParams {
  customer_id?: number;
  tenant_id: number;
  relation_type: string;
  is_primary: boolean;
  start_date?: string;
  end_date?: string;
  status: string;
  notes?: string;
}

// 批量操作请求参数接口
export interface CustomerBulkOperationParams {
  customers: CustomerCreateUpdateParams[] | { id: number; [key: string]: any }[];
}

// 批量操作响应接口
export interface CustomerBulkOperationResponse {
  created_count?: number;
  updated_count?: number;
  deleted_count?: number;
  failed_count: number;
  created_customers?: Customer[];
  updated_customers?: Customer[];
  deleted_customers?: { id: number }[];
  failed_customers: { data: any; errors: { [key: string]: string[] } }[];
}
```

## 5. Store设计

在`src/store/modules/customer.ts`中实现客户管理的Vuex模块：

```typescript
// 状态接口
export interface CustomerState {
  // 客户列表
  customerList: {
    data: Customer[];
    total: number;
    loading: boolean;
  };
  // 当前客户
  currentCustomer: Customer | null;
  // 当前客户的联系人关系
  customerMemberRelations: {
    data: CustomerMemberRelation[];
    total: number;
    loading: boolean;
  };
  // 当前客户的租户关系
  customerTenantRelations: {
    data: CustomerTenantRelation[];
    total: number;
    loading: boolean;
  };
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    memberRelations: boolean;
    tenantRelations: boolean;
  };
  // 错误信息
  error: string | null;
}

// 主要操作
// - fetchCustomerList: 获取客户列表
// - fetchCustomerDetail: 获取客户详情
// - createNewCustomer: 创建新客户
// - updateCustomerInfo: 更新客户信息
// - removeCustomer: 删除客户
// - fetchCustomerMemberRelations: 获取客户的联系人关系
// - createCustomerMemberRelation: 创建客户-联系人关系
// - updateCustomerMemberRelation: 更新客户-联系人关系
// - removeCustomerMemberRelation: 删除客户-联系人关系
// - setPrimaryMemberRelation: 设置主要联系人
// - fetchCustomerTenantRelations: 获取客户的租户关系
// - createCustomerTenantRelation: 创建客户-租户关系
// - updateCustomerTenantRelation: 更新客户-租户关系
// - removeCustomerTenantRelation: 删除客户-租户关系
// - setPrimaryTenantRelation: 设置主要租户关系
// - bulkCreateCustomers: 批量创建客户
// - bulkUpdateCustomers: 批量更新客户
// - bulkDeleteCustomers: 批量删除客户
```

## 6. API模块设计

在`src/api/modules/customer.ts`中实现客户管理的API调用：

```typescript
// 客户基础操作API
// - getCustomerList: 获取客户列表
// - getCustomerDetail: 获取客户详情
// - createCustomer: 创建客户
// - updateCustomer: 更新客户
// - deleteCustomer: 删除客户
// - searchCustomers: 搜索客户
// - getCustomerStatistics: 获取客户统计数据

// 客户批量操作API
// - bulkCreateCustomers: 批量创建客户
// - bulkUpdateCustomers: 批量更新客户
// - bulkDeleteCustomers: 批量删除客户

// 客户-联系人关系API
// - getCustomerMemberRelations: 获取客户的联系人关系
// - createCustomerMemberRelation: 创建客户-联系人关系
// - getCustomerMemberRelationDetail: 获取客户-联系人关系详情
// - updateCustomerMemberRelation: 更新客户-联系人关系
// - deleteCustomerMemberRelation: 删除客户-联系人关系
// - setPrimaryMemberRelation: 设置主要联系人
// - getPrimaryMemberRelation: 获取主要联系人

// 客户-租户关系API
// - getCustomerTenantRelations: 获取客户的租户关系
// - createCustomerTenantRelation: 创建客户-租户关系
// - getCustomerTenantRelationDetail: 获取客户-租户关系详情
// - updateCustomerTenantRelation: 更新客户-租户关系
// - deleteCustomerTenantRelation: 删除客户-租户关系
// - setPrimaryTenantRelation: 设置主要租户关系
// - getPrimaryTenantRelation: 获取主要租户关系
// - getRelationBetween: 获取客户与租户之间的关系
```

## 7. 实现计划

1. 创建客户管理相关的类型定义
2. 实现客户管理的API模块
3. 实现客户管理的Store模块
4. 开发客户管理的公共组件
5. 实现客户列表页面
6. 实现客户详情页面
7. 实现客户创建页面
8. 实现客户编辑页面
9. 添加国际化支持
10. 进行功能测试和优化

## 8. 注意事项

1. 确保所有组件和页面都支持国际化
2. 实现适当的权限控制，区分超级管理员和租户管理员的权限
3. 确保表单验证的完整性和一致性
4. 优化批量操作的性能和用户体验
5. 提供适当的错误处理和用户反馈 
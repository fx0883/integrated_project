# 客户管理功能组件设计

## 1. 组件结构概览

客户管理功能的组件结构遵循模块化设计原则，将UI和业务逻辑分离，以提高代码的可维护性和复用性。主要组件包括：

```
components/
  CustomerManagement/
    CustomerForm.vue            # 客户表单组件
    CustomerRelationForm.vue    # 客户关系表单组件
    ConfirmDialog.vue           # 确认对话框组件
    CustomerStatusTag.vue       # 客户状态标签组件
    CustomerValueTag.vue        # 客户价值标签组件
    BatchOperationForm.vue      # 批量操作表单组件
    CustomerFilter.vue          # 客户筛选组件
    CustomerTable.vue           # 客户表格组件
    CustomerInfoCard.vue        # 客户信息卡片组件
    RelationTable.vue           # 关系表格组件
```

## 2. 核心组件详细设计

### 2.1 CustomerForm.vue

#### 组件描述
客户表单组件用于创建和编辑客户信息，提供完整的表单字段和验证功能。

#### 属性定义
```typescript
interface Props {
  customer?: Customer;           // 客户对象（可选，编辑模式下提供）
  loading?: boolean;             // 加载状态
  mode: 'create' | 'edit';       // 表单模式
}
```

#### 事件定义
```typescript
interface Emits {
  (e: 'submit', formData: CustomerCreateUpdateParams): void;  // 提交事件
  (e: 'cancel'): void;                                        // 取消事件
}
```

#### 表单字段分组
表单字段按照功能分为四个部分：

1. **基本信息**
   - 客户名称（必填）
   - 客户类型（必填）：公司、个人、政府、非营利组织
   - 客户价值等级（必填）：VIP、高、普通、低
   - 客户状态（必填）：活跃、非活跃、潜在、已删除

2. **公司信息**
   - 营业执照号
   - 税号
   - 注册资本
   - 法人代表
   - 注册地址
   - 经营地址
   - 经营范围
   - 行业类型
   - 公司规模
   - 成立日期
   - 网站

3. **联系信息**
   - 主要联系人姓名
   - 主要联系人电话
   - 主要联系人邮箱

4. **其他信息**
   - 开户银行
   - 银行账号
   - 信用评级
   - 付款条件
   - 特殊要求
   - 备注
   - 客户来源

#### 表单验证规则
```typescript
const rules = reactive<FormRules>({
  name: [
    { required: true, message: t('customer.nameRequired'), trigger: 'blur' },
    { min: 2, max: 100, message: t('customer.nameLength'), trigger: 'blur' }
  ],
  type: [
    { required: true, message: t('customer.typeRequired'), trigger: 'change' }
  ],
  value_level: [
    { required: true, message: t('customer.valueLevelRequired'), trigger: 'change' }
  ],
  status: [
    { required: true, message: t('customer.statusRequired'), trigger: 'change' }
  ],
  primary_contact_email: [
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: t('customer.emailFormat'),
      trigger: 'blur'
    }
  ],
  primary_contact_phone: [
    {
      pattern: /^[+\d\s-]{5,20}$/,
      message: t('customer.phoneFormat'),
      trigger: 'blur'
    }
  ],
  website: [
    {
      pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/,
      message: t('customer.websiteFormat'),
      trigger: 'blur'
    }
  ]
});
```

#### 组件功能
1. 根据`mode`属性显示不同的表单标题和按钮文本
2. 在编辑模式下，预填充表单数据
3. 提供表单验证功能
4. 支持表单重置
5. 支持表单分步填写（可选）

#### 交互逻辑
1. 用户填写表单字段
2. 点击提交按钮时，进行表单验证
3. 验证通过后，触发`submit`事件，并传递表单数据
4. 点击取消按钮时，触发`cancel`事件

#### UI设计
- 使用Element Plus的表单组件
- 分组显示表单字段，使用折叠面板或标签页
- 必填字段标记星号
- 提供表单验证错误提示
- 提交和取消按钮放在表单底部

### 2.2 CustomerRelationForm.vue

#### 组件描述
客户关系表单组件用于创建和编辑客户与联系人或租户的关系。

#### 属性定义
```typescript
interface Props {
  relation?: CustomerMemberRelation | CustomerTenantRelation;  // 关系对象
  loading?: boolean;                                           // 加载状态
  mode: 'create' | 'edit';                                     // 表单模式
  type: 'member' | 'tenant';                                   // 关系类型
  customerId?: number;                                         // 客户ID（创建模式下可选）
}
```

#### 事件定义
```typescript
interface Emits {
  (e: 'submit', formData: CustomerMemberRelationCreateUpdateParams | CustomerTenantRelationCreateUpdateParams): void;  // 提交事件
  (e: 'cancel'): void;                                                                                                // 取消事件
}
```

#### 表单字段
1. **联系人关系表单字段**
   - 联系人选择（必填）
   - 角色（必填）：决策者、技术联系人、财务联系人等
   - 职位
   - 是否为主要联系人
   - 备注

2. **租户关系表单字段**
   - 租户选择（必填）
   - 关系类型（必填）：服务提供商、客户、合作伙伴等
   - 是否为主要租户关系
   - 开始日期
   - 结束日期
   - 状态（必填）：活跃、非活跃
   - 备注

#### 表单验证规则
```typescript
// 联系人关系表单验证规则
const memberRules = reactive<FormRules>({
  member_id: [
    { required: true, message: t('customer.memberRequired'), trigger: 'change' }
  ],
  role: [
    { required: true, message: t('customer.roleRequired'), trigger: 'change' }
  ]
});

// 租户关系表单验证规则
const tenantRules = reactive<FormRules>({
  tenant_id: [
    { required: true, message: t('customer.tenantRequired'), trigger: 'change' }
  ],
  relation_type: [
    { required: true, message: t('customer.relationTypeRequired'), trigger: 'change' }
  ],
  status: [
    { required: true, message: t('customer.statusRequired'), trigger: 'change' }
  ]
});
```

#### 组件功能
1. 根据`type`属性显示不同的表单字段
2. 根据`mode`属性显示不同的表单标题和按钮文本
3. 在编辑模式下，预填充表单数据
4. 提供表单验证功能
5. 支持表单重置

#### 交互逻辑
1. 用户填写表单字段
2. 点击提交按钮时，进行表单验证
3. 验证通过后，触发`submit`事件，并传递表单数据
4. 点击取消按钮时，触发`cancel`事件

#### UI设计
- 使用Element Plus的表单组件
- 根据关系类型动态显示不同的表单字段
- 必填字段标记星号
- 提供表单验证错误提示
- 提交和取消按钮放在表单底部

### 2.3 ConfirmDialog.vue

#### 组件描述
确认对话框组件用于确认各种操作，如删除、状态变更等。

#### 属性定义
```typescript
interface Props {
  visible: boolean;                                // 对话框可见性
  title: string;                                   // 对话框标题
  content: string;                                 // 对话框内容
  type?: 'warning' | 'danger' | 'info';            // 对话框类型
  loading?: boolean;                               // 加载状态
  confirmButtonText?: string;                      // 确认按钮文本
  cancelButtonText?: string;                       // 取消按钮文本
}
```

#### 事件定义
```typescript
interface Emits {
  (e: 'confirm'): void;                            // 确认事件
  (e: 'cancel'): void;                             // 取消事件
  (e: 'update:visible', value: boolean): void;     // 更新可见性事件
}
```

#### 组件功能
1. 显示确认对话框
2. 根据`type`属性显示不同的图标和按钮样式
3. 支持自定义按钮文本
4. 支持加载状态显示

#### 交互逻辑
1. 点击确认按钮时，触发`confirm`事件
2. 点击取消按钮或关闭对话框时，触发`cancel`事件
3. 对话框可见性变化时，触发`update:visible`事件

#### UI设计
- 使用Element Plus的对话框组件
- 根据类型显示不同的图标和颜色
- 确认按钮根据类型显示不同的样式
- 加载状态时显示加载指示器

### 2.4 CustomerStatusTag.vue

#### 组件描述
客户状态标签组件用于显示客户状态，根据不同状态显示不同颜色的标签。

#### 属性定义
```typescript
interface Props {
  status: CustomerStatus;  // 客户状态
}
```

#### 组件功能
根据客户状态显示不同颜色的标签：
- 活跃（active）：绿色
- 非活跃（inactive）：灰色
- 潜在（potential）：蓝色
- 已删除（deleted）：红色

#### UI设计
- 使用Element Plus的标签组件
- 根据状态设置不同的类型（type）和效果（effect）

### 2.5 CustomerValueTag.vue

#### 组件描述
客户价值标签组件用于显示客户价值等级，根据不同等级显示不同颜色的标签。

#### 属性定义
```typescript
interface Props {
  value: CustomerValueLevel;  // 客户价值等级
}
```

#### 组件功能
根据客户价值等级显示不同颜色的标签：
- VIP（vip）：金色
- 高（high）：橙色
- 普通（normal）：蓝色
- 低（low）：灰色

#### UI设计
- 使用Element Plus的标签组件
- 根据价值等级设置不同的类型（type）和效果（effect）

### 2.6 BatchOperationForm.vue

#### 组件描述
批量操作表单组件用于批量创建、更新或删除客户。

#### 属性定义
```typescript
interface Props {
  operation: 'create' | 'update' | 'delete';  // 操作类型
  loading?: boolean;                          // 加载状态
}
```

#### 事件定义
```typescript
interface Emits {
  (e: 'submit', formData: CustomerBulkOperationParams): void;  // 提交事件
  (e: 'cancel'): void;                                         // 取消事件
}
```

#### 组件功能
1. 根据`operation`属性显示不同的表单内容
2. 批量创建：提供JSON编辑器或CSV上传功能
3. 批量更新：提供ID列表和要更新的字段
4. 批量删除：提供ID列表

#### 交互逻辑
1. 用户填写表单字段或上传文件
2. 点击提交按钮时，进行数据验证
3. 验证通过后，触发`submit`事件，并传递表单数据
4. 点击取消按钮时，触发`cancel`事件

#### UI设计
- 使用Element Plus的表单组件
- 提供JSON编辑器或文件上传组件
- 提供数据预览功能
- 提交和取消按钮放在表单底部

### 2.7 CustomerFilter.vue

#### 组件描述
客户筛选组件用于筛选客户列表，提供多种筛选条件。

#### 属性定义
```typescript
interface Props {
  loading?: boolean;  // 加载状态
}
```

#### 事件定义
```typescript
interface Emits {
  (e: 'filter', filters: CustomerListParams): void;  // 筛选事件
  (e: 'reset'): void;                                // 重置事件
}
```

#### 筛选条件
1. 搜索关键词
2. 客户类型
3. 客户价值等级
4. 客户状态
5. 行业类型
6. 公司规模

#### 组件功能
1. 提供多种筛选条件
2. 支持条件组合筛选
3. 支持筛选条件重置

#### 交互逻辑
1. 用户选择筛选条件
2. 点击筛选按钮时，触发`filter`事件，并传递筛选参数
3. 点击重置按钮时，触发`reset`事件

#### UI设计
- 使用Element Plus的表单组件
- 提供下拉选择、输入框等筛选控件
- 筛选和重置按钮放在表单底部

### 2.8 CustomerTable.vue

#### 组件描述
客户表格组件用于展示客户列表，支持排序、分页和行操作。

#### 属性定义
```typescript
interface Props {
  customers: Customer[];           // 客户列表
  loading?: boolean;               // 加载状态
  pagination: {                    // 分页信息
    total: number;
    currentPage: number;
    pageSize: number;
  };
}
```

#### 事件定义
```typescript
interface Emits {
  (e: 'view', customer: Customer): void;                         // 查看事件
  (e: 'edit', customer: Customer): void;                         // 编辑事件
  (e: 'delete', customer: Customer): void;                       // 删除事件
  (e: 'page-change', page: number): void;                        // 页码变化事件
  (e: 'page-size-change', size: number): void;                   // 每页条数变化事件
  (e: 'sort-change', { prop, order }: { prop: string, order: string }): void;  // 排序变化事件
}
```

#### 表格列
1. 客户名称
2. 客户类型
3. 客户价值等级（使用CustomerValueTag组件）
4. 客户状态（使用CustomerStatusTag组件）
5. 主要联系人
6. 联系电话
7. 行业类型
8. 公司规模
9. 创建时间
10. 操作列（查看、编辑、删除）

#### 组件功能
1. 展示客户列表数据
2. 支持表格排序
3. 支持表格分页
4. 提供行操作按钮

#### 交互逻辑
1. 点击排序图标时，触发`sort-change`事件
2. 点击分页控件时，触发`page-change`或`page-size-change`事件
3. 点击查看按钮时，触发`view`事件
4. 点击编辑按钮时，触发`edit`事件
5. 点击删除按钮时，触发`delete`事件

#### UI设计
- 使用Element Plus的表格组件
- 使用CustomerStatusTag和CustomerValueTag组件显示状态和价值等级
- 提供行操作按钮
- 表格底部显示分页控件

### 2.9 CustomerInfoCard.vue

#### 组件描述
客户信息卡片组件用于在详情页面展示客户的基本信息。

#### 属性定义
```typescript
interface Props {
  customer: Customer;  // 客户对象
}
```

#### 组件功能
1. 展示客户的基本信息
2. 将信息分组显示

#### 信息分组
1. **基本信息**
   - 客户名称
   - 客户类型
   - 客户价值等级
   - 客户状态

2. **公司信息**
   - 营业执照号
   - 税号
   - 注册资本
   - 法人代表
   - 注册地址
   - 经营地址
   - 经营范围
   - 行业类型
   - 公司规模
   - 成立日期
   - 网站

3. **联系信息**
   - 主要联系人姓名
   - 主要联系人电话
   - 主要联系人邮箱

4. **其他信息**
   - 开户银行
   - 银行账号
   - 信用评级
   - 付款条件
   - 特殊要求
   - 备注
   - 客户来源

#### UI设计
- 使用Element Plus的描述列表组件
- 使用卡片或折叠面板分组显示信息
- 使用CustomerStatusTag和CustomerValueTag组件显示状态和价值等级

### 2.10 RelationTable.vue

#### 组件描述
关系表格组件用于展示客户与联系人或租户的关系列表。

#### 属性定义
```typescript
interface Props {
  relations: CustomerMemberRelation[] | CustomerTenantRelation[];  // 关系列表
  type: 'member' | 'tenant';                                       // 关系类型
  loading?: boolean;                                               // 加载状态
  pagination: {                                                    // 分页信息
    total: number;
    currentPage: number;
    pageSize: number;
  };
}
```

#### 事件定义
```typescript
interface Emits {
  (e: 'view', relation: CustomerMemberRelation | CustomerTenantRelation): void;  // 查看事件
  (e: 'edit', relation: CustomerMemberRelation | CustomerTenantRelation): void;  // 编辑事件
  (e: 'delete', relation: CustomerMemberRelation | CustomerTenantRelation): void;  // 删除事件
  (e: 'set-primary', relation: CustomerMemberRelation | CustomerTenantRelation): void;  // 设置主要关系事件
  (e: 'page-change', page: number): void;                                        // 页码变化事件
  (e: 'page-size-change', size: number): void;                                   // 每页条数变化事件
}
```

#### 表格列
1. **联系人关系表格列**
   - 联系人姓名
   - 联系人电话
   - 联系人邮箱
   - 角色
   - 职位
   - 是否为主要联系人
   - 备注
   - 创建时间
   - 操作列（编辑、删除、设为主要联系人）

2. **租户关系表格列**
   - 租户名称
   - 租户代码
   - 关系类型
   - 是否为主要租户关系
   - 开始日期
   - 结束日期
   - 状态
   - 备注
   - 创建时间
   - 操作列（编辑、删除、设为主要租户关系）

#### 组件功能
1. 根据`type`属性显示不同的表格列
2. 展示关系列表数据
3. 支持表格分页
4. 提供行操作按钮

#### 交互逻辑
1. 点击分页控件时，触发`page-change`或`page-size-change`事件
2. 点击编辑按钮时，触发`edit`事件
3. 点击删除按钮时，触发`delete`事件
4. 点击设为主要关系按钮时，触发`set-primary`事件

#### UI设计
- 使用Element Plus的表格组件
- 使用标签显示是否为主要关系
- 提供行操作按钮
- 表格底部显示分页控件

## 3. 组件交互流程

### 3.1 客户列表页面交互流程

1. 用户进入客户列表页面
2. 页面加载时，调用`fetchCustomerList`获取客户列表
3. 用户可以使用`CustomerFilter`组件筛选客户
4. 用户可以在`CustomerTable`组件中查看、编辑或删除客户
5. 点击"创建客户"按钮，显示`CustomerForm`组件创建新客户
6. 点击"批量操作"按钮，显示`BatchOperationForm`组件进行批量操作
7. 点击删除按钮时，显示`ConfirmDialog`组件确认删除操作

### 3.2 客户详情页面交互流程

1. 用户进入客户详情页面
2. 页面加载时，调用`fetchCustomerDetail`获取客户详情
3. 使用`CustomerInfoCard`组件显示客户基本信息
4. 使用标签页分隔不同类型的信息
5. 在联系人关系标签页中，使用`RelationTable`组件显示联系人关系列表
6. 在租户关系标签页中，使用`RelationTable`组件显示租户关系列表
7. 用户可以添加、编辑或删除关系
8. 点击"编辑客户"按钮，跳转到客户编辑页面
9. 点击"删除客户"按钮，显示`ConfirmDialog`组件确认删除操作

### 3.3 客户创建/编辑页面交互流程

1. 用户进入客户创建/编辑页面
2. 在编辑模式下，页面加载时调用`fetchCustomerDetail`获取客户详情
3. 使用`CustomerForm`组件显示客户表单
4. 用户填写表单并提交
5. 表单验证通过后，调用`createNewCustomer`或`updateCustomerInfo`
6. 操作成功后，显示成功提示并返回客户列表或详情页面

## 4. 组件复用策略

为了提高代码复用性和维护性，我们采用以下策略：

1. **共享组件**：`ConfirmDialog`、`CustomerStatusTag`和`CustomerValueTag`组件可以在多个页面中复用

2. **组合组件**：将复杂组件拆分为多个小组件，如`CustomerTable`和`RelationTable`

3. **逻辑抽象**：将通用逻辑抽象为可复用的hooks或函数

4. **国际化支持**：所有组件都支持国际化，文本通过i18n工具获取

5. **主题适配**：组件样式支持明暗主题切换

## 5. 组件测试策略

为了确保组件的质量和稳定性，我们采用以下测试策略：

1. **单元测试**：测试组件的核心逻辑和功能

2. **快照测试**：确保组件UI不会意外变更

3. **交互测试**：测试组件的用户交互行为

4. **集成测试**：测试组件在页面中的集成效果

5. **边界条件测试**：测试极端情况和边界条件

## 6. 组件文档

为了方便团队成员理解和使用组件，我们将为每个组件提供详细的文档，包括：

1. 组件描述
2. 属性和事件
3. 使用示例
4. 注意事项和最佳实践 
# 成员管理功能实现计划

## 1. 概述

本文档提供成员(Member)管理功能的实现计划，包括开发阶段、任务分解、时间估算和技术依赖。成员管理功能将允许用户查看、创建、编辑和删除成员账号，以及管理成员的子账号和与客户之间的关系。

## 2. 实现阶段

成员管理功能的实现将分为以下五个阶段：

### 阶段一：基础结构搭建（预计工时：2天）

1. **路由配置**
   - 创建成员列表路由
   - 创建成员详情路由
   - 创建成员创建/编辑路由

2. **状态管理**
   - 创建memberStore模块
   - 定义状态结构
   - 实现基础mutations和actions

3. **API模块**
   - 创建member API模块
   - 实现基础API调用函数
   - 添加请求/响应拦截器

4. **类型定义**
   - 创建成员相关的TypeScript类型定义
   - 定义API请求/响应类型
   - 定义组件props类型

### 阶段二：列表页实现（预计工时：3天）

1. **MemberList组件**
   - 实现基础列表布局
   - 实现表格数据展示
   - 实现分页功能

2. **搜索和筛选功能**
   - 实现关键词搜索
   - 实现状态筛选
   - 实现子账号筛选
   - 实现租户筛选（超级管理员）

3. **批量操作功能**
   - 实现表格多选
   - 实现批量删除功能

4. **单项操作功能**
   - 实现查看详情功能
   - 实现编辑功能
   - 实现删除功能

### 阶段三：详情页实现（预计工时：4天）

1. **MemberDetail组件**
   - 实现基础详情布局
   - 实现标签页导航
   - 实现基本信息展示

2. **子账号管理**
   - 实现SubAccountList组件
   - 实现子账号数据加载
   - 实现子账号操作功能

3. **客户关系管理**
   - 实现CustomerRelationList组件
   - 实现客户关系数据加载
   - 实现客户关系操作功能

4. **头像管理**
   - 实现AvatarUpload组件
   - 实现头像上传功能
   - 实现头像裁剪功能

### 阶段四：表单页实现（预计工时：4天）

1. **MemberForm组件**
   - 实现基础表单布局
   - 实现表单验证
   - 实现创建/编辑功能

2. **SubAccountForm组件**
   - 实现子账号表单
   - 实现子账号创建/编辑功能

3. **CustomerRelationForm组件**
   - 实现客户关系表单
   - 实现客户关系创建/编辑功能

4. **PasswordForm组件**
   - 实现密码修改表单
   - 实现密码强度检测
   - 实现密码修改功能

### 阶段五：集成与测试（预计工时：2天）

1. **组件集成**
   - 集成所有组件
   - 确保组件间通信正常
   - 优化组件交互

2. **功能测试**
   - 测试成员基本管理功能
   - 测试子账号管理功能
   - 测试客户关系管理功能
   - 测试头像和密码管理功能

3. **问题修复与优化**
   - 修复测试中发现的问题
   - 优化用户体验
   - 提高性能

## 3. 任务分解

### 3.1 阶段一：基础结构搭建

| 任务ID | 任务描述 | 预计工时 | 前置任务 |
|--------|---------|----------|---------|
| 1.1 | 创建成员管理相关路由 | 0.5天 | 无 |
| 1.2 | 创建memberStore模块 | 0.5天 | 无 |
| 1.3 | 创建member API模块 | 0.5天 | 无 |
| 1.4 | 创建成员相关类型定义 | 0.5天 | 无 |

### 3.2 阶段二：列表页实现

| 任务ID | 任务描述 | 预计工时 | 前置任务 |
|--------|---------|----------|---------|
| 2.1 | 实现MemberList组件基础结构 | 0.5天 | 1.1, 1.2, 1.3, 1.4 |
| 2.2 | 实现成员数据加载和展示 | 0.5天 | 2.1 |
| 2.3 | 实现分页功能 | 0.5天 | 2.2 |
| 2.4 | 实现搜索和筛选功能 | 0.5天 | 2.2 |
| 2.5 | 实现批量操作功能 | 0.5天 | 2.2 |
| 2.6 | 实现单项操作功能 | 0.5天 | 2.2 |

### 3.3 阶段三：详情页实现

| 任务ID | 任务描述 | 预计工时 | 前置任务 |
|--------|---------|----------|---------|
| 3.1 | 实现MemberDetail组件基础结构 | 0.5天 | 1.1, 1.2, 1.3, 1.4 |
| 3.2 | 实现成员基本信息展示 | 0.5天 | 3.1 |
| 3.3 | 实现SubAccountList组件 | 1天 | 3.1 |
| 3.4 | 实现CustomerRelationList组件 | 1天 | 3.1 |
| 3.5 | 实现AvatarUpload组件 | 1天 | 3.1 |

### 3.4 阶段四：表单页实现

| 任务ID | 任务描述 | 预计工时 | 前置任务 |
|--------|---------|----------|---------|
| 4.1 | 实现MemberForm组件 | 1天 | 1.1, 1.2, 1.3, 1.4 |
| 4.2 | 实现SubAccountForm组件 | 1天 | 4.1 |
| 4.3 | 实现CustomerRelationForm组件 | 1天 | 4.1 |
| 4.4 | 实现PasswordForm组件 | 1天 | 4.1 |

### 3.5 阶段五：集成与测试

| 任务ID | 任务描述 | 预计工时 | 前置任务 |
|--------|---------|----------|---------|
| 5.1 | 组件集成 | 0.5天 | 2.6, 3.5, 4.4 |
| 5.2 | 功能测试 | 1天 | 5.1 |
| 5.3 | 问题修复与优化 | 0.5天 | 5.2 |

## 4. 技术依赖

### 4.1 前端框架和库

- **Vue.js 3.x**：核心前端框架
- **Vue Router 4.x**：路由管理
- **Vuex 4.x**：状态管理
- **Element Plus**：UI组件库
- **Axios**：HTTP客户端
- **TypeScript**：类型系统
- **Vue I18n**：国际化支持
- **Cropperjs**：图片裁剪
- **Day.js**：日期处理

### 4.2 开发工具

- **Vite**：构建工具
- **ESLint**：代码检查
- **Prettier**：代码格式化
- **Vue DevTools**：调试工具
- **TypeScript**：类型检查

### 4.3 测试工具

- **Vue Test Utils**：组件测试
- **Jest**：单元测试
- **Cypress**：端到端测试

## 5. 代码结构

```
src/
  views/
    member/
      index.vue               // 成员列表页面
      detail.vue              // 成员详情页面
      create.vue              // 创建成员页面
      edit.vue                // 编辑成员页面
  
  components/
    MemberManagement/
      index.ts                // 组件导出文件
      MemberList.vue          // 成员列表组件
      MemberDetail.vue        // 成员详情组件
      MemberForm.vue          // 成员表单组件
      SubAccountList.vue      // 子账号列表组件
      SubAccountForm.vue      // 子账号表单组件
      CustomerRelationList.vue// 客户关系列表组件
      CustomerRelationForm.vue// 客户关系表单组件
      AvatarUpload.vue        // 头像上传组件
      PasswordForm.vue        // 密码表单组件
      MemberStatusTag.vue     // 成员状态标签组件
      ConfirmDialog.vue       // 确认对话框组件
  
  store/
    modules/
      member.ts               // 成员状态管理模块
  
  api/
    modules/
      member.ts               // 成员API模块
  
  types/
    member.ts                 // 成员相关类型定义
  
  router/
    modules/
      member.ts               // 成员路由配置
```

## 6. API集成计划

### 6.1 成员基本API

| API功能 | 端点 | 方法 | 状态管理Action |
|--------|------|------|---------------|
| 获取成员列表 | `/api/v1/members/` | GET | fetchMemberList |
| 创建成员 | `/api/v1/members/` | POST | createMember |
| 获取成员详情 | `/api/v1/members/{id}/` | GET | fetchMemberDetail |
| 更新成员信息 | `/api/v1/members/{id}/` | PUT | updateMember |
| 部分更新成员 | `/api/v1/members/{id}/` | PATCH | partialUpdateMember |
| 删除成员 | `/api/v1/members/{id}/` | DELETE | deleteMember |
| 获取当前成员 | `/api/v1/members/me/` | GET | fetchCurrentMember |

### 6.2 成员头像API

| API功能 | 端点 | 方法 | 状态管理Action |
|--------|------|------|---------------|
| 上传当前成员头像 | `/api/v1/members/avatar/upload/` | POST | uploadCurrentAvatar |
| 为特定成员上传头像 | `/api/v1/members/{id}/avatar/upload/` | POST | uploadMemberAvatar |

### 6.3 子账号管理API

| API功能 | 端点 | 方法 | 状态管理Action |
|--------|------|------|---------------|
| 获取子账号列表 | `/api/v1/members/sub-accounts/` | GET | fetchSubAccounts |
| 创建子账号 | `/api/v1/members/sub-accounts/` | POST | createSubAccount |
| 获取子账号详情 | `/api/v1/members/sub-accounts/{id}/` | GET | fetchSubAccountDetail |
| 更新子账号 | `/api/v1/members/sub-accounts/{id}/` | PUT | updateSubAccount |
| 部分更新子账号 | `/api/v1/members/sub-accounts/{id}/` | PATCH | partialUpdateSubAccount |
| 删除子账号 | `/api/v1/members/sub-accounts/{id}/` | DELETE | deleteSubAccount |

### 6.4 密码管理API

| API功能 | 端点 | 方法 | 状态管理Action |
|--------|------|------|---------------|
| 修改当前成员密码 | `/api/v1/members/me/password/` | POST | changePassword |

### 6.5 客户关系API

| API功能 | 端点 | 方法 | 状态管理Action |
|--------|------|------|---------------|
| 获取客户关系列表 | `/api/v1/customers/members/relations/` | GET | fetchCustomerRelations |
| 创建客户关系 | `/api/v1/customers/members/relations/` | POST | createCustomerRelation |
| 获取客户关系详情 | `/api/v1/customers/members/relations/{id}/` | GET | fetchCustomerRelationDetail |
| 更新客户关系 | `/api/v1/customers/members/relations/{id}/` | PUT | updateCustomerRelation |
| 部分更新客户关系 | `/api/v1/customers/members/relations/{id}/` | PATCH | partialUpdateCustomerRelation |
| 删除客户关系 | `/api/v1/customers/members/relations/{id}/` | DELETE | deleteCustomerRelation |
| 设置主要客户关系 | `/api/v1/customers/members/relations/{id}/set-primary/` | POST | setPrimaryCustomerRelation |

## 7. 状态管理设计

### 7.1 Member Store 结构

```typescript
// memberStore 状态结构
interface MemberState {
  memberList: {
    data: Member[];
    total: number;
    loading: boolean;
    error: Error | null;
  };
  currentMember: {
    data: Member | null;
    loading: boolean;
    error: Error | null;
  };
  subAccounts: {
    data: Member[];
    total: number;
    loading: boolean;
    error: Error | null;
  };
  customerRelations: {
    data: CustomerRelation[];
    total: number;
    loading: boolean;
    error: Error | null;
  };
  loading: {
    create: boolean;
    update: boolean;
    delete: boolean;
    upload: boolean;
    password: boolean;
  };
}
```

### 7.2 主要Actions

- `fetchMemberList`：获取成员列表
- `fetchMemberDetail`：获取成员详情
- `createMember`：创建成员
- `updateMember`：更新成员信息
- `deleteMember`：删除成员
- `uploadAvatar`：上传头像
- `fetchSubAccounts`：获取子账号列表
- `createSubAccount`：创建子账号
- `updateSubAccount`：更新子账号
- `deleteSubAccount`：删除子账号
- `changePassword`：修改密码
- `fetchCustomerRelations`：获取客户关系列表
- `createCustomerRelation`：创建客户关系
- `updateCustomerRelation`：更新客户关系
- `deleteCustomerRelation`：删除客户关系
- `setPrimaryRelation`：设置主要客户关系

## 8. 路由设计

```typescript
// 成员管理路由配置
const memberRoutes = [
  {
    path: '/member',
    name: 'MemberList',
    component: () => import('@/views/member/index.vue'),
    meta: {
      title: 'member.memberList',
      icon: 'user-group',
      permissions: ['member:view']
    }
  },
  {
    path: '/member/detail/:id',
    name: 'MemberDetail',
    component: () => import('@/views/member/detail.vue'),
    meta: {
      title: 'member.memberDetail',
      hidden: true,
      permissions: ['member:view']
    }
  },
  {
    path: '/member/create',
    name: 'MemberCreate',
    component: () => import('@/views/member/create.vue'),
    meta: {
      title: 'member.createMember',
      hidden: true,
      permissions: ['member:create']
    }
  },
  {
    path: '/member/edit/:id',
    name: 'MemberEdit',
    component: () => import('@/views/member/edit.vue'),
    meta: {
      title: 'member.editMember',
      hidden: true,
      permissions: ['member:edit']
    }
  }
];
```

## 9. 国际化支持

### 9.1 中文语言包

```typescript
// zh-CN.yaml 中成员管理相关的翻译
member:
  memberList: '成员列表'
  memberDetail: '成员详情'
  createMember: '创建成员'
  editMember: '编辑成员'
  deleteMember: '删除成员'
  deleteConfirm: '确定要删除成员 {name} 吗？'
  batchDelete: '批量删除'
  batchDeleteConfirm: '确定要删除选中的 {count} 个成员吗？'
  search: '搜索'
  searchPlaceholder: '搜索用户名、邮箱、昵称或电话'
  status: '状态'
  statusActive: '活跃'
  statusInactive: '非活跃'
  statusSuspended: '已暂停'
  isSubAccount: '子账号'
  tenant: '租户'
  id: 'ID'
  username: '用户名'
  name: '姓名'
  email: '邮箱'
  phone: '电话'
  nickName: '昵称'
  firstName: '名字'
  lastName: '姓氏'
  avatar: '头像'
  createdAt: '创建时间'
  lastLogin: '最后登录'
  lastLoginIp: '最后登录IP'
  password: '密码'
  confirmPassword: '确认密码'
  oldPassword: '当前密码'
  newPassword: '新密码'
  confirmNewPassword: '确认新密码'
  changePassword: '修改密码'
  passwordStrength: '密码强度'
  passwordRequirements: '密码要求'
  passwordRequirement1: '至少8个字符'
  passwordRequirement2: '包含大小写字母、数字和特殊字符'
  passwordRequirement3: '不能与用户名相似'
  passwordRequirement4: '不能使用常见密码'
  subAccount:
    subAccountList: '子账号列表'
    createSubAccount: '创建子账号'
    editSubAccount: '编辑子账号'
    deleteSubAccount: '删除子账号'
    deleteConfirm: '确定要删除子账号 {name} 吗？'
    noSubAccounts: '暂无子账号'
  customerRelation:
    relationList: '关联客户'
    createRelation: '添加客户关系'
    editRelation: '编辑客户关系'
    deleteRelation: '删除客户关系'
    deleteConfirm: '确定要删除与客户 {name} 的关系吗？'
    noRelations: '暂无关联客户'
    customerId: '客户ID'
    customerName: '客户名称'
    role: '角色'
    isPrimary: '主要关系'
    setPrimary: '设为主要'
```

### 9.2 英文语言包

```typescript
// en.yaml 中成员管理相关的翻译
member:
  memberList: 'Member List'
  memberDetail: 'Member Detail'
  createMember: 'Create Member'
  editMember: 'Edit Member'
  deleteMember: 'Delete Member'
  deleteConfirm: 'Are you sure you want to delete member {name}?'
  batchDelete: 'Batch Delete'
  batchDeleteConfirm: 'Are you sure you want to delete {count} selected members?'
  search: 'Search'
  searchPlaceholder: 'Search username, email, nickname or phone'
  status: 'Status'
  statusActive: 'Active'
  statusInactive: 'Inactive'
  statusSuspended: 'Suspended'
  isSubAccount: 'Sub Account'
  tenant: 'Tenant'
  id: 'ID'
  username: 'Username'
  name: 'Name'
  email: 'Email'
  phone: 'Phone'
  nickName: 'Nickname'
  firstName: 'First Name'
  lastName: 'Last Name'
  avatar: 'Avatar'
  createdAt: 'Created At'
  lastLogin: 'Last Login'
  lastLoginIp: 'Last Login IP'
  password: 'Password'
  confirmPassword: 'Confirm Password'
  oldPassword: 'Current Password'
  newPassword: 'New Password'
  confirmNewPassword: 'Confirm New Password'
  changePassword: 'Change Password'
  passwordStrength: 'Password Strength'
  passwordRequirements: 'Password Requirements'
  passwordRequirement1: 'At least 8 characters'
  passwordRequirement2: 'Include uppercase, lowercase, numbers and special characters'
  passwordRequirement3: 'Cannot be similar to username'
  passwordRequirement4: 'Cannot be a common password'
  subAccount:
    subAccountList: 'Sub Account List'
    createSubAccount: 'Create Sub Account'
    editSubAccount: 'Edit Sub Account'
    deleteSubAccount: 'Delete Sub Account'
    deleteConfirm: 'Are you sure you want to delete sub account {name}?'
    noSubAccounts: 'No sub accounts'
  customerRelation:
    relationList: 'Related Customers'
    createRelation: 'Add Customer Relation'
    editRelation: 'Edit Customer Relation'
    deleteRelation: 'Delete Customer Relation'
    deleteConfirm: 'Are you sure you want to delete relation with customer {name}?'
    noRelations: 'No related customers'
    customerId: 'Customer ID'
    customerName: 'Customer Name'
    role: 'Role'
    isPrimary: 'Primary Relation'
    setPrimary: 'Set as Primary'
```

## 10. 权限控制

### 10.1 权限定义

| 权限标识 | 描述 | 适用角色 |
|---------|------|---------|
| member:view | 查看成员列表和详情 | 超级管理员、租户管理员、普通成员(仅自己) |
| member:create | 创建成员 | 超级管理员、租户管理员 |
| member:edit | 编辑成员信息 | 超级管理员、租户管理员、普通成员(仅自己) |
| member:delete | 删除成员 | 超级管理员、租户管理员 |
| member:subaccount | 管理子账号 | 超级管理员、租户管理员、普通成员(仅自己的子账号) |
| member:relation | 管理客户关系 | 超级管理员、租户管理员、普通成员(仅自己的关系) |

### 10.2 权限控制实现

使用指令和组件级别的权限控制：

```vue
<template>
  <!-- 使用v-auth指令控制按钮显示 -->
  <el-button v-auth="'member:create'" type="primary">
    {{ $t('member.createMember') }}
  </el-button>
  
  <!-- 使用ReAuth组件控制内容显示 -->
  <ReAuth auth="member:edit">
    <el-button type="primary">
      {{ $t('member.editMember') }}
    </el-button>
  </ReAuth>
</template>
```

## 11. 风险与应对策略

| 风险 | 可能性 | 影响 | 应对策略 |
|------|-------|------|---------|
| API变更 | 中 | 高 | 设计灵活的API适配层，使用接口隔离模式 |
| 性能问题 | 中 | 中 | 实现分页、懒加载和虚拟滚动等优化技术 |
| 复杂表单验证 | 高 | 中 | 使用统一的表单验证库，设计清晰的错误提示 |
| 权限控制复杂 | 高 | 高 | 设计细粒度的权限系统，前后端一致的权限检查 |
| 用户体验一致性 | 中 | 中 | 遵循设计规范，复用现有组件和样式 |

## 12. 总结

本实现计划提供了成员管理功能的详细实施方案，包括开发阶段、任务分解、时间估算和技术依赖。通过五个阶段的实现，将完成成员基本管理、子账号管理、客户关系管理和头像/密码管理等功能。

该计划考虑了技术依赖、代码结构、API集成、状态管理、路由设计、国际化支持和权限控制等方面，为开发团队提供了清晰的实施指南。同时，也识别了潜在风险并提供了相应的应对策略。

按照本计划，成员管理功能的完整实现预计需要15个工作日。 
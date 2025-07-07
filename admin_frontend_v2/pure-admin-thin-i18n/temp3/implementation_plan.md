# 客户会员关系展示功能实现方案

## 实现概述

本方案旨在客户列表页面中添加展示客户关联会员信息的功能。通过在客户列表中添加可展开行，用户可以直接在列表页面查看和管理每个客户关联的会员信息，无需跳转到详情页面，提高操作效率。

## 实现步骤

### 1. 创建新组件

#### 1.1 创建会员子表格组件

**文件路径**：`src/components/CustomerManagement/CustomerMembersSubTable.vue`

该组件负责在客户列表的可展开行中展示会员列表，包括：
- 会员基本信息展示
- 搜索和分页功能
- 添加、编辑、删除会员关系的操作

#### 1.2 创建会员关系表单组件

**文件路径**：`src/components/CustomerManagement/CustomerRelationForm.vue`

该组件用于创建和编辑客户与会员的关系，包括：
- 会员选择（远程搜索）
- 角色、部门等信息输入
- 表单验证和提交

### 2. 更新组件索引文件

**文件路径**：`src/components/CustomerManagement/index.ts`

```typescript
// 添加新组件的导出
export { default as CustomerMembersSubTable } from './CustomerMembersSubTable.vue';
export { default as CustomerRelationForm } from './CustomerRelationForm.vue';
```

### 3. 修改客户列表页面

**文件路径**：`src/views/customer/index.vue`

#### 3.1 导入新组件

```typescript
import { 
  CustomerStatusTag, 
  CustomerValueTag, 
  ConfirmDialog, 
  CustomerForm,
  CustomerMembersSubTable // 新增导入
} from "@/components/CustomerManagement";
```

#### 3.2 添加可展开行配置

在客户列表表格中添加可展开行配置：

```vue
<el-table
  v-loading="tableLoading"
  :data="customerList"
  border
  stripe
  style="width: 100%"
  @selection-change="handleSelectionChange"
>
  <!-- 添加可展开行配置 -->
  <el-table-column type="expand">
    <template #default="{ row }">
      <CustomerMembersSubTable
        :customer-id="row.id"
        :customer-name="row.name"
        :disabled="!hasManagePermission"
        @loaded="count => handleMembersLoaded(row.id, count)"
      />
    </template>
  </el-table-column>
  
  <!-- 其他列保持不变 -->
  <el-table-column
    v-if="hasManagePermission"
    type="selection"
    width="55"
    align="center"
  />
  <!-- ... 其他列 ... -->
</el-table>
```

#### 3.3 添加会员加载处理函数

```typescript
// 客户会员数量映射
const customerMemberCounts = ref<Record<number, number>>({});

// 处理会员加载完成事件
const handleMembersLoaded = (customerId: number, count: number) => {
  customerMemberCounts.value[customerId] = count;
};
```

### 4. 扩展客户Store模块

**文件路径**：`src/store/modules/customer.ts`

#### 4.1 添加缓存会员数据的功能

```typescript
// 在CustomerState接口中添加新字段
interface CustomerState {
  // ... 现有字段 ...
  
  // 按客户ID缓存的会员关系数据
  customerMembersCache: Record<number, {
    data: any[];
    timestamp: number;
    total: number;
  }>;
}

// 在state初始化中添加
state: (): CustomerState => ({
  // ... 现有字段 ...
  customerMembersCache: {},
}),

// 添加新的getters
getters: {
  // ... 现有getters ...
  
  // 获取缓存的会员数据
  getCachedMembers: (state) => (customerId: number) => {
    return state.customerMembersCache[customerId];
  },
  
  // 检查缓存是否有效
  isMemberCacheValid: (state) => (customerId: number) => {
    const cache = state.customerMembersCache[customerId];
    if (!cache) return false;
    
    // 缓存有效期为5分钟
    const validityPeriod = 5 * 60 * 1000; // 5分钟（毫秒）
    return Date.now() - cache.timestamp < validityPeriod;
  }
},
```

#### 4.2 优化会员数据加载逻辑

```typescript
/**
 * 获取客户的会员关系列表（优化版）
 */
async fetchCustomerMemberRelations(customerId: number, params: { page?: number; page_size?: number; search?: string } = {}) {
  // 如果没有搜索条件且缓存有效，直接使用缓存数据
  if (!params.search && this.isMemberCacheValid(customerId) && params.page === 1) {
    const cache = this.customerMembersCache[customerId];
    return Promise.resolve({
      success: true,
      data: {
        results: cache.data,
        count: cache.total
      }
    });
  }
  
  this.loading.memberRelations = true;
  this.error = null;
  
  try {
    const response = await getCustomerMemberRelations(customerId, params);
    if (response.success) {
      // 处理分页数据结构适配
      if (response.data && 'results' in response.data) {
        // 更新会员关系列表
        this.customerMemberRelations = {
          total: response.data.count || 0,
          page: params.page || 1,
          limit: params.page_size || 10,
          data: response.data.results || []
        };
        
        // 如果是第一页且没有搜索条件，更新缓存
        if (params.page === 1 && !params.search) {
          this.customerMembersCache[customerId] = {
            data: response.data.results || [],
            total: response.data.count || 0,
            timestamp: Date.now()
          };
        }
      } else {
        logger.warn("客户会员关系列表数据结构不符合预期", response.data);
        this.customerMemberRelations.data = Array.isArray(response.data) ? response.data : [];
      }
      return response;
    } else {
      this.error = response.message || "获取客户会员关系列表失败";
      ElMessage.error(this.error);
      return Promise.reject(new Error(this.error));
    }
  } catch (error) {
    logger.error("获取客户会员关系列表失败", error);
    this.error = error.message || "获取客户会员关系列表失败";
    ElMessage.error(this.error);
    throw error;
  } finally {
    this.loading.memberRelations = false;
  }
}
```

### 5. 添加国际化支持

**文件路径**：`locales/zh-CN.yaml`

添加以下翻译条目：

```yaml
customer:
  member:
    memberList: "会员列表"
    memberListWithName: "{name} 的会员"
    addMember: "添加会员"
    editMember: "编辑会员"
    viewMember: "查看会员"
    deleteMember: "删除会员"
    deleteMemberConfirm: "确定要删除会员 {name} 吗？"
    createSuccess: "添加会员成功"
    updateSuccess: "更新会员成功"
    deleteSuccess: "删除会员成功"
    createFailed: "添加会员失败"
    updateFailed: "更新会员失败"
    deleteFailed: "删除会员失败"
    fetchFailed: "获取会员列表失败"
    memberSelect: "选择会员"
    memberSelectPlaceholder: "请输入会员名称或邮箱搜索"
    role: "角色"
    rolePlaceholder: "请输入会员在客户中的角色"
    department: "部门"
    departmentPlaceholder: "请输入会员所在部门"
    isPrimary: "主要联系人"
    notes: "备注"
    notesPlaceholder: "请输入备注信息"
    memberRequired: "请选择会员"
    roleRequired: "请输入角色"
    searchMemberFailed: "搜索会员失败"
```

**文件路径**：`locales/en.yaml`

添加相应的英文翻译条目（根据需要）。

## 文件变更清单

1. **新增文件**：
   - `src/components/CustomerManagement/CustomerMembersSubTable.vue`
   - `src/components/CustomerManagement/CustomerRelationForm.vue`

2. **修改文件**：
   - `src/components/CustomerManagement/index.ts` - 添加新组件导出
   - `src/views/customer/index.vue` - 添加可展开行和相关处理函数
   - `src/store/modules/customer.ts` - 添加缓存和优化数据加载逻辑
   - `locales/zh-CN.yaml` - 添加翻译条目
   - `locales/en.yaml` - 添加翻译条目（如需要）

## 实现顺序

1. 先实现会员关系表单组件 `CustomerRelationForm.vue`
2. 实现会员子表格组件 `CustomerMembersSubTable.vue`
3. 更新组件索引文件
4. 扩展客户Store模块
5. 修改客户列表页面
6. 添加国际化支持

## 测试计划

1. **组件单元测试**：
   - 验证会员子表格组件的渲染和交互
   - 验证会员关系表单的数据验证和提交

2. **功能测试**：
   - 验证客户列表中可展开行的正常展开/收起
   - 验证会员列表的加载、分页和搜索功能
   - 验证会员关系的添加、编辑和删除功能

3. **集成测试**：
   - 验证与后端API的交互
   - 验证数据缓存和刷新机制

4. **性能测试**：
   - 验证大量数据下的渲染性能
   - 验证数据缓存对性能的影响

## 性能优化措施

1. **按需加载**：
   - 只有在展开行时才加载会员数据
   - 使用分页加载，避免一次性加载大量数据

2. **数据缓存**：
   - 在Store中缓存已加载的会员数据
   - 添加缓存过期机制，确保数据的及时性

3. **UI优化**：
   - 使用骨架屏或加载动画提升用户体验
   - 优化表格渲染性能，避免不必要的重渲染

## 后续优化建议

1. **添加批量操作功能**：
   - 批量添加会员关系
   - 批量删除会员关系

2. **增强搜索功能**：
   - 添加高级搜索选项
   - 支持按多个字段筛选

3. **数据导出功能**：
   - 支持导出会员列表为Excel或CSV
   - 自定义导出字段选择

4. **会员详情快速查看**：
   - 添加会员详情悬浮卡片
   - 无需打开对话框即可查看会员详细信息 
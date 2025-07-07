# 客户会员子表格组件实现方案

## 组件概述

`CustomerMembersSubTable` 组件将作为客户列表页面中可展开行的内容，用于展示特定客户关联的会员信息。该组件将独立封装会员数据的获取、展示和操作功能，使其可以被轻松集成到客户列表页面中。

## 组件设计

### 文件位置

```
src/components/CustomerManagement/CustomerMembersSubTable.vue
```

### 组件接口

```typescript
// 组件Props定义
interface Props {
  // 客户ID，必需参数
  customerId: number;
  // 客户名称，用于显示标题
  customerName?: string;
  // 是否禁用编辑功能
  disabled?: boolean;
}
```

### 组件事件

```typescript
// 组件事件定义
interface Events {
  // 会员数据加载完成事件
  'loaded': (count: number) => void;
  // 会员关系更新事件
  'relation-updated': () => void;
  // 会员关系删除事件
  'relation-deleted': () => void;
}
```

## 组件功能

1. **数据加载与展示**：
   - 根据传入的客户ID加载该客户关联的会员列表
   - 支持分页、搜索和筛选功能
   - 展示会员的基本信息：用户名、姓名、邮箱、电话、状态等

2. **会员关系操作**：
   - 查看会员详情
   - 添加新的会员关系（如果未禁用）
   - 编辑会员关系（如果未禁用）
   - 删除会员关系（如果未禁用）

3. **状态管理**：
   - 加载状态显示
   - 空数据状态处理
   - 错误状态处理

## 组件实现

### 模板结构

```vue
<template>
  <div class="customer-members-subtable">
    <!-- 标题栏 -->
    <div class="subtable-header">
      <h3>{{ title }}</h3>
      <div class="subtable-actions">
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          :placeholder="$t('member.searchPlaceholder')"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <!-- 添加会员按钮 -->
        <el-button
          v-if="!disabled && hasManagePermission"
          type="primary"
          size="small"
          @click="handleAddMember"
        >
          {{ $t('customer.member.addMember') }}
        </el-button>
      </div>
    </div>
    
    <!-- 会员表格 -->
    <el-table
      v-loading="loading"
      :data="membersList"
      border
      stripe
      size="small"
      style="width: 100%"
    >
      <!-- 会员ID列 -->
      <el-table-column
        prop="id"
        :label="$t('member.id')"
        width="80"
        align="center"
      />
      
      <!-- 会员用户名列 -->
      <el-table-column
        prop="username"
        :label="$t('member.username')"
        min-width="120"
      />
      
      <!-- 会员姓名列 -->
      <el-table-column
        :label="$t('member.name')"
        min-width="120"
      >
        <template #default="{ row }">
          {{ row.nick_name || `${row.first_name} ${row.last_name}`.trim() || '-' }}
        </template>
      </el-table-column>
      
      <!-- 会员邮箱列 -->
      <el-table-column
        prop="email"
        :label="$t('member.email')"
        min-width="180"
      />
      
      <!-- 会员电话列 -->
      <el-table-column
        prop="phone"
        :label="$t('member.phone')"
        min-width="120"
      />
      
      <!-- 会员状态列 -->
      <el-table-column
        prop="status"
        :label="$t('member.status')"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="getMemberStatusType(row.status)">
            {{ $t(`member.status${row.status.charAt(0).toUpperCase() + row.status.slice(1)}`) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <!-- 操作列 -->
      <el-table-column
        :label="$t('common.actions')"
        width="200"
        align="center"
        fixed="right"
      >
        <template #default="{ row }">
          <!-- 查看按钮 -->
          <el-button
            type="primary"
            size="small"
            link
            @click="handleViewMember(row)"
          >
            {{ $t('common.view') }}
          </el-button>
          
          <!-- 编辑按钮 -->
          <el-button
            v-if="!disabled && hasManagePermission"
            type="primary"
            size="small"
            link
            @click="handleEditMember(row)"
          >
            {{ $t('common.edit') }}
          </el-button>
          
          <!-- 删除按钮 -->
          <el-button
            v-if="!disabled && hasManagePermission"
            type="danger"
            size="small"
            link
            @click="handleDeleteMember(row)"
          >
            {{ $t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页器 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 会员关系表单对话框 -->
    <el-dialog
      v-model="memberDialog.visible"
      :title="memberDialog.title"
      width="50%"
      destroy-on-close
    >
      <CustomerRelationForm
        v-if="memberDialog.visible"
        :mode="memberDialog.mode"
        :member-relation="memberDialog.currentRelation"
        :customer-id="customerId"
        :loading="memberDialog.loading"
        @submit="handleMemberDialogSubmit"
        @cancel="handleMemberDialogCancel"
      />
    </el-dialog>
    
    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />
  </div>
</template>
```

### 脚本实现

```typescript
<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useCustomerStoreHook } from '@/store/modules/customer';
import { useUserStoreHook } from '@/store/modules/user';
import { hasPerms } from '@/utils/auth';
import { CustomerRelationForm, ConfirmDialog } from '@/components/CustomerManagement';
import type { MemberCustomerRelation } from '@/types/member';
import logger from '@/utils/logger';

const { t } = useI18n();
const customerStore = useCustomerStoreHook();
const userStore = useUserStoreHook();

// Props定义
const props = defineProps({
  // 客户ID
  customerId: {
    type: Number,
    required: true
  },
  // 客户名称
  customerName: {
    type: String,
    default: ''
  },
  // 是否禁用编辑功能
  disabled: {
    type: Boolean,
    default: false
  }
});

// 事件定义
const emit = defineEmits(['loaded', 'relation-updated', 'relation-deleted']);

// 检查用户是否有管理权限
const hasManagePermission = computed(
  () => userStore.is_super_admin || hasPerms('customer:manage')
);

// 标题计算属性
const title = computed(() => {
  return props.customerName
    ? t('customer.member.memberListWithName', { name: props.customerName })
    : t('customer.member.memberList');
});

// 加载状态
const loading = ref(false);

// 会员列表数据
const membersList = ref<any[]>([]);

// 搜索查询
const searchQuery = ref('');

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 会员对话框状态
const memberDialog = reactive({
  visible: false,
  mode: 'create' as 'create' | 'edit' | 'view',
  title: '',
  loading: false,
  currentRelation: null as MemberCustomerRelation | null
});

// 确认对话框状态
const confirmDialog = reactive({
  visible: false,
  title: '',
  content: '',
  type: 'warning' as 'warning' | 'danger' | 'info',
  loading: false,
  confirmCallback: null as (() => void) | null
});

// 获取会员状态对应的Tag类型
const getMemberStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    locked: 'danger',
    pending: 'warning'
  };
  return statusMap[status] || 'info';
};

// 加载会员数据
const loadMemberData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      page_size: pagination.pageSize,
      search: searchQuery.value
    };
    
    // 调用API获取客户关联的会员列表
    const response = await customerStore.fetchCustomerMemberRelations(props.customerId, params);
    
    // 更新会员列表和分页信息
    membersList.value = response.data.results || [];
    pagination.total = response.data.count || 0;
    
    // 触发加载完成事件
    emit('loaded', pagination.total);
  } catch (error) {
    logger.error('获取客户会员列表失败', error);
    ElMessage.error(t('customer.member.fetchFailed'));
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  loadMemberData();
};

// 处理页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadMemberData();
};

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadMemberData();
};

// 处理查看会员
const handleViewMember = (member: any) => {
  memberDialog.mode = 'view';
  memberDialog.title = t('customer.member.viewMember');
  memberDialog.currentRelation = member;
  memberDialog.visible = true;
};

// 处理添加会员
const handleAddMember = () => {
  memberDialog.mode = 'create';
  memberDialog.title = t('customer.member.addMember');
  memberDialog.currentRelation = null;
  memberDialog.visible = true;
};

// 处理编辑会员
const handleEditMember = (member: any) => {
  memberDialog.mode = 'edit';
  memberDialog.title = t('customer.member.editMember');
  memberDialog.currentRelation = member;
  memberDialog.visible = true;
};

// 处理删除会员
const handleDeleteMember = (member: any) => {
  confirmDialog.title = t('customer.member.deleteMember');
  confirmDialog.content = t('customer.member.deleteMemberConfirm', {
    name: member.nick_name || `${member.first_name} ${member.last_name}`.trim() || member.username
  });
  confirmDialog.type = 'danger';
  confirmDialog.confirmCallback = async () => {
    try {
      await customerStore.removeCustomerMemberRelation(props.customerId, member.id);
      ElMessage.success(t('customer.member.deleteSuccess'));
      loadMemberData();
      emit('relation-deleted');
    } catch (error) {
      logger.error('删除会员关系失败', error);
      ElMessage.error(t('customer.member.deleteFailed'));
    }
  };
  confirmDialog.visible = true;
};

// 处理会员对话框提交
const handleMemberDialogSubmit = async (formData: any) => {
  memberDialog.loading = true;
  try {
    if (memberDialog.mode === 'create') {
      await customerStore.createCustomerMemberRelation({
        ...formData,
        customer_id: props.customerId
      });
      ElMessage.success(t('customer.member.createSuccess'));
    } else {
      await customerStore.updateCustomerMemberRelation(
        props.customerId,
        memberDialog.currentRelation!.id,
        formData
      );
      ElMessage.success(t('customer.member.updateSuccess'));
    }
    memberDialog.visible = false;
    loadMemberData();
    emit('relation-updated');
  } catch (error) {
    logger.error(
      memberDialog.mode === 'create'
        ? '创建会员关系失败'
        : '更新会员关系失败',
      error
    );
    ElMessage.error(
      memberDialog.mode === 'create'
        ? t('customer.member.createFailed')
        : t('customer.member.updateFailed')
    );
  } finally {
    memberDialog.loading = false;
  }
};

// 处理会员对话框取消
const handleMemberDialogCancel = () => {
  memberDialog.visible = false;
};

// 处理确认对话框确认
const handleConfirmDialogConfirm = async () => {
  confirmDialog.loading = true;
  try {
    if (confirmDialog.confirmCallback) {
      await confirmDialog.confirmCallback();
    }
  } finally {
    confirmDialog.loading = false;
    confirmDialog.visible = false;
  }
};

// 处理确认对话框取消
const handleConfirmDialogCancel = () => {
  confirmDialog.visible = false;
};

// 监听customerId变化
watch(
  () => props.customerId,
  (newVal) => {
    if (newVal) {
      pagination.currentPage = 1;
      loadMemberData();
    }
  }
);

// 组件挂载时加载数据
onMounted(() => {
  if (props.customerId) {
    loadMemberData();
  }
});
</script>
```

### 样式实现

```vue
<style scoped>
.customer-members-subtable {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.subtable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subtable-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.subtable-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subtable-actions .el-input {
  width: 220px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
```

## 组件注册与使用

### 组件注册

在 `src/components/CustomerManagement/index.ts` 中导出组件：

```typescript
export { default as CustomerMembersSubTable } from './CustomerMembersSubTable.vue';
```

### 在客户列表页面中使用

在 `src/views/customer/index.vue` 中使用该组件：

```vue
<template>
  <!-- ... 其他代码 ... -->
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
    
    <!-- ... 其他列 ... -->
  </el-table>
  <!-- ... 其他代码 ... -->
</template>

<script lang="ts" setup>
import { CustomerMembersSubTable } from '@/components/CustomerManagement';

// ... 其他代码 ...

// 处理会员加载完成事件
const handleMembersLoaded = (customerId: number, count: number) => {
  // 可以在这里更新客户的会员数量显示
  console.log(`客户 ${customerId} 有 ${count} 个会员`);
};
</script>
```

## 国际化支持

在语言文件中添加以下翻译条目：

```yaml
# zh-CN.yaml
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
```

## 性能优化考虑

1. **按需加载**：
   - 只有在展开行时才加载会员数据，减少初始加载时间
   - 使用分页加载，避免一次性加载大量数据

2. **数据缓存**：
   - 可以在Store中缓存已加载的会员数据，避免重复请求
   - 添加数据过期机制，确保数据的及时性

3. **UI优化**：
   - 使用骨架屏或加载动画提升用户体验
   - 优化表格渲染性能，避免不必要的重渲染 
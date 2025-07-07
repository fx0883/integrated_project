# 客户会员关系表单组件实现方案

## 组件概述

`CustomerRelationForm` 组件用于创建和编辑客户与会员之间的关系。该组件将作为对话框内容，提供表单界面让用户输入会员关系的详细信息，包括选择会员、设置角色、部门等信息。

## 组件设计

### 文件位置

```
src/components/CustomerManagement/CustomerRelationForm.vue
```

### 组件接口

```typescript
// 组件Props定义
interface Props {
  // 操作模式：create（创建）、edit（编辑）、view（查看）
  mode: 'create' | 'edit' | 'view';
  // 会员关系数据，编辑或查看模式下必需
  memberRelation?: MemberCustomerRelation;
  // 客户ID
  customerId: number;
  // 加载状态
  loading?: boolean;
}
```

### 组件事件

```typescript
// 组件事件定义
interface Events {
  // 表单提交事件
  'submit': (formData: MemberCustomerRelationCreateUpdateParams) => void;
  // 取消事件
  'cancel': () => void;
}
```

## 组件功能

1. **表单操作**：
   - 创建新的客户-会员关系
   - 编辑现有的客户-会员关系
   - 查看会员关系详情（只读模式）

2. **数据处理**：
   - 远程搜索会员
   - 表单验证
   - 提交数据处理

3. **状态管理**：
   - 加载状态
   - 错误处理
   - 表单状态重置

## 组件实现

### 模板结构

```vue
<template>
  <div class="customer-relation-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="mode === 'view' || loading"
    >
      <!-- 会员选择 -->
      <el-form-item :label="$t('customer.member.memberSelect')" prop="member_id">
        <el-select
          v-model="formData.member_id"
          :placeholder="$t('customer.member.memberSelectPlaceholder')"
          filterable
          remote
          :remote-method="remoteMemberSearch"
          :loading="memberSearchLoading"
          style="width: 100%"
          :disabled="mode !== 'create'"
        >
          <el-option
            v-for="item in memberOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <!-- 角色 -->
      <el-form-item :label="$t('customer.member.role')" prop="role">
        <el-input
          v-model="formData.role"
          :placeholder="$t('customer.member.rolePlaceholder')"
        />
      </el-form-item>

      <!-- 部门 -->
      <el-form-item :label="$t('customer.member.department')" prop="department">
        <el-input
          v-model="formData.department"
          :placeholder="$t('customer.member.departmentPlaceholder')"
        />
      </el-form-item>

      <!-- 是否主要联系人 -->
      <el-form-item :label="$t('customer.member.isPrimary')" prop="is_primary">
        <el-switch v-model="formData.is_primary" />
      </el-form-item>

      <!-- 备注 -->
      <el-form-item :label="$t('customer.member.notes')" prop="notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          :placeholder="$t('customer.member.notesPlaceholder')"
        />
      </el-form-item>

      <!-- 按钮组 -->
      <el-form-item>
        <el-button
          v-if="mode !== 'view'"
          type="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ $t('common.save') }}
        </el-button>
        <el-button @click="handleCancel">
          {{ mode === 'view' ? $t('common.close') : $t('common.cancel') }}
        </el-button>
        <el-button v-if="mode !== 'view'" @click="resetForm">
          {{ $t('common.reset') }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
```

### 脚本实现

```typescript
<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useMemberStoreHook } from '@/store/modules/member';
import type {
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams
} from '@/types/member';
import logger from '@/utils/logger';

const { t } = useI18n();
const memberStore = useMemberStoreHook();

// Props定义
const props = defineProps({
  // 操作模式
  mode: {
    type: String as () => 'create' | 'edit' | 'view',
    required: true
  },
  // 会员关系数据
  memberRelation: {
    type: Object as () => MemberCustomerRelation | null,
    default: null
  },
  // 客户ID
  customerId: {
    type: Number,
    required: true
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  }
});

// 事件定义
const emit = defineEmits(['submit', 'cancel']);

// 表单引用
const formRef = ref<FormInstance>();

// 会员搜索加载状态
const memberSearchLoading = ref(false);

// 会员选项
const memberOptions = ref<Array<{ value: number; label: string }>>([]);

// 表单数据
const formData = reactive<MemberCustomerRelationCreateUpdateParams>({
  customer_id: props.customerId,
  member_id: 0,
  role: '',
  department: '',
  is_primary: false,
  notes: ''
});

// 表单验证规则
const rules = reactive<FormRules>({
  member_id: [
    { required: true, message: t('customer.member.memberRequired'), trigger: 'change' }
  ],
  role: [
    { required: true, message: t('customer.member.roleRequired'), trigger: 'blur' },
    { max: 50, message: t('common.form.maxLength', { max: 50 }), trigger: 'blur' }
  ],
  department: [
    { max: 100, message: t('common.form.maxLength', { max: 100 }), trigger: 'blur' }
  ],
  notes: [
    { max: 500, message: t('common.form.maxLength', { max: 500 }), trigger: 'blur' }
  ]
});

// 远程搜索会员
const remoteMemberSearch = async (query: string) => {
  if (query.length < 2) return;
  
  memberSearchLoading.value = true;
  try {
    const response = await memberStore.searchMembers(query);
    memberOptions.value = response.data.results.map(member => ({
      value: member.id,
      label: `${member.username} - ${member.nick_name || member.first_name + ' ' + member.last_name || member.email}`
    }));
  } catch (error) {
    logger.error('搜索会员失败', error);
    ElMessage.error(t('customer.member.searchMemberFailed'));
  } finally {
    memberSearchLoading.value = false;
  }
};

// 初始化表单数据
const initFormData = () => {
  if (props.mode !== 'create' && props.memberRelation) {
    formData.customer_id = props.customerId;
    formData.member_id = props.memberRelation.member.id;
    formData.role = props.memberRelation.role || '';
    formData.department = props.memberRelation.department || '';
    formData.is_primary = props.memberRelation.is_primary || false;
    formData.notes = props.memberRelation.notes || '';
    
    // 添加当前会员到选项中
    if (props.memberRelation.member) {
      memberOptions.value = [{
        value: props.memberRelation.member.id,
        label: `${props.memberRelation.member.username} - ${props.memberRelation.member.name || props.memberRelation.member.email}`
      }];
    }
  } else {
    resetForm();
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit('submit', { ...formData });
    } else {
      logger.warn('表单验证失败', fields);
      ElMessage.warning(t('common.form.validationFailed'));
    }
  });
};

// 取消操作
const handleCancel = () => {
  emit('cancel');
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  
  formData.customer_id = props.customerId;
  formData.member_id = 0;
  formData.role = '';
  formData.department = '';
  formData.is_primary = false;
  formData.notes = '';
  
  memberOptions.value = [];
};

// 监听props变化
watch(
  () => props.memberRelation,
  () => {
    initFormData();
  }
);

// 组件挂载时初始化
onMounted(() => {
  initFormData();
});
</script>
```

### 样式实现

```vue
<style scoped>
.customer-relation-form {
  max-width: 600px;
  margin: 0 auto;
}
</style>
```

## 组件注册与使用

### 组件注册

在 `src/components/CustomerManagement/index.ts` 中导出组件：

```typescript
export { default as CustomerRelationForm } from './CustomerRelationForm.vue';
```

### 在会员子表格组件中使用

在 `src/components/CustomerManagement/CustomerMembersSubTable.vue` 中使用该组件：

```vue
<template>
  <!-- ... 其他代码 ... -->
  
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
  
  <!-- ... 其他代码 ... -->
</template>

<script lang="ts" setup>
import { CustomerRelationForm } from '@/components/CustomerManagement';
// ... 其他代码 ...
</script>
```

## 国际化支持

在语言文件中添加以下翻译条目：

```yaml
# zh-CN.yaml
customer:
  member:
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

## 表单验证与数据处理

1. **表单验证**：
   - 必填字段验证：会员选择、角色
   - 字段长度限制：角色、部门、备注
   - 提交前进行表单验证

2. **数据处理**：
   - 远程搜索会员，支持按名称、邮箱等搜索
   - 格式化表单数据，确保提交数据的正确性
   - 处理编辑和查看模式下的数据回显

## 用户体验优化

1. **表单状态**：
   - 加载状态显示
   - 禁用状态处理（查看模式或加载中）
   - 错误提示与反馈

2. **交互优化**：
   - 会员选择支持远程搜索和过滤
   - 表单重置功能
   - 适当的按钮布局和状态

3. **视觉设计**：
   - 合理的表单布局
   - 一致的样式风格
   - 响应式设计，适应不同屏幕尺寸 
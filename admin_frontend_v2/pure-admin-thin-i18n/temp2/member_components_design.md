# 会员管理组件设计文档

本文档详细描述会员管理功能所需的各个组件的设计和实现细节。

## 1. MemberForm 组件

### 1.1 功能描述

MemberForm 组件用于创建和编辑会员信息，支持表单验证和不同的操作模式。

### 1.2 组件属性

```typescript
props: {
  member?: Member; // 会员对象，编辑模式下必填
  loading?: boolean; // 加载状态
  mode: "create" | "edit" | "view"; // 组件模式
}
```

### 1.3 事件

```typescript
emits: {
  (e: "submit", formData: MemberCreateUpdateParams): void; // 提交表单事件
  (e: "cancel"): void; // 取消操作事件
}
```

### 1.4 表单字段

- username（用户名）- 必填，唯一
- email（电子邮箱）- 必填，有效的邮箱格式
- password（密码）- 创建模式下必填
- password_confirm（确认密码）- 创建模式下必填，必须与密码一致
- phone（手机号）- 可选
- nick_name（昵称）- 可选
- first_name（名字）- 可选
- last_name（姓氏）- 可选
- status（状态）- 下拉选择：active/inactive/suspended
- tenant_id（租户ID）- 超级管理员必填，下拉选择

### 1.5 实现细节

- 使用 Element Plus 的 Form 组件
- 根据 mode 属性动态调整表单的可编辑性和显示字段
- 创建模式下显示密码字段，编辑模式下不显示
- 表单验证使用 Element Plus 的 Form Rules
- 查看模式下所有字段只读

### 1.6 代码结构

```vue
<template>
  <div class="member-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="loading || isViewMode"
    >
      <!-- 用户名 -->
      <el-form-item :label="t('member.username')" prop="username">
        <el-input
          v-model="formData.username"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <!-- 电子邮箱 -->
      <el-form-item :label="t('member.email')" prop="email">
        <el-input
          v-model="formData.email"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <!-- 密码字段（仅创建模式显示） -->
      <template v-if="mode === 'create'">
        <el-form-item :label="t('member.password')" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            :placeholder="t('common.form.inputPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('member.passwordConfirm')" prop="password_confirm">
          <el-input
            v-model="formData.password_confirm"
            type="password"
            :placeholder="t('common.form.inputPlaceholder')"
          />
        </el-form-item>
      </template>

      <!-- 其他字段 -->
      <el-form-item :label="t('member.phone')" prop="phone">
        <el-input
          v-model="formData.phone"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.nickName')" prop="nick_name">
        <el-input
          v-model="formData.nick_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.firstName')" prop="first_name">
        <el-input
          v-model="formData.first_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.lastName')" prop="last_name">
        <el-input
          v-model="formData.last_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.status')" prop="status">
        <el-select v-model="formData.status" :placeholder="t('common.form.selectPlaceholder')">
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 租户选择（仅超级管理员可见） -->
      <el-form-item
        v-if="isSuperAdmin"
        :label="t('member.tenant')"
        prop="tenant_id"
      >
        <el-select
          v-model="formData.tenant_id"
          :placeholder="t('common.form.selectPlaceholder')"
        >
          <el-option
            v-for="tenant in tenants"
            :key="tenant.id"
            :label="tenant.name"
            :value="tenant.id"
          />
        </el-select>
      </el-form-item>

      <!-- 表单按钮 -->
      <el-form-item v-if="!isViewMode">
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ t("common.save") }}
        </el-button>
        <el-button @click="resetForm">
          {{ t("common.reset") }}
        </el-button>
        <el-button @click="handleCancel">
          {{ t("common.cancel") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
```

## 2. MemberStatusTag 组件

### 2.1 功能描述

MemberStatusTag 组件用于以标签形式展示会员的状态，不同状态显示不同颜色。

### 2.2 组件属性

```typescript
props: {
  status: string; // 会员状态：active, inactive, suspended
}
```

### 2.3 实现细节

- 使用 Element Plus 的 Tag 组件
- 根据不同状态设置不同的颜色和文本
- active：绿色
- inactive：灰色
- suspended：红色

### 2.4 代码结构

```vue
<template>
  <el-tag :type="tagType" :effect="tagEffect">
    {{ statusText }}
  </el-tag>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const props = defineProps<{
  status: string;
}>();

// 根据状态计算标签类型
const tagType = computed(() => {
  switch (props.status) {
    case "active":
      return "success";
    case "inactive":
      return "info";
    case "suspended":
      return "danger";
    default:
      return "";
  }
});

// 标签效果
const tagEffect = computed(() => "light");

// 状态文本
const statusText = computed(() => {
  switch (props.status) {
    case "active":
      return t("member.statusActive");
    case "inactive":
      return t("member.statusInactive");
    case "suspended":
      return t("member.statusSuspended");
    default:
      return props.status;
  }
});
</script>
```

## 3. SubAccountForm 组件

### 3.1 功能描述

SubAccountForm 组件用于创建和编辑子账号信息，是 MemberForm 的简化版本。

### 3.2 组件属性

```typescript
props: {
  subAccount?: Member; // 子账号对象，编辑模式下必填
  loading?: boolean; // 加载状态
  mode: "create" | "edit"; // 组件模式
  parentId?: number; // 父账号ID，创建模式下必填
}
```

### 3.3 事件

```typescript
emits: {
  (e: "submit", formData: SubAccountCreateUpdateParams): void; // 提交表单事件
  (e: "cancel"): void; // 取消操作事件
}
```

### 3.4 表单字段

- username（用户名）- 必填，唯一
- email（电子邮箱）- 必填，有效的邮箱格式
- phone（手机号）- 可选
- nick_name（昵称）- 可选
- first_name（名字）- 可选
- last_name（姓氏）- 可选
- status（状态）- 下拉选择：active/inactive/suspended

### 3.5 实现细节

- 与 MemberForm 类似，但不包含密码字段和租户选择
- 创建子账号时自动关联到父账号
- 表单验证使用 Element Plus 的 Form Rules

### 3.6 代码结构

```vue
<template>
  <div class="sub-account-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="loading"
    >
      <!-- 用户名 -->
      <el-form-item :label="t('member.username')" prop="username">
        <el-input
          v-model="formData.username"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <!-- 电子邮箱 -->
      <el-form-item :label="t('member.email')" prop="email">
        <el-input
          v-model="formData.email"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <!-- 其他字段 -->
      <el-form-item :label="t('member.phone')" prop="phone">
        <el-input
          v-model="formData.phone"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.nickName')" prop="nick_name">
        <el-input
          v-model="formData.nick_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.firstName')" prop="first_name">
        <el-input
          v-model="formData.first_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.lastName')" prop="last_name">
        <el-input
          v-model="formData.last_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('member.status')" prop="status">
        <el-select v-model="formData.status" :placeholder="t('common.form.selectPlaceholder')">
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <!-- 表单按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ t("common.save") }}
        </el-button>
        <el-button @click="resetForm">
          {{ t("common.reset") }}
        </el-button>
        <el-button @click="handleCancel">
          {{ t("common.cancel") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
```

## 4. CustomerRelationForm 组件

### 4.1 功能描述

CustomerRelationForm 组件用于创建和编辑会员与客户之间的关系。

### 4.2 组件属性

```typescript
props: {
  relation?: MemberCustomerRelation; // 关系对象，编辑模式下必填
  loading?: boolean; // 加载状态
  mode: "create" | "edit"; // 组件模式
  memberId?: number; // 会员ID，创建模式下必填
}
```

### 4.3 事件

```typescript
emits: {
  (e: "submit", formData: MemberCustomerRelationCreateUpdateParams): void; // 提交表单事件
  (e: "cancel"): void; // 取消操作事件
}
```

### 4.4 表单字段

- customer_id（客户ID）- 必填，下拉选择
- role（角色）- 必填，描述会员在客户中的角色
- is_primary（是否为主要联系人）- 可选，布尔值

### 4.5 实现细节

- 使用 Element Plus 的 Form 组件
- 客户选择使用下拉框，需要从后端获取可选客户列表
- 表单验证使用 Element Plus 的 Form Rules

### 4.6 代码结构

```vue
<template>
  <div class="customer-relation-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="loading"
    >
      <!-- 客户选择 -->
      <el-form-item :label="t('member.relation.customer')" prop="customer_id">
        <el-select
          v-model="formData.customer_id"
          :placeholder="t('common.form.selectPlaceholder')"
          filterable
          remote
          :remote-method="searchCustomers"
          :loading="customersLoading"
        >
          <el-option
            v-for="customer in customers"
            :key="customer.id"
            :label="customer.name"
            :value="customer.id"
          />
        </el-select>
      </el-form-item>

      <!-- 角色 -->
      <el-form-item :label="t('member.relation.role')" prop="role">
        <el-input
          v-model="formData.role"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <!-- 是否为主要联系人 -->
      <el-form-item :label="t('member.relation.isPrimary')" prop="is_primary">
        <el-switch v-model="formData.is_primary" />
      </el-form-item>

      <!-- 表单按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ t("common.save") }}
        </el-button>
        <el-button @click="resetForm">
          {{ t("common.reset") }}
        </el-button>
        <el-button @click="handleCancel">
          {{ t("common.cancel") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
```

## 5. AvatarUpload 组件

### 5.1 功能描述

AvatarUpload 组件用于上传和预览会员头像。

### 5.2 组件属性

```typescript
props: {
  avatar?: string; // 当前头像URL
  loading?: boolean; // 加载状态
  disabled?: boolean; // 是否禁用
}
```

### 5.3 事件

```typescript
emits: {
  (e: "upload", file: File): void; // 上传文件事件
}
```

### 5.4 实现细节

- 使用 Element Plus 的 Upload 组件
- 支持图片预览和裁剪
- 限制文件大小和类型
- 显示上传进度和错误信息

### 5.5 代码结构

```vue
<template>
  <div class="avatar-upload">
    <el-upload
      class="avatar-uploader"
      action="#"
      :http-request="handleCustomUpload"
      :show-file-list="false"
      :before-upload="beforeAvatarUpload"
      :disabled="disabled || loading"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" />
      <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
      <el-progress
        v-if="uploading"
        type="circle"
        :percentage="uploadPercentage"
        :width="80"
        class="upload-progress"
      />
    </el-upload>
    <div class="avatar-tips">
      {{ t('member.avatar.tips') }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const { t } = useI18n();
const props = defineProps<{
  avatar?: string;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "upload", file: File): void;
}>();

// 当前显示的图片URL
const imageUrl = computed(() => props.avatar || "");

// 上传状态
const uploading = ref(false);
const uploadPercentage = ref(0);

// 上传前验证
const beforeAvatarUpload = (file: File) => {
  // 验证文件类型
  const isImage = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"].includes(file.type);
  if (!isImage) {
    ElMessage.error(t("member.avatar.typeError"));
    return false;
  }
  
  // 验证文件大小（2MB）
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error(t("member.avatar.sizeError"));
    return false;
  }
  
  return true;
};

// 自定义上传处理
const handleCustomUpload = async (options: any) => {
  const { file } = options;
  uploading.value = true;
  uploadPercentage.value = 0;
  
  // 模拟上传进度
  const timer = setInterval(() => {
    if (uploadPercentage.value < 90) {
      uploadPercentage.value += 10;
    }
  }, 300);
  
  try {
    // 触发上传事件
    emit("upload", file);
    uploadPercentage.value = 100;
  } catch (error) {
    ElMessage.error(t("member.avatar.uploadError"));
  } finally {
    clearInterval(timer);
    setTimeout(() => {
      uploading.value = false;
    }, 500);
  }
};
</script>

<style scoped>
.avatar-upload {
  text-align: center;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  margin: 0 auto;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.upload-progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  padding: 10px;
}

.avatar-tips {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
```

## 6. ConfirmDialog 组件

### 6.1 功能描述

ConfirmDialog 组件是一个通用的确认对话框，用于删除、重置密码等需要确认的操作。

### 6.2 组件属性

```typescript
props: {
  visible: boolean; // 对话框是否可见
  title: string; // 对话框标题
  content: string; // 对话框内容
  type: "warning" | "danger" | "info"; // 对话框类型
  loading?: boolean; // 加载状态
}
```

### 6.3 事件

```typescript
emits: {
  (e: "confirm"): void; // 确认事件
  (e: "cancel"): void; // 取消事件
  (e: "update:visible", value: boolean): void; // 更新visible属性
}
```

### 6.4 实现细节

- 使用 Element Plus 的 Dialog 组件
- 根据不同类型显示不同的图标和颜色
- 支持加载状态显示

### 6.5 代码结构

```vue
<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="30%"
    :close-on-click-modal="false"
    :close-on-press-escape="!loading"
    @update:model-value="handleVisibleChange"
  >
    <div class="confirm-dialog-content">
      <el-icon :class="iconClass" :size="24">
        <component :is="iconComponent" />
      </el-icon>
      <span class="confirm-text">{{ content }}</span>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :disabled="loading">
          {{ t("common.cancel") }}
        </el-button>
        <el-button
          :type="buttonType"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ t("common.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Warning, InfoFilled, CircleCloseFilled } from "@element-plus/icons-vue";

const { t } = useI18n();
const props = defineProps<{
  visible: boolean;
  title: string;
  content: string;
  type: "warning" | "danger" | "info";
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "update:visible", value: boolean): void;
}>();

// 根据类型计算图标组件
const iconComponent = computed(() => {
  switch (props.type) {
    case "warning":
      return Warning;
    case "danger":
      return CircleCloseFilled;
    case "info":
      return InfoFilled;
    default:
      return Warning;
  }
});

// 根据类型计算图标类名
const iconClass = computed(() => {
  return `confirm-icon ${props.type}`;
});

// 根据类型计算按钮类型
const buttonType = computed(() => {
  switch (props.type) {
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "info":
      return "primary";
    default:
      return "primary";
  }
});

// 处理确认
const handleConfirm = () => {
  emit("confirm");
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
};

// 处理可见性变化
const handleVisibleChange = (value: boolean) => {
  if (!props.loading || value) {
    emit("update:visible", value);
  }
};
</script>

<style scoped>
.confirm-dialog-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.confirm-icon {
  margin-right: 10px;
}

.confirm-icon.warning {
  color: #e6a23c;
}

.confirm-icon.danger {
  color: #f56c6c;
}

.confirm-icon.info {
  color: #909399;
}

.confirm-text {
  line-height: 1.5;
}
</style>
```

## 7. 组件导出

所有组件将通过一个统一的入口文件导出，方便在其他地方引用：

```typescript
// src/components/MemberManagement/index.ts
import MemberForm from "./MemberForm.vue";
import MemberStatusTag from "./MemberStatusTag.vue";
import SubAccountForm from "./SubAccountForm.vue";
import CustomerRelationForm from "./CustomerRelationForm.vue";
import AvatarUpload from "./AvatarUpload.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

export {
  MemberForm,
  MemberStatusTag,
  SubAccountForm,
  CustomerRelationForm,
  AvatarUpload,
  ConfirmDialog
};

export default {
  MemberForm,
  MemberStatusTag,
  SubAccountForm,
  CustomerRelationForm,
  AvatarUpload,
  ConfirmDialog
};
```

## 8. 组件间关系

1. MemberForm 是会员管理的核心组件，用于创建和编辑会员信息
2. SubAccountForm 是 MemberForm 的简化版，专用于子账号管理
3. CustomerRelationForm 用于管理会员与客户的关系
4. AvatarUpload 可以被 MemberForm 和 SubAccountForm 使用
5. MemberStatusTag 用于在列表和详情页中展示会员状态
6. ConfirmDialog 是通用组件，用于各种需要确认的操作

## 9. 样式设计

1. 遵循项目现有的设计风格
2. 使用 Element Plus 的主题变量，确保与系统其他部分风格一致
3. 表单宽度控制在合理范围内，避免过宽或过窄
4. 适当使用间距和分隔线，提高可读性
5. 状态标签使用直观的颜色，便于快速识别

## 10. 国际化

所有组件中的文本都使用 i18n 进行国际化处理，支持中英文切换：

```typescript
// 示例
const { t } = useI18n();

// 使用
t("member.username")
```

## 11. 组件测试

为每个组件编写单元测试，确保：
1. 组件能够正确渲染
2. 表单验证规则正常工作
3. 事件正确触发
4. 不同模式下组件行为符合预期 
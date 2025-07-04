<script lang="ts" setup>
import { ref, reactive, computed, defineProps, defineEmits, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import type {
  AdminUser,
  AdminUserCreateParams,
  AdminUserUpdateParams
} from "@/types/adminUser";
import AvatarUpload from "./AvatarUpload.vue";
import { useTenantStoreHook } from "@/store/modules/tenant";

const { t } = useI18n();
const tenantStore = useTenantStoreHook();

const props = defineProps({
  // 表单模式：create-创建，update-更新，superAdmin-创建超管，view-查看
  mode: {
    type: String,
    default: "create",
    validator: (value: string) =>
      ["create", "update", "superAdmin", "view"].includes(value)
  },
  // 编辑模式下的管理员用户数据
  adminUser: {
    type: Object as () => AdminUser | null,
    default: null
  },
  // 表单加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 是否只读模式
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["submit", "cancel"]);

// 表单引用
const formRef = ref();

// 表单数据
const formData = reactive<AdminUserCreateParams | AdminUserUpdateParams>({
  username: "",
  email: "",
  password: undefined,
  password_confirm: undefined,
  phone: "",
  nick_name: "",
  first_name: "",
  last_name: undefined,
  tenant_id: undefined,
  is_active: true,
  is_super_admin: false
});

// 表单校验规则
const rules = {
  username: [
    {
      required: true,
      message: t("adminUser.usernameRequired"),
      trigger: "blur"
    },
    { min: 3, max: 30, message: t("adminUser.usernameLength"), trigger: "blur" }
  ],
  email: [
    { required: true, message: t("adminUser.emailRequired"), trigger: "blur" },
    { type: "email", message: t("adminUser.emailInvalid"), trigger: "blur" }
  ],
  password: [
    {
      required: props.mode !== "update",
      message: t("adminUser.passwordRequired"),
      trigger: "blur"
    },
    { min: 8, message: t("adminUser.passwordLength"), trigger: "blur" }
  ],
  password_confirm: [
    {
      required: props.mode !== "update",
      message: t("adminUser.confirmPasswordRequired"),
      trigger: "blur"
    },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== (formData as AdminUserCreateParams).password) {
          callback(new Error(t("adminUser.passwordMismatch")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

// 是否显示租户选择
const showTenantSelect = computed(() => {
  return props.mode === "create"; // 只在创建普通管理员时显示租户选择
});

// 头像上传后的回调
const handleAvatarUploaded = (avatarUrl: string) => {
  // 更新表单数据中的头像
  if (props.adminUser) {
    props.adminUser.avatar = avatarUrl;
  }
};

// 表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 提交前确保undefined值被转换为适当的空字符串
    const processedData = { ...formData };
    if (processedData.last_name === undefined) {
      processedData.last_name = "";
    }
    if ((processedData as AdminUserCreateParams).password === undefined) {
      (processedData as AdminUserCreateParams).password = "";
    }
    if (
      (processedData as AdminUserCreateParams).password_confirm === undefined
    ) {
      (processedData as AdminUserCreateParams).password_confirm = "";
    }

    emit("submit", processedData);
  } catch (error) {
    console.error("表单验证失败", error);
    ElMessage.error(t("adminUser.formValidationFailed"));
  }
};

// 取消
const handleCancel = () => {
  emit("cancel");
};

// 监听adminUser变化，更新表单数据
watch(
  () => props.adminUser,
  newVal => {
    if (newVal && (props.mode === "update" || props.mode === "view")) {
      // 更新模式或查看模式下，使用adminUser数据更新表单
      // 添加username字段，解决API要求username不能为空的问题
      (formData as any).username = newVal.username || "";
      formData.email = newVal.email || "";
      formData.phone = newVal.phone || "";
      formData.nick_name = newVal.nick_name || "";
      formData.first_name = newVal.first_name || "";
      formData.last_name = newVal.last_name || undefined;
      formData.is_active = newVal.is_active;

      // 清空密码字段，更新时不需要填写密码
      (formData as AdminUserCreateParams).password = undefined;
      (formData as AdminUserCreateParams).password_confirm = undefined;
    } else if (props.mode === "superAdmin") {
      // 创建超管模式，设置超管标志
      (formData as AdminUserCreateParams).is_super_admin = true;
      formData.tenant_id = undefined;
    }
  },
  { immediate: true }
);

// 初始化获取租户列表
const fetchTenants = async () => {
  if (showTenantSelect.value) {
    try {
      await tenantStore.fetchTenantList({ page: 1, page_size: 100 });
    } catch (error) {
      console.error("获取租户列表失败", error);
    }
  }
};

// 计算租户选项列表
const tenantOptions = computed(() => {
  return tenantStore.tenantList.data.map(item => ({
    label: item.name,
    value: item.id
  }));
});

// 组件挂载时获取租户列表
fetchTenants();
</script>

<template>
  <div class="admin-user-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="readonly ? {} : rules"
      label-width="120px"
      :disabled="loading || readonly"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            :label="t('adminUser.username')"
            prop="username"
            v-if="mode !== 'update'"
          >
            <el-input
              v-model="formData.username"
              :placeholder="t('adminUser.usernamePlaceholder')"
            />
          </el-form-item>

          <!-- 隐藏的用户名字段，用于更新时传递给API -->
          <el-form-item v-if="mode === 'update'" style="display: none">
            <el-input v-model="(formData as any).username" type="hidden" />
          </el-form-item>

          <el-form-item :label="t('adminUser.email')" prop="email">
            <el-input
              v-model="formData.email"
              :placeholder="t('adminUser.emailPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('adminUser.phone')" prop="phone">
            <el-input
              v-model="formData.phone"
              :placeholder="t('adminUser.phonePlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('adminUser.nickName')" prop="nick_name">
            <el-input
              v-model="formData.nick_name"
              :placeholder="t('adminUser.nickNamePlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('adminUser.firstName')" prop="first_name">
            <el-input
              v-model="formData.first_name"
              :placeholder="t('adminUser.firstNamePlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('adminUser.lastName')" prop="last_name">
            <el-input
              v-model="formData.last_name"
              :placeholder="t('adminUser.lastNamePlaceholder')"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <div v-if="mode !== 'update'" class="password-section">
            <el-form-item :label="t('adminUser.password')" prop="password">
              <el-input
                v-model="(formData as AdminUserCreateParams).password"
                type="password"
                :placeholder="t('adminUser.passwordPlaceholder')"
                show-password
              />
            </el-form-item>

            <el-form-item
              :label="t('adminUser.confirmPassword')"
              prop="password_confirm"
            >
              <el-input
                v-model="(formData as AdminUserCreateParams).password_confirm"
                type="password"
                :placeholder="t('adminUser.confirmPasswordPlaceholder')"
                show-password
              />
            </el-form-item>
          </div>

          <el-form-item :label="t('adminUser.isActive')" prop="is_active">
            <el-switch v-model="formData.is_active" />
          </el-form-item>

          <el-form-item
            :label="t('adminUser.tenant')"
            prop="tenant_id"
            v-if="showTenantSelect"
          >
            <el-select
              v-model="(formData as AdminUserCreateParams).tenant_id"
              filterable
              clearable
              :placeholder="t('adminUser.tenantPlaceholder')"
            >
              <el-option
                v-for="item in tenantOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item
            :label="t('adminUser.avatar')"
            v-if="mode === 'update' && adminUser"
          >
            <AvatarUpload
              :user-id="adminUser.id"
              :current-avatar="adminUser.avatar"
              @uploaded="handleAvatarUploaded"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="form-actions">
        <el-button @click="handleCancel">
          {{ readonly ? t("adminUser.close") : t("adminUser.cancel") }}
        </el-button>
        <el-button
          v-if="!readonly"
          type="primary"
          @click="handleSubmit"
          :loading="loading"
        >
          {{
            mode === "update" ? t("adminUser.update") : t("adminUser.create")
          }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.admin-user-form-container {
  padding: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.password-section {
  margin-bottom: 20px;
}
</style>

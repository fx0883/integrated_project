<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="disabled"
  >
    <!-- 头像上传 -->
    <div class="avatar-container">
      <el-form-item :label="$t('member.avatar')">
        <AvatarUpload
          :avatar-url="form.avatar"
          :disabled="disabled"
          :loading="avatarUploading"
          @update="handleAvatarUpdate"
        />
      </el-form-item>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.username')">
          <el-input
            v-model="form.username"
            :placeholder="$t('member.usernamePlaceholder')"
            :disabled="isEdit"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.nickName')" prop="nick_name">
          <el-input
            v-model="form.nick_name"
            :placeholder="$t('member.nickNamePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.firstName')" prop="first_name">
          <el-input
            v-model="form.first_name"
            :placeholder="$t('member.firstNamePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.lastName')" prop="last_name">
          <el-input
            v-model="form.last_name"
            :placeholder="$t('member.lastNamePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.email')" prop="email" required>
          <el-input
            v-model="form.email"
            :placeholder="$t('member.emailPlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.phone')" prop="phone">
          <el-input
            v-model="form.phone"
            :placeholder="$t('member.phonePlaceholder')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="!isEdit" :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="$t('member.passwordPlaceholder')"
            autocomplete="new-password"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item
          :label="$t('member.confirmPassword')"
          prop="confirmPassword"
        >
          <el-input
            v-model="form.confirmPassword"
            type="password"
            show-password
            :placeholder="$t('member.confirmPasswordPlaceholder')"
            autocomplete="new-password"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.status')" prop="status">
          <el-select
            v-model="form.status"
            :placeholder="$t('member.statusPlaceholder')"
            style="width: 100%"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col v-if="showTenantSelect" :span="12">
        <el-form-item :label="$t('member.tenant')" prop="tenant_id">
          <el-select
            v-model="form.tenant_id"
            :placeholder="$t('member.tenantPlaceholder')"
            style="width: 100%"
            filterable
            remote
            :remote-method="remoteTenantSearch"
            :loading="tenantLoading"
          >
            <el-option
              v-for="item in tenantOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item :label="$t('member.notes')" prop="notes">
      <el-input
        v-model="form.notes"
        type="textarea"
        :rows="3"
        :placeholder="$t('member.notesPlaceholder')"
      />
    </el-form-item>

    <el-form-item v-if="!disabled">
      <el-button type="primary" :loading="submitLoading" @click="submitForm">
        {{ $t("common.submit") }}
      </el-button>
      <el-button @click="resetForm">{{ $t("common.reset") }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, PropType, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  Member,
  MemberStatus,
  MemberCreateUpdateParams
} from "@/types/member";
import { ElMessage } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import { AvatarUpload } from "@/components/MemberManagement";
import logger from "@/utils/logger";

const { t } = useI18n();
const tenantStore = useTenantStoreHook();
const userStore = useUserStoreHook();

const props = defineProps({
  // 会员数据
  memberData: {
    type: Object as PropType<Member | null>,
    default: null
  },
  // 是否为编辑模式
  isEdit: {
    type: Boolean,
    default: false
  },
  // 是否禁用表单
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 是否显示租户选择器
  showTenantSelect: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{
  (e: "submit", data: MemberCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 提交加载状态
const submitLoading = ref(false);

// 租户加载状态
const tenantLoading = ref(false);

// 头像上传状态
const avatarUploading = ref(false);

// 租户选项
const tenantOptions = ref([]);

// 会员状态选项
const statusOptions = [
  {
    value: "active",
    label: t("member.statusActive")
  },
  {
    value: "inactive",
    label: t("member.statusInactive")
  },
  {
    value: "locked",
    label: t("member.statusLocked")
  },
  {
    value: "pending",
    label: t("member.statusPending")
  }
];

// 表单数据
const form = reactive({
  username: "",
  nick_name: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  status: "active" as MemberStatus,
  tenant_id: undefined as number | undefined,
  notes: "",
  avatar: "",
  avatarFile: null as File | null
});

// 表单验证规则
const rules = reactive<FormRules>({
  nick_name: [
    { required: true, message: t("member.nameRequired"), trigger: "blur" },
    { min: 2, max: 50, message: t("member.nameLength"), trigger: "blur" }
  ],
  email: [
    { required: true, message: t("member.emailRequired"), trigger: "blur" },
    { type: "email", message: t("member.emailInvalid"), trigger: "blur" }
  ],
  phone: [
    {
      pattern: /^[0-9\-+\s()]*$/,
      message: t("member.phoneInvalid"),
      trigger: "blur"
    }
  ],
  password: [
    {
      required: !props.isEdit,
      message: t("member.passwordRequired"),
      trigger: "blur"
    },
    { min: 8, message: t("member.passwordLength"), trigger: "blur" }
  ],
  confirmPassword: [
    {
      required: !props.isEdit,
      message: t("member.confirmPasswordRequired"),
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error(t("member.passwordMismatch")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  status: [
    { required: true, message: t("member.statusRequired"), trigger: "change" }
  ],
  tenant_id: [
    {
      required: props.showTenantSelect && userStore.is_super_admin === false,
      message: t("member.tenantRequired"),
      trigger: "change"
    }
  ]
});

// 处理头像上传
const handleAvatarUpdate = (file: File) => {
  form.avatarFile = file;
  // 创建本地预览URL
  form.avatar = URL.createObjectURL(file);
};

// 初始化表单数据
const initFormData = () => {
  if (props.memberData) {
    form.username = props.memberData.username || "";
    form.nick_name = props.memberData.nick_name || "";
    form.first_name = props.memberData.first_name || "";
    form.last_name = props.memberData.last_name || "";
    form.email = props.memberData.email || "";
    form.phone = props.memberData.phone || "";
    form.status = props.memberData.status as MemberStatus;
    form.tenant_id = props.memberData.tenant_id;
    form.notes = props.memberData.notes || "";
    form.avatar = props.memberData.avatar || "";

    // 如果有租户信息，添加到租户选项中
    if (props.memberData.tenant_id && props.memberData.tenant_name) {
      tenantOptions.value = [
        {
          value: props.memberData.tenant_id,
          label: props.memberData.tenant_name
        }
      ];
    }
  } else {
    resetForm();
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.username = "";
  form.nick_name = "";
  form.first_name = "";
  form.last_name = "";
  form.email = "";
  form.phone = "";
  form.password = "";
  form.confirmPassword = "";
  form.status = "active" as MemberStatus;
  form.tenant_id = undefined;
  form.notes = "";
  form.avatar = "";
  form.avatarFile = null;
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    // 构建提交数据
    const submitData: MemberCreateUpdateParams = {
      username: form.username,
      nick_name: form.nick_name,
      first_name: form.first_name,
      last_name: form.last_name,
      status: form.status,
      email: form.email || ""
    };

    // 可选字段
    if (form.phone) submitData.phone = form.phone;
    if (form.notes) submitData.notes = form.notes;
    if (form.tenant_id && props.showTenantSelect)
      submitData.tenant_id = form.tenant_id;

    // 如果是创建模式，添加密码
    if (!props.isEdit && form.password) {
      submitData.password = form.password;
      submitData.password_confirm = form.confirmPassword;
    }

    // 如果有头像文件，添加到提交数据
    if (form.avatarFile) {
      submitData.avatarFile = form.avatarFile;
    }

    // 触发提交事件
    emit("submit", submitData);
  } catch (error) {
    logger.error("表单验证失败", error);
    ElMessage.error(t("common.formValidationFailed"));
  } finally {
    submitLoading.value = false;
  }
};

// 远程搜索租户
const remoteTenantSearch = async (query: string) => {
  if (query) {
    tenantLoading.value = true;
    try {
      await tenantStore.fetchTenantList({
        search: query,
        page: 1,
        page_size: 10
      });
      tenantOptions.value = tenantStore.tenantList.data.map(tenant => ({
        value: tenant.id,
        label: tenant.name
      }));
    } catch (error) {
      logger.error("搜索租户失败", error);
    } finally {
      tenantLoading.value = false;
    }
  } else {
    tenantOptions.value = [];
  }
};

// 暴露resetForm方法给父组件
defineExpose({
  resetForm
});

// 初始化
onMounted(() => {
  initFormData();
});
</script>

<style scoped>
.el-form {
  max-width: 100%;
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
</style>

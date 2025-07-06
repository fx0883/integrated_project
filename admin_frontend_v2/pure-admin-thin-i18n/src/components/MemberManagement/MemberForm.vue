<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="disabled"
    v-loading="loading"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.username')" prop="username">
          <el-input
            v-model="form.username"
            :placeholder="$t('member.usernamePlaceholder')"
            :disabled="isEdit"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.name')" prop="name">
          <el-input
            v-model="form.name"
            :placeholder="$t('member.namePlaceholder')"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('member.email')" prop="email">
          <el-input
            v-model="form.email"
            :placeholder="$t('member.emailPlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('member.phone')" prop="phone">
          <el-input
            v-model="form.phone"
            :placeholder="$t('member.phonePlaceholder')"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20" v-if="!isEdit">
      <el-col :span="12">
        <el-form-item :label="$t('member.password')" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="$t('member.passwordPlaceholder')"
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
      <el-col :span="12" v-if="showTenantSelect">
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
      <el-button type="primary" @click="submitForm" :loading="submitLoading">
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
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  status: "active" as MemberStatus,
  tenant_id: undefined as number | undefined,
  notes: ""
});

// 表单验证规则
const rules = reactive<FormRules>({
  username: [
    { required: true, message: t("member.usernameRequired"), trigger: "blur" },
    { min: 3, max: 30, message: t("member.usernameLength"), trigger: "blur" }
  ],
  name: [
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
      required: props.showTenantSelect && !userStore.is_tenant_admin,
      message: t("member.tenantRequired"),
      trigger: "change"
    }
  ]
});

// 初始化表单数据
const initFormData = () => {
  if (props.memberData) {
    form.username = props.memberData.username || "";
    form.name = props.memberData.name || "";
    form.email = props.memberData.email || "";
    form.phone = props.memberData.phone || "";
    form.status = props.memberData.status || "active";
    form.tenant_id = props.memberData.tenant_id;
    form.notes = props.memberData.notes || "";

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
  form.name = "";
  form.email = "";
  form.phone = "";
  form.password = "";
  form.confirmPassword = "";
  form.status = "active";
  form.tenant_id = undefined;
  form.notes = "";
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
      name: form.name,
      email: form.email,
      status: form.status
    };

    // 可选字段
    if (form.phone) submitData.phone = form.phone;
    if (form.notes) submitData.notes = form.notes;
    if (form.tenant_id) submitData.tenant_id = form.tenant_id;

    // 如果是创建模式，添加密码
    if (!props.isEdit && form.password) {
      submitData.password = form.password;
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
      await tenantStore.fetchTenantList({ search: query, page: 1, limit: 10 });
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

// 初始化
onMounted(() => {
  initFormData();
});
</script>

<style scoped>
.el-form {
  max-width: 100%;
}
</style>

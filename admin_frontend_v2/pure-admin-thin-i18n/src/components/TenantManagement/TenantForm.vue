<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  Tenant,
  TenantCreateUpdateParams,
  TenantStatus
} from "@/types/tenant";

const { t } = useI18n();

const props = defineProps<{
  tenant?: Tenant;
  loading?: boolean;
  mode: "create" | "edit";
}>();

const emit = defineEmits<{
  (e: "submit", formData: TenantCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<TenantCreateUpdateParams>({
  name: props.tenant?.name || "",
  status: props.tenant?.status || "active",
  contact_name: props.tenant?.contact_name || "",
  contact_email: props.tenant?.contact_email || "",
  contact_phone: props.tenant?.contact_phone || ""
});

// 监听props变化，更新表单数据
watch(
  () => props.tenant,
  newVal => {
    if (newVal) {
      formData.name = newVal.name;
      formData.status = newVal.status;
      formData.contact_name = newVal.contact_name || "";
      formData.contact_email = newVal.contact_email || "";
      formData.contact_phone = newVal.contact_phone || "";
    }
  }
);

// 表单验证规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: t("tenant.nameRequired"), trigger: "blur" },
    { min: 2, max: 100, message: t("tenant.nameLength"), trigger: "blur" }
  ],
  contact_email: [
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: t("tenant.emailFormat"),
      trigger: "blur"
    }
  ],
  contact_phone: [
    {
      pattern: /^[+\d\s-]{5,20}$/,
      message: t("tenant.phoneFormat"),
      trigger: "blur"
    }
  ]
});

// 状态选项
const statusOptions = [
  {
    value: "active",
    label: t("tenant.statusActive")
  },
  {
    value: "suspended",
    label: t("tenant.statusSuspended")
  }
];

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit("submit", { ...formData });
    }
  });
};

// 取消
const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <div class="tenant-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="loading"
    >
      <el-form-item :label="t('tenant.name')" prop="name">
        <el-input v-model="formData.name" :placeholder="t('tenant.name')" />
      </el-form-item>

      <el-form-item
        :label="t('tenant.status')"
        prop="status"
        v-if="mode === 'edit'"
      >
        <el-select v-model="formData.status" class="w-full">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('tenant.contactName')" prop="contact_name">
        <el-input
          v-model="formData.contact_name"
          :placeholder="t('tenant.contactName')"
        />
      </el-form-item>

      <el-form-item :label="t('tenant.contactEmail')" prop="contact_email">
        <el-input
          v-model="formData.contact_email"
          :placeholder="t('tenant.contactEmail')"
        />
      </el-form-item>

      <el-form-item :label="t('tenant.contactPhone')" prop="contact_phone">
        <el-input
          v-model="formData.contact_phone"
          :placeholder="t('tenant.contactPhone')"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ t("tenant.save") }}
        </el-button>
        <el-button @click="handleCancel">
          {{ t("tenant.cancel") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.tenant-form {
  max-width: 600px;
  margin: 0 auto;
}

.w-full {
  width: 100%;
}
</style>

<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type { TenantQuota, TenantQuotaUpdateParams } from "@/types/tenant";

const { t } = useI18n();

const props = defineProps<{
  quota?: TenantQuota;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", formData: TenantQuotaUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<TenantQuotaUpdateParams>({
  max_users: props.quota?.max_users || 10,
  max_admins: props.quota?.max_admins || 2,
  max_storage_mb: props.quota?.max_storage_mb || 1024,
  max_products: props.quota?.max_products || 100
});

// 监听配额变化，更新表单数据
watch(
  () => props.quota,
  newVal => {
    if (newVal) {
      formData.max_users = newVal.max_users;
      formData.max_admins = newVal.max_admins;
      formData.max_storage_mb = newVal.max_storage_mb;
      formData.max_products = newVal.max_products;
    }
  }
);

// 表单验证规则
const rules = reactive<FormRules>({
  max_users: [
    { required: true, message: t("tenant.positiveInteger"), trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value <= 0 || !Number.isInteger(Number(value))) {
          callback(new Error(t("tenant.positiveInteger")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  max_admins: [
    { required: true, message: t("tenant.positiveInteger"), trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value <= 0 || !Number.isInteger(Number(value))) {
          callback(new Error(t("tenant.positiveInteger")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  max_storage_mb: [
    { required: true, message: t("tenant.positiveInteger"), trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value <= 0 || !Number.isInteger(Number(value))) {
          callback(new Error(t("tenant.positiveInteger")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ],
  max_products: [
    { required: true, message: t("tenant.positiveInteger"), trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value <= 0 || !Number.isInteger(Number(value))) {
          callback(new Error(t("tenant.positiveInteger")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit("submit", {
        max_users: Number(formData.max_users),
        max_admins: Number(formData.max_admins),
        max_storage_mb: Number(formData.max_storage_mb),
        max_products: Number(formData.max_products)
      });
    }
  });
};

// 取消
const handleCancel = () => {
  emit("cancel");
};
</script>

<template>
  <div class="tenant-quota-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="200px"
      :disabled="loading"
    >
      <el-form-item :label="t('tenant.maxUsers')" prop="max_users">
        <el-input-number
          v-model="formData.max_users"
          :min="1"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item :label="t('tenant.maxAdmins')" prop="max_admins">
        <el-input-number
          v-model="formData.max_admins"
          :min="1"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item :label="t('tenant.maxStorageMb')" prop="max_storage_mb">
        <el-input-number
          v-model="formData.max_storage_mb"
          :min="1"
          :precision="0"
          class="w-full"
        />
      </el-form-item>

      <el-form-item :label="t('tenant.maxProducts')" prop="max_products">
        <el-input-number
          v-model="formData.max_products"
          :min="1"
          :precision="0"
          class="w-full"
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
.tenant-quota-form {
  max-width: 600px;
  margin: 0 auto;
}

.w-full {
  width: 200px;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>

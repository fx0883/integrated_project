<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  ContactPerson,
  ContactPersonCreateUpdateParams
} from "@/types/customer";

const { t } = useI18n();

const props = defineProps<{
  contactPerson?: ContactPerson;
  loading?: boolean;
  mode: "create" | "edit";
  customerId?: number;
}>();

const emit = defineEmits<{
  (e: "submit", formData: ContactPersonCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<ContactPersonCreateUpdateParams>({
  customer_id: props.customerId,
  first_name: props.contactPerson?.first_name || "",
  last_name: props.contactPerson?.last_name || "",
  position: props.contactPerson?.position || "",
  email: props.contactPerson?.email || "",
  phone: props.contactPerson?.phone || "",
  mobile: props.contactPerson?.mobile || "",
  is_primary: props.contactPerson?.is_primary || false,
  notes: props.contactPerson?.notes || ""
});

// 监听props变化，更新表单数据
watch(
  () => props.contactPerson,
  newVal => {
    if (newVal) {
      formData.customer_id = props.customerId || newVal.customer_id;
      formData.first_name = newVal.first_name;
      formData.last_name = newVal.last_name;
      formData.position = newVal.position || "";
      formData.email = newVal.email || "";
      formData.phone = newVal.phone || "";
      formData.mobile = newVal.mobile || "";
      formData.is_primary = newVal.is_primary || false;
      formData.notes = newVal.notes || "";
    }
  }
);

// 监听customerId变化
watch(
  () => props.customerId,
  newVal => {
    if (newVal) {
      formData.customer_id = newVal;
    }
  }
);

// 表单验证规则
const rules = reactive<FormRules>({
  first_name: [
    { required: true, message: t("common.form.required"), trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: t("common.form.lengthLimit", { min: 2, max: 50 }),
      trigger: "blur"
    }
  ],
  last_name: [
    { required: true, message: t("common.form.required"), trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: t("common.form.lengthLimit", { min: 2, max: 50 }),
      trigger: "blur"
    }
  ],
  email: [
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: t("common.form.invalidEmailFormat"),
      trigger: "blur"
    }
  ],
  phone: [
    {
      pattern: /^[+\d\s-]{5,20}$/,
      message: t("common.form.invalidPhoneFormat"),
      trigger: "blur"
    }
  ],
  mobile: [
    {
      pattern: /^[+\d\s-]{5,20}$/,
      message: t("common.form.invalidPhoneFormat"),
      trigger: "blur"
    }
  ]
});

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

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};
</script>

<template>
  <div class="contact-person-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="loading"
    >
      <el-form-item :label="t('customer.contact.firstName')" prop="first_name">
        <el-input
          v-model="formData.first_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('customer.contact.lastName')" prop="last_name">
        <el-input
          v-model="formData.last_name"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('customer.contact.position')" prop="position">
        <el-input
          v-model="formData.position"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('customer.contact.email')" prop="email">
        <el-input
          v-model="formData.email"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('customer.contact.phone')" prop="phone">
        <el-input
          v-model="formData.phone"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('customer.contact.mobile')" prop="mobile">
        <el-input
          v-model="formData.mobile"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('customer.contact.isPrimary')" prop="is_primary">
        <el-switch v-model="formData.is_primary" />
      </el-form-item>

      <el-form-item :label="t('customer.contact.notes')" prop="notes">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          :placeholder="t('common.form.inputPlaceholder')"
        />
      </el-form-item>

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

<style scoped>
.contact-person-form {
  max-width: 600px;
  margin: 0 auto;
}
</style>

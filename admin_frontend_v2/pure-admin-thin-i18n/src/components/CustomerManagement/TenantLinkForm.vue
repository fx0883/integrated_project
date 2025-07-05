<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useTenantStore } from "@/store/modules/tenant";
import type { FormInstance, FormRules } from "element-plus";
import type {
  CustomerTenantLink,
  CustomerTenantLinkCreateParams
} from "@/types/customer";
import type { Tenant } from "@/types/tenant";

const { t } = useI18n();
const tenantStore = useTenantStore();

const props = defineProps<{
  tenantLink?: CustomerTenantLink;
  loading?: boolean;
  mode: "create" | "edit";
  customerId?: number;
}>();

const emit = defineEmits<{
  (e: "submit", formData: CustomerTenantLinkCreateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<CustomerTenantLinkCreateParams>({
  customer_id: props.customerId,
  tenant_id: props.tenantLink?.tenant_id,
  relationship_type: props.tenantLink?.relationship_type || "customer",
  start_date: props.tenantLink?.start_date
    ? new Date(props.tenantLink.start_date)
    : new Date(),
  end_date: props.tenantLink?.end_date
    ? new Date(props.tenantLink.end_date)
    : null,
  is_active: props.tenantLink?.is_active ?? true,
  notes: props.tenantLink?.notes || ""
});

// 监听props变化，更新表单数据
watch(
  () => props.tenantLink,
  newVal => {
    if (newVal) {
      formData.customer_id = props.customerId || newVal.customer_id;
      formData.tenant_id = newVal.tenant_id;
      formData.relationship_type = newVal.relationship_type;
      formData.start_date = newVal.start_date
        ? new Date(newVal.start_date)
        : new Date();
      formData.end_date = newVal.end_date ? new Date(newVal.end_date) : null;
      formData.is_active = newVal.is_active;
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
  tenant_id: [
    { required: true, message: t("common.form.required"), trigger: "change" }
  ],
  relationship_type: [
    { required: true, message: t("common.form.required"), trigger: "change" }
  ],
  start_date: [
    { required: true, message: t("common.form.required"), trigger: "change" }
  ]
});

// 关系类型选项
const relationshipTypeOptions = [
  {
    value: "customer",
    label: t("customer.tenantLink.typeCustomer")
  },
  {
    value: "partner",
    label: t("customer.tenantLink.typePartner")
  },
  {
    value: "vendor",
    label: t("customer.tenantLink.typeVendor")
  },
  {
    value: "affiliate",
    label: t("customer.tenantLink.typeAffiliate")
  }
];

// 租户列表
const tenants = ref<Tenant[]>([]);

// 加载租户列表
const loadTenants = async () => {
  try {
    await tenantStore.getTenants({
      page: 1,
      limit: 100,
      status: "active"
    });
    tenants.value = tenantStore.tenantsList;
  } catch (error) {
    console.error("Failed to load tenants:", error);
  }
};

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

// 组件挂载时加载租户列表
onMounted(() => {
  loadTenants();
});
</script>

<template>
  <div class="tenant-link-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="loading"
    >
      <el-form-item :label="t('customer.tenantLink.tenant')" prop="tenant_id">
        <el-select v-model="formData.tenant_id" class="w-full" filterable>
          <el-option
            v-for="tenant in tenants"
            :key="tenant.id"
            :label="tenant.name"
            :value="tenant.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        :label="t('customer.tenantLink.relationshipType')"
        prop="relationship_type"
      >
        <el-select v-model="formData.relationship_type" class="w-full">
          <el-option
            v-for="item in relationshipTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        :label="t('customer.tenantLink.startDate')"
        prop="start_date"
      >
        <el-date-picker
          v-model="formData.start_date"
          type="date"
          :placeholder="t('common.form.selectDate')"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="t('customer.tenantLink.endDate')" prop="end_date">
        <el-date-picker
          v-model="formData.end_date"
          type="date"
          :placeholder="t('common.form.selectDate')"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item :label="t('customer.tenantLink.isActive')" prop="is_active">
        <el-switch v-model="formData.is_active" />
      </el-form-item>

      <el-form-item :label="t('customer.tenantLink.notes')" prop="notes">
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
.tenant-link-form {
  max-width: 600px;
  margin: 0 auto;
}

.w-full {
  width: 100%;
}
</style>

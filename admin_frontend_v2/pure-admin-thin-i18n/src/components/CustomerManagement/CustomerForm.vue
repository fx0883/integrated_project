<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  Customer,
  CustomerCreateUpdateParams,
  CustomerType,
  CustomerValueLevel,
  CustomerStatus
} from "@/types/customer";

const { t } = useI18n();

const props = defineProps<{
  customer?: Customer;
  loading?: boolean;
  mode: "create" | "edit" | "view";
}>();

const emit = defineEmits<{
  (e: "submit", formData: CustomerCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<CustomerCreateUpdateParams>({
  name: props.customer?.name || "",
  type: props.customer?.type || "enterprise",
  value_level: props.customer?.value_level || "silver",
  status: props.customer?.status || "active",
  industry: props.customer?.industry || "",
  registration_number: props.customer?.registration_number || "",
  tax_id: props.customer?.tax_id || "",
  address: props.customer?.address || "",
  city: props.customer?.city || "",
  province: props.customer?.province || "",
  postal_code: props.customer?.postal_code || "",
  country: props.customer?.country || "",
  website: props.customer?.website || "",
  description: props.customer?.description || "",
  annual_revenue: props.customer?.annual_revenue || undefined,
  employee_count: props.customer?.employee_count || undefined,
  founded_year: props.customer?.founded_year || undefined
});

// 监听props变化，更新表单数据
watch(
  () => props.customer,
  newVal => {
    if (newVal) {
      formData.name = newVal.name;
      formData.type = newVal.type;
      formData.value_level = newVal.value_level;
      formData.status = newVal.status;
      formData.industry = newVal.industry;
      formData.registration_number = newVal.registration_number || "";
      formData.tax_id = newVal.tax_id || "";
      formData.address = newVal.address || "";
      formData.city = newVal.city || "";
      formData.province = newVal.province || "";
      formData.postal_code = newVal.postal_code || "";
      formData.country = newVal.country || "";
      formData.website = newVal.website || "";
      formData.description = newVal.description || "";
      formData.annual_revenue = newVal.annual_revenue;
      formData.employee_count = newVal.employee_count;
      formData.founded_year = newVal.founded_year;
    }
  }
);

// 表单验证规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: t("common.form.required"), trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: t("common.form.lengthLimit", { min: 2, max: 100 }),
      trigger: "blur"
    }
  ],
  type: [
    { required: true, message: t("common.form.required"), trigger: "change" }
  ],
  industry: [
    {
      max: 100,
      message: t("common.form.lengthLimit", { min: 0, max: 100 }),
      trigger: "blur"
    }
  ],
  website: [
    {
      pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      message: t("common.form.invalidFormat"),
      trigger: "blur"
    }
  ],
  annual_revenue: [
    {
      type: "number",
      message: t("common.form.numberRequired"),
      trigger: "blur"
    }
  ],
  employee_count: [
    {
      type: "number",
      message: t("common.form.numberRequired"),
      trigger: "blur"
    }
  ],
  founded_year: [
    {
      type: "number",
      message: t("common.form.numberRequired"),
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        if (value && (value < 1800 || value > new Date().getFullYear())) {
          callback(new Error(t("common.form.invalidYearRange")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});

// 客户类型选项
const typeOptions = [
  {
    value: "enterprise",
    label: t("customer.typeEnterprise")
  },
  {
    value: "government",
    label: t("customer.typeGovernment")
  },
  {
    value: "education",
    label: t("customer.typeEducation")
  },
  {
    value: "nonprofit",
    label: t("customer.typeNonprofit")
  },
  {
    value: "individual",
    label: t("customer.typeIndividual")
  }
];

// 客户价值等级选项
const valueLevelOptions = [
  {
    value: "platinum",
    label: t("customer.valuePlatinum")
  },
  {
    value: "gold",
    label: t("customer.valueGold")
  },
  {
    value: "silver",
    label: t("customer.valueSilver")
  },
  {
    value: "bronze",
    label: t("customer.valueBronze")
  }
];

// 客户状态选项
const statusOptions = [
  {
    value: "active",
    label: t("customer.statusActive")
  },
  {
    value: "inactive",
    label: t("customer.statusInactive")
  },
  {
    value: "prospect",
    label: t("customer.statusProspect")
  },
  {
    value: "churned",
    label: t("customer.statusChurned")
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

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 是否显示企业特有字段
const showEnterpriseFields = computed(() => {
  return formData.type === "enterprise" || formData.type === "government";
});

// 当前活动标签页
const activeTab = ref("basic");

// 是否为查看模式（只读）
const isViewMode = computed(() => props.mode === "view");
</script>

<template>
  <div class="customer-form">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane :label="t('customer.basicInfo')" name="basic">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="right"
          label-width="120px"
          :disabled="loading || isViewMode"
          class="form-with-label-margin"
        >
          <el-form-item :label="t('customer.name')" prop="name">
            <el-input
              v-model="formData.name"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('customer.type')" prop="type">
            <el-select v-model="formData.type" class="w-full">
              <el-option
                v-for="item in typeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('customer.valueLevel')" prop="value_level">
            <el-select v-model="formData.value_level" class="w-full">
              <el-option
                v-for="item in valueLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('customer.status')" prop="status">
            <el-select v-model="formData.status" class="w-full">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('customer.industry')" prop="industry">
            <el-input
              v-model="formData.industry"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <template v-if="showEnterpriseFields">
            <el-form-item
              :label="t('customer.registrationNumber')"
              prop="registration_number"
            >
              <el-input
                v-model="formData.registration_number"
                :placeholder="t('common.form.inputPlaceholder')"
              />
            </el-form-item>

            <el-form-item :label="t('customer.taxId')" prop="tax_id">
              <el-input
                v-model="formData.tax_id"
                :placeholder="t('common.form.inputPlaceholder')"
              />
            </el-form-item>
          </template>
        </el-form>
      </el-tab-pane>

      <el-tab-pane :label="t('customer.contactInfo')" name="contact">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="right"
          label-width="120px"
          :disabled="loading || isViewMode"
          class="form-with-label-margin"
        >
          <el-form-item :label="t('customer.address')" prop="address">
            <el-input
              v-model="formData.address"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('customer.city')" prop="city">
            <el-input
              v-model="formData.city"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('customer.province')" prop="province">
            <el-input
              v-model="formData.province"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('customer.postalCode')" prop="postal_code">
            <el-input
              v-model="formData.postal_code"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('customer.country')" prop="country">
            <el-input
              v-model="formData.country"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('customer.website')" prop="website">
            <el-input
              v-model="formData.website"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane :label="t('customer.additionalInfo')" name="additional">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="right"
          label-width="120px"
          :disabled="loading || isViewMode"
          class="form-with-label-margin"
        >
          <el-form-item :label="t('customer.description')" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('customer.annualRevenue')"
            prop="annual_revenue"
          >
            <el-input-number
              v-model="formData.annual_revenue"
              :min="0"
              :precision="2"
              :step="10000"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item
            :label="t('customer.employeeCount')"
            prop="employee_count"
          >
            <el-input-number
              v-model="formData.employee_count"
              :min="0"
              :precision="0"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item :label="t('customer.foundedYear')" prop="founded_year">
            <el-input-number
              v-model="formData.founded_year"
              :min="1800"
              :max="new Date().getFullYear()"
              :precision="0"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div class="form-actions">
      <el-button @click="handleCancel">{{ t("common.cancel") }}</el-button>
      <el-button
        v-if="!isViewMode"
        type="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ t(mode === "create" ? "common.create" : "common.update") }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.customer-form {
  max-width: 800px;
  margin: 0 auto;
}

.w-full {
  width: 100%;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.form-actions .el-button {
  margin-left: 10px;
}

.form-with-label-margin :deep(.el-form-item__label) {
  padding-right: 24px;
}
</style>

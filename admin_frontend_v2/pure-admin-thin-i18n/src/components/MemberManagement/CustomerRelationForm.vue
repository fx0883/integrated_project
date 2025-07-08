<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="disabled"
  >
    <el-form-item :label="$t('member.customer')" prop="customer_id">
      <el-select
        v-model="form.customer_id"
        :placeholder="$t('member.customerPlaceholder')"
        style="width: 100%"
        filterable
        :loading="customerLoading"
        :disabled="isEdit"
      >
        <el-option
          v-for="item in customerOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item :label="$t('member.role')" prop="role">
      <el-input
        v-model="form.role"
        :placeholder="$t('member.rolePlaceholder')"
      />
    </el-form-item>

    <el-form-item :label="$t('member.isPrimaryCustomer')" prop="is_primary">
      <el-switch v-model="form.is_primary" />
    </el-form-item>

    <el-form-item :label="$t('member.notes')" prop="remarks">
      <el-input
        v-model="form.remarks"
        type="textarea"
        :rows="3"
        :placeholder="$t('member.relationNotesPlaceholder')"
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
import { ref, reactive, PropType, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams
} from "@/types/member";
import { ElMessage } from "element-plus";
import { useCustomerStoreHook } from "@/store/modules/customer";
import logger from "@/utils/logger";

const { t } = useI18n();
const customerStore = useCustomerStoreHook();

const props = defineProps({
  // 会员ID
  memberId: {
    type: Number,
    required: true
  },
  // 关系数据
  relationData: {
    type: Object as PropType<MemberCustomerRelation | null>,
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
  }
});

const emit = defineEmits<{
  (e: "submit", data: MemberCustomerRelationCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 提交加载状态
const submitLoading = ref(false);

// 客户加载状态
const customerLoading = ref(false);

// 客户选项
const customerOptions = ref<Array<{ value: number; label: string }>>([]);

// 表单数据
const form = reactive({
  customer_id: undefined as number | undefined,
  role: "",
  is_primary: false,
  remarks: ""
});

// 表单验证规则
const rules = reactive<FormRules>({
  customer_id: [
    { required: true, message: t("member.customerRequired"), trigger: "change" }
  ],
  role: [
    { required: true, message: t("member.roleRequired"), trigger: "blur" },
    { max: 50, message: t("member.roleLength"), trigger: "blur" }
  ],
  remarks: [{ max: 500, message: t("member.notesLength"), trigger: "blur" }]
});

// 初始化表单数据
const initFormData = () => {
  if (props.relationData) {
    form.customer_id = props.relationData.customer?.id;
    form.role = props.relationData.role || "";
    form.is_primary = props.relationData.is_primary || false;
    form.remarks = props.relationData.remarks || "";

    // 如果有客户信息，添加到客户选项中
    if (props.relationData.customer) {
      customerOptions.value = [
        {
          value: props.relationData.customer.id,
          label: props.relationData.customer.name
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
  form.customer_id = undefined;
  form.role = "";
  form.is_primary = false;
  form.remarks = "";
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    // 构建提交数据
    const submitData: MemberCustomerRelationCreateUpdateParams = {
      member_id: props.memberId,
      customer_id: form.customer_id as number,
      role: form.role
    };

    // 可选字段
    if (form.is_primary) submitData.is_primary = form.is_primary;
    if (form.remarks) submitData.remarks = form.remarks;

    // 触发提交事件
    emit("submit", submitData);
  } catch (error) {
    logger.error("表单验证失败", error);
    ElMessage.error(t("common.formValidationFailed"));
  } finally {
    submitLoading.value = false;
  }
};

// 加载所有客户
const loadAllCustomers = async () => {
  customerLoading.value = true;
  try {
    await customerStore.fetchCustomerList({
      page: 1,
      page_size: 100
    });
    customerOptions.value = customerStore.getCustomers.map(customer => ({
      value: customer.id,
      label: customer.name
    }));
  } catch (error) {
    logger.error("加载客户列表失败", error);
  } finally {
    customerLoading.value = false;
  }
};

// 初始化
onMounted(() => {
  initFormData();
  loadAllCustomers(); // 加载所有客户
});
</script>

<style scoped>
.el-form {
  max-width: 100%;
}
</style>

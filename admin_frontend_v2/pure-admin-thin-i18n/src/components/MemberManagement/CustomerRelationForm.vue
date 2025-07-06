<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="disabled"
    v-loading="loading"
  >
    <el-form-item :label="$t('member.customer')" prop="customer_id">
      <el-select
        v-model="form.customer_id"
        :placeholder="$t('member.customerPlaceholder')"
        style="width: 100%"
        filterable
        remote
        :remote-method="remoteCustomerSearch"
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

    <el-form-item :label="$t('member.department')" prop="department">
      <el-input
        v-model="form.department"
        :placeholder="$t('member.departmentPlaceholder')"
      />
    </el-form-item>

    <el-form-item :label="$t('member.isPrimaryCustomer')" prop="is_primary">
      <el-switch v-model="form.is_primary" />
    </el-form-item>

    <el-form-item :label="$t('member.notes')" prop="notes">
      <el-input
        v-model="form.notes"
        type="textarea"
        :rows="3"
        :placeholder="$t('member.relationNotesPlaceholder')"
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
  department: "",
  is_primary: false,
  notes: ""
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
  department: [
    { max: 100, message: t("member.departmentLength"), trigger: "blur" }
  ],
  notes: [{ max: 500, message: t("member.notesLength"), trigger: "blur" }]
});

// 初始化表单数据
const initFormData = () => {
  if (props.relationData) {
    form.customer_id = props.relationData.customer?.id;
    form.role = props.relationData.role || "";
    form.department = props.relationData.department || "";
    form.is_primary = props.relationData.is_primary || false;
    form.notes = props.relationData.notes || "";

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
  form.department = "";
  form.is_primary = false;
  form.notes = "";
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
    if (form.department) submitData.department = form.department;
    if (form.is_primary) submitData.is_primary = form.is_primary;
    if (form.notes) submitData.notes = form.notes;

    // 触发提交事件
    emit("submit", submitData);
  } catch (error) {
    logger.error("表单验证失败", error);
    ElMessage.error(t("common.formValidationFailed"));
  } finally {
    submitLoading.value = false;
  }
};

// 远程搜索客户
const remoteCustomerSearch = async (query: string) => {
  if (query) {
    customerLoading.value = true;
    try {
      await customerStore.fetchCustomerList({
        search: query,
        page: 1,
        limit: 10
      });
      customerOptions.value = customerStore.getCustomers.map(customer => ({
        value: customer.id,
        label: customer.name
      }));
    } catch (error) {
      logger.error("搜索客户失败", error);
    } finally {
      customerLoading.value = false;
    }
  } else {
    customerOptions.value = [];
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

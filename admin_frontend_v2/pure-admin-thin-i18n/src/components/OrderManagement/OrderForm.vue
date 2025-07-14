<script lang="ts" setup>
import { ref, reactive, defineProps, defineEmits, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  Order,
  OrderCreateUpdateParams,
  PaymentStatus,
  InvoiceStatus,
  ServiceType
} from "@/types/order";
import { useCustomerStore } from "@/store/modules/customer";

const { t } = useI18n();
const customerStore = useCustomerStore();

const props = defineProps<{
  order?: Order;
  loading?: boolean;
  mode: "create" | "edit" | "view";
}>();

const emit = defineEmits<{
  (e: "submit", formData: OrderCreateUpdateParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<OrderCreateUpdateParams>({
  customer: props.order?.customer || undefined,
  source_platform: props.order?.source_platform || "",
  project_manager: props.order?.project_manager || "",
  customer_type: props.order?.customer_type || "",
  order_date: props.order?.order_date || "",
  service_type: props.order?.service_type || "文档翻译",
  language: props.order?.language || "",
  customer_count: props.order?.customer_count || "",
  translation_count: props.order?.translation_count || "",
  service_time: props.order?.service_time || "",
  project_location: props.order?.project_location || "",
  customer_contact: props.order?.customer_contact || undefined,
  translator: props.order?.translator || "",
  customer_price: props.order?.customer_price || "",
  customer_total_amount: props.order?.customer_total_amount || "",
  translator_fee: props.order?.translator_fee || "",
  translator_price: props.order?.translator_price || "",
  translator_payment_status: props.order?.translator_payment_status || "",
  translator_payment_method: props.order?.translator_payment_method || "",
  project_fee: props.order?.project_fee || "",
  project_details: props.order?.project_details || "",
  cost_details: props.order?.cost_details || "",
  refund_amount: props.order?.refund_amount || "",
  refund_reason: props.order?.refund_reason || "",
  payment_status: props.order?.payment_status || "unpaid",
  payment_date: props.order?.payment_date || "",
  payment_method: props.order?.payment_method || "",
  payment_remarks: props.order?.payment_remarks || "",
  invoice_status: props.order?.invoice_status || "pending",
  invoice_info: props.order?.invoice_info || "",
  contract_number: props.order?.contract_number || "",
  contract_info: props.order?.contract_info || "",
  contract_remarks: props.order?.contract_remarks || "",
  delivery_address: props.order?.delivery_address || "",
  order_address: props.order?.order_address || "",
  remarks: props.order?.remarks || "",
  follow_up_record: props.order?.follow_up_record || ""
});

// 加载客户列表
const loadCustomerList = async () => {
  try {
    await customerStore.fetchCustomerList();
    customerList.value = customerStore.getCustomers.map(customer => ({
      value: customer.id,
      label: customer.name
    }));

    // 客户列表加载完成后，尝试匹配当前订单的客户
    if (props.order && props.order.customer) {
      findAndSetCustomer(props.order.customer);
    }
  } catch (error) {
    console.error("加载客户列表失败", error);
  }
};

// 根据客户ID查找并设置客户
const findAndSetCustomer = customerId => {
  // 如果customerId是对象，提取ID
  const id =
    typeof customerId === "object" && customerId !== null
      ? customerId.id
      : customerId;

  // 查找客户列表中是否有匹配项
  const customerItem = customerList.value.find(item => item.value === id);

  if (customerItem) {
    // 找到匹配项，设置客户
    formData.customer = customerItem.value;

    // 同时加载该客户的联系人
    loadCustomerContactPersons(customerItem.value);
  } else {
    // 没找到匹配项，使用ID作为值
    formData.customer = id;
    console.warn(`未在客户列表中找到ID为${id}的客户`);

    // 尝试加载联系人
    loadCustomerContactPersons(id);
  }
};

// 加载客户联系人列表
const loadCustomerContactPersons = async customerId => {
  if (!customerId) {
    contactPersonList.value = [];
    return;
  }

  try {
    // 确保传入的是ID值而不是对象
    const id = typeof customerId === "object" ? customerId.id : customerId;

    console.log(`正在加载客户 ${id} 的联系人`);
    await customerStore.fetchCustomerMemberRelations(id);

    // 修改联系人数据映射，使用会员ID而不是关系ID
    contactPersonList.value = customerStore.getMemberRelations.map(relation => {
      // 调试显示完整的关系数据
      console.log("联系人关系数据:", JSON.stringify(relation));

      // 确保会员数据存在
      if (!relation.member) {
        console.warn(`关系缺少会员数据:`, relation);
        return {
          value: relation.id, // 如果没有会员数据，退回使用关系ID
          label: `未知联系人 ${relation.id}`
        };
      }

      // 使用会员ID，而不是关系ID
      return {
        value: relation.member.id, // 会员ID
        label:
          relation.member.name ||
          relation.member.email ||
          `联系人 ${relation.member.id}`
      };
    });

    console.log(
      `加载了 ${contactPersonList.value.length} 个联系人，详细数据:`,
      JSON.stringify(contactPersonList.value)
    );

    // 只有在编辑模式下，且是首次加载时，才尝试匹配联系人
    if (props.mode === "edit" && props.order && props.order.customer_contact) {
      console.log(
        `准备选中联系人ID: ${props.order.customer_contact}, 类型: ${typeof props.order.customer_contact}`
      );
      findAndSetContact(props.order.customer_contact);
    }
  } catch (error) {
    console.error("加载客户联系人失败", error);
    contactPersonList.value = [];
  }
};

// 根据联系人ID查找并设置联系人
const findAndSetContact = contactId => {
  // 如果contactId是对象，提取ID
  const id =
    typeof contactId === "object" && contactId !== null
      ? contactId.id
      : contactId;

  // 确保ID是数字类型，便于比较
  const numericId = Number(id);

  console.log(`尝试查找联系人ID: ${numericId}, 类型: ${typeof numericId}`);
  console.log(`当前联系人列表:`, JSON.stringify(contactPersonList.value));

  // 查找联系人列表中是否有匹配项
  const contactItem = contactPersonList.value.find(
    item => Number(item.value) === numericId
  );

  if (contactItem) {
    // 找到匹配项，设置联系人
    formData.customer_contact = contactItem.value;
    console.log(
      `成功选中联系人: ${contactItem.label} (ID: ${contactItem.value})`
    );
  }
  // else {
  //   // 没找到匹配项，使用ID作为值
  //   formData.customer_contact = numericId; // 使用数字类型ID
  //   console.warn(`未在联系人列表中找到ID为${numericId}的联系人`);
  // }
};

// 监听客户变化，加载对应的联系人
watch(
  () => formData.customer,
  async newCustomerId => {
    if (newCustomerId) {
      // 清空之前选择的联系人，不再尝试恢复选择
      formData.customer_contact = undefined;
      // 加载新客户的联系人列表
      await loadCustomerContactPersons(newCustomerId);
    } else {
      contactPersonList.value = [];
    }
  }
);

// 处理客户数据，确保是ID类型
const processCustomerData = () => {
  // 检查customer是否为对象类型
  if (typeof formData.customer === "object" && formData.customer !== null) {
    // 如果是对象，提取ID并查找匹配项
    findAndSetCustomer(formData.customer);
  } else if (formData.customer) {
    // 如果是ID，也尝试查找匹配项
    findAndSetCustomer(formData.customer);
  }

  // 检查customer_contact是否为对象类型
  if (
    typeof formData.customer_contact === "object" &&
    formData.customer_contact !== null
  ) {
    // 如果是对象，提取ID
    formData.customer_contact = (formData.customer_contact as any).id;
  }
};

// 监听props变化，更新表单数据
watch(
  () => props.order,
  newVal => {
    if (newVal) {
      formData.customer = newVal.customer;
      formData.source_platform = newVal.source_platform || "";
      formData.project_manager = newVal.project_manager || "";
      formData.customer_type = newVal.customer_type || "";
      formData.order_date = newVal.order_date || "";
      formData.service_type = newVal.service_type;
      formData.language = newVal.language;
      formData.customer_count = newVal.customer_count;
      formData.translation_count = newVal.translation_count || "";
      formData.service_time = newVal.service_time || "";
      formData.project_location = newVal.project_location || "";
      formData.customer_contact = newVal.customer_contact;
      formData.translator = newVal.translator || "";
      formData.customer_price = newVal.customer_price || "";
      formData.customer_total_amount = newVal.customer_total_amount;
      formData.translator_fee = newVal.translator_fee || "";
      formData.translator_price = newVal.translator_price || "";
      formData.translator_payment_status =
        newVal.translator_payment_status || "";
      formData.translator_payment_method =
        newVal.translator_payment_method || "";
      formData.project_fee = newVal.project_fee || "";
      formData.project_details = newVal.project_details || "";
      formData.cost_details = newVal.cost_details || "";
      formData.refund_amount = newVal.refund_amount || "";
      formData.refund_reason = newVal.refund_reason || "";
      formData.payment_status = newVal.payment_status;
      formData.payment_date = newVal.payment_date || "";
      formData.payment_method = newVal.payment_method || "";
      formData.payment_remarks = newVal.payment_remarks || "";
      formData.invoice_status = newVal.invoice_status || "pending";
      formData.invoice_info = newVal.invoice_info || "";
      formData.contract_number = newVal.contract_number || "";
      formData.contract_info = newVal.contract_info || "";
      formData.contract_remarks = newVal.contract_remarks || "";
      formData.delivery_address = newVal.delivery_address || "";
      formData.order_address = newVal.order_address || "";
      formData.remarks = newVal.remarks || "";
      formData.follow_up_record = newVal.follow_up_record || "";

      console.log(`设置联系人ID: ${formData.customer_contact}`);

      // 处理客户和联系人数据
      processCustomerData();

      // 如果有客户ID，加载联系人数据
      if (formData.customer) {
        loadCustomerContactPersons(formData.customer);
      }
    }
  }
);

// 表单验证规则
const rules = reactive<FormRules>({
  customer: [
    { required: true, message: t("common.form.required"), trigger: "change" }
  ],
  service_type: [
    { required: true, message: t("common.form.required"), trigger: "change" }
  ],
  language: [
    { required: true, message: t("common.form.required"), trigger: "blur" }
  ],
  customer_count: [
    { required: true, message: t("common.form.required"), trigger: "blur" }
  ],
  customer_total_amount: [
    { required: true, message: t("common.form.required"), trigger: "blur" }
  ],
  payment_status: [
    { required: true, message: t("common.form.required"), trigger: "change" }
  ]
});

// 服务类型选项
const serviceTypeOptions = [
  {
    value: "文档翻译",
    label: t("order.serviceTypeDocument")
  },
  {
    value: "口译服务",
    label: t("order.serviceTypeInterpretation")
  },
  {
    value: "校对服务",
    label: t("order.serviceTypeProofreading")
  },
  {
    value: "本地化服务",
    label: t("order.serviceTypeLocalization")
  },
  {
    value: "其他",
    label: t("order.serviceTypeOther")
  }
];

// 支付状态选项
const paymentStatusOptions = [
  {
    value: "paid",
    label: t("order.paymentStatusPaid")
  },
  {
    value: "unpaid",
    label: t("order.paymentStatusUnpaid")
  },
  {
    value: "partial",
    label: t("order.paymentStatusPartial")
  },
  {
    value: "refunded",
    label: t("order.paymentStatusRefunded")
  },
  {
    value: "cancelled",
    label: t("order.paymentStatusCancelled")
  }
];

// 发票状态选项
const invoiceStatusOptions = [
  {
    value: "issued",
    label: t("order.invoiceStatusIssued")
  },
  {
    value: "pending",
    label: t("order.invoiceStatusPending")
  },
  {
    value: "not_required",
    label: t("order.invoiceStatusNotRequired")
  }
];

// 客户列表
const customerList = ref([]);

// 客户联系人列表
const contactPersonList = ref([]);

// 初始化加载客户列表
loadCustomerList();

// 如果有初始客户ID，加载该客户的联系人
if (formData.customer) {
  loadCustomerContactPersons(formData.customer);
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid, fields) => {
    if (valid) {
      // 创建表单数据的副本
      const formDataToSubmit = { ...formData };

      // 确保customer是ID值而不是对象
      if (
        formDataToSubmit.customer &&
        typeof formDataToSubmit.customer === "object" &&
        formDataToSubmit.customer !== null
      ) {
        formDataToSubmit.customer = (formDataToSubmit.customer as any).id;
      }

      // 确保customer_contact是ID值而不是对象
      if (
        formDataToSubmit.customer_contact &&
        typeof formDataToSubmit.customer_contact === "object" &&
        formDataToSubmit.customer_contact !== null
      ) {
        formDataToSubmit.customer_contact = (
          formDataToSubmit.customer_contact as any
        ).id;
      }

      // 过滤掉空值和空字符串字段
      const cleanedFormData = Object.entries(formDataToSubmit).reduce(
        (result, [key, value]) => {
          // 如果值不是空、undefined或空字符串，则保留该字段
          if (value !== null && value !== undefined && value !== "") {
            result[key] = value;
          }
          return result;
        },
        {} as Record<string, any>
      );

      // 记录处理后的表单数据
      console.log("提交订单数据:", JSON.stringify(cleanedFormData));

      // 提交表单数据
      emit("submit", cleanedFormData as OrderCreateUpdateParams);
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

// 当前活动标签页
const activeTab = ref("basic");

// 是否为查看模式（只读）
const isViewMode = computed(() => props.mode === "view");

// 计算毛利率
const calculateProfit = () => {
  const customerTotal = parseFloat(formData.customer_total_amount || "0");
  const translatorFee = parseFloat(formData.translator_fee || "0");
  const projectFee = parseFloat(formData.project_fee || "0");

  const profit = customerTotal - translatorFee - projectFee;
  const profitRate = customerTotal > 0 ? profit / customerTotal : 0;

  return {
    profit: profit.toFixed(2),
    profitRate: (profitRate * 100).toFixed(2) + "%"
  };
};
</script>

<template>
  <div class="order-form">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane :label="t('order.basicInfo')" name="basic">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="right"
          label-width="120px"
          :disabled="loading || isViewMode"
          class="form-with-label-margin"
        >
          <el-form-item :label="t('order.customer')" prop="customer">
            <el-select
              v-model="formData.customer"
              filterable
              class="w-full"
              :placeholder="t('order.selectCustomer')"
            >
              <el-option
                v-for="item in customerList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item
            :label="t('order.customerContact')"
            prop="customer_contact"
          >
            <el-select
              v-model="formData.customer_contact"
              filterable
              class="w-full"
              :placeholder="t('order.selectContact')"
              :disabled="!formData.customer"
            >
              <el-option
                v-for="item in contactPersonList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('order.customerType')" prop="customer_type">
            <el-input
              v-model="formData.customer_type"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.orderDate')" prop="order_date">
            <el-date-picker
              v-model="formData.order_date"
              type="date"
              :placeholder="t('common.form.datePlaceholder')"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item :label="t('order.serviceType')" prop="service_type">
            <el-select v-model="formData.service_type" class="w-full">
              <el-option
                v-for="item in serviceTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('order.language')" prop="language">
            <el-input
              v-model="formData.language"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.customerCount')" prop="customer_count">
            <el-input
              v-model="formData.customer_count"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.translationCount')"
            prop="translation_count"
          >
            <el-input
              v-model="formData.translation_count"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.serviceTime')" prop="service_time">
            <el-date-picker
              v-model="formData.service_time"
              type="date"
              :placeholder="t('common.form.datePlaceholder')"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.projectLocation')"
            prop="project_location"
          >
            <el-input
              v-model="formData.project_location"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane :label="t('order.priceAndPayment')" name="payment">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="right"
          label-width="150px"
          :disabled="loading || isViewMode"
          class="form-with-label-margin"
        >
          <el-form-item :label="t('order.translator')" prop="translator">
            <el-input
              v-model="formData.translator"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.customerPrice')" prop="customer_price">
            <el-input
              v-model="formData.customer_price"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.customerTotalAmount')"
            prop="customer_total_amount"
          >
            <el-input
              v-model="formData.customer_total_amount"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.translatorPrice')"
            prop="translator_price"
          >
            <el-input
              v-model="formData.translator_price"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.translatorFee')" prop="translator_fee">
            <el-input
              v-model="formData.translator_fee"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.translatorPaymentStatus')"
            prop="translator_payment_status"
          >
            <el-input
              v-model="formData.translator_payment_status"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.translatorPaymentMethod')"
            prop="translator_payment_method"
          >
            <el-input
              v-model="formData.translator_payment_method"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.projectFee')" prop="project_fee">
            <el-input
              v-model="formData.project_fee"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-divider>{{ t("order.profitInfo") }}</el-divider>

          <div class="profit-info">
            <div class="profit-item">
              <span class="label">{{ t("order.profit") }}:</span>
              <span class="value">{{ calculateProfit().profit }}</span>
            </div>
            <div class="profit-item">
              <span class="label">{{ t("order.profitRate") }}:</span>
              <span class="value">{{ calculateProfit().profitRate }}</span>
            </div>
          </div>

          <el-divider>{{ t("order.paymentInfo") }}</el-divider>

          <el-form-item :label="t('order.paymentStatus')" prop="payment_status">
            <el-select v-model="formData.payment_status" class="w-full">
              <el-option
                v-for="item in paymentStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('order.paymentDate')" prop="payment_date">
            <el-date-picker
              v-model="formData.payment_date"
              type="date"
              :placeholder="t('common.form.datePlaceholder')"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item :label="t('order.paymentMethod')" prop="payment_method">
            <el-input
              v-model="formData.payment_method"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.paymentRemarks')"
            prop="payment_remarks"
          >
            <el-input
              v-model="formData.payment_remarks"
              type="textarea"
              :rows="2"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane :label="t('order.additionalInfo')" name="additional">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="right"
          label-width="120px"
          :disabled="loading || isViewMode"
          class="form-with-label-margin"
        >
          <el-form-item
            :label="t('order.projectDetails')"
            prop="project_details"
          >
            <el-input
              v-model="formData.project_details"
              type="textarea"
              :rows="3"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.costDetails')" prop="cost_details">
            <el-input
              v-model="formData.cost_details"
              type="textarea"
              :rows="3"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.refundAmount')" prop="refund_amount">
            <el-input
              v-model="formData.refund_amount"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.refundReason')" prop="refund_reason">
            <el-input
              v-model="formData.refund_reason"
              type="textarea"
              :rows="2"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-divider>{{ t("order.invoiceInfo") }}</el-divider>

          <el-form-item :label="t('order.invoiceStatus')" prop="invoice_status">
            <el-select v-model="formData.invoice_status" class="w-full">
              <el-option
                v-for="item in invoiceStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('order.invoiceInfo')" prop="invoice_info">
            <el-input
              v-model="formData.invoice_info"
              type="textarea"
              :rows="2"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-divider>{{ t("order.contractInfo") }}</el-divider>

          <el-form-item
            :label="t('order.contractNumber')"
            prop="contract_number"
          >
            <el-input
              v-model="formData.contract_number"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.contractInfo')" prop="contract_info">
            <el-input
              v-model="formData.contract_info"
              type="textarea"
              :rows="2"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.contractRemarks')"
            prop="contract_remarks"
          >
            <el-input
              v-model="formData.contract_remarks"
              type="textarea"
              :rows="2"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane :label="t('order.remarks')" name="remarks">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="right"
          label-width="120px"
          :disabled="loading || isViewMode"
          class="form-with-label-margin"
        >
          <el-form-item
            :label="t('order.deliveryAddress')"
            prop="delivery_address"
          >
            <el-input
              v-model="formData.delivery_address"
              type="textarea"
              :rows="2"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.orderAddress')" prop="order_address">
            <el-input
              v-model="formData.order_address"
              type="textarea"
              :rows="2"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="t('order.remarks')" prop="remarks">
            <el-input
              v-model="formData.remarks"
              type="textarea"
              :rows="3"
              :placeholder="t('common.form.inputPlaceholder')"
            />
          </el-form-item>

          <el-form-item
            :label="t('order.followUpRecord')"
            prop="follow_up_record"
          >
            <el-input
              v-model="formData.follow_up_record"
              type="textarea"
              :rows="3"
              :placeholder="t('common.form.inputPlaceholder')"
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
        {{ t(props.mode === "create" ? "common.create" : "common.update") }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.order-form {
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

.profit-info {
  padding: 10px 20px;
  margin-bottom: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.profit-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.profit-item .label {
  font-weight: bold;
}

.profit-item .value {
  font-size: 16px;
}
</style>

<script lang="ts" setup>
import { ref, reactive, defineEmits, watch } from "vue";
import { useI18n } from "vue-i18n";
import type {
  OrderListParams,
  ServiceType,
  PaymentStatus
} from "@/types/order";
import { useCustomerStore } from "@/store/modules/customer";

const { t } = useI18n();
const customerStore = useCustomerStore();

const emit = defineEmits<{
  (e: "filter", filters: OrderListParams): void;
  (e: "reset"): void;
}>();

// 筛选表单数据
const filterForm = reactive<OrderListParams>({
  search: "",
  payment_status: undefined,
  service_type: undefined,
  language: "",
  customer_id: undefined,
  start_date: "",
  end_date: ""
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

// 客户列表
const customerList = ref([]);

// 高级筛选面板是否展开
const advancedFilterExpanded = ref(false);

// 加载客户列表
const loadCustomerList = async () => {
  try {
    await customerStore.fetchCustomerList();
    customerList.value = customerStore.getCustomers.map(customer => ({
      value: customer.id,
      label: customer.name
    }));
  } catch (error) {
    console.error("加载客户列表失败", error);
  }
};

// 初始化加载客户列表
loadCustomerList();

// 应用筛选
const applyFilter = () => {
  const filters: OrderListParams = {};

  // 只传递有值的筛选条件
  if (filterForm.search) filters.search = filterForm.search;
  if (filterForm.payment_status)
    filters.payment_status = filterForm.payment_status;
  if (filterForm.service_type) filters.service_type = filterForm.service_type;
  if (filterForm.language) filters.language = filterForm.language;
  if (filterForm.customer_id) filters.customer_id = filterForm.customer_id;
  if (filterForm.start_date) filters.start_date = filterForm.start_date;
  if (filterForm.end_date) filters.end_date = filterForm.end_date;

  emit("filter", filters);
};

// 重置筛选
const resetFilter = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = undefined;
  });
  filterForm.search = "";
  emit("reset");
};

// 切换高级筛选面板
const toggleAdvancedFilter = () => {
  advancedFilterExpanded.value = !advancedFilterExpanded.value;
};

// 搜索框输入时自动应用筛选
let searchDebounceTimer: number | null = null;
watch(
  () => filterForm.search,
  newVal => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = window.setTimeout(() => {
      applyFilter();
      searchDebounceTimer = null;
    }, 500) as unknown as number;
  }
);
</script>

<template>
  <div class="order-filter">
    <div class="basic-filter">
      <el-input
        v-model="filterForm.search"
        :placeholder="t('order.searchPlaceholder')"
        class="search-input"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-input
        v-model="filterForm.payment_status"
        :placeholder="t('order.filterPaymentStatus')"
        clearable
        class="filter-select"
        @change="applyFilter"
      />

      <el-input
        v-model="filterForm.service_type"
        :placeholder="t('order.filterServiceType')"
        clearable
        class="filter-select"
        @change="applyFilter"
      />

      <div class="advanced-toggle" @click="toggleAdvancedFilter">
        {{
          t(
            advancedFilterExpanded
              ? "common.collapseFilter"
              : "common.advancedFilter"
          )
        }}
        <el-icon>
          <ArrowDown v-if="!advancedFilterExpanded" />
          <ArrowUp v-else />
        </el-icon>
      </div>

      <el-button type="primary" @click="applyFilter">
        {{ t("common.filter") }}
      </el-button>

      <el-button @click="resetFilter">{{ t("common.reset") }}</el-button>
    </div>

    <div class="advanced-filter" v-show="advancedFilterExpanded">
      <el-form :model="filterForm" label-width="100px" inline>
        <el-form-item :label="t('order.customer')">
          <el-select
            v-model="filterForm.customer_id"
            filterable
            clearable
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

        <el-form-item :label="t('order.language')">
          <el-input
            v-model="filterForm.language"
            :placeholder="t('order.inputLanguage')"
            clearable
          />
        </el-form-item>

        <el-form-item :label="t('order.serviceTimeRange')">
          <el-date-picker
            v-model="filterForm.start_date"
            type="date"
            :placeholder="t('common.startDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
          <span class="date-separator">-</span>
          <el-date-picker
            v-model="filterForm.end_date"
            type="date"
            :placeholder="t('common.endDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.order-filter {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.basic-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 180px;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #409eff;
  margin-left: auto;
  font-size: 14px;
}

.advanced-toggle .el-icon {
  margin-left: 4px;
}

.advanced-filter {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
}

.date-separator {
  margin: 0 5px;
}
</style>

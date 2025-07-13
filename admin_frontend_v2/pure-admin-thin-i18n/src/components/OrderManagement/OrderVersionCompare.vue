<script lang="ts" setup>
import { ref, defineProps, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import type { Order, OrderHistory } from "@/types/order";

const props = defineProps<{
  orderId: number;
  historyId: number;
}>();

const { t } = useI18n();
const orderStore = useOrderStore();

const loading = ref(false);
const historyVersion = ref<OrderHistory | null>(null);
const currentOrder = ref<Order | null>(null);

// 计算属性: 获取格式化后的历史版本数据
const historyVersionData = computed(() => {
  return historyVersion.value?.snapshot_data || null;
});

// 显示的字段列表
const displayFields = [
  { key: "customer_name", label: "order.customer" },
  { key: "service_type", label: "order.serviceType" },
  { key: "language", label: "order.language" },
  { key: "customer_count", label: "order.customerCount" },
  { key: "customer_total_amount", label: "order.customerTotalAmount" },
  { key: "payment_status", label: "order.paymentStatus" },
  { key: "translator", label: "order.translator" },
  { key: "translator_fee", label: "order.translatorFee" },
  { key: "project_fee", label: "order.projectFee" },
  { key: "project_manager", label: "order.projectManager" },
  { key: "service_time", label: "order.serviceTime" },
  { key: "project_location", label: "order.projectLocation" },
  { key: "payment_method", label: "order.paymentMethod" },
  { key: "payment_date", label: "order.paymentDate" },
  { key: "invoice_status", label: "order.invoiceStatus" },
  { key: "contract_number", label: "order.contractNumber" },
  { key: "remarks", label: "order.remarks" }
];

// 检查字段是否有变更
const isFieldChanged = (field: string) => {
  if (!historyVersionData.value || !currentOrder.value) return false;
  return historyVersionData.value[field] !== currentOrder.value[field];
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    // 加载当前订单
    await orderStore.fetchOrderDetail(props.orderId);
    currentOrder.value = orderStore.currentOrder;

    // 加载历史版本
    await orderStore.fetchOrderHistoryDetail(props.orderId, props.historyId);
    historyVersion.value = orderStore.currentHistory;
  } catch (error) {
    console.error("Failed to load version data:", error);
    ElMessage.error(t("order.versionLoadFailed"));
  } finally {
    loading.value = false;
  }
};

// 初始加载
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="version-compare" v-loading="loading">
    <div class="compare-header">
      <div class="version-info old-version">
        <h3>{{ t("order.historyVersion") }} #{{ historyVersion?.version }}</h3>
        <p>{{ t("order.modifiedAt") }}: {{ historyVersion?.modified_at }}</p>
        <p>
          {{ t("order.modifiedBy") }}: {{ historyVersion?.modified_by_name }}
        </p>
      </div>
      <div class="version-divider">
        <el-icon><ArrowRight /></el-icon>
      </div>
      <div class="version-info current-version">
        <h3>{{ t("order.currentVersion") }}</h3>
        <p>{{ t("order.modifiedAt") }}: {{ currentOrder?.updated_at }}</p>
        <p>{{ t("order.orderNumber") }}: {{ currentOrder?.order_number }}</p>
      </div>
    </div>

    <div class="compare-content">
      <el-table :data="displayFields" border style="width: 100%">
        <el-table-column :label="t('order.field')" width="150" prop="label">
          <template #default="scope">
            {{ t(scope.row.label) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('order.historyVersion')">
          <template #default="scope">
            <div :class="{ 'changed-value': isFieldChanged(scope.row.key) }">
              {{
                historyVersionData?.[scope.row.key] || t("common.notSpecified")
              }}
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="t('order.currentVersion')">
          <template #default="scope">
            <div :class="{ 'changed-value': isFieldChanged(scope.row.key) }">
              {{ currentOrder?.[scope.row.key] || t("common.notSpecified") }}
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.version-compare {
  padding: 20px;
}

.compare-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.version-info {
  flex: 1;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.version-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.version-info p {
  margin: 5px 0;
}

.version-divider {
  width: 40px;
  text-align: center;
  font-size: 20px;
}

.compare-content {
  margin-top: 20px;
}

.changed-value {
  background-color: #fdf6ec;
  color: #e6a23c;
  padding: 2px 5px;
  border-radius: 3px;
}

.old-version {
  border-left: 4px solid #909399;
}

.current-version {
  border-left: 4px solid #67c23a;
}
</style>

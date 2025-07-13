<script lang="ts" setup>
import { ref, onMounted, defineProps, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import type { OrderHistory } from "@/types/order";

const props = defineProps<{
  orderId: number;
}>();

const { t } = useI18n();
const orderStore = useOrderStore();

const historyList = ref<OrderHistory[]>([]);
const loading = ref(false);
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// 加载所有历史记录用于时间线展示
const loadHistoryList = async () => {
  loading.value = true;
  try {
    await orderStore.fetchOrderHistoryList(props.orderId, {
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize
    });
    historyList.value = orderStore.getOrderHistory;
    pagination.value.total = orderStore.orderHistory.total;
  } catch (error) {
    console.error("Failed to load history:", error);
    ElMessage.error(t("order.historyLoadFailed"));
  } finally {
    loading.value = false;
  }
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  loadHistoryList();
};

// 计算属性：历史记录按时间倒序排列
const sortedHistoryList = computed(() => {
  return [...historyList.value].sort((a, b) => {
    return (
      new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime()
    );
  });
});

// 获取变更类型对应的图标和颜色
const getChangeTypeInfo = (change: OrderHistory) => {
  const action = change.change_details_data?.action;
  switch (action) {
    case "create":
      return { icon: "Plus", type: "success" };
    case "update":
      return { icon: "Edit", type: "primary" };
    case "restore":
      return { icon: "RefreshLeft", type: "warning" };
    default:
      return { icon: "Info", type: "info" };
  }
};

// 初始加载
onMounted(() => {
  loadHistoryList();
});
</script>

<template>
  <div class="order-change-log" v-loading="loading">
    <el-timeline>
      <el-timeline-item
        v-for="item in sortedHistoryList"
        :key="item.id"
        :type="getChangeTypeInfo(item).type"
        :icon="getChangeTypeInfo(item).icon"
        :timestamp="item.modified_at"
      >
        <div class="timeline-content">
          <h4 class="timeline-title">
            {{ t("order.version") }} #{{ item.version }} -
            {{
              item.change_details_data?.action === "create"
                ? t("order.created")
                : item.change_details_data?.action === "restore"
                  ? t("order.restored")
                  : t("order.updated")
            }}
          </h4>
          <p class="timeline-user">
            {{ t("order.by") }} {{ item.modified_by_name }}
          </p>

          <div
            class="changes-container"
            v-if="item.change_details_data?.changes"
          >
            <div
              v-for="(change, field) in item.change_details_data.changes"
              :key="field"
              class="change-item"
            >
              <div class="change-field">{{ t(`order.${field}`) }}:</div>
              <div class="change-values">
                <div class="old-value">
                  <span class="value-label">{{ t("order.from") }}:</span>
                  <span class="value">{{
                    change.old || t("common.notSpecified")
                  }}</span>
                </div>
                <div class="new-value">
                  <span class="value-label">{{ t("order.to") }}:</span>
                  <span class="value">{{
                    change.new || t("common.notSpecified")
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="item.change_details_data?.message"
            class="message-container"
          >
            {{ item.change_details_data.message }}
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>

    <div
      class="pagination-container"
      v-if="pagination.total > pagination.pageSize"
    >
      <el-pagination
        v-model:current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        layout="prev, pager, next"
        :total="pagination.total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.order-change-log {
  padding: 20px;
}

.timeline-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.timeline-title {
  margin: 0 0 5px;
  font-size: 16px;
}

.timeline-user {
  color: #909399;
  font-size: 14px;
  margin: 0 0 10px;
}

.changes-container {
  margin-top: 10px;
}

.change-item {
  margin-bottom: 10px;
  border-left: 2px solid #dcdfe6;
  padding-left: 10px;
}

.change-field {
  font-weight: bold;
  margin-bottom: 5px;
}

.change-values {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.old-value,
.new-value {
  display: flex;
  align-items: baseline;
}

.value-label {
  width: 50px;
  color: #909399;
}

.old-value .value {
  text-decoration: line-through;
  color: #f56c6c;
}

.new-value .value {
  color: #67c23a;
}

.message-container {
  font-style: italic;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>

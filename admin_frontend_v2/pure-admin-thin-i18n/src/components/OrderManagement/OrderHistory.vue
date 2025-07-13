<script lang="ts" setup>
import { ref, onMounted, defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import type { OrderHistory } from "@/types/order";

const props = defineProps<{
  orderId: number;
}>();

const emit = defineEmits<{
  (e: "view-detail", historyId: number): void;
  (e: "compare-versions", historyId: number): void;
  (e: "restore-success"): void;
}>();

const { t } = useI18n();
const orderStore = useOrderStore();

const historyList = ref<OrderHistory[]>([]);
const loading = ref(false);
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 加载历史记录
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

// 查看版本详情
const viewHistoryDetail = (historyId: number) => {
  emit("view-detail", historyId);
};

// 对比版本
const compareVersions = (historyId: number) => {
  emit("compare-versions", historyId);
};

// 恢复版本
const restoreVersion = async (historyId: number) => {
  try {
    await ElMessageBox.confirm(
      t("order.confirmRestoreVersion"),
      t("order.restoreVersion"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );

    await orderStore.restoreOrderToVersion(props.orderId, historyId);
    ElMessage.success(t("order.restoreVersionSuccess"));
    emit("restore-success");
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to restore version:", error);
      ElMessage.error(t("order.restoreVersionFailed"));
    }
  }
};

// 页码变化处理
const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  loadHistoryList();
};

// 页大小变化处理
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  loadHistoryList();
};

// 初始加载
onMounted(() => {
  loadHistoryList();
});
</script>

<template>
  <div class="order-history">
    <el-table
      v-loading="loading"
      :data="historyList"
      style="width: 100%"
      border
    >
      <el-table-column
        prop="version"
        :label="t('order.versionNumber')"
        width="100"
        align="center"
      />
      <el-table-column
        prop="modified_by_name"
        :label="t('order.modifiedBy')"
        width="150"
      />
      <el-table-column
        prop="modified_at"
        :label="t('order.modifiedAt')"
        width="180"
      />
      <el-table-column :label="t('order.changeType')" width="120">
        <template #default="scope">
          {{
            scope.row.change_details_data?.action === "create"
              ? t("order.created")
              : t("order.updated")
          }}
        </template>
      </el-table-column>
      <el-table-column :label="t('order.changeDetails')">
        <template #default="scope">
          <div v-if="scope.row.change_details_data?.message">
            {{ scope.row.change_details_data.message }}
          </div>
          <div v-else-if="scope.row.change_details_data?.changes">
            <span
              v-for="(change, field) in scope.row.change_details_data.changes"
              :key="field"
            >
              {{ t(`order.${field}`) }}:
              <el-tag size="small" type="info">
                {{ change.old || t("common.notSpecified") }}
              </el-tag>
              <el-icon><ArrowRight /></el-icon>
              <el-tag size="small" type="success">
                {{ change.new || t("common.notSpecified") }}
              </el-tag>
              <br />
            </span>
          </div>
          <span v-else>{{ t("order.noChangeDetails") }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="200" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="viewHistoryDetail(scope.row.id)">
            {{ t("common.view") }}
          </el-button>
          <el-button
            size="small"
            type="primary"
            @click="compareVersions(scope.row.id)"
          >
            {{ t("order.compare") }}
          </el-button>
          <el-button
            size="small"
            type="warning"
            @click="restoreVersion(scope.row.id)"
          >
            {{ t("order.restore") }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.order-history {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>

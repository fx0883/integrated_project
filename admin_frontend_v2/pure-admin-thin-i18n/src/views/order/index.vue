<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessageBox, ElMessage } from "element-plus";
import {
  Plus,
  Download,
  Upload,
  DataAnalysis,
  Edit
} from "@element-plus/icons-vue";
import { useOrderStore } from "@/store/modules/order";
import type { Order, OrderListParams } from "@/types/order";
import OrderFilter from "@/components/OrderManagement/OrderFilter.vue";
import OrderStatusTag from "@/components/OrderManagement/OrderStatusTag.vue";
import ConfirmDialog from "@/components/OrderManagement/ConfirmDialog.vue";
import ImportDialog from "@/components/OrderManagement/ImportDialog.vue";
import BatchUpdateDialog from "@/components/OrderManagement/BatchUpdateDialog.vue";

const { t } = useI18n();
const router = useRouter();
const orderStore = useOrderStore();

// 表格数据
const tableData = ref<Order[]>([]);
const loading = ref(true);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 选中的订单
const selectedOrders = ref<Order[]>([]);

// 确认对话框
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as "warning" | "danger" | "info" | "success",
  loading: false
});
const confirmCallback = ref<() => void>(() => {});

// 导入对话框
const importDialogVisible = ref(false);

// 批量更新对话框
const batchUpdateDialogVisible = ref(false);

// 当前筛选参数
const currentFilters = ref<OrderListParams>({});

// 排序字段
const sortColumn = ref("");
const sortOrder = ref("");

// 初始化加载数据
onMounted(async () => {
  await fetchOrders();
});

// 获取订单列表
const fetchOrders = async (page = currentPage.value) => {
  loading.value = true;
  try {
    const params: OrderListParams = {
      ...currentFilters.value,
      page,
      page_size: pageSize.value
    };

    // 添加排序
    if (sortColumn.value && sortOrder.value) {
      params.ordering =
        sortOrder.value === "descending"
          ? `-${sortColumn.value}`
          : sortColumn.value;
    }

    await orderStore.fetchOrderList(params);
    tableData.value = orderStore.getOrders;
    total.value = orderStore.orderList.total;
    currentPage.value = page;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  } finally {
    loading.value = false;
  }
};

// 处理筛选
const handleFilter = (filters: OrderListParams) => {
  currentFilters.value = { ...filters };
  currentPage.value = 1; // 重置到第一页
  fetchOrders(1);
};

// 重置筛选
const handleResetFilter = () => {
  currentFilters.value = {};
  currentPage.value = 1;
  sortColumn.value = "";
  sortOrder.value = "";
  fetchOrders(1);
};

// 处理分页变化
const handlePageChange = (page: number) => {
  fetchOrders(page);
};

// 处理每页数量变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchOrders(1);
};

// 处理排序变化
const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  sortColumn.value = prop;
  sortOrder.value = order;
  fetchOrders();
};

// 处理表格选择变化
const handleSelectionChange = (selection: Order[]) => {
  selectedOrders.value = selection;
};

// 查看订单详情
const viewOrderDetail = (order: Order) => {
  router.push(`/order/detail/${order.id}`);
};

// 编辑订单
const editOrder = (order: Order) => {
  router.push(`/order/edit/${order.id}`);
};

// 删除订单
const deleteOrder = (order: Order) => {
  confirmDialog.title = t("order.deleteConfirmTitle");
  confirmDialog.content = t("order.deleteConfirmContent", {
    number: order.order_number
  });
  confirmDialog.type = "danger";
  confirmDialog.visible = true;
  confirmCallback.value = async () => {
    confirmDialog.loading = true;
    try {
      await orderStore.removeOrder(order.id);
      ElMessage.success(t("order.deleteSuccess"));
      fetchOrders(currentPage.value);
    } catch (error) {
      console.error("Failed to delete order:", error);
    } finally {
      confirmDialog.loading = false;
      confirmDialog.visible = false;
    }
  };
};

// 批量删除订单
const batchDeleteOrders = () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning(t("order.noOrdersSelected"));
    return;
  }

  confirmDialog.title = t("order.batchDeleteConfirmTitle");
  confirmDialog.content = t("order.batchDeleteConfirmContent", {
    count: selectedOrders.value.length
  });
  confirmDialog.type = "danger";
  confirmDialog.visible = true;
  confirmCallback.value = async () => {
    confirmDialog.loading = true;
    try {
      const orderIds = selectedOrders.value.map(order => order.id);
      const response = await orderStore.bulkDeleteOrders(orderIds);

      if (response.success) {
        if (response.data.failed_count === 0) {
          ElMessage.success(t("order.batchDeleteSuccess"));
        } else {
          ElMessage.warning(
            t("order.batchDeletePartial", {
              success: response.data.success_count,
              failed: response.data.failed_count
            })
          );
        }
        selectedOrders.value = [];
        fetchOrders(currentPage.value);
      } else {
        ElMessage.error(response.message || t("order.batchDeleteFailed"));
      }
    } catch (error) {
      console.error("Failed to batch delete orders:", error);
      ElMessage.error(t("order.batchDeleteFailed"));
    } finally {
      confirmDialog.loading = false;
      confirmDialog.visible = false;
    }
  };
};

// 批量更新订单
const batchUpdateOrders = () => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning(t("order.noOrdersSelected"));
    return;
  }

  batchUpdateDialogVisible.value = true;
};

// 处理批量更新成功
const handleBatchUpdateSuccess = () => {
  // 刷新订单列表
  fetchOrders(currentPage.value);
};

// 创建新订单
const createNewOrder = () => {
  router.push("/order/create");
};

// 导出订单
const exportOrders = async () => {
  try {
    loading.value = true;

    // 如果有选中的订单，则只导出选中的订单
    if (selectedOrders.value.length > 0) {
      const orderIds = selectedOrders.value.map(order => order.id);
      await orderStore.exportOrderData({
        ...currentFilters.value,
        ids: orderIds.join(",")
      });
      ElMessage.success(
        t("order.exportSelectedSuccess", { count: selectedOrders.value.length })
      );
    } else {
      // 否则导出当前筛选条件下的所有订单
      await orderStore.exportOrderData(currentFilters.value);
      ElMessage.success(t("order.exportAllSuccess"));
    }
  } catch (error) {
    console.error("Failed to export orders:", error);
    ElMessage.error(t("order.exportFailed"));
  } finally {
    loading.value = false;
  }
};

// 打开导入对话框
const openImportDialog = () => {
  importDialogVisible.value = true;
};

// 处理导入成功
const handleImportSuccess = () => {
  // 刷新订单列表
  fetchOrders(1);
};

// 进入订单统计页面
const goToStatistics = () => {
  router.push("/order/statistics");
};

// 确认操作
const handleConfirm = () => {
  confirmCallback.value();
};

// 取消操作
const handleCancel = () => {
  confirmDialog.visible = false;
};

// 格式化创建时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  return date.toLocaleString();
};
</script>

<template>
  <div class="order-list-page">
    <div class="page-header">
      <h2 class="page-title">{{ t("order.orderManagement") }}</h2>
      <div class="page-actions">
        <el-button type="success" @click="goToStatistics">
          <el-icon><DataAnalysis /></el-icon>
          {{ t("order.statisticsTitle") }}
        </el-button>
        <el-button type="primary" @click="createNewOrder">
          <el-icon><Plus /></el-icon>
          {{ t("order.createOrder") }}
        </el-button>
        <el-button @click="openImportDialog">
          <el-icon><Upload /></el-icon>
          {{ t("order.importOrders") }}
        </el-button>
        <el-button @click="exportOrders">
          <el-icon><Download /></el-icon>
          {{ t("order.exportOrders") }}
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <OrderFilter @filter="handleFilter" @reset="handleResetFilter" />

    <!-- 表格工具栏 -->
    <div class="table-toolbar">
      <div class="selection-actions" v-if="selectedOrders.length">
        <span class="selection-count">
          {{ t("order.selectedCount", { count: selectedOrders.length }) }}
        </span>
        <el-button type="primary" size="small" @click="batchUpdateOrders">
          <el-icon><Edit /></el-icon>
          {{ t("order.batchUpdate") }}
        </el-button>
        <el-button type="primary" size="small" @click="exportOrders">
          <el-icon><Download /></el-icon>
          {{ t("order.exportSelected") }}
        </el-button>
        <el-button type="danger" size="small" @click="batchDeleteOrders">
          {{ t("order.batchDelete") }}
        </el-button>
      </div>
    </div>

    <!-- 订单表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column type="selection" width="55" />

      <el-table-column
        prop="order_number"
        :label="t('order.orderNumber')"
        min-width="120"
        sortable="custom"
      />

      <el-table-column
        prop="customer_name"
        :label="t('order.customer')"
        min-width="150"
        sortable="custom"
      />

      <el-table-column
        prop="customer_contact_name"
        :label="t('order.customerContact')"
        min-width="150"
      >
        <template #default="scope">
          {{ scope.row.customer_contact_info?.display_name || "-" }}
        </template>
      </el-table-column>

      <el-table-column
        prop="service_type"
        :label="t('order.serviceType')"
        min-width="120"
      />

      <el-table-column
        prop="language"
        :label="t('order.language')"
        min-width="100"
      />

      <el-table-column
        prop="service_time"
        :label="t('order.serviceTime')"
        min-width="120"
      />

      <el-table-column
        prop="customer_total_amount"
        :label="t('order.amount')"
        min-width="100"
        sortable="custom"
      />

      <el-table-column
        prop="payment_status"
        :label="t('order.paymentStatus')"
        min-width="120"
        sortable="custom"
      >
        <template #default="scope">
          <OrderStatusTag
            type="payment"
            :status="scope.row.payment_status"
            size="small"
          />
        </template>
      </el-table-column>

      <el-table-column :label="t('common.actions')" width="180" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="viewOrderDetail(scope.row)">
            {{ t("common.view") }}
          </el-button>
          <el-button size="small" type="primary" @click="editOrder(scope.row)">
            {{ t("common.edit") }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteOrder(scope.row)">
            {{ t("common.delete") }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <!-- 导入对话框 -->
    <ImportDialog
      v-model:visible="importDialogVisible"
      @success="handleImportSuccess"
    />

    <!-- 批量更新对话框 -->
    <BatchUpdateDialog
      v-model:visible="batchUpdateDialogVisible"
      :selectedOrders="selectedOrders"
      @success="handleBatchUpdateSuccess"
    />
  </div>
</template>

<style scoped>
.order-list-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.table-toolbar {
  margin: 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selection-count {
  font-size: 14px;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

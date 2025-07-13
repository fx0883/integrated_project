<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import type { Order } from "@/types/order";
import OrderDetail from "@/components/OrderManagement/OrderDetail.vue";
import OrderHistory from "@/components/OrderManagement/OrderHistory.vue";
import OrderVersionCompare from "@/components/OrderManagement/OrderVersionCompare.vue";
import OrderChangeLog from "@/components/OrderManagement/OrderChangeLog.vue";
import ConfirmDialog from "@/components/OrderManagement/ConfirmDialog.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();

const loading = ref(true);
const order = ref<Order | null>(null);
const orderId = ref<number>(Number(route.params.id));
const activeTab = ref("basic");
const selectedHistoryId = ref<number | null>(null);

// 确认对话框
const confirmDialog = ref({
  visible: false,
  title: "",
  content: "",
  type: "danger" as "warning" | "danger" | "info" | "success",
  loading: false
});

// 初始化加载订单数据
onMounted(async () => {
  if (orderId.value) {
    await fetchOrderDetail();
  } else {
    ElMessage.error(t("order.invalidId"));
    router.push("/order");
  }
});

// 获取订单详情
const fetchOrderDetail = async () => {
  loading.value = true;
  try {
    await orderStore.fetchOrderDetail(orderId.value);
    order.value = orderStore.currentOrder;
  } catch (error) {
    console.error("Failed to fetch order:", error);
    ElMessage.error(t("order.fetchFailed"));
    router.push("/order");
  } finally {
    loading.value = false;
  }
};

// 编辑订单
const editOrder = () => {
  router.push(`/order/edit/${orderId.value}`);
};

// 删除订单
const deleteOrder = () => {
  confirmDialog.value.title = t("order.deleteConfirmTitle");
  confirmDialog.value.content = t("order.deleteConfirmContent", {
    number: order.value?.order_number
  });
  confirmDialog.value.type = "danger";
  confirmDialog.value.visible = true;
};

// 确认删除
const handleConfirmDelete = async () => {
  confirmDialog.value.loading = true;
  try {
    await orderStore.removeOrder(orderId.value);
    ElMessage.success(t("order.deleteSuccess"));
    router.push("/order");
  } catch (error) {
    console.error("Failed to delete order:", error);
  } finally {
    confirmDialog.value.loading = false;
    confirmDialog.value.visible = false;
  }
};

// 取消删除
const handleCancelDelete = () => {
  confirmDialog.value.visible = false;
};

// 返回列表页
const goBack = () => {
  router.push("/order");
};

// 查看历史版本详情
const viewHistoryDetail = (historyId: number) => {
  selectedHistoryId.value = historyId;
  activeTab.value = "versionCompare";
};

// 版本对比
const compareVersions = (historyId: number) => {
  selectedHistoryId.value = historyId;
  activeTab.value = "versionCompare";
};

// 处理版本恢复成功事件
const handleRestoreSuccess = () => {
  fetchOrderDetail();
  activeTab.value = "basic";
};
</script>

<template>
  <div class="order-detail-page">
    <div class="page-header">
      <div class="left-section">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          {{ t("common.back") }}
        </el-button>
        <h2 class="page-title">{{ t("order.orderDetails") }}</h2>
      </div>

      <div class="right-section">
        <el-button type="primary" @click="editOrder">
          <el-icon><Edit /></el-icon>
          {{ t("common.edit") }}
        </el-button>
        <el-button type="danger" @click="deleteOrder">
          <el-icon><Delete /></el-icon>
          {{ t("common.delete") }}
        </el-button>
      </div>
    </div>

    <div class="page-content">
      <el-tabs v-model="activeTab" v-if="order">
        <el-tab-pane :label="t('order.basicInfo')" name="basic">
          <OrderDetail :order="order" :loading="loading" />
        </el-tab-pane>

        <el-tab-pane
          :label="t('order.historyRecords')"
          name="history"
          v-if="order.history_count && order.history_count > 0"
        >
          <OrderHistory
            :order-id="orderId"
            @view-detail="viewHistoryDetail"
            @compare-versions="compareVersions"
            @restore-success="handleRestoreSuccess"
          />
        </el-tab-pane>

        <el-tab-pane
          :label="t('order.changeLog')"
          name="changeLog"
          v-if="order.history_count && order.history_count > 0"
        >
          <OrderChangeLog :order-id="orderId" />
        </el-tab-pane>

        <el-tab-pane
          :label="t('order.versionCompare')"
          name="versionCompare"
          v-if="selectedHistoryId !== null"
        >
          <OrderVersionCompare
            :order-id="orderId"
            :history-id="selectedHistoryId!"
          />
        </el-tab-pane>
      </el-tabs>

      <div v-else-if="!loading" class="no-data">
        {{ t("order.noOrderData") }}
      </div>
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>

<style scoped>
.order-detail-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-section {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0;
  margin-left: 15px;
  font-size: 24px;
  font-weight: 500;
}

.right-section {
  display: flex;
  gap: 10px;
}

.page-content {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #909399;
  font-size: 16px;
}
</style>

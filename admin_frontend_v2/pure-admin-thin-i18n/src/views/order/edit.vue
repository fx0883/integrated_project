<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import type { Order, OrderCreateUpdateParams } from "@/types/order";
import OrderForm from "@/components/OrderManagement/OrderForm.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();

const loading = ref(true);
const order = ref<Order | null>(null);
const orderId = ref<number>(Number(route.params.id));

// 初始化加载订单数据
onMounted(async () => {
  if (orderId.value) {
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
  } else {
    ElMessage.error(t("order.invalidId"));
    router.push("/order");
  }
});

// 提交表单
const handleSubmit = async (formData: OrderCreateUpdateParams) => {
  loading.value = true;
  try {
    await orderStore.updateOrderInfo(orderId.value, formData);
    ElMessage.success(t("order.updateSuccess"));

    // 更新成功后重新获取最新数据
    await orderStore.fetchOrderDetail(orderId.value);
    order.value = orderStore.currentOrder;

    // 获取最新数据后跳转到详情页
    router.push(`/order/detail/${orderId.value}`);
  } catch (error) {
    console.error("Failed to update order:", error);
    ElMessage.error(t("order.updateFailed"));
  } finally {
    loading.value = false;
  }
};

// 取消编辑
const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="order-edit-page">
    <div class="page-header">
      <h2 class="page-title">{{ t("order.editOrder") }}</h2>
    </div>

    <div class="page-content" v-loading="loading">
      <OrderForm
        v-if="order"
        mode="edit"
        :order="order"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<style scoped>
.order-edit-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.page-content {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  min-height: 200px;
}
</style>

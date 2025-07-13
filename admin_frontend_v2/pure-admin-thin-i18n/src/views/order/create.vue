<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useOrderStore } from "@/store/modules/order";
import type { OrderCreateUpdateParams } from "@/types/order";
import OrderForm from "@/components/OrderManagement/OrderForm.vue";

const { t } = useI18n();
const router = useRouter();
const orderStore = useOrderStore();

const loading = ref(false);

// 提交表单
const handleSubmit = async (formData: OrderCreateUpdateParams) => {
  loading.value = true;
  try {
    await orderStore.createNewOrder(formData);
    ElMessage.success(t("order.createSuccess"));
    // 创建成功后跳转到详情页
    router.push(`/order/detail/${orderStore.currentOrder?.id}`);
  } catch (error) {
    console.error("Failed to create order:", error);
  } finally {
    loading.value = false;
  }
};

// 取消创建
const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="order-create-page">
    <div class="page-header">
      <h2 class="page-title">{{ t("order.createOrder") }}</h2>
    </div>

    <div class="page-content">
      <OrderForm
        mode="create"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<style scoped>
.order-create-page {
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
}
</style>

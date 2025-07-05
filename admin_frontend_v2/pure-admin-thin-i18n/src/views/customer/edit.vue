<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useCustomerStoreHook } from "@/store/modules/customer";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import { CustomerForm } from "@/components/CustomerManagement";
import type { CustomerCreateUpdateParams } from "@/types/customer";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const customerStore = useCustomerStoreHook();
const userStore = useUserStoreHook();

// 获取客户ID
const customerId = computed(() => Number(route.params.id));

// 检查用户是否有管理权限
const hasManagePermission = computed(
  () => userStore.is_super_admin || hasPerms("customer:manage")
);

// 如果没有管理权限，显示无权限提示
if (!hasManagePermission.value) {
  ElMessage.error(t("common.noPermission"));
  router.push("/customer");
}

// 表单加载状态
const loading = ref(false);
const updateLoading = computed(() => customerStore.loading.update);

// 获取客户详情
const fetchCustomerDetail = async () => {
  loading.value = true;
  try {
    await customerStore.fetchCustomerDetail(customerId.value);
  } catch (error) {
    logger.error("获取客户详情失败", error);
    ElMessage.error(t("customer.fetchDetailFailed"));
    router.push("/customer");
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async (formData: CustomerCreateUpdateParams) => {
  try {
    await customerStore.updateCustomerInfo(customerId.value, formData);
    ElMessage.success(t("customer.updateSuccess"));

    // 更新成功后跳转到客户列表
    router.push("/customer");
  } catch (error) {
    logger.error("更新客户失败", error);
    ElMessage.error(t("customer.updateFailed"));
  }
};

// 取消编辑
const handleCancel = () => {
  router.push("/customer");
};

// 初始化
onMounted(() => {
  fetchCustomerDetail();
});
</script>

<template>
  <div class="customer-edit-container">
    <div class="customer-edit-header">
      <h2 class="customer-edit-title">{{ t("customer.editCustomer") }}</h2>
    </div>

    <div class="customer-edit-content">
      <el-card v-loading="loading">
        <CustomerForm
          v-if="customerStore.currentCustomer"
          mode="edit"
          :customer="customerStore.currentCustomer"
          :loading="updateLoading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.customer-edit-container {
  padding: 20px;
}

.customer-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.customer-edit-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.customer-edit-content {
  max-width: 800px;
}
</style>

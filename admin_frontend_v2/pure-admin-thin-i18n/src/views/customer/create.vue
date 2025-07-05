<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useCustomerStoreHook } from "@/store/modules/customer";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import { CustomerForm } from "@/components/CustomerManagement";
import type { CustomerCreateUpdateParams } from "@/types/customer";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const customerStore = useCustomerStoreHook();
const userStore = useUserStoreHook();

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
const loading = computed(() => customerStore.loading.create);

// 提交表单
const handleSubmit = async (formData: CustomerCreateUpdateParams) => {
  try {
    await customerStore.createCustomer(formData);
    ElMessage.success(t("customer.createSuccess"));

    // 创建成功后跳转到客户列表
    router.push("/customer");
  } catch (error) {
    logger.error("创建客户失败", error);
    ElMessage.error(t("customer.createFailed"));
  }
};

// 取消创建
const handleCancel = () => {
  router.push("/customer");
};
</script>

<template>
  <div class="customer-create-container">
    <div class="customer-create-header">
      <h2 class="customer-create-title">{{ t("customer.createCustomer") }}</h2>
    </div>

    <div class="customer-create-content">
      <el-card>
        <CustomerForm
          mode="create"
          :loading="loading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.customer-create-container {
  padding: 20px;
}

.customer-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.customer-create-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.customer-create-content {
  max-width: 800px;
}
</style>

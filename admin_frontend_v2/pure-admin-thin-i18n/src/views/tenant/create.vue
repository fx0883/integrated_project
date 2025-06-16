<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import TenantForm from "@/components/TenantManagement/TenantForm.vue";
import type { TenantCreateUpdateParams } from "@/types/tenant";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const tenantStore = useTenantStoreHook();
const userStore = useUserStoreHook();

// 检查用户是否有超级管理员权限
const isSuperAdmin = computed(() => userStore.is_super_admin);

// 如果不是超级管理员，显示无权限提示
if (!isSuperAdmin.value) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 表单加载状态
const loading = computed(() => tenantStore.loading.create);

// 提交表单
const handleSubmit = async (formData: TenantCreateUpdateParams) => {
  try {
    const response = await tenantStore.createNewTenant(formData);
    ElMessage.success(t("tenant.createSuccess"));

    // 创建成功后跳转到租户列表
    router.push("/tenant");
  } catch (error) {
    logger.error("创建租户失败", error);
    ElMessage.error(t("tenant.createFailed"));
  }
};

// 取消创建
const handleCancel = () => {
  router.push("/tenant");
};
</script>

<template>
  <div class="tenant-create-container">
    <div class="tenant-create-header">
      <h2 class="tenant-create-title">{{ t("tenant.createTenant") }}</h2>
    </div>

    <div class="tenant-create-content">
      <el-card>
        <TenantForm
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
.tenant-create-container {
  padding: 20px;
}

.tenant-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tenant-create-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.tenant-create-content {
  max-width: 800px;
}
</style>

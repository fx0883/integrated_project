<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import TenantForm from "@/components/TenantManagement/TenantForm.vue";
import type { TenantCreateUpdateParams } from "@/types/tenant";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const tenantStore = useTenantStoreHook();
const userStore = useUserStoreHook();

// 获取租户ID
const tenantId = computed(() => Number(route.params.id));

// 检查用户是否有超级管理员权限
const isSuperAdmin = computed(() => userStore.is_super_admin);

// 如果不是超级管理员，显示无权限提示
if (!isSuperAdmin.value) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 当前租户
const currentTenant = computed(() => tenantStore.currentTenant);

// 加载状态
const loading = computed(
  () => tenantStore.loading.detail || tenantStore.loading.update
);

// 获取租户详情
const fetchTenantDetail = async () => {
  try {
    await tenantStore.fetchTenantDetail(tenantId.value);
  } catch (error) {
    logger.error("获取租户详情失败", error);
    ElMessage.error("获取租户详情失败");
    router.push("/tenant");
  }
};

// 提交表单
const handleSubmit = async (formData: TenantCreateUpdateParams) => {
  try {
    await tenantStore.updateTenantInfo(tenantId.value, formData);
    ElMessage.success(t("tenant.updateSuccess"));

    // 更新成功后跳转到租户列表
    router.push("/tenant");
  } catch (error) {
    logger.error("更新租户失败", error);
    ElMessage.error(t("tenant.updateFailed"));
  }
};

// 取消编辑
const handleCancel = () => {
  router.push("/tenant");
};

// 在组件加载时获取租户详情
onMounted(async () => {
  if (isSuperAdmin.value) {
    await fetchTenantDetail();
  }
});
</script>

<template>
  <div class="tenant-edit-container">
    <div class="tenant-edit-header">
      <h2 class="tenant-edit-title">{{ t("tenant.editTenant") }}</h2>
    </div>

    <div class="tenant-edit-content">
      <el-card v-loading="tenantStore.loading.detail">
        <TenantForm
          v-if="currentTenant"
          mode="edit"
          :tenant="currentTenant"
          :loading="loading"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.tenant-edit-container {
  padding: 20px;
}

.tenant-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tenant-edit-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.tenant-edit-content {
  max-width: 800px;
}
</style>

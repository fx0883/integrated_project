<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAdminUserStoreHook } from "@/store/modules/adminUser";
import { useUserStoreHook } from "@/store/modules/user";
import AdminUserForm from "@/components/AdminUserManagement/AdminUserForm.vue";
import type { AdminUserCreateParams } from "@/types/adminUser";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const adminUserStore = useAdminUserStoreHook();
const userStore = useUserStoreHook();

// 检查用户是否有超级管理员权限
const isSuperAdmin = computed(() => userStore.is_super_admin);

// 如果不是超级管理员，显示无权限提示
if (!isSuperAdmin.value) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 表单加载状态
const loading = computed(() => adminUserStore.loading.create);

// 提交表单
const handleSubmit = async (formData: AdminUserCreateParams) => {
  try {
    const response = await adminUserStore.createNewAdminUser(formData);
    ElMessage.success(t("adminUser.createSuccess"));

    // 创建成功后跳转到管理员列表
    router.push("/admin-user");
  } catch (error) {
    logger.error("创建管理员用户失败", error);
    ElMessage.error(t("adminUser.createFailed"));
  }
};

// 取消创建
const handleCancel = () => {
  router.push("/admin-user");
};
</script>

<template>
  <div class="admin-user-create-container">
    <div class="admin-user-create-header">
      <h2 class="admin-user-create-title">
        {{ t("adminUser.createAdminUser") }}
      </h2>
    </div>

    <div class="admin-user-create-content">
      <el-card>
        <AdminUserForm
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
.admin-user-create-container {
  padding: 20px;
}

.admin-user-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-user-create-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.admin-user-create-content {
  max-width: 800px;
}
</style>

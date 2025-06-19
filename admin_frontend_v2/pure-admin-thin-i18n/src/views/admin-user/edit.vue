<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useAdminUserStoreHook } from "@/store/modules/adminUser";
import { useUserStoreHook } from "@/store/modules/user";
import AdminUserForm from "@/components/AdminUserManagement/AdminUserForm.vue";
import type { AdminUserUpdateParams } from "@/types/adminUser";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const adminUserStore = useAdminUserStoreHook();
const userStore = useUserStoreHook();

// 获取管理员用户ID
const adminUserId = computed(() => Number(route.params.id));

// 检查用户是否有超级管理员权限
const isSuperAdmin = computed(() => userStore.is_super_admin);

// 如果不是超级管理员，显示无权限提示
if (!isSuperAdmin.value) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 当前管理员用户
const currentAdminUser = computed(() => adminUserStore.currentAdminUser);

// 加载状态
const loading = computed(
  () => adminUserStore.loading.detail || adminUserStore.loading.update
);

// 获取管理员用户详情
const fetchAdminUserDetail = async () => {
  try {
    await adminUserStore.fetchAdminUserDetail(adminUserId.value);
  } catch (error) {
    logger.error("获取管理员用户详情失败", error);
    ElMessage.error("获取管理员用户详情失败");
    router.push("/admin-user");
  }
};

// 提交表单
const handleSubmit = async (formData: AdminUserUpdateParams) => {
  try {
    await adminUserStore.updateAdminUserInfo(adminUserId.value, formData);
    ElMessage.success(t("adminUser.updateSuccess"));

    // 更新成功后跳转到管理员列表
    router.push("/admin-user");
  } catch (error) {
    logger.error("更新管理员用户失败", error);
    ElMessage.error(t("adminUser.updateFailed"));
  }
};

// 取消编辑
const handleCancel = () => {
  router.push("/admin-user");
};

// 页面加载时获取数据
onMounted(() => {
  fetchAdminUserDetail();
});
</script>

<template>
  <div class="admin-user-edit-container">
    <div class="admin-user-edit-header">
      <h2 class="admin-user-edit-title">{{ t("adminUser.editAdminUser") }}</h2>
    </div>

    <div class="admin-user-edit-content">
      <el-card v-loading="adminUserStore.loading.detail">
        <AdminUserForm
          v-if="currentAdminUser"
          mode="edit"
          :admin-user="currentAdminUser"
          :loading="adminUserStore.loading.update"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.admin-user-edit-container {
  padding: 20px;
}

.admin-user-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-user-edit-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.admin-user-edit-content {
  max-width: 800px;
}
</style>

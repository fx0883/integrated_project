<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAdminUserStoreHook } from "@/store/modules/adminUser";
import { useUserStoreHook } from "@/store/modules/user";
import ConfirmDialog from "@/components/AdminUserManagement/ConfirmDialog.vue";
import AvatarUpload from "@/components/AdminUserManagement/AvatarUpload.vue";
import type { ResetPasswordParams } from "@/types/adminUser";
import logger from "@/utils/logger";
import TenantSelectDialog from "@/components/AdminUserManagement/TenantSelectDialog.vue";

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

// 重置密码表单
const resetPasswordForm = reactive<ResetPasswordParams>({
  password: "",
  password_confirm: ""
});

// 重置密码对话框可见性
const resetPasswordDialogVisible = ref(false);

// 确认对话框
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null
});

// 租户选择对话框可见性
const tenantSelectDialogVisible = ref(false);

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

// 返回列表
const handleBack = () => {
  router.push("/admin-user");
};

// 编辑管理员
const handleEdit = () => {
  router.push(`/admin-user/edit/${adminUserId.value}`);
};

// 处理删除
const handleDelete = () => {
  confirmDialog.title = t("adminUser.confirmDelete");
  confirmDialog.content = t("adminUser.confirmDeleteMessage", {
    username: currentAdminUser.value?.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.removeAdminUser(adminUserId.value);
      ElMessage.success(t("adminUser.deleteSuccess"));
      router.push("/admin-user");
    } catch (error) {
      logger.error("删除管理员用户失败", error);
      ElMessage.error(t("adminUser.deleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理授予超级管理员权限
const handleGrantSuperAdmin = () => {
  confirmDialog.title = t("adminUser.confirmGrantSuperAdmin");
  confirmDialog.content = t("adminUser.confirmGrantSuperAdminMessage", {
    username: currentAdminUser.value?.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.grantSuperAdminAction(adminUserId.value);
      ElMessage.success(t("adminUser.grantSuccess"));
      fetchAdminUserDetail();
    } catch (error) {
      logger.error("授予超级管理员权限失败", error);
      ElMessage.error(t("adminUser.grantFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理撤销超级管理员权限
const handleRevokeSuperAdmin = () => {
  logger.debug("详情页撤销超级管理员权限被点击", { userId: adminUserId.value });

  // 显示租户选择对话框
  tenantSelectDialogVisible.value = true;
};

// 处理租户选择确认
const handleTenantSelectConfirm = async (tenantId: number) => {
  logger.debug("已选择租户，准备撤销超级管理员权限", {
    userId: adminUserId.value,
    username: currentAdminUser.value?.username,
    tenantId
  });

  confirmDialog.title = t("adminUser.confirmRevokeSuperAdmin");
  confirmDialog.content = t("adminUser.confirmRevokeSuperAdminMessage", {
    username: currentAdminUser.value?.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      logger.debug("详情页确认撤销超级管理员权限", {
        userId: adminUserId.value,
        tenantId
      });
      await adminUserStore.revokeSuperAdminAction(adminUserId.value, tenantId);
      ElMessage.success(t("adminUser.revokeSuccess"));
      fetchAdminUserDetail();
    } catch (error) {
      logger.error("撤销超级管理员权限失败", error);
      ElMessage.error(t("adminUser.revokeFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理激活账号
const handleActivate = () => {
  confirmDialog.title = t("adminUser.confirmActivate");
  confirmDialog.content = t("adminUser.confirmActivateMessage", {
    username: currentAdminUser.value?.username
  });
  confirmDialog.type = "info";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.activateAdminUserAction(adminUserId.value);
      ElMessage.success(t("adminUser.activateSuccess"));
      fetchAdminUserDetail();
    } catch (error) {
      logger.error("激活管理员账号失败", error);
      ElMessage.error(t("adminUser.activateFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理停用账号
const handleDeactivate = () => {
  confirmDialog.title = t("adminUser.confirmDeactivate");
  confirmDialog.content = t("adminUser.confirmDeactivateMessage", {
    username: currentAdminUser.value?.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.deactivateAdminUserAction(adminUserId.value);
      ElMessage.success(t("adminUser.deactivateSuccess"));
      fetchAdminUserDetail();
    } catch (error) {
      logger.error("停用管理员账号失败", error);
      ElMessage.error(t("adminUser.deactivateFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 打开重置密码对话框
const openResetPasswordDialog = () => {
  resetPasswordForm.password = "";
  resetPasswordForm.password_confirm = "";
  resetPasswordDialogVisible.value = true;
};

// 提交重置密码
const handleResetPassword = async () => {
  // 验证密码
  if (!resetPasswordForm.password) {
    ElMessage.error(t("adminUser.passwordRequired"));
    return;
  }
  if (!resetPasswordForm.password_confirm) {
    ElMessage.error(t("adminUser.passwordConfirmRequired"));
    return;
  }
  if (resetPasswordForm.password !== resetPasswordForm.password_confirm) {
    ElMessage.error(t("adminUser.passwordNotMatch"));
    return;
  }

  try {
    await adminUserStore.resetAdminUserPasswordAction(
      adminUserId.value,
      resetPasswordForm
    );
    ElMessage.success(t("adminUser.resetPasswordSuccess"));
    resetPasswordDialogVisible.value = false;
  } catch (error) {
    logger.error("重置管理员密码失败", error);
    ElMessage.error(t("adminUser.resetPasswordFailed"));
  }
};

// 处理上传头像
const handleAvatarUpload = async (file: File) => {
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append("avatar", file);

    // 调用上传头像API
    await adminUserStore.uploadAdminUserAvatarAction(
      adminUserId.value,
      formData
    );
    ElMessage.success(t("adminUser.uploadAvatarSuccess"));

    // 刷新用户详情
    fetchAdminUserDetail();
  } catch (error) {
    logger.error("上传头像失败", error);
    ElMessage.error(t("adminUser.uploadAvatarFailed"));
  }
};

// 确认对话框处理
const handleConfirm = async () => {
  if (confirmDialog.confirmAction) {
    await confirmDialog.confirmAction();
  }
};

// 格式化时间
const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) return "-";
  const date = new Date(dateTimeString);
  return date.toLocaleString();
};

// 页面加载时获取数据
onMounted(() => {
  fetchAdminUserDetail();
});
</script>

<template>
  <div class="admin-user-detail-container">
    <div class="admin-user-detail-header">
      <h2 class="admin-user-detail-title">{{ t("adminUser.detail") }}</h2>
      <div class="admin-user-detail-actions">
        <el-button @click="handleBack">
          {{ t("adminUser.backToList") }}
        </el-button>
        <el-button type="primary" @click="handleEdit">
          {{ t("adminUser.editBtn") }}
        </el-button>
      </div>
    </div>

    <el-card
      v-loading="adminUserStore.loading.detail"
      class="admin-user-detail-card"
    >
      <div v-if="currentAdminUser" class="admin-user-detail-content">
        <div class="admin-user-avatar-section">
          <AvatarUpload
            :avatar="currentAdminUser.avatar"
            @upload="handleAvatarUpload"
          />
        </div>

        <el-tabs>
          <el-tab-pane :label="t('adminUser.basicInfo')">
            <el-descriptions :column="2" border>
              <el-descriptions-item :label="t('adminUser.id')">
                {{ currentAdminUser.id }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.username')">
                {{ currentAdminUser.username }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.email')">
                {{ currentAdminUser.email }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.phone')">
                {{ currentAdminUser.phone || "-" }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.nickName')">
                {{ currentAdminUser.nick_name || "-" }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.fullName')">
                {{
                  (currentAdminUser.first_name || "") +
                    " " +
                    (currentAdminUser.last_name || "") || "-"
                }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane :label="t('adminUser.roleInfo')">
            <el-descriptions :column="2" border>
              <el-descriptions-item :label="t('adminUser.roles')">
                <el-tag type="danger" v-if="currentAdminUser.is_super_admin">
                  {{ t("adminUser.superAdmin") }}
                </el-tag>
                <el-tag type="primary" v-else>
                  {{ t("adminUser.tenantAdmin") }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.tenant')">
                {{ currentAdminUser.tenant_name || "-" }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.status')">
                <el-tag
                  :type="
                    currentAdminUser.status === 'active'
                      ? 'success'
                      : currentAdminUser.status === 'suspended'
                        ? 'warning'
                        : 'info'
                  "
                >
                  {{
                    t(
                      `adminUser.status${
                        currentAdminUser.status.charAt(0).toUpperCase() +
                        currentAdminUser.status.slice(1)
                      }`
                    )
                  }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <el-tab-pane :label="t('adminUser.accountInfo')">
            <el-descriptions :column="2" border>
              <el-descriptions-item :label="t('adminUser.createdAt')">
                {{ formatDateTime(currentAdminUser.date_joined) }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.lastLogin')">
                {{
                  currentAdminUser.last_login_time
                    ? formatDateTime(currentAdminUser.last_login_time)
                    : "-"
                }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('adminUser.lastLoginIp')">
                {{ currentAdminUser.last_login_ip || "-" }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>

        <div class="admin-user-actions">
          <el-divider />
          <h3>{{ t("操作") }}</h3>
          <div class="action-buttons">
            <el-button
              type="primary"
              v-if="!currentAdminUser.is_super_admin"
              @click="handleGrantSuperAdmin"
            >
              {{ t("adminUser.grantSuperAdmin") }}
            </el-button>
            <el-button
              type="warning"
              v-if="
                currentAdminUser.is_super_admin &&
                currentAdminUser.id !== userStore.id
              "
              @click="handleRevokeSuperAdmin"
            >
              {{ t("adminUser.revokeSuperAdmin") }}
            </el-button>
            <el-button
              type="success"
              v-if="!currentAdminUser.is_active"
              @click="handleActivate"
            >
              {{ t("adminUser.activate") }}
            </el-button>
            <el-button
              type="warning"
              v-if="
                currentAdminUser.is_active &&
                currentAdminUser.id !== userStore.id
              "
              @click="handleDeactivate"
            >
              {{ t("adminUser.deactivate") }}
            </el-button>
            <el-button type="primary" @click="openResetPasswordDialog">
              {{ t("adminUser.resetPassword") }}
            </el-button>
            <el-button
              type="danger"
              v-if="currentAdminUser.id !== userStore.id"
              @click="handleDelete"
            >
              {{ t("adminUser.delete") }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      :title="t('adminUser.resetPassword')"
      width="500px"
    >
      <el-form :model="resetPasswordForm">
        <el-form-item :label="t('adminUser.password')" prop="password">
          <el-input
            v-model="resetPasswordForm.password"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item
          :label="t('adminUser.confirmPassword')"
          prop="password_confirm"
        >
          <el-input
            v-model="resetPasswordForm.password_confirm"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">
            {{ t("adminUser.cancel") }}
          </el-button>
          <el-button type="primary" @click="handleResetPassword">
            {{ t("adminUser.save") }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      @confirm="handleConfirm"
    />

    <!-- 租户选择对话框 -->
    <TenantSelectDialog
      v-model:visible="tenantSelectDialogVisible"
      :title="t('adminUser.selectTenantTitle')"
      @confirm="handleTenantSelectConfirm"
    />
  </div>
</template>

<style scoped>
.admin-user-detail-container {
  padding: 20px;
}

.admin-user-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-user-detail-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.admin-user-detail-card {
  margin-bottom: 20px;
}

.admin-user-detail-content {
  padding: 20px 0;
}

.admin-user-avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.admin-user-actions {
  margin-top: 30px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}
</style>

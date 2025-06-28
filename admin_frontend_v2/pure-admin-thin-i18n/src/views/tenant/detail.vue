<script lang="ts" setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox, ElTabs, ElTabPane } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import ConfirmDialog from "@/components/TenantManagement/ConfirmDialog.vue";
import QuotaProgress from "@/components/TenantManagement/QuotaProgress.vue";
import TenantQuotaForm from "@/components/TenantManagement/TenantQuotaForm.vue";
import type {
  TenantQuotaUpdateParams,
  TenantUserListParams
} from "@/types/tenant";
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
const tenant = computed(() => tenantStore.currentTenant);

// 当前租户配额
const quota = computed(() => tenantStore.currentQuota);

// 当前租户用户
const users = computed(() => tenantStore.tenantUsers.data);

// 用户分页信息
const userPagination = reactive({
  total: computed(() => tenantStore.tenantUsers.total),
  currentPage: 1,
  pageSize: 10
});

// 当前活动标签页
const activeTab = ref("basic");

// 确认对话框相关状态
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as "warning" | "danger" | "info",
  loading: false,
  confirmCallback: null as (() => void) | null
});

// 打开确认对话框
const openConfirmDialog = (
  title: string,
  content: string,
  type: "warning" | "danger" | "info",
  callback: () => void
) => {
  confirmDialog.visible = true;
  confirmDialog.title = title;
  confirmDialog.content = content;
  confirmDialog.type = type;
  confirmDialog.confirmCallback = callback;
};

// 确认对话框确认按钮点击
const handleConfirmDialogConfirm = async () => {
  confirmDialog.loading = true;
  try {
    if (confirmDialog.confirmCallback) {
      await confirmDialog.confirmCallback();
    }
  } finally {
    confirmDialog.loading = false;
    confirmDialog.visible = false;
  }
};

// 关闭确认对话框
const handleConfirmDialogCancel = () => {
  confirmDialog.visible = false;
};

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

// 获取租户配额
const fetchTenantQuota = async () => {
  try {
    await tenantStore.fetchTenantQuotaUsage(tenantId.value);
  } catch (error) {
    logger.error("获取租户配额失败", error);
    ElMessage.error("获取租户配额失败");
  }
};

// 获取租户用户列表
const fetchTenantUsers = async () => {
  const params: TenantUserListParams = {
    page: userPagination.currentPage,
    page_size: userPagination.pageSize
  };

  try {
    await tenantStore.fetchTenantUsers(tenantId.value, params);
  } catch (error) {
    logger.error("获取租户用户列表失败", error);
    ElMessage.error("获取租户用户列表失败");
  }
};

// 更新租户配额
const handleUpdateQuota = async (formData: TenantQuotaUpdateParams) => {
  try {
    await tenantStore.updateTenantQuotaAction(tenantId.value, formData);
    ElMessage.success(t("tenant.quotaUpdateSuccess"));

    // 刷新配额信息
    await fetchTenantQuota();

    // 关闭编辑配额对话框
    showEditQuotaForm.value = false;
  } catch (error) {
    logger.error("更新租户配额失败", error);
    ElMessage.error(t("tenant.quotaUpdateFailed"));
  }
};

// 激活租户
const handleActivateTenant = () => {
  if (!tenant.value) return;

  openConfirmDialog(
    t("tenant.confirmActivate"),
    t("tenant.confirmActivateMessage", { name: tenant.value.name }),
    "info",
    async () => {
      try {
        await tenantStore.activateTenantAction(tenantId.value);
        ElMessage.success(t("tenant.activateSuccess"));

        // 刷新租户信息
        await fetchTenantDetail();
      } catch (error) {
        logger.error("激活租户失败", error);
        ElMessage.error(t("tenant.activateFailed"));
        throw error;
      }
    }
  );
};

// 暂停租户
const handleSuspendTenant = () => {
  if (!tenant.value) return;

  openConfirmDialog(
    t("tenant.confirmSuspend"),
    t("tenant.confirmSuspendMessage", { name: tenant.value.name }),
    "warning",
    async () => {
      try {
        await tenantStore.suspendTenantAction(tenantId.value);
        ElMessage.success(t("tenant.suspendSuccess"));

        // 刷新租户信息
        await fetchTenantDetail();
      } catch (error) {
        logger.error("暂停租户失败", error);
        ElMessage.error(t("tenant.suspendFailed"));
        throw error;
      }
    }
  );
};

// 删除租户
const handleDeleteTenant = () => {
  if (!tenant.value) return;

  openConfirmDialog(
    t("tenant.confirmDelete"),
    t("tenant.confirmDeleteMessage", { name: tenant.value.name }),
    "danger",
    async () => {
      try {
        await tenantStore.removeTenant(tenantId.value);
        ElMessage.success(t("tenant.deleteSuccess"));

        // 删除成功后返回列表
        router.push("/tenant");
      } catch (error) {
        logger.error("删除租户失败", error);
        ElMessage.error(t("tenant.deleteFailed"));
        throw error;
      }
    }
  );
};

// 返回列表
const handleBackToList = () => {
  router.push("/tenant");
};

// 编辑租户
const handleEditTenant = () => {
  router.push(`/tenant/edit/${tenantId.value}`);
};

// 编辑配额表单显示状态
const showEditQuotaForm = ref(false);

// 显示编辑配额表单
const handleShowEditQuotaForm = () => {
  showEditQuotaForm.value = true;
};

// 取消编辑配额
const handleCancelEditQuota = () => {
  showEditQuotaForm.value = false;
};

// 状态标签类型映射
const statusTagType = status => {
  switch (status) {
    case "active":
      return "success";
    case "suspended":
      return "warning";
    case "deleted":
      return "danger";
    default:
      return "info";
  }
};

// 用户角色标签类型映射
const userRoleTagType = isAdmin => {
  return isAdmin ? "primary" : "";
};

// 用户状态标签类型映射
const userStatusTagType = isActive => {
  return isActive ? "success" : "danger";
};

// 处理用户页码变化
const handleUserCurrentPageChange = page => {
  userPagination.currentPage = page;
  fetchTenantUsers();
};

// 处理用户每页条数变化
const handleUserPageSizeChange = size => {
  userPagination.pageSize = size;
  userPagination.currentPage = 1;
  fetchTenantUsers();
};

// 监听标签页切换
const handleTabChange = tab => {
  // 如果切换到配额标签页，加载配额信息
  if (tab.props.name === "quota" && !quota.value) {
    fetchTenantQuota();
  }

  // 如果切换到用户标签页，加载用户列表
  if (tab.props.name === "users" && users.value.length === 0) {
    fetchTenantUsers();
  }
};

// 监视用户分页参数变化
watch(
  () => userPagination.currentPage,
  newPage => {
    if (newPage && tenantId.value) {
      fetchTenantUsers(tenantId.value);
    }
  }
);

watch(
  () => userPagination.pageSize,
  newSize => {
    if (newSize && tenantId.value) {
      userPagination.currentPage = 1; // 当每页条数变化时，重置为第一页
      fetchTenantUsers(tenantId.value);
    }
  }
);

// 在组件加载时获取租户详情
onMounted(async () => {
  if (isSuperAdmin.value) {
    await fetchTenantDetail();

    // 初始加载配额信息
    await fetchTenantQuota();
  }
});
</script>

<template>
  <div class="tenant-detail-container">
    <div class="tenant-detail-header">
      <div class="tenant-detail-title-area">
        <el-button @click="handleBackToList" type="text" class="back-button">
          <el-icon><arrow-left /></el-icon>
          {{ t("tenant.backToList") }}
        </el-button>
        <h2 class="tenant-detail-title">{{ t("tenant.detail") }}</h2>
      </div>

      <div class="tenant-detail-actions">
        <el-button @click="handleEditTenant" type="primary" :disabled="!tenant">
          {{ t("tenant.editBtn") }}
        </el-button>
        <el-button
          @click="handleDeleteTenant"
          type="danger"
          :disabled="!tenant"
        >
          {{ t("tenant.delete") }}
        </el-button>
      </div>
    </div>

    <div class="tenant-detail-content" v-loading="!tenant">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 基本信息标签页 -->
        <el-tab-pane :label="t('tenant.basicInfo')" name="basic">
          <el-card v-if="tenant" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>{{ tenant.name }}</span>
                <el-tag :type="statusTagType(tenant.status)" effect="light">
                  {{
                    t(
                      `tenant.status${tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}`
                    )
                  }}
                </el-tag>
              </div>
            </template>

            <div class="tenant-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="t('tenant.id')">{{
                  tenant.id
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.name')">{{
                  tenant.name
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.contactName')">{{
                  tenant.contact_name
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.contactEmail')">{{
                  tenant.contact_email
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.contactPhone')">{{
                  tenant.contact_phone
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.status')">
                  <el-tag :type="statusTagType(tenant.status)" effect="light">
                    {{
                      t(
                        `tenant.status${tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}`
                      )
                    }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('tenant.userCount')">{{
                  tenant.user_count || 0
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.adminCount')">{{
                  tenant.admin_count || 0
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.createdAt')">{{
                  tenant.created_at
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('tenant.updatedAt')">{{
                  tenant.updated_at
                }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="tenant-actions">
              <el-button
                v-if="tenant.status === 'active'"
                @click="handleSuspendTenant"
                type="warning"
              >
                {{ t("tenant.suspend") }}
              </el-button>

              <el-button
                v-if="tenant.status === 'suspended'"
                @click="handleActivateTenant"
                type="success"
              >
                {{ t("tenant.activate") }}
              </el-button>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 配额信息标签页 -->
        <el-tab-pane :label="t('tenant.quotaInfo')" name="quota">
          <el-card v-loading="tenantStore.loading.quota" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>{{ t("tenant.quotaUsage") }}</span>
                <el-button
                  @click="handleShowEditQuotaForm"
                  type="primary"
                  size="small"
                >
                  {{ t("tenant.editBtn") }}
                </el-button>
              </div>
            </template>

            <div v-if="quota" class="quota-info">
              <!-- 显示配额使用情况 -->
              <QuotaProgress
                :label="t('tenant.maxUsers')"
                :current="tenant?.user_count || 0"
                :max="quota.max_users"
              />
              <QuotaProgress
                :label="t('tenant.maxAdmins')"
                :current="tenant?.admin_count || 0"
                :max="quota.max_admins"
              />
              <QuotaProgress
                :label="t('tenant.maxStorageMb')"
                :current="quota.current_storage_used_mb || 0"
                :max="quota.max_storage_mb"
                unit="MB"
              />
            </div>

            <div v-else class="no-data">
              {{ t("tenant.noData") }}
            </div>

            <!-- 编辑配额表单 -->
            <el-dialog
              v-model="showEditQuotaForm"
              :title="t('tenant.quotaManagement')"
              width="50%"
            >
              <TenantQuotaForm
                :quota="quota"
                :loading="tenantStore.loading.updateQuota"
                @submit="handleUpdateQuota"
                @cancel="handleCancelEditQuota"
              />
            </el-dialog>
          </el-card>
        </el-tab-pane>

        <!-- 用户信息标签页 -->
        <el-tab-pane :label="t('tenant.userInfo')" name="users">
          <el-card v-loading="tenantStore.loading.users" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>{{ t("tenant.tenantUsers") }}</span>
              </div>
            </template>

            <div class="user-list">
              <el-table :data="users" style="width: 100%" border stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column
                  prop="username"
                  :label="t('tenant.username')"
                  width="120"
                />
                <el-table-column
                  prop="email"
                  :label="t('tenant.email')"
                  min-width="180"
                />
                <el-table-column
                  prop="nick_name"
                  :label="t('tenant.nickName')"
                  width="120"
                />
                <el-table-column :label="t('tenant.role')" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="userRoleTagType(scope.row.is_admin)"
                      effect="light"
                    >
                      {{
                        scope.row.is_admin
                          ? t("tenant.roleAdmin")
                          : t("tenant.roleUser")
                      }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="t('tenant.isActive')" width="120">
                  <template #default="scope">
                    <el-tag
                      :type="userStatusTagType(scope.row.is_active)"
                      effect="light"
                    >
                      {{
                        scope.row.is_active
                          ? t("tenant.isActiveTrue")
                          : t("tenant.isActiveFalse")
                      }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="date_joined"
                  :label="t('tenant.dateJoined')"
                  width="180"
                />
              </el-table>

              <!-- 分页 -->
              <div class="pagination-container" v-if="users.length > 0">
                <el-pagination
                  v-model:currentPage="userPagination.currentPage"
                  v-model:page-size="userPagination.pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="userPagination.total"
                />
              </div>

              <div v-if="users.length === 0" class="no-data">
                {{ t("tenant.noData") }}
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />
  </div>
</template>

<style scoped>
.tenant-detail-container {
  padding: 20px;
}

.tenant-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tenant-detail-title-area {
  display: flex;
  align-items: center;
}

.back-button {
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.tenant-detail-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tenant-info {
  margin-bottom: 20px;
}

.tenant-actions {
  margin-top: 20px;
}

.quota-info {
  padding: 20px 0;
}

.user-list {
  min-height: 400px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}
</style>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAdminUserStoreHook } from "@/store/modules/adminUser";
import { useUserStoreHook } from "@/store/modules/user";
import ConfirmDialog from "@/components/AdminUserManagement/ConfirmDialog.vue";
import AdminUserForm from "@/components/AdminUserManagement/AdminUserForm.vue";
import type {
  AdminUser,
  AdminUserListParams,
  AdminUserStatus,
  AdminUserCreateParams,
  AdminUserUpdateParams
} from "@/types/adminUser";
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

// 表格加载状态
const tableLoading = computed(() => adminUserStore.loading.list);

// 表格数据
const adminUsers = computed(() => adminUserStore.adminUserList.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => adminUserStore.adminUserList.total)
});

// 搜索表单
const searchForm = reactive<AdminUserListParams>({
  search: "",
  status: undefined,
  is_super_admin: undefined,
  page: 1,
  page_size: 10
});

// 确认对话框
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null
});

// 状态选项
const statusOptions = [
  {
    value: "",
    label: t("adminUser.statusAll")
  },
  {
    value: "active",
    label: t("adminUser.statusActive")
  },
  {
    value: "suspended",
    label: t("adminUser.statusSuspended")
  },
  {
    value: "inactive",
    label: t("adminUser.statusInactive")
  }
];

// 角色选项
const roleOptions = [
  {
    value: "",
    label: t("所有角色")
  },
  {
    value: "true",
    label: t("adminUser.superAdmin")
  },
  {
    value: "false",
    label: t("adminUser.tenantAdmin")
  }
];

// 创建管理员模态框状态
const createDialogVisible = ref(false);
const createSuperAdminDialogVisible = ref(false);
const editDialogVisible = ref(false);
const currentEditUser = ref<AdminUser | null>(null);

// 表单加载状态
const formLoading = computed(() => {
  return (
    adminUserStore.loading.create ||
    adminUserStore.loading.update ||
    adminUserStore.loading.createSuperAdmin
  );
});

// 获取管理员用户列表
const fetchAdminUsers = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;
    await adminUserStore.fetchAdminUserList(searchForm);
  } catch (error) {
    logger.error("获取管理员用户列表失败", error);
    ElMessage.error(t("获取管理员用户列表失败"));
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchAdminUsers();
};

// 重置搜索
const resetSearch = () => {
  searchForm.search = "";
  searchForm.status = undefined;
  searchForm.is_super_admin = undefined;
  pagination.currentPage = 1;
  fetchAdminUsers();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  fetchAdminUsers();
};

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchAdminUsers();
};

// 处理删除
const handleDelete = (row: AdminUser) => {
  confirmDialog.title = t("adminUser.confirmDelete");
  confirmDialog.content = t("adminUser.confirmDeleteMessage", {
    username: row.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.removeAdminUser(row.id);
      ElMessage.success(t("adminUser.deleteSuccess"));
      fetchAdminUsers();
    } catch (error) {
      logger.error("删除管理员用户失败", error);
      ElMessage.error(t("adminUser.deleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理授予超级管理员权限
const handleGrantSuperAdmin = (row: AdminUser) => {
  confirmDialog.title = t("adminUser.confirmGrantSuperAdmin");
  confirmDialog.content = t("adminUser.confirmGrantSuperAdminMessage", {
    username: row.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.grantSuperAdminAction(row.id);
      ElMessage.success(t("adminUser.grantSuccess"));
      fetchAdminUsers();
    } catch (error) {
      logger.error("授予超级管理员权限失败", error);
      ElMessage.error(t("adminUser.grantFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理撤销超级管理员权限
const handleRevokeSuperAdmin = (row: AdminUser) => {
  confirmDialog.title = t("adminUser.confirmRevokeSuperAdmin");
  confirmDialog.content = t("adminUser.confirmRevokeSuperAdminMessage", {
    username: row.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.revokeSuperAdminAction(row.id);
      ElMessage.success(t("adminUser.revokeSuccess"));
      fetchAdminUsers();
    } catch (error) {
      logger.error("撤销超级管理员权限失败", error);
      ElMessage.error(t("adminUser.revokeFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理激活账号
const handleActivate = (row: AdminUser) => {
  confirmDialog.title = t("adminUser.confirmActivate");
  confirmDialog.content = t("adminUser.confirmActivateMessage", {
    username: row.username
  });
  confirmDialog.type = "info";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.activateAdminUserAction(row.id);
      ElMessage.success(t("adminUser.activateSuccess"));
      fetchAdminUsers();
    } catch (error) {
      logger.error("激活管理员账号失败", error);
      ElMessage.error(t("adminUser.activateFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 处理停用账号
const handleDeactivate = (row: AdminUser) => {
  confirmDialog.title = t("adminUser.confirmDeactivate");
  confirmDialog.content = t("adminUser.confirmDeactivateMessage", {
    username: row.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await adminUserStore.deactivateAdminUserAction(row.id);
      ElMessage.success(t("adminUser.deactivateSuccess"));
      fetchAdminUsers();
    } catch (error) {
      logger.error("停用管理员账号失败", error);
      ElMessage.error(t("adminUser.deactivateFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 确认对话框处理
const handleConfirm = async () => {
  if (confirmDialog.confirmAction) {
    await confirmDialog.confirmAction();
  }
};

// 编辑管理员
const handleEdit = (row: AdminUser) => {
  currentEditUser.value = { ...row };
  editDialogVisible.value = true;
};

// 查看管理员详情
const handleView = (row: AdminUser) => {
  router.push(`/admin-user/detail/${row.id}`);
};

// 创建管理员
const handleCreate = () => {
  createDialogVisible.value = true;
};

// 创建超级管理员
const handleCreateSuperAdmin = () => {
  createSuperAdminDialogVisible.value = true;
};

// 提交创建管理员表单
const handleCreateSubmit = async (formData: AdminUserCreateParams) => {
  try {
    await adminUserStore.createNewAdminUser(formData);
    ElMessage.success(t("adminUser.createSuccess"));
    createDialogVisible.value = false;
    fetchAdminUsers();
  } catch (error) {
    logger.error("创建管理员用户失败", error);
    ElMessage.error(t("adminUser.createFailed"));
  }
};

// 提交创建超级管理员表单
const handleCreateSuperAdminSubmit = async (
  formData: AdminUserCreateParams
) => {
  try {
    // 确保设置为超级管理员
    formData.is_super_admin = true;

    await adminUserStore.createNewSuperAdmin(formData);
    ElMessage.success(t("adminUser.createSuccess"));
    createSuperAdminDialogVisible.value = false;
    fetchAdminUsers();
  } catch (error) {
    logger.error("创建超级管理员失败", error);
    ElMessage.error(t("adminUser.createFailed"));
  }
};

// 提交编辑管理员表单
const handleEditSubmit = async (formData: AdminUserUpdateParams) => {
  if (!currentEditUser.value) return;

  try {
    await adminUserStore.updateAdminUserInfo(
      currentEditUser.value.id,
      formData
    );
    ElMessage.success(t("adminUser.updateSuccess"));
    editDialogVisible.value = false;
    fetchAdminUsers();
  } catch (error) {
    logger.error("更新管理员用户失败", error);
    ElMessage.error(t("adminUser.updateFailed"));
  }
};

// 关闭创建对话框
const handleCreateCancel = () => {
  createDialogVisible.value = false;
};

// 关闭创建超级管理员对话框
const handleCreateSuperAdminCancel = () => {
  createSuperAdminDialogVisible.value = false;
};

// 关闭编辑对话框
const handleEditCancel = () => {
  editDialogVisible.value = false;
  currentEditUser.value = null;
};

// 获取状态标签类型
const getStatusTagType = (status: AdminUserStatus | string) => {
  switch (status) {
    case "active":
      return "success";
    case "suspended":
      return "warning";
    case "inactive":
      return "info";
    default:
      return "";
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
  fetchAdminUsers();
});
</script>

<template>
  <div class="admin-user-container">
    <div class="admin-user-header">
      <h2 class="admin-user-title">{{ t("adminUser.management") }}</h2>
      <div class="admin-user-actions">
        <el-button type="primary" @click="handleCreate">
          {{ t("adminUser.create") }}
        </el-button>
        <el-button type="success" @click="handleCreateSuperAdmin">
          {{ t("adminUser.createSuperAdmin") }}
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="admin-user-card">
      <div class="admin-user-search">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item>
            <el-input
              v-model="searchForm.search"
              :placeholder="t('adminUser.searchPlaceholder')"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.status" style="width: 120px">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.is_super_admin" style="width: 120px">
              <el-option
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value === '' ? undefined : item.value === 'true'"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              {{ t("adminUser.search") }}
            </el-button>
            <el-button @click="resetSearch">
              {{ t("adminUser.cancel") }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="adminUsers"
        border
        style="width: 100%"
        v-loading="tableLoading"
      >
        <el-table-column prop="id" :label="t('adminUser.id')" width="80" />
        <el-table-column
          prop="username"
          :label="t('adminUser.username')"
          width="150"
        />
        <el-table-column
          prop="email"
          :label="t('adminUser.email')"
          width="200"
        />
        <el-table-column
          prop="nick_name"
          :label="t('adminUser.nickName')"
          width="150"
        />
        <el-table-column :label="t('adminUser.tenant')" width="150">
          <template #default="scope">
            {{ scope.row.tenant_name || "-" }}
          </template>
        </el-table-column>
        <el-table-column :label="t('adminUser.status')" width="100">
          <template #default="scope">
            <el-tag
              :type="
                getStatusTagType(
                  scope.row.status ||
                    (scope.row.is_active ? 'active' : 'inactive')
                )
              "
            >
              {{
                scope.row.status
                  ? t(
                      `adminUser.status${scope.row.status.charAt(0).toUpperCase() + scope.row.status.slice(1)}`
                    )
                  : t(
                      scope.row.is_active
                        ? "adminUser.statusActive"
                        : "adminUser.statusInactive"
                    )
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('adminUser.roles')" width="130">
          <template #default="scope">
            <el-tag type="danger" v-if="scope.row.is_super_admin">
              {{ t("adminUser.superAdmin") }}
            </el-tag>
            <el-tag type="primary" v-else>
              {{ t("adminUser.tenantAdmin") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('adminUser.createdAt')" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.date_joined) }}
          </template>
        </el-table-column>
        <el-table-column
          :label="t('adminUser.actions')"
          fixed="right"
          width="280"
        >
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">
              {{ t("adminUser.view") }}
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
            >
              {{ t("adminUser.editBtn") }}
            </el-button>
            <el-dropdown trigger="click">
              <el-button size="small" type="info">
                {{ t("更多")
                }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="!scope.row.is_super_admin"
                    @click="handleGrantSuperAdmin(scope.row)"
                  >
                    {{ t("adminUser.grantSuperAdmin") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="
                      scope.row.is_super_admin && scope.row.id !== userStore.id
                    "
                    @click="handleRevokeSuperAdmin(scope.row)"
                  >
                    {{ t("adminUser.revokeSuperAdmin") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="!scope.row.is_active"
                    @click="handleActivate(scope.row)"
                  >
                    {{ t("adminUser.activate") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="scope.row.is_active && scope.row.id !== userStore.id"
                    @click="handleDeactivate(scope.row)"
                  >
                    {{ t("adminUser.deactivate") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="scope.row.id !== userStore.id"
                    @click="handleDelete(scope.row)"
                  >
                    {{ t("adminUser.delete") }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      @confirm="handleConfirm"
    />

    <!-- 创建管理员对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      :title="t('adminUser.createAdminUser')"
      width="70%"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <AdminUserForm
        mode="create"
        :loading="formLoading"
        @submit="handleCreateSubmit"
        @cancel="handleCreateCancel"
      />
    </el-dialog>

    <!-- 创建超级管理员对话框 -->
    <el-dialog
      v-model="createSuperAdminDialogVisible"
      :title="t('adminUser.createSuperAdmin')"
      width="70%"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <AdminUserForm
        mode="superAdmin"
        :loading="formLoading"
        @submit="handleCreateSuperAdminSubmit"
        @cancel="handleCreateSuperAdminCancel"
      />
    </el-dialog>

    <!-- 编辑管理员对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="t('adminUser.editAdminUser')"
      width="70%"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <AdminUserForm
        v-if="currentEditUser"
        mode="update"
        :admin-user="currentEditUser"
        :loading="formLoading"
        @submit="handleEditSubmit"
        @cancel="handleEditCancel"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-user-container {
  padding: 20px;
}

.admin-user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-user-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.admin-user-card {
  margin-bottom: 20px;
}

.admin-user-search {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>

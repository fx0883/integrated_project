<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAdminUserStoreHook } from "@/store/modules/adminUser";
import { useUserStoreHook } from "@/store/modules/user";
import { ArrowDown } from "@element-plus/icons-vue";
import ConfirmDialog from "@/components/AdminUserManagement/ConfirmDialog.vue";
import AdminUserForm from "@/components/AdminUserManagement/AdminUserForm.vue";
import TenantSelectDialog from "@/components/AdminUserManagement/TenantSelectDialog.vue";
import MenuSettingButton from "@/components/AdminUserManagement/MenuSettingButton.vue";
import MenuSettingDialog from "@/components/AdminUserManagement/MenuSettingDialog.vue";
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
const confirmDialog = ref({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null
});

// 监视分页参数变化
watch(
  () => pagination.currentPage,
  newPage => {
    if (newPage) {
      fetchAdminUsers();
    }
  }
);

watch(
  () => pagination.pageSize,
  newSize => {
    if (newSize) {
      pagination.currentPage = 1; // 当每页条数变化时，重置为第一页
      fetchAdminUsers();
    }
  }
);

// 监视confirmDialog.visible的变化
watch(
  () => confirmDialog.visible,
  newVal => {
    logger.debug("confirmDialog.visible 变化为:", newVal, confirmDialog.title);
  }
);

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
    label: t("labels.allRole")
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
const viewDialogVisible = ref(false);
const currentEditUser = ref<AdminUser | null>(null);
const currentViewUser = ref<AdminUser | null>(null);

// 表单加载状态
const formLoading = computed(() => {
  return (
    adminUserStore.loading.create ||
    adminUserStore.loading.update ||
    adminUserStore.loading.createSuperAdmin
  );
});

// 在script部分中添加租户选择对话框状态
const tenantSelectDialogVisible = ref(false);
const userToRevoke = ref<AdminUser | null>(null);

// 添加菜单设置相关状态
const menuSettingDialogVisible = ref(false);
const userForMenuSetting = ref<AdminUser | null>(null);

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
  logger.debug("删除管理员用户被点击", {
    userId: row.id,
    username: row.username
  });
  confirmDialog.title = t("adminUser.confirmDelete");
  confirmDialog.content = t("adminUser.confirmDeleteMessage", {
    username: row.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      logger.debug("确认删除管理员用户", { userId: row.id });
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
  if (!row || !row.id) {
    logger.error("撤销超级管理员权限失败：无效的用户数据", row);
    ElMessage.error("操作失败：无效的用户数据");
    return;
  }

  logger.debug("撤销超级管理员权限被点击", {
    userId: row.id,
    username: row.username
  });

  // 保存要撤销权限的用户
  userToRevoke.value = row;

  // 显示租户选择对话框
  tenantSelectDialogVisible.value = true;
  logger.debug("设置租户选择对话框显示", tenantSelectDialogVisible.value);
};

// 处理租户选择确认
const handleTenantSelectConfirm = async (tenantId: number) => {
  if (!userToRevoke.value) {
    logger.warn("租户选择确认时，userToRevoke已为null");
    return;
  }

  // 立即保存关键用户数据，避免后续引用问题
  const userId = userToRevoke.value.id;
  const username = userToRevoke.value.username;

  logger.debug("已选择租户，准备撤销超级管理员权限", {
    userId,
    username,
    tenantId
  });

  confirmDialog.title = t("adminUser.confirmRevokeSuperAdmin");
  confirmDialog.content = t("adminUser.confirmRevokeSuperAdminMessage", {
    username
  });
  confirmDialog.type = "warning";

  // 使用闭包保存当前的userId和tenantId
  confirmDialog.confirmAction = async () => {
    try {
      logger.debug("确认撤销超级管理员权限", {
        userId, // 使用闭包中保存的userId
        tenantId
      });

      // 使用闭包中保存的userId，避免依赖可能为null的userToRevoke.value
      await useAdminUserStoreHook().revokeSuperAdminAction(userId, tenantId);
      ElMessage.success(t("adminUser.revokeSuccess"));
      fetchAdminUsers();
    } catch (error) {
      logger.error("撤销超级管理员权限失败", error);
      ElMessage.error(t("adminUser.revokeFailed"));
    } finally {
      // 在操作完成后清空userToRevoke
      userToRevoke.value = null;
    }
  };

  confirmDialog.visible = true;
  logger.debug(
    "设置确认对话框显示",
    confirmDialog.visible,
    confirmDialog.title
  );
};

// 处理租户选择取消
const handleTenantSelectCancel = () => {
  logger.debug("租户选择已取消");
  userToRevoke.value = null;
};

// 处理激活账号
const handleActivate = (row: AdminUser) => {
  confirmDialog.title = t("adminUser.confirmActivate");
  confirmDialog.content = t("adminUser.confirmActivateMessage", {
    username: row.username
  });
  confirmDialog.type = "warning";
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
  logger.debug("停用管理员账号被点击", {
    userId: row.id,
    username: row.username
  });
  confirmDialog.title = t("adminUser.confirmDeactivate");
  confirmDialog.content = t("adminUser.confirmDeactivateMessage", {
    username: row.username
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      logger.debug("确认停用管理员账号", { userId: row.id });
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
  logger.debug("确认对话框确认按钮被点击", {
    dialogTitle: confirmDialog.title,
    hasConfirmAction: !!confirmDialog.confirmAction
  });
  logger.debug("确认对话框确认按钮被点击", confirmDialog);

  if (confirmDialog.confirmAction) {
    logger.debug("执行确认操作");
    try {
      await confirmDialog.confirmAction();
      logger.debug("确认操作执行成功");
    } catch (error) {
      logger.error("确认操作执行失败", error);
    }
  } else {
    logger.warn("确认对话框没有关联确认操作");
  }
};

// 编辑管理员
const handleEdit = (row: AdminUser) => {
  currentEditUser.value = { ...row };
  editDialogVisible.value = true;
};

// 查看管理员详情
const handleView = (row: AdminUser) => {
  currentViewUser.value = { ...row };
  viewDialogVisible.value = true;
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

// 关闭查看对话框
const handleViewCancel = () => {
  viewDialogVisible.value = false;
  currentViewUser.value = null;
};

// 获取状态标签类型
const getStatusTagType = (status: AdminUserStatus | string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    default:
      return "info";
  }
};

// 处理下拉菜单可见性变化
const handleDropdownVisibleChange = (visible: boolean, row: AdminUser) => {
  if (visible) {
    logger.debug("管理员用户更多操作菜单已打开", {
      userId: row.id,
      username: row.username,
      isSuperAdmin: row.is_super_admin
    });
  }
};

// 格式化时间
const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) return "-";
  const date = new Date(dateTimeString);
  return date.toLocaleString();
};

// 处理菜单设置点击
const handleMenuSetting = (row: AdminUser) => {
  logger.debug("菜单设置按钮被点击", {
    userId: row.id,
    username: row.username,
    timestamp: new Date().getTime()
  });

  // 先设置用户数据，再设置对话框状态
  userForMenuSetting.value = row;

  // 添加延迟，避免可能的重复渲染和事件循环
  setTimeout(() => {
    menuSettingDialogVisible.value = true;
    logger.debug("菜单设置对话框状态已设置", {
      visible: menuSettingDialogVisible.value,
      userId: row.id,
      username: row.username,
      timestamp: new Date().getTime()
    });
  }, 0);
};

// 处理菜单设置完成
const handleMenuSettingDone = () => {
  logger.debug("菜单设置完成");
  menuSettingDialogVisible.value = false;
  userForMenuSetting.value = null;
  // 这里不需要刷新列表，因为菜单设置不影响列表显示
};

// 处理菜单设置取消
const handleMenuSettingCancel = () => {
  logger.debug("菜单设置取消");
  menuSettingDialogVisible.value = false;
  userForMenuSetting.value = null;
};

// 初始化时输出操作权限信息
onMounted(() => {
  fetchAdminUsers();
  logger.debug("当前用户超级管理员权限状态", {
    isSuperAdmin: isSuperAdmin.value
  });
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
        v-loading="tableLoading"
        :data="adminUsers"
        border
        style="width: 100%"
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
            <el-tag v-if="scope.row.is_super_admin" type="danger">
              {{ t("adminUser.superAdmin") }}
            </el-tag>
            <el-tag v-else type="primary">
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
          width="330"
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
            <MenuSettingButton
              :user="scope.row"
              @click="user => handleMenuSetting(user)"
            />
            <el-dropdown
              trigger="click"
              @visible-change="
                visible => handleDropdownVisibleChange(visible, scope.row)
              "
            >
              <el-button size="small">
                {{ t("buttons.more")
                }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
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
        />
      </div>
    </el-card>

    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      destroy-on-close
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

    <!-- 租户选择对话框 -->
    <TenantSelectDialog
      v-model:visible="tenantSelectDialogVisible"
      :title="t('adminUser.selectTenantTitle')"
      destroy-on-close
      @confirm="handleTenantSelectConfirm"
      @cancel="handleTenantSelectCancel"
    />

    <!-- 查看管理员对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="t('adminUser.viewAdminUser')"
      width="70%"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <AdminUserForm
        v-if="currentViewUser"
        mode="view"
        :admin-user="currentViewUser"
        :loading="false"
        :readonly="true"
        @cancel="handleViewCancel"
      />
    </el-dialog>

    <!-- 菜单设置对话框 -->
    <MenuSettingDialog
      v-model:visible="menuSettingDialogVisible"
      :user-id="userForMenuSetting?.id || 0"
      :username="userForMenuSetting?.username || ''"
      @confirm="handleMenuSettingDone"
      @cancel="handleMenuSettingCancel"
    />
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

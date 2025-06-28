<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import { useTenantStoreHook } from "@/store/modules/tenant";
import type {
  Tenant,
  TenantStatus,
  TenantListParams,
  TenantCreateUpdateParams
} from "@/types/tenant";
import ConfirmDialog from "@/components/TenantManagement/ConfirmDialog.vue";
import TenantForm from "@/components/TenantManagement/TenantForm.vue";
import { useUserStoreHook } from "@/store/modules/user";
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

// 表格加载状态
const tableLoading = computed(() => tenantStore.loading.list);
// 表格数据
const tenantList = computed(() => tenantStore.tenantList.data);
// 分页信息
const pagination = reactive({
  total: computed(() => tenantStore.tenantList.total),
  currentPage: 1,
  pageSize: 10
});

// 搜索条件
const searchForm = reactive({
  search: "",
  status: "all"
});

// 状态选项
const statusOptions = [
  {
    value: "all",
    label: t("tenant.statusAll")
  },
  {
    value: "active",
    label: t("tenant.statusActive")
  },
  {
    value: "suspended",
    label: t("tenant.statusSuspended")
  },
  {
    value: "deleted",
    label: t("tenant.statusDeleted")
  }
];

// 状态标签类型映射
const statusTagType = (status: TenantStatus) => {
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

// 创建租户对话框相关状态
const createTenantDialog = reactive({
  visible: false,
  loading: false
});

// 编辑租户对话框相关状态
const editTenantDialog = reactive({
  visible: false,
  loading: false,
  currentTenant: null as Tenant | null
});

// 创建租户
const handleCreateTenant = () => {
  createTenantDialog.visible = true;
};

// 提交租户创建表单
const handleCreateSubmit = async (formData: TenantCreateUpdateParams) => {
  createTenantDialog.loading = true;
  try {
    await tenantStore.createNewTenant(formData);
    ElMessage.success(t("tenant.createSuccess"));
    createTenantDialog.visible = false;
    // 刷新租户列表
    fetchTenantList();
  } catch (error) {
    logger.error("创建租户失败", error);
    ElMessage.error(t("tenant.createFailed"));
  } finally {
    createTenantDialog.loading = false;
  }
};

// 取消创建租户
const handleCreateCancel = () => {
  createTenantDialog.visible = false;
};

// 编辑租户
const handleEditTenant = async (tenant: Tenant) => {
  editTenantDialog.loading = true;
  editTenantDialog.visible = true;
  try {
    await tenantStore.fetchTenantDetail(tenant.id);
    editTenantDialog.currentTenant = tenantStore.currentTenant;
  } catch (error) {
    logger.error("获取租户详情失败", error);
    ElMessage.error("获取租户详情失败");
    editTenantDialog.visible = false;
  } finally {
    editTenantDialog.loading = false;
  }
};

// 提交租户编辑表单
const handleEditSubmit = async (formData: TenantCreateUpdateParams) => {
  editTenantDialog.loading = true;
  try {
    if (editTenantDialog.currentTenant) {
      await tenantStore.updateTenantInfo(
        editTenantDialog.currentTenant.id,
        formData
      );
      ElMessage.success(t("tenant.updateSuccess"));
      editTenantDialog.visible = false;
      // 刷新租户列表
      fetchTenantList();
    }
  } catch (error) {
    logger.error("更新租户失败", error);
    ElMessage.error(t("tenant.updateFailed"));
  } finally {
    editTenantDialog.loading = false;
  }
};

// 取消编辑租户
const handleEditCancel = () => {
  editTenantDialog.visible = false;
};

// 获取租户列表
const fetchTenantList = async () => {
  const params: TenantListParams = {
    page: pagination.currentPage,
    page_size: pagination.pageSize,
    search: searchForm.search || undefined
  };

  if (searchForm.status !== "all") {
    params.status = searchForm.status;
  }

  await tenantStore.fetchTenantList(params);
};

// 重置筛选条件
const resetSearch = () => {
  searchForm.search = "";
  searchForm.status = "all";
  pagination.currentPage = 1;
  fetchTenantList();
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchTenantList();
};

// 处理页码变化
const handleCurrentPageChange = (page: number) => {
  pagination.currentPage = page;
  fetchTenantList();
};

// 处理每页条数变化
const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchTenantList();
};

// 查看租户详情
const handleViewTenant = (tenant: Tenant) => {
  router.push(`/tenant/detail/${tenant.id}`);
};

// 删除租户
const handleDeleteTenant = (tenant: Tenant) => {
  openConfirmDialog(
    t("tenant.confirmDelete"),
    t("tenant.confirmDeleteMessage", { name: tenant.name }),
    "danger",
    async () => {
      try {
        await tenantStore.removeTenant(tenant.id);
        ElMessage.success(t("tenant.deleteSuccess"));
      } catch (error) {
        logger.error("删除租户失败", error);
        ElMessage.error(t("tenant.deleteFailed"));
        throw error;
      }
    }
  );
};

// 暂停租户
const handleSuspendTenant = (tenant: Tenant) => {
  openConfirmDialog(
    t("tenant.confirmSuspend"),
    t("tenant.confirmSuspendMessage", { name: tenant.name }),
    "warning",
    async () => {
      try {
        await tenantStore.suspendTenantAction(tenant.id);
        ElMessage.success(t("tenant.suspendSuccess"));
      } catch (error) {
        logger.error("暂停租户失败", error);
        ElMessage.error(t("tenant.suspendFailed"));
        throw error;
      }
    }
  );
};

// 激活租户
const handleActivateTenant = (tenant: Tenant) => {
  openConfirmDialog(
    t("tenant.confirmActivate"),
    t("tenant.confirmActivateMessage", { name: tenant.name }),
    "info",
    async () => {
      try {
        await tenantStore.activateTenantAction(tenant.id);
        ElMessage.success(t("tenant.activateSuccess"));
      } catch (error) {
        logger.error("激活租户失败", error);
        ElMessage.error(t("tenant.activateFailed"));
        throw error;
      }
    }
  );
};

// 监视分页参数变化
watch(
  () => pagination.currentPage,
  newPage => {
    if (newPage) {
      fetchTenantList();
    }
  }
);

watch(
  () => pagination.pageSize,
  newSize => {
    if (newSize) {
      pagination.currentPage = 1; // 当每页条数变化时，重置为第一页
      fetchTenantList();
    }
  }
);

// 获取租户列表
onMounted(async () => {
  if (isSuperAdmin.value) {
    await fetchTenantList();
  }
});
</script>

<template>
  <div class="tenant-container">
    <div class="tenant-header">
      <h2 class="tenant-title">{{ t("tenant.management") }}</h2>
      <div class="tenant-actions">
        <el-button
          type="primary"
          @click="handleCreateTenant"
          v-if="isSuperAdmin"
        >
          {{ t("tenant.create") }}
        </el-button>
      </div>
    </div>

    <div class="tenant-search">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.search"
            :placeholder="t('tenant.search')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" style="width: 200px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            {{ t("tenant.search") }}
          </el-button>
          <el-button @click="resetSearch">
            {{ t("tenant.cancel") }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      :data="tenantList"
      style="width: 100%"
      v-loading="tableLoading"
      border
      stripe
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" :label="t('tenant.name')" min-width="180" />
      <el-table-column :label="t('tenant.status')" width="120">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)" effect="light">
            {{
              t(
                `tenant.status${scope.row.status.charAt(0).toUpperCase() + scope.row.status.slice(1)}`
              )
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="contact_name"
        :label="t('tenant.contactName')"
        min-width="120"
      />
      <el-table-column
        prop="contact_email"
        :label="t('tenant.contactEmail')"
        min-width="180"
      />
      <el-table-column
        prop="created_at"
        :label="t('tenant.createdAt')"
        width="180"
      />
      <el-table-column :label="t('tenant.actions')" width="230" fixed="right">
        <template #default="scope">
          <el-button
            @click="handleViewTenant(scope.row)"
            type="primary"
            size="small"
            plain
            style="margin-right: 8px"
          >
            {{ t("tenant.view") }}
          </el-button>
          <el-button
            @click="handleEditTenant(scope.row)"
            type="primary"
            size="small"
            style="margin-right: 8px"
          >
            {{ t("tenant.editBtn") }}
          </el-button>
          <el-dropdown>
            <el-button type="info" size="small" plain>
              {{ t("tenant.actions") }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="scope.row.status === 'active'"
                  @click="handleSuspendTenant(scope.row)"
                >
                  {{ t("tenant.suspend") }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="scope.row.status === 'suspended'"
                  @click="handleActivateTenant(scope.row)"
                >
                  {{ t("tenant.activate") }}
                </el-dropdown-item>
                <el-dropdown-item
                  divided
                  @click="handleDeleteTenant(scope.row)"
                >
                  {{ t("tenant.delete") }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:currentPage="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      />
    </div>

    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />

    <!-- 创建租户对话框 -->
    <el-dialog
      v-model="createTenantDialog.visible"
      :title="t('tenant.createTenant')"
      width="50%"
      append-to-body
      destroy-on-close
    >
      <TenantForm
        mode="create"
        :loading="createTenantDialog.loading"
        @submit="handleCreateSubmit"
        @cancel="handleCreateCancel"
      />
    </el-dialog>

    <!-- 编辑租户对话框 -->
    <el-dialog
      v-model="editTenantDialog.visible"
      :title="t('tenant.editTenant')"
      width="50%"
      append-to-body
      destroy-on-close
    >
      <TenantForm
        mode="edit"
        :loading="editTenantDialog.loading"
        :tenant="editTenantDialog.currentTenant"
        @submit="handleEditSubmit"
        @cancel="handleEditCancel"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.tenant-container {
  padding: 20px;
}

.tenant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tenant-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.tenant-search {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

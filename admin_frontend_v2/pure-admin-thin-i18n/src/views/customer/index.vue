<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import { useCustomerStoreHook } from "@/store/modules/customer";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import type {
  Customer,
  CustomerStatus,
  CustomerValueLevel,
  CustomerType,
  CustomerListParams,
  CustomerCreateUpdateParams
} from "@/types/customer";
import {
  CustomerStatusTag,
  CustomerValueTag,
  ConfirmDialog,
  CustomerForm,
  CustomerMembersSubTable
} from "@/components/CustomerManagement";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const customerStore = useCustomerStoreHook();
const userStore = useUserStoreHook();

// 检查用户是否有管理权限
const hasManagePermission = computed(
  () => userStore.is_super_admin || hasPerms("customer:manage")
);

// 表格加载状态
const tableLoading = computed(() => customerStore.loading.list);
// 表格数据
const customerList = computed(() => customerStore.customerList.data);
// 分页信息
const pagination = reactive({
  total: computed(() => customerStore.customerList.total),
  currentPage: 1,
  pageSize: 10,
  totalPages: computed(
    () =>
      customerStore.customerList.total_pages ||
      Math.ceil(customerStore.customerList.total / pagination.pageSize)
  )
});

// 搜索条件
const searchForm = reactive({
  search: "",
  status: "all",
  type: "all",
  value_level: "all"
});

// 状态选项
const statusOptions = [
  {
    value: "all",
    label: t("common.all")
  },
  {
    value: "active",
    label: t("customer.statusActive")
  },
  {
    value: "inactive",
    label: t("customer.statusInactive")
  },
  {
    value: "prospect",
    label: t("customer.statusProspect")
  },
  {
    value: "churned",
    label: t("customer.statusChurned")
  }
];

// 客户类型选项
const typeOptions = [
  {
    value: "all",
    label: t("common.all")
  },
  {
    value: "enterprise",
    label: t("customer.typeEnterprise")
  },
  {
    value: "government",
    label: t("customer.typeGovernment")
  },
  {
    value: "education",
    label: t("customer.typeEducation")
  },
  {
    value: "nonprofit",
    label: t("customer.typeNonprofit")
  },
  {
    value: "individual",
    label: t("customer.typeIndividual")
  }
];

// 价值等级选项
const valueLevelOptions = [
  {
    value: "all",
    label: t("common.all")
  },
  {
    value: "platinum",
    label: t("customer.valuePlatinum")
  },
  {
    value: "gold",
    label: t("customer.valueGold")
  },
  {
    value: "silver",
    label: t("customer.valueSilver")
  },
  {
    value: "bronze",
    label: t("customer.valueBronze")
  }
];

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

// 创建客户对话框状态
const createDialogVisible = ref(false);
const createLoading = computed(() => customerStore.loading.create);

// 查看客户对话框状态
const viewDialogVisible = ref(false);
const viewLoading = ref(false);
const currentViewCustomer = ref<Customer | null>(null);

// 编辑客户对话框状态
const editDialogVisible = ref(false);
const editLoading = computed(() => customerStore.loading.update);
const currentEditCustomer = ref<Customer | null>(null);

// 表格展开行
const expandedRows = ref<number[]>([]);
const memberRelationsLoading = computed(
  () => customerStore.loading.memberRelations
);

// 获取客户列表
const fetchCustomerList = async () => {
  try {
    const params: CustomerListParams = {
      page: pagination.currentPage,
      limit: pagination.pageSize
    };

    // 添加搜索条件
    if (searchForm.search) {
      params.search = searchForm.search;
    }
    if (searchForm.status !== "all") {
      params.status = searchForm.status as CustomerStatus;
    }
    if (searchForm.type !== "all") {
      params.type = searchForm.type as CustomerType;
    }
    if (searchForm.value_level !== "all") {
      params.value_level = searchForm.value_level as CustomerValueLevel;
    }

    await customerStore.fetchCustomerList(params);
  } catch (error) {
    logger.error("获取客户列表失败", error);
    ElMessage.error(t("customer.fetchFailed"));
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchCustomerList();
};

// 重置搜索
const handleResetSearch = () => {
  searchForm.search = "";
  searchForm.status = "all";
  searchForm.type = "all";
  searchForm.value_level = "all";
  pagination.currentPage = 1;
  fetchCustomerList();
};

// 页码变化
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchCustomerList();
};

// 每页条数变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchCustomerList();
};

// 打开创建客户对话框
const handleCreateCustomer = () => {
  createDialogVisible.value = true;
};

// 提交创建客户表单
const handleCreateSubmit = async (formData: CustomerCreateUpdateParams) => {
  try {
    await customerStore.createNewCustomer(formData);
    ElMessage.success(t("customer.createSuccess"));
    createDialogVisible.value = false;
    // 刷新列表
    fetchCustomerList();
  } catch (error) {
    logger.error("创建客户失败", error);
    ElMessage.error(t("customer.createFailed"));
  }
};

// 取消创建客户
const handleCreateCancel = () => {
  createDialogVisible.value = false;
};

// 查看客户详情
const handleViewCustomer = async (customer: Customer) => {
  currentViewCustomer.value = customer;
  viewDialogVisible.value = true;
};

// 编辑客户
const handleEditCustomer = async (customer: Customer) => {
  currentEditCustomer.value = customer;
  editDialogVisible.value = true;
};

// 提交编辑客户表单
const handleEditSubmit = async (formData: CustomerCreateUpdateParams) => {
  if (!currentEditCustomer.value) return;

  try {
    await customerStore.updateCustomerInfo(
      currentEditCustomer.value.id,
      formData
    );
    ElMessage.success(t("customer.updateSuccess"));
    editDialogVisible.value = false;
    // 刷新列表
    fetchCustomerList();
  } catch (error) {
    logger.error("更新客户失败", error);
    ElMessage.error(t("customer.updateFailed"));
  }
};

// 取消编辑客户
const handleEditCancel = () => {
  editDialogVisible.value = false;
};

// 取消查看客户
const handleViewCancel = () => {
  viewDialogVisible.value = false;
};

// 删除客户
const handleDeleteCustomer = (customer: Customer) => {
  openConfirmDialog(
    t("customer.deleteCustomer"),
    t("customer.deleteCustomerConfirm", { name: customer.name }),
    "danger",
    async () => {
      try {
        await customerStore.removeCustomer(customer.id);
        ElMessage.success(t("customer.deleteSuccess"));
        // 如果当前页只有一条数据，且不是第一页，则跳转到上一页
        if (customerList.value.length === 1 && pagination.currentPage > 1) {
          pagination.currentPage--;
        }
        fetchCustomerList();
      } catch (error) {
        logger.error("删除客户失败", error);
        ElMessage.error(t("customer.deleteFailed"));
      }
    }
  );
};

// 批量删除客户
const selectedCustomerIds = ref<number[]>([]);

// 表格选择变化
const handleSelectionChange = (selection: Customer[]) => {
  selectedCustomerIds.value = selection.map(item => item.id);
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedCustomerIds.value.length === 0) {
    ElMessage.warning(t("customer.noCustomerSelected"));
    return;
  }

  openConfirmDialog(
    t("customer.batchDeleteCustomer"),
    t("customer.batchDeleteCustomerConfirm", {
      count: selectedCustomerIds.value.length
    }),
    "danger",
    async () => {
      try {
        await customerStore.batchDeleteCustomers(selectedCustomerIds.value);
        ElMessage.success(t("customer.batchDeleteSuccess"));
        selectedCustomerIds.value = [];
        // 刷新列表
        fetchCustomerList();
      } catch (error) {
        logger.error("批量删除客户失败", error);
        ElMessage.error(t("customer.batchDeleteFailed"));
      }
    }
  );
};

// 获取会员关系
const fetchMemberRelations = async (customerId: number) => {
  try {
    await customerStore.fetchCustomerMemberRelations(customerId);
  } catch (error) {
    logger.error("获取客户会员关系失败", error);
    ElMessage.error(t("customer.member.fetchFailed"));
  }
};

// 表格展开行变化
const handleExpandChange = (row: Customer, expanded: boolean) => {
  if (expanded) {
    // 加载会员关系数据
    fetchMemberRelations(row.id);
    // 添加到已展开行
    if (!expandedRows.value.includes(row.id)) {
      expandedRows.value.push(row.id);
    }
  } else {
    // 从已展开行中移除
    expandedRows.value = expandedRows.value.filter(id => id !== row.id);
  }
};

// 刷新会员关系
const handleRefreshMemberRelations = (customerId: number) => {
  fetchMemberRelations(customerId);
};

// 初始化
onMounted(() => {
  fetchCustomerList();
});
</script>

<template>
  <div class="customer-list-container">
    <div class="customer-list-header">
      <h2 class="customer-list-title">{{ t("customer.customerList") }}</h2>
      <div class="customer-list-actions">
        <el-button
          v-if="hasManagePermission"
          type="primary"
          @click="handleCreateCustomer"
        >
          {{ t("customer.createCustomer") }}
        </el-button>
      </div>
    </div>

    <el-card class="customer-list-search">
      <el-form
        :inline="true"
        :model="searchForm"
        class="search-form form-with-label-margin"
        label-position="right"
      >
        <el-form-item :label="t('customer.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('customer.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item :label="t('customer.status')">
          <el-select v-model="searchForm.status" class="w-150">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('customer.type')">
          <el-select v-model="searchForm.type" class="w-150">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('customer.valueLevel')">
          <el-select v-model="searchForm.value_level" class="w-150">
            <el-option
              v-for="item in valueLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            {{ t("common.search") }}
          </el-button>
          <el-button @click="handleResetSearch">
            {{ t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="customer-list-table">
      <div class="table-toolbar">
        <div class="table-toolbar-title">
          {{ t("customer.customerList") }}
          <span class="table-toolbar-count"> ({{ pagination.total }}) </span>
        </div>
        <div class="table-toolbar-actions">
          <el-button
            v-if="hasManagePermission && selectedCustomerIds.length > 0"
            type="danger"
            size="small"
            @click="handleBatchDelete"
          >
            {{ t("customer.batchDelete") }}
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="tableLoading"
        :data="customerList"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <CustomerMembersSubTable
              :customer-id="row.id"
              :member-relations="
                customerStore.getCustomerMemberRelationsByCustomerId(row.id)
              "
              :loading="memberRelationsLoading"
              @refresh="() => handleRefreshMemberRelations(row.id)"
            />
          </template>
        </el-table-column>

        <el-table-column
          v-if="hasManagePermission"
          type="selection"
          width="55"
          align="center"
        />
        <el-table-column
          prop="id"
          :label="t('customer.id')"
          width="80"
          align="center"
        />
        <el-table-column
          prop="name"
          :label="t('customer.name')"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          prop="type"
          :label="t('customer.type')"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            {{
              t(
                `customer.type${row.type.charAt(0).toUpperCase() + row.type.slice(1)}`
              )
            }}
          </template>
        </el-table-column>
        <el-table-column
          prop="value_level"
          :label="t('customer.valueLevel')"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <CustomerValueTag :value-level="row.value_level" />
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          :label="t('customer.status')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <CustomerStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column
          prop="industry"
          :label="t('customer.industry')"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          prop="created_at"
          :label="t('customer.createdAt')"
          width="180"
          align="center"
          sortable
        >
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column
          :label="t('common.actions')"
          width="200"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewCustomer(row)"
            >
              {{ t("common.view") }}
            </el-button>
            <el-button
              v-if="hasManagePermission"
              type="primary"
              size="small"
              link
              @click="handleEditCustomer(row)"
            >
              {{ t("common.edit") }}
            </el-button>
            <el-button
              v-if="hasManagePermission"
              type="danger"
              size="small"
              link
              @click="handleDeleteCustomer(row)"
            >
              {{ t("common.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          :pager-count="pagination.totalPages"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建客户对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      :title="t('customer.createCustomer')"
      width="60%"
      destroy-on-close
    >
      <CustomerForm
        mode="create"
        :loading="createLoading"
        @submit="handleCreateSubmit"
        @cancel="handleCreateCancel"
      />
    </el-dialog>

    <!-- 查看客户对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="t('customer.viewCustomer')"
      width="60%"
      destroy-on-close
    >
      <CustomerForm
        v-if="currentViewCustomer"
        mode="view"
        :customer="currentViewCustomer"
        :loading="viewLoading"
        @cancel="handleViewCancel"
      />
    </el-dialog>

    <!-- 编辑客户对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="t('customer.editCustomer')"
      width="60%"
      destroy-on-close
    >
      <CustomerForm
        v-if="currentEditCustomer"
        mode="edit"
        :customer="currentEditCustomer"
        :loading="editLoading"
        @submit="handleEditSubmit"
        @cancel="handleEditCancel"
      />
    </el-dialog>

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
.customer-list-container {
  padding: 20px;
}

.customer-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.customer-list-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.customer-list-search {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.w-150 {
  width: 150px;
}

.customer-list-table {
  margin-bottom: 20px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-toolbar-title {
  font-size: 16px;
  font-weight: 500;
}

.table-toolbar-count {
  font-size: 14px;
  color: #909399;
  margin-left: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-with-label-margin :deep(.el-form-item__label) {
  padding-right: 24px;
}
</style>

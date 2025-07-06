<template>
  <div class="member-container">
    <!-- 搜索和筛选区域 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.search"
            :placeholder="$t('member.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-select
            v-model="searchForm.status"
            :placeholder="$t('member.statusFilterPlaceholder')"
            clearable
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isSuperAdmin">
          <el-select
            v-model="searchForm.tenant_id"
            :placeholder="$t('member.tenantFilterPlaceholder')"
            clearable
            filterable
            remote
            :remote-method="remoteTenantSearch"
            :loading="tenantLoading"
          >
            <el-option
              v-for="item in tenantOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            {{ $t("common.search") }}
          </el-button>
          <el-button @click="resetSearch">
            {{ $t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="left">
        <el-button
          type="primary"
          @click="handleCreate"
          v-if="hasManagePermission"
        >
          <el-icon><Plus /></el-icon>
          {{ $t("member.createMember") }}
        </el-button>
        <el-button
          type="danger"
          @click="handleBulkDelete"
          :disabled="!selectedRows.length"
          v-if="hasManagePermission"
        >
          <el-icon><Delete /></el-icon>
          {{ $t("member.bulkDelete") }}
        </el-button>
      </div>
      <div class="right">
        <el-button
          :icon="Refresh"
          circle
          @click="refreshTable"
          :loading="tableLoading"
        />
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      ref="tableRef"
      v-loading="tableLoading"
      :data="memberList"
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column
        :label="$t('member.username')"
        prop="username"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('member.name')"
        prop="name"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('member.email')"
        prop="email"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('member.phone')"
        prop="phone"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('member.status')"
        prop="status"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <MemberStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('member.tenant')"
        prop="tenant_name"
        min-width="150"
        show-overflow-tooltip
        v-if="isSuperAdmin"
      />
      <el-table-column
        :label="$t('member.createdAt')"
        prop="created_at"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('common.operations')"
        width="200"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleView(row)">
            {{ $t("common.detail") }}
          </el-button>
          <el-button
            link
            type="primary"
            size="small"
            @click="handleEdit(row)"
            v-if="hasManagePermission"
          >
            {{ $t("common.edit") }}
          </el-button>
          <el-button
            link
            type="danger"
            size="small"
            @click="handleDelete(row)"
            v-if="hasManagePermission"
          >
            {{ $t("common.delete") }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      :confirm-text="$t('common.confirm')"
      :cancel-text="$t('common.cancel')"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus, Delete, Refresh } from "@element-plus/icons-vue";
import { useMemberStoreHook } from "@/store/modules/member";
import { useTenantStoreHook } from "@/store/modules/tenant";
import { useUserStoreHook } from "@/store/modules/user";
import { hasPerms } from "@/utils/auth";
import type { Member, MemberStatus } from "@/types/member";
import { MemberStatusTag, ConfirmDialog } from "@/components/MemberManagement";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const memberStore = useMemberStoreHook();
const tenantStore = useTenantStoreHook();
const userStore = useUserStoreHook();

// 检查用户是否有管理权限
const hasManagePermission = computed(
  () => userStore.is_super_admin || hasPerms("member:manage")
);

// 是否为超级管理员
const isSuperAdmin = computed(() => userStore.is_super_admin);

// 表格引用
const tableRef = ref();

// 表格加载状态
const tableLoading = computed(() => memberStore.isLoading("list"));

// 表格数据
const memberList = computed(() => memberStore.getMembers);

// 分页信息
const pagination = reactive({
  total: computed(() => memberStore.memberList.total),
  currentPage: 1,
  pageSize: 10,
  totalPages: computed(
    () =>
      memberStore.memberList.total_pages ||
      Math.ceil(memberStore.memberList.total / pagination.pageSize)
  )
});

// 搜索条件
const searchForm = reactive({
  search: "",
  status: "" as MemberStatus | "",
  tenant_id: undefined as number | undefined
});

// 状态选项
const statusOptions = [
  {
    value: "active",
    label: t("member.statusActive")
  },
  {
    value: "inactive",
    label: t("member.statusInactive")
  },
  {
    value: "locked",
    label: t("member.statusLocked")
  },
  {
    value: "pending",
    label: t("member.statusPending")
  }
];

// 租户加载状态
const tenantLoading = ref(false);

// 租户选项
const tenantOptions = ref<Array<{ value: number; label: string }>>([]);

// 选中的行
const selectedRows = ref<Member[]>([]);

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

// 获取会员列表
const fetchMemberList = async () => {
  try {
    const params: any = {
      page: pagination.currentPage,
      page_size: pagination.pageSize
    };

    // 添加搜索条件
    if (searchForm.search) {
      params.search = searchForm.search;
    }
    if (searchForm.status) {
      params.status = searchForm.status;
    }
    if (searchForm.tenant_id) {
      params.tenant_id = searchForm.tenant_id;
    }

    await memberStore.fetchMemberList(params);
  } catch (error) {
    logger.error("获取会员列表失败", error);
  }
};

// 刷新表格
const refreshTable = () => {
  fetchMemberList();
};

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchMemberList();
};

// 重置搜索
const resetSearch = () => {
  searchForm.search = "";
  searchForm.status = "";
  searchForm.tenant_id = undefined;
  pagination.currentPage = 1;
  fetchMemberList();
};

// 处理每页条数变化
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  fetchMemberList();
};

// 处理页码变化
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
  fetchMemberList();
};

// 处理选择行变化
const handleSelectionChange = (rows: Member[]) => {
  selectedRows.value = rows;
};

// 处理查看
const handleView = (row: Member) => {
  router.push(`/member/detail/${row.id}`);
};

// 处理编辑
const handleEdit = (row: Member) => {
  router.push(`/member/edit/${row.id}`);
};

// 处理创建
const handleCreate = () => {
  router.push("/member/create");
};

// 处理删除
const handleDelete = (row: Member) => {
  openConfirmDialog(
    t("member.deleteTitle"),
    t("member.deleteConfirm", { name: row.name }),
    "danger",
    async () => {
      try {
        await memberStore.removeMember(row.id);
        ElMessage.success(t("member.deleteSuccess"));
        if (pagination.currentPage > 1 && memberList.value.length === 1) {
          pagination.currentPage -= 1;
        }
        fetchMemberList();
      } catch (error) {
        logger.error("删除会员失败", error);
      }
    }
  );
};

// 处理批量删除
const handleBulkDelete = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning(t("common.noRowSelected"));
    return;
  }

  openConfirmDialog(
    t("member.bulkDeleteTitle"),
    t("member.bulkDeleteConfirm", { count: selectedRows.value.length }),
    "danger",
    async () => {
      try {
        const ids = selectedRows.value.map(row => row.id);
        await memberStore.bulkDeleteMembers(ids);
        ElMessage.success(t("member.bulkDeleteSuccess"));
        if (
          pagination.currentPage > 1 &&
          memberList.value.length === selectedRows.value.length
        ) {
          pagination.currentPage -= 1;
        }
        fetchMemberList();
        // 清空选择
        if (tableRef.value) {
          tableRef.value.clearSelection();
        }
      } catch (error) {
        logger.error("批量删除会员失败", error);
      }
    }
  );
};

// 远程搜索租户
const remoteTenantSearch = async (query: string) => {
  if (query) {
    tenantLoading.value = true;
    try {
      await tenantStore.fetchTenantList({ search: query, page: 1, limit: 10 });
      tenantOptions.value = tenantStore.tenantList.data.map(tenant => ({
        value: tenant.id,
        label: tenant.name
      }));
    } catch (error) {
      logger.error("搜索租户失败", error);
    } finally {
      tenantLoading.value = false;
    }
  } else {
    tenantOptions.value = [];
  }
};

// 初始化
onMounted(() => {
  fetchMemberList();
});
</script>

<style scoped>
.member-container {
  padding: 16px;
}

.search-bar {
  margin-bottom: 16px;
  background-color: var(--el-bg-color);
  padding: 16px;
  border-radius: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>

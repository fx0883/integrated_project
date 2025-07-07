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
            class="status-filter"
            @change="handleSearch"
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
            class="tenant-filter"
            @change="handleSearch"
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
          v-if="hasManagePermission"
          type="primary"
          @click="handleCreate"
        >
          <el-icon><Plus /></el-icon>
          {{ $t("member.createMember") }}
        </el-button>
        <el-button
          v-if="hasManagePermission"
          type="danger"
          :disabled="!selectedRows.length"
          @click="handleBulkDelete"
        >
          <el-icon><Delete /></el-icon>
          {{ $t("member.bulkDelete") }}
        </el-button>
      </div>
      <div class="right">
        <el-button
          :icon="Refresh"
          circle
          :loading="tableLoading"
          @click="refreshTable"
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
        prop="nick_name"
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
        v-if="isSuperAdmin"
        :label="$t('member.tenant')"
        prop="tenant_name"
        min-width="150"
        show-overflow-tooltip
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
            v-if="hasManagePermission"
            link
            type="primary"
            size="small"
            @click="handleEdit(row)"
          >
            {{ $t("common.edit") }}
          </el-button>
          <el-button
            v-if="hasManagePermission"
            link
            type="danger"
            size="small"
            @click="handleDelete(row)"
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

    <!-- 创建会员对话框 -->
    <el-dialog
      v-model="createDialog.visible"
      :title="$t('member.createMember')"
      width="650px"
      :close-on-click-modal="false"
      :close-on-press-escape="!createDialog.loading"
      :show-close="!createDialog.loading"
      @closed="handleCreateDialogClosed"
    >
      <MemberForm
        ref="createFormRef"
        :loading="createDialog.loading"
        :show-tenant-select="false"
        @submit="handleCreateSubmit"
        @cancel="createDialog.visible = false"
      />
    </el-dialog>

    <!-- 编辑会员对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      :title="$t('member.editMember')"
      width="650px"
      :close-on-click-modal="false"
      :close-on-press-escape="!editDialog.loading"
      :show-close="!editDialog.loading"
    >
      <MemberForm
        :loading="editDialog.loading"
        :member-data="editDialog.memberData"
        :is-edit="true"
        :show-tenant-select="false"
        @submit="handleEditSubmit"
        @cancel="editDialog.visible = false"
      />
    </el-dialog>
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
import type {
  Member,
  MemberStatus,
  MemberCreateUpdateParams
} from "@/types/member";
import {
  MemberStatusTag,
  ConfirmDialog,
  MemberForm
} from "@/components/MemberManagement";
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

// 创建表单引用
const createFormRef = ref();

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

// 创建会员对话框状态
const createDialog = reactive({
  visible: false,
  loading: false
});

// 编辑会员对话框状态
const editDialog = reactive({
  visible: false,
  loading: false,
  memberData: null as Member | null
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
const handleEdit = async (row: Member) => {
  editDialog.loading = true;
  editDialog.memberData = { ...row }; // 先使用表格中的数据，确保立即显示
  editDialog.visible = true;

  try {
    // 加载会员详情
    const response = await memberStore.fetchMemberDetail(row.id);
    if (response.success) {
      editDialog.memberData = memberStore.currentMember;
    }
  } catch (error) {
    logger.error("加载会员详情失败", error);
    ElMessage.error(t("member.loadDetailFailed"));
  } finally {
    editDialog.loading = false;
  }
};

// 处理编辑提交
const handleEditSubmit = async (data: MemberCreateUpdateParams) => {
  if (!editDialog.memberData?.id) return;

  editDialog.loading = true;
  try {
    // 如果有头像文件，先处理头像上传
    if (data.avatarFile) {
      const formData = new FormData();
      formData.append("avatar", data.avatarFile);

      // 先更新会员信息
      await memberStore.updateMemberInfo(editDialog.memberData.id, {
        username: data.username,
        nick_name: data.nick_name,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        status: data.status as MemberStatus,
        notes: data.notes
      });

      // 然后上传头像
      try {
        await memberStore.uploadMemberAvatar(
          editDialog.memberData.id,
          formData
        );
      } catch (error) {
        logger.error("上传头像失败，但会员信息已更新", error);
      }

      ElMessage.success(t("member.updateSuccess"));
      editDialog.visible = false;
      fetchMemberList();
    } else {
      // 没有头像，直接更新会员信息
      await memberStore.updateMemberInfo(editDialog.memberData.id, {
        username: data.username,
        nick_name: data.nick_name,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        status: data.status as MemberStatus,
        notes: data.notes
      });

      ElMessage.success(t("member.updateSuccess"));
      editDialog.visible = false;
      fetchMemberList();
    }
  } catch (error) {
    logger.error("更新会员失败", error);
  } finally {
    editDialog.loading = false;
  }
};

// 处理删除
const handleDelete = (row: Member) => {
  openConfirmDialog(
    t("member.deleteTitle"),
    t("member.deleteConfirm", { name: row.nick_name }),
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
      await tenantStore.fetchTenantList({
        search: query,
        page: 1,
        page_size: 10
      });
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

// 处理创建
const handleCreate = () => {
  createDialog.visible = true;
  // 延迟一帧，确保对话框已经打开并且MemberForm组件已经挂载
  setTimeout(() => {
    if (createFormRef.value) {
      createFormRef.value.resetForm();
    }
  }, 0);
};

// 处理创建对话框关闭
const handleCreateDialogClosed = () => {
  // 确保对话框关闭后表单被重置
  if (createFormRef.value) {
    createFormRef.value.resetForm();
  }
};

// 处理创建提交
const handleCreateSubmit = async (data: MemberCreateUpdateParams) => {
  createDialog.loading = true;
  try {
    // 如果有头像文件，先处理头像上传
    if (data.avatarFile) {
      const formData = new FormData();
      formData.append("avatar", data.avatarFile);

      // 先创建会员，获取ID
      const response = await memberStore.createNewMember({
        username: data.username,
        nick_name: data.nick_name,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirm: data.password,
        status: data.status,
        notes: data.notes
      });

      // 如果创建成功且返回了ID，上传头像
      if (response.success && response.data?.id) {
        try {
          await memberStore.uploadMemberAvatar(response.data.id, formData);
        } catch (error) {
          logger.error("上传头像失败，但会员已创建", error);
        }
      }

      ElMessage.success(t("member.createSuccess"));
      createDialog.visible = false;
      fetchMemberList();
    } else {
      // 没有头像，直接创建会员
      const submitData = {
        username: data.username,
        nick_name: data.nick_name,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        password_confirm: data.password,
        status: data.status
      } as any;

      // 可选字段
      if (data.email) submitData.email = data.email;
      if (data.phone) submitData.phone = data.phone;
      if (data.notes) submitData.notes = data.notes;

      await memberStore.createNewMember(submitData);
      ElMessage.success(t("member.createSuccess"));
      createDialog.visible = false;
      fetchMemberList();
    }
  } catch (error) {
    logger.error("创建会员失败", error);
  } finally {
    createDialog.loading = false;
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

.status-filter,
.tenant-filter {
  min-width: 150px;
}
</style>

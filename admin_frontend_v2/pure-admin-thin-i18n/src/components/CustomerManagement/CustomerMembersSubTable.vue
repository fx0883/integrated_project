<template>
  <div class="customer-members-subtable">
    <!-- 工具栏 -->
    <div class="subtable-toolbar">
      <!-- 左侧按钮组 -->
      <div class="left-buttons">
        <el-button
          v-if="hasPerms('customer_member_relation:create')"
          type="primary"
          size="small"
          @click="handleAddMember"
        >
          <el-icon><plus /></el-icon>
          {{ $t("customer.member.addMember") }}
        </el-button>
        <el-button
          v-if="hasPerms('customer_member_relation:delete')"
          type="danger"
          size="small"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete"
        >
          <el-icon><delete /></el-icon>
          {{ $t("common.batchDelete") }}
        </el-button>
      </div>

      <!-- 右侧搜索框 -->
      <div class="right-search">
        <el-input
          v-model="searchQuery"
          :placeholder="$t('customer.member.searchPlaceholder')"
          size="small"
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
          <template #suffix>
            <el-icon v-if="searchQuery" class="clear-icon" @click="clearSearch">
              <circle-close />
            </el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="displayData"
      style="width: 100%"
      size="small"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />

      <el-table-column
        :label="$t('customer.member.memberInfo')"
        min-width="200"
      >
        <template #default="{ row }">
          <div class="member-info">
            <el-avatar
              :size="32"
              :src="row.member.avatar || ''"
              :alt="row.member.username"
            >
              {{
                row.member.username
                  ? row.member.username.charAt(0).toUpperCase()
                  : "U"
              }}
            </el-avatar>
            <div class="member-details">
              <div class="member-name">{{ row.member.username }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        prop="role"
        :label="$t('customer.member.role')"
        min-width="120"
      >
        <template #default="{ row }">
          {{ row.role || $t("common.notSet") }}
        </template>
      </el-table-column>

      <el-table-column
        prop="is_primary"
        :label="$t('customer.member.isPrimary')"
        width="100"
      >
        <template #default="{ row }">
          <el-tag v-if="row.is_primary" type="success" size="small">
            {{ $t("common.yes") }}
          </el-tag>
          <span v-else>{{ $t("common.no") }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('common.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="hasPerms('customer_member_relation:view')"
            type="primary"
            size="small"
            link
            @click="handleView(row)"
          >
            {{ $t("common.view") }}
          </el-button>
          <el-button
            v-if="hasPerms('customer_member_relation:update')"
            type="primary"
            size="small"
            link
            @click="handleEdit(row)"
          >
            {{ $t("common.edit") }}
          </el-button>
          <el-button
            v-if="hasPerms('customer_member_relation:delete')"
            type="danger"
            size="small"
            link
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
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredData.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 会员关系表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
      destroy-on-close
    >
      <customer-relation-form
        :mode="formMode"
        :member-relation="currentMemberRelation"
        :customer-id="customerId"
        :loading="formLoading"
        @submit="handleFormSubmit"
        @cancel="closeDialog"
      />
    </el-dialog>

    <!-- 确认对话框 -->
    <confirm-dialog
      v-model:visible="confirmDialogVisible"
      :title="confirmDialogTitle"
      :content="confirmDialogContent"
      :type="confirmDialogType"
      :loading="formLoading"
      @confirm="confirmDelete"
      @cancel="closeConfirmDialog"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Plus, Delete, Search, CircleClose } from "@element-plus/icons-vue";
import CustomerRelationForm from "./CustomerRelationForm.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import { hasPerms } from "@/utils/auth";
import { useCustomerStoreHook } from "@/store/modules/customer";
import type { MemberCustomerRelation } from "@/types/member";
import logger from "@/utils/logger";

const { t } = useI18n();
const customerStore = useCustomerStoreHook();

// Props定义
const props = defineProps({
  // 客户ID
  customerId: {
    type: Number,
    required: true
  },
  // 会员关系列表
  memberRelations: {
    type: Array as () => MemberCustomerRelation[],
    default: () => []
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  }
});

// 事件定义
const emit = defineEmits(["refresh"]);

// 表格数据
const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const selectedRows = ref<MemberCustomerRelation[]>([]);
const confirmDialogVisible = ref(false);
const confirmDialogTitle = ref("");
const confirmDialogContent = ref("");
const confirmDialogType = ref<"success" | "warning" | "info" | "danger">(
  "danger"
);
const formLoading = ref(false);

// 对话框相关
const dialogVisible = ref(false);
const formMode = ref<"create" | "edit" | "view">("create");
const currentMemberRelation = ref<MemberCustomerRelation | null>(null);

// 计算属性：对话框标题
const dialogTitle = computed(() => {
  switch (formMode.value) {
    case "create":
      return t("customer.member.addMember");
    case "edit":
      return t("customer.member.editRelation");
    case "view":
      return t("customer.member.viewRelation");
    default:
      return "";
  }
});

// 计算属性：根据当前客户ID过滤会员关系数据
const filteredMemberRelations = computed(() => {
  return props.memberRelations.filter(
    relation => relation.customer && relation.customer.id === props.customerId
  );
});

// 计算属性：过滤后的数据
const filteredData = computed(() => {
  if (!searchQuery.value) return filteredMemberRelations.value;

  const query = searchQuery.value.toLowerCase();
  return filteredMemberRelations.value.filter(
    relation =>
      relation.member.username.toLowerCase().includes(query) ||
      relation.member.name.toLowerCase().includes(query) ||
      (relation.role && relation.role.toLowerCase().includes(query))
  );
});

// 计算属性：当前页显示的数据
const displayData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredData.value.slice(startIndex, endIndex);
});

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
};

// 清除搜索
const clearSearch = () => {
  searchQuery.value = "";
  currentPage.value = 1;
};

// 处理页面大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

// 处理选择变化
const handleSelectionChange = (rows: MemberCustomerRelation[]) => {
  selectedRows.value = rows;
};

// 添加会员
const handleAddMember = () => {
  formMode.value = "create";
  currentMemberRelation.value = null;
  dialogVisible.value = true;
};

// 查看会员关系
const handleView = (row: MemberCustomerRelation) => {
  formMode.value = "view";
  currentMemberRelation.value = row;
  dialogVisible.value = true;
};

// 编辑会员关系
const handleEdit = (row: MemberCustomerRelation) => {
  formMode.value = "edit";
  currentMemberRelation.value = row;
  dialogVisible.value = true;
};

// 删除会员关系
const handleDelete = (row: MemberCustomerRelation) => {
  confirmDialogTitle.value = t("customer.member.deleteRelation");
  confirmDialogContent.value = t("customer.member.deleteRelationConfirm", {
    username: row.member.username
  });
  confirmDialogType.value = "danger";
  confirmDialogVisible.value = true;
  currentMemberRelation.value = row;
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) return;

  confirmDialogTitle.value = t("customer.member.batchDeleteRelation");
  confirmDialogContent.value = t("customer.member.batchDeleteRelationConfirm", {
    count: selectedRows.value.length
  });
  confirmDialogType.value = "danger";
  confirmDialogVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  formLoading.value = true;

  try {
    if (selectedRows.value.length > 0) {
      // 批量删除
      const memberIds = selectedRows.value.map(row => row.member.id);
      await customerStore.batchDeleteCustomerMembersByIds(
        props.customerId,
        memberIds
      );
      ElMessage.success(t("customer.member.batchDeleteSuccess"));
    } else if (currentMemberRelation.value) {
      // 单个删除 - 使用批量删除API
      await customerStore.batchDeleteCustomerMembersByIds(props.customerId, [
        currentMemberRelation.value.member.id
      ]);
      ElMessage.success(t("customer.member.deleteSuccess"));
    }

    // 刷新数据
    emit("refresh");
    // 关闭确认对话框
    confirmDialogVisible.value = false;
  } catch (error) {
    logger.error("删除会员关系失败", error);
    ElMessage.error(t("customer.member.deleteError"));
  } finally {
    formLoading.value = false;
    currentMemberRelation.value = null;
    selectedRows.value = [];
  }
};

// 提交表单
const handleFormSubmit = async (formData: any) => {
  formLoading.value = true;

  try {
    if (formMode.value === "create") {
      // 创建会员关系
      // 确保表单数据包含客户ID
      const relationData = {
        ...formData,
        customer_id: props.customerId
      };
      await customerStore.createCustomerMemberRelation(relationData);
      ElMessage.success(t("customer.member.createSuccess"));
    } else if (formMode.value === "edit" && currentMemberRelation.value) {
      // 更新会员关系
      await customerStore.updateCustomerMemberRelation(
        props.customerId,
        currentMemberRelation.value.id,
        formData
      );
      ElMessage.success(t("customer.member.updateSuccess"));
    }

    // 关闭对话框
    closeDialog();

    // 刷新数据
    emit("refresh");
  } catch (error) {
    logger.error("保存会员关系失败", error);
    ElMessage.error(t("customer.member.saveError"));
  } finally {
    formLoading.value = false;
  }
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  currentMemberRelation.value = null;
};

// 关闭确认对话框
const closeConfirmDialog = () => {
  confirmDialogVisible.value = false;
  currentMemberRelation.value = null;
};

// 监听会员关系列表变化
watch(
  () => props.memberRelations,
  () => {
    currentPage.value = 1;
  }
);

// 组件挂载时初始化
onMounted(() => {
  // 初始化操作
});
</script>

<style scoped>
.customer-members-subtable {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.subtable-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.right-search {
  width: 250px;
}

.search-input .clear-icon {
  cursor: pointer;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.member-info {
  display: flex;
  align-items: center;
}

.member-details {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: bold;
}

.member-email {
  font-size: 12px;
  color: #909399;
}
</style>

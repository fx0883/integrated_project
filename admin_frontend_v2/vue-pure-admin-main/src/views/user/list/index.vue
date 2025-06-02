<template>
  <div class="main-container">
    <el-form
      ref="formRef"
      :inline="true"
      :model="queryParams"
      class="search-form bg-bg_color w-full pl-8 pt-[12px] overflow-auto"
    >
      <el-form-item label="用户名：" prop="username">
        <el-input
          v-model="queryParams.username"
          placeholder="请输入用户名"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="邮箱：" prop="email">
        <el-input
          v-model="queryParams.email"
          placeholder="请输入邮箱"
          clearable
          class="w-[180px]!"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="w-[180px]!"
        >
          <el-option label="激活" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon('ri/search-line')"
          :loading="loading"
          @click="handleQuery"
        >
          搜索
        </el-button>
        <el-button :icon="useRenderIcon(Refresh)" @click="resetQuery">
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <PureTableBar title="用户管理" :columns="columns" @refresh="getList">
      <template #buttons>
        <el-button
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          新增用户
        </el-button>
        <el-button
          type="danger"
          :icon="useRenderIcon(Delete)"
          :disabled="selectedIds.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          row-key="id"
          adaptive
          align-whole="center"
          table-layout="auto"
          :loading="loading"
          :size="size"
          :data="userList"
          :columns="dynamicColumns"
          :pagination="pagination"
          @selection-change="handleSelectionChange"
          @page-size-change="handleSizeChange"
          @page-current-change="handleCurrentChange"
        >
          <template #status="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '激活' : '禁用' }}
            </el-tag>
          </template>
          <template #avatar="{ row }">
            <el-avatar :size="32" :src="row.avatar || ''" />
          </template>
          <template #admin="{ row }">
            <el-tag v-if="row.is_super_admin" type="danger">超级管理员</el-tag>
            <el-tag v-else-if="row.is_admin" type="warning">管理员</el-tag>
            <el-tag v-else>普通用户</el-tag>
          </template>
          <template #operation="{ row }">
            <el-button
              link
              type="primary"
              :icon="useRenderIcon(EditPen)"
              @click="handleUpdate(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="primary"
              :icon="useRenderIcon(View)"
              @click="handleDetail(row)"
            >
              查看
            </el-button>
            <el-dropdown>
              <el-button
                link
                type="primary"
                :icon="useRenderIcon(More)"
              />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <el-button
                      link
                      type="primary"
                      :icon="useRenderIcon(Password)"
                      @click="handleResetPassword(row)"
                    >
                      重置密码
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <el-button
                      link
                      type="primary"
                      :icon="useRenderIcon(Role)"
                      @click="handleAssignRole(row)"
                    >
                      分配角色
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'inactive'">
                    <el-button
                      link
                      type="success"
                      :icon="useRenderIcon('ep/check')"
                      @click="handleActivate(row)"
                    >
                      激活用户
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item v-else>
                    <el-button
                      link
                      type="warning"
                      :icon="useRenderIcon('ep/close')"
                      @click="handleDisable(row)"
                    >
                      禁用用户
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <el-button
                      link
                      type="danger"
                      :icon="useRenderIcon(Delete)"
                      @click="handleDelete(row)"
                    >
                      删除用户
                    </el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 用户表单对话框 -->
    <user-form-dialog
      v-model:visible="dialog.visible"
      :title="dialog.title"
      :user-id="dialog.userId"
      @success="handleSuccess"
    />

    <!-- 角色分配对话框 -->
    <role-dialog
      v-model:visible="roleDialog.visible"
      :user-id="roleDialog.userId"
      @success="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import UserFormDialog from "../form/index.vue";
import RoleDialog from "../form/role.vue";
import { getUserList, deleteUser, activateUser, disableUser, resetPasswordApi } from "@/api/user";
import type { UserListItem, UserListParams } from "@/types/user";

// 图标
import AddFill from "~icons/ri/add-circle-line";
import Delete from "~icons/ep/delete";
import EditPen from "~icons/ep/edit-pen";
import View from "~icons/ep/view";
import Refresh from "~icons/ep/refresh";
import More from "~icons/ep/more-filled";
import Password from "~icons/ri/lock-password-line";
import Role from "~icons/ri/admin-line";

defineOptions({
  name: "UserList"
});

// 表格相关
const tableRef = ref();
const loading = ref(false);
const userList = ref<UserListItem[]>([]);
const selectedIds = ref<number[]>([]);

// 查询参数
const queryParams = reactive<UserListParams>({
  page: 1,
  limit: 10,
  keyword: "",
  status: ""
});

// 分页参数
const pagination = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 10
});

// 表格列定义
const columns = [
  { type: "selection", width: 55 },
  { label: "ID", prop: "id", width: 80 },
  { label: "用户名", prop: "username" },
  { label: "昵称", prop: "nickname" },
  { label: "头像", prop: "avatar", slot: "avatar", width: 80 },
  { label: "邮箱", prop: "email" },
  { label: "角色", prop: "is_admin", slot: "admin" },
  { label: "状态", prop: "status", slot: "status", width: 90 },
  { label: "创建时间", prop: "created_at" },
  { label: "操作", slot: "operation", fixed: "right", width: 240 }
];

// 用户表单对话框
const dialog = reactive({
  visible: false,
  title: "",
  userId: undefined as number | undefined
});

// 角色分配对话框
const roleDialog = reactive({
  visible: false,
  userId: undefined as number | undefined
});

// 获取用户列表
const getList = async () => {
  loading.value = true;
  try {
    const { data } = await getUserList({
      ...queryParams,
      page: pagination.currentPage,
      limit: pagination.pageSize
    });
    userList.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("获取用户列表失败", error);
  } finally {
    loading.value = false;
  }
};

// 查询
const handleQuery = () => {
  pagination.currentPage = 1;
  getList();
};

// 重置查询
const resetQuery = () => {
  Object.assign(queryParams, {
    username: "",
    email: "",
    status: ""
  });
  handleQuery();
};

// 选择变更
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id);
};

// 页码变更
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  getList();
};

// 每页条数变更
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getList();
};

// 新增
const handleAdd = () => {
  dialog.title = "新增用户";
  dialog.userId = undefined;
  dialog.visible = true;
};

// 编辑
const handleUpdate = (row: UserListItem) => {
  dialog.title = "编辑用户";
  dialog.userId = row.id;
  dialog.visible = true;
};

// 查看详情
const handleDetail = (row: UserListItem) => {
  const { id } = row;
  // 跳转到详情页
};

// 重置密码
const handleResetPassword = (row: UserListItem) => {
  ElMessageBox.confirm(`确认重置用户"${row.username}"的密码吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await resetPasswordApi(row.id);
      ElMessage.success("重置密码成功");
    } catch (error) {
      console.error("重置密码失败", error);
    }
  }).catch(() => {});
};

// 分配角色
const handleAssignRole = (row: UserListItem) => {
  roleDialog.userId = row.id;
  roleDialog.visible = true;
};

// 激活用户
const handleActivate = async (row: UserListItem) => {
  try {
    await activateUser(row.id);
    ElMessage.success(`用户"${row.username}"激活成功`);
    getList();
  } catch (error) {
    console.error("激活用户失败", error);
  }
};

// 禁用用户
const handleDisable = async (row: UserListItem) => {
  try {
    await disableUser(row.id);
    ElMessage.success(`用户"${row.username}"禁用成功`);
    getList();
  } catch (error) {
    console.error("禁用用户失败", error);
  }
};

// 删除用户
const handleDelete = (row: UserListItem) => {
  ElMessageBox.confirm(`确认删除用户"${row.username}"吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteUser(row.id);
      ElMessage.success("删除成功");
      getList();
    } catch (error) {
      console.error("删除用户失败", error);
    }
  }).catch(() => {});
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请至少选择一条记录");
    return;
  }
  
  ElMessageBox.confirm(`确认删除选中的${selectedIds.value.length}条记录吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      // 批量删除API
      ElMessage.success("批量删除成功");
      getList();
    } catch (error) {
      console.error("批量删除失败", error);
    }
  }).catch(() => {});
};

// 表单提交成功
const handleSuccess = () => {
  getList();
};

// 初始化
onMounted(() => {
  getList();
});
</script>

<style scoped>
.main-container {
  padding: 16px;
}
</style> 
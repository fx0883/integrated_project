<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">租户列表</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >
              新增租户
            </el-button>
          </div>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="queryParams"
        :inline="true"
        class="search-form mb-4"
      >
        <el-form-item label="租户名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入租户名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="租户状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择租户状态"
            clearable
          >
            <el-option label="正常" value="active" />
            <el-option label="暂停" value="suspended" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="tenantList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="租户名称" />
        <el-table-column prop="domain" label="租户域名" />
        <el-table-column prop="contact_name" label="联系人" />
        <el-table-column prop="contact_phone" label="联系电话" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '暂停' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="View"
              @click="handleDetail(row)"
            >
              详情
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="primary"
              :icon="SetUp"
              @click="handleQuota(row)"
            >
              配额
            </el-button>
            <el-button
              v-if="row.status === 'active'"
              link
              type="danger"
              :icon="VideoPause"
              @click="handleSuspend(row)"
            >
              暂停
            </el-button>
            <el-button
              v-else
              link
              type="success"
              :icon="VideoPlay"
              @click="handleActivate(row)"
            >
              激活
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import type { TenantListItem } from "../../../types/tenant";
import {
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  View,
  SetUp,
  VideoPause,
  VideoPlay
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();

// 租户store
const tenantStore = useTenantStoreHook();

// 租户列表数据
const tenantList = ref<TenantListItem[]>([]);
const total = ref(0);
const loading = ref(false);

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  name: "",
  status: ""
});

// 表单ref
const formRef = ref();

// 初始化
onMounted(() => {
  getList();
});

// 获取列表数据
const getList = async () => {
  loading.value = true;
  try {
    const result = await tenantStore.fetchTenants(queryParams);
    if (result) {
      tenantList.value = result.list;
      total.value = result.total;
    }
  } finally {
    loading.value = false;
  }
};

// 查询
const handleQuery = () => {
  queryParams.page = 1;
  getList();
};

// 重置查询
const resetQuery = () => {
  formRef.value?.resetFields();
  queryParams.page = 1;
  getList();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.limit = val;
  getList();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  getList();
};

// 新增租户
const handleCreate = () => {
  router.push("/tenant/create");
};

// 编辑租户
const handleEdit = (row: TenantListItem) => {
  router.push(`/tenant/edit/${row.id}`);
};

// 查看详情
const handleDetail = (row: TenantListItem) => {
  router.push(`/tenant/detail/${row.id}`);
};

// 管理配额
const handleQuota = (row: TenantListItem) => {
  router.push(`/tenant/quota/${row.id}`);
};

// 暂停租户
const handleSuspend = (row: TenantListItem) => {
  ElMessageBox.confirm(`确认要暂停租户 ${row.name} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await tenantStore.suspendTenant(row.id);
      if (result && result.success) {
        ElMessage.success("租户已暂停");
        getList();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 激活租户
const handleActivate = (row: TenantListItem) => {
  ElMessageBox.confirm(`确认要激活租户 ${row.name} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await tenantStore.activateTenant(row.id);
      if (result && result.success) {
        ElMessage.success("租户已激活");
        getList();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 删除租户
const handleDelete = (row: TenantListItem) => {
  ElMessageBox.confirm(`确认要删除租户 ${row.name} 吗？此操作不可恢复！`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await tenantStore.deleteTenant(row.id);
      if (result && result.success) {
        ElMessage.success("删除成功");
        getList();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
};
</script>

<style scoped>
.main {
  margin: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 15px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style> 
<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">打卡任务列表</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleAddTask"
            >
              新增任务
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="任务名称">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="所属类型">
          <el-select v-model="queryParams.category_id" placeholder="全部类型" clearable>
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable>
            <el-option label="活跃中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="taskList"
        border
        row-key="id"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-form label-position="left" inline class="task-expand">
              <el-form-item label="任务描述">
                <span>{{ row.description || '无' }}</span>
              </el-form-item>
              <el-form-item label="参与人数">
                <span>{{ row.user_count }} 人</span>
              </el-form-item>
              <el-form-item label="完成率">
                <el-progress 
                  :percentage="row.completion_rate * 100" 
                  :status="getProgressStatus(row.completion_rate)"
                />
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="任务名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="category_name" label="所属类型" width="120" />
        <el-table-column label="打卡频率" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ getFrequencyText(row.frequency) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="View"
              @click="handleViewTask(row)"
            >
              查看
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleEditTask(row)"
              :disabled="row.status !== 'active'"
            >
              编辑
            </el-button>
            <el-button
              link
              type="success"
              :icon="Check"
              @click="handleCompleteTask(row)"
              v-if="row.status === 'active'"
            >
              完成
            </el-button>
            <el-button
              link
              type="warning"
              :icon="Close"
              @click="handleCancelTask(row)"
              v-if="row.status === 'active'"
            >
              取消
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDeleteTask(row)"
            >
              删除
            </el-button>
            <el-button
              link
              type="info"
              :icon="DataAnalysis"
              @click="handleTaskStatistic(row)"
            >
              统计
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页区域 -->
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
import { ref, reactive, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useCheckTaskStoreHook } from "@/store/modules/check/task";
import { useCheckCategoryStoreHook } from "@/store/modules/check/category";
import type { CheckTask, CheckCategory } from "../../../../types/check";
import { 
  Plus, Edit, Delete, View, Search, Refresh, Check, Close, DataAnalysis
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();

// store实例
const taskStore = useCheckTaskStoreHook();
const categoryStore = useCheckCategoryStoreHook();

// 列表数据
const taskList = ref<CheckTask[]>([]);
const total = ref(0);
const loading = ref(false);
const categoryOptions = ref<CheckCategory[]>([]);

// 日期范围
const dateRange = ref([]);

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  category_id: undefined as number | undefined,
  status: undefined as string | undefined,
  start_date: undefined as string | undefined,
  end_date: undefined as string | undefined
});

// 监听日期范围变化
watch(dateRange, (val) => {
  handleDateRangeChange(val);
});

// 初始化
onMounted(async () => {
  await fetchCategories();
  fetchTasks();
});

// 获取分类列表
const fetchCategories = async () => {
  const result = await categoryStore.fetchCategories();
  if (result) {
    categoryOptions.value = result.list;
  }
};

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true;
  try {
    const result = await taskStore.fetchTasks(queryParams);
    if (result) {
      taskList.value = result.list;
      total.value = result.total;
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  fetchTasks();
};

// 重置查询
const resetQuery = () => {
  queryParams.keyword = "";
  queryParams.category_id = undefined;
  queryParams.status = undefined;
  queryParams.start_date = undefined;
  queryParams.end_date = undefined;
  dateRange.value = [];
  queryParams.page = 1;
  fetchTasks();
};

// 日期范围变化
const handleDateRangeChange = (val: any) => {
  if (val && val.length === 2) {
    queryParams.start_date = val[0];
    queryParams.end_date = val[1];
  } else {
    queryParams.start_date = undefined;
    queryParams.end_date = undefined;
  }
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.limit = val;
  fetchTasks();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  fetchTasks();
};

// 新增任务
const handleAddTask = () => {
  router.push("/check/task/create");
};

// 查看任务
const handleViewTask = (row: CheckTask) => {
  router.push(`/check/task/detail/${row.id}`);
};

// 编辑任务
const handleEditTask = (row: CheckTask) => {
  router.push(`/check/task/edit/${row.id}`);
};

// 统计任务
const handleTaskStatistic = (row: CheckTask) => {
  router.push(`/check/task/statistic/${row.id}`);
};

// 完成任务
const handleCompleteTask = (row: CheckTask) => {
  ElMessageBox.confirm(`确认要将任务"${row.title}"标记为已完成吗？`, "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await taskStore.completeTask(row.id);
      if (result && result.success) {
        ElMessage.success("任务已标记为完成");
        fetchTasks();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 取消任务
const handleCancelTask = (row: CheckTask) => {
  ElMessageBox.confirm(`确认要取消任务"${row.title}"吗？`, "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await taskStore.cancelTask(row.id);
      if (result && result.success) {
        ElMessage.success("任务已取消");
        fetchTasks();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 删除任务
const handleDeleteTask = (row: CheckTask) => {
  ElMessageBox.confirm(`确认要删除任务"${row.title}"吗？`, "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await taskStore.deleteTask(row.id);
      if (result && result.success) {
        ElMessage.success("删除成功");
        fetchTasks();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
};

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "info";
    case "cancelled":
      return "warning";
    default:
      return "info";
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "活跃中";
    case "completed":
      return "已完成";
    case "cancelled":
      return "已取消";
    default:
      return "未知";
  }
};

// 获取频率文本
const getFrequencyText = (frequency: string) => {
  switch (frequency) {
    case "daily":
      return "每日";
    case "weekly":
      return "每周";
    case "monthly":
      return "每月";
    default:
      return "未知";
  }
};

// 获取进度条状态
const getProgressStatus = (rate: number) => {
  if (rate >= 0.8) {
    return "success";
  } else if (rate >= 0.5) {
    return "";
  } else {
    return "exception";
  }
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
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.task-expand {
  padding: 10px;
}

.task-expand .el-form-item {
  margin-right: 20px;
  margin-bottom: 0;
}
</style> 
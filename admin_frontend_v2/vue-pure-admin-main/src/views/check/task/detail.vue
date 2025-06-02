<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">打卡任务详情</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Edit"
              @click="handleEdit"
              v-if="task && task.status === 'active'"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              :icon="DataAnalysis"
              @click="handleStatistic"
            >
              统计分析
            </el-button>
            <el-button
              type="primary"
              :icon="Back"
              @click="goBack"
            >
              返回列表
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-loading="loading">
        <el-empty v-if="!task" description="未找到任务信息"></el-empty>
        
        <template v-else>
          <div class="task-header">
            <h1 class="task-title">{{ task.title }}</h1>
            <div class="task-meta">
              <el-tag
                :type="getStatusType(task.status)"
                size="large"
                effect="light"
                class="mr-2"
              >
                {{ getStatusText(task.status) }}
              </el-tag>
              <el-tag
                type="info"
                size="large"
                effect="light"
              >
                {{ getFrequencyText(task.frequency) }}
              </el-tag>
            </div>
          </div>
          
          <el-descriptions
            class="mt-4"
            :column="2"
            border
          >
            <el-descriptions-item label="任务ID" width="180px">{{ task.id }}</el-descriptions-item>
            <el-descriptions-item label="所属类型">{{ task.category_name }}</el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ task.start_date }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ task.end_date }}</el-descriptions-item>
            <el-descriptions-item label="参与人数">{{ task.user_count }} 人</el-descriptions-item>
            <el-descriptions-item label="完成率">
              <el-progress 
                :percentage="task.completion_rate * 100" 
                :status="getProgressStatus(task.completion_rate)"
                :format="percentFormat"
              />
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ task.created_at }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ task.updated_at }}</el-descriptions-item>
            <el-descriptions-item label="任务描述" :span="2">
              <div class="task-description">
                {{ task.description || '暂无描述' }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="task-actions mt-4">
            <el-button
              type="success"
              :icon="Check"
              @click="handleComplete"
              v-if="task.status === 'active'"
            >
              完成任务
            </el-button>
            <el-button
              type="warning"
              :icon="Close"
              @click="handleCancel"
              v-if="task.status === 'active'"
            >
              取消任务
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              @click="handleDelete"
            >
              删除任务
            </el-button>
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useCheckTaskStoreHook } from "@/store/modules/check/task";
import type { CheckTask } from "../../../../types/check";
import {
  Edit, Back, Check, Close, Delete, DataAnalysis
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// 任务store
const taskStore = useCheckTaskStoreHook();

// 任务详情数据
const task = ref<CheckTask | null>(null);
const loading = ref(false);

// 获取任务ID
const taskId = parseInt(route.params.id as string);

// 初始化
onMounted(async () => {
  if (taskId) {
    await fetchTaskDetail();
  }
});

// 获取任务详情
const fetchTaskDetail = async () => {
  loading.value = true;
  try {
    const data = await taskStore.fetchTaskDetail(taskId);
    task.value = data;
    
    if (!data) {
      ElMessage.error("获取任务信息失败");
      goBack();
    }
  } finally {
    loading.value = false;
  }
};

// 编辑任务
const handleEdit = () => {
  router.push(`/check/task/edit/${taskId}`);
};

// 统计分析
const handleStatistic = () => {
  router.push(`/check/task/statistic/${taskId}`);
};

// 完成任务
const handleComplete = () => {
  if (!task.value) return;
  
  ElMessageBox.confirm(`确认要将任务"${task.value.title}"标记为已完成吗？`, "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await taskStore.completeTask(taskId);
      if (result && result.success) {
        ElMessage.success("任务已标记为完成");
        fetchTaskDetail();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 取消任务
const handleCancel = () => {
  if (!task.value) return;
  
  ElMessageBox.confirm(`确认要取消任务"${task.value.title}"吗？`, "提示", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await taskStore.cancelTask(taskId);
      if (result && result.success) {
        ElMessage.success("任务已取消");
        fetchTaskDetail();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 删除任务
const handleDelete = () => {
  if (!task.value) return;
  
  ElMessageBox.confirm(`确认要删除任务"${task.value.title}"吗？此操作不可恢复！`, "警告", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await taskStore.deleteTask(taskId);
      if (result && result.success) {
        ElMessage.success("删除成功");
        goBack();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
};

// 返回列表页
const goBack = () => {
  router.push("/check/task/list");
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
      return "每日打卡";
    case "weekly":
      return "每周打卡";
    case "monthly":
      return "每月打卡";
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

// 百分比格式化
const percentFormat = (percentage: number) => {
  return percentage.toFixed(1) + '%';
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

.task-header {
  margin-bottom: 20px;
}

.task-title {
  font-size: 24px;
  margin-bottom: 15px;
  font-weight: bold;
}

.task-meta {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.task-description {
  line-height: 1.6;
  white-space: pre-wrap;
}

.task-actions {
  display: flex;
  gap: 10px;
}
</style> 
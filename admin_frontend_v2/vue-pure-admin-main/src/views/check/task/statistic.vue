<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">打卡任务统计</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="View"
              @click="viewTaskDetail"
            >
              查看任务
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
        <el-empty v-if="!taskInfo" description="未找到任务信息"></el-empty>
        
        <template v-else>
          <div class="task-info">
            <h2 class="task-title">{{ taskInfo.title }}</h2>
            <div class="task-meta">
              <el-tag
                :type="getStatusType(taskInfo.status)"
                effect="light"
                class="mr-2"
              >
                {{ getStatusText(taskInfo.status) }}
              </el-tag>
              <span class="time-range">
                {{ taskInfo.start_date }} 至 {{ taskInfo.end_date }}
              </span>
            </div>
          </div>
          
          <el-divider />
          
          <div class="statistic-summary" v-if="statistic">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="statistic-card">
                  <template #header>
                    <div class="card-header-center">
                      <el-icon><User /></el-icon>
                      <span>参与人数</span>
                    </div>
                  </template>
                  <div class="statistic-value">{{ statistic.total_users }}</div>
                  <div class="statistic-label">人</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="statistic-card">
                  <template #header>
                    <div class="card-header-center">
                      <el-icon><Checked /></el-icon>
                      <span>打卡次数</span>
                    </div>
                  </template>
                  <div class="statistic-value">{{ statistic.total_records }}</div>
                  <div class="statistic-label">次</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="statistic-card">
                  <template #header>
                    <div class="card-header-center">
                      <el-icon><DataAnalysis /></el-icon>
                      <span>完成率</span>
                    </div>
                  </template>
                  <div class="statistic-value">{{ (statistic.completion_rate * 100).toFixed(1) }}%</div>
                  <div class="statistic-label">
                    <el-progress
                      :percentage="statistic.completion_rate * 100"
                      :status="getProgressStatus(statistic.completion_rate)"
                    />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
          
          <!-- 每日打卡趋势图 -->
          <div class="statistic-chart-container" v-if="statistic && statistic.daily_data">
            <h3 class="chart-title">
              <el-icon><TrendCharts /></el-icon>
              打卡趋势
            </h3>
            <div ref="dailyChartRef" class="chart-box"></div>
          </div>
          
          <!-- 用户打卡排行榜 -->
          <div class="statistic-table-container" v-if="statistic && statistic.user_data">
            <h3 class="chart-title">
              <el-icon><Medal /></el-icon>
              用户打卡排行
            </h3>
            <el-table
              :data="sortedUserData"
              border
              style="width: 100%"
            >
              <el-table-column type="index" label="排名" width="80" />
              <el-table-column prop="user_name" label="用户" min-width="150" />
              <el-table-column label="完成率" min-width="250">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.completion_rate * 100"
                    :format="percentFormat"
                    :status="getProgressStatus(row.completion_rate)"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useCheckTaskStoreHook } from "@/store/modules/check/task";
import type { CheckTask, CheckStatistic } from "../../../../types/check";
import * as echarts from "echarts";
import {
  View, Back, User, Checked, DataAnalysis, TrendCharts, Medal
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// 任务store
const taskStore = useCheckTaskStoreHook();

// 任务信息
const taskInfo = ref<CheckTask | null>(null);
// 统计数据
const statistic = ref<CheckStatistic | null>(null);
const loading = ref(false);

// 图表DOM引用
const dailyChartRef = ref<HTMLElement | null>(null);
// 图表实例
let dailyChart: echarts.ECharts | null = null;

// 获取任务ID
const taskId = parseInt(route.params.id as string);

// 计算排序后的用户数据
const sortedUserData = computed(() => {
  if (!statistic.value || !statistic.value.user_data) {
    return [];
  }
  
  return [...statistic.value.user_data].sort((a, b) => b.completion_rate - a.completion_rate);
});

// 初始化
onMounted(async () => {
  if (taskId) {
    await Promise.all([
      fetchTaskDetail(),
      fetchTaskStatistic()
    ]);
    
    nextTick(() => {
      initDailyChart();
    });
  }
});

// 获取任务详情
const fetchTaskDetail = async () => {
  loading.value = true;
  try {
    const data = await taskStore.fetchTaskDetail(taskId);
    taskInfo.value = data;
    
    if (!data) {
      ElMessage.error("获取任务信息失败");
      goBack();
    }
  } catch (error) {
    console.error("获取任务详情失败:", error);
  } finally {
    loading.value = false;
  }
};

// 获取任务统计数据
const fetchTaskStatistic = async () => {
  loading.value = true;
  try {
    const result = await taskStore.fetchTaskStatistic(taskId);
    if (result && result.success) {
      statistic.value = result.data;
    } else {
      ElMessage.error("获取统计数据失败");
    }
  } catch (error) {
    console.error("获取任务统计失败:", error);
  } finally {
    loading.value = false;
  }
};

// 初始化每日打卡趋势图
const initDailyChart = () => {
  if (!dailyChartRef.value || !statistic.value || !statistic.value.daily_data) {
    return;
  }
  
  // 初始化echarts实例
  dailyChart = echarts.init(dailyChartRef.value);
  
  const { daily_data } = statistic.value;
  const dates = daily_data.map(item => item.date);
  const counts = daily_data.map(item => item.count);
  
  // 配置图表选项
  const option = {
    title: {
      text: '每日打卡数量趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '打卡次数',
        type: 'bar',
        barWidth: '60%',
        data: counts,
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  };
  
  // 设置图表选项
  dailyChart.setOption(option);
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    dailyChart?.resize();
  });
};

// 查看任务详情
const viewTaskDetail = () => {
  router.push(`/check/task/detail/${taskId}`);
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

.card-header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.task-info {
  margin-bottom: 20px;
}

.task-title {
  font-size: 20px;
  margin-bottom: 12px;
  font-weight: bold;
}

.task-meta {
  display: flex;
  align-items: center;
}

.time-range {
  color: #606266;
  margin-left: 10px;
}

.statistic-summary {
  margin: 20px 0;
}

.statistic-card {
  text-align: center;
  height: 100%;
}

.statistic-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin: 10px 0;
}

.statistic-label {
  color: #606266;
}

.statistic-chart-container,
.statistic-table-container {
  margin-top: 30px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
}

.chart-box {
  width: 100%;
  height: 400px;
}
</style> 
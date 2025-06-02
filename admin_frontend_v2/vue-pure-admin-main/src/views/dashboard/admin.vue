<template>
  <div class="admin-dashboard-container">
    <el-row :gutter="20">
      <!-- 系统概览 -->
      <el-col :span="24">
        <el-card class="system-overview" shadow="never">
          <template #header>
            <div class="card-header">
              <span>系统概览</span>
              <el-button type="primary" :icon="Refresh" @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <el-row :gutter="20">
              <el-col :span="6" v-for="(item, index) in overviewItems" :key="index">
                <div class="overview-item">
                  <div class="icon" :class="item.color">
                    <el-icon>
                      <component :is="item.icon"></component>
                    </el-icon>
                  </div>
                  <div class="content">
                    <div class="title">{{ item.title }}</div>
                    <div class="value">{{ item.value }}</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
      
      <!-- 服务器状态 -->
      <el-col :span="8">
        <el-card class="server-status" shadow="never">
          <template #header>
            <div class="card-header">
              <span>服务器状态</span>
            </div>
          </template>
          <div v-loading="loading">
            <div class="status-item" v-for="(item, index) in serverStatus" :key="index">
              <span class="label">{{ item.label }}</span>
              <el-progress 
                :percentage="item.value" 
                :color="item.color" 
                :stroke-width="10" 
                :format="percentageFormat"
              ></el-progress>
            </div>
            <div class="uptime">
              <span>已运行时间：{{ uptimeFormatted }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 租户统计 -->
      <el-col :span="16">
        <el-card class="tenant-statistics" shadow="never">
          <template #header>
            <div class="card-header">
              <span>租户统计</span>
              <div>
                <el-button type="primary" plain size="small" icon="Plus">创建租户</el-button>
              </div>
            </div>
          </template>
          <div v-loading="loading">
            <el-table :data="tenantStatistics" style="width: 100%" :max-height="320">
              <el-table-column prop="tenant_name" label="租户名称" width="150"></el-table-column>
              <el-table-column prop="user_count" label="用户数" width="90"></el-table-column>
              <el-table-column prop="active_users" label="活跃用户" width="90"></el-table-column>
              <el-table-column prop="check_in_completion_rate" label="打卡率" width="90">
                <template #default="scope">
                  {{ scope.row.check_in_completion_rate.toFixed(2) }}%
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="120"></el-table-column>
              <el-table-column label="操作" fixed="right" width="100">
                <template #default="scope">
                  <el-button link type="primary" @click="viewTenantDetail(scope.row.tenant_id)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
      
      <!-- 用户活跃度图表 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>用户活跃度</span>
              <el-date-picker
                v-model="activityDateRange"
                type="daterange"
                size="small"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleActivityDateChange"
              ></el-date-picker>
            </div>
          </template>
          <div class="chart-container" ref="userActivityChartRef" v-loading="loading"></div>
        </el-card>
      </el-col>
      
      <!-- 内容统计图表 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>内容统计</span>
              <el-date-picker
                v-model="contentDateRange"
                type="daterange"
                size="small"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleContentDateChange"
              ></el-date-picker>
            </div>
          </template>
          <div class="chart-container" ref="contentStatisticsChartRef" v-loading="loading"></div>
        </el-card>
      </el-col>
      
      <!-- 打卡完成率图表 -->
      <el-col :span="24">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>打卡完成率</span>
              <el-date-picker
                v-model="checkInDateRange"
                type="daterange"
                size="small"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleCheckInDateChange"
              ></el-date-picker>
            </div>
          </template>
          <div class="chart-container" ref="checkInCompletionChartRef" v-loading="loading"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useDashboardStoreHook } from "@/store/modules/dashboard";
import { Refresh, User, House, Document, Calendar } from "@element-plus/icons-vue";
import * as echarts from "echarts";

const router = useRouter();
const dashboardStore = useDashboardStoreHook();

// 数据加载状态
const loading = ref(false);

// 仪表盘数据
const dashboardData = ref<any>({
  system_overview: {
    total_users: 0,
    active_users: 0,
    total_tenants: 0,
    active_tenants: 0,
    total_articles: 0,
    total_comments: 0,
    total_check_ins: 0,
    check_in_completion_rate: 0,
    server_status: {
      cpu_usage: 0,
      memory_usage: 0,
      disk_usage: 0,
      uptime: 0
    }
  },
  tenant_statistics: [],
  user_activity: [],
  content_statistics: [],
  check_in_completion: []
});

// 系统概览卡片数据
const overviewItems = computed(() => {
  const overview = dashboardData.value.system_overview;
  return [
    {
      title: "总用户数",
      value: overview.total_users,
      icon: "User",
      color: "bg-blue"
    },
    {
      title: "租户数",
      value: overview.total_tenants,
      icon: "House",
      color: "bg-green"
    },
    {
      title: "文章数",
      value: overview.total_articles,
      icon: "Document",
      color: "bg-orange"
    },
    {
      title: "打卡记录",
      value: overview.total_check_ins,
      icon: "Calendar",
      color: "bg-purple"
    }
  ];
});

// 服务器状态数据
const serverStatus = computed(() => {
  const status = dashboardData.value.system_overview.server_status;
  return [
    {
      label: "CPU使用率",
      value: status.cpu_usage,
      color: getProgressColor(status.cpu_usage)
    },
    {
      label: "内存使用率",
      value: status.memory_usage,
      color: getProgressColor(status.memory_usage)
    },
    {
      label: "磁盘使用率",
      value: status.disk_usage,
      color: getProgressColor(status.disk_usage)
    }
  ];
});

// 格式化运行时间
const uptimeFormatted = computed(() => {
  const uptime = dashboardData.value.system_overview.server_status.uptime;
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  return `${days}天 ${hours}小时 ${minutes}分钟`;
});

// 租户统计数据
const tenantStatistics = computed(() => {
  return dashboardData.value.tenant_statistics || [];
});

// 日期范围
const activityDateRange = ref([]);
const contentDateRange = ref([]);
const checkInDateRange = ref([]);

// 图表引用
const userActivityChartRef = ref<HTMLElement | null>(null);
const contentStatisticsChartRef = ref<HTMLElement | null>(null);
const checkInCompletionChartRef = ref<HTMLElement | null>(null);

// 图表实例
let userActivityChart: echarts.ECharts | null = null;
let contentStatisticsChart: echarts.ECharts | null = null;
let checkInCompletionChart: echarts.ECharts | null = null;

// 初始化数据
onMounted(async () => {
  await fetchDashboardData();
  
  window.addEventListener("resize", handleResize);
});

// 组件卸载
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  
  userActivityChart?.dispose();
  contentStatisticsChart?.dispose();
  checkInCompletionChart?.dispose();
});

// 获取仪表盘数据
const fetchDashboardData = async () => {
  loading.value = true;
  
  try {
    const data = await dashboardStore.fetchSuperAdminDashboard();
    if (data) {
      dashboardData.value = data;
      
      nextTick(() => {
        initCharts();
      });
    }
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  fetchDashboardData();
};

// 初始化图表
const initCharts = () => {
  initUserActivityChart();
  initContentStatisticsChart();
  initCheckInCompletionChart();
};

// 初始化用户活跃度图表
const initUserActivityChart = () => {
  if (!userActivityChartRef.value) return;
  
  if (userActivityChart) {
    userActivityChart.dispose();
  }
  
  userActivityChart = echarts.init(userActivityChartRef.value);
  
  const activityData = dashboardData.value.user_activity || [];
  const dates = activityData.map(item => item.date);
  const activeUsers = activityData.map(item => item.active_users);
  const newUsers = activityData.map(item => item.new_users);
  const loginCounts = activityData.map(item => item.login_count);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['活跃用户', '新增用户', '登录次数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '用户数',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '次数',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '活跃用户',
        type: 'bar',
        data: activeUsers
      },
      {
        name: '新增用户',
        type: 'bar',
        data: newUsers
      },
      {
        name: '登录次数',
        type: 'line',
        yAxisIndex: 1,
        data: loginCounts
      }
    ]
  };
  
  userActivityChart.setOption(option);
};

// 初始化内容统计图表
const initContentStatisticsChart = () => {
  if (!contentStatisticsChartRef.value) return;
  
  if (contentStatisticsChart) {
    contentStatisticsChart.dispose();
  }
  
  contentStatisticsChart = echarts.init(contentStatisticsChartRef.value);
  
  const contentData = dashboardData.value.content_statistics || [];
  const dates = contentData.map(item => item.date);
  const articles = contentData.map(item => item.articles);
  const comments = contentData.map(item => item.comments);
  const views = contentData.map(item => item.views);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['文章数', '评论数', '浏览量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '浏览量',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '文章数',
        type: 'bar',
        data: articles
      },
      {
        name: '评论数',
        type: 'bar',
        data: comments
      },
      {
        name: '浏览量',
        type: 'line',
        yAxisIndex: 1,
        data: views
      }
    ]
  };
  
  contentStatisticsChart.setOption(option);
};

// 初始化打卡完成率图表
const initCheckInCompletionChart = () => {
  if (!checkInCompletionChartRef.value) return;
  
  if (checkInCompletionChart) {
    checkInCompletionChart.dispose();
  }
  
  checkInCompletionChart = echarts.init(checkInCompletionChartRef.value);
  
  const completionData = dashboardData.value.check_in_completion || [];
  const dates = completionData.map(item => item.date);
  const totalTasks = completionData.map(item => item.total_tasks);
  const completedTasks = completionData.map(item => item.completed_tasks);
  const completionRates = completionData.map(item => item.completion_rate);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['总任务数', '已完成', '完成率']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '任务数',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '完成率',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '总任务数',
        type: 'bar',
        data: totalTasks
      },
      {
        name: '已完成',
        type: 'bar',
        data: completedTasks
      },
      {
        name: '完成率',
        type: 'line',
        yAxisIndex: 1,
        data: completionRates
      }
    ]
  };
  
  checkInCompletionChart.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
  userActivityChart?.resize();
  contentStatisticsChart?.resize();
  checkInCompletionChart?.resize();
};

// 处理日期变化
const handleActivityDateChange = (val) => {
  if (val && val.length === 2) {
    fetchActivityData({
      start_date: val[0],
      end_date: val[1]
    });
  }
};

const handleContentDateChange = (val) => {
  if (val && val.length === 2) {
    fetchContentData({
      start_date: val[0],
      end_date: val[1]
    });
  }
};

const handleCheckInDateChange = (val) => {
  if (val && val.length === 2) {
    fetchCheckInData({
      start_date: val[0],
      end_date: val[1]
    });
  }
};

// 获取指定时间范围的活跃度数据
const fetchActivityData = async (params) => {
  loading.value = true;
  
  try {
    const result = await dashboardStore.fetchUserActivity(params);
    if (result) {
      dashboardData.value.user_activity = result;
      initUserActivityChart();
    }
  } finally {
    loading.value = false;
  }
};

// 获取指定时间范围的内容统计数据
const fetchContentData = async (params) => {
  loading.value = true;
  
  try {
    const result = await dashboardStore.fetchContentStatistics(params);
    if (result) {
      dashboardData.value.content_statistics = result;
      initContentStatisticsChart();
    }
  } finally {
    loading.value = false;
  }
};

// 获取指定时间范围的打卡数据
const fetchCheckInData = async (params) => {
  loading.value = true;
  
  try {
    const result = await dashboardStore.fetchCheckInCompletion(params);
    if (result) {
      dashboardData.value.check_in_completion = result;
      initCheckInCompletionChart();
    }
  } finally {
    loading.value = false;
  }
};

// 进度条颜色计算
const getProgressColor = (value: number) => {
  if (value < 60) {
    return "#67C23A"; // 绿色
  } else if (value < 80) {
    return "#E6A23C"; // 橙色
  } else {
    return "#F56C6C"; // 红色
  }
};

// 进度条格式化
const percentageFormat = (percentage: number) => {
  return percentage + "%";
};

// 查看租户详情
const viewTenantDetail = (tenantId: number) => {
  router.push(`/tenant/detail/${tenantId}`);
};
</script>

<style scoped>
.admin-dashboard-container {
  padding: 10px;
}

.el-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-item {
  display: flex;
  padding: 15px;
  border-radius: 4px;
  background-color: #f5f7fa;
  margin-bottom: 5px;
}

.overview-item .icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  margin-right: 15px;
}

.overview-item .content {
  flex: 1;
}

.overview-item .title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.overview-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.bg-blue {
  background-color: #409EFF;
}

.bg-green {
  background-color: #67C23A;
}

.bg-orange {
  background-color: #E6A23C;
}

.bg-purple {
  background-color: #8e44ad;
}

.server-status {
  height: 100%;
}

.status-item {
  margin-bottom: 20px;
}

.status-item .label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.uptime {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #909399;
}

.tenant-statistics {
  height: 100%;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
  width: 100%;
}
</style> 
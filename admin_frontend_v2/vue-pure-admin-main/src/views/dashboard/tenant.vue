<template>
  <div class="tenant-dashboard-container">
    <el-row :gutter="20">
      <!-- 租户概览 -->
      <el-col :span="24">
        <el-card class="tenant-overview" shadow="never">
          <template #header>
            <div class="card-header">
              <span>租户概览</span>
              <el-button type="primary" :icon="Refresh" @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-blue">
                    <el-icon><User /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">用户总数</div>
                    <div class="value">{{ overviewData.user_count || 0 }}</div>
                    <div class="subtitle">活跃用户: {{ overviewData.active_users || 0 }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-green">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">文章总数</div>
                    <div class="value">{{ overviewData.article_count || 0 }}</div>
                    <div class="subtitle">评论数: {{ overviewData.comment_count || 0 }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-orange">
                    <el-icon><Calendar /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">打卡记录</div>
                    <div class="value">{{ overviewData.check_in_count || 0 }}</div>
                    <div class="subtitle">今日打卡: {{ todayCheckIns }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-purple">
                    <el-icon><Histogram /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">打卡完成率</div>
                    <div class="value">{{ (overviewData.check_in_completion_rate || 0).toFixed(2) }}%</div>
                    <div class="subtitle">近7日平均</div>
                  </div>
                </div>
              </el-col>
            </el-row>
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
      
      <!-- 最新文章和打卡记录 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>最新文章</span>
              <el-button link type="primary" @click="navigateToArticleList">查看全部</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <el-table :data="recentArticles" style="width: 100%">
              <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip></el-table-column>
              <el-table-column prop="view_count" label="浏览量" width="90"></el-table-column>
              <el-table-column prop="comment_count" label="评论数" width="90"></el-table-column>
              <el-table-column prop="created_at" label="发布日期" width="120"></el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button link type="primary" @click="viewArticle(scope.row.id)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>最新打卡记录</span>
              <el-button link type="primary" @click="navigateToCheckInList">查看全部</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <el-table :data="recentCheckIns" style="width: 100%">
              <el-table-column prop="task_name" label="任务名称" min-width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="user_name" label="用户" width="120"></el-table-column>
              <el-table-column prop="created_at" label="打卡时间" width="120"></el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button link type="primary" @click="viewCheckIn(scope.row.id)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useDashboardStoreHook } from "@/store/modules/dashboard";
import { useUserStoreHook } from "@/store/modules/user";
import { Refresh, User, Document, Calendar, Histogram } from "@element-plus/icons-vue";
import * as echarts from "echarts";

const router = useRouter();
const dashboardStore = useDashboardStoreHook();
const userStore = useUserStoreHook();

// 数据加载状态
const loading = ref(false);

// 仪表盘数据
const dashboardData = reactive({
  tenant_overview: {
    user_count: 0,
    active_users: 0,
    article_count: 0,
    comment_count: 0,
    check_in_count: 0,
    check_in_completion_rate: 0
  },
  user_activity: [],
  content_statistics: [],
  check_in_completion: [],
  recent_articles: [],
  recent_check_ins: []
});

// 今日打卡数量
const todayCheckIns = ref(0);

// 概览数据
const overviewData = computed(() => {
  return dashboardData.tenant_overview || {};
});

// 最近文章
const recentArticles = computed(() => {
  return dashboardData.recent_articles || [];
});

// 最近打卡记录
const recentCheckIns = computed(() => {
  return dashboardData.recent_check_ins || [];
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
  
  // 计算今日打卡数量
  calculateTodayCheckIns();
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
    const tenantId = userStore.tenantId;
    const data = await dashboardStore.fetchTenantAdminDashboard(tenantId);
    
    if (data) {
      // 更新数据
      Object.assign(dashboardData, data);
      
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

// 计算今日打卡数量
const calculateTodayCheckIns = () => {
  if (!dashboardData.recent_check_ins || dashboardData.recent_check_ins.length === 0) {
    todayCheckIns.value = 0;
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  todayCheckIns.value = dashboardData.recent_check_ins.filter(item => 
    item.created_at.startsWith(today)
  ).length;
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
  
  const activityData = dashboardData.user_activity || [];
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
  
  const contentData = dashboardData.content_statistics || [];
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
  
  const completionData = dashboardData.check_in_completion || [];
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
      end_date: val[1],
      tenant_id: userStore.tenantId
    });
  }
};

const handleContentDateChange = (val) => {
  if (val && val.length === 2) {
    fetchContentData({
      start_date: val[0],
      end_date: val[1],
      tenant_id: userStore.tenantId
    });
  }
};

const handleCheckInDateChange = (val) => {
  if (val && val.length === 2) {
    fetchCheckInData({
      start_date: val[0],
      end_date: val[1],
      tenant_id: userStore.tenantId
    });
  }
};

// 获取指定时间范围的活跃度数据
const fetchActivityData = async (params) => {
  loading.value = true;
  
  try {
    const result = await dashboardStore.fetchUserActivity(params);
    if (result) {
      dashboardData.user_activity = result;
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
      dashboardData.content_statistics = result;
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
      dashboardData.check_in_completion = result;
      initCheckInCompletionChart();
    }
  } finally {
    loading.value = false;
  }
};

// 跳转到文章详情
const viewArticle = (id: number) => {
  router.push(`/cms/article/detail/${id}`);
};

// 跳转到打卡详情
const viewCheckIn = (id: number) => {
  router.push(`/check/record/detail/${id}`);
};

// 跳转到文章列表
const navigateToArticleList = () => {
  router.push("/cms/article/list");
};

// 跳转到打卡记录列表
const navigateToCheckInList = () => {
  router.push("/check/record");
};
</script>

<style scoped>
.tenant-dashboard-container {
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
  margin-bottom: 5px;
}

.overview-item .subtitle {
  font-size: 12px;
  color: #909399;
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

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
  width: 100%;
}
</style> 
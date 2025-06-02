<template>
  <div class="user-dashboard-container">
    <el-row :gutter="20">
      <!-- 用户概览 -->
      <el-col :span="24">
        <el-card class="user-overview" shadow="never">
          <template #header>
            <div class="card-header">
              <span>我的概览</span>
              <el-button type="primary" :icon="Refresh" @click="refreshData">刷新</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-blue">
                    <el-icon><Calendar /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">打卡记录</div>
                    <div class="value">{{ userOverview.check_in_count || 0 }}</div>
                    <div class="subtitle">本周完成率: {{ checkInCompletionRate }}%</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-green">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">我的文章</div>
                    <div class="value">{{ userOverview.article_count || 0 }}</div>
                    <div class="subtitle">总浏览量: {{ totalViews }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-orange">
                    <el-icon><ChatDotRound /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">我的评论</div>
                    <div class="value">{{ userOverview.comment_count || 0 }}</div>
                    <div class="subtitle">本周: {{ weeklyComments }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="overview-item">
                  <div class="icon bg-purple">
                    <el-icon><Clock /></el-icon>
                  </div>
                  <div class="content">
                    <div class="title">上次登录</div>
                    <div class="value-sm">{{ formatDate(userOverview.last_login) }}</div>
                    <div class="subtitle">欢迎回来！</div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
      
      <!-- 待完成任务 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>待完成任务</span>
              <el-button link type="primary" @click="navigateToCheckInPage">查看全部</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <el-empty v-if="upcomingTasks.length === 0" description="暂无待完成任务"></el-empty>
            <div v-else>
              <div v-for="(task, index) in upcomingTasks" :key="index" class="task-item">
                <div class="task-content">
                  <div class="task-name">{{ task.task_name }}</div>
                  <div class="task-due">截止时间: {{ formatDateTime(task.due_date) }}</div>
                </div>
                <div class="task-action">
                  <el-button type="primary" size="small" @click="goToTask(task.id)">立即打卡</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 最近打卡记录 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>最近打卡记录</span>
              <el-button link type="primary" @click="navigateToCheckInRecords">查看全部</el-button>
            </div>
          </template>
          <div v-loading="loading">
            <el-empty v-if="recentCheckIns.length === 0" description="暂无打卡记录"></el-empty>
            <div v-else>
              <div v-for="(record, index) in recentCheckIns" :key="index" class="check-in-item">
                <div class="check-in-icon" :class="getStatusClass(record.status)">
                  <el-icon>
                    <component :is="getStatusIcon(record.status)"></component>
                  </el-icon>
                </div>
                <div class="check-in-content">
                  <div class="check-in-name">{{ record.task_name }}</div>
                  <div class="check-in-time">{{ formatDateTime(record.created_at) }}</div>
                </div>
                <div class="check-in-status">
                  <el-tag :type="getTagType(record.status)" size="small">{{ getStatusText(record.status) }}</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 我的文章 -->
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>我的文章</span>
              <div>
                <el-button type="primary" size="small" @click="createArticle">写新文章</el-button>
                <el-button link type="primary" @click="navigateToArticleList">查看全部</el-button>
              </div>
            </div>
          </template>
          <div v-loading="loading">
            <el-empty v-if="recentArticles.length === 0" description="暂无文章"></el-empty>
            <el-table v-else :data="recentArticles" style="width: 100%">
              <el-table-column prop="title" label="标题" min-width="300" show-overflow-tooltip></el-table-column>
              <el-table-column prop="view_count" label="浏览量" width="100" sortable></el-table-column>
              <el-table-column prop="comment_count" label="评论数" width="100" sortable></el-table-column>
              <el-table-column prop="created_at" label="发布日期" width="150"></el-table-column>
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button link type="primary" @click="viewArticle(scope.row.id)">查看</el-button>
                  <el-button link type="primary" @click="editArticle(scope.row.id)">编辑</el-button>
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
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDashboardStoreHook } from "@/store/modules/dashboard";
import { Refresh, Calendar, Document, ChatDotRound, Clock, Check, Close, Warning } from "@element-plus/icons-vue";

const router = useRouter();
const dashboardStore = useDashboardStoreHook();

// 数据加载状态
const loading = ref(false);

// 用户仪表盘数据
const dashboardData = reactive({
  user_overview: {
    check_in_count: 0,
    article_count: 0,
    comment_count: 0,
    last_login: ""
  },
  recent_articles: [],
  recent_check_ins: [],
  upcoming_tasks: []
});

// 用户概览数据
const userOverview = computed(() => dashboardData.user_overview || {});

// 最近文章
const recentArticles = computed(() => dashboardData.recent_articles || []);

// 最近打卡记录
const recentCheckIns = computed(() => dashboardData.recent_check_ins || []);

// 待完成任务
const upcomingTasks = computed(() => dashboardData.upcoming_tasks || []);

// 计算总浏览量
const totalViews = computed(() => {
  return dashboardData.recent_articles.reduce((sum, article) => sum + (article.view_count || 0), 0);
});

// 计算本周评论数
const weeklyComments = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return 0; // 这里需要实际的评论数据计算
});

// 计算打卡完成率
const checkInCompletionRate = computed(() => {
  // 这里需要实际数据来计算
  return 85;
});

// 初始化
onMounted(async () => {
  await fetchDashboardData();
});

// 获取用户仪表盘数据
const fetchDashboardData = async () => {
  loading.value = true;
  
  try {
    const data = await dashboardStore.fetchUserDashboard();
    
    if (data) {
      // 更新数据
      Object.assign(dashboardData, data);
    }
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = () => {
  fetchDashboardData();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 获取状态标签类型
const getTagType = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'pending': return 'warning';
    case 'missed': return 'danger';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'completed': return '已完成';
    case 'pending': return '待完成';
    case 'missed': return '已错过';
    default: return '未知';
  }
};

// 获取状态图标
const getStatusIcon = (status) => {
  switch (status) {
    case 'completed': return 'Check';
    case 'pending': return 'Clock';
    case 'missed': return 'Close';
    default: return 'Warning';
  }
};

// 获取状态类名
const getStatusClass = (status) => {
  switch (status) {
    case 'completed': return 'status-completed';
    case 'pending': return 'status-pending';
    case 'missed': return 'status-missed';
    default: return '';
  }
};

// 导航到文章详情
const viewArticle = (id) => {
  router.push(`/cms/article/detail/${id}`);
};

// 编辑文章
const editArticle = (id) => {
  router.push(`/cms/article/edit/${id}`);
};

// 新建文章
const createArticle = () => {
  router.push("/cms/article/create");
};

// 跳转到任务详情
const goToTask = (id) => {
  router.push(`/check/record/create?task_id=${id}`);
};

// 导航到文章列表
const navigateToArticleList = () => {
  router.push("/cms/article/list");
};

// 导航到打卡页面
const navigateToCheckInPage = () => {
  router.push("/check/task");
};

// 导航到打卡记录
const navigateToCheckInRecords = () => {
  router.push("/check/record");
};
</script>

<style scoped>
.user-dashboard-container {
  padding: 10px;
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

.overview-item .value-sm {
  font-size: 18px;
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

.el-card {
  margin-bottom: 20px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  align-items: center;
}

.task-item:last-child {
  border-bottom: none;
}

.task-content {
  flex: 1;
}

.task-name {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.task-due {
  font-size: 12px;
  color: #909399;
}

.check-in-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  align-items: center;
}

.check-in-item:last-child {
  border-bottom: none;
}

.check-in-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  margin-right: 15px;
}

.status-completed {
  background-color: #67C23A;
}

.status-pending {
  background-color: #E6A23C;
}

.status-missed {
  background-color: #F56C6C;
}

.check-in-content {
  flex: 1;
}

.check-in-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

.check-in-time {
  font-size: 12px;
  color: #909399;
}

.check-in-status {
  margin-left: 10px;
}
</style> 
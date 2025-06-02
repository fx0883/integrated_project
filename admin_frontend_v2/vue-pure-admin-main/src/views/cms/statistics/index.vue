<template>
  <div class="statistics-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">内容管理统计分析</span>
          <div class="right">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
            />
            <el-button type="primary" :icon="Refresh" @click="refreshData">刷新数据</el-button>
          </div>
        </div>
      </template>

      <!-- 统计概览 -->
      <div class="overview-section" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-icon blue">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">文章总数</div>
                <div class="stat-value">{{ statistics.overview.article_count }}</div>
                <div class="stat-subtext">今日: +{{ statistics.overview.today_articles }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-icon green">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">评论总数</div>
                <div class="stat-value">{{ statistics.overview.comment_count }}</div>
                <div class="stat-subtext">今日: +{{ statistics.overview.today_comments }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-icon orange">
                <el-icon><View /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">浏览总数</div>
                <div class="stat-value">{{ statistics.overview.view_count }}</div>
                <div class="stat-subtext">今日: +{{ statistics.overview.today_views }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-icon purple">
                <el-icon><Collection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-title">分类/标签</div>
                <div class="stat-value">{{ statistics.overview.category_count }} / {{ statistics.overview.tag_count }}</div>
                <div class="stat-subtext">分类 / 标签数量</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 趋势图表 -->
      <div class="trend-charts-section" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>内容趋势分析</span>
                  <el-radio-group v-model="activeChart" size="small">
                    <el-radio-button label="article">文章发布</el-radio-button>
                    <el-radio-button label="comment">评论数量</el-radio-button>
                    <el-radio-button label="view">浏览数量</el-radio-button>
                  </el-radio-group>
                </div>
              </template>
              <div ref="trendChartRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 内容分析 -->
      <div class="content-section" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>分类文章分布</span>
                </div>
              </template>
              <div ref="categoryChartRef" class="chart-container category-chart"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>热门文章</span>
                </div>
              </template>
              <el-table :data="statistics.popularArticles" style="width: 100%">
                <el-table-column prop="title" label="文章标题" min-width="200" show-overflow-tooltip />
                <el-table-column prop="view_count" label="浏览量" width="90" sortable />
                <el-table-column prop="comment_count" label="评论数" width="90" sortable />
                <el-table-column prop="created_at" label="发布日期" width="110" sortable />
                <el-table-column label="操作" width="90" fixed="right">
                  <template #default="{ row }">
                    <el-button link type="primary" @click="viewArticle(row.id)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useCmsStatisticsStoreHook } from "@/store/modules/cms";
import { Refresh, Document, ChatDotRound, View, Collection } from "@element-plus/icons-vue";
import * as echarts from "echarts";

// 路由实例
const router = useRouter();

// 统计数据
const statisticsStore = useCmsStatisticsStoreHook();
const statistics = reactive({
  overview: computed(() => statisticsStore.overview),
  articleTrend: computed(() => statisticsStore.articleTrend),
  commentTrend: computed(() => statisticsStore.commentTrend),
  viewTrend: computed(() => statisticsStore.viewTrend),
  popularArticles: computed(() => statisticsStore.popularArticles),
  categoryDistribution: computed(() => statisticsStore.categoryDistribution)
});
const loading = computed(() => statisticsStore.loading);

// 日期范围
const dateRange = ref([]);
const dateParams = reactive({
  start_date: undefined,
  end_date: undefined
});

// 图表引用
const trendChartRef = ref<HTMLElement | null>(null);
const categoryChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let categoryChart: echarts.ECharts | null = null;

// 当前活动图表
const activeChart = ref("article");

// 初始化
onMounted(async () => {
  await fetchStatisticsData();
  
  window.addEventListener("resize", handleResize);
});

// 组件卸载
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  trendChart?.dispose();
  categoryChart?.dispose();
});

// 监听图表类型变化
watch(activeChart, () => {
  updateTrendChart();
});

// 获取统计数据
const fetchStatisticsData = async () => {
  await statisticsStore.fetchAllStatistics(dateParams);
  
  nextTick(() => {
    initCharts();
  });
};

// 刷新数据
const refreshData = () => {
  fetchStatisticsData();
};

// 处理日期范围变化
const handleDateRangeChange = (val: any) => {
  if (val && val.length === 2) {
    dateParams.start_date = val[0];
    dateParams.end_date = val[1];
  } else {
    dateParams.start_date = undefined;
    dateParams.end_date = undefined;
  }
  fetchStatisticsData();
};

// 初始化图表
const initCharts = () => {
  initTrendChart();
  initCategoryChart();
};

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChartRef.value) return;
  
  if (trendChart) {
    trendChart.dispose();
  }
  
  trendChart = echarts.init(trendChartRef.value);
  updateTrendChart();
};

// 更新趋势图表
const updateTrendChart = () => {
  if (!trendChart) return;

  let data = [];
  let title = "";
  let color = "";

  switch (activeChart.value) {
    case "article":
      data = statistics.articleTrend;
      title = "文章发布趋势";
      color = "#409EFF";
      break;
    case "comment":
      data = statistics.commentTrend;
      title = "评论数量趋势";
      color = "#67C23A";
      break;
    case "view":
      data = statistics.viewTrend;
      title = "浏览量趋势";
      color = "#E6A23C";
      break;
  }

  const dates = data.map(item => item.date);
  const counts = data.map(item => item.count);

  const option = {
    title: {
      text: title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '数量',
        type: 'line',
        data: counts,
        smooth: true,
        lineStyle: {
          width: 3,
          color: color
        },
        itemStyle: {
          color: color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color.replace(')', ', 0.3)').replace('rgb', 'rgba') },
              { offset: 1, color: color.replace(')', ', 0.1)').replace('rgb', 'rgba') }
            ]
          }
        }
      }
    ]
  };

  trendChart.setOption(option);
};

// 初始化分类图表
const initCategoryChart = () => {
  if (!categoryChartRef.value) return;
  
  if (categoryChart) {
    categoryChart.dispose();
  }
  
  categoryChart = echarts.init(categoryChartRef.value);
  
  const categoryData = statistics.categoryDistribution;
  const data = categoryData.map(item => ({
    name: item.category_name,
    value: item.article_count
  }));
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '分类分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  };
  
  categoryChart.setOption(option);
};

// 处理窗口大小变化
const handleResize = () => {
  trendChart?.resize();
  categoryChart?.resize();
};

// 查看文章
const viewArticle = (id: number) => {
  router.push(`/cms/article/detail/${id}`);
};
</script>

<style scoped>
.statistics-container {
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right {
  display: flex;
  gap: 10px;
}

.overview-section {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  padding: 10px;
  height: 120px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 15px;
}

.stat-icon.blue {
  background-color: #409EFF;
}

.stat-icon.green {
  background-color: #67C23A;
}

.stat-icon.orange {
  background-color: #E6A23C;
}

.stat-icon.purple {
  background-color: #8e44ad;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-subtext {
  font-size: 12px;
  color: #909399;
}

.trend-charts-section, .content-section {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 350px;
}

.category-chart {
  height: 320px;
}
</style> 
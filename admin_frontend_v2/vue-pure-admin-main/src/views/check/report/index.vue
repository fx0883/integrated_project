<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">打卡统计报表</span>
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="任务类型">
          <el-select v-model="queryParams.category_id" placeholder="选择类型" clearable>
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
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
      
      <!-- 统计卡片 -->
      <div class="statistic-summary" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="statistic-card">
              <template #header>
                <div class="card-header-center">
                  <el-icon><Tools /></el-icon>
                  <span>任务总数</span>
                </div>
              </template>
              <div class="statistic-value">{{ statisticData.total_tasks || 0 }}</div>
              <div class="statistic-label">个</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="statistic-card">
              <template #header>
                <div class="card-header-center">
                  <el-icon><User /></el-icon>
                  <span>参与人数</span>
                </div>
              </template>
              <div class="statistic-value">{{ statisticData.total_users || 0 }}</div>
              <div class="statistic-label">人</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="statistic-card">
              <template #header>
                <div class="card-header-center">
                  <el-icon><Checked /></el-icon>
                  <span>打卡总数</span>
                </div>
              </template>
              <div class="statistic-value">{{ statisticData.total_records || 0 }}</div>
              <div class="statistic-label">次</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="statistic-card">
              <template #header>
                <div class="card-header-center">
                  <el-icon><DataAnalysis /></el-icon>
                  <span>平均完成率</span>
                </div>
              </template>
              <div class="statistic-value">{{ (statisticData.avg_completion_rate * 100 || 0).toFixed(1) }}%</div>
              <div class="statistic-label">
                <el-progress
                  :percentage="statisticData.avg_completion_rate * 100 || 0"
                  :status="getProgressStatus(statisticData.avg_completion_rate || 0)"
                />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 趋势图表 -->
      <div class="chart-container" v-loading="loading">
        <el-tabs v-model="activeChart" @tab-click="handleChartChange">
          <el-tab-pane label="日打卡趋势" name="daily">
            <div class="chart-header">
              <h3 class="chart-title">
                <el-icon><TrendCharts /></el-icon>
                日打卡趋势
              </h3>
            </div>
            <div ref="dailyChartRef" class="chart-box"></div>
          </el-tab-pane>
          
          <el-tab-pane label="任务完成率排行" name="task">
            <div class="chart-header">
              <h3 class="chart-title">
                <el-icon><Trophy /></el-icon>
                任务完成率排行
              </h3>
            </div>
            <div ref="taskChartRef" class="chart-box"></div>
          </el-tab-pane>
          
          <el-tab-pane label="用户活跃度排行" name="user">
            <div class="chart-header">
              <h3 class="chart-title">
                <el-icon><Avatar /></el-icon>
                用户活跃度排行
              </h3>
            </div>
            <div ref="userChartRef" class="chart-box"></div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 任务列表 -->
      <div class="task-list-container" v-loading="loading">
        <div class="section-header">
          <h3 class="section-title">
            <el-icon><List /></el-icon>
            任务统计列表
          </h3>
        </div>
        
        <el-table
          :data="taskList"
          border
          style="width: 100%"
        >
          <el-table-column prop="task_title" label="任务名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="category_name" label="所属类型" width="120" />
          <el-table-column prop="total_users" label="参与人数" width="100" align="center" />
          <el-table-column prop="total_records" label="打卡次数" width="100" align="center" />
          <el-table-column label="完成率" min-width="200">
            <template #default="{ row }">
              <el-progress
                :percentage="row.completion_rate * 100"
                :format="percentFormat"
                :status="getProgressStatus(row.completion_rate)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                :icon="View"
                @click="viewTaskDetail(row.task_id)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useCheckCategoryStoreHook } from "@/store/modules/check/category";
import { useCheckStatisticStoreHook } from "@/store/modules/check/statistic";
import type { CheckCategory } from "../../../../types/check";
import * as echarts from "echarts";
import { 
  Search, Refresh, View, DataAnalysis, Tools, User, Checked, 
  TrendCharts, Trophy, Avatar, List
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();

// store实例
const categoryStore = useCheckCategoryStoreHook();
const statisticStore = useCheckStatisticStoreHook();

// 统计数据
const statisticData = computed(() => statisticStore.statisticData);
const loading = computed(() => statisticStore.loading);

// 类别选项
const categoryOptions = ref<CheckCategory[]>([]);
const taskList = ref<any[]>([]);

// 图表引用
const dailyChartRef = ref<HTMLElement | null>(null);
const taskChartRef = ref<HTMLElement | null>(null);
const userChartRef = ref<HTMLElement | null>(null);

// 图表实例
let dailyChartInstance: echarts.ECharts | null = null;
let taskChartInstance: echarts.ECharts | null = null;
let userChartInstance: echarts.ECharts | null = null;

// 日期范围
const dateRange = ref<string[]>([]);

// 查询参数
const queryParams = reactive({
  category_id: undefined,
  start_date: undefined,
  end_date: undefined
});

// 当前图表
const activeChart = ref('daily');

// 监听日期范围变化
watch(dateRange, (val) => {
  handleDateRangeChange(val);
});

// 初始化
onMounted(async () => {
  await fetchCategories();
  await fetchStatistics();
  
  // 监听窗口大小变化，自动调整图表大小
  window.addEventListener('resize', () => {
    dailyChartInstance?.resize();
    taskChartInstance?.resize();
    userChartInstance?.resize();
  });
});

// 获取分类列表（用于筛选）
const fetchCategories = async () => {
  const result = await categoryStore.fetchCategories();
  if (result) {
    categoryOptions.value = result.list;
  }
};

// 获取打卡统计数据
const fetchStatistics = async () => {
  await statisticStore.fetchStatistics(queryParams);
  
  nextTick(() => {
    initCharts();
  });
};

// 搜索
const handleSearch = async () => {
  await fetchStatistics();
  nextTick(() => {
    initCharts();
  });
};

// 重置查询
const resetQuery = () => {
  queryParams.category_id = undefined;
  queryParams.start_date = undefined;
  queryParams.end_date = undefined;
  dateRange.value = [];
  handleSearch();
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

// 图表初始化
const initCharts = () => {
  // 初始化日趋势图表
  initDailyChart();
  
  // 初始化任务完成率图表
  initTaskChart();
  
  // 初始化用户活跃度图表
  initUserChart();
};

// 初始化日趋势图表
const initDailyChart = () => {
  if (!dailyChartRef.value) return;
  
  // 如果已经存在实例，先销毁
  if (dailyChartInstance) {
    dailyChartInstance.dispose();
  }
  
  dailyChartInstance = echarts.init(dailyChartRef.value);
  
  const dailyData = statisticData.value.daily_trend || [];
  const dates = dailyData.map(item => item.date);
  const counts = dailyData.map(item => item.count);
    
  const option = {
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
      type: 'value',
      name: '打卡次数'
      },
      series: [
        {
          name: '打卡次数',
        type: 'line',
          data: counts,
        smooth: true,
        lineStyle: {
          width: 3
        },
          itemStyle: {
            color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64,158,255,0.3)' },
              { offset: 1, color: 'rgba(64,158,255,0.1)' }
      ]
          }
        }
      }
    ]
  };
  
  dailyChartInstance.setOption(option);
};

// 初始化任务完成率图表
const initTaskChart = () => {
  if (!taskChartRef.value) return;
  
  // 如果已经存在实例，先销毁
  if (taskChartInstance) {
    taskChartInstance.dispose();
  }
  
  taskChartInstance = echarts.init(taskChartRef.value);
  
  // 获取任务排行数据（按完成率排序）
  const taskRanking = statisticStore.getTaskRanking.slice(0, 10);
  const taskNames = taskRanking.map(item => item.task_title);
  const taskRates = taskRanking.map(item => (item.completion_rate * 100).toFixed(1));
    
  const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c}%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
      name: '完成率',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      yAxis: {
        type: 'category',
        data: taskNames,
        axisLabel: {
        interval: 0,
        width: 150,
        overflow: 'truncate'
        }
      },
      series: [
        {
          name: '完成率',
          type: 'bar',
        data: taskRates,
          itemStyle: {
          color: function(params) {
            const rate = params.value;
            if (rate >= 80) return '#67C23A';
            if (rate >= 60) return '#E6A23C';
                return '#F56C6C';
            }
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%'
          }
        }
      ]
  };
  
  taskChartInstance.setOption(option);
};

// 初始化用户活跃度图表
const initUserChart = () => {
  if (!userChartRef.value) return;
  
  // 如果已经存在实例，先销毁
  if (userChartInstance) {
    userChartInstance.dispose();
  }
  
  userChartInstance = echarts.init(userChartRef.value);
  
  // 获取用户排行数据（按完成数量排序）
  const userRanking = statisticStore.getUserRanking.slice(0, 10);
  const userNames = userRanking.map(item => item.user_name);
  const userCounts = userRanking.map(item => item.complete_count);
    
  const option = {
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
      type: 'value',
      name: '打卡次数'
      },
      yAxis: {
        type: 'category',
        data: userNames,
        axisLabel: {
        interval: 0,
          width: 120,
        overflow: 'truncate'
        }
      },
      series: [
        {
          name: '打卡次数',
          type: 'bar',
        data: userCounts,
          itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3AA1FF' },
            { offset: 1, color: '#36CBCB' }
          ])
          },
          label: {
            show: true,
            position: 'right'
          }
        }
      ]
  };
  
  userChartInstance.setOption(option);
};

// 切换图表
const handleChartChange = () => {
  nextTick(() => {
    if (activeChart.value === 'daily' && dailyChartInstance) {
      dailyChartInstance.resize();
    } else if (activeChart.value === 'task' && taskChartInstance) {
      taskChartInstance.resize();
    } else if (activeChart.value === 'user' && userChartInstance) {
      userChartInstance.resize();
    }
  });
};

// 查看任务详情
const viewTaskDetail = (taskId: number) => {
  router.push(`/check/task/detail/${taskId}`);
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

// 监听窗口大小变化，调整图表大小
const resizeCharts = () => {
  dailyChartInstance?.resize();
  taskChartInstance?.resize();
  userChartInstance?.resize();
};

// 监听窗口大小变化
window.addEventListener('resize', resizeCharts);

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts);
  
  // 销毁图表实例
  dailyChartInstance?.dispose();
  taskChartInstance?.dispose();
  userChartInstance?.dispose();
});
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

.search-form {
  margin-bottom: 20px;
}

.statistic-summary {
  margin: 20px 0 30px;
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

.chart-container {
  margin-bottom: 30px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.chart-box {
  width: 100%;
  height: 400px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.task-list-container {
  margin-top: 30px;
}
</style> 
<script lang="ts" setup>
import { ref, reactive, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElLoading } from "element-plus";
import dayjs from "dayjs";
import { debounce } from "@pureadmin/utils";

// 导入子组件
import DateRangePicker from "./DateRangePicker.vue";
import PeriodSelector from "./PeriodSelector.vue";
import UserStatisticCard from "./UserStatisticCard.vue";
import UserGrowthChart from "./Charts/UserGrowthChart.vue";
import UserRoleChart from "./Charts/UserRoleChart.vue";
import ActiveUsersChart from "./Charts/ActiveUsersChart.vue";
import LoginHeatmapChart from "./Charts/LoginHeatmapChart.vue";

// 导入API和类型
import {
  fetchUserGrowthTrend,
  fetchUserRoleDistribution,
  fetchActiveUsers,
  fetchLoginHeatmap,
  calculateUserSummary,
  formatChartData
} from "@/api/modules/user";
import type {
  UserGrowthData,
  UserRoleData,
  ActiveUsersData,
  LoginHeatmapData,
  UserSummary,
  ChartPeriod
} from "@/types/user";

// 导入日志工具
import logger from "@/utils/logger";

// 定义props
const props = defineProps({
  initialPeriod: {
    type: String as () => ChartPeriod,
    default: "monthly"
  },
  initialDateRange: {
    type: Object as () => { startDate: string; endDate: string },
    default: () => {
      // 默认显示最近3个月的数据
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().subtract(3, "month").format("YYYY-MM-DD");
      return { startDate: start, endDate: end };
    }
  }
});

// i18n支持
const { t } = useI18n();

// 状态定义
const period = ref<ChartPeriod>(props.initialPeriod);
const startDate = ref<string>(props.initialDateRange.startDate);
const endDate = ref<string>(props.initialDateRange.endDate);
const dataFetchAttempts = ref(0);
const MAX_RETRY_ATTEMPTS = 3;
const chartRenderingAttempts = ref(0);
const MAX_CHART_RENDER_ATTEMPTS = 3;
const isDateChanging = ref(false);
const fullscreenLoading = ref(false);

logger.debug("UserCharts组件初始化", {
  initialPeriod: props.initialPeriod,
  dateRange: { startDate: startDate.value, endDate: endDate.value }
});

// 加载状态
const loading = reactive({
  growth: false,
  role: false,
  active: false,
  heatmap: false
});

// 错误信息
const error = ref<string>("");

// 图表数据
const growthData = ref<UserGrowthData | null>(null);
const roleData = ref<UserRoleData | null>(null);
const activeUsersData = ref<ActiveUsersData | null>(null);
const heatmapData = ref<LoginHeatmapData | null>(null);
const summaryData = ref<UserSummary | null>(null);

// 图表初始化状态跟踪
const chartInitStatus = reactive({
  growth: false,
  role: false,
  active: false,
  heatmap: false
});

// 图表引用
const growthChartRef = ref(null);
const roleChartRef = ref(null);
const activeChartRef = ref(null);
const heatmapChartRef = ref(null);

/**
 * 处理图表初始化完成事件
 */
function handleChartInitComplete(chartId) {
  logger.debug(`图表初始化完成: ${chartId}`);

  // 根据图表ID更新初始化状态
  if (chartId.includes("growth")) {
    chartInitStatus.growth = true;
  } else if (chartId.includes("role")) {
    chartInitStatus.role = true;
  } else if (chartId.includes("active")) {
    chartInitStatus.active = true;
  } else if (chartId.includes("heatmap")) {
    chartInitStatus.heatmap = true;
  }

  logger.debug("图表初始化状态:", chartInitStatus);
}

/**
 * 获取用户增长趋势数据 - 适配新的图表组件
 */
async function fetchGrowthDataFn() {
  logger.debug("开始获取用户增长趋势数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  logger.debug("【API请求开始】fetchGrowthData", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value,
    timestamp: new Date().toISOString()
  });

  loading.growth = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchUserGrowthTrend(
      period.value,
      startDate.value,
      endDate.value
    );
    const endTime = Date.now();

    logger.debug(
      `【API请求完成】fetchGrowthData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("用户增长趋势数据获取成功", {
        labels: response.data?.labels?.length,
        dataPoints: response.data?.datasets?.[0]?.data?.length
      });

      const formattedData = formatChartData(response.data);
      logger.debug(
        "【用户增长趋势】数据处理结果:",
        JSON.stringify(formattedData)
      );

      // 计算汇总数据
      if (formattedData) {
        summaryData.value = calculateUserSummary(
          formattedData,
          activeUsersData.value
        );
        logger.debug("用户汇总数据计算完成", summaryData.value);
      }

      return formattedData;
    } else {
      logger.warn("用户增长趋势数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err) {
    logger.error("用户增长趋势数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
    throw err;
  } finally {
    loading.growth = false;
  }
}

/**
 * 获取用户角色分布数据 - 适配新的图表组件
 */
async function fetchRoleDataFn() {
  logger.debug("开始获取用户角色分布数据");

  logger.debug("【API请求开始】fetchRoleData", {
    timestamp: new Date().toISOString()
  });

  loading.role = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchUserRoleDistribution();
    const endTime = Date.now();

    logger.debug(
      `【API请求完成】fetchRoleData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("用户角色分布数据获取成功", {
        labels: response.data?.labels?.length,
        data: response.data?.datasets?.[0]?.data?.length
      });

      const formattedData = formatChartData(response.data);
      roleData.value = formattedData;
      return formattedData;
    } else {
      logger.warn("用户角色分布数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err) {
    logger.error("用户角色分布数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
    throw err;
  } finally {
    loading.role = false;
  }
}

/**
 * 获取活跃用户数据 - 适配新的图表组件
 */
async function fetchActiveDataFn(periodParam = null) {
  const currentPeriod = periodParam || period.value;

  logger.debug("开始获取活跃用户数据", {
    period: currentPeriod,
    startDate: startDate.value,
    endDate: endDate.value
  });

  logger.debug("【API请求开始】fetchActiveData", {
    period: currentPeriod,
    startDate: startDate.value,
    endDate: endDate.value,
    timestamp: new Date().toISOString()
  });

  loading.active = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchActiveUsers(
      currentPeriod,
      startDate.value,
      endDate.value
    );
    const endTime = Date.now();

    logger.debug(
      `【API请求完成】fetchActiveData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("活跃用户数据获取成功", {
        labels: response.data?.labels?.length,
        datasets: response.data?.datasets?.length
      });

      const formattedData = formatChartData(response.data);
      activeUsersData.value = formattedData;

      // 更新汇总数据
      if (growthData.value) {
        summaryData.value = calculateUserSummary(
          growthData.value,
          formattedData
        );
      }

      return formattedData;
    } else {
      logger.warn("活跃用户数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err) {
    logger.error("活跃用户数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
    throw err;
  } finally {
    loading.active = false;
  }
}

/**
 * 获取登录热力图数据 - 适配新的图表组件
 */
async function fetchHeatmapDataFn() {
  logger.debug("开始获取登录热力图数据", {
    startDate: startDate.value,
    endDate: endDate.value
  });

  logger.debug("【API请求开始】fetchHeatmapData", {
    startDate: startDate.value,
    endDate: endDate.value,
    timestamp: new Date().toISOString()
  });

  loading.heatmap = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchLoginHeatmap(startDate.value, endDate.value);
    const endTime = Date.now();

    logger.debug(
      `【API请求完成】fetchHeatmapData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("登录热力图数据获取成功", {
        xLabels: response.data?.x_labels?.length,
        yLabels: response.data?.y_labels?.length,
        dataset: response.data?.dataset?.length
      });

      const formattedData = response.data;
      heatmapData.value = formattedData;
      return formattedData;
    } else {
      logger.warn("登录热力图数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err) {
    logger.error("登录热力图数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
    throw err;
  } finally {
    loading.heatmap = false;
  }
}

/**
 * 处理图表数据加载完成事件
 */
function handleDataLoaded(chartType, data) {
  logger.debug(`${chartType}图表数据加载完成`, data);

  // 根据图表类型更新相应数据
  switch (chartType) {
    case "growth":
      growthData.value = data;
      break;
    case "role":
      roleData.value = data;
      break;
    case "active":
      activeUsersData.value = data;
      break;
    case "heatmap":
      heatmapData.value = data;
      break;
  }
}

/**
 * 获取所有图表数据
 */
async function fetchAllData() {
  logger.debug("开始获取所有图表数据");
  logger.debug("开始获取所有图表数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value,
    timestamp: new Date().toISOString()
  });

  error.value = "";
  fullscreenLoading.value = true;

  try {
    // 不再直接调用API，而是等待图表组件自行加载数据
    // 图表组件会在DOM就绪后自动调用fetchDataFn获取数据

    // 显示全屏加载状态，防止用户进行其他操作
    const loadingInstance = ElLoading.service({
      lock: true,
      text: t("dashboard.updatingCharts"),
      background: "rgba(255, 255, 255, 0.7)"
    });

    // 重置图表渲染尝试次数
    chartRenderingAttempts.value = 0;

    // 等待一段时间，确保DOM更新和图表初始化
    await new Promise(resolve => setTimeout(resolve, 500));

    // 关闭加载状态
    loadingInstance.close();

    logger.debug("图表数据加载流程启动完成");
  } catch (err) {
    logger.error("获取图表数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    fullscreenLoading.value = false;
  }
}

/**
 * 强制重新初始化所有图表
 * 用于确保日期变更后图表正确渲染
 */
function forceReinitCharts() {
  if (chartRenderingAttempts.value >= MAX_CHART_RENDER_ATTEMPTS) {
    logger.warn(`已达到最大图表渲染尝试次数(${MAX_CHART_RENDER_ATTEMPTS})`);
    chartRenderingAttempts.value = 0;
    return;
  }

  logger.debug(
    `强制重新初始化图表 (${chartRenderingAttempts.value + 1}/${MAX_CHART_RENDER_ATTEMPTS})`
  );

  // 直接调用图表组件的forceReInit方法
  nextTick(() => {
    // 调用各图表组件的forceReInit方法
    if (
      growthChartRef.value &&
      typeof growthChartRef.value.forceReInit === "function"
    ) {
      growthChartRef.value.forceReInit();
    }

    if (
      roleChartRef.value &&
      typeof roleChartRef.value.forceReInit === "function"
    ) {
      roleChartRef.value.forceReInit();
    }

    if (
      activeChartRef.value &&
      typeof activeChartRef.value.forceReInit === "function"
    ) {
      activeChartRef.value.forceReInit();
    }

    if (
      heatmapChartRef.value &&
      typeof heatmapChartRef.value.forceReInit === "function"
    ) {
      heatmapChartRef.value.forceReInit();
    }

    chartRenderingAttempts.value++;

    // 如果图表仍未正确渲染，再次尝试
    if (chartRenderingAttempts.value < MAX_CHART_RENDER_ATTEMPTS) {
      setTimeout(() => {
        forceReinitCharts();
      }, 300);
    }
  });
}

/**
 * 处理日期范围变更
 */
function handleDateRangeChange(range: { startDate: string; endDate: string }) {
  logger.debug("日期范围变更", {
    from: { startDate: startDate.value, endDate: endDate.value },
    to: range
  });

  logger.debug("日期范围变更", {
    from: { startDate: startDate.value, endDate: endDate.value },
    to: range
  });

  // 设置日期变更标志
  isDateChanging.value = true;

  // 显示全屏加载状态，防止用户进行其他操作
  const loadingInstance = ElLoading.service({
    lock: true,
    text: t("dashboard.updatingCharts"),
    background: "rgba(255, 255, 255, 0.7)"
  });

  // 更新日期值
  startDate.value = range.startDate;
  endDate.value = range.endDate;

  // 重置图表渲染尝试次数
  chartRenderingAttempts.value = 0;

  // 显式调用数据获取函数
  logger.debug("日期变更后立即调用fetchAllData");
  fetchAllData();

  // 延迟关闭加载状态，确保DOM有足够时间更新
  setTimeout(() => {
    loadingInstance.close();
    isDateChanging.value = false;
  }, 500);
}

/**
 * 处理周期变更
 */
function handlePeriodChange(newPeriod: ChartPeriod) {
  logger.debug("周期变更", {
    from: period.value,
    to: newPeriod
  });

  logger.debug("周期变更", {
    from: period.value,
    to: newPeriod
  });

  // 设置日期变更标志
  isDateChanging.value = true;

  // 显示全屏加载状态
  const loadingInstance = ElLoading.service({
    lock: true,
    text: t("dashboard.updatingCharts"),
    background: "rgba(255, 255, 255, 0.7)"
  });

  period.value = newPeriod;

  // 重置图表渲染尝试次数
  chartRenderingAttempts.value = 0;

  // 显式调用数据获取函数
  logger.debug("周期变更后立即调用fetchAllData");
  fetchAllData();

  // 延迟关闭加载状态
  setTimeout(() => {
    loadingInstance.close();
    isDateChanging.value = false;
  }, 500);
}

// 使用debounce防抖处理筛选条件变化
const debouncedFetchData = debounce(() => {
  // 避免在日期变更过程中触发数据获取
  if (!isDateChanging.value) {
    logger.debug("通过watch触发的数据获取");
    fetchAllData();
  } else {
    logger.debug("日期变更中，跳过watch触发的数据获取");
  }
}, 500);

// 监听日期和周期变化，重新加载数据
watch(
  [() => startDate.value, () => endDate.value, () => period.value],
  () => {
    logger.debug("检测到筛选条件变更，重新加载数据", {
      period: period.value,
      startDate: startDate.value,
      endDate: endDate.value
    });

    // 仅在非日期变更过程中触发
    if (!isDateChanging.value) {
      logger.debug("检测到筛选条件变更，准备调用debouncedFetchData");
      debouncedFetchData();
    } else {
      logger.debug("日期变更中，跳过watch触发的数据获取");
    }
  },
  { deep: true }
);

// 组件挂载时加载数据
onMounted(() => {
  logger.debug("UserCharts组件挂载，开始加载初始数据");
  logger.debug("UserCharts组件挂载，开始加载初始数据");

  // 延迟加载数据，确保DOM已完全渲染
  setTimeout(() => {
    fetchAllData();

    // 在数据加载后，再次尝试强制重新初始化图表
    setTimeout(() => {
      forceReinitCharts();
    }, 500);
  }, 300);

  // 监听浏览器窗口大小变化，在窗口大小变化时强制重新初始化图表
  window.addEventListener(
    "resize",
    debounce(() => {
      if (!isDateChanging.value) {
        forceReinitCharts();
      }
    }, 300)
  );
});
</script>

<template>
  <div class="user-charts-container">
    <!-- 筛选区域 -->
    <div class="filters-container">
      <DateRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:range="handleDateRangeChange"
        :disabled="fullscreenLoading"
      />
      <PeriodSelector
        :value="period"
        @update:period="handlePeriodChange"
        :disabled="fullscreenLoading"
      />
    </div>

    <!-- 汇总数据卡片 -->
    <div class="summary-container">
      <UserStatisticCard
        v-if="summaryData"
        :data="summaryData"
        :period="period"
      />
    </div>

    <!-- 图表区域 -->
    <div class="charts-wrapper">
      <el-row :gutter="20">
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.userGrowthTrend") }}</h3>
              <div v-if="loading.growth" class="chart-loading-indicator">
                <el-icon class="is-loading"
                  ><svg-icon name="ep:loading"
                /></el-icon>
              </div>
            </div>
            <div class="chart-body">
              <UserGrowthChart
                ref="growthChartRef"
                :loading="loading.growth"
                :period="period"
                :fetchDataFn="fetchGrowthDataFn"
                @init-complete="handleChartInitComplete"
                @data-loaded="data => handleDataLoaded('growth', data)"
                :key="`growth-${startDate}-${endDate}-${period}`"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.userRoleDistribution") }}</h3>
              <div v-if="loading.role" class="chart-loading-indicator">
                <el-icon class="is-loading"
                  ><svg-icon name="ep:loading"
                /></el-icon>
              </div>
            </div>
            <div class="chart-body">
              <UserRoleChart
                ref="roleChartRef"
                :loading="loading.role"
                :fetchDataFn="fetchRoleDataFn"
                @init-complete="handleChartInitComplete"
                @data-loaded="data => handleDataLoaded('role', data)"
                :key="`role-${startDate}-${endDate}`"
              />
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt-20">
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.activeUsers") }}</h3>
              <div v-if="loading.active" class="chart-loading-indicator">
                <el-icon class="is-loading"
                  ><svg-icon name="ep:loading"
                /></el-icon>
              </div>
            </div>
            <div class="chart-body">
              <ActiveUsersChart
                ref="activeChartRef"
                :loading="loading.active"
                :period="period"
                :fetchDataFn="fetchActiveDataFn"
                @init-complete="handleChartInitComplete"
                @data-loaded="data => handleDataLoaded('active', data)"
                :key="`active-${startDate}-${endDate}-${period}`"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.loginHeatmap") }}</h3>
              <div v-if="loading.heatmap" class="chart-loading-indicator">
                <el-icon class="is-loading"
                  ><svg-icon name="ep:loading"
                /></el-icon>
              </div>
            </div>
            <div class="chart-body">
              <LoginHeatmapChart
                ref="heatmapChartRef"
                :loading="loading.heatmap"
                :fetchDataFn="fetchHeatmapDataFn"
                @init-complete="handleChartInitComplete"
                @data-loaded="data => handleDataLoaded('heatmap', data)"
                :key="`heatmap-${startDate}-${endDate}`"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="error = ''"
    />
  </div>
</template>

<style scoped>
.user-charts-container {
  padding: 20px;
}

.filters-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.summary-container {
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.chart-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.chart-header {
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.chart-loading-indicator {
  color: #409eff;
  font-size: 16px;
}

.chart-body {
  padding: 20px;
  min-height: 300px;
  height: 300px;
  display: flex;
  flex-direction: column;
}
</style>

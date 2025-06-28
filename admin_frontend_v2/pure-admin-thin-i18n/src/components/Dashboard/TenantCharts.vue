<script lang="ts" setup>
import { ref, reactive, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElLoading } from "element-plus";
import dayjs from "dayjs";
import { debounce } from "@pureadmin/utils"; // 添加引入debounce

// 导入子组件
import DateRangePicker from "./DateRangePicker.vue";
import PeriodSelector from "./PeriodSelector.vue";
import StatisticCard from "./StatisticCard.vue";
import TenantTrendChart from "./Charts/TenantTrendChart.vue";
import TenantStatusChart from "./Charts/TenantStatusChart.vue";
import TenantCreationChart from "./Charts/TenantCreationChart.vue";

// 导入API和类型
import {
  fetchTenantTrendData,
  fetchTenantStatusDistribution,
  fetchTenantCreationRate,
  calculateTenantSummary,
  formatChartData
} from "@/api/modules/tenant";
import type {
  TenantChartData,
  TenantStatusData,
  TenantCreationData,
  TenantSummary,
  ChartPeriod
} from "@/types/tenant";

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
      // 这里使用系统中已知有数据的日期范围
      const end = "2025-06-13";
      const start = "2025-03-13";
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
const dataFetchAttempts = ref(0); // 添加重试计数器
const MAX_RETRY_ATTEMPTS = 3; // 最大重试次数
const chartRenderingAttempts = ref(0); // 图表渲染尝试次数
const MAX_CHART_RENDER_ATTEMPTS = 3; // 最大图表渲染尝试次数
const isDateChanging = ref(false); // 日期变更中标志
const fullscreenLoading = ref(false); // 全屏加载状态

logger.debug("TenantCharts组件初始化", {
  initialPeriod: props.initialPeriod,
  dateRange: { startDate: startDate.value, endDate: endDate.value }
});

// 加载状态
const loading = reactive({
  trend: false,
  status: false,
  creation: false
});

// 错误信息
const error = ref<string>("");

// 图表数据
const trendData = ref<TenantChartData | null>(null);
const statusData = ref<TenantStatusData | null>(null);
const creationRateData = ref<TenantCreationData | null>(null);
const summaryData = ref<TenantSummary | null>(null);

// 图表初始化状态跟踪
const chartInitStatus = reactive({
  trend: false,
  status: false,
  creation: false
});

// 图表引用
const trendChartRef = ref(null);
const statusChartRef = ref(null);
const creationChartRef = ref(null);

/**
 * 处理图表初始化完成事件
 */
function handleChartInitComplete(chartId) {
  logger.debug(`图表初始化完成: ${chartId}`);

  // 根据图表ID更新初始化状态
  if (chartId.includes("trend")) {
    chartInitStatus.trend = true;
  } else if (chartId.includes("status")) {
    chartInitStatus.status = true;
  } else if (chartId.includes("creation")) {
    chartInitStatus.creation = true;
  }

  logger.debug("图表初始化状态:", chartInitStatus);
}

/**
 * 获取租户趋势数据 - 适配新的图表组件
 */
async function fetchTrendDataFn() {
  logger.debug("开始获取租户趋势数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  logger.debug("【API请求开始】fetchTrendData", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value,
    timestamp: new Date().toISOString()
  });

  loading.trend = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchTenantTrendData(
      period.value,
      startDate.value,
      endDate.value
    );
    const endTime = Date.now();

    logger.debug(
      `【API请求完成】fetchTrendData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("租户趋势数据获取成功", {
        labels: response.data?.labels?.length,
        dataPoints: response.data?.datasets?.[0]?.data?.length
      });

      // 使用格式化函数处理数据，确保数据结构一致且避免引用问题
      const formattedData = formatChartData(response.data);
      logger.debug("【租户趋势】数据处理结果:", JSON.stringify(formattedData));

      // 计算汇总数据
      if (formattedData) {
        summaryData.value = calculateTenantSummary(formattedData);
        logger.debug("租户汇总数据计算完成", summaryData.value);
      }

      return formattedData;
    } else {
      logger.warn("租户趋势数据请求失败", {
        code: response.code,
        message: response.message
      });
      logger.debug("【API请求失败】fetchTrendData", {
        code: response.code,
        message: response.message,
        timestamp: new Date().toISOString()
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err) {
    logger.error("租户趋势数据异常", {
      message: err.message,
      error: err
    });
    logger.debug("【API请求异常】fetchTrendData", {
      message: err.message,
      timestamp: new Date().toISOString()
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
    throw err;
  } finally {
    loading.trend = false;
    logger.debug("【API请求结束】fetchTrendData", {
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 获取租户状态分布数据 - 适配新的图表组件
 */
async function fetchStatusDataFn() {
  logger.debug("开始获取租户状态分布数据");

  logger.debug("【API请求开始】fetchStatusData", {
    timestamp: new Date().toISOString()
  });

  loading.status = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchTenantStatusDistribution();
    const endTime = Date.now();

    logger.debug(
      `【API请求完成】fetchStatusData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("租户状态分布数据获取成功", {
        labels: response.data?.labels?.length,
        data: response.data?.datasets?.[0]?.data?.length
      });

      const formattedData = formatChartData(response.data);
      logger.debug(
        "【租户状态分布】数据处理结果:",
        JSON.stringify(formattedData)
      );

      return formattedData;
    } else {
      logger.warn("租户状态分布数据请求失败", {
        code: response.code,
        message: response.message
      });
      logger.debug("【API请求失败】fetchStatusData", {
        code: response.code,
        message: response.message,
        timestamp: new Date().toISOString()
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err) {
    logger.error("租户状态分布数据异常", {
      message: err.message,
      error: err
    });
    logger.debug("【API请求异常】fetchStatusData", {
      message: err.message,
      timestamp: new Date().toISOString()
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
    throw err;
  } finally {
    loading.status = false;
    logger.debug("【API请求结束】fetchStatusData", {
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 获取租户创建速率数据 - 适配新的图表组件
 */
async function fetchCreationDataFn() {
  logger.debug("开始获取租户创建速率数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  logger.debug("【API请求开始】fetchCreationData", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value,
    timestamp: new Date().toISOString()
  });

  loading.creation = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchTenantCreationRate(
      period.value,
      startDate.value,
      endDate.value
    );
    const endTime = Date.now();

    logger.debug(
      `【API请求完成】fetchCreationData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("租户创建速率数据获取成功", {
        labels: response.data?.labels?.length,
        dataPoints: response.data?.datasets?.[0]?.data?.length
      });

      const formattedData = formatChartData(response.data);
      logger.debug(
        "【租户创建速率】数据处理结果:",
        JSON.stringify(formattedData)
      );

      return formattedData;
    } else {
      logger.warn("租户创建速率数据请求失败", {
        code: response.code,
        message: response.message
      });
      logger.debug("【API请求失败】fetchCreationData", {
        code: response.code,
        message: response.message,
        timestamp: new Date().toISOString()
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err) {
    logger.error("租户创建速率数据异常", {
      message: err.message,
      error: err
    });
    logger.debug("【API请求异常】fetchCreationData", {
      message: err.message,
      timestamp: new Date().toISOString()
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
    throw err;
  } finally {
    loading.creation = false;
    logger.debug("【API请求结束】fetchCreationData", {
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 处理图表数据加载完成事件
 */
function handleDataLoaded(chartType, data) {
  logger.debug(`${chartType}图表数据加载完成`, data);

  // 根据图表类型更新相应数据
  switch (chartType) {
    case "trend":
      trendData.value = data;
      break;
    case "status":
      statusData.value = data;
      break;
    case "creation":
      creationRateData.value = data;
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

  // 发出事件通知子组件重新初始化图表
  nextTick(() => {
    // 使用自定义事件触发子组件的图表重新初始化
    const event = new CustomEvent("force-chart-reinit");
    document.dispatchEvent(event);

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
}, 500); // 增加防抖时间

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
      debouncedFetchData(); // 使用防抖函数
    } else {
      logger.debug("日期变更中，跳过watch触发的数据获取");
    }
  },
  { deep: true }
); // 添加深度监听

// 组件挂载时加载数据
onMounted(() => {
  logger.debug("TenantCharts组件挂载，开始加载初始数据");
  // 直接在控制台输出信息
  logger.debug("TenantCharts组件挂载，开始加载初始数据");
  fetchAllData();

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
  <div class="tenant-charts-container">
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
      <StatisticCard v-if="summaryData" :data="summaryData" :period="period" />
    </div>

    <!-- 图表区域 -->
    <div class="charts-wrapper">
      <el-row :gutter="20">
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantTrend") }}</h3>
              <div v-if="loading.trend" class="chart-loading-indicator">
                <el-icon class="is-loading"
                  ><svg-icon name="ep:loading"
                /></el-icon>
              </div>
            </div>
            <div class="chart-body">
              <TenantTrendChart
                ref="trendChartRef"
                :loading="loading.trend"
                :period="period"
                :fetchDataFn="fetchTrendDataFn"
                @init-complete="handleChartInitComplete"
                @data-loaded="data => handleDataLoaded('trend', data)"
                :key="`trend-${startDate}-${endDate}-${period}`"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantStatusDistribution") }}</h3>
              <div v-if="loading.status" class="chart-loading-indicator">
                <el-icon class="is-loading"
                  ><svg-icon name="ep:loading"
                /></el-icon>
              </div>
            </div>
            <div class="chart-body">
              <TenantStatusChart
                ref="statusChartRef"
                :loading="loading.status"
                :fetchDataFn="fetchStatusDataFn"
                @init-complete="handleChartInitComplete"
                @data-loaded="data => handleDataLoaded('status', data)"
                :key="`status-${startDate}-${endDate}`"
              />
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mt-20">
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantCreationRate") }}</h3>
              <div v-if="loading.creation" class="chart-loading-indicator">
                <el-icon class="is-loading"
                  ><svg-icon name="ep:loading"
                /></el-icon>
              </div>
            </div>
            <div class="chart-body">
              <TenantCreationChart
                ref="creationChartRef"
                :loading="loading.creation"
                :period="period"
                :fetchDataFn="fetchCreationDataFn"
                @init-complete="handleChartInitComplete"
                @data-loaded="data => handleDataLoaded('creation', data)"
                :key="`creation-${startDate}-${endDate}-${period}`"
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
.tenant-charts-container {
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
  position: relative;
}

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    gap: 10px;
  }

  .chart-body {
    height: 250px;
  }
}
</style>

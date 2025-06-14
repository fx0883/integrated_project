<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
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

/**
 * 获取租户趋势数据
 */
async function fetchTrendData() {
  logger.debug("开始获取租户趋势数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  loading.trend = true;
  error.value = "";

  try {
    const response = await fetchTenantTrendData(
      period.value,
      startDate.value,
      endDate.value
    );

    if (response.success) {
      logger.debug("租户趋势数据获取成功", {
        labels: response.data?.labels?.length,
        dataPoints: response.data?.datasets?.[0]?.data?.length
      });

      // 使用格式化函数处理数据，确保数据结构一致且避免引用问题
      trendData.value = formatChartData(response.data);
      console.log("【租户趋势】数据处理结果:", JSON.stringify(trendData.value));

      // 计算汇总数据
      if (trendData.value) {
        summaryData.value = calculateTenantSummary(trendData.value);
        logger.debug("租户汇总数据计算完成", summaryData.value);
      }
    } else {
      logger.warn("租户趋势数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    logger.error("租户趋势数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.trend = false;
  }
}

/**
 * 获取租户状态分布数据
 */
async function fetchStatusData() {
  logger.debug("开始获取租户状态分布数据");

  loading.status = true;
  error.value = "";

  try {
    const response = await fetchTenantStatusDistribution();

    if (response.success) {
      logger.debug("租户状态分布数据获取成功", {
        labels: response.data?.labels?.length,
        data: response.data?.datasets?.[0]?.data?.length
      });

      // 使用格式化函数处理数据，确保数据结构一致且避免引用问题
      statusData.value = formatChartData(response.data);
      console.log(
        "【租户状态】数据处理结果:",
        JSON.stringify(statusData.value)
      );
    } else {
      logger.warn("租户状态分布数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    logger.error("租户状态分布数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.status = false;
  }
}

/**
 * 获取租户创建速率数据
 */
async function fetchCreationRateData() {
  logger.debug("开始获取租户创建速率数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  loading.creation = true;
  error.value = "";

  try {
    const response = await fetchTenantCreationRate(
      period.value,
      startDate.value,
      endDate.value
    );

    if (response.success) {
      logger.debug("租户创建速率数据获取成功", {
        labels: response.data?.labels?.length,
        dataPoints: response.data?.datasets?.[0]?.data?.length
      });
      creationRateData.value = response.data;
    } else {
      logger.warn("租户创建速率数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    logger.error("租户创建速率数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.creation = false;
  }
}

/**
 * 获取所有图表数据
 */
async function fetchAllData() {
  logger.debug("开始获取所有图表数据");
  error.value = "";

  // 重置错误状态
  if (dataFetchAttempts.value >= MAX_RETRY_ATTEMPTS) {
    logger.warn(
      `已达到最大重试次数(${MAX_RETRY_ATTEMPTS})，请检查网络或API状态`
    );
    dataFetchAttempts.value = 0;
    error.value = t("dashboard.maxRetryExceeded");
    ElMessage.warning(error.value);
    return;
  }

  // 并行请求数据
  try {
    await Promise.all([
      fetchTrendData(),
      fetchStatusData(),
      fetchCreationRateData()
    ]);

    logger.debug("所有图表数据获取完成");

    // 检查数据有效性
    const hasValidData = Boolean(
      (trendData.value &&
        trendData.value.labels &&
        trendData.value.labels.length) ||
        (statusData.value &&
          statusData.value.labels &&
          statusData.value.labels.length) ||
        (creationRateData.value &&
          creationRateData.value.labels &&
          creationRateData.value.labels.length)
    );

    if (!hasValidData && dataFetchAttempts.value < MAX_RETRY_ATTEMPTS) {
      dataFetchAttempts.value++;
      logger.warn(
        `没有有效数据，${1000 * dataFetchAttempts.value}ms后重试 (${dataFetchAttempts.value}/${MAX_RETRY_ATTEMPTS})`
      );
      setTimeout(() => {
        fetchAllData();
      }, 1000 * dataFetchAttempts.value);
    } else {
      // 重置尝试计数器
      dataFetchAttempts.value = 0;
    }
  } catch (err: any) {
    logger.error("获取图表数据过程中发生错误", err);

    // 在错误情况下尝试重试
    if (dataFetchAttempts.value < MAX_RETRY_ATTEMPTS) {
      dataFetchAttempts.value++;
      const retryDelay = 1000 * dataFetchAttempts.value;
      logger.warn(
        `数据获取失败，${retryDelay}ms后重试 (${dataFetchAttempts.value}/${MAX_RETRY_ATTEMPTS})`
      );

      setTimeout(() => {
        fetchAllData();
      }, retryDelay);
    } else {
      error.value = err.message || t("dashboard.fetchAllDataFailed");
      ElMessage.error(error.value);
      dataFetchAttempts.value = 0;
    }
  }
}

/**
 * 处理日期范围变更
 */
function handleDateRangeChange(range: { startDate: string; endDate: string }) {
  logger.debug("日期范围变更", {
    from: { startDate: startDate.value, endDate: endDate.value },
    to: range
  });

  console.log("日期范围变更", {
    from: { startDate: startDate.value, endDate: endDate.value },
    to: range
  });

  startDate.value = range.startDate;
  endDate.value = range.endDate;
}

/**
 * 处理周期变更
 */
function handlePeriodChange(newPeriod: ChartPeriod) {
  logger.debug("周期变更", {
    from: period.value,
    to: newPeriod
  });

  period.value = newPeriod;
}

// 使用debounce防抖处理筛选条件变化
const debouncedFetchData = debounce(() => {
  fetchAllData();
}, 300);

// 监听日期和周期变化，重新加载数据
watch([() => startDate.value, () => endDate.value, () => period.value], () => {
  logger.debug("检测到筛选条件变更，重新加载数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  debouncedFetchData(); // 使用防抖函数
});

// 组件挂载时加载数据
onMounted(() => {
  logger.debug("TenantCharts组件挂载，开始加载初始数据");
  // 直接在控制台输出信息
  console.log("TenantCharts组件挂载，开始加载初始数据");
  fetchAllData();
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
      />
      <PeriodSelector :value="period" @update:period="handlePeriodChange" />
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
            </div>
            <div class="chart-body">
              <TenantTrendChart
                :data="trendData"
                :loading="loading.trend"
                :period="period"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantStatus") }}</h3>
            </div>
            <div class="chart-body">
              <TenantStatusChart :data="statusData" :loading="loading.status" />
            </div>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantCreationRate") }}</h3>
            </div>
            <div class="chart-body">
              <TenantCreationChart
                :data="creationRateData"
                :loading="loading.creation"
                :period="period"
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
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.chart-body {
  padding: 20px;
  min-height: 300px;
  height: 300px;
  display: flex;
  flex-direction: column;
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

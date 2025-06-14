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

/**
 * 获取用户增长趋势数据
 */
async function fetchGrowthData() {
  logger.debug("开始获取用户增长趋势数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  console.log("【API请求开始】fetchGrowthData", {
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

    console.log(
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

      growthData.value = formatChartData(response.data);
      console.log(
        "【用户增长趋势】数据处理结果:",
        JSON.stringify(growthData.value)
      );

      // 计算汇总数据
      if (growthData.value) {
        summaryData.value = calculateUserSummary(
          growthData.value,
          activeUsersData.value
        );
        logger.debug("用户汇总数据计算完成", summaryData.value);
      }
    } else {
      logger.warn("用户增长趋势数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    logger.error("用户增长趋势数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.growth = false;
  }
}

/**
 * 获取用户角色分布数据
 */
async function fetchRoleData() {
  logger.debug("开始获取用户角色分布数据");

  console.log("【API请求开始】fetchRoleData", {
    timestamp: new Date().toISOString()
  });

  loading.role = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchUserRoleDistribution();
    const endTime = Date.now();

    console.log(
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

      roleData.value = formatChartData(response.data);
      console.log(
        "【用户角色分布】数据处理结果:",
        JSON.stringify(roleData.value)
      );
    } else {
      logger.warn("用户角色分布数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    logger.error("用户角色分布数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.role = false;
  }
}

/**
 * 获取活跃用户统计数据
 */
async function fetchActiveUsersData() {
  logger.debug("开始获取活跃用户统计数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value
  });

  console.log("【API请求开始】fetchActiveUsersData", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value,
    timestamp: new Date().toISOString()
  });

  loading.active = true;
  error.value = "";

  try {
    const startTime = Date.now();
    const response = await fetchActiveUsers(
      period.value,
      startDate.value,
      endDate.value
    );
    const endTime = Date.now();

    console.log(
      `【API请求完成】fetchActiveUsersData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("活跃用户统计数据获取成功", {
        labels: response.data?.labels?.length,
        dataPoints: response.data?.datasets?.[0]?.data?.length
      });
      activeUsersData.value = formatChartData(response.data);
      console.log(
        "【活跃用户统计】数据处理结果:",
        JSON.stringify(activeUsersData.value)
      );

      // 更新汇总数据中的活跃率
      if (activeUsersData.value && summaryData.value) {
        summaryData.value = calculateUserSummary(
          growthData.value,
          activeUsersData.value
        );
      }
    } else {
      logger.warn("活跃用户统计数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    logger.error("活跃用户统计数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.active = false;
  }
}

/**
 * 获取用户登录热力图数据
 */
async function fetchHeatmapData() {
  logger.debug("开始获取用户登录热力图数据", {
    startDate: startDate.value,
    endDate: endDate.value
  });

  console.log("【API请求开始】fetchHeatmapData", {
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

    console.log(
      `【API请求完成】fetchHeatmapData，耗时: ${endTime - startTime}ms`,
      {
        success: response.success,
        timestamp: new Date().toISOString()
      }
    );

    if (response.success) {
      logger.debug("用户登录热力图数据获取成功", {
        xLabels: response.data?.x_labels?.length,
        yLabels: response.data?.y_labels?.length,
        dataPoints: response.data?.dataset?.length
      });
      heatmapData.value = response.data;
      console.log(
        "【用户登录热力图】数据处理结果:",
        JSON.stringify(heatmapData.value)
      );
    } else {
      logger.warn("用户登录热力图数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    logger.error("用户登录热力图数据异常", {
      message: err.message,
      error: err
    });
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.heatmap = false;
  }
}

/**
 * 获取所有图表数据
 */
async function fetchAllData() {
  logger.debug("开始获取所有用户图表数据");
  console.log("【数据获取】开始获取所有用户图表数据", {
    period: period.value,
    startDate: startDate.value,
    endDate: endDate.value,
    isDateChanging: isDateChanging.value
  });
  error.value = "";
  fullscreenLoading.value = true;

  // 重置错误状态
  if (dataFetchAttempts.value >= MAX_RETRY_ATTEMPTS) {
    logger.warn(
      `已达到最大重试次数(${MAX_RETRY_ATTEMPTS})，请检查网络或API状态`
    );
    dataFetchAttempts.value = 0;
    error.value = t("dashboard.maxRetryExceeded");
    ElMessage.warning(error.value);
    fullscreenLoading.value = false;
    return;
  }

  // 并行请求数据
  try {
    console.log("【数据获取】开始发送API请求", {
      period: period.value,
      startDate: startDate.value,
      endDate: endDate.value
    });

    const startTime = Date.now();
    await Promise.all([
      fetchGrowthData(),
      fetchRoleData(),
      fetchActiveUsersData(),
      fetchHeatmapData()
    ]);
    const endTime = Date.now();

    console.log(`【数据获取】所有API请求完成，耗时: ${endTime - startTime}ms`);
    logger.debug("所有用户图表数据获取完成");

    // 检查数据有效性
    const hasValidData = Boolean(
      (growthData.value &&
        growthData.value.labels &&
        growthData.value.labels.length) ||
        (roleData.value &&
          roleData.value.labels &&
          roleData.value.labels.length) ||
        (activeUsersData.value &&
          activeUsersData.value.labels &&
          activeUsersData.value.labels.length) ||
        (heatmapData.value &&
          heatmapData.value.x_labels &&
          heatmapData.value.x_labels.length)
    );

    console.log("【数据获取】数据有效性检查", {
      hasValidData,
      growthDataValid: !!growthData.value?.labels?.length,
      roleDataValid: !!roleData.value?.labels?.length,
      activeUsersDataValid: !!activeUsersData.value?.labels?.length,
      heatmapDataValid: !!heatmapData.value?.x_labels?.length
    });

    if (!hasValidData && dataFetchAttempts.value < MAX_RETRY_ATTEMPTS) {
      dataFetchAttempts.value++;
      logger.warn(
        `没有有效数据，${1000 * dataFetchAttempts.value}ms后重试 (${dataFetchAttempts.value}/${MAX_RETRY_ATTEMPTS})`
      );
      console.log(
        `【数据获取】没有有效数据，${1000 * dataFetchAttempts.value}ms后重试 (${dataFetchAttempts.value}/${MAX_RETRY_ATTEMPTS})`
      );
      setTimeout(() => {
        fetchAllData();
      }, 1000 * dataFetchAttempts.value);
    } else {
      // 重置尝试计数器
      dataFetchAttempts.value = 0;

      // 确保图表重新渲染
      nextTick(() => {
        // 通知子组件强制重新初始化图表
        console.log("【数据获取】数据有效，准备强制重新初始化图表");
        forceReinitCharts();
      });
    }
  } catch (err: any) {
    logger.error("获取用户图表数据过程中发生错误", err);
    console.log("【数据获取】获取用户图表数据过程中发生错误", err);

    // 在错误情况下尝试重试
    if (dataFetchAttempts.value < MAX_RETRY_ATTEMPTS) {
      dataFetchAttempts.value++;
      const retryDelay = 1000 * dataFetchAttempts.value;
      logger.warn(
        `数据获取失败，${retryDelay}ms后重试 (${dataFetchAttempts.value}/${MAX_RETRY_ATTEMPTS})`
      );
      console.log(
        `【数据获取】数据获取失败，${retryDelay}ms后重试 (${dataFetchAttempts.value}/${MAX_RETRY_ATTEMPTS})`
      );

      setTimeout(() => {
        fetchAllData();
      }, retryDelay);
    } else {
      error.value = err.message || t("dashboard.fetchAllDataFailed");
      ElMessage.error(error.value);
      dataFetchAttempts.value = 0;
      console.log("【数据获取】达到最大重试次数，放弃重试");
    }
  } finally {
    fullscreenLoading.value = false;
    console.log("【数据获取】数据获取流程结束，关闭加载状态");
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

  console.log("日期范围变更", {
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
  console.log("日期变更后立即调用fetchAllData");
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

  console.log("周期变更", {
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
  console.log("周期变更后立即调用fetchAllData");
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
    console.log("通过watch触发的数据获取");
    fetchAllData();
  } else {
    console.log("日期变更中，跳过watch触发的数据获取");
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
      console.log("检测到筛选条件变更，准备调用debouncedFetchData");
      debouncedFetchData();
    } else {
      console.log("日期变更中，跳过watch触发的数据获取");
    }
  },
  { deep: true }
);

// 组件挂载时加载数据
onMounted(() => {
  logger.debug("UserCharts组件挂载，开始加载初始数据");
  console.log("UserCharts组件挂载，开始加载初始数据");
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
                :data="growthData"
                :loading="loading.growth"
                :period="period"
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
                :data="roleData"
                :loading="loading.role"
                :key="`role-${startDate}-${endDate}`"
              />
            </div>
          </div>
        </el-col>
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
                :data="activeUsersData"
                :loading="loading.active"
                :period="period"
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
                :data="heatmapData"
                :loading="loading.heatmap"
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

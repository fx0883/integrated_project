<script lang="ts" setup>
import {
  ref,
  computed,
  defineProps,
  defineEmits,
  watch,
  onMounted,
  onUnmounted
} from "vue";
import { useI18n } from "vue-i18n";
import { Loading } from "@element-plus/icons-vue";
import type { EChartsOption } from "echarts/types/dist/shared";
import type { ActiveUsersData, ChartPeriod } from "@/types/user";
import { useChartDataFlow } from "@/hooks/useChartDataFlow";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `active_users_chart_${Math.random().toString(36).slice(2, 9)}`;

// 定义props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  period: {
    type: String as () => ChartPeriod,
    default: "daily"
  },
  height: {
    type: String,
    default: "100%"
  },
  fetchDataFn: {
    type: Function,
    default: null
  }
});

// 定义事件
const emit = defineEmits(["data-loaded", "init-complete", "error"]);

// i18n支持
const { t } = useI18n();

// 图表DOM引用
const chartRef = ref<HTMLDivElement | null>(null);

// 图表数据
const chartData = ref<ActiveUsersData | null>(null);

logger.debug(`【活跃用户统计图】组件创建 ID:${componentId}`, {
  period: props.period
});

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  if (
    !chartData.value ||
    !chartData.value.labels ||
    !chartData.value.datasets ||
    chartData.value.datasets.length === 0
  ) {
    logger.debug(`【活跃用户统计图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  // 活跃用户数数据集
  const activeUsersDataset = chartData.value.datasets[0];

  // 活跃率数据集（如果存在）
  const activeRateDataset =
    chartData.value.datasets.length > 1 ? chartData.value.datasets[1] : null;

  logger.debug(`【活跃用户统计图】生成图表配置 ID:${componentId}`, {
    labelCount: chartData.value.labels.length,
    dataCount: activeUsersDataset.data.length,
    period: props.period
  });

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        crossStyle: {
          color: "#999"
        }
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((param: any) => {
          const value =
            param.seriesName === t("dashboard.activeRate")
              ? `${param.value}%`
              : param.value;
          result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: [
        activeUsersDataset.label || t("dashboard.activeUserCount"),
        activeRateDataset?.label || t("dashboard.activeRate")
      ],
      bottom: 0
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: chartData.value.labels,
      axisPointer: {
        type: "shadow"
      }
    },
    yAxis: [
      {
        type: "value",
        name: t("dashboard.activeUserCount"),
        minInterval: 1,
        position: "left"
      },
      {
        type: "value",
        name: t("dashboard.activeRate"),
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          formatter: "{value}%"
        },
        position: "right"
      }
    ],
    series: [
      {
        name: activeUsersDataset.label || t("dashboard.activeUserCount"),
        type: "line",
        data: activeUsersDataset.data,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: activeUsersDataset.color || "#FF9800"
        },
        itemStyle: {
          color: activeUsersDataset.color || "#FF9800"
        }
      }
    ]
  };
});

// 使用自定义钩子管理图表
const options = ref<EChartsOption>({});

// 数据获取函数
async function fetchData() {
  if (!props.fetchDataFn) {
    logger.warn(`【活跃用户统计图】未提供数据获取函数 ID:${componentId}`);
    return null;
  }

  try {
    const data = await props.fetchDataFn(props.period);
    logger.debug(`【活跃用户统计图】数据获取成功 ID:${componentId}`);

    // 更新图表数据
    chartData.value = data;

    // 更新图表配置
    options.value = JSON.parse(JSON.stringify(chartOptions.value));

    // 添加活跃率数据集（如果存在）
    if (
      data &&
      data.datasets &&
      data.datasets.length > 1 &&
      options.value.series
    ) {
      const activeRateDataset = data.datasets[1];
      const seriesConfig = {
        name: activeRateDataset.label || t("dashboard.activeRate"),
        type: "line",
        yAxisIndex: 1,
        data: activeRateDataset.data,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: activeRateDataset.color || "#E91E63"
        },
        itemStyle: {
          color: activeRateDataset.color || "#E91E63"
        }
      };

      // 更新图表配置
      if (
        Array.isArray(options.value.series) &&
        options.value.series.length === 1
      ) {
        options.value.series.push(seriesConfig);
      }
    }

    // 通知父组件数据已加载
    emit("data-loaded", data);

    return data;
  } catch (error) {
    logger.error(`【活跃用户统计图】数据获取失败 ID:${componentId}`, error);
    emit("error", error);
    throw error;
  }
}

// 使用新的图表数据流管理Hook
const {
  chartInstance,
  isChartInitialized,
  isDataLoaded,
  isLoading,
  error,
  loadData,
  reloadData,
  forceReInit
} = useChartDataFlow(chartRef, options, fetchData, componentId, true);

// 当图表初始化完成时通知父组件
watch(isChartInitialized, initialized => {
  if (initialized) {
    emit("init-complete", componentId);
  }
});

// 当period变化时重新加载数据
watch(
  () => props.period,
  () => {
    logger.debug(`【活跃用户统计图】周期变更，重新加载数据 ID:${componentId}`);
    if (isChartInitialized.value) {
      reloadData();
    }
  }
);

// 处理强制重新初始化图表事件
function handleForceReinit() {
  logger.debug(`【活跃用户统计图】接收到强制重新初始化事件 ID:${componentId}`);
  forceReInit();
}

// 组件挂载
onMounted(() => {
  logger.debug(`【活跃用户统计图】组件挂载完成 ID:${componentId}`);

  // 监听强制重新初始化图表事件
  document.addEventListener("force-chart-reinit", handleForceReinit);
});

// 组件卸载
onUnmounted(() => {
  logger.debug(`【活跃用户统计图】组件卸载 ID:${componentId}`);

  // 移除事件监听器
  document.removeEventListener("force-chart-reinit", handleForceReinit);
});

// 暴露方法给父组件
defineExpose({
  reloadData,
  forceReInit,
  chartInstance,
  isChartInitialized,
  isDataLoaded
});
</script>

<template>
  <div class="chart-container" :style="{ height }">
    <!-- 图表DOM容器始终存在，不受数据加载状态影响 -->
    <div
      ref="chartRef"
      class="chart"
      role="img"
      :aria-label="`${t('dashboard.activeUsersChart')}`"
    ></div>

    <!-- 加载状态覆盖层 -->
    <div v-if="isLoading || props.loading" class="chart-overlay chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ t("dashboard.loading") }}</span>
    </div>

    <!-- 无数据状态覆盖层 -->
    <div
      v-else-if="
        !chartData ||
        !chartData.labels ||
        !chartData.datasets ||
        chartData.datasets.length === 0
      "
      class="chart-overlay chart-empty"
    >
      <el-empty :description="t('dashboard.noData')" />
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 250px;
  flex: 1;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 250px;
}

.chart-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
}

.chart-loading {
  font-size: 14px;
  color: #909399;
}

.chart-loading .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}
</style>

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
import type { TenantCreationData, ChartPeriod } from "@/types/tenant";
import { useChartDataFlow } from "@/hooks/useChartDataFlow";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `creation_chart_${Math.random().toString(36).slice(2, 9)}`;

// 定义props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  period: {
    type: String as () => ChartPeriod,
    default: "monthly"
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
const chartData = ref<TenantCreationData | null>(null);

logger.debug(`【租户创建速率图】组件创建 ID:${componentId}`, {
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
    logger.debug(`【租户创建速率图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  const dataset = chartData.value.datasets[0];
  const color = dataset.color || "#91cc75";

  // 获取平均值用于参考线
  const average =
    dataset.data.length > 0
      ? dataset.data.reduce((sum, val) => sum + val, 0) / dataset.data.length
      : 0;

  logger.debug(`【租户创建速率图】生成图表配置 ID:${componentId}`, {
    labelCount: chartData.value.labels.length,
    dataCount: dataset.data.length,
    average: average,
    period: props.period
  });

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter: (params: any) => {
        const param = params[0];
        return `${param.axisValue}<br/>${t("dashboard.newTenants")}: ${param.value}`;
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: chartData.value.labels,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: "value",
      name: t("dashboard.newTenants"),
      minInterval: 1
    },
    series: [
      {
        name: dataset.label || t("dashboard.newTenants"),
        type: "bar",
        barWidth: "60%",
        data: dataset.data,
        itemStyle: {
          color: color,
          borderRadius: [4, 4, 0, 0]
        },
        markLine:
          average > 0
            ? {
                data: [
                  {
                    type: "average",
                    name: t("dashboard.average")
                  }
                ],
                label: {
                  formatter: "{b}: {c}",
                  position: "insideEndTop"
                },
                lineStyle: {
                  type: "solid",
                  color: "#5470c6",
                  width: 1.5
                }
              }
            : undefined
      }
    ]
  };
});

// 使用自定义钩子管理图表
const options = ref<EChartsOption>({});

// 数据获取函数
async function fetchData() {
  if (!props.fetchDataFn) {
    logger.warn(`【租户创建速率图】未提供数据获取函数 ID:${componentId}`);
    return null;
  }

  try {
    const data = await props.fetchDataFn(props.period);
    logger.debug(`【租户创建速率图】数据获取成功 ID:${componentId}`);

    // 更新图表数据
    chartData.value = data;

    // 更新图表配置
    options.value = JSON.parse(JSON.stringify(chartOptions.value));

    // 通知父组件数据已加载
    emit("data-loaded", data);

    return data;
  } catch (error) {
    logger.error(`【租户创建速率图】数据获取失败 ID:${componentId}`, error);
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
    logger.debug(`【租户创建速率图】周期变更，重新加载数据 ID:${componentId}`);
    if (isChartInitialized.value) {
      reloadData();
    }
  }
);

// 处理强制重新初始化图表事件
function handleForceReinit() {
  logger.debug(`【租户创建速率图】接收到强制重新初始化事件 ID:${componentId}`);
  forceReInit();
}

// 组件挂载
onMounted(() => {
  logger.debug(`【租户创建速率图】组件挂载完成 ID:${componentId}`);

  // 监听强制重新初始化图表事件
  document.addEventListener("force-chart-reinit", handleForceReinit);
});

// 组件卸载
onUnmounted(() => {
  logger.debug(`【租户创建速率图】组件卸载 ID:${componentId}`);

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
      :aria-label="`${t('dashboard.tenantCreationRate')}`"
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

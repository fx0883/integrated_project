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
import type { LoginHeatmapData } from "@/types/user";
import { useChartDataFlow } from "@/hooks/useChartDataFlow";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `login_heatmap_chart_${Math.random().toString(36).slice(2, 9)}`;

// 定义props
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
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
const chartData = ref<LoginHeatmapData | null>(null);

logger.debug(`【用户登录热力图】组件创建 ID:${componentId}`);

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  if (
    !chartData.value ||
    !chartData.value.x_labels ||
    !chartData.value.y_labels ||
    !chartData.value.dataset ||
    chartData.value.dataset.length === 0
  ) {
    logger.debug(`【用户登录热力图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  const dataset = chartData.value.dataset;
  const maxValue = Math.max(...dataset.map(item => item[2]));

  logger.debug(`【用户登录热力图】生成图表配置 ID:${componentId}`, {
    xLabelsCount: chartData.value.x_labels.length,
    yLabelsCount: chartData.value.y_labels.length,
    dataCount: dataset.length,
    maxValue
  });

  return {
    tooltip: {
      position: "top",
      formatter: (params: any) => {
        const value = params.value;
        return `${chartData.value?.x_labels[value[0]]} ${chartData.value?.y_labels[value[1]]}<br/>${t("dashboard.totalLogins")}: ${value[2]}`;
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: chartData.value.x_labels,
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: "category",
      data: chartData.value.y_labels,
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: "0%",
      inRange: {
        color: [
          "#e0f7fa",
          "#b2ebf2",
          "#80deea",
          "#4dd0e1",
          "#26c6da",
          "#00bcd4",
          "#00acc1",
          "#0097a7",
          "#00838f",
          "#006064"
        ]
      }
    },
    series: [
      {
        name: t("dashboard.loginHeatmap"),
        type: "heatmap",
        data: dataset,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
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
    logger.warn(`【用户登录热力图】未提供数据获取函数 ID:${componentId}`);
    return null;
  }

  try {
    const data = await props.fetchDataFn();
    logger.debug(`【用户登录热力图】数据获取成功 ID:${componentId}`);

    // 更新图表数据
    chartData.value = data;

    // 更新图表配置
    options.value = JSON.parse(JSON.stringify(chartOptions.value));

    // 通知父组件数据已加载
    emit("data-loaded", data);

    return data;
  } catch (error) {
    logger.error(`【用户登录热力图】数据获取失败 ID:${componentId}`, error);
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

// 处理强制重新初始化图表事件
function handleForceReinit() {
  logger.debug(`【用户登录热力图】接收到强制重新初始化事件 ID:${componentId}`);
  forceReInit();
}

// 组件挂载
onMounted(() => {
  logger.debug(`【用户登录热力图】组件挂载完成 ID:${componentId}`);

  // 监听强制重新初始化图表事件
  document.addEventListener("force-chart-reinit", handleForceReinit);
});

// 组件卸载
onUnmounted(() => {
  logger.debug(`【用户登录热力图】组件卸载 ID:${componentId}`);

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
      :aria-label="`${t('dashboard.loginHeatmap')}`"
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
        !chartData.x_labels ||
        !chartData.y_labels ||
        !chartData.dataset ||
        chartData.dataset.length === 0
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

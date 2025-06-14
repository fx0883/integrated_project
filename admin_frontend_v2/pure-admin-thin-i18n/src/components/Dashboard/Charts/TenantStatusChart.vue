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
import type { TenantStatusData } from "@/types/tenant";
import { useChartDataFlow } from "@/hooks/useChartDataFlow";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `status_chart_${Math.random().toString(36).slice(2, 9)}`;

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
const chartData = ref<TenantStatusData | null>(null);

logger.debug(`【租户状态图】组件创建 ID:${componentId}`);

// 默认饼图颜色
const defaultColors = [
  "#5470c6",
  "#91cc75",
  "#fac858",
  "#ee6666",
  "#73c0de",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
  "#ea7ccc"
];

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  if (
    !chartData.value ||
    !chartData.value.labels ||
    !chartData.value.datasets ||
    chartData.value.datasets.length === 0
  ) {
    logger.debug(`【租户状态图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  const { labels, datasets } = chartData.value;
  const dataset = datasets[0];

  logger.debug(`【租户状态图】生成图表配置 ID:${componentId}`, {
    labelCount: labels.length,
    dataCount: dataset.data.length,
    statusTypes: labels
  });

  // 构造饼图数据
  const pieData = labels.map((label, index) => {
    const color =
      dataset.colors && dataset.colors[index]
        ? dataset.colors[index]
        : defaultColors[index % defaultColors.length];

    return {
      name: label,
      value: dataset.data[index],
      itemStyle: {
        color
      }
    };
  });

  return {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)"
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      bottom: 0,
      data: labels
    },
    series: [
      {
        name: dataset.label || t("dashboard.tenantStatus"),
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: "{b}: {c} ({d}%)"
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold"
          }
        },
        labelLine: {
          show: true
        },
        data: pieData
      }
    ]
  };
});

// 使用自定义钩子管理图表
const options = ref<EChartsOption>({});

// 数据获取函数
async function fetchData() {
  if (!props.fetchDataFn) {
    logger.warn(`【租户状态图】未提供数据获取函数 ID:${componentId}`);
    return null;
  }

  try {
    const data = await props.fetchDataFn();
    logger.debug(`【租户状态图】数据获取成功 ID:${componentId}`);

    // 更新图表数据
    chartData.value = data;

    // 更新图表配置
    options.value = JSON.parse(JSON.stringify(chartOptions.value));

    // 通知父组件数据已加载
    emit("data-loaded", data);

    return data;
  } catch (error) {
    logger.error(`【租户状态图】数据获取失败 ID:${componentId}`, error);
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
  logger.debug(`【租户状态图】接收到强制重新初始化事件 ID:${componentId}`);
  forceReInit();
}

// 组件挂载
onMounted(() => {
  logger.debug(`【租户状态图】组件挂载完成 ID:${componentId}`);

  // 监听强制重新初始化图表事件
  document.addEventListener("force-chart-reinit", handleForceReinit);
});

// 组件卸载
onUnmounted(() => {
  logger.debug(`【租户状态图】组件卸载 ID:${componentId}`);

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
      :aria-label="`${t('dashboard.tenantStatusDistribution')}`"
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

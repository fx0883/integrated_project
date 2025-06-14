<script lang="ts" setup>
import { ref, computed, defineProps, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { Loading } from "@element-plus/icons-vue";
import type { EChartsOption } from "echarts/types/dist/shared";
import type { LoginHeatmapData } from "@/types/user";
import { useChart } from "@/hooks/useChart";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `login_heatmap_chart_${Math.random().toString(36).slice(2, 9)}`;

// 定义props
const props = defineProps({
  data: {
    type: Object as () => LoginHeatmapData,
    default: () => ({
      x_labels: [],
      y_labels: [],
      dataset: []
    })
  },
  loading: {
    type: Boolean,
    default: false
  },
  height: {
    type: String,
    default: "100%"
  }
});

// i18n支持
const { t } = useI18n();

// 图表DOM引用
const chartRef = ref<HTMLDivElement | null>(null);

logger.debug(`【用户登录热力图】组件创建 ID:${componentId}`, {
  hasData: !!props.data && !!props.data.dataset && props.data.dataset.length > 0
});

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  if (
    !props.data ||
    !props.data.x_labels ||
    !props.data.y_labels ||
    !props.data.dataset ||
    props.data.dataset.length === 0
  ) {
    logger.debug(`【用户登录热力图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  const dataset = props.data.dataset;
  const maxValue = Math.max(...dataset.map(item => item[2]));

  logger.debug(`【用户登录热力图】生成图表配置 ID:${componentId}`, {
    xLabelsCount: props.data.x_labels.length,
    yLabelsCount: props.data.y_labels.length,
    dataCount: dataset.length,
    maxValue
  });

  return {
    tooltip: {
      position: "top",
      formatter: (params: any) => {
        const value = params.value;
        return `${props.data.x_labels[value[0]]} ${props.data.y_labels[value[1]]}<br/>${t("dashboard.totalLogins")}: ${value[2]}`;
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
      data: props.data.x_labels,
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: "category",
      data: props.data.y_labels,
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
const {
  chartInstance,
  loading: chartLoading,
  setLoading,
  forceReInit,
  initChart
} = useChart(chartRef, options);

// 当props.data变化时更新图表
watch(
  () => props.data,
  newData => {
    logger.debug(`【用户登录热力图】数据变更 ID:${componentId}`, {
      hasData: !!newData && !!newData.dataset && newData.dataset.length > 0,
      xLabelsCount: newData?.x_labels?.length || 0,
      yLabelsCount: newData?.y_labels?.length || 0,
      dataCount: newData?.dataset?.length || 0
    });

    console.log(
      `【用户登录热力图】数据变更:`,
      JSON.parse(JSON.stringify(newData))
    );

    if (newData && newData.x_labels && newData.y_labels && newData.dataset) {
      // 使用深拷贝确保数据不会因引用问题而丢失
      options.value = JSON.parse(JSON.stringify(chartOptions.value));

      // 在数据变更后，尝试强制重新初始化图表
      setTimeout(() => {
        if (chartRef.value) {
          forceReInit();
        }
      }, 100);
    }
  },
  { deep: true }
);

// 当loading状态变化时更新图表加载状态
watch(
  () => props.loading,
  newLoading => {
    logger.debug(`【用户登录热力图】加载状态变更 ID:${componentId}`, {
      loading: newLoading
    });
    setLoading(newLoading);
  }
);

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

  // 确保初始化时图表正确渲染
  if (props.data && props.data.dataset && props.data.dataset.length > 0) {
    options.value = JSON.parse(JSON.stringify(chartOptions.value));

    // 延迟初始化，确保DOM已就绪
    setTimeout(() => {
      forceReInit();
    }, 200);
  }
});

// 组件卸载
onUnmounted(() => {
  logger.debug(`【用户登录热力图】组件卸载 ID:${componentId}`);

  // 移除事件监听器
  document.removeEventListener("force-chart-reinit", handleForceReinit);
});
</script>

<template>
  <div class="chart-container" :style="{ height }">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ t("dashboard.loading") }}</span>
    </div>
    <div
      v-else-if="
        !data ||
        !data.x_labels ||
        !data.y_labels ||
        !data.dataset ||
        data.dataset.length === 0
      "
      class="chart-empty"
    >
      <el-empty :description="t('dashboard.noData')" />
    </div>
    <div
      v-else
      ref="chartRef"
      class="chart"
      role="img"
      :aria-label="`${t('dashboard.loginHeatmap')}`"
    ></div>
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

.chart-loading,
.chart-empty {
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

<script lang="ts" setup>
import { ref, computed, defineProps, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { Loading } from "@element-plus/icons-vue";
import type { EChartsOption } from "echarts/types/dist/shared";
import type { UserGrowthData, ChartPeriod } from "@/types/user";
import { useChart } from "@/hooks/useChart";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `user_growth_chart_${Math.random().toString(36).slice(2, 9)}`;

// 定义props
const props = defineProps({
  data: {
    type: Object as () => UserGrowthData,
    default: () => ({ labels: [], datasets: [] })
  },
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
  }
});

// i18n支持
const { t } = useI18n();

// 图表DOM引用
const chartRef = ref<HTMLDivElement | null>(null);

logger.debug(`【用户增长趋势图】组件创建 ID:${componentId}`, {
  period: props.period,
  hasData: !!props.data && !!props.data.labels && props.data.labels.length > 0
});

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  if (
    !props.data ||
    !props.data.labels ||
    !props.data.datasets ||
    props.data.datasets.length === 0
  ) {
    logger.debug(`【用户增长趋势图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  // 用户总数数据集
  const totalDataset = props.data.datasets[0];

  // 新增用户数据集（如果存在）
  const newDataset =
    props.data.datasets.length > 1 ? props.data.datasets[1] : null;

  logger.debug(`【用户增长趋势图】生成图表配置 ID:${componentId}`, {
    labelCount: props.data.labels.length,
    dataCount: totalDataset.data.length,
    period: props.period
  });

  // 基本配置
  const options: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((param: any) => {
          result += `${param.seriesName}: ${param.value}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: [
        totalDataset.label || t("dashboard.userTotal"),
        newDataset?.label || t("dashboard.newUsers")
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
      data: props.data.labels,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: [
      {
        type: "value",
        name: t("dashboard.userCount"),
        minInterval: 1,
        position: "left"
      }
    ],
    series: [
      {
        name: totalDataset.label || t("dashboard.userTotal"),
        type: "line",
        data: totalDataset.data,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: totalDataset.color || "#3366cc"
        },
        itemStyle: {
          color: totalDataset.color || "#3366cc"
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: totalDataset.color
                  ? `${totalDataset.color}80`
                  : "rgba(51, 102, 204, 0.5)"
              },
              {
                offset: 1,
                color: totalDataset.color
                  ? `${totalDataset.color}05`
                  : "rgba(51, 102, 204, 0.05)"
              }
            ]
          }
        }
      }
    ]
  };

  // 如果有新增用户数据，添加到系列中
  if (newDataset) {
    options.series.push({
      name: newDataset.label || t("dashboard.newUsers"),
      type: "bar",
      data: newDataset.data,
      barWidth: "40%",
      itemStyle: {
        color: newDataset.color || "#dc3912"
      }
    });
  }

  return options;
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
    logger.debug(`【用户增长趋势图】数据变更 ID:${componentId}`, {
      hasData: !!newData && !!newData.labels && newData.labels.length > 0,
      labelCount: newData?.labels?.length || 0,
      dataCount: newData?.datasets?.[0]?.data?.length || 0
    });

    console.log(
      `【用户增长趋势图】数据变更:`,
      JSON.parse(JSON.stringify(newData))
    );

    if (newData && newData.labels && newData.datasets) {
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

// 当period变化时强制重新初始化图表
watch(
  () => props.period,
  () => {
    logger.debug(
      `【用户增长趋势图】周期变更，强制重新初始化图表 ID:${componentId}`
    );
    setTimeout(() => {
      forceReInit();
    }, 100);
  }
);

// 当loading状态变化时更新图表加载状态
watch(
  () => props.loading,
  newLoading => {
    logger.debug(`【用户增长趋势图】加载状态变更 ID:${componentId}`, {
      loading: newLoading
    });
    setLoading(newLoading);
  }
);

// 处理强制重新初始化图表事件
function handleForceReinit() {
  logger.debug(`【用户增长趋势图】接收到强制重新初始化事件 ID:${componentId}`);
  forceReInit();
}

// 组件挂载
onMounted(() => {
  logger.debug(`【用户增长趋势图】组件挂载完成 ID:${componentId}`);

  // 监听强制重新初始化图表事件
  document.addEventListener("force-chart-reinit", handleForceReinit);

  // 确保初始化时图表正确渲染
  if (props.data && props.data.labels && props.data.labels.length > 0) {
    options.value = JSON.parse(JSON.stringify(chartOptions.value));

    // 延迟初始化，确保DOM已就绪
    setTimeout(() => {
      forceReInit();
    }, 200);
  }
});

// 组件卸载
onUnmounted(() => {
  logger.debug(`【用户增长趋势图】组件卸载 ID:${componentId}`);

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
        !data.labels ||
        data.labels.length === 0 ||
        !data.datasets ||
        data.datasets.length === 0
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
      :aria-label="`${t('dashboard.userGrowthTrend')}`"
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

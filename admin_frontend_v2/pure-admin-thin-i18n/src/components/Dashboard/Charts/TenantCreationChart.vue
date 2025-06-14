<script lang="ts" setup>
import { ref, computed, defineProps, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Loading } from "@element-plus/icons-vue";
import type { EChartsOption } from "echarts/types/dist/shared";
import type { TenantCreationData, ChartPeriod } from "@/types/tenant";
import { useChart } from "@/hooks/useChart";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `creation_chart_${Math.random().toString(36).slice(2, 9)}`;

// 定义props
const props = defineProps({
  data: {
    type: Object as () => TenantCreationData,
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

logger.debug(`【租户创建速率图】组件创建 ID:${componentId}`, {
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
    logger.debug(`【租户创建速率图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  const dataset = props.data.datasets[0];
  const color = dataset.color || "#91cc75";

  // 获取平均值用于参考线
  const average =
    dataset.data.length > 0
      ? dataset.data.reduce((sum, val) => sum + val, 0) / dataset.data.length
      : 0;

  logger.debug(`【租户创建速率图】生成图表配置 ID:${componentId}`, {
    labelCount: props.data.labels.length,
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
      data: props.data.labels,
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
const {
  chartInstance,
  loading: chartLoading,
  setLoading
} = useChart(chartRef, options);

// 当props.data变化时更新图表
watch(
  () => props.data,
  newData => {
    logger.debug(`【租户创建速率图】数据变更 ID:${componentId}`, {
      hasData: !!newData && !!newData.labels && newData.labels.length > 0,
      labelCount: newData?.labels?.length || 0,
      dataCount: newData?.datasets?.[0]?.data?.length || 0
    });

    console.log(
      `【租户创建速率图】数据变更:`,
      JSON.parse(JSON.stringify(newData))
    );

    if (newData && newData.labels && newData.datasets) {
      // 使用深拷贝确保数据不会因引用问题而丢失
      options.value = JSON.parse(JSON.stringify(chartOptions.value));
    }
  },
  { deep: true }
);

// 当loading状态变化时更新图表加载状态
watch(
  () => props.loading,
  newLoading => {
    logger.debug(`【租户创建速率图】加载状态变更 ID:${componentId}`, {
      loading: newLoading
    });
    setLoading(newLoading);
  }
);

// 组件挂载
onMounted(() => {
  logger.debug(`【租户创建速率图】组件挂载完成 ID:${componentId}`);
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
      :aria-label="`${t('dashboard.tenantCreationRate')}`"
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

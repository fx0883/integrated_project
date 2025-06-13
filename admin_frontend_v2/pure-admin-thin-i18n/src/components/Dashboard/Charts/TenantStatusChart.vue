<script lang="ts" setup>
import { ref, computed, defineProps, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Loading } from "@element-plus/icons-vue";
import type { EChartsOption } from "echarts/types/dist/shared";
import type { TenantStatusData } from "@/types/tenant";
import { useChart } from "@/hooks/useChart";

// 定义props
const props = defineProps({
  data: {
    type: Object as () => TenantStatusData,
    default: () => ({ labels: [], datasets: [] })
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
    !props.data ||
    !props.data.labels ||
    !props.data.datasets ||
    props.data.datasets.length === 0
  ) {
    return {};
  }

  const { labels, datasets } = props.data;
  const dataset = datasets[0];

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
const {
  chartInstance,
  loading: chartLoading,
  setLoading
} = useChart(chartRef, options);

// 当props.data变化时更新图表
watch(
  () => props.data,
  newData => {
    if (newData && newData.labels && newData.datasets) {
      options.value = chartOptions.value;
    }
  },
  { deep: true }
);

// 当loading状态变化时更新图表加载状态
watch(
  () => props.loading,
  newLoading => {
    setLoading(newLoading);
  }
);
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
      :aria-label="`${t('dashboard.tenantStatus')}`"
    ></div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
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

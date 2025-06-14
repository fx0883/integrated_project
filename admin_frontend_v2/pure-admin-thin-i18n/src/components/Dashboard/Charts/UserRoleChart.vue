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
import type { UserRoleData } from "@/types/user";
import { useChartDataFlow } from "@/hooks/useChartDataFlow";
import logger from "@/utils/logger";

// 生成组件唯一ID
const componentId = `user_role_chart_${Math.random().toString(36).slice(2, 9)}`;

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
const chartData = ref<UserRoleData | null>(null);

logger.debug(`【用户角色分布图】组件创建 ID:${componentId}`);

// 图表配置
const options = computed<EChartsOption>(() => {
  if (
    !chartData.value ||
    !chartData.value.labels ||
    !chartData.value.datasets ||
    chartData.value.datasets.length === 0
  ) {
    logger.debug(`【用户角色分布图】生成图表配置：数据为空 ID:${componentId}`);
    return {};
  }

  const dataset = chartData.value.datasets[0];
  const colors = dataset.colors || ["#9C27B0", "#2196F3", "#4CAF50"];

  logger.debug(`【用户角色分布图】生成图表配置 ID:${componentId}`, {
    labelCount: chartData.value.labels.length,
    dataCount: dataset.data.length
  });

  return {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `${params.name}: ${params.value} (${params.percent}%)`;
      }
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
      data: chartData.value.labels
    },
    series: [
      {
        name: t("dashboard.userRoleDistribution"),
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
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
        data: chartData.value.labels.map((label, index) => ({
          name:
            t(`dashboard.${label.toLowerCase().replace(/\s+/g, "")}`) || label,
          value: dataset.data[index],
          itemStyle: {
            color: colors[index % colors.length]
          }
        }))
      }
    ]
  };
});

// 数据获取函数
async function fetchData() {
  if (!props.fetchDataFn) {
    logger.debug(`【用户角色分布图】未提供数据获取函数 ID:${componentId}`);
    return null;
  }

  try {
    logger.debug(`【用户角色分布图】开始获取数据 ID:${componentId}`);
    const data = await props.fetchDataFn();
    logger.debug(`【用户角色分布图】数据获取成功 ID:${componentId}`);

    // 保存数据到本地状态
    chartData.value = data;

    // 通知父组件数据已加载
    emit("data-loaded", data);

    return data;
  } catch (err) {
    logger.error(`【用户角色分布图】数据获取失败 ID:${componentId}`, err);
    emit("error", err);
    return null;
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
} = useChartDataFlow(chartRef, options, fetchData, componentId, true); // 添加forceInit参数为true

// 组件挂载
onMounted(() => {
  logger.debug(`【${componentId}】组件挂载，开始初始化图表流程`);
  emit("init-complete", componentId);
  logger.debug(`【用户角色分布图】组件挂载完成 ID:${componentId}`);
});

// 组件卸载
onUnmounted(() => {
  logger.debug(`【用户角色分布图】组件卸载 ID:${componentId}`);
});

// 暴露方法给父组件
defineExpose({
  reloadData,
  forceReInit
});
</script>

<template>
  <div class="chart-container" :style="{ height }">
    <!-- 图表DOM容器始终存在，不受数据加载状态影响 -->
    <div
      ref="chartRef"
      class="chart"
      role="img"
      :aria-label="`${t('dashboard.userRoleDistribution')}`"
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
  z-index: 10;
}

.chart-loading {
  font-size: 14px;
  color: #909399;
}
</style>

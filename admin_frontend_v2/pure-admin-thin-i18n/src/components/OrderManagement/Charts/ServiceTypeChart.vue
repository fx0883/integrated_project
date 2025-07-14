<template>
  <div class="chart-container" ref="chartContainer">
    <div v-if="loading" class="chart-loading">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>{{ $t("order.loadingChart") }}</p>
    </div>
    <div v-else-if="error" class="chart-error">
      <el-icon><WarningFilled /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" size="small" @click="reloadChart">
        {{ $t("common.button.refresh") }}
      </el-button>
    </div>
    <div v-else-if="noData" class="chart-no-data">
      <el-empty :description="$t('common.noData')"></el-empty>
    </div>
    <div ref="chartRef" class="chart-body"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import type { EChartsOption } from "echarts/types/dist/shared";
import { Loading, WarningFilled } from "@element-plus/icons-vue";
import { useChartDataFlow } from "@/hooks/useChartDataFlow";
import { useOrderStoreHook } from "@/store/modules/order";
import type { OrderStatistics } from "@/types/order";
import logger from "@/utils/logger";

const { t } = useI18n();
const orderStore = useOrderStoreHook();

const props = defineProps({
  startDate: {
    type: String,
    default: ""
  },
  endDate: {
    type: String,
    default: ""
  },
  chartId: {
    type: String,
    default: "service-type-chart"
  }
});

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const error = ref("");
const loading = ref(false);
const noData = ref(false);
const statisticsData = ref<OrderStatistics | null>(null);

// 服务类型与颜色映射
const serviceTypeColorMap = {
  文档翻译: "#1890ff", // 蓝色
  口译服务: "#52c41a", // 绿色
  校对服务: "#722ed1", // 紫色
  本地化服务: "#fa8c16", // 橙色
  其他: "#bfbfbf" // 灰色
};

// 服务类型翻译
const getServiceTypeTranslation = (serviceType: string) => {
  switch (serviceType) {
    case "文档翻译":
      return t("order.serviceTypeDocument");
    case "口译服务":
      return t("order.serviceTypeInterpretation");
    case "校对服务":
      return t("order.serviceTypeProofreading");
    case "本地化服务":
      return t("order.serviceTypeLocalization");
    case "其他":
      return t("order.serviceTypeOther");
    default:
      return serviceType;
  }
};

// 图表配置选项
const chartOptions = computed<EChartsOption>(() => {
  // 如果没有数据，返回默认选项
  if (
    !statisticsData.value ||
    !statisticsData.value.by_service_type ||
    statisticsData.value.by_service_type.length === 0
  ) {
    return {
      title: {
        text: t("order.serviceTypeDistribution"),
        left: "center"
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      legend: {
        orient: "horizontal",
        bottom: "bottom",
        data: []
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        containLabel: true
      },
      xAxis: [
        {
          type: "category",
          data: [],
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            rotate: 45
          }
        }
      ],
      yAxis: [
        {
          type: "value"
        }
      ],
      series: []
    };
  }

  // 处理数据
  const serviceTypeData = statisticsData.value.by_service_type;

  // 按服务类型合并数据 - 因为API可能会返回多条相同服务类型的记录
  const mergedData = {};
  serviceTypeData.forEach(item => {
    const type = item.service_type;
    if (!mergedData[type]) {
      mergedData[type] = {
        service_type: type,
        orders: 0,
        amount: 0
      };
    }
    mergedData[type].orders += item.orders;
    mergedData[type].amount += parseFloat(String(item.amount || "0"));
  });

  const consolidatedData = Object.values(mergedData);
  const categories = consolidatedData.map(item =>
    getServiceTypeTranslation(item.service_type)
  );

  const countData = consolidatedData.map(item => ({
    value: item.orders,
    itemStyle: {
      color: serviceTypeColorMap[item.service_type] || "#909399"
    }
  }));

  const amountData = consolidatedData.map(item => item.amount);

  // 由于API没有提供单个服务类型的利润数据，这里暂时设为空数组
  const profitData = new Array(consolidatedData.length).fill(0);
  const profitRateData = new Array(consolidatedData.length).fill(0);

  // 创建提示框格式化函数
  const tooltipFormatter = (params: any[]) => {
    const serviceType = params[0].name;
    let result = `<div>${serviceType}</div>`;

    params.forEach(param => {
      if (param.seriesName === t("order.orderCount")) {
        result += `<div>${param.seriesName}: ${param.value}</div>`;
      } else if (param.seriesName === t("order.orderAmount")) {
        result += `<div>${param.seriesName}: ¥${param.value.toFixed(2)}</div>`;
      }
    });

    return result;
  };

  return {
    title: {
      text: t("order.serviceTypeDistribution"),
      left: "center"
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter: tooltipFormatter
    },
    legend: {
      orient: "horizontal",
      bottom: "bottom",
      data: [t("order.orderCount"), t("order.orderAmount")]
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true
    },
    xAxis: [
      {
        type: "category",
        data: categories,
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          rotate: categories.length > 4 ? 45 : 0,
          interval: 0
        }
      }
    ],
    yAxis: [
      {
        type: "value",
        name: t("order.orderCount"),
        position: "left",
        axisLabel: {
          formatter: "{value}"
        },
        splitLine: {
          lineStyle: {
            type: "dashed"
          }
        }
      },
      {
        type: "value",
        name: t("order.orderAmount"),
        position: "right",
        axisLabel: {
          formatter: "{value} ¥"
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: t("order.orderCount"),
        type: "bar",
        barWidth: "40%",
        data: countData,
        emphasis: {
          focus: "series"
        }
      },
      {
        name: t("order.orderAmount"),
        type: "line",
        yAxisIndex: 1,
        data: amountData,
        emphasis: {
          focus: "series"
        },
        symbol: "circle",
        symbolSize: 8,
        itemStyle: {
          color: "#52c41a"
        }
      }
    ]
  };
});

// 获取图表数据
const fetchData = async () => {
  loading.value = true;
  error.value = "";
  noData.value = false;

  try {
    const params = {
      period: "monthly", // 默认使用月度统计
      start_date: props.startDate,
      end_date: props.endDate
    };

    await orderStore.fetchOrderStatistics(params);
    statisticsData.value = orderStore.statistics;

    if (
      !statisticsData.value ||
      !statisticsData.value.by_service_type ||
      statisticsData.value.by_service_type.length === 0
    ) {
      noData.value = true;
    }
  } catch (err) {
    logger.error("获取服务类型图表数据失败", err);
    error.value = t("order.fetchChartDataFailed");
  } finally {
    loading.value = false;
  }
};

// 重载图表
const reloadChart = () => {
  fetchData();
};

// 监听属性变化，重新加载数据
watch(
  () => [props.startDate, props.endDate],
  () => {
    reloadChart();
  }
);

// 监听统计数据变化，更新图表状态
watch(
  () => statisticsData.value,
  newVal => {
    noData.value =
      !newVal || !newVal.by_service_type || newVal.by_service_type.length === 0;
  }
);

// 使用图表数据流钩子
const options = ref<EChartsOption>({});

// 更新图表配置
watch(
  () => chartOptions.value,
  newOptions => {
    options.value = newOptions;
  },
  { immediate: true, deep: true }
);

// 使用图表数据流钩子设置图表
const { setOptions, resizeChart } = useChartDataFlow(
  chartRef,
  options,
  fetchData,
  props.chartId,
  true
);

// 监听窗口大小变化
const handleResize = () => {
  if (typeof resizeChart === "function") {
    resizeChart();
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 400px;

  .chart-body {
    width: 100%;
    height: 100%;
    min-height: 400px;
  }

  .chart-loading,
  .chart-error,
  .chart-no-data {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.7);

    .loading-icon {
      font-size: 2rem;
      animation: rotating 2s linear infinite;
    }

    @keyframes rotating {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  }
}
</style>

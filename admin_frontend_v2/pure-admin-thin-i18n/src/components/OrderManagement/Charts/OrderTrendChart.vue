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
  period: {
    type: String,
    default: "monthly",
    validator: (value: string) =>
      ["daily", "weekly", "monthly", "quarterly", "yearly"].includes(value)
  },
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
    default: "order-trend-chart"
  }
});

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const error = ref("");
const loading = ref(false);
const noData = ref(false);
const statisticsData = ref<OrderStatistics | null>(null);

// 图表配置选项
const chartOptions = computed<EChartsOption>(() => {
  // 如果没有数据，返回默认选项
  if (
    !statisticsData.value ||
    !statisticsData.value.by_period ||
    statisticsData.value.by_period.length === 0
  ) {
    return {
      title: {
        text: t("order.orderTrendChart"),
        left: "center"
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
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
        data: []
      },
      yAxis: [
        {
          type: "value",
          name: t("order.orderCount"),
          position: "left"
        },
        {
          type: "value",
          name: t("order.orderAmount"),
          position: "right",
          axisLabel: {
            formatter: "{value} ¥"
          }
        }
      ],
      series: []
    };
  }

  // 处理数据
  const periodData = statisticsData.value.by_period;

  // 过滤掉无效的周期标记
  const validPeriodData = periodData.filter(item => item.period !== "-");

  const xAxisData = validPeriodData.map(item => formatPeriodLabel(item.period));
  const orderCountData = validPeriodData.map(item => item.orders);
  const orderAmountData = validPeriodData.map(item =>
    parseFloat(String(item.amount || "0"))
  );

  const profitData = validPeriodData.map(item =>
    parseFloat(String(item.profit || "0"))
  );

  // 计算每个周期的利润率
  const profitRateData = validPeriodData.map(item => {
    const amount = parseFloat(String(item.amount || "0"));
    const profit = parseFloat(String(item.profit || "0"));
    return amount > 0 ? parseFloat(((profit / amount) * 100).toFixed(2)) : 0;
  });

  return {
    title: {
      text: t("order.orderTrendChart"),
      left: "center"
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter: function (params: any[]) {
        let result = `<div>${params[0].axisValue}</div>`;

        params.forEach(param => {
          if (param.seriesName === t("order.orderCount")) {
            result += `<div>${param.seriesName}: ${param.value}</div>`;
          } else if (param.seriesName === t("order.orderAmount")) {
            result += `<div>${param.seriesName}: ¥${param.value.toFixed(2)}</div>`;
          } else if (param.seriesName === t("order.chartProfit")) {
            result += `<div>${param.seriesName}: ¥${param.value.toFixed(2)}</div>`;
          } else if (param.seriesName === t("order.chartProfitRate")) {
            result += `<div>${param.seriesName}: ${param.value}%</div>`;
          }
        });

        return result;
      }
    },
    legend: {
      data: [
        t("order.orderCount"),
        t("order.orderAmount"),
        t("order.chartProfit"),
        t("order.chartProfitRate")
      ],
      top: 30
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: xAxisData,
      axisLabel: {
        interval: 0,
        rotate: xAxisData.length > 6 ? 45 : 0
      }
    },
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
        data: orderCountData,
        emphasis: {
          focus: "series"
        },
        barMaxWidth: 50,
        itemStyle: {
          color: "#1890ff"
        }
      },
      {
        name: t("order.orderAmount"),
        type: "line",
        yAxisIndex: 1,
        data: orderAmountData,
        emphasis: {
          focus: "series"
        },
        symbol: "circle",
        symbolSize: 8,
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: "#52c41a"
        }
      },
      {
        name: t("order.chartProfit"),
        type: "line",
        yAxisIndex: 1,
        data: profitData,
        emphasis: {
          focus: "series"
        },
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: "dashed"
        },
        itemStyle: {
          color: "#fa8c16"
        }
      },
      {
        name: t("order.chartProfitRate"),
        type: "line",
        data: profitRateData,
        emphasis: {
          focus: "series"
        },
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          width: 2,
          type: "dotted"
        },
        itemStyle: {
          color: "#722ed1"
        }
      }
    ]
  };
});

// 格式化周期标签
function formatPeriodLabel(period: string): string {
  // 根据传入的周期格式化标签
  switch (props.period) {
    case "daily":
      // 期望格式: YYYY-MM-DD
      return period;
    case "weekly":
      // 期望格式: YYYY-WW (例如 2023-W01)
      // 将 "2023-W01" 转换为 "第1周"
      const weekNum = period.split("-W")[1];
      return t("order.weekLabel", { week: parseInt(weekNum, 10) });
    case "monthly":
      // 期望格式: YYYY-MM
      // 将 "2023-01" 转换为 "1月"
      const [year, month] = period.split("-");
      return t("order.monthLabel", { month: parseInt(month, 10) });
    case "quarterly":
      // 期望格式: YYYY-Q1
      // 将 "2023-Q1" 转换为 "Q1"
      return period.split("-")[1];
    case "yearly":
      // 期望格式: YYYY
      return period;
    default:
      return period;
  }
}

// 获取图表数据
const fetchData = async () => {
  loading.value = true;
  error.value = "";
  noData.value = false;

  try {
    const params = {
      period: props.period,
      start_date: props.startDate,
      end_date: props.endDate
    };

    await orderStore.fetchOrderStatistics(params);
    statisticsData.value = orderStore.statistics;

    if (
      !statisticsData.value ||
      !statisticsData.value.by_period ||
      statisticsData.value.by_period.length === 0
    ) {
      noData.value = true;
    }
  } catch (err) {
    logger.error("获取订单趋势图表数据失败", err);
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
  () => [props.period, props.startDate, props.endDate],
  () => {
    reloadChart();
  }
);

// 监听统计数据变化，更新图表状态
watch(
  () => statisticsData.value,
  newVal => {
    noData.value =
      !newVal || !newVal.by_period || newVal.by_period.length === 0;
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

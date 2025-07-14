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
    default: "order-status-chart"
  }
});

// 图表DOM引用
const chartRef = ref<HTMLElement | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const error = ref("");
const loading = ref(false);
const noData = ref(false);
const statisticsData = ref<OrderStatistics | null>(null);

// 支付状态与颜色映射
const statusColorMap = {
  paid: "#52c41a", // 已支付 - 绿色
  unpaid: "#faad14", // 未支付 - 黄色
  partially_paid: "#1890ff", // 部分支付 - 蓝色
  partial: "#1890ff", // 部分支付（旧称）- 蓝色
  refunded: "#f5222d", // 已退款 - 红色
  cancelled: "#bfbfbf" // 已取消 - 灰色
};

// 支付状态翻译
const getStatusTranslation = (status: string) => {
  switch (status) {
    case "paid":
      return t("order.paymentStatusPaid");
    case "unpaid":
      return t("order.paymentStatusUnpaid");
    case "partially_paid":
    case "partial":
      return t("order.paymentStatusPartial");
    case "refunded":
      return t("order.paymentStatusRefunded");
    case "cancelled":
      return t("order.paymentStatusCancelled");
    default:
      return status;
  }
};

// 图表配置选项
const chartOptions = computed<EChartsOption>(() => {
  // 如果没有数据，返回默认选项
  if (
    !statisticsData.value ||
    !statisticsData.value.by_payment_status ||
    statisticsData.value.by_payment_status.length === 0
  ) {
    return {
      title: {
        text: t("order.orderStatusDistribution"),
        left: "center"
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c} ({d}%)"
      },
      legend: {
        orient: "horizontal",
        bottom: "bottom",
        data: []
      },
      series: [
        {
          name: t("order.paymentStatus"),
          type: "pie",
          radius: "55%",
          center: ["50%", "45%"],
          data: [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          }
        }
      ]
    };
  }

  // 处理数据
  const statusData = statisticsData.value.by_payment_status;

  // 按支付状态合并数据
  const mergedData = {};
  statusData.forEach(item => {
    let status = item.payment_status;
    if (!mergedData[status]) {
      mergedData[status] = {
        payment_status: status,
        orders: 0,
        amount: 0
      };
    }
    mergedData[status].orders += item.orders;
    mergedData[status].amount += parseFloat(String(item.amount || "0"));
  });

  const consolidatedData = Object.values(mergedData);
  const pieData = consolidatedData.map(item => ({
    name: getStatusTranslation(item.payment_status),
    value: item.orders,
    itemStyle: {
      color: statusColorMap[item.payment_status] || "#909399"
    },
    customerTotalAmount: item.amount.toFixed(2)
  }));

  return {
    title: {
      text: t("order.orderStatusDistribution"),
      left: "center"
    },
    tooltip: {
      trigger: "item",
      formatter: function (params: any) {
        const data = params.data;
        return `${t("order.paymentStatus")}: ${params.name}<br/>
                ${t("order.orderCount")}: ${params.value}<br/>
                ${t("order.orderAmount")}: ¥${data.customerTotalAmount}`;
      }
    },
    legend: {
      orient: "horizontal",
      bottom: "bottom",
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: t("order.paymentStatus"),
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
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
            fontSize: "18",
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
      !statisticsData.value.by_payment_status ||
      statisticsData.value.by_payment_status.length === 0
    ) {
      noData.value = true;
    }
  } catch (err) {
    logger.error("获取订单状态图表数据失败", err);
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
      !newVal ||
      !newVal.by_payment_status ||
      newVal.by_payment_status.length === 0;
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

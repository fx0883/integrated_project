<template>
  <div class="order-statistics-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">{{ $t("order.statisticsTitle") }}</h2>
      <div class="page-actions">
        <el-button type="primary" @click="reloadCharts">
          <el-icon><Refresh /></el-icon>
          {{ $t("common.button.refresh") }}
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline class="filter-form">
        <!-- 周期选择 -->
        <el-form-item :label="$t('order.period')">
          <el-select
            v-model="filterForm.period"
            @change="handlePeriodChange"
            class="period-select"
          >
            <el-option
              v-for="period in periodOptions"
              :key="period.value"
              :label="period.label"
              :value="period.value"
            />
          </el-select>
        </el-form-item>

        <!-- 日期范围选择 -->
        <el-form-item :label="$t('order.dateRange')">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            :start-placeholder="$t('common.startDate')"
            :end-placeholder="$t('common.endDate')"
            value-format="YYYY-MM-DD"
            :disabled-date="disableFutureDate"
            @change="handleDateRangeChange"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计摘要卡片 -->
    <div class="statistics-summary">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <div class="card-header">
              <h3>{{ $t("order.totalOrders") }}</h3>
              <el-icon class="card-icon"><Tickets /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ summary.totalOrders }}</div>
              <div
                v-if="summary.orderGrowth !== null"
                :class="[
                  'growth-rate',
                  summary.orderGrowth >= 0 ? 'positive' : 'negative'
                ]"
              >
                <el-icon v-if="summary.orderGrowth >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(summary.orderGrowth).toFixed(2) }}%
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <div class="card-header">
              <h3>{{ $t("order.totalAmount") }}</h3>
              <el-icon class="card-icon"><Money /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ summary.totalAmount }}</div>
              <div
                v-if="summary.amountGrowth !== null"
                :class="[
                  'growth-rate',
                  summary.amountGrowth >= 0 ? 'positive' : 'negative'
                ]"
              >
                <el-icon v-if="summary.amountGrowth >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(summary.amountGrowth).toFixed(2) }}%
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <div class="card-header">
              <h3>{{ $t("order.totalProfit") }}</h3>
              <el-icon class="card-icon"><PieChart /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ summary.totalProfit }}</div>
              <div
                v-if="summary.profitGrowth !== null"
                :class="[
                  'growth-rate',
                  summary.profitGrowth >= 0 ? 'positive' : 'negative'
                ]"
              >
                <el-icon v-if="summary.profitGrowth >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(summary.profitGrowth).toFixed(2) }}%
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="summary-card">
            <div class="card-header">
              <h3>{{ $t("order.avgProfitRate") }}</h3>
              <el-icon class="card-icon"><DataAnalysis /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ summary.avgProfitRate }}%</div>
              <div
                v-if="summary.profitRateGrowth !== null"
                :class="[
                  'growth-rate',
                  summary.profitRateGrowth >= 0 ? 'positive' : 'negative'
                ]"
              >
                <el-icon v-if="summary.profitRateGrowth >= 0"
                  ><CaretTop
                /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(summary.profitRateGrowth).toFixed(2) }}%
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 订单趋势图表 -->
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="card-header">
            <span>{{ $t("order.orderTrendChart") }}</span>
          </div>
        </template>
        <OrderTrendChart
          :period="filterForm.period"
          :start-date="filterForm.startDate"
          :end-date="filterForm.endDate"
          :chart-id="'order-trend-chart'"
        />
      </el-card>

      <!-- 订单状态分布和服务类型分布 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>{{ $t("order.orderStatusDistribution") }}</span>
              </div>
            </template>
            <OrderStatusChart
              :start-date="filterForm.startDate"
              :end-date="filterForm.endDate"
              :chart-id="'order-status-chart'"
            />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>{{ $t("order.serviceTypeDistribution") }}</span>
              </div>
            </template>
            <ServiceTypeChart
              :start-date="filterForm.startDate"
              :end-date="filterForm.endDate"
              :chart-id="'service-type-chart'"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  Refresh,
  Tickets,
  Money,
  PieChart,
  DataAnalysis,
  CaretTop,
  CaretBottom
} from "@element-plus/icons-vue";
import { useOrderStoreHook } from "@/store/modules/order";
import OrderTrendChart from "@/components/OrderManagement/Charts/OrderTrendChart.vue";
import OrderStatusChart from "@/components/OrderManagement/Charts/OrderStatusChart.vue";
import ServiceTypeChart from "@/components/OrderManagement/Charts/ServiceTypeChart.vue";
import logger from "@/utils/logger";

const { t } = useI18n();
const orderStore = useOrderStoreHook();

// 过滤条件
const filterForm = ref({
  period: "monthly",
  dateRange: [] as string[],
  startDate: "",
  endDate: ""
});

// 周期选项
const periodOptions = [
  { value: "daily", label: t("order.dailyPeriod") },
  { value: "weekly", label: t("order.weeklyPeriod") },
  { value: "monthly", label: t("order.monthlyPeriod") },
  { value: "quarterly", label: t("order.quarterlyPeriod") },
  { value: "yearly", label: t("order.yearlyPeriod") }
];

// 禁用未来日期
const disableFutureDate = (date: Date) => {
  return date > new Date();
};

// 统计摘要数据
const summary = ref({
  totalOrders: 0,
  orderGrowth: null as number | null,
  totalAmount: "¥0.00",
  amountGrowth: null as number | null,
  totalProfit: "¥0.00",
  profitGrowth: null as number | null,
  avgProfitRate: "0.00",
  profitRateGrowth: null as number | null
});

// 初始化日期范围
const initDateRange = () => {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startDate;
  switch (filterForm.value.period) {
    case "daily":
      // 过去30天
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 29);
      break;
    case "weekly":
      // 过去12周
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 12 * 7);
      break;
    case "monthly":
      // 过去12个月
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      break;
    case "quarterly":
      // 过去8个季度
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 24);
      // 设置为季度初
      const quarterMonth = Math.floor(startDate.getMonth() / 3) * 3;
      startDate.setMonth(quarterMonth);
      startDate.setDate(1);
      break;
    case "yearly":
      // 过去5年
      startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 4);
      startDate.setMonth(0);
      startDate.setDate(1);
      break;
    default:
      // 默认过去12个月
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  filterForm.value.startDate = formatDate(startDate);
  filterForm.value.endDate = formatDate(endDate);
  filterForm.value.dateRange = [
    filterForm.value.startDate,
    filterForm.value.endDate
  ];
};

// 处理周期变化
const handlePeriodChange = () => {
  initDateRange();
  fetchStatistics();
};

// 处理日期范围变化
const handleDateRangeChange = (val: string[]) => {
  if (val && val.length === 2) {
    filterForm.value.startDate = val[0];
    filterForm.value.endDate = val[1];
    fetchStatistics();
  }
};

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const params = {
      period: filterForm.value.period,
      start_date: filterForm.value.startDate,
      end_date: filterForm.value.endDate
    };

    await orderStore.fetchOrderStatistics(params);

    if (orderStore.statistics) {
      // 更新摘要数据
      summary.value.totalOrders = orderStore.statistics.total_orders;
      summary.value.totalAmount = orderStore.statistics.customer_total_amount;
      summary.value.totalProfit = orderStore.statistics.total_profit;
      summary.value.avgProfitRate = (
        orderStore.statistics.average_profit_rate * 100
      ).toFixed(2);

      // TODO: 计算增长率，目前使用模拟数据
      summary.value.orderGrowth = Math.random() * 20 - 5; // 模拟 -5% 到 15% 的增长
      summary.value.amountGrowth = Math.random() * 25 - 5; // 模拟 -5% 到 20% 的增长
      summary.value.profitGrowth = Math.random() * 30 - 10; // 模拟 -10% 到 20% 的增长
      summary.value.profitRateGrowth = Math.random() * 15 - 7.5; // 模拟 -7.5% 到 7.5% 的增长
    }
  } catch (err) {
    logger.error("获取订单统计数据失败", err);
  }
};

// 重新加载所有图表
const reloadCharts = () => {
  fetchStatistics();
};

// 监听
onMounted(() => {
  initDateRange();
  fetchStatistics();
});
</script>

<style lang="scss" scoped>
.order-statistics-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .page-title {
      margin: 0;
      font-size: 22px;
      font-weight: 500;
    }
  }

  .filter-section {
    margin-bottom: 24px;
    background-color: #fff;
    padding: 16px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

    .filter-form {
      display: flex;
      flex-wrap: wrap;
    }
    
    .period-select {
      width: 120px;
    }
  }

  .statistics-summary {
    margin-bottom: 24px;

    .summary-card {
      margin-bottom: 16px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: normal;
          color: #666;
        }

        .card-icon {
          font-size: 24px;
          color: #409eff;
        }
      }

      .card-content {
        display: flex;
        justify-content: space-between;
        align-items: baseline;

        .card-value {
          font-size: 28px;
          font-weight: 500;
        }

        .growth-rate {
          display: flex;
          align-items: center;
          font-size: 14px;

          &.positive {
            color: #67c23a;
          }

          &.negative {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .charts-section {
    .chart-card {
      margin-bottom: 24px;

      :deep(.el-card__header) {
        padding: 12px 20px;
        border-bottom: 1px solid #ebeef5;

        .card-header {
          font-size: 16px;
          font-weight: 500;
        }
      }
    }

    .chart-row {
      margin-bottom: 0;
    }
  }
}
</style>

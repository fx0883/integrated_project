<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

// 导入子组件
import DateRangePicker from "./DateRangePicker.vue";
import PeriodSelector from "./PeriodSelector.vue";
import StatisticCard from "./StatisticCard.vue";
import TenantTrendChart from "./Charts/TenantTrendChart.vue";
import TenantStatusChart from "./Charts/TenantStatusChart.vue";
import TenantCreationChart from "./Charts/TenantCreationChart.vue";

// 导入API和类型
import {
  fetchTenantTrendData,
  fetchTenantStatusDistribution,
  fetchTenantCreationRate,
  calculateTenantSummary
} from "@/api/modules/tenant";
import type {
  TenantChartData,
  TenantStatusData,
  TenantCreationData,
  TenantSummary,
  ChartPeriod
} from "@/types/tenant";

// 定义props
const props = defineProps({
  initialPeriod: {
    type: String as () => ChartPeriod,
    default: "monthly"
  },
  initialDateRange: {
    type: Object as () => { startDate: string; endDate: string },
    default: () => {
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().subtract(12, "month").format("YYYY-MM-DD");
      return { startDate: start, endDate: end };
    }
  }
});

// i18n支持
const { t } = useI18n();

// 状态定义
const period = ref<ChartPeriod>(props.initialPeriod);
const startDate = ref<string>(props.initialDateRange.startDate);
const endDate = ref<string>(props.initialDateRange.endDate);

// 加载状态
const loading = reactive({
  trend: false,
  status: false,
  creation: false
});

// 错误信息
const error = ref<string>("");

// 图表数据
const trendData = ref<TenantChartData | null>(null);
const statusData = ref<TenantStatusData | null>(null);
const creationRateData = ref<TenantCreationData | null>(null);
const summaryData = ref<TenantSummary | null>(null);

/**
 * 获取租户趋势数据
 */
async function fetchTrendData() {
  loading.trend = true;
  error.value = "";

  try {
    const response = await fetchTenantTrendData(
      period.value,
      startDate.value,
      endDate.value
    );

    if (response.success) {
      trendData.value = response.data;
      // 计算汇总数据
      if (trendData.value) {
        summaryData.value = calculateTenantSummary(trendData.value);
      }
    } else {
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.trend = false;
  }
}

/**
 * 获取租户状态分布数据
 */
async function fetchStatusData() {
  loading.status = true;
  error.value = "";

  try {
    const response = await fetchTenantStatusDistribution();

    if (response.success) {
      statusData.value = response.data;
    } else {
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.status = false;
  }
}

/**
 * 获取租户创建速率数据
 */
async function fetchCreationRateData() {
  loading.creation = true;
  error.value = "";

  try {
    const response = await fetchTenantCreationRate(
      period.value,
      startDate.value,
      endDate.value
    );

    if (response.success) {
      creationRateData.value = response.data;
    } else {
      throw new Error(response.message || t("dashboard.fetchDataFailed"));
    }
  } catch (err: any) {
    error.value = err.message || t("dashboard.fetchDataFailed");
    ElMessage.error(error.value);
  } finally {
    loading.creation = false;
  }
}

/**
 * 获取所有图表数据
 */
async function fetchAllData() {
  // 并行请求数据
  await Promise.all([
    fetchTrendData(),
    fetchStatusData(),
    fetchCreationRateData()
  ]);
}

/**
 * 处理日期范围变更
 */
function handleDateRangeChange(range: { startDate: string; endDate: string }) {
  startDate.value = range.startDate;
  endDate.value = range.endDate;
}

/**
 * 处理周期变更
 */
function handlePeriodChange(newPeriod: ChartPeriod) {
  period.value = newPeriod;
}

// 监听日期和周期变化，重新加载数据
watch([() => startDate.value, () => endDate.value, () => period.value], () => {
  fetchAllData();
});

// 组件挂载时加载数据
onMounted(() => {
  fetchAllData();
});
</script>

<template>
  <div class="tenant-charts-container">
    <!-- 筛选区域 -->
    <div class="filters-container">
      <DateRangePicker
        :start-date="startDate"
        :end-date="endDate"
        @update:range="handleDateRangeChange"
      />
      <PeriodSelector :value="period" @update:period="handlePeriodChange" />
    </div>

    <!-- 汇总数据卡片 -->
    <div class="summary-container">
      <StatisticCard v-if="summaryData" :data="summaryData" :period="period" />
    </div>

    <!-- 图表区域 -->
    <div class="charts-wrapper">
      <el-row :gutter="20">
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantTrend") }}</h3>
            </div>
            <div class="chart-body">
              <TenantTrendChart
                :data="trendData"
                :loading="loading.trend"
                :period="period"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantStatus") }}</h3>
            </div>
            <div class="chart-body">
              <TenantStatusChart :data="statusData" :loading="loading.status" />
            </div>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ t("dashboard.tenantCreationRate") }}</h3>
            </div>
            <div class="chart-body">
              <TenantCreationChart
                :data="creationRateData"
                :loading="loading.creation"
                :period="period"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="error = ''"
    />
  </div>
</template>

<style scoped>
.tenant-charts-container {
  padding: 20px;
}

.filters-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.summary-container {
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.chart-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.chart-header {
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.chart-body {
  padding: 20px;
  height: 300px;
}

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    gap: 10px;
  }

  .chart-body {
    height: 250px;
  }
}
</style>

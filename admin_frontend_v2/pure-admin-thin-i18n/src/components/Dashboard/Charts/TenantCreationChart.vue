<script lang="ts" setup>
import { ref, computed, defineProps, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Loading } from '@element-plus/icons-vue';
import type { EChartsOption } from 'echarts/types/dist/shared';
import type { TenantCreationData, ChartPeriod } from '@/types/tenant';
import { useChart } from '@/hooks/useChart';

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
    default: 'monthly'
  },
  height: {
    type: String,
    default: '100%'
  }
});

// i18n支持
const { t } = useI18n();

// 图表DOM引用
const chartRef = ref<HTMLDivElement | null>(null);

// 图表配置
const chartOptions = computed<EChartsOption>(() => {
  if (!props.data || !props.data.labels || !props.data.datasets || props.data.datasets.length === 0) {
    return {};
  }

  const dataset = props.data.datasets[0];
  const color = dataset.color || '#91cc75';
  
  // 获取平均值用于参考线
  const average = dataset.data.length > 0
    ? dataset.data.reduce((sum, val) => sum + val, 0) / dataset.data.length
    : 0;
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const param = params[0];
        return `${param.axisValue}<br/>${t('dashboard.newTenants')}: ${param.value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.labels,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: t('dashboard.newTenants'),
      minInterval: 1
    },
    series: [
      {
        name: dataset.label || t('dashboard.newTenants'),
        type: 'bar',
        barWidth: '60%',
        data: dataset.data,
        itemStyle: {
          color: color,
          borderRadius: [4, 4, 0, 0]
        },
        markLine: average > 0 ? {
          data: [
            {
              type: 'average',
              name: t('dashboard.average')
            }
          ],
          label: {
            formatter: '{b}: {c}',
            position: 'insideEndTop'
          },
          lineStyle: {
            type: 'solid',
            color: '#5470c6',
            width: 1.5
          }
        } : undefined
      }
    ]
  };
});

// 使用自定义钩子管理图表
const options = ref<EChartsOption>({});
const { chartInstance, loading: chartLoading, setLoading } = useChart(chartRef, options);

// 当props.data变化时更新图表
watch(() => props.data, (newData) => {
  if (newData && newData.labels && newData.datasets) {
    options.value = chartOptions.value;
  }
}, { deep: true });

// 当loading状态变化时更新图表加载状态
watch(() => props.loading, (newLoading) => {
  setLoading(newLoading);
});
</script>

<template>
  <div class="chart-container" :style="{ height }">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ t('dashboard.loading') }}</span>
    </div>
    <div 
      v-else-if="!data || !data.labels || data.labels.length === 0 || !data.datasets || data.datasets.length === 0" 
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
import { onMounted, onUnmounted, ref, Ref, watch } from 'vue';
import * as echarts from 'echarts/core';
import { debounce } from '@pureadmin/utils';

/**
 * 通用ECharts图表处理钩子
 * @param chartRef 图表DOM引用
 * @param options 图表配置选项
 * @param autoResize 是否自动响应窗口大小变化，默认为true
 * @returns 图表实例、加载状态及相关方法
 */
export function useChart(
  chartRef: Ref<HTMLDivElement | null>,
  options: Ref<echarts.EChartsOption>,
  autoResize = true
) {
  let chartInstance: echarts.ECharts | null = null;
  const loading = ref(false);

  /**
   * 初始化图表
   */
  function initChart() {
    if (!chartRef.value) return;
    
    // 确保DOM已挂载
    if (chartInstance) {
      chartInstance.dispose();
    }
    
    chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption(options.value);
    
    if (autoResize) {
      window.addEventListener('resize', resizeHandler);
    }
  }

  /**
   * 更新图表配置
   */
  function updateChart() {
    if (!chartInstance) return;
    chartInstance.setOption(options.value);
  }

  /**
   * 设置图表加载状态
   */
  function setLoading(status: boolean) {
    loading.value = status;
    if (!chartInstance) return;
    
    if (status) {
      chartInstance.showLoading({
        text: '加载中...',
        maskColor: 'rgba(255, 255, 255, 0.6)'
      });
    } else {
      chartInstance.hideLoading();
    }
  }

  // 当options变化时更新图表
  watch(options, () => {
    updateChart();
  });

  // 窗口大小变化处理函数
  const resizeHandler = debounce(() => {
    if (chartInstance) {
      chartInstance.resize();
    }
  }, 100);

  onMounted(() => {
    initChart();
  });

  onUnmounted(() => {
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
    if (autoResize) {
      window.removeEventListener('resize', resizeHandler);
    }
  });

  return {
    chartInstance,
    loading,
    setLoading,
    updateChart,
    initChart
  };
} 
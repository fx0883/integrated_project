import { onMounted, onUnmounted, ref, Ref, watch, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { debounce } from '@pureadmin/utils';
import logger from '@/utils/logger';

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
  let initRetries = 0;
  const MAX_RETRIES = 3;
  
  // 生成唯一的图表ID，用于日志区分
  const chartId = `chart_${Math.random().toString(36).substring(2, 9)}`;
  
  logger.debug(`【图表钩子】创建图表钩子 ID:${chartId}`, { 
    autoResize,
    initialOptions: options.value
  });

  /**
   * 初始化图表
   */
  function initChart() {
    if (!chartRef.value) {
      logger.warn(`【图表钩子】图表初始化失败：DOM引用不存在 ID:${chartId}`);
      
      // 如果DOM引用不存在，尝试在nextTick后重试
      if (initRetries < MAX_RETRIES) {
        initRetries++;
        logger.debug(`【图表钩子】等待DOM就绪后重试 (${initRetries}/${MAX_RETRIES}) ID:${chartId}`);
        
        nextTick(() => {
          // 使用setTimeout确保给DOM足够时间完成渲染
          setTimeout(() => {
            initChart();
          }, 50 * initRetries);
        });
      }
      return;
    }
    
    // 检查DOM尺寸是否就绪
    if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) {
      logger.warn(`【图表钩子】图表初始化失败：DOM尺寸为零 ID:${chartId}`);
      
      if (initRetries < MAX_RETRIES) {
        initRetries++;
        logger.debug(`【图表钩子】等待DOM尺寸就绪后重试 (${initRetries}/${MAX_RETRIES}) ID:${chartId}`);
        
        nextTick(() => {
          setTimeout(() => {
            initChart();
          }, 100 * initRetries);
        });
      }
      return;
    }
    
    logger.debug(`【图表钩子】开始初始化图表 ID:${chartId}`, {
      domSize: {
        width: chartRef.value.clientWidth,
        height: chartRef.value.clientHeight
      },
      retries: initRetries
    });
    
    // 确保DOM已挂载
    if (chartInstance) {
      logger.debug(`【图表钩子】重新初始化，销毁现有实例 ID:${chartId}`);
      chartInstance.dispose();
    }
    
    try {
      chartInstance = echarts.init(chartRef.value);
      
      // 只有在存在有效配置选项时才设置
      if (options.value && Object.keys(options.value).length > 0) {
        chartInstance.setOption(options.value, true);
      }
      
      logger.debug(`【图表钩子】图表初始化成功 ID:${chartId}`, {
        optionType: options.value.series ? options.value.series[0]?.type : '未知'
      });
      
      // 监听图表事件，记录错误
      chartInstance.on('rendererror', (params) => {
        logger.error(`【图表钩子】图表渲染错误 ID:${chartId}`, params);
      });
      
      if (autoResize) {
        window.addEventListener('resize', resizeHandler);
        logger.debug(`【图表钩子】已启用自动调整大小 ID:${chartId}`);
      }
    } catch (error) {
      logger.error(`【图表钩子】图表初始化异常 ID:${chartId}`, error);
      console.error(`图表初始化异常:`, error);
    }
  }

  /**
   * 更新图表配置
   */
  function updateChart() {
    if (!chartInstance) {
      logger.warn(`【图表钩子】图表更新失败：实例不存在 ID:${chartId}`);
      
      // 如果实例不存在，尝试重新初始化图表
      if (initRetries < MAX_RETRIES) {
        logger.debug(`【图表钩子】尝试重新初始化图表后更新配置 ID:${chartId}`);
        initRetries++;
        setTimeout(() => {
          initChart();
          // 重新尝试更新图表
          if (chartInstance && options.value) {
            // 使用深拷贝避免引用问题
            const optionsCopy = JSON.parse(JSON.stringify(options.value));
            chartInstance.setOption(optionsCopy, true);
          }
        }, 100);
        return;
      }
      return;
    }
    
    logger.debug(`【图表钩子】更新图表配置 ID:${chartId}`);
    
    try {
      // 检查配置是否有效
      if (options.value && Object.keys(options.value).length > 0) {
        console.log(`更新图表 ${chartId} 配置:`, options.value);
        console.log(`图表 ${chartId} 更新前状态:`, {
          hasChartInstance: !!chartInstance,
          domExists: !!chartRef.value,
          domSize: chartRef.value ? {
            width: chartRef.value.clientWidth,
            height: chartRef.value.clientHeight
          } : null,
          seriesType: options.value.series ? 
            Array.isArray(options.value.series) ? options.value.series[0]?.type : '未知' : '无series'
        });
        
        // 捕获ECharts的调用错误
        nextTick(() => {
          if (chartInstance) {
            // 使用深拷贝避免引用问题
            const optionsCopy = JSON.parse(JSON.stringify(options.value));
            chartInstance.setOption(optionsCopy, true);
            logger.debug(`【图表钩子】图表配置更新成功 ID:${chartId}`);
          }
        });
      } else {
        logger.warn(`【图表钩子】图表配置为空，跳过更新 ID:${chartId}`);
      }
    } catch (error) {
      logger.error(`【图表钩子】图表配置更新异常 ID:${chartId}`, error);
      console.error(`图表配置更新异常:`, error);
    }
  }

  /**
   * 设置图表加载状态
   */
  function setLoading(status: boolean) {
    loading.value = status;
    logger.debug(`【图表钩子】设置图表加载状态 ID:${chartId}`, { status });
    
    if (!chartInstance) {
      logger.warn(`【图表钩子】设置加载状态失败：实例不存在 ID:${chartId}`);
      return;
    }
    
    try {
      if (status) {
        chartInstance.showLoading({
          text: '加载中...',
          maskColor: 'rgba(255, 255, 255, 0.6)'
        });
      } else {
        chartInstance.hideLoading();
      }
    } catch (error) {
      logger.error(`【图表钩子】设置加载状态异常 ID:${chartId}`, error);
      console.error(`图表设置加载状态异常:`, error);
    }
  }

  // 当options变化时更新图表
  watch(options, (newOptions, oldOptions) => {
    logger.debug(`【图表钩子】检测到配置变更 ID:${chartId}`, { 
      hasNewSeries: !!newOptions.series,
      hasOldSeries: !!oldOptions.series,
    });
    
    // 确保在nextTick中更新图表，以便DOM已完全渲染
    nextTick(() => {
      // 如果图表实例不存在，尝试初始化
      if (!chartInstance) {
        initChart();
      }
      
      // 更新图表配置
      if (chartInstance) {
        updateChart();
      }
    });
  });

  // 窗口大小变化处理函数
  const resizeHandler = debounce(() => {
    if (chartInstance) {
      logger.debug(`【图表钩子】窗口大小变化，调整图表 ID:${chartId}`, {
        containerSize: chartRef.value ? {
          width: chartRef.value.clientWidth,
          height: chartRef.value.clientHeight
        } : 'unknown'
      });
      chartInstance.resize();
    }
  }, 100);

  onMounted(() => {
    logger.debug(`【图表钩子】组件挂载，初始化图表 ID:${chartId}`);
    // 使用多次尝试确保DOM初始化
    const attemptInit = () => {
      if (!chartRef.value || chartRef.value.clientWidth === 0) {
        if (initRetries < MAX_RETRIES) {
          initRetries++;
          logger.debug(`【图表钩子】等待DOM就绪 (${initRetries}/${MAX_RETRIES}) ID:${chartId}`);
          setTimeout(attemptInit, 100 * initRetries);
        }
      } else {
        initChart();
      }
    };
    
    // 延迟初始化，确保DOM已就绪
    nextTick(() => {
      setTimeout(attemptInit, 50);
    });
  });

  onUnmounted(() => {
    logger.debug(`【图表钩子】组件卸载，销毁图表 ID:${chartId}`);
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
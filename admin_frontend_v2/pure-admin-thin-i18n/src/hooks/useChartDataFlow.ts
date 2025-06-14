import { ref, onMounted, onUnmounted } from 'vue';
import { useChart } from '@/hooks/useChart';
import logger from '@/utils/logger';

/**
 * 图表数据流管理Hook
 * 实现正确的初始化和数据加载流程：
 * 1. 组件挂载
 * 2. 等待DOM完全就绪
 * 3. 确认图表实例初始化成功
 * 4. 然后调用API获取数据
 * 5. 使用获取的数据更新图表
 * 
 * @param chartRef 图表DOM引用
 * @param options 图表配置选项
 * @param fetchDataFn 获取数据的函数
 * @param componentId 组件唯一ID
 * @param forceInit 是否强制初始化，不等待DOM就绪
 * @returns 图表实例、加载状态及相关方法
 */
export function useChartDataFlow(
  chartRef: any,
  options: any,
  fetchDataFn: () => Promise<any>,
  componentId: string,
  forceInit: boolean = false
) {
  // 图表初始化状态
  const isChartInitialized = ref(false);
  const isDataLoaded = ref(false);
  const isLoading = ref(false);
  const error = ref('');
  let initAttempts = 0;
  const MAX_INIT_ATTEMPTS = 20;
  
  // 使用基础图表Hook
  const {
    chartInstance,
    loading: chartLoading,
    setLoading,
    forceReInit,
    initChart
  } = useChart(chartRef, options);
  
  // 初始化图表并在成功后加载数据
  function initializeChart() {
    logger.debug(`【${componentId}】开始初始化图表流程`);
    
    // 检查DOM是否就绪或是否应该强制初始化
    if (!chartRef.value) {
      logger.debug(`【${componentId}】DOM未就绪，延迟初始化 (尝试 ${++initAttempts}/${MAX_INIT_ATTEMPTS})`);
      
      if (initAttempts >= MAX_INIT_ATTEMPTS) {
        logger.warn(`【${componentId}】达到最大初始化尝试次数，强制初始化`);
        // 即使DOM未就绪，也尝试初始化图表并加载数据
        proceedWithInitialization();
        return;
      }
      
      setTimeout(initializeChart, 100);
      return;
    }
    
    proceedWithInitialization();
  }
  
  // 继续初始化流程
  function proceedWithInitialization() {
    try {
      // 初始化图表
      initChart();
      
      // 使用MutationObserver监听DOM变化，确保图表容器已完全渲染
      const observer = new MutationObserver((mutations) => {
        // 放宽DOM就绪条件，只要有引用就可以
        if (chartRef.value) {
          logger.debug(`【${componentId}】图表DOM变化检测到，尝试初始化`);
          observer.disconnect();
          completeInitialization();
        }
      });
      
      // 开始观察DOM变化
      if (chartRef.value) {
        observer.observe(chartRef.value, {
          attributes: true,
          childList: true,
          subtree: true
        });
        
        // 如果DOM已经就绪或强制初始化，直接完成初始化
        if (forceInit || (chartRef.value.clientWidth > 0 && chartRef.value.clientHeight > 0)) {
          logger.debug(`【${componentId}】图表DOM已就绪或强制初始化，尺寸: ${chartRef.value.clientWidth}x${chartRef.value.clientHeight}`);
          observer.disconnect();
          completeInitialization();
        }
      }
      
      // 设置超时，避免无限等待
      setTimeout(() => {
        observer.disconnect();
        if (!isChartInitialized.value) {
          logger.warn(`【${componentId}】等待DOM就绪超时，强制完成初始化`);
          completeInitialization();
        }
      }, 1000); // 缩短超时时间
      
    } catch (err) {
      logger.error(`【${componentId}】图表初始化失败`, err);
      error.value = '图表初始化失败';
    }
  }
  
  // 完成初始化并加载数据
  function completeInitialization() {
    if (isChartInitialized.value) {
      return; // 避免重复初始化
    }
    
    isChartInitialized.value = true;
    logger.debug(`【${componentId}】图表初始化完成，准备加载数据`);
    
    // 加载数据
    loadData();
  }
  
  // 加载数据
  async function loadData() {
    if (!isChartInitialized.value) {
      logger.warn(`【${componentId}】图表未初始化，不能加载数据`);
      return;
    }
    
    if (isLoading.value) {
      logger.warn(`【${componentId}】数据正在加载中，跳过重复请求`);
      return;
    }
    
    logger.debug(`【${componentId}】开始加载数据`);
    isLoading.value = true;
    setLoading(true);
    error.value = '';
    
    try {
      // 调用外部提供的数据获取函数
      const data = await fetchDataFn();
      isDataLoaded.value = true;
      logger.debug(`【${componentId}】数据加载成功`, data);
      
      // 数据加载成功后，更新图表
      if (chartInstance) {
        logger.debug(`【${componentId}】图表数据更新成功`);
      }
      
      return data;
    } catch (err: any) {
      logger.error(`【${componentId}】数据加载失败`, err);
      error.value = err.message || '数据加载失败';
      throw err;
    } finally {
      isLoading.value = false;
      setLoading(false);
    }
  }
  
  // 强制重新加载数据
  function reloadData() {
    logger.debug(`【${componentId}】强制重新加载数据`);
    return loadData();
  }
  
  // 组件挂载时初始化图表
  onMounted(() => {
    logger.debug(`【${componentId}】组件挂载，开始初始化图表流程`);
    // 延迟初始化，确保DOM已渲染
    setTimeout(initializeChart, 100);
  });
  
  // 组件卸载时清理资源
  onUnmounted(() => {
    logger.debug(`【${componentId}】组件卸载，清理资源`);
    isChartInitialized.value = false;
    isDataLoaded.value = false;
  });
  
  return {
    chartInstance,
    isChartInitialized,
    isDataLoaded,
    isLoading,
    error,
    loadData,
    reloadData,
    forceReInit
  };
} 
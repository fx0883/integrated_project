import { onMounted, onUnmounted, ref, type Ref, watch, nextTick } from "vue";
import * as echarts from "echarts/core";
import { debounce } from "@pureadmin/utils";
import logger from "@/utils/logger";

/**
 * 通用ECharts图表处理钩子
 * @param chartRef 图表DOM引用
 * @param options 图表配置选项
 * @param autoResize 是否自动响应窗口大小变化，默认为true
 * @returns 图表实例、加载状态及相关方法
 */
export function useChart(
  chartRef: Ref<HTMLDivElement | null>,
  options: Ref<echarts.EChartsCoreOption>,
  autoResize = true
) {
  let chartInstance: echarts.ECharts | null = null;
  const loading = ref(false);
  let initRetries = 0;
  const MAX_RETRIES = 5; // 增加最大重试次数
  let isInitializing = false; // 添加初始化状态标志
  let pendingOptionUpdate = false; // 添加待更新标志

  // 生成唯一的图表ID，用于日志区分
  const chartId = `chart_${Math.random().toString(36).substring(2, 9)}`;

  logger.debug(`【图表钩子】创建图表钩子 ID:${chartId}`, {
    autoResize,
    initialOptions: options.value
  });

  /**
   * 检查DOM是否就绪
   */
  function isDomReady(): boolean {
    if (!chartRef.value) {
      logger.debug(`【图表钩子】DOM引用不存在 ID:${chartId}`);
      return false;
    }

    if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) {
      logger.debug(`【图表钩子】DOM尺寸为零 ID:${chartId}`, {
        width: chartRef.value.clientWidth,
        height: chartRef.value.clientHeight
      });
      return false;
    }

    return true;
  }

  /**
   * 初始化图表
   */
  function initChart() {
    // 防止重复初始化
    if (isInitializing) {
      logger.debug(`【图表钩子】初始化已在进行中，跳过 ID:${chartId}`);
      return;
    }

    isInitializing = true;

    if (!isDomReady()) {
      logger.warn(`【图表钩子】图表初始化失败：DOM未就绪 ID:${chartId}`);

      // 如果DOM引用不存在或尺寸为零，尝试在延迟后重试
      if (initRetries < MAX_RETRIES) {
        initRetries++;
        const delay = 100 * Math.pow(1.5, initRetries); // 指数退避策略

        logger.debug(
          `【图表钩子】等待DOM就绪后重试 (${initRetries}/${MAX_RETRIES}) ID:${chartId}, 延迟: ${delay}ms`
        );

        setTimeout(() => {
          isInitializing = false;
          initChart();
        }, delay);
      } else {
        logger.error(
          `【图表钩子】初始化失败：已达到最大重试次数 ID:${chartId}`
        );
        isInitializing = false;
      }
      return;
    }

    logger.debug(`【图表钩子】开始初始化图表 ID:${chartId}`, {
      domSize: {
        width: chartRef.value!.clientWidth,
        height: chartRef.value!.clientHeight
      },
      retries: initRetries
    });

    // 确保DOM已挂载
    if (chartInstance) {
      logger.debug(`【图表钩子】重新初始化，销毁现有实例 ID:${chartId}`);
      chartInstance.dispose();
      chartInstance = null;
    }

    try {
      // 确保DOM引用存在
      if (!chartRef.value) {
        throw new Error("DOM引用不存在");
      }

      chartInstance = echarts.init(chartRef.value);

      // 只有在存在有效配置选项时才设置
      if (options.value && Object.keys(options.value).length > 0) {
        const optionsCopy = JSON.parse(JSON.stringify(options.value));
        chartInstance.setOption(optionsCopy, true);
      }

      logger.debug(`【图表钩子】图表初始化成功 ID:${chartId}`, {
        optionType: options.value.series
          ? Array.isArray(options.value.series)
            ? options.value.series[0]?.type
            : "未知"
          : "无series"
      });

      // 监听图表事件，记录错误
      chartInstance.on("rendererror", params => {
        logger.error(`【图表钩子】图表渲染错误 ID:${chartId}`, params);
      });

      if (autoResize) {
        window.addEventListener("resize", resizeHandler);
        logger.debug(`【图表钩子】已启用自动调整大小 ID:${chartId}`);
      }

      // 重置重试计数
      initRetries = 0;

      // 如果有待更新的配置，立即应用
      if (pendingOptionUpdate) {
        logger.debug(`【图表钩子】应用待更新配置 ID:${chartId}`);
        pendingOptionUpdate = false;
        updateChart();
      }
    } catch (error) {
      logger.error(`【图表钩子】图表初始化异常 ID:${chartId}`, error);
      
      // 在初始化失败时尝试重试
      if (initRetries < MAX_RETRIES) {
        initRetries++;
        const delay = 200 * initRetries;
        logger.debug(
          `【图表钩子】初始化失败，将在${delay}ms后重试 (${initRetries}/${MAX_RETRIES}) ID:${chartId}`
        );

        setTimeout(() => {
          isInitializing = false;
          initChart();
        }, delay);
        return;
      }
    } finally {
      isInitializing = false;
    }
  }

  /**
   * 更新图表配置
   */
  function updateChart() {
    if (!chartInstance) {
      logger.warn(`【图表钩子】图表更新失败：实例不存在 ID:${chartId}`);

      // 标记有待更新的配置
      pendingOptionUpdate = true;

      // 如果实例不存在，尝试重新初始化图表
      if (!isInitializing && initRetries < MAX_RETRIES) {
        logger.debug(`【图表钩子】尝试重新初始化图表后更新配置 ID:${chartId}`);
        initChart();
      }
      return;
    }

    logger.debug(`【图表钩子】更新图表配置 ID:${chartId}`);

    try {
      // 检查配置是否有效
      if (options.value && Object.keys(options.value).length > 0) {
        logger.debug(`更新图表 ${chartId} 配置:`, options.value);
        logger.debug(`图表 ${chartId} 更新前状态:`, {
          hasChartInstance: !!chartInstance,
          domExists: !!chartRef.value,
          domSize: chartRef.value
            ? {
                width: chartRef.value.clientWidth,
                height: chartRef.value.clientHeight
              }
            : null,
          seriesType: options.value.series
            ? Array.isArray(options.value.series)
              ? options.value.series[0]?.type
              : "未知"
            : "无series"
        });

        // 使用深拷贝避免引用问题
        const optionsCopy = JSON.parse(JSON.stringify(options.value));

        // 立即应用配置，不等待nextTick
        chartInstance.setOption(optionsCopy, true);
        logger.debug(`【图表钩子】图表配置更新成功 ID:${chartId}`);

        // 确保图表已正确渲染
        nextTick(() => {
          if (chartInstance) {
            chartInstance.resize();
          }
        });
      } else {
        logger.warn(`【图表钩子】图表配置为空，跳过更新 ID:${chartId}`);
      }
    } catch (error) {
      logger.error(`【图表钩子】图表配置更新异常 ID:${chartId}`, error);
      
      // 尝试重新创建图表实例
      if (chartInstance) {
        try {
          chartInstance.dispose();
        } catch {
          // 忽略销毁错误
        }
        chartInstance = null;
      }

      // 重新初始化图表
      if (initRetries < MAX_RETRIES) {
        initRetries++;
        setTimeout(() => {
          initChart();
        }, 200);
      }
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
          text: "加载中...",
          maskColor: "rgba(255, 255, 255, 0.6)"
        });
      } else {
        chartInstance.hideLoading();
      }
    } catch (error) {
      logger.error(`【图表钩子】设置加载状态异常 ID:${chartId}`, error);
    }
  }

  /**
   * 强制重新初始化图表
   * 用于在数据变更但图表未正确渲染时手动调用
   */
  function forceReInit() {
    logger.debug(`【图表钩子】强制重新初始化图表 ID:${chartId}`);

    // 重置状态
    initRetries = 0;
    isInitializing = false;
    pendingOptionUpdate = true;

    // 销毁现有实例
    if (chartInstance) {
      try {
        chartInstance.dispose();
      } catch {
        // 忽略销毁错误
      }
      chartInstance = null;
    }

    // 延迟初始化以确保DOM就绪
    setTimeout(() => {
      initChart();
    }, 100);
  }

  // 当options变化时更新图表
  watch(
    options,
    (newOptions, oldOptions) => {
      logger.debug(`【图表钩子】检测到配置变更 ID:${chartId}`, {
        hasNewSeries: !!newOptions.series,
        hasOldSeries: !!oldOptions.series,
        newLabelsLength: getXAxisDataLength(newOptions)
      });

      // 确保在nextTick中更新图表，以便DOM已完全渲染
      nextTick(() => {
        // 如果图表实例不存在，尝试初始化
        if (!chartInstance) {
          initChart();
        } else {
          // 更新图表配置
          updateChart();
        }
      });
    },
    { deep: true }
  ); // 添加深度监听

  /**
   * 安全获取X轴数据长度
   */
  function getXAxisDataLength(opt: echarts.EChartsCoreOption): number | string {
    try {
      if (!opt.xAxis) {
        return "no-xAxis";
      }

      // 使用类型断言处理xAxis类型
      const xAxis = opt.xAxis as any;

      if (Array.isArray(xAxis)) {
        if (xAxis[0] && Array.isArray(xAxis[0].data)) {
          return xAxis[0].data.length;
        }
      } else if (xAxis && Array.isArray(xAxis.data)) {
        return xAxis.data.length;
      }

      return "unknown-format";
    } catch {
      return "error";
    }
  }

  // 窗口大小变化处理函数
  const resizeHandler = debounce(() => {
    if (chartInstance) {
      logger.debug(`【图表钩子】窗口大小变化，调整图表 ID:${chartId}`, {
        containerSize: chartRef.value
          ? {
              width: chartRef.value.clientWidth,
              height: chartRef.value.clientHeight
            }
          : "unknown"
      });
      chartInstance.resize();
    } else if (isDomReady()) {
      // 如果实例不存在但DOM已就绪，尝试重新初始化
      logger.debug(
        `【图表钩子】窗口大小变化，检测到DOM已就绪但实例不存在，尝试初始化 ID:${chartId}`
      );
      initChart();
    }
  }, 100);

  // 监听DOM引用变化
  watch(
    () => chartRef.value,
    (newRef, oldRef) => {
      if (newRef && !oldRef) {
        logger.debug(`【图表钩子】检测到DOM引用变化，尝试初始化 ID:${chartId}`);
        nextTick(() => {
          initChart();
        });
      }
    }
  );

  onMounted(() => {
    logger.debug(`【图表钩子】组件挂载，初始化图表 ID:${chartId}`);
    // 使用多次尝试确保DOM初始化
    const attemptInit = () => {
      if (!isDomReady()) {
        if (initRetries < MAX_RETRIES) {
          initRetries++;
          const delay = 100 * Math.pow(1.5, initRetries);
          logger.debug(
            `【图表钩子】等待DOM就绪 (${initRetries}/${MAX_RETRIES}) ID:${chartId}, 延迟: ${delay}ms`
          );
          setTimeout(attemptInit, delay);
        } else {
          logger.warn(
            `【图表钩子】DOM未就绪，已达到最大重试次数 ID:${chartId}`
          );
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
      try {
        // 移除所有事件监听器
        chartInstance.off();
        chartInstance.dispose();
      } catch {
        logger.error(`【图表钩子】销毁图表异常 ID:${chartId}`);
      }
      chartInstance = null;
    }
    if (autoResize) {
      window.removeEventListener("resize", resizeHandler);
    }
  });

  return {
    chartInstance,
    loading,
    setLoading,
    updateChart,
    initChart,
    forceReInit // 导出强制重新初始化方法
  };
}

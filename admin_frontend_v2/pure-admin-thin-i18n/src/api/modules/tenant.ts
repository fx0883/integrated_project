import { http } from "@/utils/http";
import type { ApiResponse } from "@/types/api";
import type { 
  TenantChartData, 
  TenantStatusData, 
  TenantCreationData, 
  ChartPeriod 
} from "@/types/tenant";
import logger from "@/utils/logger"; // 导入日志工具

/**
 * 格式化图表数据，确保格式一致性
 */
export function formatChartData(data: any): TenantChartData {
  // 检查数据是否存在
  if (!data) {
    logger.debug("图表数据为空，返回空数据结构");
    return { hasData: false, labels: [], datasets: [] };
  }
  
  // 处理可能嵌套的数据结构
  const chartData = data.data || data;
  
  const formattedData = {
    hasData: !!(chartData.labels && chartData.datasets && chartData.labels.length > 0),
    labels: chartData.labels || [],
    datasets: chartData.datasets || [],
    summary: chartData.summary || {}
  };
  
  logger.debug("图表数据格式化结果:", JSON.parse(JSON.stringify(formattedData)));
  
  return formattedData;
}

/**
 * 获取租户数量趋势数据
 * @param period 时间周期(daily/weekly/monthly/quarterly/yearly)
 * @param startDate 开始日期(YYYY-MM-DD)
 * @param endDate 结束日期(YYYY-MM-DD)
 */
export async function fetchTenantTrendData(
  period: ChartPeriod = 'monthly', 
  startDate?: string, 
  endDate?: string
) {
  let url = `/admin/charts/tenant-trend/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  logger.debug("请求租户数量趋势数据", { period, startDate, endDate });
  // 直接打印到控制台，确保可见
  logger.info("API请求：租户数量趋势数据", { period, startDate, endDate, url });
  logger.debug("【API调用】fetchTenantTrendData", { period, startDate, endDate, url });
  
  try {
    const response = await http.request<ApiResponse<any>>("get", url);
    // 打印完整的API响应结构，便于调试
    logger.debug("API租户趋势数据完整响应:", JSON.stringify(response));
    logger.debug("【API响应】fetchTenantTrendData 成功", { 
      success: response.success,
      code: response.code,
      dataSize: JSON.stringify(response).length
    });
    
    // 确保响应正确并且没有被缓存
    if (response.success) {
      // 处理嵌套数据结构
      if (response.data && response.data.data) {
        logger.debug("检测到嵌套数据结构，正在提取内层数据");
        // 深拷贝数据，避免引用问题
        const extractedData = JSON.parse(JSON.stringify(response.data.data));
        response.data = extractedData;
      }
      
      logger.debug("租户数量趋势数据响应", { 
        labels: response.data?.labels,
        dataPoints: response.data?.datasets?.[0]?.data,
        period
      });
      
      // 直接打印到控制台，确保可见
      logger.info("API响应（已处理）：租户数量趋势数据成功", { 
        success: response.success,
        code: response.code,
        labels: response.data?.labels?.length,
        data: response.data
      });
      
      return response;
    } else {
      logger.warn("租户趋势数据请求失败", { 
        code: response.code, 
        message: response.message 
      });
      logger.debug("【API响应】fetchTenantTrendData 失败", { 
        code: response.code, 
        message: response.message 
      });
      throw new Error(response.message || "获取数据失败");
    }
  } catch (error) {
    logger.error("获取租户数量趋势数据失败", error);
    // 直接打印到控制台，确保可见
    logger.error("API错误：租户数量趋势数据请求失败", error);
    logger.debug("【API错误】fetchTenantTrendData", error);
    throw error;
  }
}

/**
 * 获取租户状态分布数据
 */
export async function fetchTenantStatusDistribution() {
  logger.debug("请求租户状态分布数据");
  logger.debug("【API调用】fetchTenantStatusDistribution");
  
  try {
    const response = await http.request<ApiResponse<any>>(
      "get", 
      "/admin/charts/tenant-status-distribution/"
    );
    
    // 打印完整的API响应结构，便于调试
    logger.debug("API租户状态分布完整响应:", JSON.stringify(response));
    logger.debug("【API响应】fetchTenantStatusDistribution 成功", { 
      success: response.success,
      code: response.code,
      dataSize: JSON.stringify(response).length
    });
    
    if (response.success) {
      // 处理嵌套数据结构
      if (response.data && response.data.data) {
        logger.debug("检测到嵌套数据结构，正在提取内层数据");
        // 深拷贝数据，避免引用问题
        const extractedData = JSON.parse(JSON.stringify(response.data.data));
        response.data = extractedData;
      }
      
      logger.debug("租户状态分布数据响应", { 
        labels: response.data?.labels,
        data: response.data?.datasets?.[0]?.data
      });
      
      // 直接打印到控制台，确保可见
      logger.info("API响应（已处理）：租户状态分布数据成功", {
        success: response.success,
        code: response.code,
        labels: response.data?.labels?.length,
        data: response.data
      });
      
      return response;
    } else {
      logger.warn("租户状态分布数据请求失败", { 
        code: response.code, 
        message: response.message 
      });
      logger.debug("【API响应】fetchTenantStatusDistribution 失败", { 
        code: response.code, 
        message: response.message 
      });
      throw new Error(response.message || "获取数据失败");
    }
  } catch (error) {
    logger.error("获取租户状态分布数据失败", error);
    logger.debug("【API错误】fetchTenantStatusDistribution", error);
    throw error;
  }
}

/**
 * 获取租户创建速率数据
 * @param period 时间周期(daily/weekly/monthly/quarterly/yearly)
 * @param startDate 开始日期(YYYY-MM-DD)
 * @param endDate 结束日期(YYYY-MM-DD)
 */
export async function fetchTenantCreationRate(
  period: ChartPeriod = 'monthly', 
  startDate?: string, 
  endDate?: string
) {
  let url = `/admin/charts/tenant-creation-rate/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  logger.debug("请求租户创建速率数据", { period, startDate, endDate });
  logger.debug("【API调用】fetchTenantCreationRate", { period, startDate, endDate, url });
  
  try {
    const response = await http.request<ApiResponse<any>>("get", url);
    
    // 打印完整的API响应结构，便于调试
    logger.debug("API租户创建速率完整响应:", JSON.stringify(response));
    logger.debug("【API响应】fetchTenantCreationRate 成功", { 
      success: response.success,
      code: response.code,
      dataSize: JSON.stringify(response).length
    });
    
    if (response.success) {
      // 处理嵌套数据结构
      if (response.data && response.data.data) {
        logger.debug("检测到嵌套数据结构，正在提取内层数据");
        // 深拷贝数据，避免引用问题
        const extractedData = JSON.parse(JSON.stringify(response.data.data));
        response.data = extractedData;
      }
      
      logger.debug("租户创建速率数据响应", { 
        labels: response.data?.labels,
        dataPoints: response.data?.datasets?.[0]?.data,
        period
      });
      
      // 直接打印到控制台，确保可见
      logger.info("API响应（已处理）：租户创建速率数据成功", {
        success: response.success,
        code: response.code,
        labels: response.data?.labels?.length,
        data: response.data
      });
      
      return response;
    } else {
      logger.warn("租户创建速率数据请求失败", { 
        code: response.code, 
        message: response.message 
      });
      logger.debug("【API响应】fetchTenantCreationRate 失败", { 
        code: response.code, 
        message: response.message 
      });
      throw new Error(response.message || "获取数据失败");
    }
  } catch (error) {
    logger.error("获取租户创建速率数据失败", error);
    logger.debug("【API错误】fetchTenantCreationRate", error);
    throw error;
  }
}

/**
 * 计算租户汇总数据
 * 从趋势数据中提取关键指标
 * @param trendData 租户趋势数据
 */
export function calculateTenantSummary(trendData: TenantChartData) {
  logger.debug("计算租户汇总数据", { trendData });
  // 直接打印到控制台，确保可见
  logger.info("计算租户汇总数据", { 
    hasData: !!trendData && !!trendData.datasets && !!trendData.datasets[0],
    labels: trendData?.labels,
    datasets: trendData?.datasets
  });
  
  if (!trendData || !trendData.datasets || !trendData.datasets[0] || !trendData.datasets[0].data.length) {
    logger.warn("租户趋势数据为空或格式不正确");
    logger.info("警告：租户趋势数据为空或格式不正确", trendData);
    return {
      total: 0,
      growthRate: 0,
      avgGrowth: 0
    };
  }

  const data = trendData.datasets[0].data;
  
  // 获取最新租户总数
  const total = data[data.length - 1];
  
  // 计算增长率（相对于第一个数据点）
  let growthRate = 0;
  if (data.length > 1 && data[0] > 0) {
    growthRate = Number(((total - data[0]) / data[0] * 100).toFixed(2));
  }
  
  // 计算平均增长
  let avgGrowth = 0;
  if (data.length > 1) {
    const growth = total - data[0];
    avgGrowth = Number((growth / (data.length - 1)).toFixed(2));
  }
  
  const result = {
    total,
    growthRate,
    avgGrowth
  };
  
  logger.debug("租户汇总数据计算结果", result);
  // 直接打印到控制台，确保可见
  logger.info("租户汇总数据计算结果", result);
  
  return result;
} 
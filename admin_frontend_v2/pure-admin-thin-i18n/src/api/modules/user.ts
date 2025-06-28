import { http } from "@/utils/http";
import type { ApiResponse } from "@/types/api";
import type {
  UserGrowthData,
  UserRoleData,
  ActiveUsersData,
  LoginHeatmapData,
  UserSummary,
  ChartPeriod
} from "@/types/user";
import logger from "@/utils/logger";

/**
 * 格式化图表数据，确保格式一致性
 */
export function formatChartData(data: any): any {
  // 检查数据是否存在
  if (!data) {
    logger.debug("图表数据为空，返回空数据结构");
    return { hasData: false, labels: [], datasets: [] };
  }

  // 处理可能嵌套的数据结构
  const chartData = data.data || data;

  const formattedData = {
    hasData: !!(
      chartData.labels &&
      chartData.datasets &&
      chartData.labels.length > 0
    ),
    labels: chartData.labels || [],
    datasets: chartData.datasets || [],
    summary: chartData.summary || {}
  };

  logger.debug("图表数据格式化结果:", JSON.parse(JSON.stringify(formattedData)));

  return formattedData;
}

/**
 * 获取用户总量与增长趋势数据
 * @param period 时间周期(daily/weekly/monthly/quarterly/yearly)
 * @param startDate 开始日期(YYYY-MM-DD)
 * @param endDate 结束日期(YYYY-MM-DD)
 */
export async function fetchUserGrowthTrend(
  period: ChartPeriod = "monthly",
  startDate?: string,
  endDate?: string
) {
  let url = `/admin/charts/user-growth-trend/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;

  logger.debug("请求用户增长趋势数据", { period, startDate, endDate });
  logger.debug("【API调用】fetchUserGrowthTrend", {
    period,
    startDate,
    endDate,
    url
  });

  try {
    const response = await http.request<ApiResponse<UserGrowthData>>(
      "get",
      url
    );
    logger.debug("【API响应】fetchUserGrowthTrend 成功", {
      success: response.success,
      code: response.code,
      dataSize: JSON.stringify(response).length
    });

    if (response.success) {
      logger.debug("用户增长趋势数据响应", {
        labels: response.data?.labels,
        dataPoints: response.data?.datasets?.[0]?.data,
        period
      });
      return response;
    } else {
      logger.warn("用户增长趋势数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || "获取数据失败");
    }
  } catch (error) {
    logger.error("获取用户增长趋势数据失败", error);
    logger.error("【API错误】fetchUserGrowthTrend", error);
    throw error;
  }
}

/**
 * 获取用户角色分布数据
 */
export async function fetchUserRoleDistribution() {
  logger.debug("请求用户角色分布数据");
  logger.debug("【API调用】fetchUserRoleDistribution");

  try {
    const response = await http.request<ApiResponse<UserRoleData>>(
      "get",
      "/admin/charts/user-role-distribution/"
    );

    logger.debug("【API响应】fetchUserRoleDistribution 成功", {
      success: response.success,
      code: response.code
    });

    if (response.success) {
      logger.debug("用户角色分布数据响应", {
        labels: response.data?.labels,
        data: response.data?.datasets?.[0]?.data
      });
      return response;
    } else {
      logger.warn("用户角色分布数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || "获取数据失败");
    }
  } catch (error) {
    logger.error("获取用户角色分布数据失败", error);
    logger.error("【API错误】fetchUserRoleDistribution", error);
    throw error;
  }
}

/**
 * 获取活跃用户统计数据
 * @param period 时间周期(daily/weekly/monthly)
 * @param startDate 开始日期(YYYY-MM-DD)
 * @param endDate 结束日期(YYYY-MM-DD)
 */
export async function fetchActiveUsers(
  period: ChartPeriod = "daily",
  startDate?: string,
  endDate?: string
) {
  let url = `/admin/charts/active-users/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;

  logger.debug("请求活跃用户统计数据", { period, startDate, endDate });
  logger.debug("【API调用】fetchActiveUsers", {
    period,
    startDate,
    endDate,
    url
  });

  try {
    const response = await http.request<ApiResponse<ActiveUsersData>>(
      "get",
      url
    );

    logger.debug("【API响应】fetchActiveUsers 成功", {
      success: response.success,
      code: response.code
    });

    if (response.success) {
      logger.debug("活跃用户统计数据响应", {
        labels: response.data?.labels,
        dataPoints: response.data?.datasets?.[0]?.data,
        period
      });
      return response;
    } else {
      logger.warn("活跃用户统计数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || "获取数据失败");
    }
  } catch (error) {
    logger.error("获取活跃用户统计数据失败", error);
    logger.error("【API错误】fetchActiveUsers", error);
    throw error;
  }
}

/**
 * 获取用户登录热力图数据
 * @param startDate 开始日期(YYYY-MM-DD)
 * @param endDate 结束日期(YYYY-MM-DD)
 */
export async function fetchLoginHeatmap(startDate?: string, endDate?: string) {
  let url = `/admin/charts/login-heatmap/`;
  if (startDate) url += `?start_date=${startDate}`;
  if (endDate) url += `${startDate ? "&" : "?"}end_date=${endDate}`;

  logger.debug("请求用户登录热力图数据", { startDate, endDate });
  logger.debug("【API调用】fetchLoginHeatmap", { startDate, endDate, url });

  try {
    const response = await http.request<ApiResponse<LoginHeatmapData>>(
      "get",
      url
    );

    logger.debug("【API响应】fetchLoginHeatmap 成功", {
      success: response.success,
      code: response.code
    });

    if (response.success) {
      logger.debug("用户登录热力图数据响应", {
        xLabels: response.data?.x_labels,
        yLabels: response.data?.y_labels,
        dataPoints: response.data?.dataset?.length
      });
      return response;
    } else {
      logger.warn("用户登录热力图数据请求失败", {
        code: response.code,
        message: response.message
      });
      throw new Error(response.message || "获取数据失败");
    }
  } catch (error) {
    logger.error("获取用户登录热力图数据失败", error);
    logger.error("【API错误】fetchLoginHeatmap", error);
    throw error;
  }
}

/**
 * 计算用户汇总数据
 * 从趋势数据中提取关键指标
 * @param growthData 用户增长趋势数据
 * @param activeData 活跃用户统计数据
 */
export function calculateUserSummary(
  growthData: any,
  activeData?: any
): UserSummary {
  logger.debug("计算用户汇总数据", { growthData, activeData });

  const summary: UserSummary = {
    totalUsers: 0,
    growthRate: 0,
    avgGrowth: 0,
    activeRate: 0
  };

  // 从用户增长趋势数据中提取信息
  if (growthData?.summary) {
    summary.totalUsers = growthData.summary.total_users || 0;
    summary.growthRate = growthData.summary.growth_rate || 0;
    summary.avgGrowth = growthData.summary.average_monthly_growth || 0;
  }

  // 从活跃用户统计数据中提取信息
  if (activeData?.summary) {
    summary.activeRate = activeData.summary.average_active_rate || 0;
  }

  return summary;
}

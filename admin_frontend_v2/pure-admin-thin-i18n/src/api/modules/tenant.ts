import { http } from "@/utils/http";
import type { ApiResponse } from "@/types/api";
import type { 
  TenantChartData, 
  TenantStatusData, 
  TenantCreationData, 
  ChartPeriod 
} from "@/types/tenant";

/**
 * 获取租户数量趋势数据
 * @param period 时间周期(daily/weekly/monthly/quarterly/yearly)
 * @param startDate 开始日期(YYYY-MM-DD)
 * @param endDate 结束日期(YYYY-MM-DD)
 */
export function fetchTenantTrendData(
  period: ChartPeriod = 'monthly', 
  startDate?: string, 
  endDate?: string
) {
  let url = `/admin/charts/tenant-trend/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  return http.request<ApiResponse<TenantChartData>>("get", url);
}

/**
 * 获取租户状态分布数据
 */
export function fetchTenantStatusDistribution() {
  return http.request<ApiResponse<TenantStatusData>>(
    "get", 
    "/admin/charts/tenant-status-distribution/"
  );
}

/**
 * 获取租户创建速率数据
 * @param period 时间周期(daily/weekly/monthly/quarterly/yearly)
 * @param startDate 开始日期(YYYY-MM-DD)
 * @param endDate 结束日期(YYYY-MM-DD)
 */
export function fetchTenantCreationRate(
  period: ChartPeriod = 'monthly', 
  startDate?: string, 
  endDate?: string
) {
  let url = `/admin/charts/tenant-creation-rate/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  return http.request<ApiResponse<TenantCreationData>>("get", url);
}

/**
 * 计算租户汇总数据
 * 从趋势数据中提取关键指标
 * @param trendData 租户趋势数据
 */
export function calculateTenantSummary(trendData: TenantChartData) {
  if (!trendData || !trendData.datasets || !trendData.datasets[0] || !trendData.datasets[0].data.length) {
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
  
  return {
    total,
    growthRate,
    avgGrowth
  };
} 
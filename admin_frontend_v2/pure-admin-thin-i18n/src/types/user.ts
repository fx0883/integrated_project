/**
 * 用户统计图表相关类型定义
 */

// 引入共享类型
import { ChartPeriod } from "@/types/tenant";

// 图表数据集接口
export interface ChartDataset {
  label: string;        // 数据集标签
  data: number[];       // 数据值数组
  color?: string;       // 单一颜色
  colors?: string[];    // 多颜色数组
  yAxisID?: string;     // Y轴ID（用于双Y轴图表）
}

// 基础图表数据接口
export interface BaseChartData {
  chart_type: string;   // 图表类型
  title: string;        // 图表标题
  description: string;  // 图表描述
  labels: string[];     // X轴标签
  datasets: ChartDataset[];  // 数据集
  summary?: any;        // 汇总数据
}

// 用户增长趋势数据接口
export interface UserGrowthData extends BaseChartData {
  summary: {
    total_users: number;
    growth_rate: number;
    average_monthly_growth: number;
  }
}

// 用户角色分布数据接口
export interface UserRoleData extends BaseChartData {
  summary: {
    total_users: number;
    super_admin_percentage: number;
    tenant_admin_percentage: number;
    regular_user_percentage: number;
  }
}

// 活跃用户统计数据接口
export interface ActiveUsersData extends BaseChartData {
  summary: {
    average_active_users: number;
    highest_active_day: string;
    highest_active_count: number;
    average_active_rate: number;
  }
}

// 用户登录热力图数据接口
export interface LoginHeatmapData {
  chart_type: string;   // 图表类型
  title: string;        // 图表标题
  description: string;  // 图表描述
  x_labels: string[];   // X轴标签（星期几）
  y_labels: string[];   // Y轴标签（小时）
  dataset: [number, number, number][]; // 热力图数据点 [x, y, value]
  summary: {
    total_logins: number;
    peak_hour: string;
    peak_hour_count: number;
    lowest_hour: string;
    lowest_hour_count: number;
  }
}

// 用户统计汇总数据接口
export interface UserSummary {
  totalUsers: number;
  growthRate: number;
  avgGrowth: number;
  activeRate: number;
}

// 导出ChartPeriod类型，保持与tenant.ts一致
export { ChartPeriod };

// 用户图表请求参数接口
export interface UserChartParams {
  period?: ChartPeriod;   // 时间周期
  start_date?: string;    // 开始日期
  end_date?: string;      // 结束日期
} 
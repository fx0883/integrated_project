/**
 * 租户图表相关类型定义
 */

// 图表数据集接口
export interface ChartDataset {
  label: string;        // 数据集标签
  data: number[];       // 数据值数组
  color?: string;       // 单一颜色（折线图、柱状图）
  colors?: string[];    // 多颜色数组（饼图）
}

// 租户趋势图数据接口
export interface TenantChartData {
  labels: string[];     // X轴标签（如日期）
  datasets: ChartDataset[];  // 数据集
}

// 租户状态分布数据接口
export interface TenantStatusData {
  labels: string[];     // 状态名称
  datasets: ChartDataset[];  // 数据集
}

// 租户创建速率数据接口
export interface TenantCreationData {
  labels: string[];     // X轴标签（如日期）
  datasets: ChartDataset[];  // 数据集
}

// 租户汇总数据接口
export interface TenantSummary {
  total: number;        // 租户总数
  growthRate: number;   // 增长率
  avgGrowth: number;    // 平均增长
}

// 图表周期类型
export type ChartPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// 租户图表请求参数接口
export interface TenantChartParams {
  period?: ChartPeriod;   // 时间周期
  start_date?: string;    // 开始日期
  end_date?: string;      // 结束日期
} 
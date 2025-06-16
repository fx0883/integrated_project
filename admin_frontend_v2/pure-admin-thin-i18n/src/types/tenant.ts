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

/**
 * 租户管理相关类型定义
 */

// 租户状态类型
export type TenantStatus = 'active' | 'suspended' | 'deleted';

// 租户基本信息接口
export interface Tenant {
  id: number;            // 租户ID
  name: string;          // 租户名称
  status: TenantStatus;  // 租户状态
  contact_name: string;  // 联系人姓名
  contact_email: string; // 联系人邮箱
  contact_phone: string; // 联系人电话
  created_at: string;    // 创建时间
  updated_at: string;    // 更新时间
  user_count?: number;   // 用户数量(可选，仅在详情中返回)
  admin_count?: number;  // 管理员数量(可选，仅在详情中返回)
}

// 租户列表请求参数接口
export interface TenantListParams {
  search?: string;       // 搜索关键词
  status?: string;       // 状态过滤
  page?: number;         // 页码
  page_size?: number;    // 每页条数
}

// 创建/更新租户请求参数接口
export interface TenantCreateUpdateParams {
  name: string;           // 租户名称
  status?: TenantStatus;  // 租户状态
  contact_name?: string;  // 联系人姓名
  contact_email?: string; // 联系人邮箱
  contact_phone?: string; // 联系人电话
}

// 租户配额接口
export interface TenantQuota {
  id: number;             // 配额ID
  tenant: {               // 所属租户
    id: number;
    name: string;
  };
  max_users: number;      // 最大用户数
  max_admins: number;     // 最大管理员数
  max_storage_mb: number; // 最大存储空间(MB)
  max_products: number;   // 最大产品数
  current_storage_used_mb?: number; // 当前已使用存储空间(MB)
  created_at: string;     // 创建时间
  updated_at: string;     // 更新时间
}

// 创建/更新租户配额请求参数接口
export interface TenantQuotaUpdateParams {
  max_users: number;      // 最大用户数
  max_admins: number;     // 最大管理员数
  max_storage_mb: number; // 最大存储空间(MB)
  max_products: number;   // 最大产品数
}

// 租户用户接口
export interface TenantUser {
  id: number;            // 用户ID
  username: string;      // 用户名
  email: string;         // 邮箱
  nick_name: string;     // 昵称
  is_active: boolean;    // 是否激活
  is_admin: boolean;     // 是否管理员
  status: string;        // 状态
  date_joined: string;   // 加入时间
}

// 租户用户列表请求参数接口
export interface TenantUserListParams {
  search?: string;       // 搜索关键词
  is_admin?: boolean;    // 是否管理员
  is_active?: boolean;   // 是否激活
  page?: number;         // 页码
  page_size?: number;    // 每页条数
} 
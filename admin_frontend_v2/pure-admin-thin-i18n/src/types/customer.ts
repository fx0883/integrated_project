/**
 * 客户管理相关类型定义
 */

// 客户类型
export type CustomerType =
  | "enterprise"
  | "government"
  | "education"
  | "nonprofit"
  | "individual";

// 客户价值等级
export type CustomerValueLevel = "platinum" | "gold" | "silver" | "bronze";

// 客户状态
export type CustomerStatus = "active" | "inactive" | "prospect" | "lost";

// 客户基本信息接口
export interface Customer {
  id: number; // 客户ID
  name: string; // 客户名称
  type: CustomerType; // 客户类型
  value_level: CustomerValueLevel; // 客户价值等级
  status: CustomerStatus; // 客户状态
  industry: string; // 所属行业
  registration_number?: string; // 注册号（企业客户）
  tax_id?: string; // 税号（企业客户）
  address?: string; // 地址
  city?: string; // 城市
  province?: string; // 省份
  postal_code?: string; // 邮政编码
  country?: string; // 国家
  website?: string; // 网站
  description?: string; // 描述
  annual_revenue?: number; // 年收入
  employee_count?: number; // 员工数量
  founded_year?: number; // 成立年份
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  member_count?: number; // 联系人数量（可选，仅在详情中返回）
  tenant_count?: number; // 关联租户数量（可选，仅在详情中返回）
}

// 客户列表请求参数接口
export interface CustomerListParams {
  search?: string; // 搜索关键词
  type?: CustomerType; // 客户类型过滤
  value_level?: CustomerValueLevel; // 客户价值等级过滤
  status?: CustomerStatus; // 客户状态过滤
  industry?: string; // 行业过滤
  page?: number; // 页码
  page_size?: number; // 每页条数
  sort_by?: string; // 排序字段
  sort_order?: "asc" | "desc"; // 排序方向
}

// 创建/更新客户请求参数接口
export interface CustomerCreateUpdateParams {
  name: string; // 客户名称
  type: CustomerType; // 客户类型
  value_level?: CustomerValueLevel; // 客户价值等级
  status?: CustomerStatus; // 客户状态
  industry?: string; // 所属行业
  registration_number?: string; // 注册号（企业客户）
  tax_id?: string; // 税号（企业客户）
  address?: string; // 地址
  city?: string; // 城市
  province?: string; // 省份
  postal_code?: string; // 邮政编码
  country?: string; // 国家
  website?: string; // 网站
  description?: string; // 描述
  annual_revenue?: number; // 年收入
  employee_count?: number; // 员工数量
  founded_year?: number; // 成立年份
}

// 客户-联系人关系接口
export interface CustomerMemberRelation {
  id: number; // 关系ID
  customer: {
    // 所属客户
    id: number;
    name: string;
  };
  member: {
    // 联系人信息
    id: number;
    name: string;
    email: string;
    phone?: string;
    position?: string;
  };
  role: string; // 联系人角色
  is_primary: boolean; // 是否主要联系人
  remarks?: string; // 备注
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 客户-联系人关系请求参数接口
export interface CustomerMemberRelationCreateUpdateParams {
  customer_id: number; // 客户ID
  member_id: number; // 联系人ID
  role: string; // 联系人角色
  is_primary?: boolean; // 是否主要联系人
  remarks?: string; // 备注
}

// 客户-租户关系接口
export interface CustomerTenantRelation {
  id: number; // 关系ID
  customer: {
    // 所属客户
    id: number;
    name: string;
  };
  tenant: {
    // 租户信息
    id: number;
    name: string;
    status: string;
  };
  relation_type: string; // 关系类型
  is_primary: boolean; // 是否主要关系
  start_date?: string; // 关系开始日期
  end_date?: string; // 关系结束日期
  contract_id?: string; // 合同编号
  notes?: string; // 备注
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 客户-租户关系请求参数接口
export interface CustomerTenantRelationCreateUpdateParams {
  customer_id: number; // 客户ID
  tenant_id: number; // 租户ID
  relation_type: string; // 关系类型
  is_primary?: boolean; // 是否主要关系
  start_date?: string; // 关系开始日期
  end_date?: string; // 关系结束日期
  contract_id?: string; // 合同编号
  notes?: string; // 备注
}

// 批量操作请求参数接口
export interface CustomerBulkOperationParams {
  customer_ids: number[]; // 客户ID数组
  operation_type: "create" | "update" | "delete"; // 操作类型
  data?: Partial<CustomerCreateUpdateParams>; // 更新数据（仅在update操作时需要）
}

// 批量操作响应接口
export interface CustomerBulkOperationResponse {
  success_count: number; // 成功处理的记录数
  failed_count: number; // 失败的记录数
  failed_ids?: number[]; // 失败的客户ID数组
  error_messages?: Record<string, string>; // 错误信息，键为客户ID
}

// 客户图表数据集接口
export interface CustomerChartDataset {
  label: string; // 数据集标签
  data: number[]; // 数据值数组
  color?: string; // 单一颜色
  colors?: string[]; // 多颜色数组
}

// 客户统计数据接口
export interface CustomerStatistics {
  total: number; // 客户总数
  active_count: number; // 活跃客户数
  inactive_count: number; // 非活跃客户数
  prospect_count: number; // 潜在客户数
  churned_count: number; // 流失客户数
  by_type: Record<CustomerType, number>; // 按类型统计
  by_value: Record<CustomerValueLevel, number>; // 按价值等级统计
  by_industry: Record<string, number>; // 按行业统计
}

// 客户搜索结果接口
export interface CustomerSearchResult {
  id: number; // 客户ID
  name: string; // 客户名称
  type: CustomerType; // 客户类型
  value_level: CustomerValueLevel; // 客户价值等级
  status: CustomerStatus; // 客户状态
  industry?: string; // 所属行业
  highlight?: {
    // 高亮信息
    name?: string[]; // 高亮的名称片段
    description?: string[]; // 高亮的描述片段
  };
}

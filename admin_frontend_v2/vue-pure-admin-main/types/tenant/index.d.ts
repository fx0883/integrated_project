// 租户管理相关类型定义

// 租户信息接口
export interface Tenant {
  id: number;
  name: string;
  description?: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
  user_count: number;
  admin_name?: string;
  admin_email?: string;
  logo?: string;
  expiration_date?: string;
}

// 租户列表项接口
export interface TenantListItem extends Tenant {
  // 列表特有字段可以在这里添加
}

// 租户详情接口
export interface TenantDetail extends Tenant {
  quota?: TenantQuota;
  usage?: TenantQuotaUsage;
}

// 租户配额接口
export interface TenantQuota {
  id: number;
  tenant_id: number;
  max_users: number;
  max_storage: number; // 单位MB
  max_articles: number;
  max_checks: number;
  created_at: string;
  updated_at: string;
}

// 租户配额使用情况接口
export interface TenantQuotaUsage {
  tenant_id: number;
  user_count: number;
  storage_used: number; // 单位MB
  article_count: number;
  check_count: number;
  updated_at: string;
}

// 租户状态接口
export interface TenantState {
  tenants: TenantListItem[];
  total: number;
  loading: boolean;
  currentTenant: TenantDetail | null;
}

// 租户列表查询参数
export interface TenantListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 租户列表响应
export interface TenantListResult {
  success: boolean;
  data: {
    list: TenantListItem[];
    total: number;
  };
}

// 租户详情响应
export interface TenantDetailResult {
  success: boolean;
  data: TenantDetail;
}

// 租户创建请求
export interface TenantCreateRequest {
  name: string;
  description?: string;
  admin_email?: string;
  admin_name?: string;
  logo?: string;
  status?: "active" | "inactive";
  max_users?: number;
  max_storage?: number;
  max_articles?: number;
  max_checks?: number;
}

// 租户更新请求
export interface TenantUpdateRequest {
  name?: string;
  description?: string;
  status?: "active" | "inactive" | "suspended";
  logo?: string;
  admin_email?: string;
  admin_name?: string;
  expiration_date?: string;
}

// 租户配额更新请求
export interface TenantQuotaUpdateRequest {
  max_users?: number;
  max_storage?: number;
  max_articles?: number;
  max_checks?: number;
} 
import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Tenant,
  TenantQuota,
  TenantUser,
  TenantListParams,
  TenantCreateUpdateParams,
  TenantQuotaUpdateParams,
  TenantUserListParams
} from "@/types/tenant";
import logger from "@/utils/logger";

/**
 * 获取租户列表
 */
export function getTenantList(params: TenantListParams = {}) {
  logger.debug("API请求: 获取租户列表", params);
  
  return http.request<PaginationResponse<Tenant>>(
    "get",
    "/tenants/",
    { params }
  );
}

/**
 * 创建租户
 */
export function createTenant(data: TenantCreateUpdateParams) {
  logger.debug("API请求: 创建租户", data);
  
  return http.request<ApiResponse<Tenant>>(
    "post",
    "/tenants/",
    { data }
  );
}

/**
 * 获取租户详情
 */
export function getTenantDetail(id: number) {
  logger.debug("API请求: 获取租户详情", { id });
  
  return http.request<ApiResponse<Tenant>>(
    "get",
    `/tenants/${id}/`
  );
}

/**
 * 获取租户综合信息
 */
export function getTenantComprehensive(id: number) {
  logger.debug("API请求: 获取租户综合信息", { id });
  
  return http.request<ApiResponse<Tenant>>(
    "get",
    `/tenants/${id}/comprehensive/`
  );
}

/**
 * 更新租户信息
 */
export function updateTenant(id: number, data: TenantCreateUpdateParams) {
  logger.debug("API请求: 更新租户信息", { id, data });
  
  return http.request<ApiResponse<Tenant>>(
    "put",
    `/tenants/${id}/`,
    { data }
  );
}

/**
 * 删除租户
 */
export function deleteTenant(id: number) {
  logger.debug("API请求: 删除租户", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/tenants/${id}/`
  );
}

/**
 * 暂停租户
 */
export function suspendTenant(id: number) {
  logger.debug("API请求: 暂停租户", { id });
  
  return http.request<ApiResponse<Tenant>>(
    "post",
    `/tenants/${id}/suspend/`
  );
}

/**
 * 激活租户
 */
export function activateTenant(id: number) {
  logger.debug("API请求: 激活租户", { id });
  
  return http.request<ApiResponse<Tenant>>(
    "post",
    `/tenants/${id}/activate/`
  );
}

/**
 * 获取租户配额
 */
export function getTenantQuota(id: number) {
  logger.debug("API请求: 获取租户配额", { id });
  
  return http.request<ApiResponse<TenantQuota>>(
    "get",
    `/tenants/${id}/quota/`
  );
}

/**
 * 更新租户配额
 */
export function updateTenantQuota(id: number, data: TenantQuotaUpdateParams) {
  logger.debug("API请求: 更新租户配额", { id, data });
  
  return http.request<ApiResponse<TenantQuota>>(
    "put",
    `/tenants/${id}/quota/`,
    { data }
  );
}

/**
 * 获取租户配额使用情况
 */
export function getTenantQuotaUsage(id: number) {
  logger.debug("API请求: 获取租户配额使用情况", { id });
  
  return http.request<ApiResponse<TenantQuota>>(
    "get",
    `/tenants/${id}/quota/usage/`
  );
}

/**
 * 获取租户用户列表
 */
export function getTenantUsers(id: number, params: TenantUserListParams = {}) {
  logger.debug("API请求: 获取租户用户列表", { id, params });
  
  return http.request<PaginationResponse<TenantUser>>(
    "get",
    `/tenants/${id}/users/`,
    { params }
  );
} 
import { http } from "@/utils/http";
import type { 
  TenantListResult, 
  TenantDetailResult, 
  TenantListParams, 
  TenantCreateRequest, 
  TenantUpdateRequest, 
  TenantQuotaUpdateRequest 
} from "../../types/tenant";
import type { ApiResult } from "../../types/user";

/** 获取租户列表 */
export const getTenants = (params?: TenantListParams) => {
  return http.request<TenantListResult>("get", "/tenants/", { params });
};

/** 获取租户详情 */
export const getTenantById = (id: number) => {
  return http.request<TenantDetailResult>("get", `/tenants/${id}/`);
};

/** 创建租户 */
export const createTenant = (data: TenantCreateRequest) => {
  return http.request<ApiResult>("post", "/tenants/", { data });
};

/** 更新租户 */
export const updateTenant = (id: number, data: TenantUpdateRequest) => {
  return http.request<ApiResult>("put", `/tenants/${id}/`, { data });
};

/** 删除租户 */
export const deleteTenant = (id: number) => {
  return http.request<ApiResult>("delete", `/tenants/${id}/`);
};

/** 获取租户配额 */
export const getTenantQuota = (id: number) => {
  return http.request<ApiResult>("get", `/tenants/${id}/quota/`);
};

/** 更新租户配额 */
export const updateTenantQuota = (id: number, data: TenantQuotaUpdateRequest) => {
  return http.request<ApiResult>("put", `/tenants/${id}/quota/`, { data });
};

/** 获取租户配额使用情况 */
export const getTenantQuotaUsage = (id: number) => {
  return http.request<ApiResult>("get", `/tenants/${id}/quota/usage/`);
};

/** 获取租户用户列表 */
export const getTenantUsers = (id: number, params?: object) => {
  return http.request<ApiResult>("get", `/tenants/${id}/users/`, { params });
};

/** 暂停租户 */
export const suspendTenant = (id: number) => {
  return http.request<ApiResult>("post", `/tenants/${id}/suspend/`);
};

/** 激活租户 */
export const activateTenant = (id: number) => {
  return http.request<ApiResult>("post", `/tenants/${id}/activate/`);
}; 
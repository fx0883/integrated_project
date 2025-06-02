import { http } from "@/utils/http";
import { formatResponse, handleResponse } from "@/utils/http/response";
import { ApiResult } from "/#/user";
import type { 
  SuperAdminDashboard, 
  TenantAdminDashboard, 
  UserDashboard,
  SystemOverview,
  TenantStatistics,
  UserActivityItem,
  ContentStatisticsItem,
  CheckInCompletionItem
} from "/#/dashboard";

/**
 * 获取超级管理员仪表盘数据
 */
export const getSuperAdminDashboard = () => {
  return http.request<ApiResult<SuperAdminDashboard>>("get", "/api/dashboard/super-admin");
};

/**
 * 获取租户管理员仪表盘数据
 */
export const getTenantAdminDashboard = (tenant_id?: number) => {
  return http.request<ApiResult<TenantAdminDashboard>>("get", "/api/dashboard/tenant-admin", { params: { tenant_id } });
};

/**
 * 获取普通用户仪表盘数据
 */
export const getUserDashboard = () => {
  return http.request<ApiResult<UserDashboard>>("get", "/api/dashboard/user");
};

/**
 * 获取系统概况数据
 */
export const getSystemOverview = () => {
  return http.request<ApiResult<SystemOverview>>("get", "/api/dashboard/system-overview");
};

/**
 * 获取租户统计数据
 */
export const getTenantStatistics = () => {
  return http.request<ApiResult<TenantStatistics[]>>("get", "/api/dashboard/tenant-statistics");
};

/**
 * 获取用户活跃度数据
 */
export const getUserActivity = (params?: any) => {
  return http.request<ApiResult<UserActivityItem[]>>("get", "/api/dashboard/user-activity", { params });
};

/**
 * 获取内容统计数据
 */
export const getContentStatistics = (params?: any) => {
  return http.request<ApiResult<ContentStatisticsItem[]>>("get", "/api/dashboard/content-statistics", { params });
};

/**
 * 获取打卡完成率数据
 */
export const getCheckInCompletion = (params?: any) => {
  return http.request<ApiResult<CheckInCompletionItem[]>>("get", "/api/dashboard/check-in-completion", { params });
}; 
import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  AdminUser,
  AdminUserListParams,
  AdminUserCreateParams,
  AdminUserUpdateParams,
  ResetPasswordParams
} from "@/types/adminUser";
import logger from "@/utils/logger";

/**
 * 获取管理员用户列表
 */
export function getAdminUserList(params: AdminUserListParams = {}) {
  logger.debug("API请求: 获取管理员用户列表", params);
  
  return http.request<PaginationResponse<AdminUser>>(
    "get",
    "/admin-users/",
    { params }
  );
}

/**
 * 创建管理员用户
 */
export function createAdminUser(data: AdminUserCreateParams) {
  logger.debug("API请求: 创建管理员用户", data);
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    "/admin-users/",
    { data }
  );
}

/**
 * 获取管理员用户详情
 */
export function getAdminUserDetail(id: number) {
  logger.debug("API请求: 获取管理员用户详情", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "get",
    `/admin-users/${id}/`
  );
}

/**
 * 更新管理员用户信息
 */
export function updateAdminUser(id: number, data: AdminUserUpdateParams) {
  logger.debug("API请求: 更新管理员用户信息", { id, data });
  
  return http.request<ApiResponse<AdminUser>>(
    "put",
    `/admin-users/${id}/`,
    { data }
  );
}

/**
 * 删除管理员用户
 */
export function deleteAdminUser(id: number) {
  logger.debug("API请求: 删除管理员用户", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/admin-users/${id}/`
  );
}

/**
 * 授予超级管理员权限
 */
export function grantSuperAdmin(id: number) {
  logger.debug("API请求: 授予超级管理员权限", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/grant-super-admin/`
  );
}

/**
 * 撤销超级管理员权限
 */
export function revokeSuperAdmin(id: number, tenantId: number) {
  logger.debug("API请求: 撤销超级管理员权限", { id, tenantId });
  
  const requestData = { tenant_id: tenantId };
  logger.debug("发送请求数据", { requestData });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/revoke-super-admin/`,
    { data: requestData }
  );
}

/**
 * 创建超级管理员
 */
export function createSuperAdmin(data: AdminUserCreateParams) {
  logger.debug("API请求: 创建超级管理员", data);
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    "/admin-users/super-admin/create/",
    { data }
  );
}

/**
 * 上传管理员头像
 */
export function uploadAdminUserAvatar(id: number, formData: FormData) {
  logger.debug("API请求: 上传管理员头像", { id });
  
  return http.request<ApiResponse<{ avatar: string }>>(
    "post",
    `/admin-users/${id}/avatar/upload/`,
    { 
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 上传当前管理员头像
 */
export function uploadCurrentAdminAvatar(formData: FormData) {
  logger.debug("API请求: 上传当前管理员头像");
  
  return http.request<ApiResponse<{ avatar: string }>>(
    "post",
    "/admin-users/avatar/upload/",
    { 
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 重置管理员密码
 */
export function resetAdminUserPassword(id: number, data: ResetPasswordParams) {
  logger.debug("API请求: 重置管理员密码", { id });
  
  return http.request<ApiResponse<{ success: boolean }>>(
    "post",
    `/admin-users/${id}/reset-password/`,
    { data }
  );
}

/**
 * 激活管理员账号
 */
export function activateAdminUser(id: number) {
  logger.debug("API请求: 激活管理员账号", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/activate/`
  );
}

/**
 * 停用管理员账号
 */
export function deactivateAdminUser(id: number) {
  logger.debug("API请求: 停用管理员账号", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/deactivate/`
  );
}

/**
 * 获取当前登录的管理员信息
 */
export function getCurrentAdmin() {
  logger.debug("API请求: 获取当前登录管理员信息");
  
  return http.request<ApiResponse<AdminUser>>(
    "get",
    "/admin-users/me/"
  );
}

/**
 * 更新当前登录的管理员信息
 */
export function updateCurrentAdmin(data: AdminUserUpdateParams) {
  logger.debug("API请求: 更新当前登录管理员信息", data);
  
  return http.request<ApiResponse<AdminUser>>(
    "put",
    "/admin-users/me/",
    { data }
  );
} 
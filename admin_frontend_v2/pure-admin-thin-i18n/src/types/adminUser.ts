/**
 * 管理员用户相关类型定义
 */

/**
 * 管理员用户状态
 */
export type AdminUserStatus = 'active' | 'suspended' | 'inactive';

/**
 * 管理员用户角色
 */
export type AdminUserRole = 'super_admin' | 'tenant_admin';

/**
 * 管理员用户对象
 */
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  nick_name: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  avatar: string;
  tenant: number | null;
  tenant_name: string | null;
  is_admin: boolean;
  is_member: boolean;
  is_super_admin: boolean;
  role: string;
  status: AdminUserStatus;
  last_login_time: string | null;
  last_login_ip: string | null;
  date_joined: string;
}

/**
 * 管理员用户列表查询参数
 */
export interface AdminUserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: AdminUserStatus;
  is_super_admin?: boolean;
  tenant_id?: number;
}

/**
 * 创建管理员用户参数
 */
export interface AdminUserCreateParams {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  phone?: string;
  nick_name?: string;
  first_name?: string;
  last_name?: string;
  tenant_id?: number;
  is_active?: boolean;
  is_super_admin?: boolean;
}

/**
 * 更新管理员用户参数
 */
export interface AdminUserUpdateParams {
  email?: string;
  phone?: string;
  nick_name?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  status?: AdminUserStatus;
}

/**
 * 重置密码参数
 */
export interface ResetPasswordParams {
  password: string;
  password_confirm: string;
} 
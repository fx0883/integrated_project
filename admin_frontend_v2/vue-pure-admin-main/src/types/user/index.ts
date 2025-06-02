// 用户认证和管理相关类型定义

// 基本用户信息接口
export interface BasicUserInfo {
  id: number;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

// 扩展用户信息接口，包含管理权限字段
export interface UserInfo extends BasicUserInfo {
  is_admin: boolean;
  is_super_admin: boolean;
  status: "active" | "inactive";
  phone?: string;
  tenant_id?: number;
  tenant_name?: string;
  department?: string;
  position?: string;
  last_login?: string;
  role_ids?: number[]; // 用户角色ID列表
}

// 用户列表项接口
export interface UserListItem {
  id: number;
  username: string;
  nickname?: string;
  email: string;
  avatar?: string;
  is_admin: boolean;
  is_super_admin: boolean;
  status: "active" | "inactive";
  created_at: string;
  tenant_id?: number;
  tenant_name?: string;
}

// 用户登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

// 用户注册请求接口
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  nickname?: string;
}

// 认证响应接口
export interface AuthResponse {
  token: string;
  refresh_token?: string;
  expires_in?: number;
  user: UserInfo;
}

// 用户状态接口
export interface UserState {
  token: string;
  refreshToken: string;
  userInfo: UserInfo | null;
  roles: string[];
  permissions: string[];
}

// 用户列表查询参数
export interface UserListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  tenant_id?: number;
  is_admin?: boolean;
  is_super_admin?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 用户列表响应
export interface UserListResult {
  success: boolean;
  data: {
    list: UserListItem[];
    total: number;
  };
}

// 通用API响应
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 修改密码请求
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

// 用户创建/更新请求
export interface UserCreateUpdateRequest {
  username: string;
  email: string;
  password?: string;
  nickname?: string;
  phone?: string;
  tenant_id?: number;
  is_admin?: boolean;
  status?: "active" | "inactive";
}

// 角色信息接口
export interface RoleInfo {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// 角色列表结果
export interface RoleListResult {
  success: boolean;
  data: RoleInfo[];
}

// 用户角色更新请求
export interface UserRoleUpdateRequest {
  role_ids: number[];
} 
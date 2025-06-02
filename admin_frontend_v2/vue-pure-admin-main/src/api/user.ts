import { http } from "@/utils/http";
import type { UserInfo, LoginRequest, RegisterRequest, AuthResponse, UserListResult, UserListParams, ApiResult, ChangePasswordRequest, UserCreateUpdateRequest } from "../../types/user";

export type UserResult = {
  success: boolean;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type UserInfoResult = {
  success: boolean;
  data: UserInfo;
};

type ResultTable = {
  success: boolean;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

/** 获取登录验证码 */
export const getLoginCodeApi = () => {
  return http.request<ApiResult<Blob>>("get", "/captcha", {
    responseType: "blob"
  });
};

/** 登录 */
export const getLogin = (data: LoginRequest) => {
  return http.request<AuthResponse>("post", "/auth/login/", { data });
};

/** 注册 */
export const getRegister = (data: RegisterRequest) => {
  return http.request<ApiResult>("post", "/auth/register/", { data });
};

/** 刷新token */
export const refreshTokenApi = (data?: object) => {
  return http.request<AuthResponse>("post", "/auth/token/refresh/", { data });
};

/** 获取用户信息 */
export const getUserInfo = () => {
  return http.request<ApiResult<UserInfo>>("get", "/users/me/");
};

/** 修改密码 */
export const changePasswordApi = (data: ChangePasswordRequest) => {
  return http.request<ApiResult>("post", "/auth/me/change-password/", { data });
};

/** 重置指定用户密码 */
export const resetPasswordApi = (id: number) => {
  return http.request<ApiResult>("post", `/users/${id}/reset-password/`);
};

/** 获取用户列表 */
export const getUserList = (params?: UserListParams) => {
  return http.request<UserListResult>("get", "/users/", { params });
};

/** 获取用户详情 */
export const getUserById = (id: number) => {
  return http.request<ApiResult<UserInfo>>("get", `/users/${id}/`);
};

/** 创建用户 */
export const createUser = (data: UserCreateUpdateRequest) => {
  return http.request<ApiResult>("post", "/users/", { data });
};

/** 更新用户 */
export const updateUser = (id: number, data: UserCreateUpdateRequest) => {
  return http.request<ApiResult>("put", `/users/${id}/`, { data });
};

/** 删除用户 */
export const deleteUser = (id: number) => {
  return http.request<ApiResult>("delete", `/users/${id}/`);
};

/** 激活用户 */
export const activateUser = (id: number) => {
  return http.request<ApiResult>("post", `/users/${id}/activate/`);
};

/** 禁用用户 */
export const disableUser = (id: number) => {
  return http.request<ApiResult>("post", `/users/${id}/disable/`);
};

/** 更新用户角色 */
export const updateUserRole = (id: number, data: object) => {
  return http.request<ApiResult>("post", `/users/${id}/role/`, { data });
};

/** 授予超级管理员权限 */
export const grantSuperAdmin = (id: number) => {
  return http.request<ApiResult>("post", `/users/${id}/grant-super-admin/`);
};

/** 撤销超级管理员权限 */
export const revokeSuperAdmin = (id: number) => {
  return http.request<ApiResult>("post", `/users/${id}/revoke-super-admin/`);
};

/** 上传用户头像 */
export const uploadAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  
  return http.request<ApiResult>("post", "/users/me/upload-avatar/", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

/** 上传指定用户的头像 */
export const uploadUserAvatar = (id: number, file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  
  return http.request<ApiResult>("post", `/users/${id}/upload-avatar/`, {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

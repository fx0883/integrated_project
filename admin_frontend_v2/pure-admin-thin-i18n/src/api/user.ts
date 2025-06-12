import { http } from "@/utils/http";
import { ApiResponse, LoginResponseData, RefreshTokenResponseData, UserInfo } from "@/types/api";

export type UserResult = ApiResponse<LoginResponseData>;
export type RefreshTokenResult = ApiResponse<RefreshTokenResponseData>;

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/auth/login/", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/auth/refresh/", { data });
};

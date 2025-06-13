import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type UserResult,
  type RefreshTokenResult,
  getLogin,
  refreshTokenApi
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 用户ID
    id: storageLocal().getItem<DataInfo<number>>(userKey)?.id,
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nick_name ?? "",
    // 邮箱
    email: storageLocal().getItem<DataInfo<number>>(userKey)?.email ?? "",
    // 是否管理员
    is_admin: storageLocal().getItem<DataInfo<number>>(userKey)?.is_admin ?? false,
    // 是否超级管理员
    is_super_admin: storageLocal().getItem<DataInfo<number>>(userKey)?.is_super_admin ?? false,
    // 是否普通成员
    is_member: storageLocal().getItem<DataInfo<number>>(userKey)?.is_member ?? false,
    // 手机号
    phone: storageLocal().getItem<DataInfo<number>>(userKey)?.phone ?? "",
    // 状态
    status: storageLocal().getItem<DataInfo<number>>(userKey)?.status ?? "",
    // 最后登录IP
    last_login_ip: storageLocal().getItem<DataInfo<number>>(userKey)?.last_login_ip ?? "",
    // 租户ID
    tenant: storageLocal().getItem<DataInfo<number>>(userKey)?.tenant,
    // 父账号ID
    parent: storageLocal().getItem<DataInfo<number>>(userKey)?.parent,
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储用户ID */
    SET_ID(id: number) {
      this.id = id;
    },
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储邮箱 */
    SET_EMAIL(email: string) {
      this.email = email;
    },
    /** 存储是否管理员 */
    SET_IS_ADMIN(is_admin: boolean) {
      this.is_admin = is_admin;
    },
    /** 存储是否超级管理员 */
    SET_IS_SUPER_ADMIN(is_super_admin: boolean) {
      this.is_super_admin = is_super_admin;
    },
    /** 存储是否普通成员 */
    SET_IS_MEMBER(is_member: boolean) {
      this.is_member = is_member;
    },
    /** 存储手机号 */
    SET_PHONE(phone: string) {
      this.phone = phone;
    },
    /** 存储状态 */
    SET_STATUS(status: string) {
      this.status = status;
    },
    /** 存储最后登录IP */
    SET_LAST_LOGIN_IP(last_login_ip: string) {
      this.last_login_ip = last_login_ip;
    },
    /** 存储租户ID */
    SET_TENANT(tenant: number) {
      this.tenant = tenant;
    },
    /** 存储父账号ID */
    SET_PARENT(parent: number) {
      this.parent = parent;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入 */
    async loginByUsername(data) {
      return new Promise<UserResult>((resolve, reject) => {
        getLogin(data)
          .then(data => {
            if (data?.success) {
              // 适配后端返回的数据结构
              const { token, refresh_token, user } = data.data;

              // 存储token到localStorage
              localStorage.setItem('access_token', token);
              localStorage.setItem('refresh_token', refresh_token);

              const userData = {
                accessToken: token,
                refreshToken: refresh_token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 假设token有效期为24小时
                id: user.id,
                username: user.username,
                nick_name: user.nick_name,
                email: user.email,
                is_admin: user.is_admin,
                is_super_admin: user.is_super_admin,
                is_member: user.is_member || false,
                phone: user.phone || "",
                status: user.status || "active",
                last_login_ip: user.last_login_ip || "",
                tenant: user.tenant,
                parent: user.parent,
                avatar: user.avatar || "",
                roles: [user.is_super_admin ? "super_admin" : (user.is_admin ? "admin" : "member")],
                permissions: ["*:*:*"] // 假设拥有所有权限，根据实际情况调整
              };

              // 存储用户信息
              setToken(userData);

              // 存储原始用户信息到localStorage
              localStorage.setItem('user_info', JSON.stringify(user));
            }
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];

      // 清除localStorage中的token和用户信息
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');

      // 清除cookie中的token
      removeToken();

      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    },
    /** 刷新`token` */
    async handRefreshToken(data) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        refreshTokenApi(data)
          .then(data => {
            if (data?.success) {
              // 适配后端返回的数据结构
              const { token, refresh_token } = data.data;

              // 更新localStorage中的token
              localStorage.setItem('access_token', token);
              localStorage.setItem('refresh_token', refresh_token);

              const userData = {
                accessToken: token,
                refreshToken: refresh_token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 假设token有效期为24小时
              };
              setToken(userData);
            }
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}

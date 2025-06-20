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
import { getCurrentAdmin, updateCurrentAdmin, uploadCurrentAdminAvatar } from "@/api/modules/adminUser";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";
import { useI18n } from "vue-i18n";

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
    loginDay: 7,
    // 加载状态
    loading: {
      getCurrentAdmin: false,
      updateCurrentAdmin: false
    }
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
    },
    
    /** 获取当前登录管理员信息 */
    async fetchCurrentAdmin() {
      this.loading.getCurrentAdmin = true;
      try {
        const response = await getCurrentAdmin();
        if (response.success) {
          // 更新store中的用户信息
          const user = response.data;
          this.SET_ID(user.id);
          this.SET_USERNAME(user.username);
          this.SET_NICKNAME(user.nick_name || "");
          this.SET_EMAIL(user.email);
          this.SET_PHONE(user.phone || "");
          this.SET_AVATAR(user.avatar || "");
          this.SET_IS_ADMIN(user.is_admin);
          this.SET_IS_SUPER_ADMIN(user.is_super_admin);
          this.SET_IS_MEMBER(user.is_member || false);
          this.SET_STATUS(user.status || "active");
          this.SET_TENANT(user.tenant);
          
          // 更新localStorage中的用户信息
          localStorage.setItem('user_info', JSON.stringify(user));
          
          return response;
        } else {
          ElMessage.error(response.message || "获取当前管理员信息失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取当前管理员信息失败", error);
        ElMessage.error(error.message || "获取当前管理员信息失败");
        throw error;
      } finally {
        this.loading.getCurrentAdmin = false;
      }
    },
    
    /** 更新当前登录管理员信息 */
    async updateCurrentAdminInfo(data) {
      this.loading.updateCurrentAdmin = true;
      try {
        const response = await updateCurrentAdmin(data);
        if (response.success) {
          // 更新store中的用户信息
          const user = response.data;
          this.SET_NICKNAME(user.nick_name || "");
          this.SET_PHONE(user.phone || "");
          this.SET_AVATAR(user.avatar || "");
          
          // 更新localStorage中的用户信息
          const userInfo = JSON.parse(localStorage.getItem('user_info') || "{}");
          localStorage.setItem('user_info', JSON.stringify({
            ...userInfo,
            nick_name: user.nick_name,
            phone: user.phone,
            avatar: user.avatar
          }));
          
          ElMessage.success("个人信息更新成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新当前管理员信息失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新当前管理员信息失败", error);
        ElMessage.error(error.message || "更新当前管理员信息失败");
        throw error;
      } finally {
        this.loading.updateCurrentAdmin = false;
      }
    },
    /** 上传当前用户头像 */
    async uploadCurrentAdminAvatar(file: File) {
      this.loading.updateCurrentAdmin = true;
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await uploadCurrentAdminAvatar(formData);
        if (response.success) {
          // 更新store中的用户头像
          this.SET_AVATAR(response.data.avatar || "");
          
          // 更新localStorage中的用户信息
          const userInfo = JSON.parse(localStorage.getItem('user_info') || "{}");
          localStorage.setItem('user_info', JSON.stringify({
            ...userInfo,
            avatar: response.data.avatar
          }));
          
          ElMessage.success("头像上传成功");
          return response;
        } else {
          ElMessage.error(response.message || "头像上传失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("上传当前用户头像失败", error);
        ElMessage.error("上传头像失败");
        throw error;
      } finally {
        this.loading.updateCurrentAdmin = false;
      }
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}

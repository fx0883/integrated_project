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
import { type DataInfo, setToken, removeToken, userKey, logTokenLifecycle } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 用户ID
    userId: storageLocal().getItem<DataInfo<number>>(userKey)?.userId ?? null,
    // 租户ID
    tenantId: storageLocal().getItem<DataInfo<number>>(userKey)?.tenantId ?? null,
    // 部门ID
    deptId: storageLocal().getItem<DataInfo<number>>(userKey)?.deptId ?? null,
    // 完整用户信息
    userInfo: storageLocal().getItem<DataInfo<number>>(userKey)?.userInfo ?? null,
    // 前端生成的验证码（按实际需求替换）
    verifyCode: "",
    // 判断登录页面显示哪个组件（0：登录（默认）、1：手机登录、2：二维码登录、3：注册、4：忘记密码）
    currentPage: 0,
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
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
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储用户ID */
    SET_USERID(userId: number) {
      this.userId = userId;
    },
    /** 存储租户ID */
    SET_TENANTID(tenantId: number) {
      this.tenantId = tenantId;
    },
    /** 存储部门ID */
    SET_DEPTID(deptId: number) {
      this.deptId = deptId;
    },
    /** 存储完整用户信息 */
    SET_USERINFO(userInfo: any) {
      this.userInfo = userInfo;
    },
    /** 存储前端生成的验证码 */
    SET_VERIFYCODE(verifyCode: string) {
      this.verifyCode = verifyCode;
    },
    /** 存储登录页面显示哪个组件 */
    SET_CURRENTPAGE(value: number) {
      this.currentPage = value;
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
        console.group("[Token生命周期] 用户登录");
        console.log(`登录时间: ${new Date().toLocaleString()}`);
        console.log(`登录用户名: ${data.username || '未提供'}`);
        console.log(`记住登录: ${this.isRemembered ? '是' : '否'}`);
        if (this.isRemembered) {
          console.log(`记住天数: ${this.loginDay}天`);
        }
        console.groupEnd();

        getLogin(data)
          .then(response => {
            // 打印原始响应数据，方便调试
            console.group("[Token生命周期] 登录原始响应");
            console.log("原始响应数据:", response);
            console.groupEnd();

            // 从响应中提取token数据
            // 使用类型断言处理响应数据
            const apiData = response as any;

            // 获取实际的数据部分
            const responseData = apiData?.data || {};

            // 提取用户信息
            const user = responseData.user || {};
            const token = responseData.token || "";
            const refreshToken = responseData.refresh_token || "";

            // 根据用户信息确定角色
            let roles = ["common"];
            if (user.is_super_admin) {
              roles = ["super_admin"];
            } else if (user.is_admin) {
              roles = ["admin"];
            }

            // 构造标准格式的响应数据
            const standardResponse = {
              success: apiData.success || apiData.code === 2000,
              message: apiData.message || "",
              data: {
                accessToken: token,
                refreshToken: refreshToken,
                // JWT通常有效期为24小时
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                username: user.username || "",
                nickname: user.nick_name || "",
                avatar: user.avatar || "",
                roles: roles,
                permissions: [],
                userId: user.id || null,
                userInfo: user
              }
            };

            // 打印转换后的数据
            console.group("[Token生命周期] 转换后的Token数据");
            console.log("accessToken:", standardResponse.data.accessToken ? `${standardResponse.data.accessToken.substring(0, 10)}...` : "无");
            console.log("refreshToken:", standardResponse.data.refreshToken ? `${standardResponse.data.refreshToken.substring(0, 10)}...` : "无");
            console.log("用户信息:", standardResponse.data.userInfo);
            console.groupEnd();

            if (standardResponse?.success) {
              console.group("[Token生命周期] 登录成功");
              console.log(`登录响应时间: ${new Date().toLocaleString()}`);
              console.log(`获取到的Token信息:`, {
                hasAccessToken: !!standardResponse.data.accessToken,
                hasRefreshToken: !!standardResponse.data.refreshToken,
                过期时间: standardResponse.data.expires ? standardResponse.data.expires.toLocaleString() : '未提供'
              });
              console.groupEnd();

              setToken(standardResponse.data);

              // 设置用户基本信息
              if (standardResponse.data.userInfo) {
                const userInfo = standardResponse.data.userInfo;
                if (userInfo.id) this.SET_USERID(userInfo.id);
                this.SET_USERINFO(userInfo);

                // 保持向下兼容
                if (userInfo.avatar) this.SET_AVATAR(userInfo.avatar);
                if (userInfo.username) this.SET_USERNAME(userInfo.username);
                if (userInfo.nick_name) this.SET_NICKNAME(userInfo.nick_name);
              }
            } else {
              console.group("[Token生命周期] 登录失败");
              console.log(`失败时间: ${new Date().toLocaleString()}`);
              console.log(`失败原因: ${standardResponse?.message || '未知错误'}`);
              console.groupEnd();
            }
            resolve(standardResponse as UserResult);
          })
          .catch(error => {
            console.group("[Token生命周期] 登录异常");
            console.log(`异常时间: ${new Date().toLocaleString()}`);
            console.error(`异常信息:`, error);
            console.groupEnd();

            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      console.group("[Token生命周期] 用户登出");
      console.log(`登出时间: ${new Date().toLocaleString()}`);
      console.log(`登出用户: ${this.username || '未知用户'}`);
      console.groupEnd();

      this.username = "";
      this.roles = [];
      this.permissions = [];
      this.userId = null;
      this.tenantId = null;
      this.deptId = null;
      this.userInfo = null;
      removeToken();
      // 先处理标签页
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);

      // 重置路由
      resetRouter();

      // 使用nextTick确保DOM更新后再导航
      setTimeout(() => {
        router.push("/login");
      }, 10);
    },
    /** 刷新`token` */
    async handRefreshToken(refreshData) {
      return new Promise<RefreshTokenResult>((resolve, reject) => {
        console.group("[Token生命周期] 开始刷新Token (Store)");
        console.log(`刷新请求时间: ${new Date().toLocaleString()}`);
        console.log(`使用的refreshToken: ${refreshData.refreshToken ? refreshData.refreshToken.substring(0, 10) + "..." : "无"}`);
        console.groupEnd();

        refreshTokenApi(refreshData)
          .then(response => {
            // 打印原始响应数据，方便调试
            console.group("[Token生命周期] 刷新Token原始响应");
            console.log("原始响应数据:", response);
            console.groupEnd();

            // 从响应中提取token数据
            // 使用类型断言处理响应数据
            const apiData = response as any;

            // 将API响应转换为标准格式
            const responseData = {
              success: true,
              data: {
                accessToken: apiData.token || (apiData.data && apiData.data.token) || "",
                refreshToken: apiData.refresh_token || (apiData.data && apiData.data.refresh_token) || refreshData.refreshToken, // 如果没有返回新的refreshToken，保留原来的
                // 如果expires_in是秒数，转换为日期对象
                expires: apiData.expires_in
                  ? new Date(Date.now() + apiData.expires_in * 1000)
                  : new Date(Date.now() + 7200000) // 默认2小时
              }
            };

            // 打印转换后的数据
            console.group("[Token生命周期] 转换后的刷新Token数据");
            console.log("accessToken:", responseData.data.accessToken ? `${responseData.data.accessToken.substring(0, 10)}...` : "无");
            console.log("refreshToken:", responseData.data.refreshToken ? `${responseData.data.refreshToken.substring(0, 10)}...` : "无");
            console.groupEnd();

            if (responseData) {
              console.group("[Token生命周期] Token刷新成功 (Store)");
              console.log(`刷新响应时间: ${new Date().toLocaleString()}`);
              console.log(`新的Token信息:`, {
                hasAccessToken: !!responseData.data.accessToken,
                accessTokenPrefix: responseData.data.accessToken ? responseData.data.accessToken.substring(0, 10) + "..." : "无",
                hasRefreshToken: !!responseData.data.refreshToken,
                refreshTokenPrefix: responseData.data.refreshToken ? responseData.data.refreshToken.substring(0, 10) + "..." : "无",
                过期时间: responseData.data.expires ? responseData.data.expires.toLocaleString() : '未提供'
              });
              console.groupEnd();

              setToken(responseData.data);
              resolve(responseData as RefreshTokenResult);
            } else {
              console.group("[Token生命周期] Token刷新失败 (Store)");
              console.log(`失败时间: ${new Date().toLocaleString()}`);
              console.log(`失败原因: 响应数据为空`);
              console.groupEnd();

              reject(new Error("刷新Token失败: 响应数据为空"));
            }
          })
          .catch(error => {
            console.group("[Token生命周期] Token刷新异常 (Store)");
            console.log(`异常时间: ${new Date().toLocaleString()}`);
            console.error(`异常信息:`, error);
            console.groupEnd();

            reject(error);
          });
      });
    },
    /** 获取当前用户租户ID */
    getCurrentTenantId() {
      return this.tenantId;
    },
    /** 获取当前用户部门ID */
    getCurrentDeptId() {
      return this.deptId;
    },
    /** 获取当前用户ID */
    getCurrentUserId() {
      return this.userId;
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}

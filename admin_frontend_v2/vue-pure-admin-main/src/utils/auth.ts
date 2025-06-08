import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export interface DataInfo<T> {
  /** token */
  accessToken: string;
  /** `accessToken`的过期时间（时间戳） */
  expires: T;
  /** 用于调用刷新accessToken的接口时所需的token */
  refreshToken: string;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色 */
  roles?: Array<string>;
  /** 当前登录用户的按钮级别权限 */
  permissions?: Array<string>;
  /** 用户ID */
  userId?: number;
  /** 租户ID */
  tenantId?: number;
  /** 部门ID */
  deptId?: number;
  /** 完整的用户信息对象 */
  userInfo?: {
    id?: number;
    username?: string;
    email?: string;
    nick_name?: string;
    is_admin?: boolean;
    is_super_admin?: boolean;
    avatar?: string;
    [key: string]: any;
  };
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/**
 * 打印Token生命周期信息
 * @param action 当前操作
 * @param tokenData Token数据
 */
export function logTokenLifecycle(action: string, tokenData?: DataInfo<any>) {
  const now = Date.now();
  console.group(`[Token生命周期] ${action}`);
  
  if (tokenData && tokenData.accessToken) {
    // 计算过期时间
    const expiresTime = typeof tokenData.expires === 'number' ? tokenData.expires : new Date(tokenData.expires).getTime();
    const remainingMs = expiresTime - now;
    const remainingMin = Math.floor(remainingMs / 1000 / 60);
    const remainingSec = Math.floor((remainingMs / 1000) % 60);
    
    console.log(`时间信息:`, {
      当前时间: new Date(now).toLocaleString(),
      过期时间: new Date(expiresTime).toLocaleString(),
      是否过期: remainingMs <= 0 ? "已过期" : "未过期",
      剩余时间: remainingMs <= 0 ? "已过期" : `${remainingMin}分钟${remainingSec}秒`
    });
    
    console.log(`Token信息:`, {
      accessToken: tokenData.accessToken ? `${tokenData.accessToken.substring(0, 10)}...` : "无",
      refreshToken: tokenData.refreshToken ? `${tokenData.refreshToken.substring(0, 10)}...` : "无",
      用户名: tokenData.username || "未知",
      角色: tokenData.roles || []
    });

    // 记录用户详细信息
    if (tokenData.userInfo) {
      console.log(`用户详细信息:`, {
        用户ID: tokenData.userInfo.id || "未知",
        用户名: tokenData.userInfo.username || "未知",
        昵称: tokenData.userInfo.nick_name || "未知",
        邮箱: tokenData.userInfo.email || "未知",
        是否管理员: tokenData.userInfo.is_admin ? "是" : "否",
        是否超级管理员: tokenData.userInfo.is_super_admin ? "是" : "否"
      });
    }
    
    // 检查存储位置
    const cookieToken = Cookies.get(TokenKey);
    const localToken = storageLocal().getItem(userKey);
    
    console.log(`存储状态:`, {
      Cookie中: cookieToken ? "已存储" : "未存储",
      LocalStorage中: localToken ? "已存储" : "未存储"
    });
  } else {
    console.log("Token数据不完整或为空");
    
    if (tokenData) {
      console.log("部分Token信息:", {
        hasAccessToken: !!tokenData.accessToken,
        hasRefreshToken: !!tokenData.refreshToken,
        hasUsername: !!tokenData.username
      });
    }
    
    // 检查存储位置
    const cookieToken = Cookies.get(TokenKey);
    const localToken = storageLocal().getItem(userKey);
    
    console.log(`存储状态:`, {
      Cookie中: cookieToken ? "已存储" : "未存储",
      LocalStorage中: localToken ? "已存储" : "未存储"
    });
  }
  
  console.groupEnd();
}

/** 获取`token` */
export function getToken(): DataInfo<number> {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  const cookieToken = Cookies.get(TokenKey);
  const localToken = storageLocal().getItem(userKey);
  
  const token = cookieToken ? JSON.parse(cookieToken) : localToken;
  
  // 只在token存在时记录日志，避免无限循环
  if (token) {
    logTokenLifecycle("获取Token", token);
  }
  
  return token;
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`，`refreshToken`的过期时间（比如30天）应大于`accessToken`的过期时间（比如2小时））、`expires`（`accessToken`的过期时间）
 * 将`accessToken`、`expires`、`refreshToken`这三条信息放在key值为authorized-token的cookie里（过期自动销毁）
 * 将`avatar`、`username`、`nickname`、`roles`、`permissions`、`refreshToken`、`expires`这七条信息放在key值为`user-info`的localStorage里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 */
export function setToken(data: DataInfo<Date>) {
  logTokenLifecycle("设置Token - 开始", data);
  
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = useUserStoreHook();
  expires = new Date(data.expires).getTime(); // 如果后端直接设置时间戳，将此处代码改为expires = data.expires，然后把上面的DataInfo<Date>改成DataInfo<number>即可
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  expires > 0
    ? Cookies.set(TokenKey, cookieString, {
        expires: (expires - Date.now()) / 86400000
      })
    : Cookies.set(TokenKey, cookieString);

  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
          expires: loginDay
        }
      : {}
  );

  function setUserKey({ avatar, username, nickname, roles, permissions, userId, tenantId, deptId, userInfo }) {
    useUserStoreHook().SET_AVATAR(avatar);
    useUserStoreHook().SET_USERNAME(username);
    useUserStoreHook().SET_NICKNAME(nickname);
    useUserStoreHook().SET_ROLES(roles);
    useUserStoreHook().SET_PERMS(permissions);
    if (userId) useUserStoreHook().SET_USERID(userId);
    if (tenantId) useUserStoreHook().SET_TENANTID(tenantId);
    if (deptId) useUserStoreHook().SET_DEPTID(deptId);
    if (userInfo) useUserStoreHook().SET_USERINFO(userInfo);
    
    storageLocal().setItem(userKey, {
      refreshToken,
      expires,
      avatar,
      username,
      nickname,
      roles,
      permissions,
      userId,
      tenantId,
      deptId,
      userInfo
    });
  }

  if (data.username && data.roles) {
    const { username, roles, userInfo } = data;
    setUserKey({
      avatar: data?.avatar ?? "",
      username,
      nickname: data?.nickname ?? "",
      roles,
      permissions: data?.permissions ?? [],
      userId: data?.userId,
      tenantId: data?.tenantId,
      deptId: data?.deptId,
      userInfo
    });
  } else {
    const avatar =
      storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "";
    const username =
      storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "";
    const nickname =
      storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "";
    const roles =
      storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [];
    const permissions =
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [];
    const userId =
      storageLocal().getItem<DataInfo<number>>(userKey)?.userId;
    const tenantId =
      storageLocal().getItem<DataInfo<number>>(userKey)?.tenantId;
    const deptId =
      storageLocal().getItem<DataInfo<number>>(userKey)?.deptId;
    const userInfo =
      storageLocal().getItem<DataInfo<number>>(userKey)?.userInfo;
      
    setUserKey({
      avatar,
      username,
      nickname,
      roles,
      permissions,
      userId,
      tenantId,
      deptId,
      userInfo
    });
  }
  
  logTokenLifecycle("设置Token - 完成", data);
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  logTokenLifecycle("删除Token");
  
  console.group("[AUTH DEBUG] 删除Token详情");
  console.log(`删除时间: ${new Date().toLocaleString()}`);

  // 检查当前Token状态
  const cookieToken = Cookies.get(TokenKey);
  const localToken = storageLocal().getItem(userKey);
  console.log("删除前的Token状态:", {
    Cookie中的Token: cookieToken ? "存在" : "不存在",
    LocalStorage中的用户信息: localToken ? "存在" : "不存在",
    SessionStorage计数器: sessionStorage.getItem("login_redirect_count") || "不存在"
  });

  // 执行删除操作
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);

  // 验证删除结果
  const afterCookieToken = Cookies.get(TokenKey);
  const afterLocalToken = storageLocal().getItem(userKey);
  console.log("删除后的Token状态:", {
    Cookie中的Token: afterCookieToken ? "仍然存在" : "已删除",
    LocalStorage中的用户信息: afterLocalToken ? "仍然存在" : "已删除"
  });

  console.groupEnd();
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  if (!token) {
    console.warn("[Token调试] 格式化Token失败: Token为空");
    return "Bearer undefined";
  }
  return "Bearer " + token;
};

/** 是否有按钮级别的权限（根据登录接口返回的`permissions`字段进行判断）*/
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  const allPerms = "*:*:*";
  const { permissions } = useUserStoreHook();
  if (!permissions) return false;
  if (permissions.length === 1 && permissions[0] === allPerms) return true;
  const isAuths = isString(value)
    ? permissions.includes(value)
    : isIncludeAllChildren(value, permissions);
  return isAuths ? true : false;
};
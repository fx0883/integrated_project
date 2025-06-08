import { http } from "@/utils/http";
import { storageLocal } from "@pureadmin/utils";
import { userKey, type DataInfo, getToken } from "@/utils/auth";
import { ElMessage } from "element-plus";

/** 获取异步路由 */
export const getAsyncRoutes = () => {
  console.group("[路由API] 开始获取路由");
  console.time("[路由API] 获取路由总耗时");
  console.log(`[路由API] 请求开始时间: ${new Date().toLocaleString()}`);

  // 获取当前用户角色
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const roles = Array.isArray(userInfo?.roles) ? userInfo.roles : [];

  console.log("[路由API] 用户信息检查:", {
    从LocalStorage获取的用户信息: userInfo ? "存在" : "不存在",
    用户ID: userInfo?.userId || "未知",
    用户名: userInfo?.username || "未知",
    角色: roles,
    权限数量: Array.isArray(userInfo?.permissions) ? userInfo.permissions.length : 0
  });

  // 检查token状态
  const tokenData = getToken();
  const now = Date.now();
  const tokenExpires = tokenData ? parseInt(tokenData.expires) : 0;
  const isExpired = tokenExpires <= now;
  const remainingTime = isExpired ? 0 : Math.floor((tokenExpires - now) / 1000 / 60);

  console.log("[路由API] Token状态检查:", {
    token存在: !!tokenData,
    token类型: tokenData ? "Bearer" : "无",
    过期状态: tokenData ? (isExpired ? "已过期" : "有效") : "无token",
    剩余有效期: tokenData ? `${remainingTime}分钟` : "无token",
    过期时间: tokenData ? new Date(tokenExpires).toLocaleString() : "无token"
  });

  // 请求后端API获取路由，添加超时处理
  console.log("[路由API] 请求后端API获取路由: /api/v1/menus/routes/");

  return new Promise((resolve, reject) => {
    // 设置超时处理
    const timeoutId = setTimeout(() => {
      console.error("[路由API] 请求超时");
      ElMessage.error("获取路由超时，请检查网络连接");
      reject(new Error("获取路由超时，请检查网络连接"));
      console.timeEnd("[路由API] 获取路由总耗时");
      console.groupEnd();
    }, 15000); // 15秒超时

    // 发起实际请求
    http.request<any>("get", "/menus/routes/")
      .then(response => {
        clearTimeout(timeoutId); // 清除超时
        console.log("[路由API] 请求成功，响应数据:", response);

        // 检查响应数据
        if (!response) {
          console.error("[路由API] 响应数据为空");
          ElMessage.error("获取路由失败，响应数据为空");
          reject(new Error("获取路由失败，响应数据为空"));
          console.timeEnd("[路由API] 获取路由总耗时");
          console.groupEnd();
          return;
        }

        // 检查数据格式
        let routesData;
        if (response && typeof response === 'object' && 'data' in response) {
          routesData = response.data;
          console.log("[路由API] 从response.data中获取路由数据");
        } else if (Array.isArray(response)) {
          routesData = response;
          console.log("[路由API] 从response数组中获取路由数据");
        } else {
          console.error("[路由API] 响应数据格式不正确", response);
          ElMessage.error("获取路由失败，数据格式不正确");
          reject(new Error("获取路由失败，数据格式不正确"));
          console.timeEnd("[路由API] 获取路由总耗时");
          console.groupEnd();
          return;
        }

        // 检查路由数量
        const routesCount = Array.isArray(routesData) ? routesData.length : "未知";
        console.log(`[路由API] 成功获取路由，数量: ${routesCount}`);

        console.timeEnd("[路由API] 获取路由总耗时");
        console.groupEnd();
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId); // 清除超时
        console.error("[路由API] 请求失败", error);
        ElMessage.error(`获取路由失败: ${error.message || '未知错误'}`);
        reject(error);
        console.timeEnd("[路由API] 获取路由总耗时");
        console.groupEnd();
      });
  });
};

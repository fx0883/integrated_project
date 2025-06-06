import { http } from "@/utils/http";
import { storageLocal } from "@pureadmin/utils";
import { userKey, type DataInfo } from "@/utils/auth";

// 导入路由模块
import tenant from "@/router/modules/tenant";
import user from "@/router/modules/user";
import menu from "@/router/modules/menu";

/** 获取异步路由 */
export const getAsyncRoutes = () => {
  // 获取当前用户角色
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const roles = userInfo?.roles || [];
  
  // 超级管理员特殊处理 - 直接返回静态路由
  if (roles.includes('super_admin')) {
    console.log("[路由] 超级管理员登录，使用静态路由");
    
    // 只包含租户管理、用户管理和菜单管理三个模块
    const superAdminRoutes = [tenant, user, menu];
    
    // 返回模拟的API响应格式
    return Promise.resolve({
      success: true,
      code: 2000,
      message: "获取超级管理员路由成功",
      data: superAdminRoutes
    });
  }
  
  // 其他角色正常请求后端API
  return http.request<any>("get", "/api/v1/routes");
};

import { http } from "@/utils/http";

type Result = {
  success: boolean;
  data: Array<any>;
};

/**
 * 获取异步路由
 * 如果后端API不存在，回退到使用本地mock数据
 */
export const getAsyncRoutes = () => {
  // 添加日志输出
  console.log("[路由] 尝试从后端获取异步路由");
  
  return new Promise<Result>((resolve, reject) => {
    http.request<Result>("get", "/get-async-routes")
      .then(res => {
        console.log("[路由] 成功获取异步路由", res);
        resolve(res);
      })
      .catch(error => {
        console.error("[路由] 获取异步路由失败", error);
        console.log("[路由] 尝试使用本地模拟的异步路由数据");

        // 这里提供一个本地的异步路由数据，当后端API不可用时使用
        // 注意：在实际项目中，这些路由应该由后端动态生成
        const localAsyncRoutes = {
          success: true,
          data: [
            // 系统管理
            {
              path: "/system",
              component: "Layout", // 父级路由使用Layout组件
              redirect: "/system/user/index",
              meta: {
                icon: "ri:settings-3-line",
                title: "系统管理",
                rank: 1
              },
              children: [
                {
                  path: "/system/user/index",
                  name: "SystemUser",
                  component: "system/user/index", // 指定组件路径
                  meta: {
                    icon: "ri:admin-line",
                    title: "用户管理",
                    roles: ["admin"]
                  }
                },
                {
                  path: "/system/menu/index",
                  name: "SystemMenu",
                  component: "system/menu/index", // 指定组件路径
                  meta: {
                    icon: "ep:menu",
                    title: "菜单管理",
                    roles: ["admin"]
                  }
                },
                {
                  path: "/system/role/index",
                  name: "SystemRole",
                  component: "system/role/index", // 指定组件路径
                  meta: {
                    icon: "ri:admin-fill",
                    title: "角色管理",
                    roles: ["admin"]
                  }
                }
              ]
            }
          ]
        };
        
        // 使用本地数据模拟成功响应
        resolve(localAsyncRoutes);
      });
  });
};

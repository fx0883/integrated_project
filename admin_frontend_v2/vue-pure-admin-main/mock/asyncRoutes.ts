// 定义纯净版后台管理系统的异步路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([
  // 获取所有异步路由的mock数据
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      console.log("[Mock] 处理/get-async-routes请求");
      return {
        success: true,
        data: [
          // 仪表盘
          {
            path: "/dashboard",
            name: "Dashboard",
            component: "Layout", 
            redirect: "/dashboard/index",
            meta: {
              icon: "ep:data-board",
              title: "仪表盘",
              rank: 1
            },
            children: [
              {
                path: "/dashboard/index",
                name: "DashboardIndex",
                component: "dashboard/index",
                meta: {
                  icon: "ep:data-line",
                  title: "主控台",
                  roles: ["admin"]
                }
              }
            ]
          },
          // CMS管理
          {
            path: "/cms",
            name: "CMS",
            component: "Layout", 
            redirect: "/cms/article",
            meta: {
              icon: "ri:article-line",
              title: "内容管理",
              rank: 2
            },
            children: [
              {
                path: "/cms/article",
                name: "CMSArticle",
                component: "cms/article/index",
                meta: {
                  icon: "ri:article-line",
                  title: "文章管理",
                  roles: ["admin"]
                }
              }
            ]
          }
        ]
      };
    }
  }
]);

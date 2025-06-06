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
        console.log("[路由] 使用本地路由数据");

        // 使用精简的本地路由配置，避免复杂嵌套和潜在的循环引用
        const localAsyncRoutes = {
          success: true,
          data: [
            // 仪表盘
            {
              path: "/dashboard",
              name: "Dashboard",
              component: "/src/layout/index",
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
                  component: "/src/views/dashboard/index",
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
              redirect: "/cms/article/list",
              meta: {
                icon: "ri:article-line",
                title: "内容管理",
                rank: 2
              },
              children: [
                {
                  path: "statistics",
                  name: "CMSStatistics",
                  component: "/src/views/cms/statistics/index",
                  meta: {
                    title: "统计分析",
                    icon: "ep/data-analysis"
                  }
                },
                {
                  path: "article",
                  name: "CMSArticle",
                  component: "cms/article/index",
                  redirect: "article/list",
                  meta: {
                    icon: "ri:article-line",
                    title: "文章管理",
                    roles: ["admin"]
                  },
                  children: [
                    {
                      path: "list",
                      name: "ArticleList",
                      component: "/src/views/cms/article/list",
                      meta: {
                        title: "文章列表"
                      }
                    }
                  ]
                },
                {
                  path: "category",
                  name: "CMSCategory",
                  component: "/src/views/cms/category/index",
                  meta: {
                    title: "分类管理"
                  }
                },
                {
                  path: "tag",
                  name: "CMSTag",
                  component: "/src/views/cms/tag/index",
                  meta: {
                    title: "标签管理"
                  }
                },
                {
                  path: "comment",
                  name: "CMSComment",
                  component: "/src/views/cms/comment/list",
                  meta: {
                    title: "评论管理"
                  }
                }
              ]
            },
            // 打卡系统
            {
              path: "/check",
              name: "Check",
              component: "/src/layout/index",
              redirect: "/check/task/list",
              meta: {
                icon: "ep:calendar",
                title: "打卡系统",
                rank: 3
              },
              children: [
                {
                  path: "category",
                  name: "CheckCategory",
                  component: "/src/views/check/category/index",
                  meta: {
                    title: "打卡类型"
                  }
                },
                {
                  path: "task",
                  name: "CheckTask",
                  redirect: "task/list",
                  meta: {
                    title: "打卡任务"
                  },
                  children: [
                    {
                      path: "list",
                      name: "CheckTaskList",
                      component: "/src/views/check/task/list",
                      meta: {
                        title: "任务列表"
                      }
                    },
                    {
                      path: "detail/:id",
                      name: "CheckTaskDetail",
                      component: "/src/views/check/task/detail",
                      meta: {
                        title: "任务详情",
                        showLink: false,
                        activePath: "/check/task/list"
                      }
                    },
                    {
                      path: "create",
                      name: "CheckTaskCreate",
                      component: "/src/views/check/task/form",
                      meta: {
                        title: "创建任务",
                        showLink: false,
                        activePath: "/check/task/list"
                      }
                    },
                    {
                      path: "edit/:id",
                      name: "CheckTaskEdit",
                      component: "/src/views/check/task/form",
                      meta: {
                        title: "编辑任务",
                        showLink: false,
                        activePath: "/check/task/list"
                      }
                    },
                    {
                      path: "statistic/:id",
                      name: "CheckTaskStatistic",
                      component: "/src/views/check/task/statistic",
                      meta: {
                        title: "任务统计",
                        showLink: false,
                        activePath: "/check/task/list"
                      }
                    }
                  ]
                },
                {
                  path: "record",
                  name: "CheckRecord",
                  component: "/src/views/check/record/index",
                  meta: {
                    title: "打卡记录"
                  }
                },
                {
                  path: "report",
                  name: "CheckReport",
                  component: "/src/views/check/report/index",
                  meta: {
                    title: "统计报表"
                  }
                }
              ]
            },
            // 租户管理
            {
              path: "/tenant",
              name: "Tenant",
              component: "/src/layout/index",
              redirect: "/tenant/list",
              meta: {
                icon: "ep/office-building",
                title: "租户管理",
                rank: 4
              },
              children: [
                {
                  path: "list",
                  name: "TenantList",
                  component: "/src/views/tenant/list",
                  meta: {
                    title: "租户列表"
                  }
                },
                {
                  path: "detail/:id",
                  name: "TenantDetail",
                  component: "/src/views/tenant/detail",
                  meta: {
                    title: "租户详情",
                    showLink: false,
                    activePath: "/tenant/list"
                  }
                },
                {
                  path: "create",
                  name: "TenantCreate",
                  component: "/src/views/tenant/form",
                  meta: {
                    title: "创建租户",
                    showLink: false,
                    activePath: "/tenant/list"
                  }
                },
                {
                  path: "edit/:id",
                  name: "TenantEdit",
                  component: "/src/views/tenant/form",
                  meta: {
                    title: "编辑租户",
                    showLink: false,
                    activePath: "/tenant/list"
                  }
                },
                {
                  path: "quota/:id",
                  name: "TenantQuota",
                  component: "/src/views/tenant/quota",
                  meta: {
                    title: "租户配额",
                    showLink: false,
                    activePath: "/tenant/list"
                  }
                }
              ]
            },
            // 错误页面路由
            {
              path: "/error",
              name: "Error",
              component: "/src/layout/index",
              redirect: "/error/403",
              meta: {
                icon: "ri:information-line",
                title: "错误页面",
                rank: 9
              },
              children: [
                {
                  path: "/error/403",
                  name: "403",
                  component: "/src/views/error/403",
                  meta: {
                    title: "403页面"
                  }
                },
                {
                  path: "/error/404",
                  name: "404",
                  component: "/src/views/error/404",
                  meta: {
                    title: "404页面"
                  }
                },
                {
                  path: "/error/500",
                  name: "500",
                  component: "/src/views/error/500",
                  meta: {
                    title: "500页面"
                  }
                }
              ]
            }
          ]
        };
        
        console.log("[路由] 本地路由数据准备完成");
        resolve(localAsyncRoutes);
      });
  });
};

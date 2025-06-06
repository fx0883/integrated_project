import "@/utils/sso";
import Cookies from "js-cookie";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { transformI18n } from "@/plugins/i18n";
import { buildHierarchyTree } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import {
  isUrl,
  openLink,
  cloneDeep,
  isAllEmpty,
  storageLocal
} from "@pureadmin/utils";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  getHistoryMode,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes
} from "./utils";
import {
  type Router,
  type RouteRecordRaw,
  type RouteComponent,
  createRouter
} from "vue-router";
import {
  type DataInfo,
  userKey,
  removeToken,
  multipleTabsKey
} from "@/utils/auth";

// 导入业务相关的路由模块
import dashboard from "./modules/dashboard";
import cms from "./modules/cms";
import user from "./modules/user";
import check from "./modules/check";
import tenant from "./modules/tenant";
import error from "./modules/error";

/** 原始静态路由（未做任何处理） */
const routes = [dashboard, cms, user, check, tenant, error];

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

/** 初始的静态路由，用于退出登录时重置路由 */
const initConstantRoutes: Array<RouteRecordRaw> = cloneDeep(constantRoutes);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = Object.keys(remainingRouter).map(v => {
  return remainingRouter[v].path;
});

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...(remainingRouter as any)),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          const top: number =
            document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        }
      }
    });
  }
});

/** 重置路由 */
export function resetRouter() {
  router.clearRoutes();
  for (const route of initConstantRoutes.concat(...(remainingRouter as any))) {
    router.addRoute(route);
  }
  router.options.routes = formatTwoStageRoutes(
    formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
  );
  usePermissionStoreHook().clearAllCachePage();
}

/** 路由白名单 */
const whiteList = ["/login"];

const { VITE_HIDE_HOME } = import.meta.env;

// 路由组件预加载逻辑 - 添加此部分
const preloadMap = new Map<string, boolean>();
const preloadComponent = (route: any) => {
  if (!route || preloadMap.get(route.name as string)) return;
  
  preloadMap.set(route.name as string, true);
  
  try {
    // 预加载当前路由组件
    if (route.component && typeof route.component === "function") {
      route.component();
    }
    
    // 预加载子路由组件
    if (route.children && route.children.length) {
      route.children.forEach(childRoute => {
        if (childRoute.component && typeof childRoute.component === "function") {
          childRoute.component();
        }
      });
    }
  } catch (error) {
    console.error(`[路由预加载] 路由预加载失败: ${route.path}`, error);
  }
};

/** 预先添加错误页面路由，确保它们总是可用 */
function preAddErrorRoutes() {
  console.log("[路由] 预处理 - 添加错误页面路由");
  
  // 添加错误页面路由
  if (!router.hasRoute("Error")) {
    router.addRoute({
      path: "/error",
      name: "Error",
      component: () => import("@/layout/index.vue"),
      redirect: "/error/404",
      children: []
    } as RouteRecordRaw);
  }
  
  // 添加404路由
  if (!router.hasRoute("404")) {
    router.addRoute("Error", {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: "404页面"
      }
    } as RouteRecordRaw);
  }
  
  // 添加403路由
  if (!router.hasRoute("403")) {
    router.addRoute("Error", {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: "403页面"
      }
    } as RouteRecordRaw);
  }
  
  // 添加500路由
  if (!router.hasRoute("500")) {
    router.addRoute("Error", {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: "500页面"
      }
    } as RouteRecordRaw);
  }
  
  // 添加通配符路由
  if (!router.hasRoute("pathMatch")) {
    router.addRoute({
      path: "/:pathMatch(.*)",
      name: "pathMatch",
      redirect: "/error/404"
    } as RouteRecordRaw);
  }
  
  console.log("[路由] 预处理完成 - 错误页面路由已添加");
}

// 立即执行预处理
preAddErrorRoutes();

/** 添加路由初始化异常处理 */
function safeInitRouter() {
  console.log("[路由] 开始初始化路由");

  try {
    return initRouter().catch(error => {
      console.error("[路由] 初始化路由出错", error);
      console.log("[路由] 尝试恢复基本路由");
      
      // 确保至少有基本路由可用
      resetRouter();
      
      // 返回一个已解决的Promise，避免阻塞导航
      return Promise.resolve(router);
    });
  } catch (error) {
    console.error("[路由] 初始化路由过程中发生异常", error);
    return Promise.resolve(router);
  }
}

router.beforeEach((to: ToRouteType, _from, next) => {
  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  NProgress.start();
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      if (Title)
        document.title = `${transformI18n(item.meta.title)} | ${Title}`;
      else document.title = transformI18n(item.meta.title);
    });
  }
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    whiteList.includes(to.fullPath) ? next(_from.fullPath) : next();
  }
  if (Cookies.get(multipleTabsKey) && userInfo) {
    // 无权限跳转403页面
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.roles)) {
      next({ path: "/error/403" });
    }
    // 开启隐藏首页后在浏览器地址栏手动输入首页welcome路由则跳转到404页面
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/welcome") {
      next({ path: "/error/404" });
    }
    if (_from?.name) {
      // name为超链接
      if (externalLink) {
        openLink(to?.name as string);
        NProgress.done();
      } else {
        toCorrectRoute();
      }
    } else {
      // 刷新
      if (
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login"
      ) {
        console.log("[路由] 刷新页面，准备获取菜单", to.path);
        safeInitRouter().then((router: Router) => {
          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            try {
              const { path } = to;
              const route = findRouteByPath(
                path,
                router.options.routes[0]?.children || []
              );
              getTopMenu(true);
              // query、params模式路由传参数的标签页不在此处处理
              if (route && route.meta?.title) {
                if (isAllEmpty(route.parentId) && route.meta?.backstage) {
                  // 此处为动态顶级路由（目录）
                  if (route.children && route.children.length > 0) {
                    const { path, name, meta } = route.children[0];
                    useMultiTagsStoreHook().handleTags("push", {
                      path,
                      name,
                      meta
                    });
                  } else {
                    console.warn("[路由] 动态顶级路由没有子路由", route.path);
                  }
                } else {
                  const { path, name, meta } = route;
                  useMultiTagsStoreHook().handleTags("push", {
                    path,
                    name,
                    meta
                  });
                }
              }
            } catch (error) {
              console.error("[路由] 处理标签出错", error);
            }
          }
          // 确保动态路由完全加入路由列表并且不影响静态路由
          if (isAllEmpty(to.name)) router.push(to.fullPath);
        });
      }
      toCorrectRoute();
    }
  } else {
    if (to.path !== "/login") {
      if (whiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        removeToken();
        next({ path: "/login" });
      }
    } else {
      next();
    }
  }
  
  // 添加预加载逻辑 - 提前加载即将访问的路由的相关组件
  setTimeout(() => {
    try {
      const routes = usePermissionStoreHook().wholeMenus;
      
      // 预加载当前路由
      const currentRoute = routes.find(route => route.path === to.matched[0]?.path);
      preloadComponent(currentRoute);
      
      // 预加载侧边栏中可能访问的下一个路由组件
      if (currentRoute?.children?.length) {
        currentRoute.children.forEach(childRoute => {
          if (childRoute.path !== to.path) {
            preloadComponent(childRoute);
          }
        });
      }
    } catch (error) {
      console.error("[路由] 预加载组件出错", error);
    }
  }, 300);
});

router.afterEach(() => {
  NProgress.done();
});

export default router;

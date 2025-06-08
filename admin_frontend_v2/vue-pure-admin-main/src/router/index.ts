import "@/utils/sso";
import Cookies from "js-cookie";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { transformI18n } from "@/plugins/i18n";
import { buildHierarchyTree } from "@/utils/tree";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { ElMessage } from "element-plus";
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
  multipleTabsKey,
  TokenKey
} from "@/utils/auth";

// 导入预加载的关键组件
import { LoginPage, Error404Page, Error403Page, Error500Page } from "./utils";

// 导入业务相关的路由模块
import error from "./modules/error";

/** 原始静态路由（未做任何处理） */
const routes = [error];

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
);

/** 初始的静态路由，用于退出登录时重置路由 */
const initConstantRoutes: Array<RouteRecordRaw> = cloneDeep(constantRoutes);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity)
);

/** 创建路由实例 */
export const router: Router = createRouter({
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes,
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
  console.log("[路由] 重置路由");
  router.clearRoutes();
  usePermissionStoreHook().clearAllCachePage();
}

/** 路由白名单 */
const whiteList = ["/login", "/register"];

// 添加错误页面到白名单，避免未登录时访问错误页面导致循环重定向
const errorWhiteList = ["/error/404", "/error/403", "/error/500", "/error/route-error"];

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

  // 添加根路径重定向到登录页面
  if (!router.hasRoute("Root")) {
    router.addRoute({
      path: "/",
      name: "Root",
      redirect: "/login"
    } as RouteRecordRaw);
    console.log("[路由] 添加根路径重定向到登录页面");
  }

  // 添加登录路由，确保它总是可用
  if (!router.hasRoute("Login")) {
    router.addRoute({
      path: "/login",
      name: "Login",
      component: LoginPage,
      meta: {
        title: "登录"
      }
    } as RouteRecordRaw);
    console.log("[路由] 添加登录路由");
  }

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
      component: Error404Page,
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
      component: Error403Page,
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
      component: Error500Page,
      meta: {
        title: "500页面"
      }
    } as RouteRecordRaw);
  }

  // 添加通配符路由，放在最后添加
  if (!router.hasRoute("pathMatch")) {
    router.addRoute({
      path: "/:pathMatch(.*)",
      name: "pathMatch",
      redirect: "/error/404"
    } as RouteRecordRaw);
    console.log("[路由] 添加通配符路由，未匹配路径重定向到404");
  }

  console.log("[路由] 预处理完成 - 错误页面路由已添加");
  console.log("[路由] 当前所有路由:", router.getRoutes().map(r => r.path).join(', '));
}

// 立即执行预处理
preAddErrorRoutes();

/** 添加路由初始化异常处理 */
function safeInitRouter() {
  console.group("[路由守卫] 安全初始化路由");
  console.time("[路由守卫] 初始化路由耗时");
  console.log(`[路由守卫] 开始初始化路由时间: ${new Date().toLocaleString()}`);

  return initRouter()
    .then(result => {
      console.log("[路由守卫] 路由初始化成功");
      console.timeEnd("[路由守卫] 初始化路由耗时");
      console.groupEnd();
      return result;
    })
    .catch(error => {
      console.error("[路由守卫] 初始化路由出错", error);
      console.timeEnd("[路由守卫] 初始化路由耗时");
      console.groupEnd();

      ElMessage.error("路由初始化失败，请重新登录");

      // 路由初始化失败，清除登录状态（仅在token存在时）
      if (Cookies.get(TokenKey)) {
        removeToken();
      }

      // 重定向到路由错误页面
      router.push("/error/route-error");

      return Promise.reject(error);
    });
}

router.beforeEach((to: ToRouteType, _from, next) => {
  console.group("[路由守卫] 路由导航开始");
  console.time("[路由守卫] 导航耗时");
  console.log(`[路由守卫] 导航时间: ${new Date().toLocaleString()}`);
  console.log(`[路由守卫] 从: ${_from.path} -> 到: ${to.path}`);

  // 处理根路径，未登录时重定向到登录页
  if (to.path === "/" && !storageLocal().getItem<DataInfo<number>>(userKey)) {
    console.log("[路由守卫] 访问根路径且未登录，重定向到登录页");
    next("/login");
    console.timeEnd("[路由守卫] 导航耗时");
    console.groupEnd();
    return;
  }

  // 处理根路径，已登录时重定向到首页
  if (to.path === "/" && storageLocal().getItem<DataInfo<number>>(userKey)) {
    console.log("[路由守卫] 访问根路径且已登录，尝试获取菜单并导航");
    // 如果菜单已加载，直接导航到首页
    if (usePermissionStoreHook().wholeMenus.length > 0) {
      const topMenuPath = getTopMenu(true).path;
      console.log(`[路由守卫] 菜单已加载，导航到顶部菜单: ${topMenuPath}`);
      next(topMenuPath);
      console.timeEnd("[路由守卫] 导航耗时");
      console.groupEnd();
      return;
    }
    // 如果菜单未加载，需要重新初始化路由
    console.log("[路由守卫] 菜单未加载，需要重新初始化路由");
  }

  // 处理路由错误页面的特殊情况
  if (to.path === "/error/route-error") {
    console.log("[路由守卫] 导航到路由错误页面，直接放行");
    next();
    console.timeEnd("[路由守卫] 导航耗时");
    console.groupEnd();
    return;
  }

  if (to.meta?.keepAlive) {
    console.log("[路由守卫] 处理keepAlive路由");
    handleAliveRoute(to, "add");
  }

  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  console.log("[路由守卫] 当前用户信息:", userInfo ? "已登录" : "未登录");

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
    console.log(`[路由守卫] 设置页面标题: ${document.title}`);
  } else {
    console.log(`[路由守卫] 检测到外部链接: ${String(to?.name)}`);
  }

  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    if (whiteList.includes(to.fullPath)) {
      console.log(`[路由守卫] 已登录用户试图访问白名单路由 ${to.fullPath}，重定向到 ${_from.fullPath}`);
      next(_from.fullPath);
    } else {
      console.log(`[路由守卫] 正常导航到 ${to.fullPath}`);
      next();
    }
  }

  // 防止无限重定向
  if (to.path === "/login" && userInfo) {
    console.log("[路由守卫] 已登录用户试图访问登录页，重定向到首页");

    // 添加防止循环重定向的检测
    const redirectCount = sessionStorage.getItem("login_redirect_count") || "0";
    const count = parseInt(redirectCount) + 1;
    sessionStorage.setItem("login_redirect_count", count.toString());

    // 如果短时间内多次重定向，可能存在循环，清除登录状态并重新登录
    if (count > 3) {
      console.error("[路由守卫] 检测到可能的循环重定向，清除登录状态");
      removeToken();
      sessionStorage.removeItem("login_redirect_count");
      next("/login");
      console.timeEnd("[路由守卫] 导航耗时");
      console.groupEnd();
      return;
    }

    // 检查是否有菜单，如果没有菜单但声称已登录，可能是状态不一致
    if (usePermissionStoreHook().wholeMenus.length === 0) {
      console.warn("[路由守卫] 用户已登录但没有菜单，可能状态不一致，重置状态");
      removeToken();
      next("/login");
      console.timeEnd("[路由守卫] 导航耗时");
      console.groupEnd();
      return;
    }

    // 正常情况，重定向到首页
    next("/");

    // 5秒后重置计数器
    setTimeout(() => {
      sessionStorage.removeItem("login_redirect_count");
    }, 5000);

    console.timeEnd("[路由守卫] 导航耗时");
    console.groupEnd();
    return;
  }

  // 在其他导航中重置重定向计数器
  if (to.path !== "/login" && to.path !== "/") {
    sessionStorage.removeItem("login_redirect_count");
  }

  if (Cookies.get(multipleTabsKey) && userInfo) {
    console.log("[路由守卫] 已登录状态，检查权限");

    // 无权限跳转403页面
    // if (to.meta?.roles && !isOneOfArray(to.meta?.roles, Array.isArray(userInfo?.roles) ? userInfo.roles : [])) {
    //   console.warn(`[路由守卫] 用户无权限访问 ${to.path}，角色不匹配，重定向到403页面`);
    //   console.log(`[路由守卫] 路由需要角色: ${JSON.stringify(to.meta?.roles)}, 用户角色: ${JSON.stringify(userInfo?.roles)}`);
    //   next({ path: "/error/403" });
    //   console.timeEnd("[路由守卫] 导航耗时");
    //   console.groupEnd();
    //   return;
    // }

    if (_from?.name) {
      // name为超链接
      if (externalLink) {
        console.log(`[路由守卫] 打开外部链接: ${String(to?.name)}`);
        openLink(to?.name as string);
        NProgress.done();
        console.timeEnd("[路由守卫] 导航耗时");
        console.groupEnd();
      } else {
        console.log(`[路由守卫] 正常导航 (非首次访问)`);
        toCorrectRoute();
        console.timeEnd("[路由守卫] 导航耗时");
        console.groupEnd();
      }
    } else {
      // 刷新
      if (
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login" &&
        to.path !== "/error/route-error"
      ) {
        console.log("[路由守卫] 检测到页面刷新，菜单为空，准备重新获取路由");

        // 添加防止无限刷新的标记
        const refreshFlag = sessionStorage.getItem("router_refresh_flag");
        const currentTime = Date.now();
        const lastRefreshTime = refreshFlag ? parseInt(refreshFlag) : 0;

        // 增强防刷新机制：如果距离上次刷新时间小于3秒，则不再刷新
        if (currentTime - lastRefreshTime < 3000) {
          console.warn("[路由守卫] 检测到短时间内多次刷新，可能存在循环，跳过路由初始化");
          // 直接放行，避免刷新
          next();
          console.timeEnd("[路由守卫] 导航耗时");
          console.groupEnd();
          return;
        }

        // 记录本次刷新时间
        sessionStorage.setItem("router_refresh_flag", currentTime.toString());

        // 添加刷新计数器，避免短时间内多次初始化路由
        const refreshCount = sessionStorage.getItem("router_refresh_count") || "0";
        const count = parseInt(refreshCount) + 1;
        sessionStorage.setItem("router_refresh_count", count.toString());
        console.log(`[路由守卫] 刷新计数: ${count}`);

        // 如果刷新次数过多，直接放行避免可能的无限循环
        if (count > 3) {
          console.warn("[路由守卫] 检测到短时间内多次初始化路由，可能存在问题，跳过路由初始化");
          // 重置计数器
          setTimeout(() => {
            sessionStorage.setItem("router_refresh_count", "0");
          }, 5000);
          // 强制重定向到登录页，中断可能的循环
          removeToken();
          next("/login");
          console.timeEnd("[路由守卫] 导航耗时");
          console.groupEnd();
          return;
        }

        // 设置超时保护，防止API请求卡死
        const timeoutId = setTimeout(() => {
          console.error("[路由守卫] 路由初始化超时，重定向到登录页");
          if (Cookies.get(TokenKey)) {
            removeToken();
          }
          next("/login");
          console.timeEnd("[路由守卫] 导航耗时");
          console.groupEnd();
        }, 10000); // 10秒超时

        safeInitRouter().then((router: Router) => {
          clearTimeout(timeoutId);
          console.log("[路由守卫] 路由初始化成功，继续导航流程");

          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            try {
              console.log("[路由守卫] 处理标签页");
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
                    console.log(`[路由守卫] 添加顶级路由子路由标签: ${path}`);
                    useMultiTagsStoreHook().handleTags("push", {
                      path,
                      name,
                      meta
                    });
                  } else {
                    console.warn("[路由守卫] 动态顶级路由没有子路由", route.path);
                  }
                } else {
                  const { path, name, meta } = route;
                  console.log(`[路由守卫] 添加普通路由标签: ${path}`);
                  useMultiTagsStoreHook().handleTags("push", {
                    path,
                    name,
                    meta
                  });
                }
              }
            } catch (error) {
              console.error("[路由守卫] 处理标签出错", error);
            }
          }
          // 确保动态路由完全加入路由列表并且不影响静态路由
          if (isAllEmpty(to.name)) {
            console.log("[路由守卫] 路由名称为空，重定向到", to.fullPath);
            router.push(to.fullPath);
            console.timeEnd("[路由守卫] 导航耗时");
            console.groupEnd();
          } else {
            console.log("[路由守卫] 路由名称存在，正常导航");
            next();
            console.timeEnd("[路由守卫] 导航耗时");
            console.groupEnd();
          }
        }).catch(() => {
          console.timeEnd("[路由守卫] 导航耗时");
          console.groupEnd();
        });
      } else {
        console.log("[路由守卫] 正常导航 (首次访问或已有菜单)");
        toCorrectRoute();
        console.timeEnd("[路由守卫] 导航耗时");
        console.groupEnd();
      }
    }
  } else {
    console.log("[路由守卫] 检查是否为白名单路由");
    // 检查是否为白名单路由或错误页面
    if (whiteList.indexOf(to.path) !== -1 || errorWhiteList.indexOf(to.path) !== -1) {
      console.log(`[路由守卫] 访问白名单路由或错误页面 ${to.path}，直接放行`);
      next();
      console.timeEnd("[路由守卫] 导航耗时");
      console.groupEnd();
    } else {
      console.log(`[路由守卫] 未登录，重定向到登录页，原路径: ${to.path}`);
      next({
        path: "/login",
        query: { redirect: to.fullPath }
      });
      NProgress.done();
      console.timeEnd("[路由守卫] 导航耗时");
      console.groupEnd();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;

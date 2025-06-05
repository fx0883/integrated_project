import {
  type RouterHistory,
  type RouteRecordRaw,
  type RouteComponent,
  createWebHistory,
  createWebHashHistory
} from "vue-router";
import { router } from "./index";
import { isProxy, toRaw } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import {
  isString,
  cloneDeep,
  isAllEmpty,
  intersection,
  storageLocal,
  isIncludeAllChildren
} from "@pureadmin/utils";
import { getConfig } from "@/config";
import { buildHierarchyTree } from "@/utils/tree";
import { userKey, type DataInfo } from "@/utils/auth";
import { type menuType, routerArrays } from "@/layout/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
const IFrame = () => import("@/layout/frame.vue");
// https://cn.vitejs.dev/guide/features.html#glob-import
const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");

// 动态路由
import { getAsyncRoutes } from "@/api/routes";

function handRank(routeInfo: any) {
  const { name, path, parentId, meta } = routeInfo;
  return isAllEmpty(parentId)
    ? isAllEmpty(meta?.rank) ||
      (meta?.rank === 0 && name !== "Home" && path !== "/")
      ? true
      : false
    : false;
}

/** 按照路由中meta下的rank等级升序来排序路由 */
function ascending(arr: any[]) {
  arr.forEach((v, index) => {
    // 当rank不存在时，根据顺序自动创建，首页路由永远在第一位
    if (handRank(v)) v.meta.rank = index + 2;
  });
  return arr.sort(
    (a: { meta: { rank: number } }, b: { meta: { rank: number } }) => {
      return a?.meta.rank - b?.meta.rank;
    }
  );
}

/** 过滤meta中showLink为false的菜单 */
function filterTree(data: RouteComponent[]) {
  const newTree = cloneDeep(data).filter(
    (v: { meta: { showLink: boolean } }) => v.meta?.showLink !== false
  );
  newTree.forEach(
    (v: { children }) => v.children && (v.children = filterTree(v.children))
  );
  return newTree;
}

/** 过滤children长度为0的的目录，当目录下没有菜单时，会过滤此目录，目录没有赋予roles权限，当目录下只要有一个菜单有显示权限，那么此目录就会显示 */
function filterChildrenTree(data: RouteComponent[]) {
  const newTree = cloneDeep(data).filter((v: any) => v?.children?.length !== 0);
  newTree.forEach(
    (v: { children }) => v.children && (v.children = filterTree(v.children))
  );
  return newTree;
}

/** 判断两个数组彼此是否存在相同值 */
function isOneOfArray(a: Array<string>, b: Array<string>) {
  return Array.isArray(a) && Array.isArray(b)
    ? intersection(a, b).length > 0
      ? true
      : false
    : true;
}

/** 从localStorage里取出当前登录用户的角色roles，过滤无权限的菜单 */
function filterNoPermissionTree(data: RouteComponent[]) {
  const currentRoles =
    storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [];
  const newTree = cloneDeep(data).filter((v: any) =>
    isOneOfArray(v.meta?.roles, currentRoles)
  );
  newTree.forEach(
    (v: any) => v.children && (v.children = filterNoPermissionTree(v.children))
  );
  return filterChildrenTree(newTree);
}

/** 通过指定 `key` 获取父级路径集合，默认 `key` 为 `path` */
function getParentPaths(value: string, routes: RouteRecordRaw[], key = "path") {
  // 深度遍历查找
  function dfs(routes: RouteRecordRaw[], value: string, parents: string[]) {
    for (let i = 0; i < routes.length; i++) {
      const item = routes[i];
      // 返回父级path
      if (item[key] === value) return parents;
      // children不存在或为空则不递归
      if (!item.children || !item.children.length) continue;
      // 往下查找时将当前path入栈
      parents.push(item.path);

      if (dfs(item.children, value, parents).length) return parents;
      // 深度遍历查找未找到时当前path 出栈
      parents.pop();
    }
    // 未找到时返回空数组
    return [];
  }

  return dfs(routes, value, []);
}

/** 查找对应 `path` 的路由信息 */
function findRouteByPath(path: string, routes: RouteRecordRaw[]) {
  let res = routes.find((item: { path: string }) => item.path == path);
  if (res) {
    return isProxy(res) ? toRaw(res) : res;
  } else {
    for (let i = 0; i < routes.length; i++) {
      if (
        routes[i].children instanceof Array &&
        routes[i].children.length > 0
      ) {
        res = findRouteByPath(path, routes[i].children);
        if (res) {
          return isProxy(res) ? toRaw(res) : res;
        }
      }
    }
    return null;
  }
}

function addPathMatch() {
  if (!router.hasRoute("pathMatch")) {
    router.addRoute({
      path: "/:pathMatch(.*)",
      name: "pathMatch",
      redirect: "/error/404"
    });
  }
}

/** 处理动态路由（后端返回的路由） */
function handleAsyncRoutes(routeList) {
  if (routeList.length === 0) {
    usePermissionStoreHook().handleWholeMenus(routeList);
  } else {
    // 确保router.options.routes存在
    if (!router.options.routes || router.options.routes.length === 0) {
      console.warn("[路由警告] router.options.routes为空");
      // 创建一个新的路由对象并添加到router中
      const mainRoute = {
        path: "/",
        name: "Root",
        component: () => import("@/layout/index.vue"),
        children: []
      };
      router.addRoute(mainRoute);
      // 手动更新router.options.routes
      // @ts-ignore - 忽略TypeScript类型检查，因为我们需要修改只读属性
      router.options.routes = [mainRoute];
    }
    
    // 确保router.options.routes[0]存在
    if (!router.options.routes[0]) {
      console.warn("[路由警告] router.options.routes[0]不存在");
      const mainRoute = {
        path: "/",
        name: "Root",
        component: () => import("@/layout/index.vue"),
        children: []
      };
      router.addRoute(mainRoute);
      // @ts-ignore - 忽略TypeScript类型检查
      router.options.routes[0] = mainRoute;
    }
    
    // 确保children数组存在
    if (!router.options.routes[0].children) {
      console.warn("[路由警告] router.options.routes[0].children不存在，已自动创建");
      // @ts-ignore - 忽略TypeScript类型检查
      router.options.routes[0].children = [];
    }

    formatFlatteningRoutes(addAsyncRoutes(routeList)).map(
      (v: RouteRecordRaw) => {
        // 防止重复添加路由
        if (
          router.options.routes[0].children.findIndex(
            value => value.path === v.path
          ) !== -1
        ) {
          return;
        } else {
          // 切记将路由push到routes后还需要使用addRoute，这样路由才能正常跳转
          // @ts-ignore - 忽略TypeScript类型检查
          router.options.routes[0].children.push(v);
          // 最终路由进行升序
          // @ts-ignore - 忽略TypeScript类型检查
          ascending(router.options.routes[0].children);
          if (!router.hasRoute(v?.name)) router.addRoute(v);
          const flattenRouters: any = router
            .getRoutes()
            .find(n => n.path === "/");
          // 保持router.options.routes[0].children与path为"/"的children一致，防止数据不一致导致异常
          if (flattenRouters) {
            flattenRouters.children = router.options.routes[0].children;
            router.addRoute(flattenRouters);
          } else {
            console.warn("[路由警告] 找不到路径为'/'的路由");
          }
        }
      }
    );
    usePermissionStoreHook().handleWholeMenus(routeList);
  }
  if (!useMultiTagsStoreHook().getMultiTagsCache) {
    useMultiTagsStoreHook().handleTags("equal", [
      ...routerArrays,
      ...usePermissionStoreHook().flatteningRoutes.filter(
        v => v?.meta?.fixedTag
      )
    ]);
  }
  addPathMatch();
}

/** 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）*/
function initRouter() {
  if (getConfig()?.CachingAsyncRoutes) {
    // 开启动态路由缓存本地localStorage
    const key = "async-routes";
    const asyncRouteList = storageLocal().getItem(key) as any;
    if (asyncRouteList && asyncRouteList?.length > 0) {
      return new Promise(resolve => {
        handleAsyncRoutes(asyncRouteList);
        resolve(router);
      });
    } else {
      return new Promise(resolve => {
        getAsyncRoutes().then(({ data }) => {
          handleAsyncRoutes(cloneDeep(data));
          storageLocal().setItem(key, data);
          resolve(router);
        });
      });
    }
  } else {
    return new Promise(resolve => {
      getAsyncRoutes().then(({ data }) => {
        handleAsyncRoutes(cloneDeep(data));
        resolve(router);
      });
    });
  }
}

/**
 * 将多级嵌套路由处理成一维数组
 * @param routesList 传入路由
 * @returns 返回处理后的一维路由
 */
function formatFlatteningRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  let hierarchyList = buildHierarchyTree(routesList);
  for (let i = 0; i < hierarchyList.length; i++) {
    if (hierarchyList[i].children) {
      hierarchyList = hierarchyList
        .slice(0, i + 1)
        .concat(hierarchyList[i].children, hierarchyList.slice(i + 1));
    }
  }
  return hierarchyList;
}

/**
 * 一维数组处理成多级嵌套数组（三级及以上的路由全部拍成二级，keep-alive 只支持到二级缓存）
 * https://github.com/pure-admin/vue-pure-admin/issues/67
 * @param routesList 处理后的一维路由菜单数组
 * @returns 返回将一维数组重新处理成规定路由的格式
 */
function formatTwoStageRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  const newRoutesList: RouteRecordRaw[] = [];
  routesList.forEach((v: RouteRecordRaw) => {
    if (v.path === "/") {
      newRoutesList.push({
        component: v.component,
        name: v.name,
        path: v.path,
        redirect: v.redirect,
        meta: v.meta,
        children: []
      });
    } else {
      newRoutesList[0]?.children.push({ ...v });
    }
  });
  return newRoutesList;
}

/** 处理缓存路由（添加、删除、刷新） */
function handleAliveRoute({ name }: ToRouteType, mode?: string) {
  switch (mode) {
    case "add":
      usePermissionStoreHook().cacheOperate({
        mode: "add",
        name
      });
      break;
    case "delete":
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name
      });
      break;
    case "refresh":
      usePermissionStoreHook().cacheOperate({
        mode: "refresh",
        name
      });
      break;
    default:
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name
      });
      useTimeoutFn(() => {
        usePermissionStoreHook().cacheOperate({
          mode: "add",
          name
        });
      }, 100);
  }
}

/**
 * 添加日志函数
 * @param message 日志信息
 */
function routeLog(message: string, ...args: any[]): void {
  const enable = import.meta.env.VITE_DEBUG_ROUTE || false;
  if (enable) {
    console.log(`[路由处理] ${message}`, ...args);
  }
}

/**
 * 检测并防止循环依赖
 */
function detectCircularRoutes(routes: any[], path: string[] = []): boolean {
  if (!routes || routes.length === 0) return false;
  
  for (const route of routes) {
    if (!route) continue;
    
    const routePath = route.path || route.name || 'unnamed';
    const currentPath = [...path, routePath];
    
    // 检查是否存在循环引用
    if (path.includes(routePath)) {
      console.error(`检测到路由循环引用: ${currentPath.join(' -> ')}`);
      return true;
    }
    
    // 检查子路由
    if (route.children && route.children.length > 0) {
      if (detectCircularRoutes(route.children, currentPath)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 安全处理路由配置
 * @param fn 路由处理函数
 * @returns 包装后的安全函数
 */
function safeRouteHandler<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    try {
      routeLog(`调用函数 ${fn.name || 'anonymous'}`);
      return fn.apply(null, args);
    } catch (error) {
      console.error(`路由处理函数 ${fn.name || 'anonymous'} 执行失败:`, error);
      // 返回一个安全的默认值
      if (fn.name === 'addAsyncRoutes') return [];
      return null;
    }
  }) as unknown as T;
}

// 安全包装路由处理函数
const originalAddAsyncRoutes = addAsyncRoutes;
addAsyncRoutes = safeRouteHandler(addAsyncRoutes);

// 在处理路由配置之前检查是否存在循环引用
const originalFlatMultiLevelRoutes = flatMultiLevelRoutes;
flatMultiLevelRoutes = (routes: any) => {
  routeLog("检查路由配置是否存在循环引用");
  if (detectCircularRoutes(routes)) {
    console.error("路由配置中存在循环引用，这可能导致堆栈溢出");
  }
  try {
    return originalFlatMultiLevelRoutes(routes);
  } catch (error) {
    console.error("展平多级路由失败:", error);
    return routes; // 返回原始路由，保证应用不崩溃
  }
};

/** 获取路由历史模式 https://next.router.vuejs.org/zh/guide/essentials/history-mode.html */
function getHistoryMode(routerHistory): RouterHistory {
  // len为1 代表只有历史模式 为2 代表历史模式中存在base参数 https://next.router.vuejs.org/zh/api/#%E5%8F%82%E6%95%B0-1
  const historyMode = routerHistory.split(",");
  const leftMode = historyMode[0];
  const rightMode = historyMode[1];
  // no param
  if (historyMode.length === 1) {
    if (leftMode === "hash") {
      return createWebHashHistory("");
    } else if (leftMode === "h5") {
      return createWebHistory("");
    }
  } //has param
  else if (historyMode.length === 2) {
    if (leftMode === "hash") {
      return createWebHashHistory(rightMode);
    } else if (leftMode === "h5") {
      return createWebHistory(rightMode);
    }
  }
}

/** 获取当前页面按钮级别的权限 */
function getAuths(): Array<string> {
  return router.currentRoute.value.meta.auths as Array<string>;
}

/** 是否有按钮级别的权限（根据路由`meta`中的`auths`字段进行判断）*/
function hasAuth(value: string | Array<string>): boolean {
  if (!value) return false;
  /** 从当前路由的`meta`字段里获取按钮级别的所有自定义`code`值 */
  const metaAuths = getAuths();
  if (!metaAuths) return false;
  const isAuths = isString(value)
    ? metaAuths.includes(value)
    : isIncludeAllChildren(value, metaAuths);
  return isAuths ? true : false;
}

function handleTopMenu(route) {
  if (route?.children && route.children.length > 1) {
    if (route.redirect) {
      return route.children.filter(cur => cur.path === route.redirect)[0];
    } else {
      return route.children[0];
    }
  } else {
    return route;
  }
}

/** 获取所有菜单中的第一个菜单（顶级菜单）*/
function getTopMenu(tag = false): menuType {
  const topMenu = handleTopMenu(
    usePermissionStoreHook().wholeMenus[0]?.children[0]
  );
  tag && useMultiTagsStoreHook().handleTags("push", topMenu);
  return topMenu;
}

export {
  hasAuth,
  getAuths,
  ascending,
  filterTree,
  initRouter,
  getTopMenu,
  addPathMatch,
  isOneOfArray,
  getHistoryMode,
  addAsyncRoutes,
  getParentPaths,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes,
  filterNoPermissionTree
};

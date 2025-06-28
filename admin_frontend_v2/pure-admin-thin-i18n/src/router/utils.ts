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
import { buildHierarchyTree } from "@/utils/tree";
import { userKey, type DataInfo } from "@/utils/auth";
import { type menuType, routerArrays } from "@/layout/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { getConfig } from "@/config";
import { findIndex } from "lodash-unified";
import { remainingPaths } from "./index";
import { openLink } from "@/utils/link";
import { transformI18n } from "@/plugins/i18n";
import type { ToRouteType } from "./types";
import logger from "@/utils/logger";
const IFrame = () => import("@/layout/frame.vue");
// https://cn.vitejs.dev/guide/features.html#glob-import
const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");
logger.debug(
  "[路由组件] 已导入的模块路由数量:",
  Object.keys(modulesRoutes).length
);
logger.debug(
  "[路由组件] 已导入的模块路由关键路径示例:",
  Object.keys(modulesRoutes).slice(0, 10)
);

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
  logger.debug("[处理动态路由] 开始处理动态路由列表");
  if (routeList.length === 0) {
    logger.debug("[处理动态路由] 路由列表为空");
    usePermissionStoreHook().handleWholeMenus(routeList);
  } else {
    logger.debug("[处理动态路由] 处理前的路由列表:", JSON.stringify(routeList));
    const processedRoutes = formatFlatteningRoutes(addAsyncRoutes(routeList));
    logger.debug("[处理动态路由] 处理后的扁平化路由:", processedRoutes);

    processedRoutes.map((v: RouteRecordRaw) => {
      // 防止重复添加路由
      if (
        router.options.routes[0].children.findIndex(
          value => value.path === v.path
        ) !== -1
      ) {
        logger.debug(`[处理动态路由] 路由已存在，跳过添加: ${v.path}`);
        return;
      } else {
        logger.debug(`[处理动态路由] 添加新路由: ${v.path}`);
        // 切记将路由push到routes后还需要使用addRoute，这样路由才能正常跳转
        router.options.routes[0].children.push(v);
        // 最终路由进行升序
        ascending(router.options.routes[0].children);
        if (!router.hasRoute(v?.name)) {
          logger.debug(`[处理动态路由] 向Vue Router添加路由: ${v.name}`);
          router.addRoute(v);
        }
        const flattenRouters: any = router
          .getRoutes()
          .find(n => n.path === "/");
        // 保持router.options.routes[0].children与path为"/"的children一致，防止数据不一致导致异常
        flattenRouters.children = router.options.routes[0].children;
        router.addRoute(flattenRouters);
      }
    });
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
  logger.debug(
    "[处理动态路由] 所有路由处理完毕，当前路由列表:",
    router.getRoutes()
  );
}

/** 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）*/
function initRouter() {
  logger.debug("[路由初始化] 开始初始化路由");
  return new Promise(resolve => {
    getAsyncRoutes().then(({ data }) => {
      logger.debug("[路由初始化] 获取到动态路由数据:", data);
      handleAsyncRoutes(cloneDeep(data));
      logger.debug("[路由初始化] 路由处理完成");
      resolve(router);
    });
  });
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

/** 过滤后端传来的动态路由 重新生成规范路由 */
function addAsyncRoutes(arrRoutes: Array<RouteRecordRaw>) {
  logger.debug("[处理异步路由] 开始处理异步路由组件");
  if (!arrRoutes || !arrRoutes.length) {
    logger.debug("[处理异步路由] 路由数组为空");
    return;
  }
  const modulesRoutesKeys = Object.keys(modulesRoutes);
  logger.debug("[处理异步路由] 可用的模块路由列表:", modulesRoutesKeys);

  arrRoutes.forEach((v: RouteRecordRaw) => {
    // 详细输出路由对象信息
    logger.debug(`[处理异步路由] 处理路由详情:`, {
      path: v.path,
      name: v.name,
      component: v.component
    });

    // 输出原始的component值类型和内容
    logger.debug(`[处理异步路由] component类型: ${typeof v.component}`);
    logger.debug(`[处理异步路由] component内容:`, String(v.component || ""));

    // 将backstage属性加入meta，标识此路由为后端返回路由
    v.meta.backstage = true;

    // 父级的redirect属性取值：优先选择showLink为true的第一个子路由作为重定向目标
    if (v?.children && v.children.length && !v.redirect) {
      // 查找showLink为true的第一个子路由
      const visibleChild = v.children.find(
        child => child.meta?.showLink === true
      );
      // 如果存在可见子路由，则重定向到它；否则保持原来的逻辑，使用第一个子路由
      v.redirect = visibleChild ? visibleChild.path : v.children[0].path;
      logger.debug(`[处理异步路由] 设置重定向: ${v.path} -> ${v.redirect}`);
    }

    // 父级的name属性取值：如果子级存在且父级的name属性不存在，默认取第一个子级的name
    if (v?.children && v.children.length && !v.name) {
      v.name = (v.children[0].name as string) + "Parent";
      logger.debug(`[处理异步路由] 设置父级名称: ${v.path} -> ${v.name}`);
    }

    if (v.meta?.frameSrc) {
      logger.debug(`[处理异步路由] 使用IFrame作为组件: ${v.path}`);
      v.component = IFrame;
    } else {
      // 对后端传component组件路径和不传做兼容（如果后端传component组件路径，那么path可以随便写，如果不传，component组件路径会跟path保持一致）
      const searchKey = v?.component || v.path;
      logger.debug(`[处理异步路由] 查找组件匹配: ${searchKey}`);

      let exactMatch = null;

      if (v?.component) {
        logger.debug(`[处理异步路由] 使用component进行查找: ${v.component}`);

        // 只使用精确匹配
        exactMatch = modulesRoutesKeys.find(ev => ev === String(v.component));

        if (exactMatch) {
          logger.debug(`[处理异步路由] 找到精确匹配组件: ${exactMatch}`);
        } else {
          logger.debug(
            `[处理异步路由] 警告: 未找到组件的精确匹配: ${v.component}`
          );

          // 尝试添加扩展名进行匹配
          const withVueExt = String(v.component) + ".vue";
          const withTsxExt = String(v.component) + ".tsx";

          exactMatch = modulesRoutesKeys.find(
            ev => ev === withVueExt || ev === withTsxExt
          );

          if (exactMatch) {
            logger.debug(
              `[处理异步路由] 找到带扩展名的精确匹配组件: ${exactMatch}`
            );
          } else {
            logger.debug(`[处理异步路由] 警告: 即使添加扩展名也未找到精确匹配`);
          }
        }
      } else {
        logger.debug(`[处理异步路由] 使用path进行查找: ${v.path}`);

        // 对path也只使用精确匹配
        exactMatch = modulesRoutesKeys.find(ev => ev === v.path);

        if (exactMatch) {
          logger.debug(`[处理异步路由] 找到精确匹配组件: ${exactMatch}`);
        } else {
          logger.debug(`[处理异步路由] 警告: 未找到路径的精确匹配: ${v.path}`);

          // 尝试添加扩展名进行匹配
          const withVueExt = v.path + ".vue";
          const withTsxExt = v.path + ".tsx";

          exactMatch = modulesRoutesKeys.find(
            ev => ev === withVueExt || ev === withTsxExt
          );

          if (exactMatch) {
            logger.debug(
              `[处理异步路由] 找到带扩展名的精确匹配组件: ${exactMatch}`
            );
          } else {
            logger.debug(`[处理异步路由] 警告: 即使添加扩展名也未找到精确匹配`);
          }
        }
      }

      // 使用找到的精确匹配设置组件，如果没有找到则设置为null
      if (exactMatch) {
        const originalComponent = v.component;
        v.component = modulesRoutes[exactMatch];
        logger.debug(
          `[处理异步路由] 组件替换前类型: ${typeof originalComponent}`
        );
        logger.debug(`[处理异步路由] 组件替换后类型: ${typeof v.component}`);
        logger.debug(
          `[处理异步路由] 组件替换: ${originalComponent} -> ${exactMatch}`
        );
      } else {
        logger.debug(
          `[处理异步路由] 警告: 未找到匹配组件: ${searchKey}，设置为null`
        );
        v.component = null;
      }
    }

    if (v?.children && v.children.length) {
      logger.debug(
        `[处理异步路由] 处理子路由: ${v.path}, 数量: ${v.children.length}`
      );
      v.children = addAsyncRoutes(v.children);
    }
  });
  return arrRoutes;
}

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

import "@/utils/sso";
import { getConfig } from "@/config";
import { message } from "@/utils/message";
import { ElMessage } from "element-plus";
import { getAsyncRoutes } from "@/api/routes";
import { transformI18n } from "@/plugins/i18n";
import { buildHierarchyTree } from "@/utils/tree";
import { useTimeoutFn } from "@vueuse/core";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { routerArrays } from "@/layout/types";
import {
  isUrl,
  storageLocal,
  isAllEmpty,
  cloneDeep,
  intersection,
  isString,
  isIncludeAllChildren
} from "@pureadmin/utils";
import {
  Router,
  RouteRecordRaw,
  RouteComponent,
  RouteRecordName,
  createRouter,
  RouteRecordNormalized,
  createWebHistory,
  createWebHashHistory,
  RouterHistory
} from "vue-router";
import { computed, isProxy, toRaw } from "vue";
import { router } from "./index";
import { userKey, type DataInfo } from "@/utils/auth";
import { type menuType } from "@/layout/types";
import { resetRouter } from "./index";

const IFrame = () => import("@/layout/frame.vue");
// https://cn.vitejs.dev/guide/features.html#glob-import
const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");

// 明确预加载关键路由组件，确保它们总是可用
const LoginPage = () => import(/* webpackChunkName: "login" */ "@/views/login/index.vue");
const Error404Page = () => import(/* webpackChunkName: "error404" */ "@/views/error/404.vue");
const Error403Page = () => import(/* webpackChunkName: "error403" */ "@/views/error/403.vue");
const Error500Page = () => import(/* webpackChunkName: "error500" */ "@/views/error/500.vue");

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
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const currentRoles = Array.isArray(userInfo?.roles) ? userInfo.roles : [];
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
  
  // 检查404路由是否存在
  if (!router.hasRoute("404")) {
    console.log("[路由] 添加404路由");
    
    // 先添加错误页面路由
    if (!router.hasRoute("Error")) {
      router.addRoute({
        path: "/error",
        name: "Error",
        component: () => import("@/layout/index.vue"),
        redirect: "/error/404",
        children: []
      });
    }
    
    // 再添加404子路由
    router.addRoute("Error", {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: "404页面"
      }
    });
  }
  
  // 确保错误页面路由存在
  if (!router.hasRoute("403")) {
    console.log("[路由] 添加403路由");
    
    // 添加403子路由
    router.addRoute("Error", {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: "403页面"
      }
    });
  }
}

/** 处理后端返回的动态路由 */
function handleAsyncRoutes(routeList) {
  console.group("[路由处理] 开始处理动态路由");
  console.time("[路由处理] 总耗时");
  console.log(`[路由处理] 开始时间: ${new Date().toLocaleString()}`);
  console.log("[路由处理] 路由列表数量:", routeList ? routeList.length : 0);
  
  if (!routeList || !routeList.length) {
    console.warn("[路由处理] 动态路由列表为空");
    console.timeEnd("[路由处理] 总耗时");
    console.groupEnd();
    throw new Error("动态路由列表为空");
  }
  
  try {
    // 处理路由数据，确保符合格式要求
    console.log("[路由处理] 开始转换路由格式");
    console.time("[路由处理] 路由格式转换耗时");
    
    const asyncRouteList = addAsyncRoutes(routeList);
    
    console.timeEnd("[路由处理] 路由格式转换耗时");
    console.log("[路由处理] 转换后的路由数量:", asyncRouteList ? asyncRouteList.length : 0);
    
    if (!asyncRouteList || asyncRouteList.length === 0) {
      console.error("[路由处理] 处理后的动态路由列表为空");
      console.timeEnd("[路由处理] 总耗时");
      console.groupEnd();
      throw new Error("处理后的动态路由列表为空");
    }
    
    // 扁平化路由，方便查找和处理
    console.time("[路由处理] 扁平化路由耗时");
    const flattenedRoutes = formatFlatteningRoutes(asyncRouteList);
    console.timeEnd("[路由处理] 扁平化路由耗时");
    console.log("[路由处理] 扁平化后的路由数量:", flattenedRoutes.length);
    
    // 查找首页路由
    const dashboardRoute = flattenedRoutes.find(route => 
      route.name === 'DashboardIndex' || 
      route.path.includes('/dashboard/index')
    );
    
    // 如果找到首页路由，将其添加到routerArrays中
    if (dashboardRoute) {
      console.log("[路由处理] 找到首页路由，添加到routerArrays:", dashboardRoute.path);
      
      // 清空routerArrays，确保只有一个首页标签
      routerArrays.length = 0;
      
      // 添加首页路由到routerArrays
      routerArrays.push({
        path: dashboardRoute.path,
        name: dashboardRoute.name,
        meta: dashboardRoute.meta
      });
      
      console.log("[路由处理] routerArrays更新完成:", routerArrays);
    } else {
      console.warn("[路由处理] 未找到首页路由，无法添加首页标签");
    }
    
    // 注册路由
    console.time("[路由处理] 路由注册耗时");
    let addedCount = 0;
    asyncRouteList.forEach(route => {
      // 检查路由是否已存在
      if (route.name && router.hasRoute(route.name)) {
        console.log(`[路由处理] 路由已存在，跳过添加: ${String(route.name)}`);
        return;
      }
      
      try {
        // 确保路由组件已设置
        if (route.name === 'Dashboard' && typeof route.component !== 'function') {
          console.log("[路由处理] 设置Dashboard路由组件");
          route.component = () => import("@/layout/index.vue");
        }
        
        // 添加路由
        router.addRoute(route);
        addedCount++;
        console.log(`[路由处理] 成功添加路由: ${route.name ? String(route.name) : route.path}`);
      } catch (error) {
        console.error(`[路由处理] 添加路由失败: ${route.name ? String(route.name) : route.path}`, error);
      }
    });
    console.timeEnd("[路由处理] 路由注册耗时");
    
    console.log(`[路由处理] 成功添加${addedCount}个路由`);
    
    if (addedCount === 0) {
      console.error("[路由处理] 没有成功添加任何路由");
      console.timeEnd("[路由处理] 总耗时");
      console.groupEnd();
      throw new Error("没有成功添加任何路由");
    }
    
    // 更新状态
    console.time("[路由处理] 更新菜单状态耗时");
    usePermissionStoreHook().handleWholeMenus(asyncRouteList);
    console.timeEnd("[路由处理] 更新菜单状态耗时");
    
    // 确保添加了通配符路由
    console.time("[路由处理] 添加通配符路由耗时");
    addPathMatch();
    console.timeEnd("[路由处理] 添加通配符路由耗时");
    
    console.log("[路由处理] 路由处理完成");
    
    // 输出当前所有路由
    console.log("[路由处理] 当前所有路由数量:", router.getRoutes().length);
    console.timeEnd("[路由处理] 总耗时");
    console.groupEnd();
  } catch (error) {
    console.error("[路由处理] 处理动态路由时出错:", error);
    console.timeEnd("[路由处理] 总耗时");
    console.groupEnd();
    throw error;
  }
}

/** 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）*/
function initRouter() {
  console.group("[路由初始化] 开始初始化路由");
  console.time("[路由初始化] 总耗时");
  console.log(`[路由初始化] 开始时间: ${new Date().toLocaleString()}`);
  
  return new Promise((resolve, reject) => {
    try {
      // 实际初始化
      console.log("[路由初始化] 开始请求异步路由数据");
      console.time("[路由初始化] API请求耗时");
      
      getAsyncRoutes()
        .then(response => {
          console.timeEnd("[路由初始化] API请求耗时");
          console.log("[路由初始化] 收到API响应", response);
          
          try {
            // 检查响应格式
            if (!response) {
              console.error("[路由初始化] 获取路由响应为空");
              ElMessage.error("获取路由失败，请联系管理员");
              reject(new Error("获取的路由响应为空"));
              console.timeEnd("[路由初始化] 总耗时");
              console.groupEnd();
              return;
            }
            
            // 尝试从不同的响应格式中获取数据
            let data;
            if (response && typeof response === 'object' && 'data' in response) {
              data = (response as any).data;
              console.log("[路由初始化] 从response.data中获取路由数据", data);
            } else if (Array.isArray(response)) {
              data = response;
              console.log("[路由初始化] 从response数组中获取路由数据", data);
          } else {
              console.error("[路由初始化] 无法从响应中获取路由数据", response);
              ElMessage.error("无法从响应中获取路由数据");
              reject(new Error("无法从响应中获取路由数据"));
              console.timeEnd("[路由初始化] 总耗时");
              console.groupEnd();
              return;
            }
            
            if (!data || (Array.isArray(data) && data.length === 0)) {
              console.error("[路由初始化] 获取的路由数据为空");
              ElMessage.error("获取路由失败，请联系管理员");
              reject(new Error("获取的路由数据为空"));
              console.timeEnd("[路由初始化] 总耗时");
              console.groupEnd();
              return;
            }
            
            console.log("[路由初始化] 成功获取路由数据，路由数量:", Array.isArray(data) ? data.length : "未知");
            console.time("[路由初始化] 处理路由耗时");
            
            handleAsyncRoutes(cloneDeep(data));
            
            console.timeEnd("[路由初始化] 处理路由耗时");
            console.log("[路由初始化] 路由处理完成");
            console.timeEnd("[路由初始化] 总耗时");
            console.groupEnd();
            
            resolve(router);
          } catch (error) {
            console.error("[路由初始化] 处理响应数据时出错", error);
            ElMessage.error("处理路由数据失败，请联系管理员");
            reject(error);
            console.timeEnd("[路由初始化] 总耗时");
            console.groupEnd();
          }
        })
        .catch(error => {
          console.error("[路由初始化] 获取路由数据失败", error);
          ElMessage.error("获取路由失败，请联系管理员");
          reject(error);
          console.timeEnd("[路由初始化] 总耗时");
          console.groupEnd();
        });
    } catch (error) {
      console.error("[路由初始化] 路由初始化过程中发生异常", error);
      ElMessage.error("路由初始化失败，请联系管理员");
      reject(error);
      console.timeEnd("[路由初始化] 总耗时");
      console.groupEnd();
    }
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
  if (!arrRoutes || !arrRoutes.length) {
    console.warn("[路由] 异步路由数组为空");
    return [];
  }
  
  try {
    // 获取所有组件的路径
    const modulesRoutesKeys = Object.keys(modulesRoutes);
    
    if (modulesRoutesKeys.length === 0) {
      console.error("[路由] 未找到任何视图组件");
      return [];
    }
    
    console.log("[路由] 开始处理异步路由，路由数量:", arrRoutes.length);
    
    arrRoutes.forEach((v: RouteRecordRaw) => {
      // 确保meta对象存在并具有默认值
      if (!v.meta) {
        v.meta = {
          title: v.name as string || '未命名路由',
          icon: '',
          rank: 0
        };
      }
      
      // 将backstage属性加入meta，标识此路由为后端返回路由
      v.meta.backstage = true;
      
      // 父级的redirect属性取值：如果子级存在且父级的redirect属性不存在，默认取第一个子级的path；如果子级存在且父级的redirect属性存在，取存在的redirect属性，会覆盖默认值
      if (v?.children && v.children.length && !v.redirect) {
        // 确保生成的redirect路径是有效的，考虑路径是否以/开头
        const childPath = v.children[0].path;
        if (childPath.startsWith('/')) {
          v.redirect = childPath;
        } else {
          // 如果子路径是相对路径，需要基于父路径构建完整的重定向路径
          v.redirect = v.path.endsWith('/') ? `${v.path}${childPath}` : `${v.path}/${childPath}`;
        }
      }
      
      // 处理组件
      const Layout = () => import("@/layout/index.vue");
      const IFrameBlank = () => import("@/layout/frame.vue");
      
      console.log(`[路由] 处理路由组件: ${v.name ? String(v.name) : v.path}, 组件值:`, v.component);
      
      if (v.meta?.frameSrc) {
        // iframe页面
        v.component = IFrameBlank;
        console.log(`[路由] 设置为IFrame组件: ${v.name ? String(v.name) : v.path}`);
      } else if (v.name === 'Dashboard' || v.path === '/dashboard') {
        // 特殊处理Dashboard路由
        v.component = Layout;
        console.log(`[路由] 设置Dashboard路由组件为Layout`);
      } else if (String(v.component) === "Layout" || String(v.component) === "/src/layout/index") {
        // 布局组件
        v.component = Layout;
        console.log(`[路由] 设置为Layout组件: ${v.name ? String(v.name) : v.path}`);
      } else {
        // 尝试查找匹配的组件
        let index = -1;
        let componentPath = "";
        
        // 尝试获取组件路径字符串
        if (typeof v.component === "string") {
          componentPath = v.component;
          
          // 去掉可能的前缀
          if (componentPath && componentPath.startsWith("/src/")) {
            componentPath = componentPath.substring(5);
          }
          
          console.log(`[路由] 组件路径: ${componentPath}`);
        }
        
        // 尝试匹配组件
        if (componentPath) {
          index = modulesRoutesKeys.findIndex(key => key.includes(componentPath));
          console.log(`[路由] 组件路径匹配结果: ${index !== -1 ? '找到匹配' : '未找到匹配'}`);
        }
        
        if (index !== -1) {
          v.component = modulesRoutes[modulesRoutesKeys[index]];
          console.log(`[路由] 设置组件: ${v.name ? String(v.name) : v.path} -> ${modulesRoutesKeys[index]}`);
        } else {
          console.warn(`[路由] 无法找到组件: ${componentPath || v.path}，设置为404页面`);
          v.component = () => import("@/views/error/404.vue");
        }
      }
      
      // 递归处理子路由
      if (v?.children && v.children.length) {
        console.log(`[路由] 处理子路由: ${v.name ? String(v.name) : v.path}, 子路由数量: ${v.children.length}`);
        
        // 确保子路由的路径格式正确，但仅为路由导航时使用，不改变原始路径
        v.children.forEach(child => {
          // 如果子路由路径不是以/开头，且父路由路径存在，则为其添加完整路径属性
          if (child.path && !child.path.startsWith('/') && v.path) {
            const parentPath = v.path.endsWith('/') ? v.path.slice(0, -1) : v.path;
            const fullPath = `${parentPath}/${child.path}`;
            console.log(`[路由] 为子路由添加完整路径属性: ${child.name ? String(child.name) : ''} ${child.path} -> ${fullPath}`);
            // 添加一个额外的属性存储完整路径，而不修改原始path
            if (!child.meta) {
              child.meta = {
                title: child.name as string || '未命名路由',
                fullPath: fullPath
              };
            } else {
              child.meta.fullPath = fullPath;
            }
          }
        });
        
        addAsyncRoutes(v.children);
      }
    });
    
    return arrRoutes;
  } catch (error) {
    console.error("[路由] 处理异步路由时出错:", error);
    return [];
  }
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
  // 检查菜单是否存在
  const wholeMenus = usePermissionStoreHook().wholeMenus;
  if (!wholeMenus || wholeMenus.length === 0) {
    console.warn("[路由] 菜单列表为空，返回默认菜单");
    return { 
      path: "/dashboard/index", 
      name: "DashboardIndex",
      meta: { title: "首页" },
      value: null
    };
  }
  
  // 获取第一个菜单
  const firstMenu = wholeMenus[0];
  if (!firstMenu?.children || firstMenu.children.length === 0) {
    console.log("[路由] 第一个菜单没有子菜单，使用自身作为顶级菜单");
    // 不再自动添加标签
    return firstMenu;
  }
  
  // 使用处理函数获取顶部菜单
  const topMenu = handleTopMenu(firstMenu?.children[0]);
  
  // 记录菜单信息以便调试
  console.log(`[路由] getTopMenu 返回菜单: 路径=${topMenu?.path || '未设置'}, 名称=${topMenu?.name || '未命名'}`);
  
  // 不再自动添加标签
  return topMenu;
}

// 导出预加载组件
export { LoginPage, Error404Page, Error403Page, Error500Page };

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

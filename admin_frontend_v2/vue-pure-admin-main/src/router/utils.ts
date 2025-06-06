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

/** 处理动态路由（后端返回的路由） */
function handleAsyncRoutes(routeList) {
  console.log("[路由调试] 开始处理动态路由", routeList);
  
  if (routeList.length === 0) {
    console.log("[路由调试] 路由列表为空");
    usePermissionStoreHook().handleWholeMenus(routeList);
  } else {
    // 确保基础路由结构存在
    if (!router.options.routes || router.options.routes.length === 0) {
      console.error("[路由调试] 基础路由结构不存在，无法添加动态路由");
      router.options.routes = [{ 
        path: "/",
        name: "Root",
        component: () => import("@/layout/index.vue"),
        redirect: "/login",
        children: [] 
      }];
    } else {
      console.log("[路由调试] 当前基础路由结构:", JSON.stringify(router.options.routes, null, 2));
    }
    
    // 确保children数组存在
    if (!router.options.routes[0].children) {
      console.log("[路由调试] 创建子路由数组");
      router.options.routes[0].children = [];
    }

    // 预先确保错误页面路由存在
    const errorRoutes = [
      {
        path: "/error",
        name: "Error",
        component: () => import("@/layout/index.vue"),
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
            component: () => import("@/views/error/403.vue"),
            meta: {
              title: "403页面"
            }
          },
          {
            path: "/error/404",
            name: "404",
            component: () => import("@/views/error/404.vue"),
            meta: {
              title: "404页面"
            }
          },
          {
            path: "/error/500",
            name: "500",
            component: () => import("@/views/error/500.vue"),
            meta: {
              title: "500页面"
            }
          }
        ]
      }
    ];
    
    // 将错误路由添加到路由列表
    if (!router.hasRoute("403") && !router.hasRoute("Error")) {
      errorRoutes.forEach(route => {
        router.addRoute(route);
      });
      console.log("[路由调试] 预先添加了错误页面路由");
    }

    // 先处理路由
    const processedRoutes = addAsyncRoutes(routeList);
    const flattenedRoutes = formatFlatteningRoutes(processedRoutes);
    
    console.log("[路由调试] 扁平化后的路由:", flattenedRoutes.map(r => ({ 
      path: r.path, 
      name: r.name, 
      redirect: r.redirect 
    })));

    // 添加路由前检查循环引用
    const redirectMap = new Map();
    const checkCircularRedirects = (routes) => {
      routes.forEach(route => {
        if (route.redirect) {
          redirectMap.set(route.path, route.redirect);
          
          // 检查是否有循环重定向
          let currentPath = route.path;
          const visited = new Set([currentPath]);
          
          while (redirectMap.has(currentPath)) {
            currentPath = redirectMap.get(currentPath);
            if (visited.has(currentPath)) {
              console.error(`[路由调试] 检测到循环重定向: ${Array.from(visited).join(' -> ')} -> ${currentPath}`);
              // 修复循环重定向
              route.redirect = null;
              break;
            }
            visited.add(currentPath);
          }
        }
        
        if (route.children && route.children.length > 0) {
          checkCircularRedirects(route.children);
        }
      });
    };
    
    checkCircularRedirects(routeList);
    
    // 使用Map记录已添加的路由名称，避免重复
    const addedRoutes = new Map();
    
    // 一次性添加所有扁平化路由，避免多次修改路由
    try {
      // 先创建一个新路由对象
      const newRouteConfig = { 
        path: "/", 
        component: () => import("@/layout/index.vue"),
        children: []
      };

      // 将扁平化路由添加到新路由对象
      flattenedRoutes.forEach(route => {
        // 避免名称冲突
        if (route.name && addedRoutes.has(String(route.name))) {
          const originalName = String(route.name);
          route.name = `${originalName}_${Date.now()}`;
          console.log(`[路由调试] 路由名称冲突，重命名: ${originalName} -> ${route.name}`);
        }
        
        if (route.name) {
          addedRoutes.set(String(route.name), route.path);
        }

        // 将路由添加到新配置中
        newRouteConfig.children.push(route);
      });
      
      // 添加新路由到路由器
      router.addRoute(newRouteConfig);
      console.log(`[路由调试] 成功添加${flattenedRoutes.length}个路由`);
    } catch (error) {
      console.error("[路由调试] 添加路由失败:", error);
    }
    
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
  console.log("[路由调试] 路由处理完成");
}

/** 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）*/
function initRouter() {
  if (getConfig()?.CachingAsyncRoutes) {
    // 开启动态路由缓存本地localStorage
    const key = "async-routes";
    
    // 清理缓存，强制重新获取路由配置
    console.log("[路由] 清理路由缓存，强制重新获取");
    storageLocal().removeItem(key);
    
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

/** 过滤后端传来的动态路由 重新生成规范路由 */
function addAsyncRoutes(arrRoutes: Array<RouteRecordRaw>) {
  if (!arrRoutes || !arrRoutes.length) {
    console.warn("[路由] 异步路由数组为空");
    return [];
  }
  
  // 添加特定日志输出，检查CheckCategory路由
  const checkRoute = arrRoutes.find(route => route.name === "Check");
  if (checkRoute && checkRoute.children) {
    const categoryRoute = checkRoute.children.find(child => child.name === "CheckCategory");
    console.log("[路由调试] 打卡类型路由检查:", categoryRoute ? {
      path: categoryRoute.path,
      fullPath: `${checkRoute.path}/${categoryRoute.path.replace(/^\//, '')}`,
      name: categoryRoute.name,
      component: categoryRoute.component
    } : "未找到");
  }
  
  try {
    // 检查路径冲突
    const pathMap = new Map();
    const nameMap = new Map();
    
    // 递归检查路径和名称冲突
    const checkPathConflicts = (routes, parentPath = "") => {
      routes.forEach(route => {
        const fullPath = parentPath ? `${parentPath}/${route.path.replace(/^\//, '')}` : route.path;
        
        // 检查路径冲突
        if (pathMap.has(fullPath)) {
          console.warn(`[路由] 检测到路径冲突: ${fullPath}`);
          console.warn(`  - 现有路由: ${pathMap.get(fullPath)}`);
          console.warn(`  - 冲突路由: ${route.name || '未命名路由'}`);
          
          // 修正冲突路径，为路径添加随机后缀
          if (route.name && !fullPath.includes('error')) {
            const originalPath = route.path;
            route.path = `${originalPath}_${Date.now()}`;
            console.log(`[路由] 修正冲突路径: ${originalPath} -> ${route.path}`);
          }
        } else {
          pathMap.set(fullPath, route.name || '未命名路由');
        }
        
        // 检查名称冲突
        if (route.name) {
          if (nameMap.has(route.name)) {
            console.warn(`[路由] 检测到名称冲突: ${route.name}`);
            console.warn(`  - 现有路由: ${nameMap.get(route.name)}`);
            console.warn(`  - 冲突路由: ${fullPath}`);
            
            // 修正冲突名称，为名称添加随机后缀
            const originalName = route.name;
            route.name = `${originalName}_${Date.now()}`;
            console.log(`[路由] 修正冲突名称: ${originalName} -> ${route.name}`);
          } else {
            nameMap.set(route.name, fullPath);
          }
        }
        
        // 递归处理子路由
        if (route.children && route.children.length) {
          checkPathConflicts(route.children, fullPath);
        }
      });
    };
    
    // 执行冲突检查
    checkPathConflicts(arrRoutes);
    
    // 预先导入布局组件
    const Layout = () => import("@/layout/index.vue");
    const IFrameBlank = () => import("@/layout/frame.vue");
    
    // 获取所有组件的路径
    const modulesRoutesKeys = Object.keys(modulesRoutes);
    
    if (modulesRoutesKeys.length === 0) {
      console.error("[路由] 未找到任何视图组件");
      return [];
    }
    
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
      
      // 修正可能存在的路径问题
      if (v.path && v.path.includes('/error/') && v.name && !String(v.name).startsWith("Error") && !["403", "404", "500"].includes(String(v.name))) {
        console.warn(`[路由] 检测到可能错误的路径: ${v.path}, 名称: ${String(v.name)}`);
        
        // 尝试根据名称修正路径
        const namePrefix = String(v.name).split(/(?=[A-Z])/)[0].toLowerCase();
        if (namePrefix && namePrefix !== 'error') {
          const segments = v.path.split('/').filter(Boolean);
          const lastSegment = segments[segments.length - 1];
          const correctedPath = `/${namePrefix}/${lastSegment}`;
          console.log(`[路由] 尝试修正路径: ${v.path} -> ${correctedPath}`);
          v.path = correctedPath;
        }
      }
      
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
        console.log(`[路由] 设置重定向: ${v.path} -> ${v.redirect}`);
      }
      
      // 父级的name属性取值：如果子级存在且父级的name属性不存在，默认取第一个子级的name；如果子级存在且父级的name属性存在，取存在的name属性，会覆盖默认值
      if (v?.children && v.children.length && !v.name)
        v.name = (v.children[0].name as string) + "Parent";
      
      // 处理组件
      if (v.meta?.frameSrc) {
        // iframe页面
        v.component = IFrameBlank;
        console.log(`[路由] 设置IFrame组件: ${v.path}`);
      } else {
        // 优先处理已知的特殊组件
        const componentValue = v.component as any; // 使用any类型临时转换
        
        if (componentValue === "Layout" || componentValue === "/src/layout/index") {
          v.component = Layout;
          console.log(`[路由] 设置布局组件: ${v.path}`);
        } else {
          // 尝试查找匹配的组件
          let index = -1;
          let componentPath = "";
          
          // 尝试获取组件路径字符串
          if (typeof componentValue === "string") {
            componentPath = componentValue;
            
            // 去掉可能的前缀
            if (componentPath && componentPath.startsWith("/src/")) {
              componentPath = componentPath.substring(5);
            }
          }

          // 特殊处理CheckCategory路由
          if (v.name === "CheckCategory") {
            console.log(`[路由调试] 处理CheckCategory组件路径: ${componentPath}, 路由路径: ${v.path}`);
            
            // 列出可能的所有匹配模式
            const possiblePaths = [
              "check/category/index", 
              "views/check/category/index",
              "check/category",
              "views/check/category"
            ];
            
            // 查找匹配的组件
            for (const path of possiblePaths) {
              const foundIndex = modulesRoutesKeys.findIndex(key => key.includes(path));
              if (foundIndex !== -1) {
                index = foundIndex;
                console.log(`[路由调试] 找到CheckCategory组件: ${modulesRoutesKeys[index]}`);
                break;
              }
            }
          }
          
          // 1. 精确匹配
          if (index === -1 && componentPath) {
            index = modulesRoutesKeys.findIndex(key => key.includes(componentPath));
          }
          
          // 2. 如果精确匹配失败，尝试根据路径匹配
          if (index === -1 && v.path) {
            // 提取路径的最后一部分，例如从 /tenant/list 提取 list
            const pathSegments = v.path.replace(/^\//, '').split('/').filter(Boolean);
            const pathComponent = pathSegments[pathSegments.length - 1];
            
            // 先尝试使用完整路径匹配
            index = modulesRoutesKeys.findIndex(key => key.includes(v.path.replace(/^\//, '')));
            
            // 再尝试使用父路径+当前路径匹配
            if (index === -1 && pathSegments.length >= 2) {
              const parentPath = pathSegments[0]; // 获取根路径部分
              
              // 构建可能的路径模式进行匹配
              const possiblePaths = [
                `${parentPath}/${pathComponent}/index`,
                `views/${parentPath}/${pathComponent}/index`,
                `${parentPath}/${pathComponent}`,
                `views/${parentPath}/${pathComponent}`,
                `${parentPath}/${pathSegments[pathSegments.length - 1]}/index`,
                `views/${parentPath}/${pathSegments[pathSegments.length - 1]}/index`
              ];
              
              for (const path of possiblePaths) {
                const foundIndex = modulesRoutesKeys.findIndex(key => key.includes(path));
                if (foundIndex !== -1) {
                  index = foundIndex;
                  console.log(`[路由] 使用模式 ${path} 匹配到组件: ${modulesRoutesKeys[index]}`);
                  break;
                }
              }
            }
            
            // 最后尝试只匹配路径的最后部分
            if (index === -1) {
              // 构建更多可能的路径格式
              const possiblePaths = [
                `${pathComponent}/index`,
                `views/${pathComponent}/index`,
                `/${pathComponent}/index`,
                `/views/${pathComponent}/index`,
                `${pathComponent}`,
                `views/${pathComponent}`,
                `/${pathComponent}`,
                `/views/${pathComponent}`
              ];
              
              for (const path of possiblePaths) {
                const foundIndex = modulesRoutesKeys.findIndex(key => key.includes(path));
                if (foundIndex !== -1) {
                  index = foundIndex;
                  console.log(`[路由] 使用简化模式 ${path} 匹配到组件: ${modulesRoutesKeys[index]}`);
                  break;
                }
              }
            }
          }
          
          // 3. 尝试使用命名约定查找组件
          if (index === -1 && v.name) {
            // 例如：CheckCategory => check/category
            const nameParts = String(v.name).match(/[A-Z][a-z]+/g);
            if (nameParts && nameParts.length >= 2) {
              const moduleName = nameParts[0].toLowerCase();
              const subModuleName = nameParts[1].toLowerCase();
              
              const possiblePaths = [
                `${moduleName}/${subModuleName}/index`,
                `views/${moduleName}/${subModuleName}/index`,
                `${moduleName}/${subModuleName}`,
                `views/${moduleName}/${subModuleName}`
              ];
              
              for (const path of possiblePaths) {
                const foundIndex = modulesRoutesKeys.findIndex(key => key.includes(path));
                if (foundIndex !== -1) {
                  index = foundIndex;
                  console.log(`[路由] 通过名称约定 ${path} 匹配到组件: ${modulesRoutesKeys[index]}`);
                  break;
                }
              }
            }
          }
          
          // 4. 最后的备选方案 - 使用特定的视图组件
          if (index !== -1) {
            v.component = modulesRoutes[modulesRoutesKeys[index]];
            console.log(`[路由] 最终找到组件: ${modulesRoutesKeys[index]} 用于路径: ${v.path}, 名称: ${v.name}`);
          } else {
            console.warn(`[路由] 无法找到组件: ${componentPath || v.path}，使用错误页面作为替代`);
            
            // 使用错误页面组件作为后备
            const errorPageIndex = modulesRoutesKeys.findIndex(key => key.includes("error/404"));
            if (errorPageIndex !== -1) {
              v.component = modulesRoutes[modulesRoutesKeys[errorPageIndex]];
              console.log(`[路由] 使用404组件 ${modulesRoutesKeys[errorPageIndex]} 作为未匹配组件的替代`);
            } else {
              // 最后的后备方案 - 空组件
              v.component = () => import("@/views/error/404.vue");
              console.log(`[路由] 使用硬编码的404组件作为未匹配组件的替代`);
            }
          }
        }
      }
      
      // 递归处理子路由
      if (v?.children && v.children.length) {
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

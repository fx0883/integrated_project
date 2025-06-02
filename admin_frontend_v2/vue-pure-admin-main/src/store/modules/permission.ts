import { defineStore } from "pinia";
import {
  type cacheType,
  store,
  debounce,
  ascending,
  getKeyList,
  filterTree,
  constantMenus,
  filterNoPermissionTree,
  formatFlatteningRoutes
} from "../utils";
import { useUserStoreHook } from "./user";
import { useMultiTagsStoreHook } from "./multiTags";

export const usePermissionStore = defineStore("pure-permission", {
  state: () => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [],
    // 整体路由（一维数组格式）
    flatteningRoutes: [],
    // 缓存页面keepAlive
    cachePageList: [],
    // 按钮级别权限列表
    buttonPermissions: []
  }),
  getters: {
    // 获取扁平化路由
    getFlatteningRoutes: state => state.flatteningRoutes,
    // 获取按钮权限
    getButtonPermissions: state => state.buttonPermissions,
    // 检查是否有某个按钮权限
    hasButtonPermission: state => (permission: string) => {
      const userStore = useUserStoreHook();
      const userRoles = userStore.roles;
      const userPermissions = userStore.permissions;
      
      // 超级管理员拥有所有权限
      if (userRoles.includes('super_admin')) {
        return true;
      }
      
      // 检查具体权限
      if (userPermissions && userPermissions.length) {
        return userPermissions.includes(permission);
      }
      
      return false;
    }
  },
  actions: {
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: any[]) {
      // 获取用户角色
      const roles = useUserStoreHook().roles || [];
      
      // 过滤路由 - 基于角色
      const filterRoutesByRole = (routes: any[]) => {
        return routes.filter(route => {
          // 如果没有meta或没有roles字段，则默认所有人可见
          if (!route.meta || !route.meta.roles) {
            return true;
          }
          
          // 如果是超级管理员，可以访问所有路由
          if (roles.includes('super_admin')) {
            return true;
          }
          
          // 判断当前用户角色是否有权限访问
          const hasRole = roles.some(role => route.meta.roles.includes(role));
          
          // 递归处理子路由
          if (hasRole && route.children && route.children.length) {
            route.children = filterRoutesByRole(route.children);
          }
          
          return hasRole;
        });
      };
      
      // 过滤后的路由
      const filteredRoutes = filterRoutesByRole(routes);
      
      // 组装菜单
      this.wholeMenus = filterNoPermissionTree(
        filterTree(ascending(this.constantMenus.concat(filteredRoutes)))
      );
      
      this.flatteningRoutes = formatFlatteningRoutes(
        this.constantMenus.concat(filteredRoutes) as any
      );
      
      // 初始化按钮权限
      this.initButtonPermissions();
    },
    
    /** 初始化按钮级别权限 */
    initButtonPermissions() {
      const userStore = useUserStoreHook();
      this.buttonPermissions = userStore.permissions || [];
    },
    
    /** 检查是否拥有某个权限 */
    hasPermission(permission: string): boolean {
      return this.hasButtonPermission(permission);
    },
    
    /** 检查是否拥有指定角色 */
    hasRole(role: string): boolean {
      const userRoles = useUserStoreHook().roles || [];
      return userRoles.includes(role);
    },
    
    cacheOperate({ mode, name }: cacheType) {
      const delIndex = this.cachePageList.findIndex(v => v === name);
      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter(v => v !== name);
          break;
        case "add":
          this.cachePageList.push(name);
          break;
        case "delete":
          delIndex !== -1 && this.cachePageList.splice(delIndex, 1);
          break;
      }
      /** 监听缓存页面是否存在于标签页，不存在则删除 */
      debounce(() => {
        let cacheLength = this.cachePageList.length;
        const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
        while (cacheLength > 0) {
          nameList.findIndex(v => v === this.cachePageList[cacheLength - 1]) ===
            -1 &&
            this.cachePageList.splice(
              this.cachePageList.indexOf(this.cachePageList[cacheLength - 1]),
              1
            );
          cacheLength--;
        }
      })();
    },
    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.cachePageList = [];
      this.buttonPermissions = [];
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}

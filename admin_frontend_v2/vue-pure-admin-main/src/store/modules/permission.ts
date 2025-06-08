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

// 导入路由模块
import error from "@/router/modules/error";

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
      const userPermissions = userStore.permissions;
      
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
      console.group("[菜单处理] 开始处理菜单");
      console.time("[菜单处理] 总耗时");
      console.log(`[菜单处理] 处理时间: ${new Date().toLocaleString()}`);
      console.log("[菜单处理] 接收到的路由数量:", routes.length);
      
      try {
        // 排序路由
        console.time("[菜单处理] 路由排序耗时");
        const sortedRoutes = ascending(routes);
        console.timeEnd("[菜单处理] 路由排序耗时");
        console.log("[菜单处理] 路由排序完成");
        
        // 过滤路由树
        console.time("[菜单处理] 路由过滤耗时");
        this.wholeMenus = filterTree(sortedRoutes);
        console.timeEnd("[菜单处理] 路由过滤耗时");
        console.log("[菜单处理] 菜单树生成完成，菜单数量:", this.wholeMenus.length);
        
        // 扁平化路由
        console.time("[菜单处理] 路由扁平化耗时");
        this.flatteningRoutes = formatFlatteningRoutes(routes as any);
        console.timeEnd("[菜单处理] 路由扁平化耗时");
        console.log("[菜单处理] 扁平路由生成完成，路由数量:", this.flatteningRoutes.length);
        
        // 初始化按钮权限
        console.time("[菜单处理] 按钮权限初始化耗时");
        this.initButtonPermissions();
        console.timeEnd("[菜单处理] 按钮权限初始化耗时");
        
        console.log("[菜单处理] 菜单处理完成");
        console.timeEnd("[菜单处理] 总耗时");
        console.groupEnd();
      } catch (error) {
        console.error("[菜单处理] 处理菜单时出错:", error);
        console.timeEnd("[菜单处理] 总耗时");
        console.groupEnd();
        throw error;
      }
    },
    
    /** 初始化按钮级别权限 */
    initButtonPermissions() {
      console.group("[权限初始化] 初始化按钮权限");
      const userStore = useUserStoreHook();
      const permissions = userStore.permissions || [];
      console.log(`[权限初始化] 用户权限数量: ${permissions.length}`);
      this.buttonPermissions = permissions;
      console.groupEnd();
    },
    
    /** 检查是否拥有某个权限 */
    hasPermission(permission: string): boolean {
      const result = this.hasButtonPermission(permission);
      console.log(`[权限检查] 检查权限 "${permission}": ${result ? '有权限' : '无权限'}`);
      return result;
    },
    
    /** 检查是否拥有指定角色 */
    hasRole(role: string): boolean {
      const userRoles = useUserStoreHook().roles || [];
      const result = userRoles.includes(role);
      console.log(`[角色检查] 检查角色 "${role}": ${result ? '有角色' : '无角色'}, 用户角色: ${JSON.stringify(userRoles)}`);
      return result;
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
      this.cachePageList = [];
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}

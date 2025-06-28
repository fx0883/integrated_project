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
import { useMultiTagsStoreHook } from "./multiTags";
import logger from "@/utils/logger";

export const usePermissionStore = defineStore("pure-permission", {
  state: () => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [],
    // 整体路由（一维数组格式）
    flatteningRoutes: [],
    // 缓存页面keepAlive
    cachePageList: []
  }),
  actions: {
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: any[]) {
      logger.debug('[菜单生成] 开始处理整体菜单, 动态路由数量:', routes.length);
      logger.debug('[菜单生成] 静态菜单数量:', this.constantMenus.length);
    
    const combinedRoutes = this.constantMenus.concat(routes);
      logger.debug('[菜单生成] 组合后路由数量:', combinedRoutes.length);
    
    const sortedRoutes = ascending(combinedRoutes);
      logger.debug('[菜单生成] 排序后路由数组:', sortedRoutes);
    
    const filteredRoutes = filterTree(sortedRoutes);
      logger.debug('[菜单生成] 过滤showLink后路由数组长度:', filteredRoutes.length);
    
    const permissionFilteredRoutes = filterNoPermissionTree(filteredRoutes);
      logger.debug('[菜单生成] 权限过滤后最终菜单数组长度:', permissionFilteredRoutes.length);
    
    this.wholeMenus = permissionFilteredRoutes;
    
      this.flatteningRoutes = formatFlatteningRoutes(
        this.constantMenus.concat(routes) as any
      );
    
      logger.debug('[菜单生成] 扁平化路由数量:', this.flatteningRoutes.length);
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
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}

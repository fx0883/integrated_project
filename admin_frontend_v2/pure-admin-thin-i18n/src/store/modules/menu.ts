import { defineStore } from "pinia";
import { 
  getMenuList, 
  getMenuTree,
  getMenuDetail,
  createMenu,
  updateMenu,
  patchMenu,
  deleteMenu,
  batchMenus,
  importMenus,
  exportMenus,
  toggleMenuStatus
} from "@/api/modules/menu";
import type { 
  Menu,
  MenuTree,
  MenuListParams,
  MenuCreateUpdateParams
} from "@/types/menu";
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";
import { store } from "../index";

interface MenuState {
  // 菜单列表数据
  menuList: PaginationData<Menu>;
  // 菜单树形结构
  menuTree: MenuTree[];
  // 当前选中的菜单
  currentMenu: Menu | null;
  // 加载状态
  loading: {
    list: boolean;
    tree: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    batch: boolean;
    import: boolean;
    export: boolean;
    toggleStatus: boolean;
  };
}

export const useMenuStore = defineStore("menu", {
  state: (): MenuState => ({
    menuList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    menuTree: [],
    currentMenu: null,
    loading: {
      list: false,
      tree: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      batch: false,
      import: false,
      export: false,
      toggleStatus: false
    }
  }),
  
  actions: {
    /**
     * 获取菜单列表
     */
    async fetchMenuList(params: MenuListParams = {}) {
      this.loading.list = true;
      try {
        const response = await getMenuList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.menuList = {
              total: response.data.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              data: response.data.results || []
            };
          } else {
            logger.warn("菜单列表数据结构不符合预期", response.data);
            this.menuList.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          ElMessage.error(response.message || "获取菜单列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取菜单列表失败", error);
        ElMessage.error(error.message || "获取菜单列表失败");
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取菜单树形结构
     */
    async fetchMenuTree(params: { is_active?: boolean } = {}) {
      this.loading.tree = true;
      try {
        const response = await getMenuTree(params);
        if (response.success) {
          this.menuTree = response.data || [];
          return response;
        } else {
          ElMessage.error(response.message || "获取菜单树失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取菜单树失败", error);
        ElMessage.error(error.message || "获取菜单树失败");
        throw error;
      } finally {
        this.loading.tree = false;
      }
    },
    
    /**
     * 获取菜单详情
     */
    async fetchMenuDetail(id: number) {
      this.loading.detail = true;
      try {
        const response = await getMenuDetail(id);
        if (response.success) {
          this.currentMenu = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取菜单详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取菜单详情失败", error);
        ElMessage.error(error.message || "获取菜单详情失败");
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 创建菜单
     */
    async createNewMenu(data: MenuCreateUpdateParams) {
      this.loading.create = true;
      try {
        const response = await createMenu(data);
        if (response.success) {
          ElMessage.success(response.message || "创建菜单成功");
          return response;
        } else {
          ElMessage.error(response.message || "创建菜单失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建菜单失败", error);
        ElMessage.error(error.message || "创建菜单失败");
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新菜单
     */
    async updateMenuInfo(id: number, data: MenuCreateUpdateParams) {
      this.loading.update = true;
      try {
        const response = await updateMenu(id, data);
        if (response.success) {
          // 如果当前选中的菜单是被更新的菜单，则更新当前选中的菜单信息
          if (this.currentMenu && this.currentMenu.id === id) {
            this.currentMenu = response.data;
          }
          ElMessage.success(response.message || "更新菜单成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新菜单失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新菜单失败", error);
        ElMessage.error(error.message || "更新菜单失败");
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 部分更新菜单
     */
    async patchMenuInfo(id: number, data: Partial<MenuCreateUpdateParams>) {
      this.loading.update = true;
      try {
        const response = await patchMenu(id, data);
        if (response.success) {
          // 如果当前选中的菜单是被更新的菜单，则更新当前选中的菜单信息
          if (this.currentMenu && this.currentMenu.id === id) {
            this.currentMenu = response.data;
          }
          ElMessage.success(response.message || "更新菜单成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新菜单失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新菜单失败", error);
        ElMessage.error(error.message || "更新菜单失败");
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除菜单
     */
    async removeMenu(id: number, cascade: boolean = false) {
      this.loading.delete = true;
      try {
        const response = await deleteMenu(id, cascade);
        if (response.success) {
          // 如果删除的是当前选中的菜单，则清空当前选中的菜单
          if (this.currentMenu && this.currentMenu.id === id) {
            this.currentMenu = null;
          }
          // 从菜单列表中移除被删除的菜单
          this.menuList.data = this.menuList.data.filter(menu => menu.id !== id);
          this.menuList.total--;
          
          ElMessage.success(response.message || "删除菜单成功");
          return response;
        } else {
          ElMessage.error(response.message || "删除菜单失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除菜单失败", error);
        ElMessage.error(error.message || "删除菜单失败");
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 批量操作菜单
     */
    async batchOperateMenus(data: {
      create?: MenuCreateUpdateParams[];
      update?: (Partial<MenuCreateUpdateParams> & { id: number })[];
      delete?: number[];
    }) {
      this.loading.batch = true;
      try {
        const response = await batchMenus(data);
        if (response.success) {
          ElMessage.success(response.message || "批量操作成功");
          return response;
        } else {
          ElMessage.error(response.message || "批量操作失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("批量操作菜单失败", error);
        ElMessage.error(error.message || "批量操作菜单失败");
        throw error;
      } finally {
        this.loading.batch = false;
      }
    },
    
    /**
     * 导入菜单配置
     */
    async importMenuConfig(file: File) {
      this.loading.import = true;
      try {
        const response = await importMenus(file);
        if (response.success) {
          ElMessage.success(`导入成功，共导入${response.data.imported}个菜单项`);
          return response;
        } else {
          ElMessage.error(response.message || "导入菜单配置失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("导入菜单配置失败", error);
        ElMessage.error(error.message || "导入菜单配置失败");
        throw error;
      } finally {
        this.loading.import = false;
      }
    },
    
    /**
     * 导出菜单配置
     */
    async exportMenuConfig() {
      this.loading.export = true;
      try {
        const response = await exportMenus();
        // 处理下载逻辑
        const blob = new Blob([response], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `menus_${new Date().getTime()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ElMessage.success("导出菜单配置成功");
        return response;
      } catch (error) {
        logger.error("导出菜单配置失败", error);
        ElMessage.error(error.message || "导出菜单配置失败");
        throw error;
      } finally {
        this.loading.export = false;
      }
    },
    
    /**
     * 切换菜单状态
     */
    async toggleMenuStatusAction(id: number, active: boolean) {
      this.loading.toggleStatus = true;
      try {
        const response = await toggleMenuStatus(id, active);
        if (response.success) {
          // 更新菜单状态
          if (this.currentMenu && this.currentMenu.id === id) {
            this.currentMenu.is_active = active;
          }
          
          // 更新菜单列表中的菜单状态
          const targetMenu = this.menuList.data.find(menu => menu.id === id);
          if (targetMenu) {
            targetMenu.is_active = active;
          }
          
          ElMessage.success(response.message || `${active ? '启用' : '禁用'}菜单成功`);
          return response;
        } else {
          ElMessage.error(response.message || `${active ? '启用' : '禁用'}菜单失败`);
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error(`${active ? '启用' : '禁用'}菜单失败`, error);
        ElMessage.error(error.message || `${active ? '启用' : '禁用'}菜单失败`);
        throw error;
      } finally {
        this.loading.toggleStatus = false;
      }
    },
    
    /**
     * 重置菜单状态
     */
    resetMenuState() {
      this.menuList = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.menuTree = [];
      this.currentMenu = null;
    }
  }
});

export function useMenuStoreHook() {
  return useMenuStore(store);
} 
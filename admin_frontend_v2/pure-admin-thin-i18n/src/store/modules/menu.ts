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
  toggleMenuStatus,
  getUserMenus,
  assignUserMenus
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
  // 用户菜单数据
  userMenus: {
    user_id: number | null;
    username: string;
    menus: Array<{
      id: number;
      name: string;
      code: string;
      is_active: boolean;
    }>;
  };
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
    userMenus: boolean;
    assignUserMenus: boolean;
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
    userMenus: {
      user_id: null,
      username: '',
      menus: []
    },
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
      toggleStatus: false,
      userMenus: false,
      assignUserMenus: false
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
    async createMenuAction(data: MenuCreateUpdateParams) {
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
    async updateMenuAction(id: number, data: MenuCreateUpdateParams) {
      this.loading.update = true;
      try {
        const response = await updateMenu(id, data);
        if (response.success) {
          // 如果更新的是当前选中的菜单，则更新当前选中的菜单信息
          if (this.currentMenu && this.currentMenu.id === id) {
            this.currentMenu = response.data;
          }
          
          // 更新菜单列表中的菜单信息
          const index = this.menuList.data.findIndex(menu => menu.id === id);
          if (index !== -1) {
            this.menuList.data[index] = response.data;
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
    async batchMenusAction(data: {
      create?: MenuCreateUpdateParams[];
      update?: (Partial<MenuCreateUpdateParams> & { id: number })[];
      delete?: number[];
    }) {
      this.loading.batch = true;
      try {
        const response = await batchMenus(data);
        if (response.success) {
          ElMessage.success(response.message || "批量操作菜单成功");
          return response;
        } else {
          ElMessage.error(response.message || "批量操作菜单失败");
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
    async importMenusAction(file: File) {
      this.loading.import = true;
      try {
        const response = await importMenus(file);
        if (response.success) {
          ElMessage.success(response.message || "导入菜单配置成功");
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
    async exportMenusAction() {
      this.loading.export = true;
      try {
        const response = await exportMenus();
        
        // 创建Blob链接并下载文件
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'menus_config.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        ElMessage.success("导出菜单配置成功");
        return response;
      } catch (error) {
        logger.error("导出菜单配置失败", error);
        ElMessage.error("导出菜单配置失败");
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
     * 获取用户菜单配置
     * @param userId 用户ID
     */
    async fetchUserMenus(userId: number) {
      this.loading.userMenus = true;
      try {
        const response = await getUserMenus(userId);
        if (response.success) {
          this.userMenus = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取用户菜单配置失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取用户菜单配置失败", error);
        ElMessage.error(error.message || "获取用户菜单配置失败");
        throw error;
      } finally {
        this.loading.userMenus = false;
      }
    },
    
    /**
     * 为用户分配菜单
     * @param userId 用户ID
     * @param data 菜单ID列表数据
     */
    async assignUserMenus(userId: number, data: { menu_ids: number[] }) {
      this.loading.assignUserMenus = true;
      try {
        const response = await assignUserMenus(userId, data);
        if (response.success) {
          ElMessage.success(response.message || "分配菜单成功");
          return response;
        } else {
          ElMessage.error(response.message || "分配菜单失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("分配菜单失败", error);
        ElMessage.error(error.message || "分配菜单失败");
        throw error;
      } finally {
        this.loading.assignUserMenus = false;
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
      this.userMenus = {
        user_id: null,
        username: '',
        menus: []
      };
    }
  }
});

export function useMenuStoreHook() {
  return useMenuStore(store);
} 
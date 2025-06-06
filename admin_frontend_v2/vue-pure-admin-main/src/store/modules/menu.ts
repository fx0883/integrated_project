import { defineStore } from "pinia";
import { store } from "../utils";
import {
  getMenus,
  getMenuTree,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getAdminMenus,
  assignMenusToAdmin,
  removeAdminMenu,
  batchRemoveAdminMenus,
  getCurrentUserMenus,
  type MenuListParams,
  type MenuInfo,
  type MenuTreeInfo,
  type MenuCreateRequest,
  type MenuUpdateRequest,
  type MenuListResult,
  type MenuTreeResult,
  type MenuDetailResult
} from "@/api/menu";
import type { ApiResponse } from "@/utils/http/response";

interface MenuState {
  menuList: MenuInfo[];
  menuTree: MenuTreeInfo[];
  currentMenu: MenuInfo | null;
  loading: boolean;
}

export const useMenuStore = defineStore("pure-menu", {
  state: (): MenuState => ({
    menuList: [],
    menuTree: [],
    currentMenu: null,
    loading: false
  }),
  getters: {
    getMenuList: (state): MenuInfo[] => state.menuList,
    getMenuTree: (state): MenuTreeInfo[] => state.menuTree,
    getCurrentMenu: (state): MenuInfo | null => state.currentMenu
  },
  actions: {
    // 获取菜单列表
    async fetchMenus(params?: MenuListParams) {
      this.loading = true;
      try {
        const response = await getMenus(params) as ApiResponse<MenuListResult>;
        if (response && response.success && response.data) {
          this.menuList = response.data.list || [];
          return response.data;
        }
        return null;
      } finally {
        this.loading = false;
      }
    },

    // 获取菜单树形结构
    async fetchMenuTree(params?: MenuListParams) {
      this.loading = true;
      try {
        const response = await getMenuTree(params) as ApiResponse<MenuTreeResult>;
        if (response && response.success && response.data) {
          this.menuTree = response.data.list || [];
          return response.data;
        }
        return null;
      } finally {
        this.loading = false;
      }
    },

    // 获取单个菜单详情
    async fetchMenuById(id: number) {
      this.loading = true;
      try {
        const response = await getMenuById(id) as ApiResponse<MenuDetailResult>;
        if (response && response.success && response.data) {
          this.currentMenu = response.data.menu || null;
          return response.data;
        }
        return null;
      } finally {
        this.loading = false;
      }
    },

    // 创建菜单
    async createMenu(data: MenuCreateRequest) {
      this.loading = true;
      try {
        const response = await createMenu(data);
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 更新菜单
    async updateMenu(id: number, data: MenuUpdateRequest) {
      this.loading = true;
      try {
        const response = await updateMenu(id, data);
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 删除菜单
    async deleteMenu(id: number) {
      this.loading = true;
      try {
        const response = await deleteMenu(id);
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 获取管理员菜单列表
    async fetchAdminMenus(userId: number) {
      this.loading = true;
      try {
        const response = await getAdminMenus(userId) as ApiResponse<MenuListResult>;
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 分配菜单给管理员
    async assignMenusToAdmin(userId: number, menuIds: number[]) {
      this.loading = true;
      try {
        const response = await assignMenusToAdmin(userId, menuIds);
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 取消分配给管理员的菜单
    async removeAdminMenu(userId: number, menuId: number) {
      this.loading = true;
      try {
        const response = await removeAdminMenu(userId, menuId);
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 批量取消分配给管理员的菜单
    async batchRemoveAdminMenus(userId: number, menuIds: number[]) {
      this.loading = true;
      try {
        const response = await batchRemoveAdminMenus(userId, menuIds);
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 获取当前用户的菜单
    async fetchCurrentUserMenus() {
      this.loading = true;
      try {
        const response = await getCurrentUserMenus() as ApiResponse<MenuTreeResult>;
        return response;
      } finally {
        this.loading = false;
      }
    },

    // 重置状态
    resetState() {
      this.menuList = [];
      this.menuTree = [];
      this.currentMenu = null;
    }
  }
});

export function useMenuStoreHook() {
  return useMenuStore(store);
} 
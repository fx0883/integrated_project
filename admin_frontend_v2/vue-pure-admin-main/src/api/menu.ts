import { http } from "@/utils/http";
import type { ApiResult } from "@/types/user";

// 菜单管理相关类型定义
export interface MenuInfo {
  id: number;
  name: string;
  code: string;
  icon?: string;
  path?: string;
  component?: string;
  order?: number;
  parent_id?: number | null;
  is_active: boolean;
  children?: MenuInfo[];
}

export interface MenuTreeResult {
  success: boolean;
  data: MenuInfo[];
}

// 菜单管理相关API
export const menuApi = {
  // 获取菜单列表
  getMenus(params?: object) {
    return http.request<ApiResult<MenuInfo[]>>("get", "/menus/", { params });
  },

  // 获取菜单树形结构
  getMenuTree(params?: object) {
    return http.request<MenuTreeResult>("get", "/menus/tree/", { params });
  },

  // 获取单个菜单详情
  getMenuById(id: number) {
    return http.request<ApiResult<MenuInfo>>("get", `/menus/${id}/`);
  },

  // 创建菜单
  createMenu(data: object) {
    return http.request<ApiResult<MenuInfo>>("post", "/menus/", { data });
  },

  // 更新菜单
  updateMenu(id: number, data: object) {
    return http.request<ApiResult<MenuInfo>>("put", `/menus/${id}/`, { data });
  },

  // 删除菜单
  deleteMenu(id: number) {
    return http.request<ApiResult>("delete", `/menus/${id}/`);
  },

  // 获取管理员菜单列表
  getAdminMenus(userId: number) {
    return http.request<ApiResult<MenuInfo[]>>("get", `/menus/admins/${userId}/menus/`);
  },

  // 分配菜单给管理员
  assignMenusToAdmin(userId: number, menuIds: number[]) {
    return http.request<ApiResult>("post", `/menus/admins/${userId}/menus/`, { data: { menu_ids: menuIds } });
  },

  // 取消分配给管理员的菜单
  removeAdminMenu(userId: number, menuId: number) {
    return http.request<ApiResult>("delete", `/menus/admins/${userId}/menus/${menuId}/`);
  },

  // 批量取消分配给管理员的菜单
  batchRemoveAdminMenus(userId: number, menuIds: number[]) {
    return http.request<ApiResult>("delete", `/menus/admins/${userId}/menus/batch/`, {
      data: { menu_ids: menuIds }
    });
  },

  // 获取当前用户的菜单
  getCurrentUserMenus() {
    return http.request<ApiResult<MenuInfo[]>>("get", "/menus/user/");
  }
};

export default menuApi; 
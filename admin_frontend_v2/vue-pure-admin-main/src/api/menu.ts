import { http } from "@/utils/http";
import type { ApiResult } from "../../types/user";

/** 菜单列表结果类型 */
export interface MenuListResult {
  list: Array<MenuInfo>;
  total: number;
}

/** 菜单树结构结果类型 */
export interface MenuTreeResult {
  list: Array<MenuTreeInfo>;
}

/** 菜单详情结果类型 */
export interface MenuDetailResult {
  menu: MenuInfo;
}

/** 菜单信息类型 */
export interface MenuInfo {
  id: number;
  name: string;
  path: string;
  component?: string;
  redirect?: string;
  meta?: {
    title: string;
    icon?: string;
    showLink?: boolean;
    rank?: number;
    roles?: Array<string>;
  };
  parent_id?: number;
  sort?: number;
  status?: number;
  children?: Array<MenuInfo>;
  created_at?: string;
  updated_at?: string;
}

/** 菜单树结构类型 */
export interface MenuTreeInfo extends MenuInfo {
  children?: Array<MenuTreeInfo>;
}

/** 菜单列表请求参数 */
export interface MenuListParams {
  page?: number;
  limit?: number;
  name?: string;
  status?: number;
  parent_id?: number;
}

/** 创建菜单请求参数 */
export interface MenuCreateRequest {
  name: string;
  path: string;
  component?: string;
  redirect?: string;
  meta?: {
    title: string;
    icon?: string;
    showLink?: boolean;
    rank?: number;
    roles?: Array<string>;
  };
  parent_id?: number;
  sort?: number;
  status?: number;
}

/** 更新菜单请求参数 */
export interface MenuUpdateRequest extends MenuCreateRequest {
  id: number;
}

/** 获取菜单列表 */
export const getMenus = (params?: MenuListParams) => {
  return http.request<MenuListResult>("get", "/menus/", { params });
};

/** 获取菜单树形结构 */
export const getMenuTree = (params?: MenuListParams) => {
  return http.request<MenuTreeResult>("get", "/menus/tree/", { params });
};

/** 获取单个菜单详情 */
export const getMenuById = (id: number) => {
  return http.request<MenuDetailResult>("get", `/menus/${id}/`);
};

/** 创建菜单 */
export const createMenu = (data: MenuCreateRequest) => {
  return http.request<ApiResult>("post", "/menus/", { data });
};

/** 更新菜单 */
export const updateMenu = (id: number, data: MenuUpdateRequest) => {
  return http.request<ApiResult>("put", `/menus/${id}/`, { data });
};

/** 删除菜单 */
export const deleteMenu = (id: number) => {
  return http.request<ApiResult>("delete", `/menus/${id}/`);
};

/** 获取管理员菜单列表 */
export const getAdminMenus = (userId: number) => {
  return http.request<MenuListResult>("get", `/menus/admins/${userId}/menus/`);
};

/** 分配菜单给管理员 */
export const assignMenusToAdmin = (userId: number, menuIds: number[]) => {
  return http.request<ApiResult>("post", `/menus/admins/${userId}/menus/`, { 
    data: { menu_ids: menuIds } 
  });
};

/** 取消分配给管理员的菜单 */
export const removeAdminMenu = (userId: number, menuId: number) => {
  return http.request<ApiResult>("delete", `/menus/admins/${userId}/menus/${menuId}/`);
};

/** 批量取消分配给管理员的菜单 */
export const batchRemoveAdminMenus = (userId: number, menuIds: number[]) => {
  return http.request<ApiResult>("delete", `/menus/admins/${userId}/menus/batch/`, {
    data: { menu_ids: menuIds }
  });
};

/** 获取当前用户的菜单 */
export const getCurrentUserMenus = () => {
  return http.request<MenuTreeResult>("get", "/menus/user/");
};

export default {
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
  getCurrentUserMenus
}; 
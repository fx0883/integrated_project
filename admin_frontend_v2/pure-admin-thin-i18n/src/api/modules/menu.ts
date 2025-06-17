import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type { Menu, MenuTree, MenuListParams, MenuCreateUpdateParams } from "@/types/menu";
import logger from "@/utils/logger";

/**
 * 获取菜单列表
 * @param params 查询参数
 */
export function getMenuList(params: MenuListParams = {}) {
  logger.debug("API请求: 获取菜单列表", params);
  
  return http.request<PaginationResponse<Menu>>(
    "get",
    "/menus/",
    { params }
  );
}

/**
 * 获取菜单树形结构
 */
export function getMenuTree() {
  logger.debug("API请求: 获取菜单树形结构");
  
  return http.request<ApiResponse<MenuTree[]>>(
    "get",
    "/menus/tree/"
  );
}

/**
 * 获取菜单详情
 * @param id 菜单ID
 */
export function getMenuDetail(id: number) {
  logger.debug("API请求: 获取菜单详情", { id });
  
  return http.request<ApiResponse<Menu>>(
    "get",
    `/menus/${id}/`
  );
}

/**
 * 创建菜单
 * @param data 菜单数据
 */
export function createMenu(data: MenuCreateUpdateParams) {
  logger.debug("API请求: 创建菜单", data);
  
  return http.request<ApiResponse<Menu>>(
    "post",
    "/menus/",
    { data }
  );
}

/**
 * 更新菜单
 * @param id 菜单ID
 * @param data 菜单数据
 */
export function updateMenu(id: number, data: MenuCreateUpdateParams) {
  logger.debug("API请求: 更新菜单", { id, data });
  
  return http.request<ApiResponse<Menu>>(
    "put",
    `/menus/${id}/`,
    { data }
  );
}

/**
 * 删除菜单
 * @param id 菜单ID
 */
export function deleteMenu(id: number) {
  logger.debug("API请求: 删除菜单", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/menus/${id}/`
  );
}

/**
 * 切换菜单状态
 * @param id 菜单ID
 * @param active 是否激活
 */
export function toggleMenuStatus(id: number, active: boolean) {
  logger.debug("API请求: 切换菜单状态", { id, active });
  
  return http.request<ApiResponse<Menu>>(
    "patch",
    `/menus/${id}/toggle_status/`,
    { data: { is_active: active } }
  );
}

/**
 * 部分更新菜单
 * @param id 菜单ID
 * @param data 菜单数据
 */
export function patchMenu(id: number, data: Partial<MenuCreateUpdateParams>) {
  logger.debug("API请求: 部分更新菜单", { id, data });
  
  return http.request<ApiResponse<Menu>>(
    "patch",
    `/menus/${id}/`,
    { data }
  );
}

/**
 * 批量操作菜单
 * @param data 批量操作数据
 */
export function batchMenus(data: {
  create?: MenuCreateUpdateParams[];
  update?: (Partial<MenuCreateUpdateParams> & { id: number })[];
  delete?: number[];
}) {
  logger.debug("API请求: 批量操作菜单", data);
  
  return http.request<ApiResponse<{
    created: number[];
    updated: number[];
    deleted: number[];
  }>>(
    "post",
    "/menus/batch/",
    { data }
  );
}

/**
 * 导入菜单配置
 * @param file 配置文件
 */
export function importMenus(file: File) {
  logger.debug("API请求: 导入菜单配置", { fileName: file.name });
  
  const formData = new FormData();
  formData.append("file", file);
  
  return http.request<ApiResponse<{ imported: number }>>(
    "post",
    "/menus/import/",
    { 
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 导出菜单配置
 */
export function exportMenus() {
  logger.debug("API请求: 导出菜单配置");
  
  return http.request<Blob>(
    "get",
    "/menus/export/",
    { 
      responseType: "blob" 
    }
  );
} 
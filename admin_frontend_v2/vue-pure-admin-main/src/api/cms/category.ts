import { http } from "@/utils/http";
import type { 
  CategoryListResult,
  CategoryDetailResult,
  CategoryListParams,
  CategoryCreateRequest,
  CategoryUpdateRequest
} from "../../../types/cms/category";
import type { ApiResult } from "../../../types/user";

/** 获取分类列表 */
export const getCategories = (params?: CategoryListParams) => {
  return http.request<CategoryListResult>("get", "/categories/", { params });
};

/** 获取分类详情 */
export const getCategoryById = (id: number) => {
  return http.request<CategoryDetailResult>("get", `/categories/${id}/`);
};

/** 创建分类 */
export const createCategory = (data: CategoryCreateRequest) => {
  return http.request<ApiResult>("post", "/categories/", { data });
};

/** 更新分类 */
export const updateCategory = (id: number, data: CategoryUpdateRequest) => {
  return http.request<ApiResult>("put", `/categories/${id}/`, { data });
};

/** 删除分类 */
export const deleteCategory = (id: number) => {
  return http.request<ApiResult>("delete", `/categories/${id}/`);
}; 
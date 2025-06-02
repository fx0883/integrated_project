import { http } from "@/utils/http";
import type { 
  TagListResult,
  TagDetailResult,
  TagListParams,
  TagCreateRequest,
  TagUpdateRequest
} from "../../../types/cms/tag";
import type { ApiResult } from "../../../types/user";

/** 获取标签列表 */
export const getTags = (params?: TagListParams) => {
  return http.request<TagListResult>("get", "/tags/", { params });
};

/** 获取标签详情 */
export const getTagById = (id: number) => {
  return http.request<TagDetailResult>("get", `/tags/${id}/`);
};

/** 创建标签 */
export const createTag = (data: TagCreateRequest) => {
  return http.request<ApiResult>("post", "/tags/", { data });
};

/** 更新标签 */
export const updateTag = (id: number, data: TagUpdateRequest) => {
  return http.request<ApiResult>("put", `/tags/${id}/`, { data });
};

/** 删除标签 */
export const deleteTag = (id: number) => {
  return http.request<ApiResult>("delete", `/tags/${id}/`);
}; 
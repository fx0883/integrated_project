import { http } from "@/utils/http";
import type { 
  ArticleListResult,
  ArticleDetailResult,
  ArticleListParams,
  ArticleCreateRequest,
  ArticleUpdateRequest
} from "../../../types/cms/article";
import type { ApiResult } from "../../../types/user";

/** 获取文章列表 */
export const getArticles = (params?: ArticleListParams) => {
  return http.request<ArticleListResult>("get", "/articles/", { params });
};

/** 获取文章详情 */
export const getArticleById = (id: number) => {
  return http.request<ArticleDetailResult>("get", `/articles/${id}/`);
};

/** 创建文章 */
export const createArticle = (data: ArticleCreateRequest) => {
  return http.request<ApiResult>("post", "/articles/", { data });
};

/** 更新文章 */
export const updateArticle = (id: number, data: ArticleUpdateRequest) => {
  return http.request<ApiResult>("put", `/articles/${id}/`, { data });
};

/** 删除文章 */
export const deleteArticle = (id: number) => {
  return http.request<ApiResult>("delete", `/articles/${id}/`);
};

/** 发布文章 */
export const publishArticle = (id: number) => {
  return http.request<ApiResult>("post", `/articles/${id}/publish/`);
};

/** 归档文章 */
export const archiveArticle = (id: number) => {
  return http.request<ApiResult>("post", `/articles/${id}/archive/`);
};

/** 置顶文章 */
export const featuredArticle = (id: number, featured: boolean) => {
  return http.request<ApiResult>("post", `/articles/${id}/featured/`, { 
    data: { featured } 
  });
}; 
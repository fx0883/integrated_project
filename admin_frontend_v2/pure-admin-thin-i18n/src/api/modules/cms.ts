import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Article,
  ArticleListParams,
  ArticleCreateParams,
  ArticleUpdateParams,
  ArticleStatistics,
  ArticleVersion,
  Comment,
  CommentStatus,
  CommentListParams,
  CommentCreateParams,
  CommentUpdateParams,
  Category,
  CategoryListParams,
  CategoryCreateParams,
  CategoryUpdateParams,
  Tag,
  TagListParams,
  TagCreateParams,
  TagUpdateParams,
  TagGroup,
  TagGroupListParams,
  TagGroupCreateParams,
  TagGroupUpdateParams,
  CategoryOrderParams
} from "@/types/cms";
import logger from "@/utils/logger";

// 文章相关API
// --------------------------------------------

/**
 * 获取文章列表
 * @param params 查询参数
 */
export function getArticleList(params: ArticleListParams) {
  logger.debug("API请求: 获取文章列表", params);

  return http.request<PaginationResponse<Article>>("get", "/cms/articles/", {
    params
  });
}

/**
 * 获取文章详情
 * @param id 文章ID
 */
export function getArticleDetail(id: number) {
  logger.debug("API请求: 获取文章详情", { id });

  return http.request<ApiResponse<Article>>("get", `/cms/articles/${id}/`);
}

/**
 * 创建文章
 * @param data 文章数据
 */
export function createArticle(data: ArticleCreateParams) {
  logger.debug("API请求: 创建文章", data);

  return http.request<ApiResponse<Article>>("post", "/cms/articles/", { data });
}

/**
 * 更新文章
 * @param id 文章ID
 * @param data 文章数据
 */
export function updateArticle(id: number, data: ArticleUpdateParams) {
  logger.debug("API请求: 更新文章", { id, data });

  return http.request<ApiResponse<Article>>("put", `/cms/articles/${id}/`, {
    data
  });
}

/**
 * 部分更新文章
 * @param id 文章ID
 * @param data 文章数据
 */
export function patchArticle(id: number, data: Partial<ArticleUpdateParams>) {
  logger.debug("API请求: 部分更新文章", { id, data });

  return http.request<ApiResponse<Article>>("patch", `/cms/articles/${id}/`, {
    data
  });
}

/**
 * 删除文章
 * @param id 文章ID
 */
export function deleteArticle(id: number) {
  logger.debug("API请求: 删除文章", { id });

  return http.request<ApiResponse<null>>("delete", `/cms/articles/${id}/`);
}

/**
 * 批量删除文章
 * @param ids 文章ID数组
 */
export function batchDeleteArticles(ids: number[]) {
  logger.debug("API请求: 批量删除文章", { ids });

  return http.request<ApiResponse<{ deleted: number[] }>>(
    "post",
    "/cms/articles/batch-delete/",
    { data: { ids } }
  );
}

/**
 * 发布文章
 * @param id 文章ID
 */
export function publishArticle(id: number) {
  logger.debug("API请求: 发布文章", { id });

  return http.request<ApiResponse<Article>>(
    "post",
    `/cms/articles/${id}/publish/`
  );
}

/**
 * 取消发布文章
 * @param id 文章ID
 */
export function unpublishArticle(id: number) {
  logger.debug("API请求: 取消发布文章", { id });

  return http.request<ApiResponse<Article>>(
    "post",
    `/cms/articles/${id}/unpublish/`
  );
}

/**
 * 归档文章
 * @param id 文章ID
 */
export function archiveArticle(id: number) {
  logger.debug("API请求: 归档文章", { id });

  return http.request<ApiResponse<Article>>(
    "post",
    `/cms/articles/${id}/archive/`
  );
}

/**
 * 获取文章版本历史
 * @param id 文章ID
 */
export function getArticleVersions(id: number) {
  logger.debug("API请求: 获取文章版本历史", { id });

  return http.request<ApiResponse<ArticleVersion[]>>(
    "get",
    `/cms/articles/${id}/versions/`
  );
}

/**
 * 获取特定版本的文章内容
 * @param id 文章ID
 * @param versionNumber 版本号
 */
export function getArticleVersionDetail(id: number, versionNumber: number) {
  logger.debug("API请求: 获取特定版本的文章内容", { id, versionNumber });

  return http.request<ApiResponse<Article>>(
    "get",
    `/cms/articles/${id}/versions/${versionNumber}/`
  );
}

/**
 * 获取文章统计数据
 * @param id 文章ID
 */
export function getArticleStatistics(id: number) {
  logger.debug("API请求: 获取文章统计数据", { id });

  return http.request<ApiResponse<ArticleStatistics>>(
    "get",
    `/cms/articles/${id}/statistics/`
  );
}

/**
 * 记录文章查看
 * @param id 文章ID
 */
export function recordArticleView(id: number) {
  logger.debug("API请求: 记录文章查看", { id });

  return http.request<ApiResponse<null>>("post", `/cms/articles/${id}/view/`);
}

// 评论相关API
// --------------------------------------------

/**
 * 获取评论列表
 * @param params 查询参数
 */
export function getCommentList(params: CommentListParams) {
  logger.debug("API请求: 获取评论列表", params);

  return http.request<PaginationResponse<Comment>>("get", "/cms/comments/", {
    params
  });
}

/**
 * 获取评论详情
 * @param id 评论ID
 */
export function getCommentDetail(id: number) {
  logger.debug("API请求: 获取评论详情", { id });

  return http.request<ApiResponse<Comment>>("get", `/cms/comments/${id}/`);
}

/**
 * 创建评论
 * @param data 评论数据
 */
export function createComment(data: CommentCreateParams) {
  logger.debug("API请求: 创建评论", data);

  return http.request<ApiResponse<Comment>>("post", "/cms/comments/", { data });
}

/**
 * 更新评论
 * @param id 评论ID
 * @param data 评论数据
 */
export function updateComment(id: number, data: CommentUpdateParams) {
  logger.debug("API请求: 更新评论", { id, data });

  return http.request<ApiResponse<Comment>>("patch", `/cms/comments/${id}/`, {
    data
  });
}

/**
 * 删除评论
 * @param id 评论ID
 */
export function deleteComment(id: number) {
  logger.debug("API请求: 删除评论", { id });

  return http.request<ApiResponse<null>>("delete", `/cms/comments/${id}/`);
}

/**
 * 批量审核评论
 * @param ids 评论ID数组
 * @param status 评论状态
 */
export function moderateComments(ids: number[], status: CommentStatus) {
  logger.debug("API请求: 批量审核评论", { ids, status });

  return http.request<ApiResponse<{ moderated: number[] }>>(
    "post",
    "/cms/comments/moderate/",
    { data: { ids, status } }
  );
}

/**
 * 获取评论回复列表
 * @param id 父评论ID
 */
export function getCommentReplies(id: number) {
  logger.debug("API请求: 获取评论回复列表", { id });

  return http.request<ApiResponse<Comment[]>>(
    "get",
    `/cms/comments/${id}/replies/`
  );
}

// 分类相关API
// --------------------------------------------

/**
 * 获取分类列表
 * @param params 查询参数
 */
export function getCategoryList(params?: CategoryListParams) {
  console.log("[CmsApi] getCategoryList - 开始请求分类列表, 参数:", params);
  return http.request<ApiResponse<Category[]>>("get", "/cms/categories/", {
    params
  }).then(response => {
    console.log("[CmsApi] getCategoryList - 请求成功, 响应:", response);
    
    // 详细检查响应格式
    if (!response) {
      console.error("[CmsApi] getCategoryList - 响应为空");
      throw new Error("获取分类列表失败: 响应为空");
    }
    
    if (!response.data) {
      console.error("[CmsApi] getCategoryList - 响应中没有data字段:", response);
      console.error("[CmsApi] getCategoryList - 响应类型:", typeof response);
      console.error("[CmsApi] getCategoryList - 响应包含的属性:", Object.keys(response));
      throw new Error("获取分类列表失败: 响应中没有data字段");
    }
    
    if (!Array.isArray(response.data)) {
      console.error("[CmsApi] getCategoryList - data不是数组:", response.data);
      console.error("[CmsApi] getCategoryList - data类型:", typeof response.data);
      throw new Error("获取分类列表失败: 响应中的data不是数组");
    }
    
    console.log("[CmsApi] getCategoryList - 成功获取分类列表, 数量:", response.data.length);
    if (response.data.length > 0) {
      console.log("[CmsApi] getCategoryList - 第一个分类示例:", response.data[0]);
    }
    
    return response;
  }).catch(error => {
    console.error("[CmsApi] getCategoryList - 请求失败:", error);
    if (error instanceof Error) {
      console.error("[CmsApi] getCategoryList - 错误详情:", error.message);
      console.error("[CmsApi] getCategoryList - 错误堆栈:", error.stack);
    }
    throw error;
  });
}

/**
 * 获取分类树形结构
 */
export function getCategoryTree() {
  return http.request<ApiResponse<Category[]>>("get", "/cms/categories/tree/");
}

/**
 * 获取分类详情
 * @param id 分类ID
 */
export function getCategoryDetail(id: number) {
  console.log("[CmsApi] getCategoryDetail - 开始请求分类详情, ID:", id);
  return http.request<ApiResponse<Category>>('get', `/cms/categories/${id}/`)
    .then(response => {
      console.log("[CmsApi] getCategoryDetail - 请求成功, 响应:", response);
      return response;
    })
    .catch(error => {
      console.error("[CmsApi] getCategoryDetail - 请求失败:", error);
      throw error;
    });
}

/**
 * 创建分类
 * @param data 分类数据
 */
export function createCategory(data: CategoryCreateParams) {
  console.log("API createCategory - 发送创建分类请求:", data);
  return http.request<ApiResponse<Category>>("post", "/cms/categories/", {
    data
  });
}

/**
 * 更新分类
 * @param id 分类ID
 * @param data 更新数据
 */
export function updateCategory(id: number, data: CategoryUpdateParams) {
  return http.request<ApiResponse<Category>>(
    "patch",
    `/cms/categories/${id}/`,
    { data }
  );
}

/**
 * 删除分类
 * @param id 分类ID
 */
export function deleteCategory(id: number) {
  return http.request<ApiResponse<null>>("delete", `/cms/categories/${id}/`);
}

/**
 * 更新分类排序
 * @param data 排序数据
 */
export function updateCategoryOrder(data: CategoryOrderParams[]) {
  return http.request<ApiResponse<null>>("post", "/cms/categories/reorder/", {
    data
  });
}

// 标签相关API
// --------------------------------------------

/**
 * 获取标签列表
 * @param params 查询参数
 */
export function getTagList(params?: TagListParams) {
  console.log("[CmsApi] getTagList - 开始请求标签列表, 参数:", params);
  return http.request<PaginationResponse<Tag>>("get", "/cms/tags/", { params })
    .then(response => {
      console.log("[CmsApi] getTagList - 请求成功, 响应:", response);
      return response;
    })
    .catch(error => {
      console.error("[CmsApi] getTagList - 请求失败:", error);
      throw error;
    });
}

/**
 * 获取标签详情
 * @param id 标签ID
 */
export function getTagDetail(id: number) {
  return http.request<ApiResponse<Tag>>("get", `/cms/tags/${id}/`);
}

/**
 * 创建标签
 * @param data 标签数据
 */
export function createTag(data: TagCreateParams) {
  return http.request<ApiResponse<Tag>>("post", "/cms/tags/", { data });
}

/**
 * 更新标签
 * @param id 标签ID
 * @param data 标签数据
 */
export function updateTag(id: number, data: TagUpdateParams) {
  return http.request<ApiResponse<Tag>>("patch", `/cms/tags/${id}/`, { data });
}

/**
 * 删除标签
 * @param id 标签ID
 */
export function deleteTag(id: number) {
  return http.request<ApiResponse<null>>("delete", `/cms/tags/${id}/`);
}

// 标签组相关API
// --------------------------------------------

/**
 * 获取标签组列表
 * @param params 查询参数
 */
export function getTagGroupList(params?: TagGroupListParams) {
  logger.debug("API请求: 获取标签组列表", params);

  return http.request<PaginationResponse<TagGroup>>("get", "/cms/tag-groups/", {
    params
  });
}

/**
 * 获取标签组详情
 * @param id 标签组ID
 */
export function getTagGroupDetail(id: number) {
  logger.debug("API请求: 获取标签组详情", { id });

  return http.request<ApiResponse<TagGroup>>("get", `/cms/tag-groups/${id}/`);
}

/**
 * 创建标签组
 * @param data 标签组数据
 */
export function createTagGroup(data: TagGroupCreateParams) {
  logger.debug("API请求: 创建标签组", data);

  return http.request<ApiResponse<TagGroup>>("post", "/cms/tag-groups/", {
    data
  });
}

/**
 * 更新标签组
 * @param id 标签组ID
 * @param data 标签组数据
 */
export function updateTagGroup(id: number, data: TagGroupUpdateParams) {
  logger.debug("API请求: 更新标签组", { id, data });

  return http.request<ApiResponse<TagGroup>>(
    "patch",
    `/cms/tag-groups/${id}/`,
    { data }
  );
}

/**
 * 删除标签组
 * @param id 标签组ID
 */
export function deleteTagGroup(id: number) {
  logger.debug("API请求: 删除标签组", { id });

  return http.request<ApiResponse<null>>("delete", `/cms/tag-groups/${id}/`);
}

/**
 * 获取标签组下的标签
 * @param id 标签组ID
 */
export function getTagsByGroup(id: number) {
  logger.debug("API请求: 获取标签组下的标签", { id });

  return http.request<ApiResponse<Tag[]>>("get", `/cms/tag-groups/${id}/tags/`);
}

# 第一阶段：基础结构搭建

## 概述

在第一阶段，我们将建立CMS模块的基础结构，包括创建必要的类型定义、API接口和状态管理。这些基础设施将为后续的UI组件开发提供支持。

## 1. CMS类型定义 (src/types/cms.ts)

根据API文档创建所有CMS相关的TypeScript类型定义。

### 关键类型包括：

#### 文章相关类型

```typescript
// 文章状态枚举
export type ArticleStatus = 'draft' | 'pending' | 'published' | 'archived';

// 文章可见性枚举
export type ArticleVisibility = 'public' | 'private' | 'password';

// 内容类型枚举
export type ContentType = 'markdown' | 'html';

// 文章模型
export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  content_type: ContentType;
  excerpt: string;
  author: number;
  author_info?: {
    id: number;
    username: string;
    avatar: string;
  };
  status: ArticleStatus;
  is_featured: boolean;
  is_pinned: boolean;
  allow_comment: boolean;
  visibility: ArticleVisibility;
  password?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  cover_image?: string;
  template?: string;
  sort_order?: number;
  tenant: number;
  categories?: number[] | CategorySimple[];
  tags?: number[] | TagSimple[];
  view_count?: number;
  comment_count?: number;
  like_count?: number;
}

// 文章列表参数
export interface ArticleListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: ArticleStatus;
  category?: number;
  tag?: number;
  author?: number;
  is_featured?: boolean;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 文章创建参数
export interface ArticleCreateParams {
  title: string;
  slug?: string;
  content: string;
  content_type: ContentType;
  excerpt?: string;
  status: ArticleStatus;
  is_featured?: boolean;
  is_pinned?: boolean;
  allow_comment?: boolean;
  visibility: ArticleVisibility;
  password?: string;
  cover_image?: string;
  template?: string;
  sort_order?: number;
  categories?: number[];
  tags?: number[];
}

// 文章更新参数
export interface ArticleUpdateParams extends Partial<ArticleCreateParams> {}
```

#### 评论相关类型

```typescript
// 评论状态枚举
export type CommentStatus = 'pending' | 'approved' | 'spam' | 'trash';

// 评论模型
export interface Comment {
  id: number;
  article: number;
  parent?: number;
  user?: number;
  user_info?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar: string;
  };
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
  content: string;
  status: CommentStatus;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  likes_count: number;
  tenant: number;
  replies_count: number;
}

// 评论列表参数
export interface CommentListParams {
  page?: number;
  per_page?: number;
  status?: CommentStatus;
  article?: number;
  user?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  parent?: number;
}

// 评论创建参数
export interface CommentCreateParams {
  article: number;
  parent?: number;
  content: string;
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
}

// 评论更新参数
export interface CommentUpdateParams {
  content?: string;
  status?: CommentStatus;
  is_pinned?: boolean;
}
```

#### 分类相关类型

```typescript
// 分类模型
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  parent_info?: CategorySimple;
  cover_image?: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  is_active: boolean;
  seo_title?: string;
  seo_description?: string;
  article_count: number;
  children?: Category[];
  tenant: number;
}

// 简化的分类信息
export interface CategorySimple {
  id: number;
  name: string;
  slug: string;
}

// 分类列表参数
export interface CategoryListParams {
  page?: number;
  per_page?: number;
  search?: string;
  parent?: number;
  is_active?: boolean;
}

// 分类创建参数
export interface CategoryCreateParams {
  name: string;
  slug?: string;
  description?: string;
  parent?: number;
  cover_image?: string;
  sort_order?: number;
  is_active?: boolean;
  seo_title?: string;
  seo_description?: string;
}

// 分类更新参数
export interface CategoryUpdateParams extends Partial<CategoryCreateParams> {}
```

#### 标签相关类型

```typescript
// 标签模型
export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  group?: number;
  group_info?: TagGroupSimple;
  created_at: string;
  updated_at: string;
  color?: string;
  is_active: boolean;
  article_count: number;
  tenant: number;
}

// 简化的标签信息
export interface TagSimple {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

// 标签组模型
export interface TagGroup {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  tag_count: number;
  tenant: number;
}

// 简化的标签组信息
export interface TagGroupSimple {
  id: number;
  name: string;
  slug: string;
}

// 标签列表参数
export interface TagListParams {
  page?: number;
  per_page?: number;
  search?: string;
  group?: number;
  is_active?: boolean;
}

// 标签创建参数
export interface TagCreateParams {
  name: string;
  slug?: string;
  description?: string;
  group?: number;
  color?: string;
  is_active?: boolean;
}

// 标签更新参数
export interface TagUpdateParams extends Partial<TagCreateParams> {}

// 标签组列表参数
export interface TagGroupListParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
}

// 标签组创建参数
export interface TagGroupCreateParams {
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}

// 标签组更新参数
export interface TagGroupUpdateParams extends Partial<TagGroupCreateParams> {}
```

## 2. CMS API接口 (src/api/modules/cms.ts)

根据API文档实现所有CMS相关的API接口。

### 关键API接口包括：

#### 文章相关API

```typescript
import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Article,
  ArticleListParams,
  ArticleCreateParams,
  ArticleUpdateParams
} from "@/types/cms";
import logger from "@/utils/logger";

/**
 * 获取文章列表
 * @param params 查询参数
 */
export function getArticleList(params: ArticleListParams) {
  logger.debug("API请求: 获取文章列表", params);
  
  return http.request<PaginationResponse<Article>>(
    "get",
    "/api/v1/cms/articles/",
    { params }
  );
}

/**
 * 获取文章详情
 * @param id 文章ID
 */
export function getArticleDetail(id: number) {
  logger.debug("API请求: 获取文章详情", { id });
  
  return http.request<ApiResponse<Article>>(
    "get",
    `/api/v1/cms/articles/${id}/`
  );
}

/**
 * 创建文章
 * @param data 文章数据
 */
export function createArticle(data: ArticleCreateParams) {
  logger.debug("API请求: 创建文章", data);
  
  return http.request<ApiResponse<Article>>(
    "post",
    "/api/v1/cms/articles/",
    { data }
  );
}

/**
 * 更新文章
 * @param id 文章ID
 * @param data 文章数据
 */
export function updateArticle(id: number, data: ArticleUpdateParams) {
  logger.debug("API请求: 更新文章", { id, data });
  
  return http.request<ApiResponse<Article>>(
    "put",
    `/api/v1/cms/articles/${id}/`,
    { data }
  );
}

/**
 * 部分更新文章
 * @param id 文章ID
 * @param data 文章数据
 */
export function patchArticle(id: number, data: Partial<ArticleUpdateParams>) {
  logger.debug("API请求: 部分更新文章", { id, data });
  
  return http.request<ApiResponse<Article>>(
    "patch",
    `/api/v1/cms/articles/${id}/`,
    { data }
  );
}

/**
 * 删除文章
 * @param id 文章ID
 */
export function deleteArticle(id: number) {
  logger.debug("API请求: 删除文章", { id });
  
  return http.request<ApiResponse<null>>(
    "delete",
    `/api/v1/cms/articles/${id}/`
  );
}

/**
 * 批量删除文章
 * @param ids 文章ID数组
 */
export function batchDeleteArticles(ids: number[]) {
  logger.debug("API请求: 批量删除文章", { ids });
  
  return http.request<ApiResponse<{deleted: number[]}>>(
    "post",
    "/api/v1/cms/articles/batch-delete/",
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
    `/api/v1/cms/articles/${id}/publish/`
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
    `/api/v1/cms/articles/${id}/unpublish/`
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
    `/api/v1/cms/articles/${id}/archive/`
  );
}

/**
 * 获取文章版本历史
 * @param id 文章ID
 */
export function getArticleVersions(id: number) {
  logger.debug("API请求: 获取文章版本历史", { id });
  
  return http.request<ApiResponse<Array<{
    version_number: number;
    created_at: string;
    user: {
      id: number;
      username: string;
    }
  }>>>(
    "get",
    `/api/v1/cms/articles/${id}/versions/`
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
    `/api/v1/cms/articles/${id}/versions/${versionNumber}/`
  );
}

/**
 * 获取文章统计数据
 * @param id 文章ID
 */
export function getArticleStatistics(id: number) {
  logger.debug("API请求: 获取文章统计数据", { id });
  
  return http.request<ApiResponse<{
    view_count: number;
    unique_view_count: number;
    comment_count: number;
    like_count: number;
    bookmark_count: number;
    average_reading_time: number;
    bounce_rate: number;
  }>>(
    "get",
    `/api/v1/cms/articles/${id}/statistics/`
  );
}

/**
 * 记录文章阅读
 * @param id 文章ID
 */
export function recordArticleView(id: number) {
  logger.debug("API请求: 记录文章阅读", { id });
  
  return http.request<ApiResponse<{
    success: boolean;
    view_count: number;
  }>>(
    "post",
    `/api/v1/cms/articles/${id}/view/`
  );
}
```

以上API接口先实现文章管理相关的，评论、分类和标签相关的API将在后续阶段实现。

## 3. CMS状态管理 (src/store/modules/cms.ts)

创建CMS状态管理文件，实现相关状态和操作。

```typescript
import { defineStore } from "pinia";
import { store } from "../utils";
import * as cmsApi from "@/api/modules/cms";
import type {
  Article,
  ArticleListParams,
  ArticleCreateParams,
  ArticleUpdateParams,
  Comment,
  CommentListParams,
  Category,
  Tag,
  TagGroup
} from "@/types/cms";
import type { PaginationData } from "@/types/api";
import logger from "@/utils/logger";

export const useCmsStore = defineStore("cms", {
  state: () => ({
    // 加载状态
    loading: {
      articleList: false,
      articleDetail: false,
      articleCreate: false,
      articleUpdate: false,
      articleDelete: false,
      articlePublish: false,
      articleUnpublish: false,
      articleArchive: false,
      articleVersions: false,
      articleStatistics: false,
      
      commentList: false,
      commentDetail: false,
      commentCreate: false,
      commentUpdate: false,
      commentDelete: false,
      commentModerate: false,
      
      categoryList: false,
      categoryDetail: false,
      categoryCreate: false,
      categoryUpdate: false,
      categoryDelete: false,
      
      tagList: false,
      tagDetail: false,
      tagCreate: false,
      tagUpdate: false,
      tagDelete: false,
      
      tagGroupList: false,
      tagGroupDetail: false,
      tagGroupCreate: false,
      tagGroupUpdate: false,
      tagGroupDelete: false
    },
    
    // 文章相关状态
    articles: {
      data: [] as Article[],
      total: 0,
      page: 1,
      limit: 10
    } as PaginationData<Article>,
    currentArticle: null as Article | null,
    articleVersions: [] as Array<{
      version_number: number;
      created_at: string;
      user: {
        id: number;
        username: string;
      }
    }>,
    articleStatistics: null as {
      view_count: number;
      unique_view_count: number;
      comment_count: number;
      like_count: number;
      bookmark_count: number;
      average_reading_time: number;
      bounce_rate: number;
    } | null,
    
    // 评论相关状态
    comments: {
      data: [] as Comment[],
      total: 0,
      page: 1,
      limit: 10
    } as PaginationData<Comment>,
    currentComment: null as Comment | null,
    
    // 分类相关状态
    categories: [] as Category[],
    categoryTree: [] as Category[],
    currentCategory: null as Category | null,
    
    // 标签相关状态
    tags: {
      data: [] as Tag[],
      total: 0,
      page: 1,
      limit: 10
    } as PaginationData<Tag>,
    currentTag: null as Tag | null,
    
    // 标签组相关状态
    tagGroups: {
      data: [] as TagGroup[],
      total: 0,
      page: 1,
      limit: 10
    } as PaginationData<TagGroup>,
    currentTagGroup: null as TagGroup | null
  }),
  
  actions: {
    // 文章相关操作
    async fetchArticleList(params: ArticleListParams) {
      this.loading.articleList = true;
      try {
        const { data } = await cmsApi.getArticleList(params);
        this.articles = data.data;
        return data;
      } catch (error) {
        logger.error("获取文章列表失败", error);
        throw error;
      } finally {
        this.loading.articleList = false;
      }
    },
    
    async fetchArticleDetail(id: number) {
      this.loading.articleDetail = true;
      try {
        const { data } = await cmsApi.getArticleDetail(id);
        this.currentArticle = data.data;
        return data;
      } catch (error) {
        logger.error("获取文章详情失败", error);
        throw error;
      } finally {
        this.loading.articleDetail = false;
      }
    },
    
    async createArticle(articleData: ArticleCreateParams) {
      this.loading.articleCreate = true;
      try {
        const { data } = await cmsApi.createArticle(articleData);
        return data;
      } catch (error) {
        logger.error("创建文章失败", error);
        throw error;
      } finally {
        this.loading.articleCreate = false;
      }
    },
    
    async updateArticle(id: number, articleData: ArticleUpdateParams) {
      this.loading.articleUpdate = true;
      try {
        const { data } = await cmsApi.updateArticle(id, articleData);
        if (this.currentArticle && this.currentArticle.id === id) {
          this.currentArticle = data.data;
        }
        return data;
      } catch (error) {
        logger.error("更新文章失败", error);
        throw error;
      } finally {
        this.loading.articleUpdate = false;
      }
    },
    
    async deleteArticle(id: number) {
      this.loading.articleDelete = true;
      try {
        const { data } = await cmsApi.deleteArticle(id);
        if (this.currentArticle && this.currentArticle.id === id) {
          this.currentArticle = null;
        }
        return data;
      } catch (error) {
        logger.error("删除文章失败", error);
        throw error;
      } finally {
        this.loading.articleDelete = false;
      }
    },
    
    async publishArticle(id: number) {
      this.loading.articlePublish = true;
      try {
        const { data } = await cmsApi.publishArticle(id);
        if (this.currentArticle && this.currentArticle.id === id) {
          this.currentArticle = data.data;
        }
        return data;
      } catch (error) {
        logger.error("发布文章失败", error);
        throw error;
      } finally {
        this.loading.articlePublish = false;
      }
    },
    
    async unpublishArticle(id: number) {
      this.loading.articleUnpublish = true;
      try {
        const { data } = await cmsApi.unpublishArticle(id);
        if (this.currentArticle && this.currentArticle.id === id) {
          this.currentArticle = data.data;
        }
        return data;
      } catch (error) {
        logger.error("取消发布文章失败", error);
        throw error;
      } finally {
        this.loading.articleUnpublish = false;
      }
    },
    
    async archiveArticle(id: number) {
      this.loading.articleArchive = true;
      try {
        const { data } = await cmsApi.archiveArticle(id);
        if (this.currentArticle && this.currentArticle.id === id) {
          this.currentArticle = data.data;
        }
        return data;
      } catch (error) {
        logger.error("归档文章失败", error);
        throw error;
      } finally {
        this.loading.articleArchive = false;
      }
    },
    
    async fetchArticleVersions(id: number) {
      this.loading.articleVersions = true;
      try {
        const { data } = await cmsApi.getArticleVersions(id);
        this.articleVersions = data.data;
        return data;
      } catch (error) {
        logger.error("获取文章版本历史失败", error);
        throw error;
      } finally {
        this.loading.articleVersions = false;
      }
    },
    
    async fetchArticleStatistics(id: number) {
      this.loading.articleStatistics = true;
      try {
        const { data } = await cmsApi.getArticleStatistics(id);
        this.articleStatistics = data.data;
        return data;
      } catch (error) {
        logger.error("获取文章统计数据失败", error);
        throw error;
      } finally {
        this.loading.articleStatistics = false;
      }
    }
    
    // 评论、分类和标签相关操作将在后续阶段实现
  }
});

export function useCmsStoreHook() {
  return useCmsStore(store);
}
```

## 下一步计划

完成这三个基础文件后，我们将继续实现CMS模块的UI组件。首先从文章管理功能开始，创建文章列表、创建、编辑和详情页面。
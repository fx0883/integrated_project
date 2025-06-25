import { defineStore } from "pinia";
import * as cmsApi from "@/api/modules/cms";
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
  TagGroupUpdateParams
} from "@/types/cms";
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";

/**
 * CMS模块状态接口
 */
interface CmsState {
  // 加载状态
  loading: {
    articleList: boolean;
    articleDetail: boolean;
    articleCreate: boolean;
    articleUpdate: boolean;
    articleDelete: boolean;
    articlePublish: boolean;
    articleUnpublish: boolean;
    articleArchive: boolean;
    articleVersions: boolean;
    articleStatistics: boolean;
    
    commentList: boolean;
    commentDetail: boolean;
    commentCreate: boolean;
    commentUpdate: boolean;
    commentDelete: boolean;
    commentModerate: boolean;
    
    categoryList: boolean;
    categoryTree: boolean;
    categoryDetail: boolean;
    categoryCreate: boolean;
    categoryUpdate: boolean;
    categoryDelete: boolean;
    categoryOrder: boolean;
    
    tagList: boolean;
    tagDetail: boolean;
    tagCreate: boolean;
    tagUpdate: boolean;
    tagDelete: boolean;
    
    tagGroupList: boolean;
    tagGroupDetail: boolean;
    tagGroupCreate: boolean;
    tagGroupUpdate: boolean;
    tagGroupDelete: boolean;
    tagsByGroup: boolean;
  };
  
  // 文章相关状态
  articles: PaginationData<Article>;
  currentArticle: Article | null;
  articleVersions: ArticleVersion[];
  articleStatistics: ArticleStatistics | null;
  
  // 评论相关状态
  comments: PaginationData<Comment>;
  currentComment: Comment | null;
  
  // 分类相关状态
  categories: Category[];
  categoryTree: Category[];
  currentCategory: Category | null;
  
  // 标签相关状态
  tags: PaginationData<Tag>;
  currentTag: Tag | null;
  
  // 标签组相关状态
  tagGroups: PaginationData<TagGroup>;
  currentTagGroup: TagGroup | null;
  tagsByGroup: Tag[];
}

/**
 * CMS模块状态管理
 */
export const useCmsStore = defineStore("cms", {
  state: (): CmsState => ({
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
      categoryTree: false,
      categoryDetail: false,
      categoryCreate: false,
      categoryUpdate: false,
      categoryDelete: false,
      categoryOrder: false,
      
      tagList: false,
      tagDetail: false,
      tagCreate: false,
      tagUpdate: false,
      tagDelete: false,
      
      tagGroupList: false,
      tagGroupDetail: false,
      tagGroupCreate: false,
      tagGroupUpdate: false,
      tagGroupDelete: false,
      tagsByGroup: false
    },
    
    articles: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentArticle: null,
    articleVersions: [],
    articleStatistics: null,
    
    comments: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentComment: null,
    
    categories: [],
    categoryTree: [],
    currentCategory: null,
    
    tags: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentTag: null,
    
    tagGroups: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentTagGroup: null,
    tagsByGroup: []
  }),
  
  actions: {
    // 文章相关操作
    // --------------------------------------------------
    
    /**
     * 获取文章列表
     */
    async fetchArticleList(params: ArticleListParams = {}) {
      this.loading.articleList = true;
      try {
        const response = await cmsApi.getArticleList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && typeof response.data === "object" && "results" in response.data && "count" in response.data) {
            this.articles = {
              total: (response.data.count as number) || 0,
              page: params.page || 1,
              limit: params.per_page || 10,
              data: Array.isArray(response.data.results) ? response.data.results : []
            };
          } else {
            logger.warn("文章列表数据结构不符合预期", response.data);
            this.articles.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          ElMessage.error(response.message || "获取文章列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取文章列表失败", error);
        ElMessage.error(error.message || "获取文章列表失败");
        throw error;
      } finally {
        this.loading.articleList = false;
      }
    },
    
    /**
     * 获取文章详情
     */
    async fetchArticleDetail(id: number) {
      this.loading.articleDetail = true;
      try {
        const response = await cmsApi.getArticleDetail(id);
        if (response.success) {
          this.currentArticle = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取文章详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取文章详情失败", error);
        ElMessage.error(error.message || "获取文章详情失败");
        throw error;
      } finally {
        this.loading.articleDetail = false;
      }
    },
    
    /**
     * 创建文章
     */
    async createArticle(articleData: ArticleCreateParams) {
      this.loading.articleCreate = true;
      try {
        const response = await cmsApi.createArticle(articleData);
        if (response.success) {
          ElMessage.success(response.message || "创建文章成功");
          return response;
        } else {
          ElMessage.error(response.message || "创建文章失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建文章失败", error);
        ElMessage.error(error.message || "创建文章失败");
        throw error;
      } finally {
        this.loading.articleCreate = false;
      }
    },
    
    /**
     * 更新文章
     */
    async updateArticle(id: number, articleData: ArticleUpdateParams) {
      this.loading.articleUpdate = true;
      try {
        const response = await cmsApi.updateArticle(id, articleData);
        if (response.success) {
          // 如果当前选中的文章是被更新的文章，则更新当前选中的文章信息
          if (this.currentArticle && this.currentArticle.id === id) {
            this.currentArticle = response.data;
          }
          ElMessage.success(response.message || "更新文章成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新文章失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新文章失败", error);
        ElMessage.error(error.message || "更新文章失败");
        throw error;
      } finally {
        this.loading.articleUpdate = false;
      }
    },
    
    /**
     * 部分更新文章
     */
    async patchArticle(id: number, articleData: Partial<ArticleUpdateParams>) {
      this.loading.articleUpdate = true;
      try {
        const response = await cmsApi.patchArticle(id, articleData);
        if (response.success) {
          // 如果当前选中的文章是被更新的文章，则更新当前选中的文章信息
          if (this.currentArticle && this.currentArticle.id === id) {
            this.currentArticle = response.data;
          }
          ElMessage.success(response.message || "更新文章成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新文章失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("部分更新文章失败", error);
        ElMessage.error(error.message || "更新文章失败");
        throw error;
      } finally {
        this.loading.articleUpdate = false;
      }
    },
    
    /**
     * 删除文章
     */
    async deleteArticle(id: number) {
      this.loading.articleDelete = true;
      try {
        const response = await cmsApi.deleteArticle(id);
        if (response.success) {
          // 如果当前选中的文章是被删除的文章，则清空当前选中的文章
          if (this.currentArticle && this.currentArticle.id === id) {
            this.currentArticle = null;
          }
          // 刷新列表
          this.articles.data = this.articles.data.filter(item => item.id !== id);
          ElMessage.success(response.message || "删除文章成功");
          return response;
        } else {
          ElMessage.error(response.message || "删除文章失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除文章失败", error);
        ElMessage.error(error.message || "删除文章失败");
        throw error;
      } finally {
        this.loading.articleDelete = false;
      }
    },
    
    /**
     * 批量删除文章
     */
    async batchDeleteArticles(ids: number[]) {
      this.loading.articleDelete = true;
      try {
        const response = await cmsApi.batchDeleteArticles(ids);
        if (response.success) {
          // 如果当前选中的文章在被删除列表中，则清空当前选中的文章
          if (this.currentArticle && ids.includes(this.currentArticle.id)) {
            this.currentArticle = null;
          }
          // 刷新列表
          this.articles.data = this.articles.data.filter(item => !ids.includes(item.id));
          ElMessage.success(response.message || "批量删除文章成功");
          return response;
        } else {
          ElMessage.error(response.message || "批量删除文章失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("批量删除文章失败", error);
        ElMessage.error(error.message || "批量删除文章失败");
        throw error;
      } finally {
        this.loading.articleDelete = false;
      }
    },
    
    /**
     * 发布文章
     */
    async publishArticle(id: number) {
      this.loading.articlePublish = true;
      try {
        const response = await cmsApi.publishArticle(id);
        if (response.success) {
          // 如果当前选中的文章是被发布的文章，则更新当前选中的文章信息
          if (this.currentArticle && this.currentArticle.id === id) {
            this.currentArticle = response.data;
          }
          // 更新列表中的数据
          const index = this.articles.data.findIndex(item => item.id === id);
          if (index !== -1) {
            this.articles.data[index] = {
              ...this.articles.data[index],
              status: "published",
              published_at: new Date().toISOString()
            };
          }
          ElMessage.success(response.message || "发布文章成功");
          return response;
        } else {
          ElMessage.error(response.message || "发布文章失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("发布文章失败", error);
        ElMessage.error(error.message || "发布文章失败");
        throw error;
      } finally {
        this.loading.articlePublish = false;
      }
    },
    
    // 评论相关操作
    // --------------------------------------------------
    
    /**
     * 获取评论列表
     */
    async fetchCommentList(params: CommentListParams = {}) {
      this.loading.commentList = true;
      try {
        const response = await cmsApi.getCommentList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && typeof response.data === "object" && "results" in response.data && "count" in response.data) {
            this.comments = {
              total: (response.data.count as number) || 0,
              page: params.page || 1,
              limit: params.per_page || 10,
              data: Array.isArray(response.data.results) ? response.data.results : []
            };
          } else {
            logger.warn("评论列表数据结构不符合预期", response.data);
            this.comments.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          ElMessage.error(response.message || "获取评论列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取评论列表失败", error);
        ElMessage.error(error.message || "获取评论列表失败");
        throw error;
      } finally {
        this.loading.commentList = false;
      }
    },
    
    /**
     * 获取评论详情
     */
    async fetchCommentDetail(id: number) {
      this.loading.commentDetail = true;
      try {
        const response = await cmsApi.getCommentDetail(id);
        if (response.success) {
          this.currentComment = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取评论详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取评论详情失败", error);
        ElMessage.error(error.message || "获取评论详情失败");
        throw error;
      } finally {
        this.loading.commentDetail = false;
      }
    },
    
    /**
     * 创建评论
     */
    async createComment(commentData: CommentCreateParams) {
      this.loading.commentCreate = true;
      try {
        const response = await cmsApi.createComment(commentData);
        if (response.success) {
          ElMessage.success("评论创建成功");
          return response;
        } else {
          ElMessage.error(response.message || "评论创建失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("评论创建失败", error);
        ElMessage.error(error.message || "评论创建失败");
        throw error;
      } finally {
        this.loading.commentCreate = false;
      }
    },
    
    /**
     * 更新评论
     */
    async updateComment(id: number, commentData: CommentUpdateParams) {
      this.loading.commentUpdate = true;
      try {
        const response = await cmsApi.updateComment(id, commentData);
        if (response.success) {
          ElMessage.success("评论更新成功");
          return response;
        } else {
          ElMessage.error(response.message || "评论更新失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("评论更新失败", error);
        ElMessage.error(error.message || "评论更新失败");
        throw error;
      } finally {
        this.loading.commentUpdate = false;
      }
    },
    
    /**
     * 删除评论
     */
    async deleteComment(id: number) {
      this.loading.commentDelete = true;
      try {
        const response = await cmsApi.deleteComment(id);
        if (response.success) {
          ElMessage.success("评论删除成功");
          return response;
        } else {
          ElMessage.error(response.message || "评论删除失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("评论删除失败", error);
        ElMessage.error(error.message || "评论删除失败");
        throw error;
      } finally {
        this.loading.commentDelete = false;
      }
    },
    
    /**
     * 批准评论
     */
    async approveComment(id: number) {
      this.loading.commentModerate = true;
      try {
        const response = await cmsApi.moderateComments([id], "approved");
        if (response.success) {
          ElMessage.success("评论已批准");
          return response;
        } else {
          ElMessage.error(response.message || "批准评论失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("批准评论失败", error);
        ElMessage.error(error.message || "批准评论失败");
        throw error;
      } finally {
        this.loading.commentModerate = false;
      }
    },
    
    /**
     * 拒绝评论
     */
    async rejectComment(id: number) {
      this.loading.commentModerate = true;
      try {
        const response = await cmsApi.moderateComments([id], "trash");
        if (response.success) {
          ElMessage.success("评论已拒绝");
          return response;
        } else {
          ElMessage.error(response.message || "拒绝评论失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("拒绝评论失败", error);
        ElMessage.error(error.message || "拒绝评论失败");
        throw error;
      } finally {
        this.loading.commentModerate = false;
      }
    },
    
    /**
     * 标记为垃圾评论
     */
    async markCommentAsSpam(id: number) {
      this.loading.commentModerate = true;
      try {
        const response = await cmsApi.moderateComments([id], "spam");
        if (response.success) {
          ElMessage.success("已标记为垃圾评论");
          return response;
        } else {
          ElMessage.error(response.message || "标记垃圾评论失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("标记垃圾评论失败", error);
        ElMessage.error(error.message || "标记垃圾评论失败");
        throw error;
      } finally {
        this.loading.commentModerate = false;
      }
    },
    
    /**
     * 批量处理评论
     */
    async batchProcessComments(commentIds: number[], action: CommentStatus) {
      this.loading.commentModerate = true;
      try {
        const response = await cmsApi.moderateComments(commentIds, action);
        if (response.success) {
          ElMessage.success("批量操作成功");
          return response;
        } else {
          ElMessage.error(response.message || "批量操作失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("批量操作失败", error);
        ElMessage.error(error.message || "批量操作失败");
        throw error;
      } finally {
        this.loading.commentModerate = false;
      }
    },
    
    /**
     * 获取评论回复
     */
    async fetchCommentReplies(id: number) {
      this.loading.commentList = true;
      try {
        const response = await cmsApi.getCommentReplies(id);
        if (response.success) {
          return response;
        } else {
          ElMessage.error(response.message || "获取评论回复失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取评论回复失败", error);
        ElMessage.error(error.message || "获取评论回复失败");
        throw error;
      } finally {
        this.loading.commentList = false;
      }
    },
    
    /**
     * 重置CMS状态
     */
    resetCmsState() {
      this.articles = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentArticle = null;
      this.articleVersions = [];
      this.articleStatistics = null;
      
      this.comments = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentComment = null;
      
      this.categories = [];
      this.categoryTree = [];
      this.currentCategory = null;
      
      this.tags = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentTag = null;
      
      this.tagGroups = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentTagGroup = null;
      this.tagsByGroup = [];
    }
  }
});

/**
 * 封装使用CMS Store的hook
 */
export function useCmsStoreHook() {
  return useCmsStore();
} 
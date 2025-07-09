import { defineStore } from "pinia";
import * as cmsApi from "@/api/modules/cms";
import { uploadFile } from "@/api/modules/common";
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
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";
import {
  getArticleList,
  getArticleDetail,
  createArticle,
  updateArticle,
  deleteArticle,
  getCommentList,
  getCommentDetail,
  updateCommentStatus,
  getCategoryList,
  getCategoryTree,
  getCategoryDetail,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  getTagList,
  getTagDetail,
  createTag,
  updateTag,
  deleteTag
} from "@/api/modules/cms";

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
    articleVersionDetail: boolean;
    articleStatistics: boolean;
    uploadCoverImage: boolean;

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
  currentVersionDetail: Article | null;
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

  // 文章相关
  articleList: Article[];
  articleTotal: number;
  articleDetail: Article | null;
  articleLoading: boolean;

  // 评论相关
  commentList: Comment[];
  commentTotal: number;
  commentDetail: Comment | null;
  commentLoading: boolean;

  // 分类相关
  categoryList: Category[];
  categoryTotal: number;
  categoryDetail: Category | null;
  categoryLoading: boolean;

  // 标签相关
  tagList: Tag[];
  tagTotal: number;
  tagDetail: Tag | null;
  tagLoading: boolean;
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
      articleVersionDetail: false,
      articleStatistics: false,
      uploadCoverImage: false,

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
    currentVersionDetail: null,
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
    tagsByGroup: [],

    // 文章相关
    articleList: [],
    articleTotal: 0,
    articleDetail: null,
    articleLoading: false,

    // 评论相关
    commentList: [],
    commentTotal: 0,
    commentDetail: null,
    commentLoading: false,

    // 分类相关
    categoryList: [],
    categoryTotal: 0,
    categoryDetail: null,
    categoryLoading: false,

    // 标签相关
    tagList: [],
    tagTotal: 0,
    tagDetail: null,
    tagLoading: false
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
          if (
            response.data &&
            typeof response.data === "object"
          ) {
            // 适配新的API响应结构
            if ("pagination" in response.data && "results" in response.data) {
              // 新的API响应结构
              const { pagination, results } = response.data;
              this.articles = {
                total: pagination.count || 0,
                page: pagination.current_page || params.page || 1,
                limit: pagination.page_size || params.per_page || 10,
                data: Array.isArray(results) ? results : []
              };
            } else if ("results" in response.data && "count" in response.data) {
              // 旧的API响应结构
              this.articles = {
                total: (response.data.count as number) || 0,
                page: params.page || 1,
                limit: params.per_page || 10,
                data: Array.isArray(response.data.results)
                  ? response.data.results
                  : []
              };
            } else {
              logger.warn("文章列表数据结构不符合预期", response.data);
              this.articles.data = Array.isArray(response.data)
                ? response.data
                : [];
            }
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

    // 获取文章版本历史
    async fetchArticleVersions(id: number) {
      this.loading.articleVersions = true;
      try {
        const response = await cmsApi.getArticleVersions(id);
        this.articleVersions = response.data;
        return response;
      } catch (error) {
        logger.error("获取文章版本历史失败", error);
        throw error;
      } finally {
        this.loading.articleVersions = false;
      }
    },

    // 获取特定版本的文章详情
    async fetchArticleVersionDetail(id: number, versionNumber: number) {
      this.loading.articleVersionDetail = true;
      try {
        const response = await cmsApi.getArticleVersionDetail(
          id,
          versionNumber
        );
        this.currentVersionDetail = response.data;
        return response;
      } catch (error) {
        logger.error("获取文章版本详情失败", error);
        throw error;
      } finally {
        this.loading.articleVersionDetail = false;
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
          this.articles.data = this.articles.data.filter(
            item => item.id !== id
          );
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
          this.articles.data = this.articles.data.filter(
            item => !ids.includes(item.id)
          );
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
          if (
            response.data &&
            typeof response.data === "object" &&
            "results" in response.data &&
            "count" in response.data
          ) {
            this.comments = {
              total: (response.data.count as number) || 0,
              page: params.page || 1,
              limit: params.per_page || 10,
              data: Array.isArray(response.data.results)
                ? response.data.results
                : []
            };
          } else {
            logger.warn("评论列表数据结构不符合预期", response.data);
            this.comments.data = Array.isArray(response.data)
              ? response.data
              : [];
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

    // 分类相关操作
    // ------------------------

    /**
     * 获取分类列表
     */
    async fetchCategoryList(params?: CategoryListParams) {
      console.log("[CmsStore] fetchCategoryList - 开始获取分类列表, 参数:", params);
      this.categoryLoading = true;
      this.loading.categoryList = true;
      try {
        const response = await getCategoryList(params);
        console.log("[CmsStore] fetchCategoryList - 分类列表API响应:", response);
        
        // 详细检查响应格式
        if (response && response.data) {
          console.log("[CmsStore] fetchCategoryList - 分类列表数据有效, 长度:", response.data.length);
          console.log("[CmsStore] fetchCategoryList - 第一个分类示例:", response.data[0]);
          this.categoryList = response.data;
          this.categoryTotal = response.data.length;
          this.categories = response.data; // 确保同时更新categories字段
          return response.data; // 直接返回数据数组，方便组件使用
        } else if (response && response.success && response.data) {
          console.log("[CmsStore] fetchCategoryList - 分类列表数据有效 (success.data), 长度:", response.data.length);
          this.categoryList = response.data;
          this.categoryTotal = response.data.length;
          this.categories = response.data;
          return response.data; // 直接返回数据数组
        } else {
          console.error("[CmsStore] fetchCategoryList - 分类列表API响应格式异常:", response);
          console.error("[CmsStore] fetchCategoryList - 响应类型:", typeof response);
          if (response) {
            console.error("[CmsStore] fetchCategoryList - 响应包含的属性:", Object.keys(response));
          }
          this.categoryList = [];
          this.categoryTotal = 0;
          this.categories = [];
          return []; // 返回空数组
        }
      } catch (error) {
        console.error("[CmsStore] fetchCategoryList - 获取分类列表失败", error);
        if (error instanceof Error) {
          console.error("[CmsStore] fetchCategoryList - 错误详情:", error.message);
          console.error("[CmsStore] fetchCategoryList - 错误堆栈:", error.stack);
        }
        ElMessage.error("获取分类列表失败");
        // 确保错误时重置为空数组
        this.categoryList = [];
        this.categoryTotal = 0;
        this.categories = [];
        return []; // 返回空数组
      } finally {
        this.categoryLoading = false;
        this.loading.categoryList = false;
      }
    },

    /**
     * 获取分类树
     */
    async fetchCategoryTree() {
      this.categoryLoading = true;
      try {
        // 首先获取分类列表
        await this.fetchCategoryList();
        
        // 从分类列表构建树形结构
        const buildTree = () => {
          // 找出所有顶级分类（没有父级的分类）
          const rootCategories = this.categoryList.filter(item => !item.parent);
          
          // 递归构建子树
          const buildSubTree = (parentId: number): Category[] => {
            return this.categoryList
              .filter(item => item.parent === parentId)
              .map(item => ({
                ...item,
                children: buildSubTree(item.id)
              }));
          };
          
          // 为每个顶级分类添加子分类
          return rootCategories.map(root => ({
            ...root,
            children: buildSubTree(root.id)
          }));
        };
        
        this.categoryTree = buildTree();
        console.log("构建的树形结构:", this.categoryTree);
        
        return this.categoryTree;
      } catch (error) {
        console.error("构建分类树失败", error);
        // 确保错误时也设置为空数组
        this.categoryTree = [];
        ElMessage.error("获取分类树失败");
        throw error;
      } finally {
        this.categoryLoading = false;
      }
    },

    /**
     * 获取分类详情
     */
    async fetchCategoryDetail(id: number) {
      this.categoryLoading = true;
      try {
        console.log("[CmsStore] fetchCategoryDetail - 开始获取分类详情:", id);
        const response = await getCategoryDetail(id);
        console.log("[CmsStore] fetchCategoryDetail - API响应:", response);
        
        if (response && response.data) {
          console.log("[CmsStore] fetchCategoryDetail - 分类详情数据:", response.data);
          this.categoryDetail = response.data;
          this.currentCategory = response.data;
          return response.data;
        } else {
          console.error("[CmsStore] fetchCategoryDetail - API响应格式异常:", response);
          return null;
        }
      } catch (error) {
        console.error("[CmsStore] fetchCategoryDetail - 获取分类详情失败:", error);
        ElMessage.error("获取分类详情失败");
        throw error;
      } finally {
        this.categoryLoading = false;
      }
    },

    /**
     * 创建分类
     */
    async createCategory(params: CategoryCreateParams) {
      console.log("Store createCategory - 开始创建分类:", params);
      this.categoryLoading = true;
      try {
        const { data } = await createCategory(params);
        console.log("Store createCategory - 创建分类成功:", data);
        ElMessage.success("创建分类成功");
        return data;
      } catch (error) {
        console.error("Store createCategory - 创建分类失败:", error);
        ElMessage.error("创建分类失败");
        throw error;
      } finally {
        this.categoryLoading = false;
      }
    },

    /**
     * 更新分类
     */
    async updateCategory(id: number, params: CategoryUpdateParams) {
      this.categoryLoading = true;
      try {
        const { data } = await updateCategory(id, params);
        ElMessage.success("更新分类成功");
        return data;
      } catch (error) {
        ElMessage.error("更新分类失败");
        throw error;
      } finally {
        this.categoryLoading = false;
      }
    },

    /**
     * 删除分类
     */
    async deleteCategory(id: number) {
      this.categoryLoading = true;
      try {
        await deleteCategory(id);
        ElMessage.success("删除分类成功");
        return true;
      } catch (error) {
        ElMessage.error("删除分类失败");
        throw error;
      } finally {
        this.categoryLoading = false;
      }
    },

    /**
     * 更新分类排序
     */
    async updateCategoryOrder(params: CategoryOrderParams[]) {
      this.categoryLoading = true;
      try {
        await updateCategoryOrder(params);
        ElMessage.success("更新分类排序成功");
        return true;
      } catch (error) {
        ElMessage.error("更新分类排序失败");
        throw error;
      } finally {
        this.categoryLoading = false;
      }
    },

    // 标签相关操作
    // --------------------------------------------

    /**
     * 获取标签列表
     */
    async fetchTagList(params?: TagListParams) {
      console.log("[CmsStore] fetchTagList - 开始获取标签列表, 参数:", params);
      this.tagLoading = true;
      try {
        const response = await getTagList(params);
        console.log("[CmsStore] fetchTagList - 标签列表API响应:", response);
        
        // 处理API响应
        if (response && response.data) {
          console.log("[CmsStore] fetchTagList - 响应数据:", response.data);
          // 如果有分页结构
          if (response.data.results && Array.isArray(response.data.results)) {
            console.log("[CmsStore] fetchTagList - 标签列表数据长度:", response.data.results.length);
            this.tagList = response.data.results;
            this.tagTotal = response.data.count || response.data.results.length;
            // 同时更新tags字段
            this.tags.data = response.data.results;
            this.tags.total = response.data.count || response.data.results.length;
          } else if (Array.isArray(response.data)) {
            // 如果直接是数组
            console.log("[CmsStore] fetchTagList - 标签列表是数组，长度:", response.data.length);
            this.tagList = response.data;
            this.tagTotal = response.data.length;
            // 同时更新tags字段
            this.tags.data = response.data;
            this.tags.total = response.data.length;
          } else {
            console.error("[CmsStore] fetchTagList - 标签列表API响应格式异常:", response.data);
            this.tagList = [];
            this.tagTotal = 0;
            this.tags.data = [];
            this.tags.total = 0;
          }
        } else {
          console.error("[CmsStore] fetchTagList - 标签列表API响应异常:", response);
          this.tagList = [];
          this.tagTotal = 0;
          this.tags.data = [];
          this.tags.total = 0;
        }
        
        return response;
      } catch (error) {
        console.error("[CmsStore] fetchTagList - 获取标签列表失败:", error);
        ElMessage.error("获取标签列表失败");
        // 确保错误时重置为空数组
        this.tagList = [];
        this.tagTotal = 0;
        this.tags.data = [];
        this.tags.total = 0;
        throw error;
      } finally {
        this.tagLoading = false;
      }
    },

    /**
     * 获取标签详情
     */
    async fetchTagDetail(id: number) {
      this.tagLoading = true;
      try {
        const response = await getTagDetail(id);
        this.tagDetail = response.data;
        return response;
      } catch (error) {
        ElMessage.error("获取标签详情失败");
        throw error;
      } finally {
        this.tagLoading = false;
      }
    },

    /**
     * 创建标签
     */
    async createTag(data: TagCreateParams) {
      this.tagLoading = true;
      try {
        const response = await createTag(data);
        ElMessage.success("创建标签成功");
        return response;
      } catch (error) {
        ElMessage.error("创建标签失败");
        throw error;
      } finally {
        this.tagLoading = false;
      }
    },

    /**
     * 更新标签
     */
    async updateTag(id: number, data: TagUpdateParams) {
      this.tagLoading = true;
      try {
        const response = await updateTag(id, data);
        ElMessage.success("更新标签成功");
        return response;
      } catch (error) {
        ElMessage.error("更新标签失败");
        throw error;
      } finally {
        this.tagLoading = false;
      }
    },

    /**
     * 删除标签
     */
    async deleteTag(id: number) {
      this.tagLoading = true;
      try {
        const response = await deleteTag(id);
        ElMessage.success("删除标签成功");
        return response;
      } catch (error) {
        ElMessage.error("删除标签失败");
        throw error;
      } finally {
        this.tagLoading = false;
      }
    },

    /**
     * 上传文章封面图片
     */
    async uploadCoverImage(file: File, folder: string = "article_covers") {
      this.loading.uploadCoverImage = true;
      try {
        const response = await uploadFile(file, folder);
        if (response.success) {
          ElMessage.success(response.message || "图片上传成功");
          return response.data;
        } else {
          ElMessage.error(response.message || "图片上传失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("上传图片失败", error);
        ElMessage.error(error.message || "上传图片失败");
        throw error;
      } finally {
        this.loading.uploadCoverImage = false;
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

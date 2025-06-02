import { defineStore } from "pinia";
import { store } from "../../utils";
import type { ArticleState, ArticleDetail, ArticleListItem } from "../../../../types/cms/article";
import { 
  getArticles, 
  getArticleById, 
  createArticle, 
  updateArticle, 
  deleteArticle, 
  publishArticle, 
  archiveArticle, 
  featuredArticle 
} from "@/api/cms/article";

export const useArticleStore = defineStore("article", {
  state: (): ArticleState => ({
    articles: [],
    total: 0,
    loading: false,
    currentArticle: null
  }),
  getters: {
    getArticleById: state => (id: number): ArticleListItem | undefined => {
      return state.articles.find(article => article.id === id);
    }
  },
  actions: {
    /** 获取文章列表 */
    async fetchArticles(params: any = {}) {
      this.loading = true;
      try {
        const { data } = await getArticles(params);
        if (data) {
          this.articles = data.list;
          this.total = data.total;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取文章列表失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取文章详情 */
    async fetchArticleDetail(id: number) {
      this.loading = true;
      try {
        const { data } = await getArticleById(id);
        if (data) {
          this.currentArticle = data;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取文章详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 创建文章 */
    async createArticle(articleData: any) {
      this.loading = true;
      try {
        const result = await createArticle(articleData);
        return result;
      } catch (error) {
        console.error("创建文章失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 更新文章 */
    async updateArticle(id: number, articleData: any) {
      this.loading = true;
      try {
        const result = await updateArticle(id, articleData);
        return result;
      } catch (error) {
        console.error("更新文章失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 删除文章 */
    async deleteArticle(id: number) {
      this.loading = true;
      try {
        const result = await deleteArticle(id);
        if (result.success) {
          // 删除成功后更新列表
          this.articles = this.articles.filter(article => article.id !== id);
        }
        return result;
      } catch (error) {
        console.error("删除文章失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 发布文章 */
    async publishArticle(id: number) {
      this.loading = true;
      try {
        const result = await publishArticle(id);
        if (result.success) {
          // 更新文章状态
          const article = this.articles.find(article => article.id === id);
          if (article) {
            article.status = 'published';
          }
          if (this.currentArticle && this.currentArticle.id === id) {
            this.currentArticle.status = 'published';
          }
        }
        return result;
      } catch (error) {
        console.error("发布文章失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 归档文章 */
    async archiveArticle(id: number) {
      this.loading = true;
      try {
        const result = await archiveArticle(id);
        if (result.success) {
          // 更新文章状态
          const article = this.articles.find(article => article.id === id);
          if (article) {
            article.status = 'archived';
          }
          if (this.currentArticle && this.currentArticle.id === id) {
            this.currentArticle.status = 'archived';
          }
        }
        return result;
      } catch (error) {
        console.error("归档文章失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 置顶/取消置顶文章 */
    async featuredArticle(id: number, featured: boolean) {
      this.loading = true;
      try {
        const result = await featuredArticle(id, featured);
        if (result.success) {
          // 更新文章置顶状态
          const article = this.articles.find(article => article.id === id);
          if (article) {
            article.is_featured = featured;
          }
          if (this.currentArticle && this.currentArticle.id === id) {
            this.currentArticle.is_featured = featured;
          }
        }
        return result;
      } catch (error) {
        console.error(`${featured ? '置顶' : '取消置顶'}文章失败:`, error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 重置状态 */
    resetState() {
      this.articles = [];
      this.total = 0;
      this.currentArticle = null;
    }
  }
});

export function useArticleStoreHook() {
  return useArticleStore(store);
} 
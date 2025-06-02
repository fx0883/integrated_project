import { defineStore } from "pinia";
import { http } from "@/utils/http";
import { message } from "@/utils/message";
import { formatResponse, handleResponse } from "@/utils/http/response";

interface CmsStatisticsState {
  overview: {
    article_count: number;
    category_count: number;
    tag_count: number;
    comment_count: number;
    view_count: number;
    today_articles: number;
    today_comments: number;
    today_views: number;
  };
  articleTrend: Array<{
    date: string;
    count: number;
  }>;
  commentTrend: Array<{
    date: string;
    count: number;
  }>;
  viewTrend: Array<{
    date: string;
    count: number;
  }>;
  popularArticles: Array<{
    id: number;
    title: string;
    view_count: number;
    comment_count: number;
    created_at: string;
  }>;
  categoryDistribution: Array<{
    category_id: number;
    category_name: string;
    article_count: number;
  }>;
  loading: boolean;
}

export const useCmsStatisticsStore = defineStore("cms-statistics", {
  state: (): CmsStatisticsState => ({
    overview: {
      article_count: 0,
      category_count: 0,
      tag_count: 0,
      comment_count: 0,
      view_count: 0,
      today_articles: 0,
      today_comments: 0,
      today_views: 0
    },
    articleTrend: [],
    commentTrend: [],
    viewTrend: [],
    popularArticles: [],
    categoryDistribution: [],
    loading: false
  }),

  actions: {
    /** 获取CMS统计概览数据 */
    async fetchStatisticsOverview() {
      this.loading = true;
      try {
        const response = await http.request<any>("get", "/api/cms/statistics/overview");
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data) {
          this.overview = {
            article_count: data.article_count || 0,
            category_count: data.category_count || 0,
            tag_count: data.tag_count || 0,
            comment_count: data.comment_count || 0,
            view_count: data.view_count || 0,
            today_articles: data.today_articles || 0,
            today_comments: data.today_comments || 0,
            today_views: data.today_views || 0
          };
          return this.overview;
        }
        return null;
      } catch (error) {
        console.error("获取CMS统计概览数据失败:", error);
        message("获取CMS统计概览数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取文章趋势数据 */
    async fetchArticleTrend(params?: any) {
      this.loading = true;
      try {
        const response = await http.request<any>("get", "/api/cms/statistics/article-trend", { params });
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data && Array.isArray(data)) {
          this.articleTrend = data;
          return this.articleTrend;
        }
        return null;
      } catch (error) {
        console.error("获取文章趋势数据失败:", error);
        message("获取文章趋势数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取评论趋势数据 */
    async fetchCommentTrend(params?: any) {
      this.loading = true;
      try {
        const response = await http.request<any>("get", "/api/cms/statistics/comment-trend", { params });
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data && Array.isArray(data)) {
          this.commentTrend = data;
          return this.commentTrend;
        }
        return null;
      } catch (error) {
        console.error("获取评论趋势数据失败:", error);
        message("获取评论趋势数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取浏览量趋势数据 */
    async fetchViewTrend(params?: any) {
      this.loading = true;
      try {
        const response = await http.request<any>("get", "/api/cms/statistics/view-trend", { params });
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data && Array.isArray(data)) {
          this.viewTrend = data;
          return this.viewTrend;
        }
        return null;
      } catch (error) {
        console.error("获取浏览量趋势数据失败:", error);
        message("获取浏览量趋势数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取热门文章数据 */
    async fetchPopularArticles(params?: any) {
      this.loading = true;
      try {
        const response = await http.request<any>("get", "/api/cms/statistics/popular-articles", { params });
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data && Array.isArray(data)) {
          this.popularArticles = data;
          return this.popularArticles;
        }
        return null;
      } catch (error) {
        console.error("获取热门文章数据失败:", error);
        message("获取热门文章数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取分类分布数据 */
    async fetchCategoryDistribution() {
      this.loading = true;
      try {
        const response = await http.request<any>("get", "/api/cms/statistics/category-distribution");
        const standardResponse = formatResponse(response);
        const data = handleResponse(standardResponse);
        
        if (data && Array.isArray(data)) {
          this.categoryDistribution = data;
          return this.categoryDistribution;
        }
        return null;
      } catch (error) {
        console.error("获取分类分布数据失败:", error);
        message("获取分类分布数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取所有统计数据 */
    async fetchAllStatistics(params?: any) {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchStatisticsOverview(),
          this.fetchArticleTrend(params),
          this.fetchCommentTrend(params),
          this.fetchViewTrend(params),
          this.fetchPopularArticles(params),
          this.fetchCategoryDistribution()
        ]);
        return true;
      } catch (error) {
        console.error("获取CMS统计数据失败:", error);
        message("获取CMS统计数据失败", { type: "error" });
        return false;
      } finally {
        this.loading = false;
      }
    },

    /** 重置统计数据 */
    resetStatistics() {
      this.overview = {
        article_count: 0,
        category_count: 0,
        tag_count: 0,
        comment_count: 0,
        view_count: 0,
        today_articles: 0,
        today_comments: 0,
        today_views: 0
      };
      this.articleTrend = [];
      this.commentTrend = [];
      this.viewTrend = [];
      this.popularArticles = [];
      this.categoryDistribution = [];
    }
  }
});

export function useCmsStatisticsStoreHook() {
  return useCmsStatisticsStore();
} 
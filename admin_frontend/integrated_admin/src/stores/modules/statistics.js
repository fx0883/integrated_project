import { defineStore } from 'pinia'
import { statisticsApi } from '@/api/statistics'
import { ElMessage } from 'element-plus'
import { format, subDays, subMonths } from 'date-fns'

export const useStatisticsStore = defineStore('statistics', {
  state: () => ({
    loading: false,
    dateRange: [
      format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      format(new Date(), 'yyyy-MM-dd')
    ],
    overviewData: null,
    visitData: [],
    commentData: [],
    popularArticles: [],
    popularCategories: [],
    popularTags: [],
    interactionData: {
      source: [],
      device: [],
      time: []
    },
    visitTimeUnit: 'day',
    commentTimeUnit: 'day',
    interactionTab: 'source'
  }),
  
  getters: {
    getArticlesCount: (state) => {
      return state.overviewData?.articles_count || 0
    },
    
    getViewsCount: (state) => {
      return state.overviewData?.views_count || 0
    },
    
    getCommentsCount: (state) => {
      return state.overviewData?.comments_count || 0
    },
    
    getInteractionsCount: (state) => {
      return state.overviewData?.interactions_count || 0
    },
    
    getArticlesChange: (state) => {
      return state.overviewData?.articles_change || 0
    },
    
    getViewsChange: (state) => {
      return state.overviewData?.views_change || 0
    },
    
    getCommentsChange: (state) => {
      return state.overviewData?.comments_change || 0
    },
    
    getInteractionsChange: (state) => {
      return state.overviewData?.interactions_change || 0
    }
  },
  
  actions: {
    // 设置日期范围
    setDateRange(dateRange) {
      this.dateRange = dateRange
    },
    
    // 设置时间单位
    setVisitTimeUnit(unit) {
      this.visitTimeUnit = unit
    },
    
    setCommentTimeUnit(unit) {
      this.commentTimeUnit = unit
    },
    
    setInteractionTab(tab) {
      this.interactionTab = tab
    },
    
    // 加载所有统计数据
    async loadAllData() {
      this.loading = true
      try {
        // 并行加载多个数据
        await Promise.all([
          this.loadOverviewData(),
          this.loadVisitData(),
          this.loadCommentData(),
          this.loadPopularArticles(),
          this.loadPopularCategories(),
          this.loadPopularTags(),
          this.loadInteractionData()
        ])
      } catch (error) {
        console.error('加载统计数据失败:', error)
        ElMessage.error('加载统计数据失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    
    // 加载概览数据
    async loadOverviewData() {
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1]
        }
        const response = await statisticsApi.getCmsOverview(params)
        this.overviewData = response.data
      } catch (error) {
        console.error('加载概览数据失败:', error)
        throw error
      }
    },
    
    // 加载访问数据
    async loadVisitData() {
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1],
          unit: this.visitTimeUnit
        }
        const response = await statisticsApi.getAccessLogStatistics(params)
        this.visitData = response.data
      } catch (error) {
        console.error('加载访问数据失败:', error)
        throw error
      }
    },
    
    // 加载评论数据
    async loadCommentData() {
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1],
          unit: this.commentTimeUnit
        }
        const response = await statisticsApi.getCommentStatistics(params)
        this.commentData = response.data
      } catch (error) {
        console.error('加载评论数据失败:', error)
        throw error
      }
    },
    
    // 加载热门文章
    async loadPopularArticles() {
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1],
          limit: 10
        }
        const response = await statisticsApi.getPopularArticles(params)
        this.popularArticles = response.data
      } catch (error) {
        console.error('加载热门文章失败:', error)
        throw error
      }
    },
    
    // 加载热门分类
    async loadPopularCategories() {
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1],
          limit: 10
        }
        const response = await statisticsApi.getPopularCategories(params)
        this.popularCategories = response.data
      } catch (error) {
        console.error('加载热门分类失败:', error)
        throw error
      }
    },
    
    // 加载热门标签
    async loadPopularTags() {
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1],
          limit: 30
        }
        const response = await statisticsApi.getPopularTags(params)
        this.popularTags = response.data
      } catch (error) {
        console.error('加载热门标签失败:', error)
        throw error
      }
    },
    
    // 加载用户互动数据
    async loadInteractionData() {
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1]
        }
        
        // 加载访问来源数据
        const sourceResponse = await statisticsApi.getVisitSourceStatistics(params)
        this.interactionData.source = sourceResponse.data
        
        // 加载设备数据
        const deviceResponse = await statisticsApi.getDeviceStatistics(params)
        this.interactionData.device = deviceResponse.data
        
        // 加载时间段数据
        const timeResponse = await statisticsApi.getTimeRangeStatistics(params)
        this.interactionData.time = timeResponse.data
      } catch (error) {
        console.error('加载用户互动数据失败:', error)
        throw error
      }
    },
    
    // 导出统计数据
    async exportStatistics(format) {
      this.loading = true
      try {
        const params = {
          start_date: this.dateRange[0],
          end_date: this.dateRange[1],
          format: format
        }
        
        await statisticsApi.exportStatistics(params)
        ElMessage.success(`数据已导出为${format.toUpperCase()}格式`)
        return true
      } catch (error) {
        console.error('导出数据失败:', error)
        ElMessage.error('导出数据失败')
        return false
      } finally {
        this.loading = false
      }
    }
  }
})

export default useStatisticsStore 
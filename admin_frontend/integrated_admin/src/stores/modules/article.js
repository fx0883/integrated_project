import { defineStore } from 'pinia'
import { articleApi } from '@/api/article'
import { ElMessage } from 'element-plus'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articles: [],
    currentArticle: null,
    total: 0,
    loading: false,
    filters: {
      keyword: '',
      category_id: null,
      tag_id: null,
      status: null,
      date_range: []
    },
    pagination: {
      page: 1,
      page_size: 10
    }
  }),
  
  getters: {
    getArticleById: (state) => (id) => {
      return state.articles.find(article => article.id === id) || null
    },
    
    getArticlesByCategory: (state) => (categoryId) => {
      return state.articles.filter(article => article.category_id === categoryId)
    },
    
    getArticlesByTag: (state) => (tagId) => {
      return state.articles.filter(article => 
        article.tags && article.tags.some(tag => tag.id === tagId)
      )
    },
    
    getPublishedArticles: (state) => {
      return state.articles.filter(article => article.status === 'published')
    },
    
    getDraftArticles: (state) => {
      return state.articles.filter(article => article.status === 'draft')
    }
  },
  
  actions: {
    // 获取文章列表
    async fetchArticles() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.page_size
        }
        
        // 添加筛选条件
        if (this.filters.keyword) {
          params.keyword = this.filters.keyword
        }
        
        if (this.filters.category_id) {
          params.category_id = this.filters.category_id
        }
        
        if (this.filters.tag_id) {
          params.tag_id = this.filters.tag_id
        }
        
        if (this.filters.status) {
          params.status = this.filters.status
        }
        
        if (this.filters.date_range && this.filters.date_range.length === 2) {
          params.start_date = this.filters.date_range[0]
          params.end_date = this.filters.date_range[1]
        }
        
        const response = await articleApi.getArticles(params)
        this.articles = response.data.results || response.data
        this.total = response.data.count || this.articles.length
      } catch (error) {
        console.error('获取文章列表失败:', error)
        ElMessage.error('获取文章列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 获取文章详情
    async fetchArticleById(id) {
      this.loading = true
      try {
        const response = await articleApi.getArticleById(id)
        this.currentArticle = response.data
        return response.data
      } catch (error) {
        console.error('获取文章详情失败:', error)
        ElMessage.error('获取文章详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 创建文章
    async createArticle(articleData) {
      this.loading = true
      try {
        const response = await articleApi.createArticle(articleData)
        // 添加到本地缓存
        this.articles.unshift(response.data)
        this.total += 1
        ElMessage.success('文章创建成功')
        return response.data
      } catch (error) {
        console.error('创建文章失败:', error)
        ElMessage.error('创建文章失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 更新文章
    async updateArticle(id, articleData) {
      this.loading = true
      try {
        const response = await articleApi.updateArticle(id, articleData)
        
        // 更新本地缓存
        const index = this.articles.findIndex(article => article.id === id)
        if (index !== -1) {
          this.articles[index] = response.data
        }
        
        // 如果是当前文章，更新当前文章
        if (this.currentArticle && this.currentArticle.id === id) {
          this.currentArticle = response.data
        }
        
        ElMessage.success('文章更新成功')
        return response.data
      } catch (error) {
        console.error('更新文章失败:', error)
        ElMessage.error('更新文章失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 删除文章
    async deleteArticle(id) {
      this.loading = true
      try {
        await articleApi.deleteArticle(id)
        
        // 从本地缓存中删除
        const index = this.articles.findIndex(article => article.id === id)
        if (index !== -1) {
          this.articles.splice(index, 1)
          this.total -= 1
        }
        
        ElMessage.success('文章删除成功')
        return true
      } catch (error) {
        console.error('删除文章失败:', error)
        ElMessage.error('删除文章失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 批量删除文章
    async batchDeleteArticles(ids) {
      this.loading = true
      try {
        await articleApi.batchDeleteArticles(ids)
        
        // 从本地缓存中删除
        this.articles = this.articles.filter(article => !ids.includes(article.id))
        this.total -= ids.length
        
        ElMessage.success(`成功删除 ${ids.length} 篇文章`)
        return true
      } catch (error) {
        console.error('批量删除文章失败:', error)
        ElMessage.error('批量删除文章失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 更新文章状态
    async updateArticleStatus(id, status) {
      this.loading = true
      try {
        const response = await articleApi.updateArticleStatus(id, { status })
        
        // 更新本地缓存
        const index = this.articles.findIndex(article => article.id === id)
        if (index !== -1) {
          this.articles[index].status = status
        }
        
        // 如果是当前文章，更新当前文章
        if (this.currentArticle && this.currentArticle.id === id) {
          this.currentArticle.status = status
        }
        
        ElMessage.success('文章状态更新成功')
        return response.data
      } catch (error) {
        console.error('更新文章状态失败:', error)
        ElMessage.error('更新文章状态失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 设置筛选条件
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // 重置到第一页
    },
    
    // 清空筛选条件
    clearFilters() {
      this.filters = {
        keyword: '',
        category_id: null,
        tag_id: null,
        status: null,
        date_range: []
      }
      this.pagination.page = 1 // 重置到第一页
    },
    
    // 设置分页信息
    setPagination(pagination) {
      this.pagination = { ...this.pagination, ...pagination }
    }
  }
})

export default useArticleStore 
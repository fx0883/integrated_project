import { defineStore } from 'pinia'
import { commentApi } from '@/api/comment'
import { ElMessage } from 'element-plus'

export const useCommentStore = defineStore('comment', {
  state: () => ({
    comments: [],
    currentComment: null,
    loading: false,
    total: 0,
    filters: {
      keyword: '',
      article: '',
      status: null,
      dateRange: []
    },
    pagination: {
      page: 1,
      page_size: 20
    }
  }),
  
  getters: {
    getCommentById: (state) => (id) => {
      return state.comments.find(comment => comment.id === id) || null
    },
    
    getCommentsByArticleId: (state) => (articleId) => {
      return state.comments.filter(comment => 
        comment.article && comment.article.id === articleId
      )
    },
    
    getPendingComments: (state) => {
      return state.comments.filter(comment => comment.status === 'pending')
    },
    
    getApprovedComments: (state) => {
      return state.comments.filter(comment => comment.status === 'approved')
    },
    
    getRejectedComments: (state) => {
      return state.comments.filter(comment => comment.status === 'rejected')
    },
    
    getSpamComments: (state) => {
      return state.comments.filter(comment => comment.status === 'spam')
    },
    
    getPendingCommentsCount: (state) => {
      return state.comments.filter(comment => comment.status === 'pending').length
    }
  },
  
  actions: {
    // 获取评论列表
    async fetchComments() {
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
        
        if (this.filters.article) {
          params.article_title = this.filters.article
        }
        
        if (this.filters.status) {
          params.status = this.filters.status
        }
        
        if (this.filters.dateRange && this.filters.dateRange.length === 2) {
          params.start_date = this.filters.dateRange[0]
          params.end_date = this.filters.dateRange[1]
        }
        
        const response = await commentApi.getComments(params)
        this.comments = response.data.results || response.data
        this.total = response.data.count || this.comments.length
      } catch (error) {
        console.error('获取评论列表失败:', error)
        ElMessage.error('获取评论列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 获取评论详情
    async fetchCommentById(id) {
      this.loading = true
      try {
        const response = await commentApi.getCommentById(id)
        this.currentComment = response.data
        return response.data
      } catch (error) {
        console.error('获取评论详情失败:', error)
        ElMessage.error('获取评论详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 批准评论
    async approveComment(id) {
      this.loading = true
      try {
        const response = await commentApi.approveComment(id)
        
        // 更新本地缓存
        const index = this.comments.findIndex(comment => comment.id === id)
        if (index !== -1) {
          this.comments[index].status = 'approved'
        }
        
        // 如果是当前评论，更新当前评论
        if (this.currentComment && this.currentComment.id === id) {
          this.currentComment.status = 'approved'
        }
        
        ElMessage.success('评论已批准')
        return response.data
      } catch (error) {
        console.error('批准评论失败:', error)
        ElMessage.error('批准评论失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 拒绝评论
    async rejectComment(id) {
      this.loading = true
      try {
        const response = await commentApi.rejectComment(id)
        
        // 更新本地缓存
        const index = this.comments.findIndex(comment => comment.id === id)
        if (index !== -1) {
          this.comments[index].status = 'rejected'
        }
        
        // 如果是当前评论，更新当前评论
        if (this.currentComment && this.currentComment.id === id) {
          this.currentComment.status = 'rejected'
        }
        
        ElMessage.success('评论已拒绝')
        return response.data
      } catch (error) {
        console.error('拒绝评论失败:', error)
        ElMessage.error('拒绝评论失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 标记垃圾评论
    async markAsSpam(id) {
      this.loading = true
      try {
        const response = await commentApi.markAsSpam(id)
        
        // 更新本地缓存
        const index = this.comments.findIndex(comment => comment.id === id)
        if (index !== -1) {
          this.comments[index].status = 'spam'
        }
        
        // 如果是当前评论，更新当前评论
        if (this.currentComment && this.currentComment.id === id) {
          this.currentComment.status = 'spam'
        }
        
        ElMessage.success('已标记为垃圾评论')
        return response.data
      } catch (error) {
        console.error('标记垃圾评论失败:', error)
        ElMessage.error('标记垃圾评论失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 回复评论
    async replyToComment(id, replyData) {
      this.loading = true
      try {
        const response = await commentApi.replyToComment(id, replyData)
        
        // 添加到本地缓存
        this.comments.unshift(response.data)
        this.total += 1
        
        ElMessage.success('回复成功')
        return response.data
      } catch (error) {
        console.error('回复评论失败:', error)
        ElMessage.error('回复评论失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 删除评论
    async deleteComment(id) {
      this.loading = true
      try {
        await commentApi.deleteComment(id)
        
        // 从本地缓存中删除
        const index = this.comments.findIndex(comment => comment.id === id)
        if (index !== -1) {
          this.comments.splice(index, 1)
          this.total -= 1
        }
        
        ElMessage.success('评论已删除')
        return true
      } catch (error) {
        console.error('删除评论失败:', error)
        ElMessage.error('删除评论失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 批量操作评论
    async batchOperateComments(action, ids) {
      this.loading = true
      try {
        await commentApi.batchOperateComments(action, ids)
        
        // 更新本地缓存
        if (action === 'delete') {
          // 从本地缓存中删除
          this.comments = this.comments.filter(comment => !ids.includes(comment.id))
          this.total -= ids.length
          ElMessage.success(`已删除 ${ids.length} 条评论`)
        } else {
          // 更新状态
          ids.forEach(id => {
            const index = this.comments.findIndex(comment => comment.id === id)
            if (index !== -1) {
              this.comments[index].status = action === 'approve' ? 'approved' : 
                                           action === 'reject' ? 'rejected' : 
                                           action === 'spam' ? 'spam' : this.comments[index].status
            }
          })
          
          const actionText = action === 'approve' ? '批准' : 
                           action === 'reject' ? '拒绝' : 
                           action === 'spam' ? '标记为垃圾评论' : '处理'
          
          ElMessage.success(`已${actionText} ${ids.length} 条评论`)
        }
        
        return true
      } catch (error) {
        console.error('批量操作评论失败:', error)
        ElMessage.error('批量操作评论失败')
        return false
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
        article: '',
        status: null,
        dateRange: []
      }
      this.pagination.page = 1 // 重置到第一页
    },
    
    // 设置分页信息
    setPagination(pagination) {
      this.pagination = { ...this.pagination, ...pagination }
    }
  }
})

export default useCommentStore 
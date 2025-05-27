import { defineStore } from 'pinia'
import { tagApi } from '@/api/tag'
import { ElMessage } from 'element-plus'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [],
    tagGroups: [],
    currentTag: null,
    currentTagGroup: null,
    loading: false,
    filters: {
      keyword: '',
      group_id: null,
      status: null
    },
    pagination: {
      page: 1,
      page_size: 20
    },
    total: 0
  }),
  
  getters: {
    getTagById: (state) => (id) => {
      return state.tags.find(tag => tag.id === id) || null
    },
    
    getTagsByGroupId: (state) => (groupId) => {
      if (!groupId) return state.tags
      return state.tags.filter(tag => tag.group_id === groupId)
    },
    
    getTagGroupById: (state) => (id) => {
      return state.tagGroups.find(group => group.id === id) || null
    },
    
    getActiveTagsCount: (state) => {
      return state.tags.filter(tag => tag.status === 'active').length
    },
    
    getPopularTags: (state) => (limit = 10) => {
      return [...state.tags]
        .sort((a, b) => (b.articles_count || 0) - (a.articles_count || 0))
        .slice(0, limit)
    }
  },
  
  actions: {
    // 获取标签列表
    async fetchTags() {
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
        
        if (this.filters.group_id) {
          params.group_id = this.filters.group_id
        }
        
        if (this.filters.status) {
          params.status = this.filters.status
        }
        
        const response = await tagApi.getTags(params)
        this.tags = response.data.results || response.data
        this.total = response.data.count || this.tags.length
      } catch (error) {
        console.error('获取标签列表失败:', error)
        ElMessage.error('获取标签列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 获取所有标签（不分页）
    async fetchAllTags() {
      this.loading = true
      try {
        const response = await tagApi.getAllTags()
        return response.data
      } catch (error) {
        console.error('获取所有标签失败:', error)
        ElMessage.error('获取所有标签失败')
        return []
      } finally {
        this.loading = false
      }
    },
    
    // 获取标签组列表
    async fetchTagGroups() {
      this.loading = true
      try {
        const response = await tagApi.getTagGroups()
        this.tagGroups = response.data
      } catch (error) {
        console.error('获取标签组失败:', error)
        ElMessage.error('获取标签组失败')
      } finally {
        this.loading = false
      }
    },
    
    // 获取标签详情
    async fetchTagById(id) {
      this.loading = true
      try {
        const response = await tagApi.getTagById(id)
        this.currentTag = response.data
        return response.data
      } catch (error) {
        console.error('获取标签详情失败:', error)
        ElMessage.error('获取标签详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 获取标签组详情
    async fetchTagGroupById(id) {
      this.loading = true
      try {
        const response = await tagApi.getTagGroupById(id)
        this.currentTagGroup = response.data
        return response.data
      } catch (error) {
        console.error('获取标签组详情失败:', error)
        ElMessage.error('获取标签组详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 创建标签
    async createTag(tagData) {
      this.loading = true
      try {
        const response = await tagApi.createTag(tagData)
        // 添加到本地缓存
        this.tags.unshift(response.data)
        this.total += 1
        ElMessage.success('标签创建成功')
        return response.data
      } catch (error) {
        console.error('创建标签失败:', error)
        ElMessage.error('创建标签失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 创建标签组
    async createTagGroup(groupData) {
      this.loading = true
      try {
        const response = await tagApi.createTagGroup(groupData)
        this.tagGroups.push(response.data)
        ElMessage.success('标签组创建成功')
        return response.data
      } catch (error) {
        console.error('创建标签组失败:', error)
        ElMessage.error('创建标签组失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 更新标签
    async updateTag(id, tagData) {
      this.loading = true
      try {
        const response = await tagApi.updateTag(id, tagData)
        
        // 更新本地缓存
        const index = this.tags.findIndex(tag => tag.id === id)
        if (index !== -1) {
          this.tags[index] = { ...this.tags[index], ...response.data }
        }
        
        // 如果是当前标签，更新当前标签
        if (this.currentTag && this.currentTag.id === id) {
          this.currentTag = { ...this.currentTag, ...response.data }
        }
        
        ElMessage.success('标签更新成功')
        return response.data
      } catch (error) {
        console.error('更新标签失败:', error)
        ElMessage.error('更新标签失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 更新标签组
    async updateTagGroup(id, groupData) {
      this.loading = true
      try {
        const response = await tagApi.updateTagGroup(id, groupData)
        
        // 更新本地缓存
        const index = this.tagGroups.findIndex(group => group.id === id)
        if (index !== -1) {
          this.tagGroups[index] = { ...this.tagGroups[index], ...response.data }
        }
        
        // 如果是当前标签组，更新当前标签组
        if (this.currentTagGroup && this.currentTagGroup.id === id) {
          this.currentTagGroup = { ...this.currentTagGroup, ...response.data }
        }
        
        ElMessage.success('标签组更新成功')
        return response.data
      } catch (error) {
        console.error('更新标签组失败:', error)
        ElMessage.error('更新标签组失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 删除标签
    async deleteTag(id) {
      this.loading = true
      try {
        await tagApi.deleteTag(id)
        
        // 从本地缓存中删除
        const index = this.tags.findIndex(tag => tag.id === id)
        if (index !== -1) {
          this.tags.splice(index, 1)
          this.total -= 1
        }
        
        ElMessage.success('标签删除成功')
        return true
      } catch (error) {
        console.error('删除标签失败:', error)
        ElMessage.error('删除标签失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 删除标签组
    async deleteTagGroup(id) {
      this.loading = true
      try {
        await tagApi.deleteTagGroup(id)
        
        // 从本地缓存中删除
        this.tagGroups = this.tagGroups.filter(group => group.id !== id)
        
        ElMessage.success('标签组删除成功')
        return true
      } catch (error) {
        console.error('删除标签组失败:', error)
        ElMessage.error('删除标签组失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 批量删除标签
    async batchDeleteTags(ids) {
      this.loading = true
      try {
        await tagApi.batchOperateTags('delete', ids)
        
        // 从本地缓存中删除
        this.tags = this.tags.filter(tag => !ids.includes(tag.id))
        this.total -= ids.length
        
        ElMessage.success(`成功删除 ${ids.length} 个标签`)
        return true
      } catch (error) {
        console.error('批量删除标签失败:', error)
        ElMessage.error('批量删除标签失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 批量移动标签到指定标签组
    async batchMoveTagsToGroup(ids, groupId) {
      this.loading = true
      try {
        await tagApi.batchOperateTags('move', ids, { group_id: groupId })
        
        // 更新本地缓存
        ids.forEach(id => {
          const index = this.tags.findIndex(tag => tag.id === id)
          if (index !== -1) {
            this.tags[index].group_id = groupId
          }
        })
        
        ElMessage.success(`成功移动 ${ids.length} 个标签到指定标签组`)
        return true
      } catch (error) {
        console.error('批量移动标签失败:', error)
        ElMessage.error('批量移动标签失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 更新标签状态
    async updateTagStatus(id, status) {
      this.loading = true
      try {
        const response = await tagApi.updateTagStatus(id, { status })
        
        // 更新本地缓存
        const index = this.tags.findIndex(tag => tag.id === id)
        if (index !== -1) {
          this.tags[index].status = status
        }
        
        // 如果是当前标签，更新当前标签
        if (this.currentTag && this.currentTag.id === id) {
          this.currentTag.status = status
        }
        
        ElMessage.success('标签状态更新成功')
        return response.data
      } catch (error) {
        console.error('更新标签状态失败:', error)
        ElMessage.error('更新标签状态失败')
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
        group_id: null,
        status: null
      }
      this.pagination.page = 1 // 重置到第一页
    },
    
    // 设置分页信息
    setPagination(pagination) {
      this.pagination = { ...this.pagination, ...pagination }
    }
  }
})

export default useTagStore 
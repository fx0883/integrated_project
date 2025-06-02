import { defineStore } from 'pinia'
import { categoryApi } from '@/api/category'
import { ElMessage } from 'element-plus'

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    categoryTree: [],
    currentCategory: null,
    loading: false
  }),
  
  getters: {
    getCategoryById: (state) => (id) => {
      return state.categories.find(category => category.id === id) || null
    },
    
    getRootCategories: (state) => {
      return state.categories.filter(category => !category.parent_id)
    },
    
    getChildCategories: (state) => (parentId) => {
      return state.categories.filter(category => category.parent_id === parentId)
    },
    
    getActiveCategoriesCount: (state) => {
      return state.categories.filter(category => category.status === 'active').length
    },
    
    getCategoryPath: (state) => (categoryId) => {
      const path = []
      let currentId = categoryId
      
      while (currentId) {
        const category = state.getCategoryById(currentId)
        if (!category) break
        
        path.unshift(category)
        currentId = category.parent_id
      }
      
      return path
    }
  },
  
  actions: {
    // 获取所有分类
    async fetchCategories() {
      this.loading = true
      try {
        const response = await categoryApi.getCategories()
        this.categories = response.data
        this.buildCategoryTree()
      } catch (error) {
        console.error('获取分类失败:', error)
        ElMessage.error('获取分类失败')
      } finally {
        this.loading = false
      }
    },
    
    // 构建分类树结构
    buildCategoryTree() {
      const buildTree = (parentId = null) => {
        const children = this.categories.filter(item => item.parent_id === parentId)
        return children.map(child => ({
          ...child,
          children: buildTree(child.id)
        }))
      }
      
      this.categoryTree = buildTree()
    },
    
    // 获取分类详情
    async fetchCategoryById(id) {
      this.loading = true
      try {
        const response = await categoryApi.getCategoryById(id)
        this.currentCategory = response.data
        return response.data
      } catch (error) {
        console.error('获取分类详情失败:', error)
        ElMessage.error('获取分类详情失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 创建分类
    async createCategory(categoryData) {
      this.loading = true
      try {
        const response = await categoryApi.createCategory(categoryData)
        this.categories.push(response.data)
        this.buildCategoryTree()
        ElMessage.success('分类创建成功')
        return response.data
      } catch (error) {
        console.error('创建分类失败:', error)
        ElMessage.error('创建分类失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 更新分类
    async updateCategory(id, categoryData) {
      this.loading = true
      try {
        const response = await categoryApi.updateCategory(id, categoryData)
        
        // 更新本地缓存
        const index = this.categories.findIndex(category => category.id === id)
        if (index !== -1) {
          this.categories[index] = { ...this.categories[index], ...response.data }
        }
        
        // 如果是当前分类，更新当前分类
        if (this.currentCategory && this.currentCategory.id === id) {
          this.currentCategory = { ...this.currentCategory, ...response.data }
        }
        
        this.buildCategoryTree()
        ElMessage.success('分类更新成功')
        return response.data
      } catch (error) {
        console.error('更新分类失败:', error)
        ElMessage.error('更新分类失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 删除分类
    async deleteCategory(id) {
      this.loading = true
      try {
        await categoryApi.deleteCategory(id)
        
        // 从本地缓存中删除
        this.categories = this.categories.filter(category => category.id !== id)
        this.buildCategoryTree()
        
        ElMessage.success('分类删除成功')
        return true
      } catch (error) {
        console.error('删除分类失败:', error)
        ElMessage.error('删除分类失败')
        return false
      } finally {
        this.loading = false
      }
    },
    
    // 更新分类状态
    async updateCategoryStatus(id, status) {
      this.loading = true
      try {
        const response = await categoryApi.updateCategoryStatus(id, { status })
        
        // 更新本地缓存
        const index = this.categories.findIndex(category => category.id === id)
        if (index !== -1) {
          this.categories[index].status = status
        }
        
        // 如果是当前分类，更新当前分类
        if (this.currentCategory && this.currentCategory.id === id) {
          this.currentCategory.status = status
        }
        
        ElMessage.success('分类状态更新成功')
        return response.data
      } catch (error) {
        console.error('更新分类状态失败:', error)
        ElMessage.error('更新分类状态失败')
        return null
      } finally {
        this.loading = false
      }
    },
    
    // 更新分类排序
    async updateCategoryOrder(id, direction) {
      this.loading = true
      try {
        const response = await categoryApi.updateCategoryOrder(id, { direction })
        
        // 重新获取分类列表以获取最新排序
        await this.fetchCategories()
        
        ElMessage.success('分类排序更新成功')
        return response.data
      } catch (error) {
        console.error('更新分类排序失败:', error)
        ElMessage.error('更新分类排序失败')
        return null
      } finally {
        this.loading = false
      }
    }
  }
})

export default useCategoryStore 
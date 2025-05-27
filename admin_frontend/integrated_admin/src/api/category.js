import { request } from '../utils/request'

// 分类相关API
export const categoryApi = {
  // 获取分类列表
  getCategories(params) {
    return request.get('/cms/categories/', params)
  },
  
  // 获取分类树结构
  getCategoryTree(params) {
    return request.get('/cms/categories/tree/', params)
  },
  
  // 获取分类详情
  getCategoryById(id) {
    return request.get(`/cms/categories/${id}/`)
  },
  
  // 创建分类
  createCategory(data) {
    return request.post('/cms/categories/', data)
  },
  
  // 更新分类
  updateCategory(id, data) {
    return request.put(`/cms/categories/${id}/`, data)
  },
  
  // 部分更新分类
  patchCategory(id, data) {
    return request.patch(`/cms/categories/${id}/`, data)
  },
  
  // 删除分类
  deleteCategory(id) {
    return request.delete(`/cms/categories/${id}/`)
  },
  
  // 上传分类封面图
  uploadCategoryImage(id, file) {
    const formData = new FormData()
    formData.append('cover_image', file)
    
    return request.post(`/cms/categories/${id}/cover-image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 更新分类排序
  updateCategoryOrder(data) {
    return request.post('/cms/categories/order/', data)
  },
  
  // 获取分类下的文章
  getCategoryArticles(id, params) {
    return request.get(`/cms/categories/${id}/articles/`, params)
  }
}

export default categoryApi 
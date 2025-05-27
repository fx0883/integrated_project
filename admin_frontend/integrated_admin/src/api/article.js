import { request } from '../utils/request'

// 文章相关API
export const articleApi = {
  // 获取文章列表
  getArticles(params) {
    return request.get('/cms/articles/', params)
  },
  
  // 获取文章详情
  getArticleById(id) {
    return request.get(`/cms/articles/${id}/`)
  },
  
  // 创建文章
  createArticle(data) {
    return request.post('/cms/articles/', data)
  },
  
  // 更新文章
  updateArticle(id, data) {
    return request.put(`/cms/articles/${id}/`, data)
  },
  
  // 部分更新文章
  patchArticle(id, data) {
    return request.patch(`/cms/articles/${id}/`, data)
  },
  
  // 删除文章
  deleteArticle(id) {
    return request.delete(`/cms/articles/${id}/`)
  },
  
  // 修改文章状态
  updateArticleStatus(id, status) {
    return request.patch(`/cms/articles/${id}/status/`, { status })
  },
  
  // 获取文章版本历史
  getArticleVersions(id) {
    return request.get(`/cms/articles/${id}/versions/`)
  },
  
  // 获取特定版本的文章
  getArticleVersion(id, versionId) {
    return request.get(`/cms/articles/${id}/versions/${versionId}/`)
  },
  
  // 恢复到特定版本
  restoreArticleVersion(id, versionId) {
    return request.post(`/cms/articles/${id}/versions/${versionId}/restore/`)
  },
  
  // 上传文章封面图
  uploadCoverImage(id, file) {
    const formData = new FormData()
    formData.append('cover_image', file)
    
    return request.post(`/cms/articles/${id}/cover-image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取文章统计数据
  getArticleStatistics(id) {
    return request.get(`/cms/articles/${id}/statistics/`)
  },
  
  // 获取文章元数据
  getArticleMeta(id) {
    return request.get(`/cms/articles/${id}/meta/`)
  },
  
  // 更新文章元数据
  updateArticleMeta(id, data) {
    return request.put(`/cms/articles/${id}/meta/`, data)
  }
}

export default articleApi 
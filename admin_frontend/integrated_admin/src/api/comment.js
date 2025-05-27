import { request } from '../utils/request'

// 评论相关API
export const commentApi = {
  // 获取评论列表
  getComments(params) {
    return request.get('/cms/comments/', params)
  },
  
  // 获取评论详情
  getCommentById(id) {
    return request.get(`/cms/comments/${id}/`)
  },
  
  // 创建评论
  createComment(data) {
    return request.post('/cms/comments/', data)
  },
  
  // 更新评论
  updateComment(id, data) {
    return request.put(`/cms/comments/${id}/`, data)
  },
  
  // 部分更新评论
  patchComment(id, data) {
    return request.patch(`/cms/comments/${id}/`, data)
  },
  
  // 删除评论
  deleteComment(id) {
    return request.delete(`/cms/comments/${id}/`)
  },
  
  // 批准评论
  approveComment(id) {
    return request.post(`/cms/comments/${id}/approve/`)
  },
  
  // 驳回评论
  rejectComment(id) {
    return request.post(`/cms/comments/${id}/reject/`)
  },
  
  // 标记为垃圾评论
  markAsSpam(id) {
    return request.post(`/cms/comments/${id}/spam/`)
  },
  
  // 取消垃圾评论标记
  unmarkAsSpam(id) {
    return request.post(`/cms/comments/${id}/unspam/`)
  },
  
  // 获取文章评论
  getArticleComments(articleId, params) {
    return request.get(`/cms/articles/${articleId}/comments/`, params)
  },
  
  // 回复评论
  replyToComment(id, data) {
    return request.post(`/cms/comments/${id}/reply/`, data)
  },
  
  // 批量操作评论
  batchOperateComments(action, ids) {
    return request.post('/cms/comments/batch/', { action, ids })
  }
}

export default commentApi 
import { request } from '../utils/request'

// 标签相关API
export const tagApi = {
  // 获取标签列表
  getTags(params) {
    return request.get('/cms/tags/', params)
  },
  
  // 获取标签详情
  getTagById(id) {
    return request.get(`/cms/tags/${id}/`)
  },
  
  // 创建标签
  createTag(data) {
    return request.post('/cms/tags/', data)
  },
  
  // 更新标签
  updateTag(id, data) {
    return request.put(`/cms/tags/${id}/`, data)
  },
  
  // 部分更新标签
  patchTag(id, data) {
    return request.patch(`/cms/tags/${id}/`, data)
  },
  
  // 删除标签
  deleteTag(id) {
    return request.delete(`/cms/tags/${id}/`)
  },
  
  // 获取标签组列表
  getTagGroups(params) {
    return request.get('/cms/tag-groups/', params)
  },
  
  // 获取标签组详情
  getTagGroupById(id) {
    return request.get(`/cms/tag-groups/${id}/`)
  },
  
  // 创建标签组
  createTagGroup(data) {
    return request.post('/cms/tag-groups/', data)
  },
  
  // 更新标签组
  updateTagGroup(id, data) {
    return request.put(`/cms/tag-groups/${id}/`, data)
  },
  
  // 部分更新标签组
  patchTagGroup(id, data) {
    return request.patch(`/cms/tag-groups/${id}/`, data)
  },
  
  // 删除标签组
  deleteTagGroup(id) {
    return request.delete(`/cms/tag-groups/${id}/`)
  },
  
  // 获取标签下的文章
  getTagArticles(id, params) {
    return request.get(`/cms/tags/${id}/articles/`, params)
  }
}

export default tagApi 
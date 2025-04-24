import { request } from '../utils/request'

// 用户相关API
export const userApi = {
  // 获取当前用户信息
  getCurrentUser() {
    return request.get('/users/me/')
  },
  
  // 获取用户列表
  getUsers(params) {
    return request.get('/users/', params)
  },
  
  // 获取用户详情
  getUserById(id) {
    return request.get(`/users/${id}/`)
  },
  
  // 创建用户
  createUser(data) {
    return request.post('/users/', data)
  },
  
  // 更新用户
  updateUser(id, data) {
    return request.put(`/users/${id}/`, data)
  },
  
  // 删除用户
  deleteUser(id) {
    return request.delete(`/users/${id}/`)
  },
  
  // 修改密码
  changePassword(id, data) {
    return request.post(`/users/${id}/change-password/`, data)
  },
  
  // 修改当前用户密码
  changeCurrentUserPassword(data) {
    return request.post('/users/me/change-password/', data)
  },
  
  // 上传头像
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    return request.post('/users/me/upload-avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default userApi 
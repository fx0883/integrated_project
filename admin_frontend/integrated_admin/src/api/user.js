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
  
  // 重置用户密码
  resetPassword(id) {
    return request.post(`/users/${id}/reset-password/`)
  },
  
  // 激活用户
  activateUser(id) {
    return request.post(`/users/${id}/activate/`)
  },
  
  // 禁用用户
  disableUser(id) {
    return request.post(`/users/${id}/disable/`)
  },
  
  // 更新用户角色
  updateUserRole(id, data) {
    return request.post(`/users/${id}/role/`, data)
  },
  
  // 授予超级管理员权限
  grantSuperAdmin(id) {
    return request.post(`/users/${id}/grant-super-admin/`)
  },
  
  // 撤销超级管理员权限
  revokeSuperAdmin(id) {
    return request.post(`/users/${id}/revoke-super-admin/`)
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
  },
  
  // 上传指定用户的头像
  uploadUserAvatar(id, file) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    return request.post(`/users/${id}/upload-avatar/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default userApi
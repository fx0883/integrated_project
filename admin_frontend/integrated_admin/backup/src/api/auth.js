import { request } from '../utils/request'
import axios from 'axios'

// 认证相关API
export const authApi = {
  // 用户登录
  login(data) {
    return request.post('/auth/login/', data)
  },
  
  // 用户注册
  register(data) {
    return request.post('/auth/register/', data)
  },
  
  // 刷新Token
  refreshToken(data) {
    // 使用原始axios而不是带有拦截器的request实例
    // 避免添加Authorization头
    console.log('调用刷新Token API:', data)
    
    return axios.create({
      baseURL: 'http://localhost:8000/api/v1'
    }).post('/auth/token/refresh/', data)
    .then(response => {
      console.log('刷新Token原始响应:', response.data)
      
      // 适配不同的响应格式
      if (response.data && response.data.data) {
        return response.data.data
      } else if (response.data && response.data.token) {
        return response.data
      } else if (response.data && response.data.access) {
        return response.data
      }
      return response.data
    })
    .catch(error => {
      console.error('刷新Token API错误:', error.response?.data || error.message)
      throw error
    })
  },
  
  // 验证Token
  verifyToken(data) {
    return request.post('/auth/token/verify/', data)
  },
  
  // 修改密码
  changePassword(id, data) {
    return request.post(`/auth/${id}/change-password/`, data)
  },
  
  // 修改当前用户密码
  changeCurrentUserPassword(data) {
    return request.post('/auth/me/change-password/', data)
  }
}

export default authApi 
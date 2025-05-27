import { defineStore } from 'pinia'
import { authApi, userApi } from '../../api'
import router from '../../router'
import { ElMessage } from 'element-plus'
import { request } from '../../utils/request'

// 认证状态模块
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    refreshToken: null,
    permissions: [],
    loginRedirect: '/'
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.is_admin || state.user?.is_super_admin || false,
    isSuperAdmin: (state) => state.user?.is_super_admin || false,
    userProfile: (state) => state.user || {}
  },
  
  actions: {
    // 设置用户信息
    setUser(user) {
      this.user = user
      // 保存到本地存储，便于刷新后恢复
      localStorage.setItem('user_info', JSON.stringify(user))
    },
    
    // 设置Token
    setToken(token, refreshToken) {
      this.token = token
      this.refreshToken = refreshToken
      
      // 保存到本地存储
      localStorage.setItem('access_token', token)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }
    },
    
    // 设置权限
    setPermissions(permissions) {
      this.permissions = permissions
    },
    
    // 设置登录后重定向地址
    setLoginRedirect(url) {
      this.loginRedirect = url
    },
    
    // 从本地存储恢复状态
    restore() {
      const token = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      const userJson = localStorage.getItem('user_info')
      
      if (token) {
        this.token = token
      }
      
      if (refreshToken) {
        this.refreshToken = refreshToken
      }
      
      if (userJson) {
        try {
          this.user = JSON.parse(userJson)
        } catch (e) {
          console.error('解析用户信息失败:', e)
        }
      }
    },
    
    // 登录
    async login(credentials) {
      try {
        const response = await authApi.login(credentials)
        
        // 使用request.getResponseData从data字段获取数据
        const responseData = request.getResponseData(response)
        
        let accessToken = ''
        let refreshToken = ''
        let userData = null
        
        // 处理API返回的格式 { token, refresh_token, user }
        if (responseData && responseData.token) {
          // 新的API格式
          accessToken = responseData.token
          refreshToken = responseData.refresh_token
          userData = responseData.user
        } else if (responseData && responseData.access) {
          // 兼容旧格式 - Django REST Auth格式
          accessToken = responseData.access
          refreshToken = responseData.refresh
          userData = responseData.user
        } else {
          console.error('未能从登录响应中解析出有效token')
          throw new Error('登录失败: 服务器返回未知格式')
        }
        
        // 设置认证状态
        if (accessToken && userData) {
          this.setToken(accessToken, refreshToken)
          this.setUser(userData)
          this.permissions = responseData?.permissions || []
          
          console.log('登录成功，用户:', userData.username)
          return userData
        } else {
          throw new Error('登录失败: 无效的认证信息')
        }
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },
    
    // 注册
    async register(userData) {
      try {
        const response = await authApi.register(userData)
        
        // 使用request.getResponseData从data字段获取数据
        const responseData = request.getResponseData(response)
        
        // 处理不同的注册响应格式
        if (responseData && responseData.user) {
          // 直接包含了用户信息和token
          if (responseData.access) {
            this.setToken(responseData.access, responseData.refresh)
            this.setUser(responseData.user)
            return true
          }
        }
        
        // 如果没有直接返回token，可能需要登录
        return {
          success: true,
          requireLogin: true,
          message: '注册成功，请登录'
        }
      } catch (error) {
        console.error('注册失败:', error)
        throw error
      }
    },
    
    // 登出
    logout() {
      // 清除状态
      this.user = null
      this.token = null
      this.refreshToken = null
      this.permissions = []
      
      // 清除本地存储
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
      
      // 重定向到登录页
      window.location.href = '/login'
    },
    
    // 刷新Token
    async refreshAccessToken() {
      if (!this.refreshToken) {
        console.error('没有可用的refreshToken')
        return false
      }
      
      try {
        const response = await authApi.refreshToken({
          refresh: this.refreshToken
        })
        
        // 使用request.getResponseData从data字段获取数据
        const responseData = request.getResponseData(response)
        
        let accessToken = ''
        
        // 处理不同的响应格式
        if (responseData && responseData.token) {
          // 新的API格式
          accessToken = responseData.token
        } else if (responseData && responseData.access) {
          // 兼容旧格式
          accessToken = responseData.access
        } else {
          throw new Error('刷新Token失败: 无效的响应格式')
        }
        
        if (accessToken) {
          // 只更新访问Token，不更新刷新Token
          this.token = accessToken
          localStorage.setItem('access_token', accessToken)
          return true
        } else {
          throw new Error('刷新Token失败: 未返回新token')
        }
      } catch (error) {
        console.error('刷新Token失败:', error)
        // 刷新失败，可能需要重新登录
        this.logout()
        return false
      }
    },
    
    // 获取当前用户信息
    async fetchCurrentUser() {
      if (!this.token) {
        console.error('获取用户信息失败: 未登录状态')
        return false
      }
      
      try {
        const response = await userApi.getCurrentUser()
        
        // 使用request.getResponseData从data字段获取数据
        const userData = request.getResponseData(response)
        
        if (userData) {
          this.setUser(userData)
          return true
        } else {
          throw new Error('获取用户信息失败: 无效的响应数据')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        
        // 如果是401错误，可能是token过期
        if (error.code === 4001 || error.message?.includes('401')) {
          // 尝试刷新Token
          const refreshed = await this.refreshAccessToken()
          if (refreshed) {
            // 重新调用获取用户信息
            return await this.fetchCurrentUser()
          }
        }
        
        return false
      }
    }
  }
})

export default useAuthStore
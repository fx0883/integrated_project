import { defineStore } from 'pinia'
import { authApi } from '../../api'
import router from '../../router'
import { ElMessage } from 'element-plus'

// 认证状态模块
export const useAuthStore = defineStore('auth', {
  state: () => {
    console.log('初始化Auth Store状态')
    const token = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const user = JSON.parse(localStorage.getItem('user_info') || 'null')
    console.log('从localStorage读取状态:', {
      token: token ? '存在' : '不存在',
      refreshToken: refreshToken ? '存在' : '不存在',
      user: user ? '存在' : '不存在'
    })
    return {
      token,
      refreshToken,
      user,
      permissions: []
    }
  },
  
  getters: {
    isAuthenticated: (state) => {
      const result = !!state.token
      console.log('判断认证状态:', result ? '已认证' : '未认证')
      return result
    },
    userRole: (state) => {
      if (!state.user) return ''
      const role = state.user.is_super_admin ? 'super_admin' : (state.user.is_admin ? 'admin' : 'member')
      console.log('获取用户角色:', role)
      return role
    },
    isSuperAdmin: (state) => {
      const result = state.user?.is_super_admin || false
      console.log('判断是否超级管理员:', result)
      return result
    },
    isAdmin: (state) => {
      const result = state.user?.is_admin || false
      console.log('判断是否管理员:', result)
      return result
    }
  },
  
  actions: {
    // 设置Token
    setToken(token, refreshToken) {
      console.log('正在设置Token:', token ? '有效' : '无效', refreshToken ? '有刷新令牌' : '无刷新令牌')
      
      this.token = token
      this.refreshToken = refreshToken
      
      if (token) {
        localStorage.setItem('access_token', token)
        console.log('Token已存储到localStorage')
      } else {
        localStorage.removeItem('access_token')
        console.warn('清除了localStorage中的Token')
      }
      
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
        console.log('刷新Token已存储到localStorage')
      } else {
        localStorage.removeItem('refresh_token')
        console.warn('清除了localStorage中的刷新Token')
      }
    },
    
    // 设置用户信息
    setUser(user) {
      console.log('正在设置用户信息:', user)
      
      this.user = user
      
      if (user) {
        localStorage.setItem('user_info', JSON.stringify(user))
        console.log('用户信息已存储到localStorage')
      } else {
        localStorage.removeItem('user_info')
        console.warn('清除了localStorage中的用户信息')
      }
    },
    
    // 登录
    async login(credentials) {
      try {
        console.log('尝试登录:', credentials.username)
        
        const response = await authApi.login(credentials)
        console.log('登录API响应:', response)
        
        // 保存Token和用户信息
        // 处理不同的返回格式
        let accessToken, refreshToken, userData;
        
        // 检查标准API响应格式: {success, code, message, data}
        if (response.success && response.data) {
          console.log('检测到标准API响应格式: {success, code, message, data}')
          
          // 从data中获取token、refresh_token和user
          if (response.data.token && response.data.refresh_token && response.data.user) {
            accessToken = response.data.token
            refreshToken = response.data.refresh_token
            userData = response.data.user
            console.log('成功解析标准API响应格式的token和用户信息')
          } else {
            console.error('API响应中缺少token、refresh_token或user字段', response.data)
            throw new Error('登录响应缺少必要字段')
          }
        } 
        // 兼容旧格式
        else if (response.token && typeof response.token === 'string') {
          // 服务端直接返回token字符串的情况
          accessToken = response.token
          refreshToken = response.refresh_token
          userData = response.user
          console.log('检测到服务端返回的token格式: token和refresh_token是独立字段')
        } else if (response.token && response.token.access) {
          // 服务端返回token对象的情况
          accessToken = response.token.access
          refreshToken = response.token.refresh
          userData = response.user
          console.log('检测到服务端返回的token格式: token是包含access和refresh字段的对象')
        } else {
          console.error('不支持的token返回格式:', response)
          throw new Error('服务器返回的数据格式不正确')
        }
        
        // 确认获取到了必要的信息
        if (!accessToken || !refreshToken) {
          console.error('缺少必要的token信息:', { accessToken, refreshToken })
          throw new Error('登录响应中缺少access_token或refresh_token')
        }
        
        if (!userData) {
          console.error('缺少用户信息:', userData)
          throw new Error('登录响应中缺少用户信息')
        }
        
        // 设置token和用户信息
        this.setToken(accessToken, refreshToken)
        this.setUser(userData)
        
        // 设置权限
        this.permissions = response.data?.permissions || response.permissions || []
        console.log('设置用户权限:', this.permissions)
        
        // 登录成功提示
        ElMessage({
          message: '登录成功',
          type: 'success',
          duration: 2000
        })
        
        return userData
      } catch (error) {
        console.error('登录失败:', error)
        
        // 抛出错误，让调用者处理
        throw error
      }
    },
    
    // 注册
    async register(userData) {
      try {
        console.log('尝试注册:', userData.username)
        
        const response = await authApi.register(userData)
        console.log('注册API响应:', response)
        
        // 注册成功后自动登录
        // 处理标准API响应格式: {success, code, message, data}
        if (response.success && response.data) {
          if (response.data.token && response.data.refresh_token && response.data.user) {
            this.setToken(response.data.token, response.data.refresh_token)
            this.setUser(response.data.user)
          }
        }
        // 兼容旧格式
        else if (response.token) {
          this.setToken(response.token, response.refresh_token)
          this.setUser(response.user)
        }
        
        return response
      } catch (error) {
        console.error('注册失败:', error)
        throw error
      }
    },
    
    // 退出登录
    logout() {
      console.log('执行退出登录操作')
      
      // 清除状态
      this.setToken(null, null)
      this.setUser(null)
      this.permissions = []
      
      console.log('状态已清除，正在跳转到登录页')
      
      // 跳转到登录页
      router.push('/login')
      
      ElMessage({
        message: '已安全退出登录',
        type: 'success',
        duration: 2000
      })
    },
    
    // 刷新Token
    async refreshAccessToken() {
      try {
        console.log('尝试刷新access_token')
        
        if (!this.refreshToken) {
          console.warn('缺少刷新令牌，无法刷新token')
          throw new Error('无刷新令牌')
        }
        
        const response = await authApi.refreshToken({
          refresh: this.refreshToken
        })
        
        console.log('刷新token响应:', response)
        
        let accessToken = null;
        
        // 处理标准API响应格式: {success, code, message, data}
        if (response.success && response.data) {
          if (response.data.access || response.data.token) {
            accessToken = response.data.access || response.data.token
            console.log('从标准API响应中解析到新token')
          }
        }
        // 兼容旧格式
        else if (response.access) {
          accessToken = response.access
        }
        
        // 判断是否成功
        if (!accessToken) {
          console.error('刷新token失败，返回格式不正确或缺少access token')
          throw new Error('刷新Token失败，服务端未返回新token')
        }
        
        // 更新access_token
        this.setToken(accessToken, this.refreshToken)
        
        console.log('Access token刷新成功')
        
        return accessToken
      } catch (error) {
        console.error('刷新token失败:', error)
        
        // 重新登录
        this.setToken(null, null)
        this.setUser(null)
        
        // 提示用户重新登录
        ElMessage({
          message: '登录已过期，请重新登录',
          type: 'warning',
          duration: 2000
        })
        
        // 跳转到登录页
        router.push('/login')
        
        throw error
      }
    },
    
    // 获取用户信息
    async getProfile() {
      try {
        console.log('获取用户详细信息')
        
        const userApi = (await import('../../api/user')).default
        const response = await userApi.getCurrentUser()
        
        console.log('获取用户详细信息响应:', response)
        
        let userData = null;
        
        // 处理标准API响应格式: {success, code, message, data}
        if (response.success && response.data) {
          userData = response.data
          console.log('从标准API响应中获取用户信息')
        } 
        // 兼容旧格式，直接使用响应作为用户数据
        else {
          userData = response
        }
        
        // 更新用户信息
        this.setUser(userData)
        
        return userData
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    }
  }
})

export default useAuthStore
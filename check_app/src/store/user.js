import { defineStore } from 'pinia'
import userMock from '@/mock/user'

// 用户状态管理
export const useUserStore = defineStore('user', {
  state: () => ({
    // 当前用户信息
    currentUser: null,
    // 子用户列表
    subAccounts: [],
    // 是否加载完成
    loaded: false,
    // 是否正在加载
    loading: false,
    // 错误信息
    error: null
  }),

  getters: {
    // 判断是否已登录
    isLoggedIn: (state) => !!state.currentUser,
    
    // 获取用户信息
    userInfo: (state) => state.currentUser,
    
    // 获取子用户列表
    childAccounts: (state) => state.subAccounts,
    
    // 判断是否有子用户
    hasSubAccounts: (state) => state.subAccounts && state.subAccounts.length > 0,
    
    // 获取用户名
    username: (state) => state.currentUser?.username || '',
    
    // 获取显示名称
    displayName: (state) => state.currentUser?.nick_name || state.currentUser?.username || '',
    
    // 获取头像
    avatar: (state) => state.currentUser?.avatar || '',
  },

  actions: {
    // 设置当前用户信息
    setCurrentUser(user) {
      this.currentUser = user
    },
    
    // 添加子用户
    addSubAccount(user) {
      if (!this.subAccounts.some(acc => acc.id === user.id)) {
        this.subAccounts.push(user)
      }
    },
    
    // 更新子用户信息
    updateSubAccount(user) {
      const index = this.subAccounts.findIndex(acc => acc.id === user.id)
      if (index !== -1) {
        this.subAccounts[index] = { ...this.subAccounts[index], ...user }
      }
    },
    
    // 删除子用户
    removeSubAccount(userId) {
      this.subAccounts = this.subAccounts.filter(acc => acc.id !== userId)
    },
    
    // 加载用户信息（从Mock数据）
    async loadUserInfo() {
      if (this.loading) return
      
      this.loading = true
      this.error = null
      
      try {
        // 模拟请求延迟
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // 从Mock数据获取用户信息
        const mainUser = userMock[0]
        
        // 设置主用户信息
        this.setCurrentUser({
          id: mainUser.id,
          username: mainUser.username,
          nick_name: mainUser.nick_name,
          avatar: mainUser.avatar,
          status: mainUser.status,
          is_admin: mainUser.is_admin,
          is_super_admin: mainUser.is_super_admin,
          is_member: mainUser.is_member
        })
        
        // 设置子用户信息
        this.subAccounts = mainUser.sub_accounts || []
        
        this.loaded = true
      } catch (error) {
        console.error('加载用户信息失败:', error)
        this.error = '加载用户信息失败'
      } finally {
        this.loading = false
      }
    },
    
    // 退出登录
    logout() {
      this.currentUser = null
      this.subAccounts = []
      this.loaded = false
    },
    
    // 初始化用户信息
    init() {
      if (!this.loaded) {
        this.loadUserInfo()
      }
    }
  }
}) 
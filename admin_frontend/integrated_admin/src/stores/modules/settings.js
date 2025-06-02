import { defineStore } from 'pinia'
import { applyTheme, getCurrentTheme } from '../../config/theme'

// 系统设置store
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 主题设置
    theme: getCurrentTheme(),
    
    // 布局设置
    layout: {
      sidebar: {
        collapsed: localStorage.getItem('sidebarStatus') === '1',
        showLogo: true
      },
      header: {
        fixed: true, 
        showFullscreen: true,
        showThemeSwitch: true,
        showNotification: true
      },
      tagsView: {
        show: true,
        cached: true
      },
      showFooter: true,
      showBreadcrumb: true
    },
    
    // 系统配置
    system: {
      title: '集成管理系统',
      logoText: 'AdminPro',
      showWatermark: false,
      watermarkText: '',
      allowGuestMode: false
    }
  }),
  
  getters: {
    // 是否为暗黑模式
    isDarkMode: (state) => state.theme === 'dark',
    
    // 获取系统标题
    systemTitle: (state) => state.system.title,
    
    // 获取Logo文本
    logoText: (state) => state.system.logoText,
    
    // 获取侧边栏状态
    isSidebarCollapsed: (state) => state.layout.sidebar.collapsed
  },
  
  actions: {
    // 设置主题
    setTheme(theme) {
      this.theme = applyTheme(theme)
    },
    
    // 切换侧边栏折叠状态
    toggleSidebar() {
      this.layout.sidebar.collapsed = !this.layout.sidebar.collapsed
      localStorage.setItem('sidebarStatus', this.layout.sidebar.collapsed ? '1' : '0')
    },
    
    // 切换暗黑模式
    toggleDarkMode() {
      const newTheme = this.theme === 'dark' ? 'default' : 'dark'
      this.setTheme(newTheme)
    },
    
    // 保存布局设置
    saveLayoutSettings(settings) {
      this.layout = { ...this.layout, ...settings }
    },
    
    // 保存系统设置
    saveSystemSettings(settings) {
      this.system = { ...this.system, ...settings }
    },
    
    // 重置所有设置到默认值
    resetSettings() {
      this.setTheme('default')
      this.layout = {
        sidebar: {
          collapsed: false,
          showLogo: true
        },
        header: {
          fixed: true,
          showFullscreen: true,
          showThemeSwitch: true,
          showNotification: true
        },
        tagsView: {
          show: true,
          cached: true
        },
        showFooter: true,
        showBreadcrumb: true
      }
      this.system = {
        title: '集成管理系统',
        logoText: 'AdminPro',
        showWatermark: false,
        watermarkText: '',
        allowGuestMode: false
      }
      localStorage.removeItem('sidebarStatus')
    }
  }
})

export default useSettingsStore 
import { defineStore } from 'pinia'
import { themes, currentTheme, theme, themeStyle, changeTheme } from '@/theme'

// 主题状态管理
export const useThemeStore = defineStore('theme', {
  state: () => ({
    // 当前主题名称
    currentTheme: currentTheme.value,
    // 所有主题列表
    themes: themes
  }),

  getters: {
    // 获取当前主题对象
    theme: (state) => {
      return themes.find(t => t.name === state.currentTheme) || themes[0]
    },
    
    // 获取主题样式
    themeStyle: (state) => {
      return themeStyle.value
    },
    
    // 获取主题名称
    themeName: (state) => {
      return state.theme.name
    },
    
    // 获取主题标题 (根据当前语言)
    themeTitle: (state) => {
      const locale = uni.getLocale ? uni.getLocale() : 'zh-CN'
      return locale.includes('zh') ? state.theme.title : state.theme.titleEn
    }
  },

  actions: {
    // 切换主题
    changeTheme(themeName) {
      if (changeTheme(themeName)) {
        this.currentTheme = themeName
        return true
      }
      return false
    },
    
    // 初始化主题
    initTheme() {
      // 设置当前主题
      this.currentTheme = currentTheme.value
    }
  }
}) 
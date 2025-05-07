import { defineStore } from 'pinia'
import i18n from '@/i18n'

// 语言状态管理
export const useLangStore = defineStore('lang', {
  state: () => ({
    // 当前语言
    currentLang: i18n.global.locale.value,
    // 支持的语言列表
    supportedLangs: [
      { code: 'zh-CN', name: '中文' },
      { code: 'en-US', name: 'English' }
    ]
  }),

  getters: {
    // 获取当前语言代码
    langCode: (state) => state.currentLang,
    
    // 获取当前语言名称
    langName: (state) => {
      const lang = state.supportedLangs.find(l => l.code === state.currentLang)
      return lang ? lang.name : '中文'
    },
    
    // 获取支持的语言列表
    langs: (state) => state.supportedLangs
  },

  actions: {
    // 切换语言
    changeLang(langCode) {
      if (this.supportedLangs.some(l => l.code === langCode)) {
        i18n.global.locale.value = langCode
        this.currentLang = langCode
        return true
      }
      return false
    },
    
    // 初始化语言
    initLang() {
      // 设置当前语言
      this.currentLang = i18n.global.locale.value
    }
  }
}) 
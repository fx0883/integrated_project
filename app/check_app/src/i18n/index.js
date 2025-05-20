import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// 检测系统语言
const systemLanguage = () => {
  // 浏览器端
  if (typeof window !== 'undefined' && window.navigator) {
    const language = (
      window.navigator.language || 
      window.navigator.userLanguage || 
      'zh-CN'
    ).toLowerCase()
    
    if (language.includes('zh')) return 'zh-CN'
    if (language.includes('en')) return 'en-US'
    
    return 'zh-CN' // 默认中文
  }
  
  // uni-app 获取系统语言
  const systemInfo = uni.getSystemInfoSync()
  const language = (systemInfo.language || 'zh-CN').toLowerCase()
  
  if (language.includes('zh')) return 'zh-CN'
  if (language.includes('en')) return 'en-US'
  
  return 'zh-CN' // 默认中文
}

// 创建 i18n 实例
const i18n = createI18n({
  locale: systemLanguage(),
  legacy: false, // 使用组合式 API 模式
  globalInjection: true, // 全局注入 $t 方法
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

export default i18n 
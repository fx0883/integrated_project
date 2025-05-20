import { createPinia } from 'pinia'
import { useUserStore } from './user'
import { useThemeStore } from './theme'
import { useLangStore } from './lang'

// 创建 pinia 实例
const pinia = createPinia()

// 初始化所有 store
const initAllStores = () => {
  const userStore = useUserStore()
  const themeStore = useThemeStore()
  const langStore = useLangStore()
  
  userStore.init()
  themeStore.initTheme()
  langStore.initLang()
}

export {
  pinia,
  initAllStores,
  useUserStore,
  useThemeStore,
  useLangStore
} 
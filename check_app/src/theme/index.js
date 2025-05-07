import { ref, computed } from 'vue'
import greenTheme from './green'
import blueTheme from './blue'
import orangeTheme from './orange'

// 主题列表
const themes = [greenTheme, blueTheme, orangeTheme]

// 默认主题
const defaultTheme = 'green'

// 获取存储的主题
const getStoredTheme = () => {
  try {
    const storedTheme = uni.getStorageSync('app_theme')
    return storedTheme || defaultTheme
  } catch (e) {
    console.error('读取主题配置失败：', e)
    return defaultTheme
  }
}

// 当前主题
const currentTheme = ref(getStoredTheme())

// 保存主题到本地存储
const saveTheme = (themeName) => {
  try {
    uni.setStorageSync('app_theme', themeName)
  } catch (e) {
    console.error('保存主题配置失败：', e)
  }
}

// 切换主题
const changeTheme = (themeName) => {
  if (themes.some(theme => theme.name === themeName)) {
    currentTheme.value = themeName
    saveTheme(themeName)
    return true
  }
  console.error('主题不存在：', themeName)
  return false
}

// 根据当前主题名获取主题配置
const theme = computed(() => {
  const theme = themes.find(t => t.name === currentTheme.value)
  return theme || themes[0] // 如果找不到就使用第一个主题
})

// CSS 变量
const cssVars = computed(() => {
  const vars = {}
  const colors = theme.value.colors
  
  // 将主题颜色转换为 CSS 变量
  Object.keys(colors).forEach(key => {
    vars[`--theme-${key}`] = colors[key]
  })
  
  return vars
})

// 获取CSS变量样式对象
const themeStyle = computed(() => {
  const style = {}
  
  Object.entries(cssVars.value).forEach(([key, value]) => {
    style[key] = value
  })
  
  return style
})

export {
  themes,
  currentTheme,
  theme,
  cssVars,
  themeStyle,
  changeTheme
} 
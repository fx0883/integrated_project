// 主题配置
export const themeColors = {
  default: {
    primary: '#2c9678', // 绿色主题
    success: '#67C23A',
    warning: '#E6A23C',
    danger: '#F56C6C',
    info: '#909399'
  },
  blue: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#f5222d',
    info: '#909399'
  },
  purple: {
    primary: '#722ed1',
    success: '#52c41a', 
    warning: '#faad14',
    danger: '#f5222d',
    info: '#909399'
  },
  dark: {
    primary: '#375072',
    success: '#52c41a',
    warning: '#e6a23c',
    danger: '#f56c6c',
    info: '#909399'
  }
}

// 主题应用
export const applyTheme = (theme) => {
  const root = document.documentElement
  const colors = themeColors[theme] || themeColors.default
  
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--el-color-${key}`, value)
  }
  
  // 存储当前主题到本地存储
  localStorage.setItem('theme', theme)
  
  // 触发主题变更事件
  document.dispatchEvent(new CustomEvent('theme-change', { detail: theme }))
  
  return theme
}

// 获取当前主题
export const getCurrentTheme = () => {
  return localStorage.getItem('theme') || 'default'
} 
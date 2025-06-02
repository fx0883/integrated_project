<script setup>
import { onMounted } from 'vue'
import { useAuthStore, useSettingsStore } from './stores'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentTheme, applyTheme } from './config/theme'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const router = useRouter()

// 应用初始化逻辑
onMounted(() => {
  // 初始化主题
  const currentTheme = getCurrentTheme()
  applyTheme(currentTheme)
  
  // 如果已登录但访问登录/注册页面，重定向到首页
  if (authStore.isLoggedIn && (route.name === 'Login' || route.name === 'Register')) {
    router.push('/')
  }
})
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式 */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

/* 设置主题色(绿色) */
:root {
  --el-color-primary: #2c9678;
  --el-color-success: #67C23A;
}

/* 暗色模式 */
.dark-mode {
  --el-bg-color: #1e1e1e;
  --el-bg-color-overlay: #2c2c2c;
  --el-text-color-primary: #e0e0e0;
  --el-text-color-regular: #c0c0c0;
  --el-border-color: #4a4a4a;
  --el-border-color-light: #3a3a3a;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>

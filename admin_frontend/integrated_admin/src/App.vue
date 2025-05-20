<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores'
import { useRoute, useRouter } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// 应用初始化逻辑
onMounted(() => {
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

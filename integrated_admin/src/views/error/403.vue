<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-code">403</div>
      <div class="error-title">禁止访问</div>
      <div class="error-desc">抱歉，您没有权限访问此页面</div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
        <el-button type="warning" @click="goLogin">登录/切换账号</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { onMounted } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

// 组件挂载时检查用户是否已认证
onMounted(() => {
  console.log('403页面加载，检查用户认证状态')
  
  // 如果用户未登录，自动跳转到登录页面
  if (!authStore.isAuthenticated) {
    console.log('用户未认证，自动跳转到登录页面')
    goLogin()
  } else {
    console.log('用户已认证，显示403页面')
  }
})

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}

const goLogin = () => {
  // 跳转到登录页面，并记录当前路径
  console.log('跳转到登录页面')
  authStore.logout() // 清除现有登录状态
  router.push({ 
    path: '/login', 
    query: { 
      redirect: router.currentRoute.value.query.redirect || '/',
      from: '/403'  // 添加来源标记
    } 
  })
}
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.error-container {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #e6a23c;
  line-height: 1.2;
  margin-bottom: 20px;
}

.error-title {
  font-size: 28px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 15px;
}

.error-desc {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}
</style> 
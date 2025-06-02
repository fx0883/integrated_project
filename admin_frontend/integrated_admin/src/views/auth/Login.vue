<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <img src="../../assets/login-bg.svg" alt="Login" class="login-image" />
      </div>
      <div class="login-right">
        <div class="login-header">
          <div class="login-logo">
            <img src="../../assets/logo.svg" alt="Logo" class="logo-img" />
          </div>
          <h2 class="login-title">集成管理系统</h2>
          <p class="login-subtitle">登录以继续访问管理平台</p>
        </div>
        
        <!-- 显示重定向或错误消息 -->
        <el-alert
          v-if="redirectMessage"
          type="warning"
          :closable="true"
          show-icon
          :title="redirectMessage"
          class="login-alert"
        />

        <el-form
          ref="loginForm"
          :model="form"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <div class="form-options">
            <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
            <el-link type="primary" href="#/forgot-password">忘记密码?</el-link>
          </div>
          
          <el-form-item>
            <el-button 
              type="primary" 
              :loading="loading" 
              class="login-button" 
              @click="handleLogin"
              round
            >
              登 录
            </el-button>
          </el-form-item>
          
          <div class="register-link">
            还没有账号? <el-link type="primary" href="#/register">立即注册</el-link>
          </div>
        </el-form>
        
        <div class="login-footer">
          <p>© 2023 集成管理系统 版权所有</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const route = useRoute()

// 状态
const loginForm = ref(null)
const loading = ref(false)
const redirectMessage = ref('')
const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度必须在3-30个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
}

// 初始化
onMounted(() => {
  console.log('Login页面已加载')
  
  // 通过URL来源判断重定向消息
  const fromPath = route.query.from || ''
  
  // 检查是否有重定向消息
  if (route.params.message) {
    redirectMessage.value = route.params.message
  } else if (fromPath === '/403') {
    redirectMessage.value = '您没有权限访问该页面，请登录或切换帐号'
  } else if (route.query.redirect) {
    redirectMessage.value = '您需要登录才能访问该页面'
  }
  
  // 清除可能存在的无效token
  const token = localStorage.getItem('access_token')
  if (token) {
    console.log('登录页检测到存在token，检查其有效性')
    
    // 如果来源是403页面，清除现有登录状态
    if (fromPath === '/403') {
      console.log('来源是403页面，清除现有登录状态')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
    }
  }
})

// 登录处理
const handleLogin = async () => {
  if (loading.value) return
  
  try {
    // 表单验证
    if (!loginForm.value) return
    await loginForm.value.validate()
    
    // 设置加载状态
    loading.value = true
    
    console.log('正在提交登录请求...')
    
    // 登录请求
    const authStore = useAuthStore()
    const user = await authStore.login({
      username: form.username,
      password: form.password
    })
    
    // 验证用户是否为管理员
    console.log('检查用户权限:', user)
    if (!user.is_admin && !user.is_super_admin) {
      // 如果既不是管理员也不是超级管理员，抛出错误
      throw new Error('您没有管理员权限，无法登录系统')
    }
    
    console.log('登录成功，用户信息:', user)
    
    // 登录成功，获取重定向地址
    const redirect = route.query.redirect || '/dashboard'
    console.log('准备重定向到:', redirect)
    
    // 先显示成功消息
    ElMessage({
      type: 'success',
      message: '登录成功，正在跳转...',
      duration: 1500
    })
    
    // 延迟跳转，确保消息显示
    setTimeout(() => {
      // 确保在重定向前重置loading状态
      loading.value = false
      
      // 使用更安全的重定向方法
      try {
        router.replace(redirect)
      } catch (navError) {
        console.error('导航失败，尝试使用备用方法:', navError)
        // 如果路由导航失败，使用location.href作为备用
        const baseUrl = window.location.origin
        const fullUrl = baseUrl + (redirect.startsWith('/') ? redirect : '/' + redirect)
        window.location.href = fullUrl
      }
    }, 1500)
    
  } catch (error) {
    console.error('登录失败:', error)
    
    // 重置加载状态
    loading.value = false
    
    // 显示错误信息
    ElMessage({
      type: 'error',
      message: error.message || '登录失败，请检查用户名和密码'
    })
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5;
  overflow: hidden;
  background-image: 
    linear-gradient(135deg, rgba(49, 71, 150, 0.06) 0%, rgba(233, 236, 241, 0.06) 100%),
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2329477b' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
}

.login-box {
  width: 900px;
  height: 520px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  display: flex;
  overflow: hidden;
}

.login-left {
  width: 50%;
  background: linear-gradient(135deg, #304156 0%, #1f2d3d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-image {
  max-width: 100%;
  max-height: 100%;
}

.login-right {
  width: 50%;
  padding: 40px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo {
  display: inline-block;
  margin-bottom: 16px;
}

.logo-img {
  width: 60px;
  height: 60px;
}

.login-title {
  font-size: 24px;
  font-weight: 500;
  color: #333;
  margin: 0 0 10px;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.login-form {
  flex: 1;
}

.login-alert {
  margin-bottom: 20px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 46px;
  font-size: 16px;
  letter-spacing: 2px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
}

.login-footer {
  margin-top: 40px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

/* 响应式调整 */
@media screen and (max-width: 992px) {
  .login-box {
    width: 700px;
  }
}

@media screen and (max-width: 768px) {
  .login-box {
    width: 100%;
    height: 100%;
    flex-direction: column;
    border-radius: 0;
  }
  .login-left {
    display: none;
  }
  .login-right {
    width: 100%;
    padding: 30px;
  }
}
</style>
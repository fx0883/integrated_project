<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <h1 class="login-title">集成管理系统</h1>
        <p class="login-subtitle">登录以继续访问</p>
      </div>
      
      <!-- 显示重定向或错误消息 -->
      <el-alert
        v-if="redirectMessage"
        type="warning"
        :closable="true"
        show-icon
        :title="redirectMessage"
        style="margin-bottom: 20px;"
      />
      
      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <div class="form-flex">
          <el-form-item style="margin-bottom: 0">
            <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
          </el-form-item>
          <router-link to="/forgot-password" class="forgot-link">忘记密码?</router-link>
        </div>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="login-button" 
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        
        <div class="alternative-login">
          <div class="alt-text">或者使用以下方式登录</div>
          <div class="social-login">
            <a href="#" class="social-btn" @click.prevent="socialLogin('wechat')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.69,11.71a1,1,0,1,1,1-1A1,1,0,0,1,8.69,11.71Zm3.94-1a1,1,0,1,0-1,1A1,1,0,0,0,12.63,10.68ZM19.09,12a6.62,6.62,0,0,1,.66,2.85c0,3.83-3.79,6.94-8.45,6.94a9.55,9.55,0,0,1-2.34-.3A1,1,0,0,1,8.6,21l-.24-1-.9-.39a5.22,5.22,0,0,1-2.2-2A5.58,5.58,0,0,1,4,14.33c0-3,3-5.44,6.69-5.44a7.39,7.39,0,0,1,4.83,1.69h.22a.86.86,0,0,1,.37,0A6.83,6.83,0,0,0,14,5.5C14,2.87,16.72.5,20.06.5A6.13,6.13,0,0,1,24,1.67a1,1,0,0,1,.51.92.76.76,0,0,1,0,.26L24.32,4,25,4.32a3.09,3.09,0,0,0,1.46,2.92.94.94,0,0,1,.31,1.13A4.29,4.29,0,0,1,24,11,6.89,6.89,0,0,1,19.09,12ZM14.89,6.55a1,1,0,1,0,1,1A1,1,0,0,0,14.89,6.55Zm4.55-3.94a1,1,0,1,0,1,1A1,1,0,0,0,19.44,2.61Z"></path>
              </svg>
            </a>
            <a href="#" class="social-btn" @click.prevent="socialLogin('dingtalk')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor">
                <path d="M573.7 252.5C422.5 197.4 201.3 96.7 201.3 96.7c-15.7-4.1-17.9 11.1-17.9 11.1-5 61.1 33.6 160.5 53.6 182.8 19.9 22.3 319.1 113.7 319.1 113.7S326 357.9 270.5 341.9c-55.6-16-37.9 17.8-37.9 17.8 11.4 61.7 64.9 131.8 107.2 138.4 42.2 6.6 220.1 4 220.1 4s-35.5 4.1-93.2 11.9c-42.7 5.8-97 12.5-111.1 17.8-33.1 12.5 24 62.6 24 62.6 84.7 76.8 129.7 50.5 129.7 50.5 33.3-10.7 61.4-18.5 85.2-24.2L565 743.1h84.6L603 928l205.3-271.9H700.8l22.3-38.7c0.1 0 127.3-163.2 127.3-399.6 0 0 3.2-37.1-30.2-28.8-33.4 8.2-252.9 69.5-246.5 63.4z"></path>
              </svg>
            </a>
            <a href="#" class="social-btn" @click.prevent="socialLogin('feishu')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor">
                <path d="M409.048 757.659c-152.15-12.648-271.01-139.246-271.01-294.803 0-163.097 132.274-295.37 295.37-295.37h200.199s186.66-20.094 186.66 177.952v83.675c0 163.097-132.274 295.37-295.37 295.37h-115.85z m3.796-516.825c-122.38 0-221.527 99.147-221.527 221.527s99.148 221.528 221.527 221.528h115.85c122.38 0 221.527-99.148 221.527-221.528V392.06s9.638-50.778-43.168-72.585h-178.36c-35.343 0-115.849 0-115.849-78.64z" fill="#FFFFFF"></path><path d="M510.002 510.087h148.913v73.638H510.002zM399.694 510.087h72.585v73.638h-72.585zM652.062 364.713h73.638v73.638h-73.638zM510.002 364.713h72.585v73.638h-72.585zM399.694 364.713h72.585v73.638h-72.585z" fill="#FFFFFF"></path>
              </svg>
            </a>
          </div>
        </div>
        
        <div class="register-link">
          还没有账号? <router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores'
import { ElMessage } from 'element-plus'

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
  // 检查是否有重定向消息
  if (route.params.message) {
    redirectMessage.value = route.params.message
  } else if (route.query.redirect) {
    redirectMessage.value = '您需要登录才能访问该页面'
  }
  
  // 清除可能存在的无效token
  const token = localStorage.getItem('access_token')
  if (token) {
    console.log('登录页检测到存在token，检查其有效性')
    
    // TODO: 如果需要，可以在这里验证token
  }
})

// 社交登录处理
const socialLogin = (type) => {
  console.log(`尝试使用${type}登录`)
  
  // 这里可以根据不同社交登录类型进行处理
  ElMessage({
    type: 'info',
    message: `${type}登录功能正在开发中，敬请期待`,
    duration: 2000
  })
}

// 登录处理
const handleLogin = async () => {
  if (loading.value) return
  
  try {
    // 表单验证
    console.log('开始验证表单')
    await loginForm.value.validate()
    console.log('表单验证通过')
    
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
    
    // 解决方法：使用单一方法重定向，确保状态更新完成后再导航
    // 延迟50ms让Pinia状态完全更新
    console.log('使用延迟重定向方法')
    setTimeout(() => {
      console.log('重定向执行: 清空loading状态')
      loading.value = false
      
      console.log('重定向执行: 使用router.replace跳转到', redirect)
      router.replace(redirect).then(() => {
        console.log('router.replace导航完成')
      }).catch(err => {
        console.error('router.replace导航失败，错误:', err)
        
        // 如果router导航失败，尝试使用window.location
        console.log('尝试使用window.location.href跳转')
        const baseUrl = window.location.origin
        const fullUrl = baseUrl + (redirect.startsWith('/') ? redirect : '/' + redirect)
        window.location.href = fullUrl
      })
    }, 50)
    
    ElMessage({
      type: 'success',
      message: '登录成功'
    })
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
  background-color: #f7f9fc;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
}

.login-card {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.login-logo svg {
  width: 45px;
  height: 45px;
  color: #0abab5;
}

.login-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.login-subtitle {
  font-size: 14px;
  color: #666;
}

.login-button {
  width: 100%;
  margin-top: 10px;
  background-color: #0abab5;
  border-color: #0abab5;
  height: 44px;
  font-size: 16px;
}

.login-button:hover {
  background-color: #099490;
  border-color: #099490;
}

.form-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forgot-link {
  font-size: 14px;
  color: #0abab5;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.register-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #ff6600;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

.alternative-login {
  margin-top: 25px;
  text-align: center;
}

.alt-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  position: relative;
}

.alt-text::before,
.alt-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background-color: #E8ECF4;
}

.alt-text::before {
  left: 0;
}

.alt-text::after {
  right: 0;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: white;
  border: 1px solid #E8ECF4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6E7687;
}

.social-btn:hover {
  background-color: #e0f5f4;
  border-color: #0abab5;
  color: #0abab5;
}
</style>
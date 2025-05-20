<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="forgot-password-header">
        <div class="forgot-password-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <h1 class="forgot-password-title">找回密码</h1>
        <p class="forgot-password-subtitle">请输入您的邮箱，我们将发送重置密码的链接</p>
      </div>
      
      <!-- 显示成功或错误消息 -->
      <el-alert
        v-if="message.show"
        :type="message.type"
        :closable="true"
        show-icon
        :title="message.content"
        style="margin-bottom: 20px;"
      />
      
      <el-form
        ref="forgotForm"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="form.email"
            placeholder="请输入注册时的邮箱"
            prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="submit-button" 
            @click="handleSubmit"
          >
            发送重置链接
          </el-button>
        </el-form-item>
        
        <div class="back-link">
          <router-link to="/login">返回登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// 路由
const router = useRouter()

// 状态
const forgotForm = ref(null)
const loading = ref(false)
const message = reactive({
  show: false,
  type: 'info',
  content: ''
})
const form = reactive({
  email: ''
})

// 表单验证规则
const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

// 提交表单
const handleSubmit = async () => {
  if (loading.value) return
  
  try {
    // 表单验证
    await forgotForm.value.validate()
    
    // 设置加载状态
    loading.value = true
    
    console.log('提交忘记密码请求:', form.email)
    
    // 模拟API请求
    setTimeout(() => {
      // 显示成功消息
      message.show = true
      message.type = 'success'
      message.content = `重置密码链接已发送到 ${form.email}，请查收邮件`
      
      // 清除加载状态
      loading.value = false
      
      // 5秒后自动跳转回登录页
      setTimeout(() => {
        router.push('/login')
      }, 5000)
    }, 1500)
  } catch (error) {
    console.error('表单验证失败:', error)
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f7f9fc;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
}

.forgot-password-card {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 30px;
}

.forgot-password-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.forgot-password-logo svg {
  width: 45px;
  height: 45px;
  color: #0abab5;
}

.forgot-password-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.forgot-password-subtitle {
  font-size: 14px;
  color: #666;
}

.submit-button {
  width: 100%;
  margin-top: 10px;
  background-color: #0abab5;
  border-color: #0abab5;
  height: 44px;
  font-size: 16px;
}

.submit-button:hover {
  background-color: #099490;
  border-color: #099490;
}

.back-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
}

.back-link a {
  color: #0abab5;
  text-decoration: none;
}

.back-link a:hover {
  text-decoration: underline;
}
</style> 
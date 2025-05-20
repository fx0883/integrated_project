<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-title">
        <h2>集成管理系统</h2>
        <p>创建新账号</p>
      </div>
      
      <el-form
        ref="registerForm"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="电子邮箱" prop="email">
          <el-input 
            v-model="form.email"
            placeholder="请输入电子邮箱"
            prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item label="手机号码" prop="phone">
          <el-input 
            v-model="form.phone"
            placeholder="请输入手机号码"
            prefix-icon="Phone"
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="real_name">
          <el-input 
            v-model="form.real_name"
            placeholder="请输入真实姓名"
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
        
        <el-form-item label="确认密码" prop="password_confirm">
          <el-input 
            v-model="form.password_confirm"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="form.agree" required>
            我已阅读并同意 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a>
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="register-button" 
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
        
        <div class="login-link">
          已有账号? <router-link to="/login">返回登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores'
import { ElMessage } from 'element-plus'

// 路由
const router = useRouter()

// 状态
const registerForm = ref(null)
const loading = ref(false)
const form = reactive({
  username: '',
  email: '',
  phone: '',
  real_name: '',
  password: '',
  password_confirm: '',
  agree: false
})

// 校验两次密码是否一致
const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度必须在3-30个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的电子邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  real_name: [
    { required: false, message: '请输入真实姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8个字符', trigger: 'blur' }
  ],
  password_confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ],
  agree: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请同意服务条款和隐私政策'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 注册处理
const handleRegister = async () => {
  if (loading.value) return
  
  try {
    // 表单验证
    await registerForm.value.validate()
    
    if (!form.agree) {
      ElMessage.warning('请同意服务条款和隐私政策')
      return
    }
    
    // 设置加载状态
    loading.value = true
    
    // 注册请求
    const authStore = useAuthStore()
    await authStore.register({
      username: form.username,
      email: form.email,
      phone: form.phone,
      real_name: form.real_name,
      password: form.password,
      password_confirm: form.password_confirm
    })
    
    // 注册成功，重定向到登录页
    router.push('/login')
  } catch (error) {
    console.error('注册错误:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 30px 0;
  background-color: #f5f7fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.register-card {
  width: 450px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
}

.register-title h2 {
  font-weight: 600;
  color: #2c9678;
  margin-bottom: 10px;
}

.register-title p {
  color: #909399;
  font-size: 14px;
}

.register-button {
  width: 100%;
  margin-top: 10px;
}

.login-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.login-link a {
  color: #2c9678;
  text-decoration: none;
}

a {
  color: #2c9678;
  text-decoration: none;
}
</style> 
<template>
  <div class="create-user-container">
    <div class="page-header">
      <h1 class="page-title">创建用户</h1>
      <div class="page-actions">
        <el-button @click="goBack" class="btn-secondary">
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>
    
    <div class="content-container" v-loading="loading">
      <!-- 基本信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><User /></el-icon>
            <span>基本信息</span>
          </div>
        </template>
        
        <el-form
          ref="userFormRef"
          :model="userForm"
          :rules="rules"
          label-width="120px"
          class="user-form"
        >
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="userForm.username" placeholder="请输入用户名" />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="userForm.email" placeholder="请输入邮箱" />
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="密码" prop="password">
                <el-input 
                  v-model="userForm.password" 
                  type="password" 
                  placeholder="请输入密码"
                  show-password
                />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input 
                  v-model="userForm.confirmPassword" 
                  type="password" 
                  placeholder="请再次输入密码"
                  show-password
                />
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="userForm.phone" placeholder="请输入手机号" />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="真实姓名" prop="real_name">
                <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
              </el-form-item>
            </div>
          </div>
          
          <el-form-item label="角色" prop="role">
            <el-radio-group v-model="userForm.role">
              <el-radio label="user">普通用户</el-radio>
              <el-radio label="admin">管理员</el-radio>
              <el-radio label="super_admin">超级管理员</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="状态">
            <div class="switch-wrapper">
              <el-switch 
                v-model="userForm.status" 
                active-value="active" 
                inactive-value="disabled"
                :active-color="variables.primaryColor"
                :inactive-color="variables.borderColor"
              />
              <span class="switch-label">{{ userForm.status === 'active' ? '已激活' : '已禁用' }}</span>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 安全信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><Lock /></el-icon>
            <span>安全选项</span>
          </div>
        </template>
        
        <div class="security-option">
          <div class="security-content">
            <div class="security-title">双因素认证</div>
            <div class="security-desc">增强账户安全性，需要额外验证</div>
          </div>
          <el-switch 
            v-model="userForm.twoFactorEnabled" 
            :active-color="variables.primaryColor"
            :inactive-color="variables.borderColor"
          />
        </div>
        
        <div class="security-option">
          <div class="security-content">
            <div class="security-title">发送欢迎邮件</div>
            <div class="security-desc">向用户邮箱发送欢迎邮件和登录指南</div>
          </div>
          <el-switch 
            v-model="userForm.sendWelcomeEmail" 
            :active-color="variables.primaryColor"
            :inactive-color="variables.borderColor"
          />
        </div>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button type="primary" @click="submitForm" :loading="submitLoading" class="btn-primary">创建用户</el-button>
        <el-button @click="resetForm" class="btn-reset">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '../../api'
import { ElMessage } from 'element-plus'
import { User, Lock, Back } from '@element-plus/icons-vue'

// 路由
const router = useRouter()

// 表单引用
const userFormRef = ref(null)

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)

// 全局样式变量
const variables = {
  primaryColor: '#0abab5',
  secondaryColor: '#ff6600',
  borderColor: '#E8ECF4'
}

// 表单数据
const userForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  real_name: '',
  role: 'user',
  status: 'active',
  twoFactorEnabled: false,
  sendWelcomeEmail: true
})

// 密码校验
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (userForm.confirmPassword !== '') {
      userFormRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== userForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 提交表单
const submitForm = async () => {
  try {
    await userFormRef.value.validate()
    
    submitLoading.value = true
    console.log('提交用户表单', userForm)
    
    // 实际项目中应该调用API创建用户
    // const response = await userApi.createUser({
    //   username: userForm.username,
    //   email: userForm.email,
    //   password: userForm.password,
    //   phone: userForm.phone,
    //   real_name: userForm.real_name,
    //   is_admin: userForm.role === 'admin' || userForm.role === 'super_admin',
    //   is_super_admin: userForm.role === 'super_admin',
    //   status: userForm.status,
    //   two_factor_enabled: userForm.twoFactorEnabled,
    //   send_welcome_email: userForm.sendWelcomeEmail
    // })
    
    // 模拟请求
    setTimeout(() => {
      submitLoading.value = false
      
      ElMessage({
        type: 'success',
        message: '用户创建成功'
      })
      
      // 创建成功后返回列表页
      router.push('/users')
    }, 800)
  } catch (error) {
    console.error('表单验证失败:', error)
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  userFormRef.value.resetFields()
}

// 返回列表页
const goBack = () => {
  router.push('/users')
}
</script>

<style scoped>
.create-user-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-row {
  display: flex;
  margin: 0 -10px;
}

.form-col {
  flex: 1;
  padding: 0 10px;
}

.user-form {
  padding: 10px 0;
}

.btn-primary {
  background-color: #0abab5;
  border-color: #0abab5;
}

.btn-primary:hover {
  background-color: #099490;
  border-color: #099490;
}

.btn-secondary {
  background-color: white;
  border-color: #E8ECF4;
  color: #6E7687;
}

.btn-secondary:hover {
  background-color: #e0f5f4;
  border-color: #0abab5;
  color: #0abab5;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-label {
  font-size: 14px;
  color: #666;
}

.security-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid #E8ECF4;
}

.security-option:last-child {
  border-bottom: none;
}

.security-content {
  flex: 1;
}

.security-title {
  font-weight: 500;
  font-size: 15px;
  color: #333;
  margin-bottom: 5px;
}

.security-desc {
  font-size: 13px;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
}
</style> 
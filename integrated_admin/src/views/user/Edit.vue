<template>
  <div class="edit-user-container">
    <div class="page-header">
      <h1 class="page-title">编辑用户</h1>
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
                <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="true" />
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
            <el-radio-group v-model="userForm.role" :disabled="userForm.username === 'admin'">
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
                :disabled="userForm.username === 'admin'"
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
            <span>安全信息</span>
          </div>
        </template>
        
        <div class="security-option">
          <div class="security-content">
            <div class="security-title">修改密码</div>
            <div class="security-desc">重置用户的登录密码</div>
          </div>
          <el-button type="primary" @click="showChangePassword = true" plain>修改密码</el-button>
        </div>
        
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
            <div class="security-title">登录历史</div>
            <div class="security-desc">查看用户最近的登录记录</div>
          </div>
          <router-link :to="`/users/login-history/${userForm.id}`">
            <el-button type="primary" text>查看记录</el-button>
          </router-link>
        </div>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button type="primary" @click="submitForm" :loading="submitLoading" class="btn-primary">保存更改</el-button>
        <el-button @click="resetForm" class="btn-reset">重置</el-button>
      </div>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showChangePassword"
      title="修改密码"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showChangePassword = false">取消</el-button>
          <el-button type="primary" @click="submitPasswordForm" :loading="passwordLoading" class="btn-primary">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi } from '../../api'
import { ElMessage } from 'element-plus'
import { User, Lock, Back } from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const route = useRoute()
const userId = route.params.id

// 表单引用
const userFormRef = ref(null)
const passwordFormRef = ref(null)

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)
const passwordLoading = ref(false)

// 修改密码对话框
const showChangePassword = ref(false)

// 全局样式变量
const variables = {
  primaryColor: '#0abab5',
  secondaryColor: '#ff6600',
  borderColor: '#E8ECF4'
}

// 表单数据
const userForm = reactive({
  id: '',
  username: '',
  email: '',
  phone: '',
  real_name: '',
  role: 'user',
  status: 'active',
  twoFactorEnabled: false
})

// 密码表单
const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 密码校验
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'))
  } else {
    if (passwordForm.confirmPassword !== '') {
      passwordFormRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.password) {
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
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 密码表单验证规则
const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    loading.value = true
    console.log('获取用户信息, ID:', userId)
    
    // 实际项目中应该调用API获取用户信息
    // const userInfo = await userApi.getUserById(userId)
    
    // 模拟数据
    setTimeout(() => {
      const userInfo = {
        id: userId,
        username: userId === '1' ? 'admin' : 'test',
        email: userId === '1' ? 'admin@example.com' : 'test@example.com',
        phone: userId === '1' ? '13800138000' : '13800138001',
        real_name: userId === '1' ? '管理员' : '测试用户',
        is_super_admin: userId === '1',
        is_admin: userId === '1',
        status: 'active',
        twoFactorEnabled: false
      }
      
      // 根据API返回的数据结构设置表单
      userForm.id = userInfo.id
      userForm.username = userInfo.username
      userForm.email = userInfo.email
      userForm.phone = userInfo.phone
      userForm.real_name = userInfo.real_name
      
      // 设置角色
      if (userInfo.is_super_admin) {
        userForm.role = 'super_admin'
      } else if (userInfo.is_admin) {
        userForm.role = 'admin'
      } else {
        userForm.role = 'user'
      }
      
      userForm.status = userInfo.status
      userForm.twoFactorEnabled = userInfo.twoFactorEnabled
      
      loading.value = false
      console.log('用户信息加载完成')
    }, 500)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    loading.value = false
    ElMessage.error('获取用户信息失败')
  }
}

// 提交表单
const submitForm = async () => {
  try {
    await userFormRef.value.validate()
    
    submitLoading.value = true
    console.log('提交用户表单', userForm)
    
    // 实际项目中应该调用API更新用户信息
    // await userApi.updateUser(userForm.id, userForm)
    
    // 模拟请求
    setTimeout(() => {
      submitLoading.value = false
      
      ElMessage({
        type: 'success',
        message: '用户信息更新成功'
      })
    }, 800)
  } catch (error) {
    console.error('表单验证失败:', error)
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  userFormRef.value.resetFields()
  getUserInfo()
}

// 提交修改密码
const submitPasswordForm = async () => {
  try {
    await passwordFormRef.value.validate()
    
    passwordLoading.value = true
    console.log('提交密码修改', userId, passwordForm.password)
    
    // 实际项目中应该调用API更新用户密码
    // await userApi.updateUserPassword(userId, passwordForm.password)
    
    // 模拟请求
    setTimeout(() => {
      passwordLoading.value = false
      showChangePassword.value = false
      
      ElMessage({
        type: 'success',
        message: '密码修改成功'
      })
      
      // 清空密码表单
      passwordForm.password = ''
      passwordForm.confirmPassword = ''
    }, 800)
  } catch (error) {
    console.error('密码表单验证失败:', error)
    passwordLoading.value = false
  }
}

// 返回列表页
const goBack = () => {
  router.push('/users')
}

// 生命周期钩子
onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.edit-user-container {
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
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
              <el-form-item label="确认密码" prop="password_confirm">
                <el-input 
                  v-model="userForm.password_confirm" 
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
              <el-form-item label="昵称" prop="nick_name">
                <el-input v-model="userForm.nick_name" placeholder="请输入昵称" />
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="名" prop="first_name">
                <el-input v-model="userForm.first_name" placeholder="请输入名" />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="姓" prop="last_name">
                <el-input v-model="userForm.last_name" placeholder="请输入姓" />
              </el-form-item>
            </div>
          </div>
          
          <el-form-item label="角色" prop="role">
            <el-radio-group v-model="userForm.role">
              <el-radio value="user" label="普通用户">普通用户</el-radio>
              <el-radio value="admin" label="管理员">管理员</el-radio>
              <el-radio v-if="isSuperAdmin" value="super_admin" label="超级管理员">超级管理员</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="所属租户" prop="tenant_id" v-if="isSuperAdmin">
            <el-select 
              v-model="userForm.tenant_id" 
              placeholder="请选择租户" 
              filterable
              remote
              :remote-method="searchTenants"
              :loading="tenantsLoading"
              clearable
            >
              <el-option
                v-for="item in tenantOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <div class="switch-wrapper">
              <el-switch 
                v-model="userForm.is_active" 
                :active-color="variables.primaryColor"
                :inactive-color="variables.borderColor"
              />
              <span class="switch-label">{{ userForm.is_active ? '已激活' : '已禁用' }}</span>
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
            <div class="security-title">发送欢迎邮件</div>
            <div class="security-desc">向用户邮箱发送欢迎邮件和登录指南</div>
          </div>
          <el-switch 
            v-model="userForm.send_welcome_email" 
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, tenantApi } from '../../api'
import { ElMessage } from 'element-plus'
import { User, Lock, Back } from '@element-plus/icons-vue'

// 路由
const router = useRouter()

// 表单引用
const userFormRef = ref(null)

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)

// 当前用户信息
const userInfo = computed(() => {
  const info = JSON.parse(localStorage.getItem('user_info') || '{}')
  return info
})

// 判断是否为超级管理员
const isSuperAdmin = computed(() => userInfo.value.is_super_admin)

// 全局样式变量
const variables = {
  primaryColor: '#0abab5',
  secondaryColor: '#ff6600',
  borderColor: '#E8ECF4'
}

// 租户选项
const tenantOptions = ref([])
const tenantsLoading = ref(false)

// 搜索租户
const searchTenants = async (query) => {
  try {
    tenantsLoading.value = true
    const response = await tenantApi.getTenants({
      search: query,
      page_size: 20,
      page: 1
    })
    tenantOptions.value = response.results || []
    tenantsLoading.value = false
  } catch (error) {
    console.error('搜索租户失败:', error)
    tenantsLoading.value = false
  }
}

// 表单数据
const userForm = reactive({
  username: '',
  email: '',
  password: '',
  password_confirm: '',
  phone: '',
  nick_name: '',
  first_name: '',
  last_name: '',
  role: 'user',
  is_active: true,
  tenant_id: '',
  send_welcome_email: true
})

// 密码校验
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (userForm.password_confirm !== '') {
      userFormRef.value.validateField('password_confirm')
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
  password_confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  tenant_id: [
    { required: true, message: '请选择所属租户', trigger: 'change', 
      validator: (rule, value, callback) => {
        // 如果不是超级管理员或者已选择租户，通过验证
        if (!isSuperAdmin.value || value) {
          callback()
        } else {
          callback(new Error('请选择所属租户'))
        }
      }
    }
  ]
}

// 提交表单
const submitForm = async () => {
  try {
    await userFormRef.value.validate()
    
    submitLoading.value = true
    
    // 创建用户逻辑
    try {
      // 准备用户基本信息数据
      const userData = {
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        password_confirm: userForm.password_confirm,
        phone: userForm.phone || '',
        nick_name: userForm.nick_name || '',
        first_name: userForm.first_name || '',
        last_name: userForm.last_name || '',
        is_active: userForm.is_active
      }
      
      // 发送欢迎邮件
      userData.send_welcome_email = userForm.send_welcome_email
      
      // 根据角色设置is_admin和is_super_admin
      if (userForm.role === 'super_admin') {
        userData.is_admin = true
        userData.is_super_admin = true
      } else if (userForm.role === 'admin') {
        userData.is_admin = true
        userData.is_super_admin = false
      } else {
        userData.is_admin = false
        userData.is_super_admin = false
        userData.is_member = true
      }
      
      // 如果是超级管理员且选择了租户
      if (isSuperAdmin.value && userForm.tenant_id) {
        userData.tenant_id = userForm.tenant_id
      } else if (!isSuperAdmin.value) {
        // 如果不是超级管理员，使用当前用户的租户
        userData.tenant_id = userInfo.value.tenant_id
      }
      
      console.log('创建用户数据:', userData)
      
      // 调用API创建用户
      const response = await userApi.createUser(userData)
      
      submitLoading.value = false
      
      ElMessage({
        type: 'success',
        message: '用户创建成功'
      })
      
      // 创建成功后返回列表页
      router.push('/users')
    } catch (error) {
      console.error('创建用户失败:', error)
      // 打印完整的错误响应以便调试
      if (error.response) {
        console.error('错误响应数据:', error.response.data)
      }
      submitLoading.value = false
      ElMessage.error(error.response?.data?.message || error.response?.data || '创建用户失败')
    }
  } catch (validationError) {
    console.error('表单验证失败:', validationError)
    ElMessage.error('请检查表单填写是否正确')
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
</style>
<template>
  <div class="profile-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>个人设置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="basicFormRef"
            :model="basicForm"
            :rules="basicRules"
            label-width="100px"
            class="profile-form"
          >
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatar"
              >
                <el-avatar v-if="basicForm.avatar" :size="100" :src="basicForm.avatar" />
                <el-avatar v-else :size="100">{{ userInitials }}</el-avatar>
                <div class="avatar-uploader-text">点击上传</div>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="basicForm.username" disabled />
            </el-form-item>
            
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="basicForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="basicForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            
            <el-form-item label="真实姓名" prop="real_name">
              <el-input v-model="basicForm.real_name" placeholder="请输入真实姓名" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updateBasicInfo" :loading="basicLoading">保存</el-button>
              <el-button @click="resetBasicForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 修改密码 -->
        <el-tab-pane label="修改密码" name="password">
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="120px"
            class="profile-form"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="updatePassword" :loading="passwordLoading">更新密码</el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 账号安全 -->
        <el-tab-pane label="账号安全" name="security">
          <el-empty description="暂无数据" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores'
import { userApi } from '../../api'
import { ElMessage } from 'element-plus'

// 认证状态
const authStore = useAuthStore()

// 当前激活的标签页
const activeTab = ref('basic')

// 表单引用
const basicFormRef = ref(null)
const passwordFormRef = ref(null)

// 加载状态
const basicLoading = ref(false)
const passwordLoading = ref(false)

// 用户初始字母
const userInitials = computed(() => {
  const name = basicForm.real_name || basicForm.username
  return name ? name.charAt(0).toUpperCase() : '?'
})

// 基本信息表单
const basicForm = reactive({
  username: '',
  email: '',
  phone: '',
  real_name: '',
  avatar: ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 基本信息验证规则
const basicRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 密码验证规则
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
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  newPassword: [
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
    console.log('正在获取当前用户信息...')
    
    // 调用API获取用户信息
    const userInfo = await userApi.getCurrentUser()
    console.log('API返回的用户信息:', userInfo)
    
    if (userInfo) {
      basicForm.username = userInfo.username || ''
      basicForm.email = userInfo.email || ''
      basicForm.phone = userInfo.phone || ''
      basicForm.real_name = userInfo.real_name || ''
      basicForm.avatar = userInfo.avatar || ''
      
      // 更新状态管理中的用户信息
      authStore.setUser(userInfo)
    } else {
      console.error('获取用户信息失败: 返回的数据为空')
      ElMessage.error('获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败: ' + (error.message || '未知错误'))
  }
}

// 上传头像前的校验
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传头像图片只能是图片格式!')
  }
  
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
  }
  
  return isImage && isLt2M
}

// 上传头像
const uploadAvatar = async (options) => {
  try {
    const file = options.file
    console.log('正在上传头像:', file.name)
    
    // 调用API上传头像
    await userApi.uploadAvatar(file)
    
    // 上传成功后重新获取用户信息（包含新头像URL）
    await getUserInfo()
    
    ElMessage({
      type: 'success',
      message: '头像上传成功'
    })
  } catch (error) {
    console.error('上传头像失败:', error)
    ElMessage.error('上传头像失败: ' + (error.message || '未知错误'))
  }
}

// 更新基本信息
const updateBasicInfo = async () => {
  try {
    await basicFormRef.value.validate()
    
    basicLoading.value = true
    console.log('正在更新基本信息:', basicForm)
    
    // 调用API更新用户信息
    await userApi.updateUser('me', {
      email: basicForm.email,
      phone: basicForm.phone,
      real_name: basicForm.real_name
    })
    
    basicLoading.value = false
    
    // 获取更新后的用户信息
    await getUserInfo()
    
    ElMessage({
      type: 'success',
      message: '基本信息更新成功'
    })
  } catch (error) {
    console.error('更新基本信息失败:', error)
    basicLoading.value = false
    ElMessage.error('更新信息失败: ' + (error.message || '未知错误'))
  }
}

// 更新密码
const updatePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    
    passwordLoading.value = true
    console.log('正在更新密码...')
    
    // 调用API更新密码
    await userApi.changeCurrentUserPassword({
      old_password: passwordForm.oldPassword,
      new_password: passwordForm.newPassword
    })
    
    passwordLoading.value = false
    
    ElMessage({
      type: 'success',
      message: '密码更新成功'
    })
    
    // 重置表单
    resetPasswordForm()
  } catch (error) {
    console.error('更新密码失败:', error)
    passwordLoading.value = false
    ElMessage.error('更新密码失败: ' + (error.message || '未知错误'))
  }
}

// 重置基本信息表单
const resetBasicForm = () => {
  getUserInfo()
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordFormRef.value.resetFields()
}

// 生命周期钩子
onMounted(async () => {
  console.log('Profile组件已挂载，正在初始化...')
  
  // 检查token是否存在
  const token = localStorage.getItem('access_token')
  if (!token) {
    console.error('Token不存在，无法获取用户信息')
    ElMessage.error('您需要登录才能访问此页面')
    
    // 重定向到登录页面，并带上原始URL以便登录后返回
    const currentPath = window.location.pathname
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
    return
  }
  
  try {
    // 先尝试验证token有效性
    console.log('验证token有效性...')
    
    await getUserInfo()
    console.log('用户信息加载完成')
  } catch (error) {
    console.error('初始化失败:', error)
    // 获取用户信息失败，可能是token无效，跳转到登录页
    if (error.response && error.response.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      
      // 登录过期，清除相关信息
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_info')
      
      // 重定向到登录页面
      const currentPath = window.location.pathname
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
    }
  }
})
</script>

<style scoped>
.profile-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-form {
  max-width: 600px;
}

.avatar-uploader {
  text-align: center;
  cursor: pointer;
}

.avatar-uploader-text {
  margin-top: 10px;
  color: #409EFF;
}

.el-tabs {
  margin-top: 10px;
}
</style> 
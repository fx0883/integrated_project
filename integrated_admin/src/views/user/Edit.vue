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
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="头像">
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :http-request="uploadAvatar"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                >
                  <div class="avatar-wrapper">
                    <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar-image" />
                    <div v-else class="avatar-placeholder">{{ userInitials }}</div>
                    <div class="avatar-uploader-text">点击上传</div>
                  </div>
                </el-upload>
              </el-form-item>
            </div>
          </div>
          
          <el-form-item label="角色" prop="role">
            <el-radio-group v-model="userForm.role" :disabled="!canChangeRole">
              <el-radio label="user">普通用户</el-radio>
              <el-radio label="admin">管理员</el-radio>
              <el-radio v-if="isSuperAdmin" label="super_admin">超级管理员</el-radio>
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
                :disabled="userForm.username === 'admin'"
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
        <el-button type="primary" @click="submitBasicForm" :loading="submitLoading" class="btn-primary">保存更改</el-button>
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
        
        <el-form-item label="确认密码" prop="password_confirm">
          <el-input
            v-model="passwordForm.password_confirm"
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
    
    <!-- 图片裁剪对话框 -->
    <el-dialog
      v-model="cropperVisible"
      title="裁剪头像"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="cropper-container">
        <VueCropper
          ref="cropperRef"
          :img="imageUrl"
          :output-size="1"
          :output-type="'jpeg'"
          :info="true"
          :full="false"
          :auto-crop="true"
          :auto-crop-width="200"
          :auto-crop-height="200"
          :fixed-box="true"
          :center-box="true"
          :fixed="true"
          :fixed-number="[1, 1]"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCropCancel">取消</el-button>
          <el-button type="primary" @click="handleCropConfirm">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi, tenantApi } from '../../api'
import { ElMessage } from 'element-plus'
import { User, Lock, Back } from '@element-plus/icons-vue'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'

// 路由
const router = useRouter()
const route = useRoute()
const userId = ref(route.params.id)

// 表单引用
const userFormRef = ref(null)
const passwordFormRef = ref(null)
const cropperRef = ref(null)

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)
const passwordLoading = ref(false)

// 修改密码对话框
const showChangePassword = ref(false)

// 当前用户信息
const userInfo = computed(() => {
  const info = JSON.parse(localStorage.getItem('user_info') || '{}')
  return info
})

// 判断是否为超级管理员
const isSuperAdmin = computed(() => userInfo.value.is_super_admin)

// 判断是否可以更改角色（不能更改自己的角色，admin用户不能被降级）
const canChangeRole = computed(() => {
  if (userForm.username === 'admin') return false
  if (userForm.id === userInfo.value.id) return false
  return true
})

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
    
    // 调用API获取用户信息
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
  id: '',
  username: '',
  email: '',
  phone: '',
  nick_name: '',
  first_name: '',
  last_name: '',
  role: 'user',
  is_active: true,
  tenant_id: '',
  avatar: '',
  avatar_file: null
})

// 密码表单
const passwordForm = reactive({
  password: '',
  password_confirm: ''
})

// 密码校验
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'))
  } else {
    if (passwordForm.password_confirm !== '') {
      passwordFormRef.value.validateField('password_confirm')
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
  password_confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
}

// 获取用户信息
const getUserDetail = async () => {
  try {
    loading.value = true
    
    // 调用API获取用户信息
    const response = await userApi.getUserById(userId.value)
    const userInfo = response
    
    console.log('获取到的用户详情:', userInfo);
    
    // 设置表单数据
    userForm.id = userInfo.id
    userForm.username = userInfo.username
    userForm.email = userInfo.email
    userForm.phone = userInfo.phone || ''
    userForm.nick_name = userInfo.nick_name || ''
    userForm.first_name = userInfo.first_name || ''
    userForm.last_name = userInfo.last_name || ''
    userForm.is_active = userInfo.is_active
    userForm.tenant_id = userInfo.tenant
    userForm.is_admin = userInfo.is_admin
    userForm.is_super_admin = userInfo.is_super_admin
    userForm.avatar = userInfo.avatar || ''  // 确保设置头像URL
    
    // 设置角色
    if (userInfo.is_super_admin) {
      userForm.role = 'super_admin'
    } else if (userInfo.is_admin) {
      userForm.role = 'admin'
    } else {
      userForm.role = 'user'
    }
    
    // 如果有租户，需要获取租户信息以显示名称
    if (userInfo.tenant && isSuperAdmin.value) {
      try {
        const tenantResponse = await tenantApi.getTenantById(userInfo.tenant)
        tenantOptions.value = [{ id: tenantResponse.id, name: tenantResponse.name }]
      } catch (error) {
        console.error('获取租户信息失败:', error)
      }
    }
    
    loading.value = false
  } catch (error) {
    console.error('获取用户信息失败:', error)
    loading.value = false
    ElMessage.error(error.response?.message || '获取用户信息失败')
  }
}

// 提交基本信息表单
const submitBasicForm = async () => {
  try {
    await userFormRef.value.validate()
    
    submitLoading.value = true
    
    // 准备基本用户数据（不含头像）
    const userData = {
      username: userForm.username,
      email: userForm.email,
      phone: userForm.phone || '',
      nick_name: userForm.nick_name || '',
      first_name: userForm.first_name || '',
      last_name: userForm.last_name || '',
      is_active: userForm.is_active
    }
    
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
    }
    
    // 调用API更新用户基本信息
    await userApi.updateUser(userId.value, userData)
    
    submitLoading.value = false
    
    ElMessage({
      type: 'success',
      message: '用户信息更新成功'
    })
    
    // 刷新数据
    getUserDetail()
  } catch (error) {
    console.error('更新用户信息失败:', error)
    // 打印完整的错误响应以便调试
    if (error.response) {
      console.error('错误响应数据:', error.response.data)
    }
    submitLoading.value = false
    ElMessage.error('更新用户信息失败：' + (error.response?.data?.message || error.response?.data || '未知错误'))
  }
}

// 重置表单
const resetForm = () => {
  userFormRef.value.resetFields()
  getUserDetail()
}

// 提交修改密码
const submitPasswordForm = async () => {
  try {
    await passwordFormRef.value.validate()
    
    passwordLoading.value = true
    
    // 调用API更新用户密码
    await userApi.changePassword(userId.value, {
      password: passwordForm.password,
      password_confirm: passwordForm.password_confirm
    })
    
    passwordLoading.value = false
    showChangePassword.value = false
    
    ElMessage({
      type: 'success',
      message: '密码修改成功'
    })
    
    // 清空密码表单
    passwordForm.password = ''
    passwordForm.password_confirm = ''
  } catch (error) {
    console.error('密码修改失败:', error)
    passwordLoading.value = false
    ElMessage.error('密码修改失败：' + (error.response?.data?.message || error.response?.data || '未知错误'))
  }
}

// 返回列表页
const goBack = () => {
  router.push('/users')
}

// 生命周期钩子
onMounted(() => {
  getUserDetail()
})

// 用户初始字母
const userInitials = computed(() => {
  const name = userForm.nick_name || userForm.username
  return name ? name.charAt(0).toUpperCase() : '?'
})

// 头像相关状态
const cropperVisible = ref(false)
const imageUrl = ref('')

// 上传头像前的校验 - 打开裁剪对话框
const beforeAvatarUpload = (file) => {
  // 定义支持的图片类型
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const isAcceptedType = acceptedTypes.includes(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isAcceptedType) {
    ElMessage.error('上传头像只能是 JPG/PNG/GIF/WEBP/BMP 格式!');
    return false;
  }
  
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!');
    return false;
  }
  
  try {
    // 创建文件URL用于裁剪
    imageUrl.value = URL.createObjectURL(file);
    
    // 打开裁剪对话框
    cropperVisible.value = true;
  } catch (error) {
    console.error('准备图片裁剪时出错:', error);
    ElMessage.error('准备图片裁剪失败，请重试');
  }
  
  // 阻止默认上传
  return false;
}

// Element Plus Upload 组件的自定义上传方法
const uploadAvatar = (options) => {
  console.log('Element Upload组件触发上传，文件信息:', options.file.name);
  uploadAvatarFile(options.file);
}

// 上传头像文件
const uploadAvatarFile = async (file) => {
  try {
    console.log('正在上传头像:', file.name, '大小:', (file.size / 1024).toFixed(2) + 'KB', '类型:', file.type);
    
    // 再次检查文件是否有效
    if (file.size === 0) {
      console.error('上传的文件大小为0，可能是空文件');
      ElMessage.error('文件大小为0，请重新裁剪');
      return;
    }
    
    // 尝试读取文件内容确认是否有效
    const reader = new FileReader();
    reader.onload = async (e) => {
      console.log('文件预览读取成功, 数据长度:', e.target.result.length);
      
      if (e.target.result.length > 100) {
        // 文件内容看起来有效，继续上传
        try {
          console.log('开始调用API上传头像...');
          // 调用API上传头像
          const result = await userApi.uploadUserAvatar(userId.value, file);
          console.log('头像上传API返回结果:', result);
          
          // 如果后端返回了头像URL，直接使用
          if (result && result.avatar) {
            console.log('使用API返回的头像URL:', result.avatar);
            userForm.avatar = result.avatar;
            console.log('设置的头像路径:', userForm.avatar);
          } else {
            console.log('API未返回头像URL，重新获取用户信息');
            // 否则重新获取用户信息
            await getUserDetail();
          }
          
          ElMessage({
            type: 'success',
            message: '头像上传成功'
          });
        } catch (error) {
          console.error('调用上传头像API失败:', error);
          console.error('错误详情:', {
            响应状态: error.response?.status,
            响应数据: error.response?.data,
            错误信息: error.message
          });
          ElMessage.error('上传头像失败: ' + (error.message || '未知错误'));
        }
      } else {
        console.error('读取的文件内容异常，数据太短:', e.target.result.length);
        ElMessage.error('裁剪后的图片内容异常，请重试');
      }
    };
    
    reader.onerror = (error) => {
      console.error('读取文件内容失败:', error);
      ElMessage.error('读取文件内容失败，请重试');
    };
    
    // 开始读取文件内容
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('上传头像失败:', error);
    console.error('错误详情:', {
      错误名称: error.name,
      错误信息: error.message,
      错误堆栈: error.stack
    });
    ElMessage.error('上传头像失败: ' + (error.message || '未知错误'));
  }
}

// 确认裁剪
const handleCropConfirm = () => {
  if (!cropperRef.value) {
    ElMessage.error('裁剪组件未加载完成，请重试');
    return;
  }
  
  try {
    // 获取裁剪后的图片数据
    cropperRef.value.getCropData((data) => {
      try {
        // 将base64转换为Blob
        const base64 = data;
        
        // 检查base64数据格式是否正确
        if (!base64.startsWith('data:image')) {
          ElMessage.error('裁剪图片数据格式异常，请重试');
          return;
        }
        
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], {type: mimeString});
        console.log('创建的Blob信息:', {
          大小: (blob.size / 1024).toFixed(2) + 'KB',
          类型: blob.type
        });
        
        const file = new File([blob], "cropped-avatar.jpg", {type: "image/jpeg"});
        console.log('创建的File信息:', {
          名称: file.name,
          大小: (file.size / 1024).toFixed(2) + 'KB',
          类型: file.type
        });
        
        // 上传裁剪后的文件
        console.log('开始上传裁剪后的文件...');
        uploadAvatarFile(file);
        cropperVisible.value = false;
      } catch (error) {
        console.error('处理裁剪图片数据时出错:', error);
        console.error('错误详情:', {
          错误名称: error.name,
          错误信息: error.message,
          错误堆栈: error.stack
        });
        ElMessage.error('处理裁剪图片数据失败，请重试');
      }
    });
  } catch (error) {
    console.error('裁剪图片时出错:', error);
    console.error('错误详情:', {
      错误名称: error.name,
      错误信息: error.message,
      错误堆栈: error.stack
    });
    ElMessage.error('裁剪图片失败，请重试');
  }
}

// 取消裁剪
const handleCropCancel = () => {
  cropperVisible.value = false;
  imageUrl.value = '';
}
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

/* 头像上传样式 */
.avatar-uploader {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.avatar-wrapper:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.avatar-wrapper:hover .avatar-uploader-text {
  opacity: 1;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 500;
  color: #95a5a6;
  background-color: #ecf0f1;
}

.avatar-uploader-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  line-height: 36px;
  font-size: 12px;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

/* 裁剪组件容器 */
.cropper-container {
  height: 400px;
}
</style>
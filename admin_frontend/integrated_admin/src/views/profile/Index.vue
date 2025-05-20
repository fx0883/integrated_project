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
                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
              >
                <div class="avatar-wrapper">
                  <img v-if="basicForm.avatar" :src="avatarUrl" class="avatar-image" />
                  <div v-else class="avatar-placeholder">{{ userInitials }}</div>
                  <div class="avatar-uploader-text">点击上传</div>
                </div>
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../../stores'
import { userApi } from '../../api'
import { ElMessage } from 'element-plus'
import config from '../../config'

// 导入vue-cropper
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'

console.log('VueCropper导入状态:', !!VueCropper);

// 认证状态
const authStore = useAuthStore()

// 当前激活的标签页
const activeTab = ref('basic')

// 表单引用
const basicFormRef = ref(null)
const passwordFormRef = ref(null)
const cropperRef = ref(null)  // 裁剪组件引用

// 加载状态
const basicLoading = ref(false)
const passwordLoading = ref(false)

// 用户初始字母
const userInitials = computed(() => {
  const name = basicForm.real_name || basicForm.username
  return name ? name.charAt(0).toUpperCase() : '?'
})

// 头像URL计算属性，添加baseUrl
const avatarUrl = computed(() => {
  return basicForm.avatar;
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

// 添加裁剪相关的状态
const cropperVisible = ref(false)
const imageUrl = ref('')

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
      
      console.log('设置的头像路径:', basicForm.avatar)
      
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

// 上传头像前的校验 - 修改为打开裁剪对话框
const beforeAvatarUpload = (file) => {
  // 定义支持的图片类型
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const isAcceptedType = acceptedTypes.includes(file.type);
  const isLt2M = file.size / 1024 / 1024 < 2;

  console.log('上传的文件信息:', {
    名称: file.name,
    类型: file.type,
    大小: (file.size / 1024 / 1024).toFixed(2) + 'MB',
    是否支持类型: isAcceptedType,
    是否小于2MB: isLt2M
  });

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
    console.log('创建的图片URL:', imageUrl.value);
    
    // 测试图片是否可以正常加载
    const testImg = new Image();
    testImg.onload = () => {
      console.log('测试图片加载成功，尺寸:', testImg.width, 'x', testImg.height);
    };
    testImg.onerror = (err) => {
      console.error('测试图片加载失败:', err);
    };
    testImg.src = imageUrl.value;
    
    // 打开裁剪对话框
    cropperVisible.value = true;
    
    // 延迟检查裁剪组件是否正确初始化
    setTimeout(() => {
      console.log('cropperRef是否存在:', !!cropperRef.value);
      
      if (cropperRef.value) {
        console.log('裁剪组件初始化成功');
        console.log('裁剪组件方法:', Object.keys(cropperRef.value));
      } else {
        console.error('裁剪组件未初始化成功');
        ElMessage.warning('裁剪组件加载异常，请刷新页面重试');
      }
    }, 500);
    
    console.log('头像裁剪对话框已打开，图片URL:', imageUrl.value);
  } catch (error) {
    console.error('准备图片裁剪时出错:', error);
    ElMessage.error('准备图片裁剪失败，请重试');
  }
  
  // 阻止默认上传
  return false;
}

// 确认裁剪
const handleCropConfirm = () => {
  console.log('开始确认裁剪...');
  
  if (!cropperRef.value) {
    console.error('裁剪组件引用不存在');
    ElMessage.error('裁剪组件未加载完成，请重试');
    return;
  }
  
  console.log('裁剪组件当前状态:', cropperRef.value);
  
  try {
    // 获取裁剪后的图片数据
    console.log('调用getCropData方法获取裁剪数据...');
    
    cropperRef.value.getCropData((data) => {
      console.log('获取到裁剪后的图片数据，数据长度:', data ? data.length : 0);
      console.log('裁剪数据前缀:', data ? data.substring(0, 50) + '...' : '无数据');
      
      if (!data || data.length < 100) {
        console.error('裁剪数据异常，数据过短或为空');
        ElMessage.error('裁剪图片失败，请重试');
        return;
      }
      
      try {
        // 将base64转换为Blob
        const base64 = data;
        console.log('base64数据类型:', typeof base64);
        
        // 检查base64数据格式是否正确
        if (!base64.startsWith('data:image')) {
          console.error('裁剪数据格式异常，不是有效的base64图像数据:', base64.substring(0, 50));
          ElMessage.error('裁剪图片数据格式异常，请重试');
          return;
        }
        
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        console.log('解析的MIME类型:', mimeString);
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        console.log('转换后的ArrayBuffer长度:', ab.byteLength);
        
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
  console.log('取消裁剪操作');
  cropperVisible.value = false;
  imageUrl.value = '';
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
          const result = await userApi.uploadAvatar(file);
          console.log('头像上传API返回结果:', result);
          
          // 如果后端返回了头像URL，直接使用，确保加上baseUrl
          if (result && result.avatar) {
            console.log('使用API返回的头像URL:', result.avatar);
            basicForm.avatar = result.avatar;
            console.log('设置的头像路径:', basicForm.avatar);
          } else {
            console.log('API未返回头像URL，重新获取用户信息');
            // 否则重新获取用户信息
            await getUserInfo();
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

// 原来的uploadAvatar方法改为http请求处理
const uploadAvatar = (options) => {
  console.log('Element Upload组件触发上传，文件信息:', options.file.name);
  uploadAvatarFile(options.file);
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
    
    // 检查vue-cropper组件是否正常初始化
    console.log('检查裁剪组件是否可用');
    setTimeout(() => {
      try {
        // 尝试初始化一个临时的vue-cropper来测试是否正常工作
        const testModule = import('vue-cropper');
        console.log('裁剪组件导入测试:', testModule ? '成功' : '失败');
      } catch (error) {
        console.error('裁剪组件导入测试失败:', error);
      }
    }, 1000);
    
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

.avatar-wrapper {
  display: inline-block;
  text-align: center;
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #eee;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background-color: #f0f2f5;
  color: #909399;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  font-weight: bold;
}

.avatar-uploader-text {
  margin-top: 10px;
  color: #409EFF;
}

.cropper-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 400px;
}

.cropper-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.el-tabs {
  margin-top: 10px;
}
</style> 
<template>
  <div class="view-user-container">
    <div class="page-header">
      <h1 class="page-title">用户详情</h1>
      <div class="page-actions">
        <router-link :to="`/users/edit/${userId}`" class="action-link">
          <el-button type="primary" class="btn-primary">
            <el-icon><Edit /></el-icon>编辑用户
          </el-button>
        </router-link>
        <el-button @click="goBack" class="btn-secondary">
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>
    
    <div class="content-container" v-loading="loading">
      <!-- 用户信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><User /></el-icon>
            <span>基本信息</span>
          </div>
        </template>
        
        <div class="user-profile">
          <div class="user-avatar" :style="{backgroundColor: getAvatarColor(userInfo.username || '')}">
            {{ getUserInitials(userInfo.real_name || userInfo.username || '') }}
          </div>
          <div class="user-info">
            <h2 class="user-name">{{ userInfo.real_name || userInfo.username }}</h2>
            <div class="user-role">
              <el-tag 
                v-if="userInfo.is_super_admin" 
                type="danger" 
                class="role-tag"
                effect="dark"
              >超级管理员</el-tag>
              <el-tag 
                v-else-if="userInfo.is_admin" 
                type="warning"
                class="role-tag"
                effect="dark"
              >管理员</el-tag>
              <el-tag 
                v-else 
                type="info"
                class="role-tag"
                effect="plain"
              >普通用户</el-tag>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="info-section">
          <div class="info-row">
            <div class="info-label">用户名</div>
            <div class="info-value">{{ userInfo.username }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">邮箱</div>
            <div class="info-value">{{ userInfo.email }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">手机号</div>
            <div class="info-value">{{ userInfo.phone }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">状态</div>
            <div class="info-value">
              <div class="status-indicator">
                <span 
                  class="status-dot" 
                  :class="userInfo.status === 'active' ? 'status-active' : 'status-inactive'"
                ></span>
                <span>{{ userInfo.status === 'active' ? '已激活' : '已禁用' }}</span>
              </div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ userInfo.created_at }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">最后登录</div>
            <div class="info-value">{{ userInfo.last_login_at || '从未登录' }}</div>
          </div>
        </div>
      </el-card>
      
      <!-- 安全选项卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><Lock /></el-icon>
            <span>安全信息</span>
          </div>
        </template>
        
        <div class="security-option">
          <div class="security-content">
            <div class="security-title">双因素认证</div>
            <div class="security-desc">
              {{ userInfo.twoFactorEnabled ? '已启用双因素认证' : '未启用双因素认证' }}
            </div>
          </div>
          <el-tag :type="userInfo.twoFactorEnabled ? 'success' : 'info'">
            {{ userInfo.twoFactorEnabled ? '已启用' : '未启用' }}
          </el-tag>
        </div>
        
        <div class="security-option">
          <div class="security-content">
            <div class="security-title">登录历史</div>
            <div class="security-desc">查看用户最近的登录记录</div>
          </div>
          <router-link :to="`/users/login-history/${userId}`">
            <el-button type="primary" text>查看记录</el-button>
          </router-link>
        </div>
      </el-card>
      
      <!-- 权限信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><Key /></el-icon>
            <span>权限信息</span>
          </div>
        </template>
        
        <div class="permissions-section">
          <div class="permissions-row" v-for="(value, key) in userInfo.permissions" :key="key">
            <div class="permission-name">{{ formatPermissionName(key) }}</div>
            <el-tag 
              :type="value ? 'success' : 'info'" 
              class="permission-tag"
              :effect="value ? 'light' : 'plain'"
            >
              {{ value ? '允许' : '禁止' }}
            </el-tag>
          </div>
          
          <div class="empty-permissions" v-if="!userInfo.permissions || Object.keys(userInfo.permissions).length === 0">
            <el-empty description="无权限数据" />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi } from '../../api'
import { ElMessage } from 'element-plus'
import { User, Lock, Edit, Back, Key } from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const route = useRoute()
const userId = route.params.id

// 加载状态
const loading = ref(false)

// 用户信息
const userInfo = reactive({
  id: '',
  username: '',
  email: '',
  phone: '',
  real_name: '',
  is_admin: false,
  is_super_admin: false,
  status: 'active',
  created_at: '',
  last_login_at: '',
  twoFactorEnabled: false,
  permissions: {
    can_view_users: true,
    can_create_users: false,
    can_edit_users: false,
    can_delete_users: false,
    can_view_tenants: true,
    can_manage_tenants: false
  }
})

// 获取用户头像颜色（基于用户名生成一致的颜色）
const getAvatarColor = (username) => {
  const colors = [
    '#0abab5', // 蒂芙尼绿
    '#ff6600', // 爱马仕橙
    '#4CAF50', // 绿色
    '#FF9800', // 橙色
    '#9C27B0', // 紫色
    '#3F51B5', // 靛蓝
    '#E91E63'  // 粉色
  ]
  
  const hash = username.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  return colors[hash % colors.length]
}

// 获取用户名首字母
const getUserInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// 格式化权限名称
const formatPermissionName = (key) => {
  const map = {
    can_view_users: '查看用户',
    can_create_users: '创建用户',
    can_edit_users: '编辑用户',
    can_delete_users: '删除用户',
    can_view_tenants: '查看租户',
    can_manage_tenants: '管理租户'
  }
  
  return map[key] || key
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    loading.value = true
    console.log('获取用户信息, ID:', userId)
    
    // 实际项目中应该调用API获取用户信息
    // const response = await userApi.getUserById(userId)
    
    // 模拟数据
    setTimeout(() => {
      const response = {
        id: userId,
        username: userId === '1' ? 'admin' : 'test',
        email: userId === '1' ? 'admin@example.com' : 'test@example.com',
        phone: userId === '1' ? '13800138000' : '13800138001',
        real_name: userId === '1' ? '管理员' : '测试用户',
        is_super_admin: userId === '1',
        is_admin: userId === '1',
        status: 'active',
        created_at: '2023-01-01 12:00:00',
        last_login_at: '2023-06-15 08:30:45',
        twoFactorEnabled: userId === '1',
        permissions: {
          can_view_users: true,
          can_create_users: userId === '1',
          can_edit_users: userId === '1',
          can_delete_users: userId === '1',
          can_view_tenants: true,
          can_manage_tenants: userId === '1'
        }
      }
      
      // 更新用户信息
      Object.assign(userInfo, response)
      
      loading.value = false
      console.log('用户信息加载完成')
    }, 500)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    loading.value = false
    ElMessage.error('获取用户信息失败')
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
.view-user-container {
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

.action-link {
  text-decoration: none;
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

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 0;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 24px;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.role-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 10px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 15px;
  color: #333;
  font-weight: 500;
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

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-active {
  background-color: #4CAF50;
}

.status-inactive {
  background-color: #9E9E9E;
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

.permissions-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.permissions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #E8ECF4;
}

.permissions-row:last-child {
  border-bottom: none;
}

.permission-name {
  font-size: 14px;
  color: #333;
}

.permission-tag {
  min-width: 60px;
  text-align: center;
}

.empty-permissions {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .info-section {
    grid-template-columns: 1fr;
  }
}
</style> 
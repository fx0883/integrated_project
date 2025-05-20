<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
      <!-- Logo -->
      <div class="logo-container">
        <div class="logo">
          <img src="../../assets/vue.svg" alt="Logo" class="logo-img" v-if="!isCollapsed" />
          <img src="../../assets/vue.svg" alt="Logo" class="logo-small" v-else />
          <h1 class="logo-text" v-if="!isCollapsed">集成系统</h1>
        </div>
      </div>
      
      <!-- 菜单 -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        :collapse-transition="false"
      >
        <!-- 仪表盘菜单项 -->
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        
        <!-- 用户管理菜单 -->
        <el-sub-menu index="/users" v-if="hasPermission(['admin', 'super_admin'])">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/users/list">用户列表</el-menu-item>
          <el-menu-item index="/users/create">创建用户</el-menu-item>
        </el-sub-menu>
        
        <!-- 租户管理菜单 -->
        <el-sub-menu index="tenants" v-if="hasPermission(['super_admin'])">
          <template #title>
            <el-icon><OfficeBuilding /></el-icon>
            <span>租户管理</span>
          </template>
          <el-menu-item index="/tenants">租户列表</el-menu-item>
          <el-menu-item index="/tenants/create">创建租户</el-menu-item>
        </el-sub-menu>
        
        <!-- 个人设置菜单项 -->
        <el-menu-item index="/profile">
          <el-icon><Setting /></el-icon>
          <template #title>个人设置</template>
        </el-menu-item>
      </el-menu>
      
      <!-- 折叠按钮 -->
      <div class="sidebar-collapse" @click="toggleCollapse">
        <el-icon v-if="isCollapsed"><Expand /></el-icon>
        <el-icon v-else><Fold /></el-icon>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 头部 -->
      <div class="header">
        <div class="left">
          <!-- 面包屑导航 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="right">
          <!-- 用户信息 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="avatarUrl">{{ userInitials }}</el-avatar>
              <span class="username">{{ userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人资料
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 内容 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores'
import { 
  Odometer, User, Setting, SwitchButton,
  Fold, Expand, ArrowDown, OfficeBuilding 
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

// 获取路由和认证信息
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 侧边栏折叠状态
const isCollapsed = ref(localStorage.getItem('sidebarStatus') === '1')

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarStatus', isCollapsed.value ? '1' : '0')
}

// 当前激活的菜单项
const activeMenu = computed(() => {
  return route.path
})

// 面包屑导航
const breadcrumbs = ref([])

// 根据路由更新面包屑
const updateBreadcrumbs = () => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  
  breadcrumbs.value = matched.map(item => {
    return {
      title: item.meta.title,
      path: item.path
    }
  })
}

// 监听路由变化，更新面包屑
watch(() => route.path, updateBreadcrumbs, { immediate: true })

// 用户信息
const userName = computed(() => {
  return authStore.user?.username || '用户'
})

// 计算属性
const avatarUrl = computed(() => {
  return authStore.user?.avatar || ''
})

const userInitials = computed(() => {
  const name = authStore.user?.real_name || authStore.user?.username || ''
  return name.substring(0, 1).toUpperCase()
})

// 检查权限
const hasPermission = (roles) => {
  const userRole = authStore.userRole
  return roles.includes(userRole)
}

// 下拉菜单命令处理
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      authStore.logout()
    }).catch(() => {})
  } else if (command === 'profile') {
    router.push('/profile')
  }
}

// 初始化
onMounted(() => {
  updateBreadcrumbs()
  
  // 在小屏幕上自动折叠菜单
  const handleResize = () => {
    if (window.innerWidth < 768) {
      isCollapsed.value = true
      localStorage.setItem('sidebarStatus', '1')
    }
  }
  
  window.addEventListener('resize', handleResize)
  handleResize()
  
  // 清理
  return () => {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
}

/* 侧边栏样式 */
.sidebar {
  width: 210px;
  background-color: #304156;
  height: 100%;
  transition: width 0.3s;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 64px;
}

.logo-container {
  height: 60px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #273246;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 30px;
  margin-right: 10px;
}

.logo-small {
  height: 30px;
}

.logo-text {
  font-size: 18px;
  color: #ffffff;
  font-weight: 600;
  margin: 0;
}

.sidebar-collapse {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #273246;
  color: #bfcbd9;
}

.sidebar-collapse:hover {
  background-color: #1f2d3d;
}

/* 主容器样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
  font-size: 14px;
}

.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 覆盖Element UI样式 */
:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu--collapse) {
  width: 64px;
}
</style> 
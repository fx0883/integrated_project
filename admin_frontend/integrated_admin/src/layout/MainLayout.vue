<template>
  <div class="main-layout">
    <!-- 头部导航组件 -->
    <AppHeader 
      :notification-count="unreadNotificationCount"
      :user-name="userName"
      :user-avatar="userAvatar"
      :user-initials="userInitials"
      @show-notifications="showNotifications = true"
      @logout="handleLogout"
      @toggle-sidebar="toggleSidebar"
      @search="handleSearch"
    />
    
    <div class="main-container">
      <!-- 侧边栏组件 -->
      <AppSidebar 
        :is-collapsed="isCollapsed"
        :active-menu="activeMenu"
        :menu-items="filteredMenuItems"
        @toggle-collapse="toggleSidebar"
      />
      
      <!-- 内容区域 -->
      <div class="main-content" :class="{ 'content-expanded': isCollapsed }">
        <!-- 面包屑导航组件 -->
        <AppBreadcrumb :items="breadcrumbItems" />
        
        <!-- 主要内容 -->
        <div class="page-content">
          <!-- 调试信息 -->
          <div v-if="isDebug" class="debug-info">
            <p>当前路径: {{ $route.path }}</p>
            <p>路由名称: {{ $route.name }}</p>
            <p>路由组件: {{ $route.matched.map(m => m.name).join(' > ') }}</p>
          </div>
          
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </div>
        
        <!-- 页脚组件 -->
        <AppFooter />
      </div>
    </div>
    
    <!-- 通知抽屉组件 -->
    <AppNotificationDrawer 
      v-model="showNotifications"
      :notifications="notifications"
      @mark-all-read="markAllNotificationsAsRead"
      @mark-read="markNotificationAsRead"
    />
    
    <!-- 搜索结果对话框 -->
    <el-dialog
      v-model="showSearchResults"
      title="搜索结果"
      width="70%"
      destroy-on-close
    >
      <div v-if="searchResults.length === 0" class="search-empty">
        <el-empty description="未找到相关结果" />
      </div>
      <div v-else class="search-results">
        <div v-for="(group, category) in groupedSearchResults" :key="category" class="search-group">
          <h3 class="search-category">{{ formatCategory(category) }}</h3>
          <div class="search-items">
            <div v-for="item in group" :key="item.id" class="search-item" @click="navigateToResult(item)">
              <div class="search-item-icon" :class="getSearchIconClass(category)">
                <el-icon><component :is="getSearchIcon(category)" /></el-icon>
              </div>
              <div class="search-item-content">
                <div class="search-item-title">{{ item.title }}</div>
                <div class="search-item-desc">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores'
import { 
  User, Setting, InfoFilled, OfficeBuilding, Odometer, List, 
  Plus, Document, Message, Bell, Search, Calendar, Collection, 
  PieChart, Reading, Folder, ChatDotRound, DataAnalysis, Menu
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

// 导入公共组件
import AppHeader from '../components/layout/common/Header.vue'
import AppSidebar from '../components/layout/common/Sidebar.vue'
import AppBreadcrumb from '../components/layout/common/Breadcrumb.vue'
import AppNotificationDrawer from '../components/layout/common/NotificationDrawer.vue'
import AppFooter from '../components/layout/common/Footer.vue'

// 路由相关
const router = useRouter()
const route = useRoute()

// 认证信息
const authStore = useAuthStore()

// 调试标志
const isDebug = ref(true) // 设置为true以显示调试信息

// 搜索
const searchKeyword = ref('')
const showSearchResults = ref(false)
const searchResults = ref([])

// 用户信息
const userName = computed(() => {
  return authStore.user?.username || '未登录'
})

const userAvatar = computed(() => {
  return authStore.user?.avatar || ''
})

const userInitials = computed(() => {
  const name = authStore.user?.real_name || authStore.user?.username || ''
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
})

// 侧边栏相关
const isCollapsed = ref(localStorage.getItem('sidebarStatus') === '1')
const activeMenu = computed(() => {
  // 处理子路由，确保父菜单项也能匹配上
  const { path } = route
  console.log('[Layout] 当前路径:', path)
  
  if (path.includes('/users/')) {
    if (path.includes('/users/create')) {
      return '/users/create'
    }
    return '/users'
  }
  
  if (path.includes('/tenants/')) {
    if (path.includes('/tenants/create')) {
      return '/tenants/create'
    }
    return '/tenants'
  }
  
  // 处理打卡管理路径
  if (path.includes('/check/')) {
    if (path.includes('/check/categories')) {
      console.log('[Layout] 匹配到打卡类型管理页面')
      return '/check/categories'
    }
    if (path.includes('/check/tasks')) {
      return '/check/tasks'
    }
    if (path.includes('/check/records')) {
      return '/check/records'
    }
    if (path.includes('/check/statistics')) {
      return '/check/statistics'
    }
    return '/check'
  }
  
  return path
})

// 缓存的视图
const cachedViews = ref(['Dashboard'])

// 菜单项配置
const menuItems = computed(() => {
  const items = [
    {
      title: '仪表盘',
      path: '/dashboard',
      icon: 'Odometer'
    },
    {
      title: 'CMS管理',
      path: '/cms',  // 这个路径实际不存在，只用于菜单分组
      icon: 'Reading',
      children: [
        {
          title: '文章管理',
          path: '/cms/articles',
          icon: 'Document'
        },
        {
          title: '分类管理',
          path: '/cms/categories',
          icon: 'Folder'
        },
        {
          title: '标签管理',
          path: '/cms/tags',
          icon: 'Collection'
        },
        {
          title: '评论管理',
          path: '/cms/comments',
          icon: 'ChatDotRound'
        },
        {
          title: '内容统计',
          path: '/cms/statistics',
          icon: 'DataAnalysis'
        }
      ]
    },
    {
      title: '打卡管理',
      path: '/check',  // 这个路径实际不存在，只用于菜单分组
      icon: 'Calendar',
      children: [
        {
          title: '类型管理',
          path: '/check/categories',  // 直接链接到类型管理页面
          icon: 'Collection'
        },
        {
          title: '任务管理',
          path: '/check/tasks',
          icon: 'List'
        },
        {
          title: '打卡记录',
          path: '/check/records',
          icon: 'Document'
        },
        {
          title: '统计分析',
          path: '/check/statistics',
          icon: 'PieChart'
        }
      ]
    },
    {
      title: '用户管理',
      path: '/users',
      icon: 'User',
      children: [
        {
          title: '用户列表',
          path: '/users',
          icon: 'List'
        },
        {
          title: '创建用户',
          path: '/users/create',
          icon: 'Plus'
        }
      ]
    },
    {
      title: '个人设置',
      path: '/profile',
      icon: 'Setting'
    },
    {
      title: '关于系统',
      path: '/about',
      icon: 'InfoFilled'
    }
  ]
  
  // 仅对超级管理员显示租户菜单
  if (authStore.isSuperAdmin) {
    items.splice(2, 0, {
      title: '租户管理',
      path: '/tenants',
      icon: 'OfficeBuilding',
      children: [
        {
          title: '租户列表',
          path: '/tenants',
          icon: 'List'
        },
        {
          title: '创建租户',
          path: '/tenants/create',
          icon: 'Plus'
        }
      ]
    })
    
    // 添加菜单管理项，仅超级管理员可见
    items.splice(3, 0, {
      title: '菜单管理',
      path: '/menus',
      icon: 'Menu'
    })
  }
  
  return items
})

// 根据用户权限过滤菜单项
const filteredMenuItems = computed(() => {
  // 需求1: 超级管理员登录时，菜单只显示用户管理、租户管理和菜单管理
  if (authStore.isSuperAdmin) {
    return menuItems.value.filter(item => 
      item.path === '/users' || item.path === '/tenants' || item.path === '/menus' || item.path === '/dashboard' || item.path === '/profile'
    )
  }
  
  // 需求2: 租户管理员登录时，菜单不显示租户管理，其他菜单全部显示
  return menuItems.value.filter(item => item.path !== '/tenants')
})

// 面包屑导航项
const breadcrumbItems = ref([])

// 更新面包屑导航
const updateBreadcrumb = () => {
  const { path } = route
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  
  const breadcrumbs = []
  
  // 默认添加首页
  breadcrumbs.push({
    title: '首页',
    path: '/dashboard'
  })
  
  // 添加匹配到的路由
  matched.forEach(item => {
    // 检查是否有父级标题
    if (item.meta.parentTitle) {
      // 检查是否已经添加了父级标题
      const parentExists = breadcrumbs.some(bc => bc.title === item.meta.parentTitle)
      if (!parentExists) {
        // 添加父级面包屑（使用路径前缀）
        const parentPath = item.path.substring(0, item.path.lastIndexOf('/'))
        breadcrumbs.push({
          title: item.meta.parentTitle,
          path: parentPath
        })
        console.log('[Layout] 添加父级面包屑:', item.meta.parentTitle, parentPath)
      }
    }
    
    // 判断是否为编辑页面
    if (item.path.includes(':id') && route.params.id) {
      // 构建实际路径
      const actualPath = item.path.replace(':id', route.params.id)
      
      breadcrumbs.push({
        title: item.meta.title,
        path: actualPath
      })
    } else {
      breadcrumbs.push({
        title: item.meta.title,
        path: item.path
      })
    }
  })
  
  console.log('[Layout] 更新面包屑:', breadcrumbs)
  breadcrumbItems.value = breadcrumbs
}

// 监听路由变化，更新面包屑
watch(() => route.path, updateBreadcrumb, { immediate: true })
watch(() => route.params, updateBreadcrumb, { deep: true })

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarStatus', isCollapsed.value ? '1' : '0')
}

// 通知相关
const showNotifications = ref(false)
const notifications = ref([
  {
    id: 1,
    title: '系统通知',
    content: '您的账户已成功激活',
    time: '2023-06-10 10:30:00',
    read: false,
    type: 'system'
  },
  {
    id: 2,
    title: '操作提醒',
    content: '您创建了一个新租户',
    time: '2023-06-09 14:20:00',
    read: true,
    type: 'operation'
  },
  {
    id: 3,
    title: '安全提醒',
    content: '检测到异常登录行为',
    time: '2023-06-08 09:15:00',
    read: false,
    type: 'security'
  }
])

const unreadNotificationCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// 标记所有通知为已读
const markAllNotificationsAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

// 标记单个通知为已读
const markNotificationAsRead = (id) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

// 处理登出事件
const handleLogout = () => {
  authStore.logout()
    .then(() => {
      router.push('/login')
    })
    .catch(error => {
      console.error('登出出错:', error)
      // 即使发生错误，也尝试清除本地凭证并重定向到登录页
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      router.push('/login')
    })
}

// 处理搜索
const handleSearch = (keyword) => {
  console.log('搜索关键词:', keyword)
  
  // 模拟搜索结果
  searchResults.value = [
    {
      id: 1,
      title: '用户管理',
      description: '用户列表页面',
      type: 'page',
      path: '/users'
    },
    {
      id: 2,
      title: '测试租户',
      description: '租户ID: #2',
      type: 'tenant',
      path: '/tenants/edit/2'
    },
    {
      id: 3,
      title: '管理员',
      description: '用户名: admin',
      type: 'user',
      path: '/users/view/1'
    }
  ]
  
  showSearchResults.value = true
}

// 搜索结果分组
const groupedSearchResults = computed(() => {
  const groups = {}
  
  searchResults.value.forEach(item => {
    if (!groups[item.type]) {
      groups[item.type] = []
    }
    groups[item.type].push(item)
  })
  
  return groups
})

// 格式化分类名称
const formatCategory = (category) => {
  const categoryMap = {
    page: '页面',
    user: '用户',
    tenant: '租户',
    document: '文档',
    setting: '设置'
  }
  
  return categoryMap[category] || category
}

// 获取搜索图标
const getSearchIcon = (category) => {
  const iconMap = {
    page: 'Document',
    user: 'User',
    tenant: 'OfficeBuilding',
    document: 'Document',
    setting: 'Setting',
    calendar: 'Calendar',
    collection: 'Collection',
    pieChart: 'PieChart',
    reading: 'Reading',
    folder: 'Folder',
    chatDotRound: 'ChatDotRound',
    dataAnalysis: 'DataAnalysis',
    menu: 'Menu'
  }
  
  return iconMap[category] || 'Document'
}

// 获取搜索图标样式类
const getSearchIconClass = (category) => {
  const classMap = {
    page: 'icon-blue',
    user: 'icon-green',
    tenant: 'icon-orange',
    document: 'icon-purple',
    setting: 'icon-gray',
    calendar: 'icon-pink',
    collection: 'icon-teal',
    pieChart: 'icon-yellow',
    reading: 'icon-blue',
    folder: 'icon-teal',
    chatDotRound: 'icon-teal',
    dataAnalysis: 'icon-teal',
    menu: 'icon-teal'
  }
  
  return classMap[category] || 'icon-blue'
}

// 导航到搜索结果
const navigateToResult = (item) => {
  if (item.path) {
    router.push(item.path)
    showSearchResults.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  updateBreadcrumb()
  
  // 从localStorage获取侧边栏状态
  const savedSidebarStatus = localStorage.getItem('sidebarStatus')
  if (savedSidebarStatus !== null) {
    isCollapsed.value = savedSidebarStatus === '1'
  }
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: #f7f9fc;
}

.main-container {
  display: flex;
  min-height: calc(100vh - 70px);
  padding-top: 70px; /* 顶部导航栏高度 */
}

.main-content {
  flex: 1;
  margin-left: 260px; /* 侧边栏宽度 */
  padding: 25px;
  transition: all 0.3s ease;
}

.content-expanded {
  margin-left: 64px; /* 折叠后的侧边栏宽度 */
}

.page-content {
  min-height: calc(100vh - 180px); /* 减去头部、面包屑、页脚高度 */
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 搜索结果样式 */
.search-empty {
  padding: 40px 0;
  text-align: center;
}

.search-group {
  margin-bottom: 20px;
}

.search-category {
  font-size: 14px;
  color: var(--secondary-color);
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border-color);
}

.search-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}

.search-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.search-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
}

.icon-blue {
  background-color: var(--info-color);
}

.icon-green {
  background-color: var(--success-color);
}

.icon-orange {
  background-color: var(--accent-color);
}

.icon-purple {
  background-color: #9c27b0;
}

.icon-gray {
  background-color: var(--secondary-color);
}

.search-item-content {
  flex: 1;
}

.search-item-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.search-item-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 响应式样式 */
@media (max-width: 992px) {
  .main-content {
    margin-left: 0;
    padding: 20px;
  }
  
  .content-expanded {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }
  
  .search-items {
    grid-template-columns: 1fr;
  }
}
</style>
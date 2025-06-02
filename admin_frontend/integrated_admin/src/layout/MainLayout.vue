<template>
  <div class="main-layout" :class="{ 'dark-mode': settingsStore.isDarkMode }">
    <!-- 头部导航组件 -->
    <AppHeader 
      :notification-count="unreadNotificationCount"
      :user-name="userName"
      :user-avatar="userAvatar"
      :user-initials="userInitials"
      @show-notifications="showNotifications = true"
      @logout="handleLogout"
      @toggle-sidebar="settingsStore.toggleSidebar"
      @toggle-dark-mode="settingsStore.toggleDarkMode"
      @search="handleSearch"
    />
    
    <div class="main-container">
      <!-- 侧边栏组件 -->
      <AppSidebar 
        :is-collapsed="settingsStore.isSidebarCollapsed"
        :active-menu="activeMenu"
        :menu-items="filteredMenuItems"
        @toggle-collapse="settingsStore.toggleSidebar"
      />
      
      <!-- 内容区域 -->
      <div class="main-content" :class="{ 'content-expanded': settingsStore.isSidebarCollapsed }">
        <!-- 标签页视图 -->
        <TagsView ref="tagsViewRef" />
        
        <!-- 面包屑导航组件 -->
        <AppBreadcrumb v-if="settingsStore.layout.showBreadcrumb" :items="breadcrumbItems" />
        
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
        <AppFooter v-if="settingsStore.layout.showFooter" />
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
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useSettingsStore } from '../stores'
import { 
  User, Setting, InfoFilled, OfficeBuilding, Odometer, List, 
  Plus, Document, Message, Bell, Search, Calendar, Collection, 
  PieChart, Reading, Folder, ChatDotRound, DataAnalysis, Menu, Notebook
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

// 导入公共组件
import AppHeader from '../components/layout/common/Header.vue'
import AppSidebar from '../components/layout/common/Sidebar.vue'
import AppBreadcrumb from '../components/layout/common/Breadcrumb.vue'
import AppNotificationDrawer from '../components/layout/common/NotificationDrawer.vue'
import AppFooter from '../components/layout/common/Footer.vue'
import TagsView from '../components/layout/common/TagsView.vue'

// 路由相关
const router = useRouter()
const route = useRoute()

// store
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// 标签页视图引用
const tagsViewRef = ref(null)

// 调试标志
const isDebug = ref(false) // 设置为false以隐藏调试信息

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

// 活动菜单
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
const cachedViews = computed(() => {
  return tagsViewRef.value?.cachedViews || []
})

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
          title: '新增用户',
          path: '/users/create',
          icon: 'Plus'
        }
      ]
    },
    {
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
          title: '新增租户',
          path: '/tenants/create',
          icon: 'Plus'
        }
      ]
    },
    {
      title: '打卡管理',
      path: '/check',
      icon: 'Calendar',
      children: [
        {
          title: '打卡类型',
          path: '/check/categories',
          icon: 'Collection'
        },
        {
          title: '打卡任务',
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
          icon: 'DataAnalysis'
        }
      ]
    },
    {
      title: '组件示例',
      path: '/examples/pure',
      icon: 'Notebook'
    },
    {
      title: '系统设置',
      path: '/settings',
      icon: 'Setting'
    }
  ]
  
  return items
})

// 根据用户角色过滤菜单项
const filteredMenuItems = computed(() => {
  // 如果是超级管理员，只显示仪表盘、用户管理、租户管理
  if (authStore.user?.is_super_admin) {
    return menuItems.value.filter(item => {
      return ['仪表盘', '用户管理', '租户管理', '系统设置'].includes(item.title)
    })
  }
  
  // 如果是租户管理员，显示除了租户管理之外的所有菜单
  if (authStore.user?.is_admin && !authStore.user?.is_super_admin) {
    return menuItems.value.filter(item => item.title !== '租户管理')
  }
  
  // 其他用户显示所有菜单
  return menuItems.value
})

// 面包屑导航
const breadcrumbItems = computed(() => {
  const items = []
  
  // 添加首页
  items.push({
    title: '首页',
    path: '/'
  })
  
  // 根据当前路由生成面包屑
  const { path, matched } = route
  
  if (path === '/') {
    return items
  }
  
  // 处理特殊路径
  if (path.includes('/users/')) {
    items.push({
      title: '用户管理',
      path: '/users'
    })
    
    if (path.includes('/users/create')) {
      items.push({
        title: '新增用户',
        path: '/users/create'
      })
    } else if (path.includes('/users/edit/')) {
      items.push({
        title: '编辑用户',
        path: path
      })
    } else if (path.includes('/users/view/')) {
      items.push({
        title: '用户详情',
        path: path
      })
    }
    
    return items
  }
  
  if (path.includes('/tenants/')) {
    items.push({
      title: '租户管理',
      path: '/tenants'
    })
    
    if (path.includes('/tenants/create')) {
      items.push({
        title: '新增租户',
        path: '/tenants/create'
      })
    } else if (path.includes('/tenants/edit/')) {
      items.push({
        title: '编辑租户',
        path: path
      })
    } else if (path.includes('/tenants/view/')) {
      items.push({
        title: '租户详情',
        path: path
      })
    }
    
    return items
  }
  
  // 处理CMS路径
  if (path.includes('/cms/')) {
    items.push({
      title: 'CMS管理',
      path: '/cms'
    })
    
    if (path.includes('/cms/articles')) {
      items.push({
        title: '文章管理',
        path: '/cms/articles'
      })
      
      if (path.includes('/cms/articles/create')) {
        items.push({
          title: '新增文章',
          path: path
        })
      } else if (path.includes('/cms/articles/edit/')) {
        items.push({
          title: '编辑文章',
          path: path
        })
      } else if (path.includes('/cms/articles/view/')) {
        items.push({
          title: '文章详情',
          path: path
        })
      }
    } else if (path.includes('/cms/categories')) {
      items.push({
        title: '分类管理',
        path: '/cms/categories'
      })
    } else if (path.includes('/cms/tags')) {
      items.push({
        title: '标签管理',
        path: '/cms/tags'
      })
    } else if (path.includes('/cms/comments')) {
      items.push({
        title: '评论管理',
        path: '/cms/comments'
      })
    }
    
    return items
  }
  
  // 处理打卡管理路径
  if (path.includes('/check/')) {
    items.push({
      title: '打卡管理',
      path: '/check'
    })
    
    if (path.includes('/check/categories')) {
      items.push({
        title: '打卡类型',
        path: '/check/categories'
      })
    } else if (path.includes('/check/tasks')) {
      items.push({
        title: '打卡任务',
        path: '/check/tasks'
      })
    } else if (path.includes('/check/records')) {
      items.push({
        title: '打卡记录',
        path: '/check/records'
      })
    } else if (path.includes('/check/statistics')) {
      items.push({
        title: '统计分析',
        path: '/check/statistics'
      })
    }
    
    return items
  }
  
  // 处理其他路径
  matched.forEach(record => {
    if (record.meta && record.meta.title && !record.meta.hidden) {
      items.push({
        title: record.meta.title,
        path: record.path
      })
    }
  })
  
  return items
})

// 通知相关
const showNotifications = ref(false)
const notifications = ref([
  {
    id: 1,
    title: '系统通知',
    content: '您有新的任务待处理',
    time: '2023-05-01 10:30',
    read: false
  },
  {
    id: 2,
    title: '安全提醒',
    content: '您的账户今日有5次异常登录尝试',
    time: '2023-05-01 09:15',
    read: false
  },
  {
    id: 3,
    title: '更新提示',
    content: '系统将在今晚22:00-23:00进行升级维护',
    time: '2023-04-30 18:00',
    read: true
  }
])

// 未读通知数量
const unreadNotificationCount = computed(() => {
  return notifications.value.filter(item => !item.read).length
})

// 标记通知为已读
const markNotificationAsRead = (id) => {
  const notification = notifications.value.find(item => item.id === id)
  if (notification) {
    notification.read = true
  }
}

// 标记所有通知为已读
const markAllNotificationsAsRead = () => {
  notifications.value.forEach(item => {
    item.read = true
  })
}

// 处理搜索
const handleSearch = (keyword) => {
  searchKeyword.value = keyword
  
  // 模拟搜索结果
  if (!keyword) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }
  
  // 模拟API搜索
  setTimeout(() => {
    searchResults.value = [
      {
        id: 1,
        type: 'article',
        title: '如何提高工作效率',
        description: '包含关键词: ' + keyword,
        path: '/cms/articles/view/1'
      },
      {
        id: 2,
        type: 'user',
        title: '张三',
        description: '用户ID: 10001, 包含关键词: ' + keyword,
        path: '/users/view/1'
      },
      {
        id: 3,
        type: 'tenant',
        title: '某某科技有限公司',
        description: '租户ID: 5001, 包含关键词: ' + keyword,
        path: '/tenants/view/1'
      }
    ]
    
    showSearchResults.value = true
  }, 300)
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

// 格式化搜索分类名称
const formatCategory = (category) => {
  const categoryMap = {
    'article': '文章',
    'user': '用户',
    'tenant': '租户',
    'task': '任务',
    'record': '记录'
  }
  
  return categoryMap[category] || category
}

// 获取搜索图标
const getSearchIcon = (category) => {
  const iconMap = {
    'article': 'Document',
    'user': 'User',
    'tenant': 'OfficeBuilding',
    'task': 'List',
    'record': 'Calendar'
  }
  
  return iconMap[category] || 'InfoFilled'
}

// 获取搜索图标类名
const getSearchIconClass = (category) => {
  return `search-icon-${category}`
}

// 导航到搜索结果
const navigateToResult = (item) => {
  router.push(item.path)
  showSearchResults.value = false
}

// 处理登出
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    router.push('/login')
  }).catch(() => {})
}

// 初始化
onMounted(() => {
  // 应用当前主题
  settingsStore.setTheme(settingsStore.theme)
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.main-layout.dark-mode {
  background-color: #1e1e1e;
  color: #eee;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s;
  margin-left: 220px;
}

.content-expanded {
  margin-left: 64px;
}

.page-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.debug-info {
  background: #f0f9eb;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #67c23a;
}

.dark-mode .debug-info {
  background: #263238;
  color: #aed581;
}

/* 搜索结果样式 */
.search-empty {
  padding: 20px 0;
}

.search-group {
  margin-bottom: 20px;
}

.search-category {
  margin: 0 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ebeef5;
  font-size: 16px;
  font-weight: 500;
}

.search-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}

.search-item {
  display: flex;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.search-item:hover {
  background-color: #f5f7fa;
}

.search-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #fff;
}

.search-icon-article {
  background-color: #409eff;
}

.search-icon-user {
  background-color: #67c23a;
}

.search-icon-tenant {
  background-color: #e6a23c;
}

.search-icon-task {
  background-color: #f56c6c;
}

.search-icon-record {
  background-color: #909399;
}

.search-item-content {
  flex: 1;
}

.search-item-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.search-item-desc {
  font-size: 12px;
  color: #909399;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
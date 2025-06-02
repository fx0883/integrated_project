<template>
  <div class="navbar" :class="{ 'dark-mode': isDarkMode }">
    <div class="navbar-menu">
      <div class="menu-toggle" @click="$emit('toggleSidebar')">
        <el-icon size="24"><Menu /></el-icon>
      </div>
      <div class="navbar-brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>集成管理系统</span>
      </div>
    </div>
    
    <div class="navbar-right">
      <!-- 搜索框 -->
      <div class="search-container">
        <el-input
          placeholder="全局搜索..."
          v-model="searchKeyword"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <!-- 主题切换按钮 -->
      <div class="nav-item">
        <el-tooltip content="切换主题模式" placement="bottom">
          <el-button 
            circle 
            text
            @click="$emit('toggleDarkMode')"
          >
            <el-icon size="20">
              <component :is="isDarkMode ? 'Sunny' : 'Moon'" />
            </el-icon>
          </el-button>
        </el-tooltip>
      </div>
      
      <!-- 通知图标 -->
      <div class="nav-item">
        <el-badge :value="notificationCount" class="notification-badge">
          <el-button 
            circle 
            text
            @click="$emit('showNotifications')"
          >
            <el-icon size="20"><Bell /></el-icon>
          </el-button>
        </el-badge>
      </div>
      
      <!-- 用户信息下拉菜单 -->
      <div class="nav-item">
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="navbar-user">
            <template v-if="userAvatar">
              <img :src="userAvatar" alt="用户头像" />
            </template>
            <template v-else>
              <div class="user-avatar">{{ userInitials }}</div>
            </template>
            <span class="username">{{ userName }}</span>
          </div>
          
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>个人资料
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>系统设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useSettingsStore } from '../../../stores'
import { 
  User, Setting, SwitchButton, Menu,
  ArrowDown, Bell, Search, Moon, Sunny
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

// 定义组件属性
const props = defineProps({
  notificationCount: {
    type: Number,
    default: 0
  },
  userName: {
    type: String,
    default: ''
  },
  userAvatar: {
    type: String,
    default: ''
  },
  userInitials: {
    type: String,
    default: '?'
  }
})

// 定义事件
const emit = defineEmits(['showNotifications', 'logout', 'toggleSidebar', 'toggleDarkMode', 'search'])

// 路由和store
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// 是否为暗黑模式
const isDarkMode = computed(() => settingsStore.isDarkMode)

// 搜索关键字
const searchKeyword = ref('')

// 处理搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    emit('search', searchKeyword.value.trim())
    searchKeyword.value = ''
  }
}

// 下拉菜单命令处理
const handleCommand = (command) => {
  if (command === 'logout') {
    // 确认退出登录
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 执行退出登录
      emit('logout')
    }).catch(() => {
      // 取消退出登录
    })
  } else if (command === 'profile') {
    // 跳转到个人资料页
    router.push('/profile')
  } else if (command === 'settings') {
    // 跳转到设置页
    router.push('/settings')
  }
}
</script>

<style scoped>
.navbar {
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 0 20px;
  height: 70px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s;
}

.navbar.dark-mode {
  background-color: #1e1e1e;
  color: #e0e0e0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.navbar-menu {
  display: flex;
  align-items: center;
}

.menu-toggle {
  font-size: 24px;
  cursor: pointer;
  margin-right: 15px;
  display: block;
}

.navbar-brand {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 20px;
  color: var(--el-color-primary);
}

.navbar-brand svg {
  margin-right: 10px;
  stroke: var(--el-color-primary);
}

.navbar-right {
  display: flex;
  align-items: center;
}

.nav-item {
  margin-left: 15px;
  position: relative;
}

.search-container {
  margin-right: 15px;
}

.search-input {
  width: 220px;
  transition: all 0.3s;
}

.search-input:focus-within {
  width: 300px;
}

.notification-badge :deep(.el-badge__content) {
  background-color: var(--el-color-danger);
}

.navbar-user {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.navbar-user:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark-mode .navbar-user:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-user img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.username {
  margin-left: 10px;
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-input {
    width: 150px;
  }
  
  .search-input:focus-within {
    width: 200px;
  }
  
  .username {
    display: none;
  }
}

@media (max-width: 576px) {
  .search-container {
    display: none;
  }
}
</style>
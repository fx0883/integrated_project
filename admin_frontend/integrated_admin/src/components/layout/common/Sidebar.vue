<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed, 'dark-mode': isDarkMode }">
    <!-- Logo区域 -->
    <div class="sidebar-logo">
      <div class="logo-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span v-if="!isCollapsed">{{ systemTitle }}</span>
      </div>
    </div>
    
    <!-- 菜单区域 -->
    <div class="sidebar-menu">
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed"
          :unique-opened="true"
          :collapse-transition="false"
          class="sidebar-el-menu"
        >
          <template v-for="(item, index) in menuItems" :key="index">
            <!-- 没有子菜单的菜单项 -->
            <el-menu-item 
              v-if="!item.children || item.children.length === 0" 
              :index="item.path"
              @click="navigateTo(item.path)"
            >
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <template #title>
                <span>{{ item.title }}</span>
              </template>
            </el-menu-item>
            
            <!-- 有子菜单的菜单项 -->
            <el-sub-menu 
              v-else 
              :index="item.path"
            >
              <template #title>
                <el-icon v-if="item.icon">
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.title }}</span>
              </template>
              
              <!-- 子菜单项 -->
              <el-menu-item 
                v-for="(subItem, subIndex) in item.children" 
                :key="subIndex"
                :index="subItem.path"
                @click="navigateTo(subItem.path)"
              >
                <el-icon v-if="subItem.icon">
                  <component :is="subItem.icon" />
                </el-icon>
                <template #title>
                  <span>{{ subItem.title }}</span>
                </template>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </div>
    
    <!-- 折叠按钮 -->
    <div class="sidebar-collapse-btn" @click="$emit('toggleCollapse')">
      <el-icon size="16">
        <component :is="isCollapsed ? 'ArrowRight' : 'ArrowLeft'" />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../../../stores'
import * as ElementPlusIcons from '@element-plus/icons-vue'

// 定义组件属性
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  activeMenu: {
    type: String,
    default: '/'
  },
  menuItems: {
    type: Array,
    default: () => []
  }
})

// 定义事件
const emit = defineEmits(['toggleCollapse'])

// 路由和store
const router = useRouter()
const settingsStore = useSettingsStore()

// 是否为暗黑模式
const isDarkMode = computed(() => settingsStore.isDarkMode)

// 系统标题
const systemTitle = computed(() => settingsStore.systemTitle)

// 导航到指定路径
const navigateTo = (path) => {
  if (path) {
    router.push(path)
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 220px;
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 999;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  padding-top: 70px; /* 头部导航栏高度 */
}

.sidebar.dark-mode {
  background-color: #1e1e1e;
  color: #e0e0e0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
}

.sidebar-collapsed {
  width: 64px;
}

.sidebar-logo {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 220px;
  background-color: #fff;
  z-index: 1000;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.dark-mode .sidebar-logo {
  background-color: #1e1e1e;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.sidebar-collapsed .sidebar-logo {
  width: 64px;
}

.logo-container {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
  padding: 0 16px;
  white-space: nowrap;
  overflow: hidden;
}

.logo-container svg {
  margin-right: 10px;
  stroke: var(--el-color-primary);
  flex-shrink: 0;
}

.sidebar-menu {
  flex: 1;
  overflow: hidden;
}

.sidebar-el-menu {
  border-right: none;
}

.sidebar-el-menu:not(.el-menu--collapse) {
  width: 220px;
}

.sidebar-collapse-btn {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #909399;
  border-top: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.dark-mode .sidebar-collapse-btn {
  border-top: 1px solid #4a4a4a;
  color: #a0a0a0;
}

.sidebar-collapse-btn:hover {
  background-color: #f5f7fa;
  color: var(--el-color-primary);
}

.dark-mode .sidebar-collapse-btn:hover {
  background-color: #2a2a2a;
  color: var(--el-color-primary);
}

/* 自定义菜单样式 */
:deep(.el-menu) {
  background-color: transparent;
}

:deep(.el-menu-item.is-active) {
  color: var(--el-color-primary);
  background-color: #ecf5ff;
}

.dark-mode :deep(.el-menu-item.is-active) {
  background-color: #263238;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #f5f7fa;
}

.dark-mode :deep(.el-menu-item:hover),
.dark-mode :deep(.el-sub-menu__title:hover) {
  background-color: #2a2a2a;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.sidebar-collapsed {
    transform: translateX(0);
    width: 64px;
  }
}
</style>
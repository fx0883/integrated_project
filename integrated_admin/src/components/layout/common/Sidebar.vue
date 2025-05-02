<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-menu">
      <template v-for="(item, index) in menuItems" :key="index">
        <!-- 菜单分类标题 -->
        <div class="menu-category" v-if="item.type === 'category'">
          {{ item.title }}
        </div>
        
        <!-- 无子菜单的菜单项 -->
        <router-link 
          v-else-if="!item.children || item.children.length === 0" 
          :to="item.path"
          class="menu-item"
          :class="{ 'active': isActive(item.path) }"
          v-show="!item.meta?.hidden"
        >
          <el-icon v-if="item.icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="menu-title">{{ item.title }}</span>
        </router-link>
        
        <!-- 有子菜单的菜单项 -->
        <div 
          v-else 
          class="submenu-container"
          v-show="!item.meta?.hidden"
        >
          <div 
            class="submenu-title" 
            :class="{ 'active': isSubmenuActive(item) }"
            @click="toggleSubmenu(item)"
          >
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <span class="menu-title">{{ item.title }}</span>
            <el-icon class="arrow-icon">
              <component :is="expandedMenus.includes(item.path) ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </div>
          
          <!-- 子菜单项 -->
          <div 
            class="submenu" 
            v-show="expandedMenus.includes(item.path)"
          >
            <router-link 
              v-for="(subItem, subIndex) in item.children" 
              :key="subIndex" 
              :to="subItem.path"
              class="menu-item submenu-item"
              :class="{ 'active': isActive(subItem.path) }"
              v-show="!subItem.meta?.hidden"
            >
              <el-icon v-if="subItem.icon">
                <component :is="subItem.icon" />
              </el-icon>
              <span class="menu-title">{{ subItem.title }}</span>
            </router-link>
          </div>
        </div>
      </template>
    </div>
    
    <!-- 折叠按钮 -->
    <div class="menu-toggle-btn" @click="toggleCollapse">
      <el-icon v-if="isCollapsed">
        <Expand />
      </el-icon>
      <el-icon v-else>
        <Fold />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Expand, Fold, Odometer, User, Setting, List, 
  Plus, OfficeBuilding, DataLine, ArrowUp, ArrowDown
} from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const route = useRoute()

// 定义组件属性
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    required: true
  },
  activeMenu: {
    type: String,
    required: true
  },
  menuItems: {
    type: Array,
    required: true
  }
})

// 定义事件
const emit = defineEmits(['toggle-collapse', 'select'])

// 展开的子菜单
const expandedMenus = ref([])

// 判断路径是否活跃
const isActive = (path) => {
  console.log('[Sidebar] 检查路径是否活跃:', path, '当前活跃菜单:', props.activeMenu)
  
  // 精确匹配
  if (path === props.activeMenu) {
    console.log('[Sidebar] 路径精确匹配')
    return true
  }
  
  // 子路径匹配
  const currentPath = route.path
  if (path !== '/' && currentPath.startsWith(path + '/')) {
    console.log('[Sidebar] 路径前缀匹配:', path, currentPath)
    return true
  }
  
  return false
}

// 判断子菜单是否活跃
const isSubmenuActive = (item) => {
  // 如果当前路径是该菜单项的路径，则活跃
  if (isActive(item.path)) {
    console.log('[Sidebar] 菜单项活跃:', item.path)
    return true
  }
  
  // 如果当前路径包含在子菜单中，则活跃
  if (item.children) {
    const hasActiveChild = item.children.some(child => isActive(child.path))
    if (hasActiveChild) {
      console.log('[Sidebar] 子菜单活跃:', item.path)
    }
    return hasActiveChild
  }
  
  return false
}

// 切换子菜单展开状态
const toggleSubmenu = (item) => {
  const index = expandedMenus.value.indexOf(item.path)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(item.path)
  }
}

// 折叠/展开侧边栏
const toggleCollapse = () => {
  emit('toggle-collapse')
}

// 处理菜单选择
const handleSelect = (index) => {
  emit('select', index)
}

// 监听路由变化，自动展开对应的子菜单
watch(() => route.path, (newPath) => {
  props.menuItems.forEach(item => {
    if (item.children) {
      const hasActiveChild = item.children.some(child => 
        child.path === newPath || newPath.startsWith(child.path + '/')
      )
      
      if (hasActiveChild && !expandedMenus.value.includes(item.path)) {
        expandedMenus.value.push(item.path)
      }
    }
  })
}, { immediate: true })
</script>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  position: fixed;
  top: 70px;
  left: 0;
  bottom: 0;
  width: 260px;
  background-color: white;
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  z-index: 900;
  transition: all 0.3s ease;
}

.collapsed {
  width: 64px;
  overflow: hidden;
}

.sidebar-menu {
  padding: 20px 0;
}

.menu-category {
  padding: 12px 25px;
  color: var(--secondary-color);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  margin-top: 10px;
}

.menu-item {
  padding: 12px 25px;
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  transition: all 0.2s;
  text-decoration: none;
  position: relative;
}

.menu-item.active {
  color: var(--primary-color);
  background-color: var(--primary-light);
  font-weight: 500;
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--primary-color);
}

.menu-item:hover {
  background-color: rgba(10, 186, 181, 0.05);
}

.submenu-container {
  margin-bottom: 5px;
}

.submenu-title {
  padding: 12px 25px;
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.submenu-title.active {
  color: var(--primary-color);
  font-weight: 500;
}

.submenu-title:hover {
  background-color: rgba(10, 186, 181, 0.05);
}

.submenu {
  margin-left: 15px;
}

.submenu-item {
  padding: 10px 25px 10px 35px;
}

.menu-title {
  margin-left: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  margin-left: auto;
  transition: transform 0.3s;
}

.menu-toggle-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-light);
  color: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(10, 186, 181, 0.2);
  transition: all 0.3s;
}

.menu-toggle-btn:hover {
  background-color: var(--primary-color);
  color: white;
}

/* 响应式样式 */
@media (max-width: 992px) {
  .sidebar {
    transform: translateX(0);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  }
  
  .collapsed {
    transform: translateX(-260px);
  }
}
</style>
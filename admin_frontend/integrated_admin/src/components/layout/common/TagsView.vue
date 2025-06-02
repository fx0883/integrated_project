<template>
  <div class="tags-view-container" v-if="settingsStore.layout.tagsView.show">
    <div class="tags-view-wrapper">
      <div 
        ref="scrollPaneRef" 
        class="tags-view-scroll-pane"
        @wheel.prevent="handleScroll"
      >
        <div class="tags-view-items">
          <!-- 标签项 -->
          <span
            v-for="tag in visitedViews"
            :key="tag.path"
            :class="{ 'tags-view-item': true, 'is-active': isActive(tag) }"
            @click="handleTagClick(tag)"
            @contextmenu.prevent="handleContextMenu(tag, $event)"
          >
            <el-icon v-if="tag.meta?.icon" class="tag-icon">
              <component :is="tag.meta.icon" />
            </el-icon>
            <span class="tag-title">{{ tag.title || tag.meta?.title || '未命名页面' }}</span>
            <el-icon 
              class="tag-close" 
              v-if="!isAffix(tag)" 
              @click.stop="handleClose(tag)"
            >
              <Close />
            </el-icon>
          </span>
        </div>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <ul
      v-show="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
    >
      <li @click="handleRefreshTag(selectedTag)">刷新页面</li>
      <li v-if="!isAffix(selectedTag)" @click="handleClose(selectedTag)">关闭当前</li>
      <li @click="handleCloseOther(selectedTag)">关闭其他</li>
      <li @click="handleCloseAll">关闭所有</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '../../../stores/modules/settings'
import { Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 路由相关
const router = useRouter()
const route = useRoute()

// 获取设置store
const settingsStore = useSettingsStore()

// 滚动条DOM引用
const scrollPaneRef = ref(null)

// 访问过的视图
const visitedViews = ref([])
// 缓存的视图
const cachedViews = ref([])

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuLeft = ref(0)
const contextMenuTop = ref(0)
const selectedTag = ref(null)

// 当前路由是否激活
const isActive = (tag) => {
  return tag?.path === route.path
}

// 是否是固定标签
const isAffix = (tag) => {
  if (!tag) return false
  return !!tag.meta?.affix
}

// 添加视图标签
const addViewTags = (view) => {
  // 如果已存在则不添加
  if (visitedViews.value.some(v => v.path === view.path)) return
  
  // 添加到访问视图
  visitedViews.value.push(Object.assign({}, view, { title: view.meta?.title || '未命名页面' }))
  
  // 如果需要缓存且有name，则添加到缓存视图
  if (settingsStore.layout.tagsView.cached && view.name && !view.meta?.noCache) {
    cachedViews.value.push(view.name)
  }
}

// 监听路由变化，添加标签
watch(route, (newRoute) => {
  addViewTags(newRoute)
}, { immediate: true })

// 关闭标签
const handleClose = (view) => {
  removeView(view)
  if (isActive(view)) {
    // 关闭当前标签后跳转到最后一个标签
    const latestView = visitedViews.value.slice(-1)[0]
    if (latestView) {
      router.push(latestView.path)
    } else {
      // 如果没有标签了，跳转到首页
      router.push('/')
    }
  }
}

// 移除视图
const removeView = (view) => {
  // 从访问视图中移除
  const index = visitedViews.value.findIndex(v => v.path === view.path)
  if (index !== -1) {
    visitedViews.value.splice(index, 1)
  }
  
  // 从缓存视图中移除
  const cacheIndex = cachedViews.value.indexOf(view.name)
  if (cacheIndex !== -1) {
    cachedViews.value.splice(cacheIndex, 1)
  }
}

// 处理标签点击
const handleTagClick = (tag) => {
  router.push(tag.path)
}

// 处理右键菜单
const handleContextMenu = (tag, e) => {
  e.preventDefault()
  selectedTag.value = tag
  contextMenuLeft.value = e.clientX
  contextMenuTop.value = e.clientY
  contextMenuVisible.value = true
  
  // 点击其他地方关闭菜单
  document.body.addEventListener('click', closeContextMenu)
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
  document.body.removeEventListener('click', closeContextMenu)
}

// 刷新标签
const handleRefreshTag = (tag) => {
  // 移除缓存
  const cacheIndex = cachedViews.value.indexOf(tag.name)
  if (cacheIndex !== -1) {
    cachedViews.value.splice(cacheIndex, 1)
  }
  
  // 使用重定向实现刷新效果
  const { path } = tag
  router.replace({
    path: '/redirect',
    query: { redirect: path }
  })
}

// 关闭其他标签
const handleCloseOther = (tag) => {
  visitedViews.value = visitedViews.value.filter(v => {
    return isAffix(v) || v.path === tag.path
  })
  
  // 更新缓存视图
  cachedViews.value = cachedViews.value.filter(name => {
    return visitedViews.value.some(v => v.name === name)
  })
  
  // 如果当前不是活动标签，则跳转到该标签
  if (!isActive(tag)) {
    router.push(tag.path)
  }
}

// 关闭所有标签
const handleCloseAll = () => {
  // 过滤出固定标签
  visitedViews.value = visitedViews.value.filter(v => isAffix(v))
  cachedViews.value = []
  
  // 跳转到首页或第一个固定标签
  if (visitedViews.value.length) {
    router.push(visitedViews.value[0].path)
  } else {
    router.push('/')
  }
}

// 处理滚动
const handleScroll = (e) => {
  const eventDelta = e.wheelDelta || -e.deltaY * 3
  const scrollPaneEl = scrollPaneRef.value
  if (!scrollPaneEl) return
  
  scrollPaneEl.scrollLeft = scrollPaneEl.scrollLeft - eventDelta / 4
}

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
  document.body.removeEventListener('click', closeContextMenu)
})

// 暴露给父组件的方法
defineExpose({
  addViewTags,
  cachedViews
})
</script>

<style scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #d8dce5;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, .12), 0 0 3px 0 rgba(0, 0, 0, .04);
}

.tags-view-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.tags-view-scroll-pane {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    height: 2px;
  }
}

.tags-view-items {
  padding: 0 4px;
  display: inline-block;
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  position: relative;
  height: 26px;
  line-height: 26px;
  margin: 4px 4px 0;
  padding: 0 8px;
  font-size: 12px;
  background: #f0f0f0;
  color: #495060;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #eaf4fe;
  }
  
  &.is-active {
    background-color: var(--el-color-primary);
    color: #fff;
    border-color: var(--el-color-primary);
    
    &::before {
      content: '';
      background: #fff;
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      position: relative;
      margin-right: 4px;
    }
  }
}

.tag-icon {
  margin-right: 4px;
  font-size: 14px;
}

.tag-title {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-close {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  text-align: center;
  transition: all .3s;
  color: #495060;
  margin-left: 4px;
  font-size: 12px;
  
  &:hover {
    background-color: #b4bccc;
    color: #fff;
  }
}

.context-menu {
  position: fixed;
  background: #fff;
  z-index: 999;
  list-style: none;
  padding: 5px 0;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  font-size: 12px;
  font-weight: 400;
  color: #333;
  margin: 0;
  
  li {
    margin: 0;
    padding: 7px 16px;
    cursor: pointer;
    &:hover {
      background: #eaf4fe;
    }
  }
}
</style> 
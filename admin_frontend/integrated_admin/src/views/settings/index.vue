<template>
  <div class="settings-page">
    <h1 class="page-title">系统设置</h1>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>主题设置</h2>
        </div>
      </template>
      
      <div class="settings-section">
        <div class="setting-item">
          <span class="setting-label">主题模式</span>
          <div class="setting-control">
            <el-switch
              v-model="isDarkMode"
              active-text="暗色模式"
              inactive-text="亮色模式"
              @change="toggleDarkMode"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">主题颜色</span>
          <div class="setting-control theme-colors">
            <div
              v-for="(color, name) in themeColors"
              :key="name"
              class="color-item"
              :class="{ active: currentTheme === name }"
              :style="{ backgroundColor: color.primary }"
              @click="setTheme(name)"
            ></div>
          </div>
        </div>
      </div>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>布局设置</h2>
        </div>
      </template>
      
      <div class="settings-section">
        <div class="setting-item">
          <span class="setting-label">侧边栏Logo</span>
          <div class="setting-control">
            <el-switch
              v-model="layoutSettings.sidebar.showLogo"
              @change="saveLayoutSettings"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">固定头部</span>
          <div class="setting-control">
            <el-switch
              v-model="layoutSettings.header.fixed"
              @change="saveLayoutSettings"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">显示标签栏</span>
          <div class="setting-control">
            <el-switch
              v-model="layoutSettings.tagsView.show"
              @change="saveLayoutSettings"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">缓存页面</span>
          <div class="setting-control">
            <el-switch
              v-model="layoutSettings.tagsView.cached"
              :disabled="!layoutSettings.tagsView.show"
              @change="saveLayoutSettings"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">显示面包屑</span>
          <div class="setting-control">
            <el-switch
              v-model="layoutSettings.showBreadcrumb"
              @change="saveLayoutSettings"
            />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">显示页脚</span>
          <div class="setting-control">
            <el-switch
              v-model="layoutSettings.showFooter"
              @change="saveLayoutSettings"
            />
          </div>
        </div>
      </div>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>系统信息</h2>
        </div>
      </template>
      
      <div class="settings-section">
        <div class="setting-item">
          <span class="setting-label">系统名称</span>
          <div class="setting-control">
            <el-input v-model="systemSettings.title" @change="saveSystemSettings" />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">Logo文本</span>
          <div class="setting-control">
            <el-input v-model="systemSettings.logoText" @change="saveSystemSettings" />
          </div>
        </div>
        
        <div class="setting-item">
          <span class="setting-label">显示水印</span>
          <div class="setting-control">
            <el-switch
              v-model="systemSettings.showWatermark"
              @change="saveSystemSettings"
            />
          </div>
        </div>
        
        <div class="setting-item" v-if="systemSettings.showWatermark">
          <span class="setting-label">水印文本</span>
          <div class="setting-control">
            <el-input 
              v-model="systemSettings.watermarkText" 
              placeholder="请输入水印文本"
              @change="saveSystemSettings" 
            />
          </div>
        </div>
      </div>
      
      <div class="settings-actions">
        <el-button type="danger" @click="resetSettings">恢复默认设置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useSettingsStore } from '../../stores'
import { themeColors } from '../../config/theme'
import { ElMessage } from 'element-plus'

// 获取设置store
const settingsStore = useSettingsStore()

// 是否为暗黑模式
const isDarkMode = computed(() => settingsStore.isDarkMode)

// 当前主题
const currentTheme = computed(() => settingsStore.theme)

// 布局设置
const layoutSettings = reactive({...settingsStore.layout})

// 系统设置
const systemSettings = reactive({...settingsStore.system})

// 切换暗黑模式
const toggleDarkMode = () => {
  settingsStore.toggleDarkMode()
}

// 设置主题
const setTheme = (theme) => {
  settingsStore.setTheme(theme)
  ElMessage.success(`已切换到${theme}主题`)
}

// 保存布局设置
const saveLayoutSettings = () => {
  settingsStore.saveLayoutSettings(layoutSettings)
  ElMessage.success('布局设置已保存')
}

// 保存系统设置
const saveSystemSettings = () => {
  settingsStore.saveSystemSettings(systemSettings)
  ElMessage.success('系统设置已保存')
}

// 重置所有设置
const resetSettings = () => {
  settingsStore.resetSettings()
  
  // 更新本地数据
  Object.assign(layoutSettings, settingsStore.layout)
  Object.assign(systemSettings, settingsStore.system)
  
  ElMessage.success('已恢复默认设置')
}
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.settings-section {
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.setting-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.setting-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.setting-control {
  width: 250px;
}

.theme-colors {
  display: flex;
  gap: 10px;
}

.color-item {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.active {
  border-color: var(--el-color-black);
}

.color-item.active::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
}

.settings-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .setting-control {
    width: 100%;
    margin-top: 10px;
  }
}
</style> 
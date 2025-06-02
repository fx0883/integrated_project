<template>
  <div class="icon-demo">
    <el-card class="w-full mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium">图标组件示例</h3>
          <el-switch v-model="darkMode" inline-prompt active-text="暗" inactive-text="亮" @change="toggleDarkMode" />
        </div>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 基础图标 -->
        <el-card shadow="hover" class="icon-card">
          <template #header>
            <h4 class="text-base font-medium">基础图标</h4>
          </template>
          <div class="flex flex-wrap gap-4">
            <div v-for="icon in basicIcons" :key="icon" class="icon-item flex flex-col items-center">
              <IconifyIconOnline :icon="icon" class="text-2xl mb-2" />
              <span class="text-xs">{{ icon.split(':')[1] }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 不同尺寸 -->
        <el-card shadow="hover" class="icon-card">
          <template #header>
            <h4 class="text-base font-medium">不同尺寸</h4>
          </template>
          <div class="flex items-end gap-4">
            <div class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:home" size="small" />
              <span class="text-xs mt-2">小</span>
            </div>
            <div class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:home" size="default" />
              <span class="text-xs mt-2">默认</span>
            </div>
            <div class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:home" size="large" />
              <span class="text-xs mt-2">大</span>
            </div>
            <div class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:home" :size="36" />
              <span class="text-xs mt-2">自定义</span>
            </div>
          </div>
        </el-card>
        
        <!-- 不同颜色 -->
        <el-card shadow="hover" class="icon-card">
          <template #header>
            <h4 class="text-base font-medium">不同颜色</h4>
          </template>
          <div class="flex flex-wrap gap-4">
            <div v-for="(color, name) in themeColors" :key="name" class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:circle" :color="color" size="large" />
              <span class="text-xs mt-2">{{ name }}</span>
            </div>
          </div>
        </el-card>
        
        <!-- 动画效果 -->
        <el-card shadow="hover" class="icon-card">
          <template #header>
            <h4 class="text-base font-medium">动画效果</h4>
          </template>
          <div class="flex flex-wrap gap-4">
            <div class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:loading" size="large" :spin="true" />
              <span class="text-xs mt-2">旋转</span>
            </div>
            <div class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:loading" size="large" :spin="true" spin_speed="0.5s" />
              <span class="text-xs mt-2">快速旋转</span>
            </div>
            <div class="icon-item flex flex-col items-center">
              <IconifyIconOnline icon="mdi:loading" size="large" :spin="true" spin_speed="2s" />
              <span class="text-xs mt-2">慢速旋转</span>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconifyIconOnline } from '../re/ReIcon';

// 基础图标列表
const basicIcons = [
  'mdi:home',
  'mdi:account',
  'mdi:cog',
  'mdi:bell',
  'mdi:email',
  'mdi:chart-bar',
  'mdi:calendar',
  'mdi:file-document'
];

// 主题颜色
const themeColors = {
  '主色': '#409eff',
  '成功': '#67c23a',
  '警告': '#e6a23c',
  '危险': '#f56c6c',
  '信息': '#909399'
};

// 暗黑模式
const darkMode = ref(false);

// 切换暗黑模式
const toggleDarkMode = (val: boolean) => {
  if (val) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
</script>

<style scoped>
.icon-demo {
  padding: 1rem;
}

.icon-card {
  height: 100%;
}

/* 暗黑模式样式 */
:global(.dark) .icon-card {
  background-color: #1a1a1a;
  color: #e0e0e0;
}

/* 添加旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 
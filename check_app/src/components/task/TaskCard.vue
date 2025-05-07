<template>
  <view class="task-card" :class="{ 'task-card-completed': completed }" @click="$emit('click', task)">
    <view class="task-content">
      <view class="task-left">
        <text class="task-name">{{ task.name }}</text>
        <view class="task-meta">
          <view class="category-tag" :style="{ backgroundColor: categoryColor }">
            {{ categoryName }}
          </view>
          <text class="task-time" v-if="task.reminder_time">{{ task.reminder_time }}</text>
        </view>
      </view>
      <view class="task-right">
        <view class="checkbox" :class="{ checked: completed }" @click.stop="$emit('toggle', task)">
          <text class="iconfont icon-check" v-if="completed"></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

// 组件属性
const props = defineProps({
  // 任务对象
  task: {
    type: Object,
    required: true
  },
  // 是否已完成
  completed: {
    type: Boolean,
    default: false
  },
  // 分类映射
  categoryMap: {
    type: Object,
    default: () => ({})
  },
  // 颜色映射
  colorMap: {
    type: Object,
    default: () => ({})
  }
})

// 定义事件
defineEmits(['click', 'toggle'])

// 分类名称
const categoryName = computed(() => {
  // 如果有分类映射，则使用映射获取分类名称
  if (props.categoryMap && Object.keys(props.categoryMap).length > 0) {
    return props.categoryMap[props.task.category] || '其他'
  }
  
  // 默认分类映射
  const defaultCategoryMap = {
    1: '运动',
    2: '学习',
    3: '阅读',
    4: '冥想',
    5: '记账',
    6: '喝水'
  }
  
  return defaultCategoryMap[props.task.category] || '其他'
})

// 分类颜色
const categoryColor = computed(() => {
  // 如果有颜色映射，则使用映射获取分类颜色
  if (props.colorMap && Object.keys(props.colorMap).length > 0) {
    return props.colorMap[props.task.category] || 'rgba(158, 158, 158, 0.2)'
  }
  
  // 默认颜色映射
  const defaultColorMap = {
    1: 'rgba(76, 175, 80, 0.2)',  // 运动
    2: 'rgba(33, 150, 243, 0.2)',  // 学习
    3: 'rgba(156, 39, 176, 0.2)',  // 阅读
    4: 'rgba(255, 193, 7, 0.2)',   // 冥想
    5: 'rgba(255, 87, 34, 0.2)',   // 记账
    6: 'rgba(0, 188, 212, 0.2)'    // 喝水
  }
  
  return defaultColorMap[props.task.category] || 'rgba(158, 158, 158, 0.2)'
})
</script>

<style lang="scss" scoped>
.task-card {
  background-color: #ffffff;
  border-radius: $border-radius-md;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: $box-shadow;
  
  &:active {
    opacity: 0.8;
  }
  
  &.task-card-completed {
    opacity: 0.7;
  }
  
  .task-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .task-left {
    flex: 1;
    margin-right: 12px;
  }
  
  .task-name {
    font-size: 16px;
    font-weight: 500;
    color: $color-text-primary;
    margin-bottom: 8px;
  }
  
  .task-meta {
    display: flex;
    align-items: center;
  }
  
  .category-tag {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    margin-right: 8px;
  }
  
  .task-time {
    font-size: 12px;
    color: $color-text-secondary;
  }
  
  .checkbox {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--theme-primary, #4caf50);
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.checked {
      background-color: var(--theme-primary, #4caf50);
      color: #ffffff;
    }
  }
}
</style> 
<template>
  <el-drawer
    v-model="visible"
    title="通知中心"
    direction="rtl"
    size="300px"
  >
    <div class="notification-list">
      <div 
        v-for="(notification, index) in notifications" 
        :key="index"
        class="notification-item"
        :class="{ 'notification-unread': !notification.read }"
      >
        <div class="notification-icon">
          <el-icon>
            <component :is="notification.icon || 'InfoFilled'" />
          </el-icon>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-text">{{ notification.content }}</div>
          <div class="notification-time">{{ notification.time }}</div>
        </div>
      </div>
      <div v-if="!notifications.length" class="empty-notifications">
        暂无通知
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'

// 定义组件属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  notifications: {
    type: Array,
    default: () => []
  }
})

// 定义事件
const emit = defineEmits(['update:modelValue'])

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<style scoped>
/* 通知样式 */
.notification-list {
  padding: 0 10px;
}

.notification-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.notification-unread {
  background-color: #f0f9ff;
}

.notification-icon {
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
  margin-right: 10px;
  color: #409EFF;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.notification-text {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.empty-notifications {
  padding: 30px 0;
  text-align: center;
  color: #909399;
}
</style> 
<template>
  <view class="home-container">
    <!-- 欢迎卡片 -->
    <view class="welcome-card">
      <view class="welcome-content">
        <text class="welcome-title">{{ $t('home.welcome') }}，{{ userInfo.displayName }}</text>
        <text class="welcome-date">{{ todayDate }}</text>
      </view>
    </view>

    <!-- 任务统计卡片 -->
    <view class="stat-cards">
      <view class="stat-card">
        <text class="stat-number">{{ todayTasksCount }}</text>
        <text class="stat-label">{{ $t('home.todayTasks') }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{ completedTasksCount }}</text>
        <text class="stat-label">{{ $t('home.completedTasks') }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{ completionRate }}%</text>
        <text class="stat-label">{{ $t('home.completionRate') }}</text>
      </view>
    </view>
    
    <!-- 连续打卡 -->
    <view class="streak-card">
      <view class="streak-info">
        <text class="streak-label">{{ $t('home.continueStreak') }}</text>
        <view class="streak-number-container">
          <text class="streak-number">{{ continuousStreak }}</text>
          <text class="streak-days">{{ $t('home.days') }}</text>
        </view>
      </view>
    </view>
    
    <!-- 今日任务 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">{{ $t('home.todayTasks') }}</text>
        <text class="view-all" @click="navigateToTasks">{{ $t('home.viewAll') }}</text>
      </view>
      
      <view class="task-list" v-if="todayTasks.length > 0">
        <view class="task-card" v-for="task in todayTasks" :key="task.id" @click="handleTaskClick(task)">
          <view class="task-content">
            <view class="task-left">
              <text class="task-name">{{ task.name }}</text>
              <view class="task-meta">
                <view class="category-tag" :style="{ backgroundColor: getCategoryColor(task.category) }">
                  {{ getCategoryName(task.category) }}
                </view>
                <text class="task-time" v-if="task.reminder_time">{{ task.reminder_time }}</text>
              </view>
            </view>
            <view class="task-right">
              <view class="checkbox" :class="{ checked: isTaskCompleted(task.id) }" @click.stop="toggleTaskStatus(task)">
                <text class="iconfont icon-check" v-if="isTaskCompleted(task.id)"></text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <text class="empty-text">{{ $t('tasks.noTasks') }}</text>
        <button class="add-task-btn" @click="navigateToCreateTask">{{ $t('tasks.addTask') }}</button>
      </view>
    </view>
    
    <!-- 最近活动 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">{{ $t('home.recentActivity') }}</text>
      </view>
      
      <view class="activity-list" v-if="recentActivities.length > 0">
        <view class="activity-item" v-for="(activity, index) in recentActivities" :key="index">
          <view class="activity-icon">
            <text class="iconfont" :class="getActivityIcon(activity.type)"></text>
          </view>
          <view class="activity-content">
            <text class="activity-text">{{ activity.content }}</text>
            <text class="activity-time">{{ formatRelativeTime(activity.time) }}</text>
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-else>
        <text class="empty-text">{{ $t('common.noneAvailable') }}</text>
      </view>
    </view>
    
    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-button" @click="navigateToCreateTask">
        <text class="iconfont icon-add"></text>
        <text class="action-text">{{ $t('home.createTask') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { dateUtils } from '@/utils'

// 状态管理
const userStore = useUserStore()

// 获取用户信息
const userInfo = computed(() => ({
  displayName: userStore.displayName || '用户'
}))

// 今日日期
const todayDate = computed(() => {
  const now = new Date()
  const weekDay = dateUtils.getWeekDay(now, { short: true })
  return `${dateUtils.formatDate(now)} ${weekDay}`
})

// 模拟数据
const todayTasks = ref([])
const recentActivities = ref([])
const completedRecords = ref([])

// 导入任务和记录数据
const importMockData = async () => {
  try {
    console.log('[Home] 正在导入模拟数据')
    
    // 动态导入模拟数据
    const mockModule = await import('@/mock')
    const { tasks, records, categories } = mockModule.default
    
    // 过滤今日任务
    const today = dateUtils.getCurrentDateStr()
    todayTasks.value = tasks.filter(task => {
      // 判断任务是否在今天的计划中
      if (task.frequency_type === 'daily') {
        return true
      } else if (task.frequency_type === 'weekly') {
        const dayOfWeek = new Date().getDay() || 7 // 获取星期几（0-6，0表示周日）
        return task.frequency_days.includes(dayOfWeek)
      }
      return false
    })
    
    // 获取完成记录
    completedRecords.value = records.filter(record => record.check_date === today)
    
    // 生成最近活动
    recentActivities.value = records.slice(0, 5).map(record => {
      const task = tasks.find(t => t.id === record.task) || {}
      
      return {
        type: 'check-in',
        content: `打卡了「${task.name || '未知任务'}」`,
        time: record.created_at,
        taskId: record.task
      }
    })
    
    console.log('[Home] 模拟数据导入成功', {
      taskCount: todayTasks.value.length,
      recordCount: completedRecords.value.length
    })
  } catch (error) {
    console.error('[Home] 导入模拟数据失败', error)
  }
}

// 计算今日任务数量
const todayTasksCount = computed(() => todayTasks.value.length)

// 计算已完成任务数量
const completedTasksCount = computed(() => completedRecords.value.length)

// 计算完成率
const completionRate = computed(() => {
  if (todayTasksCount.value === 0) return 0
  return Math.round((completedTasksCount.value / todayTasksCount.value) * 100)
})

// 连续打卡天数（模拟数据）
const continuousStreak = ref(7)

// 判断任务是否已完成
const isTaskCompleted = (taskId) => {
  return completedRecords.value.some(record => record.task === taskId)
}

// 切换任务状态
const toggleTaskStatus = (task) => {
  console.log('[Home] 切换任务状态', task.name)
  
  if (isTaskCompleted(task.id)) {
    // 如果已完成，则取消完成状态
    completedRecords.value = completedRecords.value.filter(record => record.task !== task.id)
  } else {
    // 如果未完成，则标记为完成
    const now = new Date()
    completedRecords.value.push({
      id: Date.now(),
      task: task.id,
      user: 1, // 默认用户ID
      check_date: dateUtils.getCurrentDateStr(),
      check_time: dateUtils.formatTime(now),
      remarks: '',
      comment: '',
      completion_time: dateUtils.formatTime(now),
      created_at: now.toISOString()
    })
  }
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  // 模拟分类数据
  const categoryMap = {
    1: '运动',
    2: '学习',
    3: '阅读',
    4: '冥想',
    5: '记账',
    6: '喝水'
  }
  
  return categoryMap[categoryId] || '其他'
}

// 获取分类颜色
const getCategoryColor = (categoryId) => {
  // 模拟分类颜色
  const colorMap = {
    1: 'rgba(76, 175, 80, 0.2)',
    2: 'rgba(33, 150, 243, 0.2)',
    3: 'rgba(156, 39, 176, 0.2)',
    4: 'rgba(255, 193, 7, 0.2)',
    5: 'rgba(255, 87, 34, 0.2)',
    6: 'rgba(0, 188, 212, 0.2)'
  }
  
  return colorMap[categoryId] || 'rgba(158, 158, 158, 0.2)'
}

// 获取活动图标
const getActivityIcon = (type) => {
  const iconMap = {
    'check-in': 'icon-checkin',
    'create-task': 'icon-task',
    'create-category': 'icon-category'
  }
  
  return iconMap[type] || 'icon-activity'
}

// 格式化相对时间
const formatRelativeTime = (timeStr) => {
  return dateUtils.formatRelativeTime(timeStr)
}

// 导航到任务列表页
const navigateToTasks = () => {
  uni.switchTab({
    url: '/pages/tasks/index'
  })
}

// 导航到创建任务页
const navigateToCreateTask = () => {
  uni.navigateTo({
    url: '/pages/create_task/index'
  })
}

// 点击任务
const handleTaskClick = (task) => {
  console.log('[Home] 点击任务', task.name)
  // 可以导航到任务详情页
}

// 生命周期钩子
onMounted(() => {
  // 初始化用户信息
  if (!userStore.isLoggedIn) {
    userStore.init()
  }
  
  // 导入模拟数据
  importMockData()
})
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--theme-background, #f1f8e9);
}

.welcome-card {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: $border-radius-lg;
  background: linear-gradient(135deg, var(--theme-primary, #4caf50) 0%, var(--theme-accent, #2e7d32) 100%);
  
  .welcome-content {
    display: flex;
    flex-direction: column;
  }
  
  .welcome-title {
    font-size: 20px;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 8px;
  }
  
  .welcome-date {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
  }
}

.stat-cards {
  display: flex;
  margin-bottom: 20px;
  
  .stat-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    margin-right: 10px;
    background-color: #ffffff;
    border-radius: $border-radius-md;
    box-shadow: $box-shadow;
    
    &:last-child {
      margin-right: 0;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: var(--theme-primary, #4caf50);
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      color: $color-text-secondary;
    }
  }
}

.streak-card {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: $border-radius-lg;
  background-color: rgba(var(--theme-primary, #4caf50), 0.1);
  border: 2px dashed var(--theme-primary, #4caf50);
  
  .streak-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .streak-label {
    font-size: 14px;
    color: $color-text-regular;
    margin-bottom: 8px;
  }
  
  .streak-number-container {
    display: flex;
    align-items: baseline;
  }
  
  .streak-number {
    font-size: 36px;
    font-weight: bold;
    color: var(--theme-primary, #4caf50);
  }
  
  .streak-days {
    font-size: 14px;
    color: $color-text-regular;
    margin-left: 4px;
  }
}

.section {
  margin-bottom: 24px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: $color-text-primary;
    }
    
    .view-all {
      font-size: 14px;
      color: var(--theme-primary, #4caf50);
    }
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  
  .task-card {
    background-color: #ffffff;
    border-radius: $border-radius-md;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: $box-shadow;
    
    &:active {
      opacity: 0.8;
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
}

.activity-list {
  .activity-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid $border-color;
    
    &:last-child {
      border-bottom: none;
    }
    
    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: rgba(var(--theme-primary, #4caf50), 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: var(--theme-primary, #4caf50);
    }
    
    .activity-content {
      flex: 1;
    }
    
    .activity-text {
      font-size: 14px;
      color: $color-text-primary;
      margin-bottom: 4px;
    }
    
    .activity-time {
      font-size: 12px;
      color: $color-text-secondary;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  
  .empty-text {
    font-size: 14px;
    color: $color-text-secondary;
    margin-bottom: 16px;
  }
  
  .add-task-btn {
    padding: 8px 16px;
    background-color: var(--theme-primary, #4caf50);
    color: #ffffff;
    border-radius: $border-radius-md;
    font-size: 14px;
  }
}

.quick-actions {
  position: fixed;
  right: 20px;
  bottom: 100px;
  
  .action-button {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: var(--theme-primary, #4caf50);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    
    .iconfont {
      font-size: 24px;
    }
    
    .action-text {
      font-size: 10px;
      margin-top: 2px;
    }
  }
}
</style> 
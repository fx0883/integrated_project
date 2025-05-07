<template>
  <view class="tasks-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ $t('tasks.all') }}</text>
      <view class="add-button" @click="navigateToCreateTask">
        <text class="iconfont icon-add"></text>
      </view>
    </view>
    
    <!-- 任务筛选切换 -->
    <view class="filter-tabs">
      <view 
        v-for="tab in filterTabs" 
        :key="tab.value" 
        class="filter-tab"
        :class="{ 'filter-active': currentFilter === tab.value }"
        @click="changeFilter(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>
    
    <!-- 任务列表 -->
    <view class="task-list" v-if="filteredTasks.length > 0">
      <task-card
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        :completed="isTaskCompleted(task.id)"
        @click="handleTaskClick(task)"
        @toggle="toggleTaskStatus(task)"
      />
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-icon">
        <text class="iconfont icon-empty"></text>
      </view>
      <text class="empty-text">{{ $t('tasks.noTasks') }}</text>
      <button class="add-task-btn" @click="navigateToCreateTask">{{ $t('tasks.addTask') }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import TaskCard from '@/components/task/TaskCard.vue'
import { dateUtils } from '@/utils'

// 过滤标签
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' }
]

// 当前过滤条件
const currentFilter = ref('all')

// 任务数据
const tasks = ref([])
const completedRecords = ref([])
const categories = ref([])

// 根据过滤条件筛选任务
const filteredTasks = computed(() => {
  const today = dateUtils.getCurrentDateStr()
  
  switch (currentFilter.value) {
    case 'today':
      return tasks.value.filter(task => {
        // 判断任务是否在今天的计划中
        if (task.frequency_type === 'daily') {
          return true
        } else if (task.frequency_type === 'weekly') {
          const dayOfWeek = new Date().getDay() || 7 // 获取星期几（0-6，0表示周日）
          return task.frequency_days.includes(dayOfWeek)
        }
        return false
      })
    
    case 'active':
      return tasks.value.filter(task => task.status === 'active')
    
    case 'completed':
      // 获取已完成的任务ID
      const completedTaskIds = completedRecords.value
        .filter(record => record.check_date === today)
        .map(record => record.task)
      
      // 返回今天已完成的任务
      return tasks.value.filter(task => completedTaskIds.includes(task.id))
    
    case 'all':
    default:
      return tasks.value
  }
})

// 更改过滤条件
const changeFilter = (filter) => {
  currentFilter.value = filter
}

// 判断任务是否已完成
const isTaskCompleted = (taskId) => {
  const today = dateUtils.getCurrentDateStr()
  return completedRecords.value.some(record => 
    record.task === taskId && record.check_date === today
  )
}

// 切换任务状态
const toggleTaskStatus = (task) => {
  console.log('[Tasks] 切换任务状态', task.name)
  
  const today = dateUtils.getCurrentDateStr()
  
  if (isTaskCompleted(task.id)) {
    // 如果已完成，则取消完成状态
    completedRecords.value = completedRecords.value.filter(record => 
      !(record.task === task.id && record.check_date === today)
    )
  } else {
    // 如果未完成，则标记为完成
    const now = new Date()
    completedRecords.value.push({
      id: Date.now(),
      task: task.id,
      user: 1, // 默认用户ID
      check_date: today,
      check_time: dateUtils.formatTime(now),
      remarks: '',
      comment: '',
      completion_time: dateUtils.formatTime(now),
      created_at: now.toISOString()
    })
  }
}

// 加载任务数据
const loadTaskData = async () => {
  try {
    console.log('[Tasks] 正在加载任务数据')
    
    // 动态导入模拟数据
    const mockModule = await import('@/mock')
    const { tasks: mockTasks, records: mockRecords, categories: mockCategories } = mockModule.default
    
    // 设置数据
    tasks.value = mockTasks
    completedRecords.value = mockRecords
    categories.value = mockCategories
    
    console.log('[Tasks] 任务数据加载成功', {
      taskCount: tasks.value.length,
      recordCount: completedRecords.value.length,
      categoryCount: categories.value.length
    })
  } catch (error) {
    console.error('[Tasks] 加载任务数据失败', error)
  }
}

// 导航到创建任务页面
const navigateToCreateTask = () => {
  console.log('[Tasks] 导航到创建任务页面')
  uni.navigateTo({
    url: '/pages/create_task/index'
  })
}

// 点击任务时的处理
const handleTaskClick = (task) => {
  console.log('[Tasks] 点击任务', task.name)
  // TODO: 导航到任务详情页
}

// 下拉刷新处理
const onPullDownRefresh = () => {
  console.log('[Tasks] 下拉刷新')
  loadTaskData().then(() => {
    uni.stopPullDownRefresh()
  })
}

// 页面加载时获取数据
onMounted(() => {
  loadTaskData()
})
</script>

<style lang="scss" scoped>
.tasks-container {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--theme-background, #f1f8e9);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .page-title {
    font-size: 24px;
    font-weight: bold;
    color: $color-text-primary;
  }
  
  .add-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--theme-primary, #4caf50);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      font-size: 24px;
      color: #ffffff;
    }
  }
}

.filter-tabs {
  display: flex;
  margin-bottom: 20px;
  background-color: #ffffff;
  border-radius: $border-radius-md;
  padding: 4px;
  box-shadow: $box-shadow;
  
  .filter-tab {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    border-radius: $border-radius-sm;
    transition: all 0.3s;
    
    .tab-text {
      font-size: 14px;
      color: $color-text-regular;
    }
    
    &.filter-active {
      background-color: var(--theme-primary, #4caf50);
      
      .tab-text {
        color: #ffffff;
        font-weight: 500;
      }
    }
  }
}

.task-list {
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  
  .empty-icon {
    font-size: 48px;
    color: $color-text-placeholder;
    margin-bottom: 16px;
  }
  
  .empty-text {
    font-size: 16px;
    color: $color-text-secondary;
    margin-bottom: 24px;
  }
  
  .add-task-btn {
    padding: 10px 20px;
    background-color: var(--theme-primary, #4caf50);
    color: #ffffff;
    border-radius: $border-radius-md;
    font-size: 14px;
  }
}
</style> 
<template>
  <view class="statistics-container">
    <!-- 总览卡片 -->
    <view class="overview-card">
      <view class="overview-row">
        <view class="stat-card">
          <text class="stat-number">{{ stats.continueStreak }}</text>
          <text class="stat-label">{{ $t('statistics.continueStreak') }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-number">{{ stats.completionRate }}%</text>
          <text class="stat-label">{{ $t('statistics.completionRate') }}</text>
        </view>
      </view>
      <view class="overview-row">
        <view class="stat-card">
          <text class="stat-number">{{ stats.totalHabits }}</text>
          <text class="stat-label">{{ $t('statistics.totalHabits') }}</text>
        </view>
        <view class="stat-card">
          <text class="stat-number">{{ stats.averageCompletionTime }}</text>
          <text class="stat-label">{{ $t('statistics.avgCompletionTime') }}</text>
        </view>
      </view>
    </view>
    
    <!-- 时间筛选 -->
    <view class="time-filter">
      <view 
        v-for="(filter, index) in timeFilters" 
        :key="index" 
        class="filter-item"
        :class="{ active: currentTimeFilter === filter.value }"
        @click="changeTimeFilter(filter.value)"
      >
        <text class="filter-text">{{ filter.label }}</text>
      </view>
    </view>
    
    <!-- 图表区域 -->
    <view class="chart-section">
      <view class="chart-header">
        <text class="chart-title">{{ getChartTitle() }}</text>
      </view>
      <view class="chart-container">
        <!-- 这里使用一个模拟的图表界面 -->
        <view class="chart-mock">
          <view class="chart-bars">
            <view 
              v-for="(item, index) in chartData" 
              :key="index" 
              class="chart-bar-container"
            >
              <view 
                class="chart-bar" 
                :style="{ height: `${item.value * 2}px` }"
              ></view>
              <text class="chart-label">{{ item.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 类型统计 -->
    <view class="category-stats">
      <view class="section-header">
        <text class="section-title">{{ $t('statistics.byCategory') }}</text>
      </view>
      
      <view class="category-list">
        <view 
          class="category-item" 
          v-for="category in categoryStats" 
          :key="category.id"
        >
          <view class="category-info">
            <view class="category-icon" :style="{ backgroundColor: category.color }">
              <text class="iconfont" :class="`icon-${category.icon || 'category'}`"></text>
            </view>
            <text class="category-name">{{ category.name }}</text>
          </view>
          <view class="category-progress">
            <view class="progress-bar">
              <view 
                class="progress-fill" 
                :style="{ width: `${category.completionRate}%` }"
              ></view>
            </view>
            <text class="progress-text">{{ category.completionRate }}%</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dateUtils } from '@/utils'

// 时间过滤器选项
const timeFilters = [
  { label: '日', value: 'daily' },
  { label: '周', value: 'weekly' },
  { label: '月', value: 'monthly' },
  { label: '年', value: 'yearly' }
]

// 当前时间过滤器
const currentTimeFilter = ref('daily')

// 图表数据
const chartData = ref([])

// 切换时间过滤器
const changeTimeFilter = (filter) => {
  currentTimeFilter.value = filter
  generateChartData()
}

// 获取图表标题
const getChartTitle = () => {
  const titleMap = {
    daily: '每日统计',
    weekly: '每周统计',
    monthly: '月度统计',
    yearly: '年度统计'
  }
  
  return titleMap[currentTimeFilter.value] || '统计数据'
}

// 生成图表数据
const generateChartData = () => {
  // 根据当前时间过滤器生成不同的图表数据
  const now = new Date()
  
  switch (currentTimeFilter.value) {
    case 'daily':
      // 生成最近7天的数据
      chartData.value = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(now)
        date.setDate(date.getDate() - (6 - index))
        
        return {
          label: date.getDate() + '日',
          value: Math.floor(Math.random() * 50),
          date: dateUtils.formatDate(date)
        }
      })
      break
      
    case 'weekly':
      // 生成最近4周的数据
      chartData.value = Array.from({ length: 4 }).map((_, index) => {
        return {
          label: `第${index + 1}周`,
          value: Math.floor(Math.random() * 50),
        }
      })
      break
      
    case 'monthly':
      // 生成最近6个月的数据
      chartData.value = Array.from({ length: 6 }).map((_, index) => {
        const date = new Date(now)
        date.setMonth(date.getMonth() - (5 - index))
        
        return {
          label: (date.getMonth() + 1) + '月',
          value: Math.floor(Math.random() * 50),
        }
      })
      break
      
    case 'yearly':
      // 生成最近4年的数据
      chartData.value = Array.from({ length: 4 }).map((_, index) => {
        const date = new Date(now)
        date.setFullYear(date.getFullYear() - (3 - index))
        
        return {
          label: date.getFullYear() + '',
          value: Math.floor(Math.random() * 50),
        }
      })
      break
  }
  
  console.log('[Statistics] 生成图表数据', chartData.value)
}

// 统计数据
const totalTasks = ref(0)
const completedTasks = ref(0)
const continuousStreak = ref(0)
const bestStreak = ref(0)
const categoryStats = ref([])

// 完成率
const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

// 加载统计数据
const loadStatisticsData = async () => {
  try {
    console.log('[Statistics] 正在加载统计数据')
    
    // 动态导入模拟数据
    const mockModule = await import('@/mock')
    const { tasks, records, categories } = mockModule.default
    
    // 计算基本统计数据
    totalTasks.value = tasks.length
    
    // 获取今日日期
    const today = dateUtils.getCurrentDateStr()
    
    // 计算已完成任务数量
    const completedTaskIds = new Set()
    records.forEach(record => {
      completedTaskIds.add(record.task)
    })
    completedTasks.value = completedTaskIds.size
    
    // 模拟连续打卡天数
    continuousStreak.value = 7
    bestStreak.value = 15
    
    // 计算分类统计
    const categoryMap = new Map()
    
    // 初始化分类数据
    categories.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: getCategoryColor(category.id),
        total: 0,
        completed: 0,
        completionRate: 0
      })
    })
    
    // 统计任务数量
    tasks.forEach(task => {
      if (categoryMap.has(task.category)) {
        const categoryData = categoryMap.get(task.category)
        categoryData.total++
        
        // 检查任务是否完成
        if (completedTaskIds.has(task.id)) {
          categoryData.completed++
        }
        
        categoryMap.set(task.category, categoryData)
      }
    })
    
    // 计算完成率
    categoryMap.forEach(category => {
      if (category.total > 0) {
        category.completionRate = Math.round((category.completed / category.total) * 100)
      }
    })
    
    // 转换为数组
    categoryStats.value = Array.from(categoryMap.values())
    
    // 按完成率排序
    categoryStats.value.sort((a, b) => b.completionRate - a.completionRate)
    
    console.log('[Statistics] 统计数据加载成功')
  } catch (error) {
    console.error('[Statistics] 加载统计数据失败', error)
  }
}

// 获取分类颜色
const getCategoryColor = (categoryId) => {
  // 模拟分类颜色
  const colorMap = {
    1: 'rgba(76, 175, 80, 0.2)',  // 运动
    2: 'rgba(33, 150, 243, 0.2)',  // 学习
    3: 'rgba(156, 39, 176, 0.2)',  // 阅读
    4: 'rgba(255, 193, 7, 0.2)',   // 冥想
    5: 'rgba(255, 87, 34, 0.2)',   // 记账
    6: 'rgba(0, 188, 212, 0.2)'    // 喝水
  }
  
  return colorMap[categoryId] || 'rgba(158, 158, 158, 0.2)'
}

// 页面加载时获取数据
onMounted(() => {
  loadStatisticsData()
  generateChartData()
})
</script>

<style lang="scss" scoped>
.statistics-container {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--theme-background, #f1f8e9);
}

.overview-card {
  margin-bottom: 20px;
}

.overview-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  
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

.time-filter {
  display: flex;
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  padding: 2px;
  margin: 20px 0;
  box-shadow: $box-shadow;
  
  .filter-item {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    border-radius: $border-radius-md;
    
    .filter-text {
      font-size: 14px;
      color: $color-text-regular;
    }
    
    &.active {
      background-color: var(--theme-primary, #4caf50);
      
      .filter-text {
        color: #ffffff;
        font-weight: 500;
      }
    }
  }
}

.chart-section {
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: $box-shadow;
  
  .chart-header {
    margin-bottom: 20px;
    
    .chart-title {
      font-size: 16px;
      font-weight: 500;
      color: $color-text-primary;
    }
  }
  
  .chart-container {
    height: 200px;
  }
  
  .chart-mock {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    
    .chart-bars {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 90%;
      
      .chart-bar-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        
        .chart-bar {
          width: 20px;
          background-color: var(--theme-primary, #4caf50);
          border-radius: 4px 4px 0 0;
          margin-bottom: 8px;
        }
        
        .chart-label {
          font-size: 12px;
          color: $color-text-secondary;
        }
      }
    }
  }
}

.category-stats {
  margin-bottom: 20px;
  
  .section-header {
    margin-bottom: 12px;
    
    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: $color-text-primary;
    }
  }
}

.category-list {
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  padding: 12px;
  box-shadow: $box-shadow;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid $border-color;
  
  &:last-child {
    border-bottom: none;
  }
  
  .category-info {
    display: flex;
    align-items: center;
    
    .category-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      margin-right: 12px;
      
      .iconfont {
        font-size: 20px;
        color: var(--theme-primary, #4caf50);
      }
    }
    
    .category-name {
      font-size: 14px;
      color: $color-text-primary;
    }
  }
  
  .category-progress {
    display: flex;
    align-items: center;
    
    .progress-bar {
      width: 100px;
      height: 6px;
      background-color: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
      margin-right: 8px;
      
      .progress-fill {
        height: 100%;
        background-color: var(--theme-primary, #4caf50);
        border-radius: 3px;
      }
    }
    
    .progress-text {
      font-size: 12px;
      color: $color-text-secondary;
      min-width: 36px;
      text-align: right;
    }
  }
}
</style> 
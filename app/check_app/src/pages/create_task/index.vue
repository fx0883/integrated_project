<template>
  <view class="create-task-container">
    <!-- 表单内容 -->
    <view class="form-section">
      <!-- 任务标题 -->
      <view class="form-group">
        <text class="form-label">{{ $t('createTask.name') }} <text class="required">*</text></text>
        <input
          class="form-input"
          type="text"
          v-model="taskForm.name"
          :placeholder="$t('createTask.namePlaceholder')"
          maxlength="30"
        />
        <text class="input-count" v-if="taskForm.name">{{ taskForm.name.length }}/30</text>
        <text class="form-error" v-if="errors.name">{{ errors.name }}</text>
      </view>
      
      <!-- 任务描述 -->
      <view class="form-item">
        <text class="form-label">{{ $t('createTask.description') }}</text>
        <textarea 
          class="form-textarea" 
          :placeholder="$t('createTask.descriptionPlaceholder')" 
          v-model="taskForm.description"
        />
      </view>
      
      <!-- 所属类型 -->
      <view class="form-item">
        <text class="form-label">{{ $t('createTask.category') }}</text>
        <picker 
          class="form-picker" 
          mode="selector" 
          :range="categoryOptions" 
          range-key="name"
          :value="categoryIndex"
          @change="onCategoryChange"
        >
          <view class="picker-text" :class="{ 'placeholder': !taskForm.category }">
            {{ getCategoryName() || $t('createTask.selectCategory') }}
          </view>
        </picker>
        <text class="error-text" v-if="errors.category">{{ errors.category }}</text>
      </view>
      
      <!-- 打卡频率 -->
      <view class="form-item">
        <text class="form-label">{{ $t('createTask.frequency') }}</text>
        <view class="frequency-tabs">
          <view 
            v-for="(item, index) in frequencyOptions" 
            :key="index"
            class="frequency-tab"
            :class="{ 'active': taskForm.frequency_type === item.value }"
            @click="onFrequencyChange(item.value)"
          >
            <text class="tab-text">{{ item.label }}</text>
          </view>
        </view>
        
        <!-- 周频率选择 -->
        <view class="week-select" v-if="taskForm.frequency_type === 'weekly'">
          <text class="sub-label">{{ $t('createTask.selectDays') }}</text>
          <view class="week-days">
            <view 
              v-for="(day, index) in weekDays" 
              :key="index"
              class="day-item"
              :class="{ 'selected': isDaySelected(index + 1) }"
              @click="toggleDaySelection(index + 1)"
            >
              <text class="day-text">{{ day }}</text>
            </view>
          </view>
          <text class="error-text" v-if="errors.days">{{ errors.days }}</text>
        </view>
        
        <!-- 月频率选择 -->
        <view class="month-select" v-if="taskForm.frequency_type === 'monthly'">
          <text class="sub-label">{{ $t('createTask.dates') }}</text>
          <view class="month-days">
            <view 
              v-for="day in 31" 
              :key="day"
              class="day-item"
              :class="{ 'selected': isMonthDaySelected(day) }"
              @click="toggleMonthDaySelection(day)"
            >
              <text class="day-text">{{ day }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 起止日期 -->
      <view class="date-row">
        <view class="form-item form-item-half">
          <text class="form-label">{{ $t('createTask.startDate') }}</text>
          <picker 
            class="form-picker" 
            mode="date" 
            :value="taskForm.start_date" 
            @change="onStartDateChange"
          >
            <view class="picker-text" :class="{ 'placeholder': !taskForm.start_date }">
              {{ taskForm.start_date || $t('common.selectDate') }}
            </view>
          </picker>
          <text class="error-text" v-if="errors.start_date">{{ errors.start_date }}</text>
        </view>
        
        <view class="form-item form-item-half">
          <text class="form-label">{{ $t('createTask.endDate') }}</text>
          <picker 
            class="form-picker" 
            mode="date" 
            :value="taskForm.end_date" 
            @change="onEndDateChange"
          >
            <view class="picker-text" :class="{ 'placeholder': !taskForm.end_date }">
              {{ taskForm.end_date || $t('common.selectDate') }}
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 提醒设置 -->
      <view class="form-item">
        <view class="reminder-header">
          <text class="form-label">{{ $t('createTask.reminder') }}</text>
          <switch 
            :checked="taskForm.reminder" 
            @change="onReminderChange" 
            color="var(--theme-primary, #4caf50)"
          />
        </view>
        
        <view class="reminder-time" v-if="taskForm.reminder">
          <text class="sub-label">{{ $t('createTask.reminderTime') }}</text>
          <picker 
            class="form-picker" 
            mode="time" 
            :value="taskForm.reminder_time" 
            @change="onReminderTimeChange"
          >
            <view class="picker-text">
              {{ taskForm.reminder_time || '00:00' }}
            </view>
          </picker>
        </view>
      </view>
    </view>
    
    <!-- 底部操作区 -->
    <view class="bottom-action">
      <button class="submit-btn" @click="submitForm">
        {{ isEdit ? $t('createTask.update') : $t('createTask.create') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dateUtils } from '@/utils'

// 是否是编辑模式
const isEdit = ref(false)

// 周几选项
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

// 任务表单数据
const taskForm = ref({
  name: '',
  description: '',
  category: null,
  start_date: dateUtils.getCurrentDateStr(),
  end_date: '',
  reminder: true,
  reminder_time: '08:00',
  frequency_type: 'daily',
  frequency_days: []
})

// 错误信息
const errors = ref({
  name: '',
  category: '',
  start_date: '',
  days: ''
})

// 分类数据
const categories = ref([])
const categoryIndex = ref(0)

// 频率选项
const frequencyOptions = [
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '自定义', value: 'custom' }
]

// 分类选项
const categoryOptions = computed(() => {
  return categories.value.map(item => ({
    id: item.id,
    name: item.name
  }))
})

// 获取分类名称
const getCategoryName = () => {
  if (!taskForm.value.category) return ''
  
  const category = categories.value.find(item => item.id === taskForm.value.category)
  return category ? category.name : ''
}

// 加载分类数据
const loadCategories = async () => {
  try {
    console.log('[CreateTask] 正在加载分类数据')
    
    // 动态导入模拟数据
    const mockModule = await import('@/mock')
    const { categories: mockCategories } = mockModule.default
    
    // 设置数据
    categories.value = mockCategories
    
    console.log('[CreateTask] 分类数据加载成功', {
      categoryCount: categories.value.length
    })
  } catch (error) {
    console.error('[CreateTask] 加载分类数据失败', error)
  }
}

// 分类选择改变
const onCategoryChange = (e) => {
  const index = e.detail.value
  categoryIndex.value = index
  taskForm.value.category = categories.value[index].id
  
  // 清除错误
  errors.value.category = ''
}

// 频率选择改变
const onFrequencyChange = (value) => {
  taskForm.value.frequency_type = value
  
  // 如果是每天，则清空选择的天数
  if (value === 'daily') {
    taskForm.value.frequency_days = []
  }
}

// 周几选择
const isDaySelected = (day) => {
  return taskForm.value.frequency_days.includes(day)
}

// 切换周几选择
const toggleDaySelection = (day) => {
  const index = taskForm.value.frequency_days.indexOf(day)
  
  if (index === -1) {
    // 添加
    taskForm.value.frequency_days.push(day)
  } else {
    // 移除
    taskForm.value.frequency_days.splice(index, 1)
  }
  
  // 排序
  taskForm.value.frequency_days.sort((a, b) => a - b)
  
  // 清除错误
  errors.value.days = ''
}

// 月日期选择
const isMonthDaySelected = (day) => {
  return taskForm.value.frequency_days.includes(day)
}

// 切换月日期选择
const toggleMonthDaySelection = (day) => {
  const index = taskForm.value.frequency_days.indexOf(day)
  
  if (index === -1) {
    // 添加
    taskForm.value.frequency_days.push(day)
  } else {
    // 移除
    taskForm.value.frequency_days.splice(index, 1)
  }
  
  // 排序
  taskForm.value.frequency_days.sort((a, b) => a - b)
}

// 开始日期改变
const onStartDateChange = (e) => {
  taskForm.value.start_date = e.detail.value
  
  // 清除错误
  errors.value.start_date = ''
}

// 结束日期改变
const onEndDateChange = (e) => {
  taskForm.value.end_date = e.detail.value
}

// 提醒开关改变
const onReminderChange = (e) => {
  taskForm.value.reminder = e.detail.value
}

// 提醒时间改变
const onReminderTimeChange = (e) => {
  taskForm.value.reminder_time = e.detail.value
}

// 表单验证
const validateForm = () => {
  let isValid = true
  
  // 重置错误信息
  errors.value = {
    name: '',
    category: '',
    start_date: '',
    days: ''
  }
  
  // 验证任务名称
  if (!taskForm.value.name.trim()) {
    errors.value.name = '请输入任务名称'
    isValid = false
  }
  
  // 验证分类
  if (!taskForm.value.category) {
    errors.value.category = '请选择所属类型'
    isValid = false
  }
  
  // 验证开始日期
  if (!taskForm.value.start_date) {
    errors.value.start_date = '请选择开始日期'
    isValid = false
  }
  
  // 验证周频率天数
  if (taskForm.value.frequency_type === 'weekly' && taskForm.value.frequency_days.length === 0) {
    errors.value.days = '请选择打卡日期'
    isValid = false
  }
  
  return isValid
}

// 提交表单
const submitForm = () => {
  console.log('[CreateTask] 提交表单', taskForm.value)
  
  // 表单验证
  if (!validateForm()) {
    console.log('[CreateTask] 表单验证失败', errors.value)
    uni.showToast({
      title: '请完善表单信息',
      icon: 'none'
    })
    return
  }
  
  // 模拟提交
  uni.showLoading({
    title: '保存中...'
  })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({
      title: isEdit.value ? '任务更新成功' : '任务创建成功',
      icon: 'success'
    })
    
    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }, 1000)
}

// 获取编辑任务数据
const getEditTaskData = (taskId) => {
  console.log('[CreateTask] 获取编辑任务数据', taskId)
  
  // 模拟请求数据
  uni.showLoading({
    title: '加载中...'
  })
  
  setTimeout(async () => {
    try {
      // 动态导入模拟数据
      const mockModule = await import('@/mock')
      const { tasks: mockTasks } = mockModule.default
      
      // 查找任务
      const task = mockTasks.find(item => item.id === Number(taskId))
      
      if (task) {
        // 设置表单数据
        taskForm.value = {
          name: task.name,
          description: task.description || '',
          category: task.category,
          start_date: task.start_date,
          end_date: task.end_date || '',
          reminder: task.reminder,
          reminder_time: task.reminder_time || '08:00',
          frequency_type: task.frequency_type || 'daily',
          frequency_days: task.frequency_days || []
        }
        
        // 设置分类索引
        const index = categories.value.findIndex(item => item.id === task.category)
        if (index !== -1) {
          categoryIndex.value = index
        }
        
        console.log('[CreateTask] 编辑任务数据获取成功', taskForm.value)
      } else {
        console.error('[CreateTask] 未找到任务', taskId)
        uni.showToast({
          title: '未找到任务',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('[CreateTask] 获取编辑任务数据失败', error)
    } finally {
      uni.hideLoading()
    }
  }, 500)
}

// 页面加载
onMounted(async () => {
  // 加载分类数据
  await loadCategories()
  
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  console.log('[CreateTask] 页面参数', options)
  
  // 如果有任务ID，则是编辑模式
  if (options.id) {
    isEdit.value = true
    getEditTaskData(options.id)
  }
})
</script>

<style lang="scss" scoped>
.create-task-container {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--theme-background, #f1f8e9);
}

.form-section {
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  padding: 20px;
  margin-bottom: 80px;
  box-shadow: $box-shadow;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 16px;
  color: $color-text-primary;
  margin-bottom: 8px;
}

.required {
  color: $color-danger;
}

.form-input, .form-textarea, .form-picker {
  width: 100%;
  padding: 12px;
  background-color: #f9f9f9;
  border: 1px solid $border-color;
  border-radius: $border-radius-md;
  font-size: 16px;
  color: $color-text-primary;
}

.form-textarea {
  height: 80px;
}

.input-count {
  display: block;
  font-size: 14px;
  color: $color-text-regular;
  margin-top: 4px;
}

.form-error {
  color: $color-danger;
  font-size: 12px;
  margin-top: 4px;
}

.date-row {
  display: flex;
  justify-content: space-between;
}

.sub-label {
  display: block;
  font-size: 14px;
  color: $color-text-regular;
  margin: 12px 0 8px;
}

.picker-text {
  color: $color-text-primary;
  
  &.placeholder {
    color: $color-text-placeholder;
  }
}

.frequency-tabs {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -4px;
  
  .frequency-tab {
    margin: 4px;
    padding: 8px 16px;
    background-color: #f0f0f0;
    border-radius: $border-radius-md;
    
    .tab-text {
      font-size: 14px;
      color: $color-text-regular;
    }
    
    &.active {
      background-color: var(--theme-primary, #4caf50);
      
      .tab-text {
        color: #ffffff;
      }
    }
  }
}

.week-days, .month-days {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -4px;
  
  .day-item {
    margin: 4px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .day-text {
      font-size: 14px;
      color: $color-text-regular;
    }
    
    &.selected {
      background-color: var(--theme-primary, #4caf50);
      
      .day-text {
        color: #ffffff;
      }
    }
  }
}

.month-days {
  .day-item {
    margin: 4px;
    width: 36px;
    height: 36px;
  }
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reminder-time {
  margin-top: 12px;
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 20px;
  background-color: #ffffff;
  border-top: 1px solid $border-color;
  z-index: 10;
  
  .submit-btn {
    width: 100%;
    height: 48px;
    line-height: 48px;
    background-color: var(--theme-primary, #4caf50);
    color: #ffffff;
    font-size: 16px;
    font-weight: 500;
    border-radius: $border-radius-md;
  }
}
</style> 
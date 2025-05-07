<template>
  <view class="create-category-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ isEdit ? $t('createCategory.editTitle') : $t('createCategory.title') }}</text>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-content">
      <!-- 类型名称 -->
      <view class="form-item">
        <text class="form-label">{{ $t('createCategory.categoryName') }}</text>
        <input 
          class="form-input" 
          :placeholder="$t('createCategory.categoryNamePlaceholder')" 
          v-model="categoryForm.name"
        />
        <text class="error-text" v-if="errors.name">{{ errors.name }}</text>
      </view>
      
      <!-- 类型描述 -->
      <view class="form-item">
        <text class="form-label">{{ $t('createCategory.description') }}</text>
        <textarea 
          class="form-textarea" 
          :placeholder="$t('createCategory.descriptionPlaceholder')" 
          v-model="categoryForm.description"
        />
      </view>
      
      <!-- 图标选择 -->
      <view class="form-item">
        <text class="form-label">{{ $t('createCategory.icon') }}</text>
        <view class="icon-grid">
          <view 
            v-for="(icon, index) in iconList" 
            :key="index"
            class="icon-item"
            :class="{ 'selected': categoryForm.icon === icon }"
            @click="selectIcon(icon)"
          >
            <text class="iconfont" :class="`icon-${icon}`"></text>
          </view>
        </view>
        <text class="error-text" v-if="errors.icon">{{ errors.icon }}</text>
      </view>
      
      <!-- 颜色选择 -->
      <view class="form-item">
        <text class="form-label">颜色</text>
        <view class="color-grid">
          <view 
            v-for="(color, index) in colorList" 
            :key="index"
            class="color-item"
            :style="{ backgroundColor: color }"
            :class="{ 'selected': categoryForm.color === color }"
            @click="selectColor(color)"
          >
            <text class="iconfont icon-check" v-if="categoryForm.color === color"></text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部操作区 -->
    <view class="bottom-action">
      <button class="submit-btn" @click="submitForm">
        {{ isEdit ? $t('createCategory.update') : $t('createCategory.create') }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 是否是编辑模式
const isEdit = ref(false)

// 分类表单数据
const categoryForm = ref({
  name: '',
  description: '',
  icon: 'medal',
  color: 'rgba(76, 175, 80, 0.2)'
})

// 错误信息
const errors = ref({
  name: '',
  icon: ''
})

// 图标列表（模拟数据）
const iconList = [
  'medal',
  'book',
  'bookmark',
  'heart',
  'water',
  'wallet',
  'run',
  'smile',
  'learn',
  'sleep',
  'food',
  'work',
  'category'
]

// 颜色列表
const colorList = [
  'rgba(76, 175, 80, 0.2)',
  'rgba(33, 150, 243, 0.2)',
  'rgba(156, 39, 176, 0.2)',
  'rgba(255, 193, 7, 0.2)',
  'rgba(255, 87, 34, 0.2)',
  'rgba(0, 188, 212, 0.2)',
  'rgba(233, 30, 99, 0.2)',
  'rgba(63, 81, 181, 0.2)'
]

// 选择图标
const selectIcon = (icon) => {
  categoryForm.value.icon = icon
  errors.value.icon = ''
}

// 选择颜色
const selectColor = (color) => {
  categoryForm.value.color = color
}

// 表单验证
const validateForm = () => {
  let isValid = true
  
  // 重置错误信息
  errors.value = {
    name: '',
    icon: ''
  }
  
  // 验证类型名称
  if (!categoryForm.value.name.trim()) {
    errors.value.name = '请输入类型名称'
    isValid = false
  }
  
  // 验证图标
  if (!categoryForm.value.icon) {
    errors.value.icon = '请选择图标'
    isValid = false
  }
  
  return isValid
}

// 提交表单
const submitForm = () => {
  console.log('[CreateCategory] 提交表单', categoryForm.value)
  
  // 表单验证
  if (!validateForm()) {
    console.log('[CreateCategory] 表单验证失败', errors.value)
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
      title: isEdit.value ? '类型更新成功' : '类型创建成功',
      icon: 'success'
    })
    
    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }, 1000)
}

// 获取编辑类型数据
const getEditCategoryData = (categoryId) => {
  console.log('[CreateCategory] 获取编辑类型数据', categoryId)
  
  // 模拟请求数据
  uni.showLoading({
    title: '加载中...'
  })
  
  setTimeout(async () => {
    try {
      // 动态导入模拟数据
      const mockModule = await import('@/mock')
      const { categories: mockCategories } = mockModule.default
      
      // 查找分类
      const category = mockCategories.find(item => item.id === Number(categoryId))
      
      if (category) {
        // 设置表单数据
        categoryForm.value = {
          name: category.name,
          description: category.description || '',
          icon: category.icon || 'medal',
          color: getColorForCategory(category.id)
        }
        
        console.log('[CreateCategory] 编辑类型数据获取成功', categoryForm.value)
      } else {
        console.error('[CreateCategory] 未找到类型', categoryId)
        uni.showToast({
          title: '未找到类型',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('[CreateCategory] 获取编辑类型数据失败', error)
    } finally {
      uni.hideLoading()
    }
  }, 500)
}

// 获取分类颜色
const getColorForCategory = (categoryId) => {
  // 模拟分类颜色
  const colorMap = {
    1: 'rgba(76, 175, 80, 0.2)',  // 运动
    2: 'rgba(33, 150, 243, 0.2)',  // 学习
    3: 'rgba(156, 39, 176, 0.2)',  // 阅读
    4: 'rgba(255, 193, 7, 0.2)',   // 冥想
    5: 'rgba(255, 87, 34, 0.2)',   // 记账
    6: 'rgba(0, 188, 212, 0.2)'    // 喝水
  }
  
  return colorMap[categoryId] || 'rgba(76, 175, 80, 0.2)'
}

// 页面加载
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  console.log('[CreateCategory] 页面参数', options)
  
  // 如果有分类ID，则是编辑模式
  if (options.id) {
    isEdit.value = true
    getEditCategoryData(options.id)
  }
})
</script>

<style lang="scss" scoped>
.create-category-container {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--theme-background, #f1f8e9);
}

.page-header {
  margin-bottom: 20px;
  
  .page-title {
    font-size: 24px;
    font-weight: bold;
    color: $color-text-primary;
  }
}

.form-content {
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  padding: 20px;
  margin-bottom: 80px;
  box-shadow: $box-shadow;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 16px;
  color: $color-text-primary;
  margin-bottom: 8px;
}

.form-input, .form-textarea {
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

.error-text {
  color: $color-danger;
  font-size: 12px;
  margin-top: 4px;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
  
  .icon-item {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 8px;
    background-color: #f0f0f0;
    border-radius: $border-radius-md;
    transition: all 0.3s;
    
    .iconfont {
      font-size: 26px;
      color: $color-text-regular;
    }
    
    &.selected {
      background-color: var(--theme-primary, #4caf50);
      
      .iconfont {
        color: #ffffff;
      }
    }
    
    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
  }
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
  
  .color-item {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 8px;
    border-radius: $border-radius-md;
    transition: all 0.3s;
    border: 2px solid transparent;
    
    .iconfont {
      font-size: 26px;
      color: rgba(0, 0, 0, 0.7);
    }
    
    &.selected {
      border-color: var(--theme-primary, #4caf50);
    }
    
    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
  }
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
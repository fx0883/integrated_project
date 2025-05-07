<template>
  <view class="categories-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">{{ $t('categories.all') }}</text>
      <view class="add-button" @click="navigateToCreateCategory">
        <text class="iconfont icon-add"></text>
      </view>
    </view>
    
    <!-- 类型筛选切换 -->
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
    
    <!-- 类型列表 -->
    <view class="category-list" v-if="filteredCategories.length > 0">
      <view 
        class="category-card" 
        v-for="category in filteredCategories" 
        :key="category.id"
        @click="handleCategoryClick(category)"
      >
        <view class="category-icon" :style="{ backgroundColor: getCategoryColor(category.id) }">
          <text class="iconfont" :class="`icon-${category.icon || 'category'}`"></text>
        </view>
        <view class="category-info">
          <text class="category-name">{{ category.name }}</text>
          <text class="category-desc" v-if="category.description">{{ category.description }}</text>
        </view>
        <view class="category-actions">
          <text class="iconfont icon-arrow"></text>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-icon">
        <text class="iconfont icon-empty"></text>
      </view>
      <text class="empty-text">{{ $t('categories.noCategories') }}</text>
      <button class="add-category-btn" @click="navigateToCreateCategory">{{ $t('categories.addCategory') }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 过滤标签
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '系统', value: 'system' },
  { label: '自定义', value: 'custom' }
]

// 当前过滤条件
const currentFilter = ref('all')

// 分类数据
const categories = ref([])

// 根据过滤条件筛选类型
const filteredCategories = computed(() => {
  switch (currentFilter.value) {
    case 'system':
      return categories.value.filter(category => category.is_system)
    
    case 'custom':
      return categories.value.filter(category => !category.is_system)
    
    case 'all':
    default:
      return categories.value
  }
})

// 更改过滤条件
const changeFilter = (filter) => {
  currentFilter.value = filter
}

// 导航到创建分类页面
const navigateToCreateCategory = () => {
  console.log('[Categories] 导航到创建分类页面')
  uni.navigateTo({
    url: '/pages/create_category/index'
  })
}

// 点击分类时的处理
const handleCategoryClick = (category) => {
  console.log('[Categories] 点击分类', category.name)
  
  uni.navigateTo({
    url: `/pages/create_category/index?id=${category.id}`
  })
}

// 加载分类数据
const loadCategoryData = async () => {
  try {
    console.log('[Categories] 正在加载分类数据')
    
    // 动态导入模拟数据
    const mockModule = await import('@/mock')
    const { categories: mockCategories } = mockModule.default
    
    // 设置数据
    categories.value = mockCategories
    
    console.log('[Categories] 分类数据加载成功', {
      categoryCount: categories.value.length
    })
  } catch (error) {
    console.error('[Categories] 加载分类数据失败', error)
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

// 下拉刷新处理
const onPullDownRefresh = () => {
  console.log('[Categories] 下拉刷新')
  loadCategoryData().then(() => {
    uni.stopPullDownRefresh()
  })
}

// 页面加载时获取数据
onMounted(() => {
  loadCategoryData()
})
</script>

<style lang="scss" scoped>
.categories-container {
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

.category-list {
  display: flex;
  flex-direction: column;
}

.category-card {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: $border-radius-md;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: $box-shadow;
  
  &:active {
    opacity: 0.8;
  }
  
  .category-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    
    .iconfont {
      font-size: 24px;
      color: var(--theme-primary, #4caf50);
    }
  }
  
  .category-info {
    flex: 1;
  }
  
  .category-name {
    font-size: 16px;
    font-weight: 500;
    color: $color-text-primary;
    margin-bottom: 4px;
  }
  
  .category-desc {
    font-size: 12px;
    color: $color-text-secondary;
  }
  
  .category-actions {
    .iconfont {
      font-size: 20px;
      color: $color-text-placeholder;
    }
  }
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
  
  .add-category-btn {
    padding: 10px 20px;
    background-color: var(--theme-primary, #4caf50);
    color: #ffffff;
    border-radius: $border-radius-md;
    font-size: 14px;
  }
}
</style>
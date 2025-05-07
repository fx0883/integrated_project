<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image class="avatar" :src="userInfo.avatar || '/static/avatar/default.png'" mode="aspectFill" />
        <view class="user-details">
          <text class="username">{{ userInfo.nick_name || userInfo.username }}</text>
          <text class="user-meta">{{ userInfo.email }}</text>
        </view>
      </view>
      <view class="edit-profile" @click="navigateTo('/pages/profile/edit')">
        <text class="iconfont icon-edit"></text>
      </view>
    </view>
    
    <!-- 活动概览 -->
    <view class="activity-overview">
      <view class="stat-item">
        <text class="stat-number">{{ stats.tasks }}</text>
        <text class="stat-label">任务</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ stats.continueStreak }}</text>
        <text class="stat-label">连续打卡</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ stats.completionRate }}%</text>
        <text class="stat-label">完成率</text>
      </view>
    </view>
    
    <!-- 子账号部分 -->
    <view class="section sub-accounts-section" v-if="subAccounts.length > 0">
      <view class="section-header">
        <text class="section-title">{{ $t('profile.childAccounts') }}</text>
        <text class="section-action" @click="navigateTo('/pages/profile/add_sub_account')">
          {{ $t('profile.addChildAccount') }}
        </text>
      </view>
      
      <view class="sub-account-list">
        <view 
          class="sub-account-item" 
          v-for="account in subAccounts" 
          :key="account.id"
          @click="switchAccount(account)"
        >
          <image class="sub-avatar" :src="account.avatar" mode="aspectFill" />
          <text class="sub-name">{{ account.nick_name }}</text>
          <text class="iconfont icon-arrow"></text>
        </view>
      </view>
    </view>
    
    <!-- 添加子账号提示 -->
    <view class="section add-sub-hint" v-else>
      <view class="hint-content" @click="navigateTo('/pages/profile/add_sub_account')">
        <text class="hint-icon iconfont icon-add"></text>
        <view class="hint-text">
          <text class="hint-title">{{ $t('profile.addChildAccount') }}</text>
          <text class="hint-desc">{{ $t('profile.childAccountDesc') }}</text>
        </view>
      </view>
    </view>
    
    <!-- 设置选项 -->
    <view class="section settings-section">
      <view class="section-header">
        <text class="section-title">{{ $t('profile.settings') }}</text>
      </view>
      
      <view class="settings-list">
        <view class="setting-item" @click="navigateTo('/pages/profile/theme_settings')">
          <view class="setting-left">
            <text class="setting-icon theme-icon"></text>
            <text class="setting-name">{{ $t('profile.themeSettings') }}</text>
          </view>
          <text class="setting-value">{{ currentThemeName }}</text>
          <text class="iconfont icon-arrow"></text>
        </view>
        
        <view class="setting-item" @click="navigateTo('/pages/profile/account_settings')">
          <view class="setting-left">
            <text class="setting-icon account-icon"></text>
            <text class="setting-name">{{ $t('profile.accountSettings') }}</text>
          </view>
          <text class="iconfont icon-arrow"></text>
        </view>
        
        <view class="setting-item" @click="navigateTo('/pages/profile/notification_settings')">
          <view class="setting-left">
            <text class="setting-icon notification-icon"></text>
            <text class="setting-name">{{ $t('profile.notificationSettings') }}</text>
          </view>
          <text class="iconfont icon-arrow"></text>
        </view>
        
        <view class="setting-item" @click="navigateTo('/pages/profile/privacy_settings')">
          <view class="setting-left">
            <text class="setting-icon privacy-icon"></text>
            <text class="setting-name">{{ $t('profile.privacySettings') }}</text>
          </view>
          <text class="iconfont icon-arrow"></text>
        </view>
      </view>
    </view>
    
    <!-- 关于和帮助 -->
    <view class="section about-section">
      <view class="settings-list">
        <view class="setting-item" @click="navigateTo('/pages/profile/about_us')">
          <view class="setting-left">
            <text class="setting-icon about-icon"></text>
            <text class="setting-name">{{ $t('profile.aboutUs') }}</text>
          </view>
          <text class="iconfont icon-arrow"></text>
        </view>
        
        <view class="setting-item" @click="navigateTo('/pages/profile/help_center')">
          <view class="setting-left">
            <text class="setting-icon help-icon"></text>
            <text class="setting-name">{{ $t('profile.helpCenter') }}</text>
          </view>
          <text class="iconfont icon-arrow"></text>
        </view>
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <view class="logout-button" @click="handleLogout">
      <text>{{ $t('profile.logOut') }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'

// 状态管理
const userStore = useUserStore()
const themeStore = useThemeStore()

// 用户信息
const userInfo = computed(() => userStore.userInfo || {})

// 子账号列表
const subAccounts = computed(() => userStore.childAccounts || [])

// 当前主题名称
const currentThemeName = computed(() => themeStore.themeTitle)

// 统计数据
const stats = ref({
  tasks: 0,
  continueStreak: 0,
  completionRate: 0
})

// 加载统计数据
const loadStats = async () => {
  try {
    // 动态导入模拟数据
    const mockModule = await import('@/mock')
    const { tasks, records } = mockModule.default
    
    // 获取当前用户的任务
    const userTasks = tasks.filter(task => task.user === userInfo.value.id)
    
    // 获取当前用户的记录
    const userRecords = records.filter(record => record.user === userInfo.value.id)
    
    // 计算任务数量
    stats.value.tasks = userTasks.length
    
    // 模拟连续打卡天数
    stats.value.continueStreak = 7
    
    // 计算任务完成率
    const completedTaskIds = new Set()
    userRecords.forEach(record => {
      completedTaskIds.add(record.task)
    })
    
    // 计算完成率
    if (userTasks.length > 0) {
      const completedTasks = userTasks.filter(task => completedTaskIds.has(task.id)).length
      stats.value.completionRate = Math.round((completedTasks / userTasks.length) * 100)
    } else {
      stats.value.completionRate = 0
    }
    
    console.log('[Profile] 统计数据加载成功', stats.value)
  } catch (error) {
    console.error('[Profile] 加载统计数据失败', error)
  }
}

// 导航到指定页面
const navigateTo = (url) => {
  console.log('[Profile] 导航到', url)
  uni.navigateTo({
    url
  })
}

// 切换账号
const switchAccount = (account) => {
  console.log('[Profile] 切换到子账号', account.nick_name)
  
  uni.showToast({
    title: `已切换到 ${account.nick_name} 的账号`,
    icon: 'none'
  })
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        console.log('[Profile] 退出登录')
        
        // 退出登录
        userStore.logout()
        
        // 跳转到登录页
        uni.reLaunch({
          url: '/pages/login/index'
        })
      }
    }
  })
}

// 页面加载
onMounted(() => {
  // 确保用户信息已加载
  if (!userStore.isLoggedIn) {
    userStore.init()
  }
  
  // 加载统计数据
  loadStats()
})
</script>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  padding: 20px;
  background-color: var(--theme-background, #f1f8e9);
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: $box-shadow;
  
  .user-info {
    display: flex;
    align-items: center;
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-right: 16px;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
  }
  
  .username {
    font-size: 18px;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: 4px;
  }
  
  .user-meta {
    font-size: 14px;
    color: $color-text-secondary;
  }
  
  .edit-profile {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .iconfont {
      font-size: 20px;
      color: $color-text-secondary;
    }
  }
}

.activity-overview {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: $box-shadow;
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-number {
    font-size: 20px;
    font-weight: 600;
    color: var(--theme-primary, #4caf50);
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 12px;
    color: $color-text-secondary;
  }
  
  .stat-divider {
    width: 1px;
    height: 30px;
    background-color: $border-color;
  }
}

.section {
  margin-bottom: 20px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: $color-text-primary;
    }
    
    .section-action {
      font-size: 14px;
      color: var(--theme-primary, #4caf50);
    }
  }
}

.sub-account-list {
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $box-shadow;
  
  .sub-account-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid $border-color;
    
    &:last-child {
      border-bottom: none;
    }
    
    .sub-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      margin-right: 12px;
    }
    
    .sub-name {
      flex: 1;
      font-size: 16px;
      color: $color-text-primary;
    }
    
    .iconfont {
      font-size: 16px;
      color: $color-text-secondary;
    }
  }
}

.add-sub-hint {
  .hint-content {
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border-radius: $border-radius-lg;
    padding: 16px;
    box-shadow: $box-shadow;
    
    .hint-icon {
      width: 40px;
      height: 40px;
      background-color: rgba(var(--theme-primary, #4caf50), 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--theme-primary, #4caf50);
      margin-right: 12px;
    }
    
    .hint-text {
      flex: 1;
    }
    
    .hint-title {
      font-size: 16px;
      font-weight: 500;
      color: $color-text-primary;
      margin-bottom: 4px;
    }
    
    .hint-desc {
      font-size: 12px;
      color: $color-text-secondary;
    }
  }
}

.settings-list {
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $box-shadow;
  
  .setting-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid $border-color;
    
    &:last-child {
      border-bottom: none;
    }
    
    .setting-left {
      display: flex;
      align-items: center;
      flex: 1;
    }
    
    .setting-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #ffffff;
      
      &.theme-icon {
        background-color: #4caf50;
      }
      
      &.account-icon {
        background-color: #2196f3;
      }
      
      &.notification-icon {
        background-color: #ff9800;
      }
      
      &.privacy-icon {
        background-color: #9c27b0;
      }
      
      &.about-icon {
        background-color: #795548;
      }
      
      &.help-icon {
        background-color: #607d8b;
      }
    }
    
    .setting-name {
      font-size: 16px;
      color: $color-text-primary;
    }
    
    .setting-value {
      font-size: 14px;
      color: $color-text-secondary;
      margin-right: 8px;
    }
    
    .iconfont {
      font-size: 16px;
      color: $color-text-secondary;
    }
  }
}

.logout-button {
  margin-top: 40px;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border-radius: $border-radius-lg;
  font-size: 16px;
  color: $color-danger;
  box-shadow: $box-shadow;
}
</style> 
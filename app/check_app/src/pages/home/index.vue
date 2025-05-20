<template>
  <view class="h-full">
    <!-- 主内容区 -->
    <scroll-view scroll-y class="p-5 pb-24" style="height: calc(100% - 83px);">
      <!-- 顶部信息 -->
      <view class="flex justify-between items-center mb-6">
        <view>
          <view class="text-2xl font-bold">你好，李明</view>
          <view class="text-gray-500">今天是继续保持的一天！</view>
        </view>
        <view class="w-12 h-12 rounded-full bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')"></view>
      </view>
      
      <!-- 数据概览卡片 -->
      <view class="welcome-card p-5 mb-6 bubble-animation">
        <view class="flex justify-between items-center mb-4">
          <view class="text-lg font-semibold">本周数据</view>
          <text class="fas fa-chart-line"></text>
        </view>
        <view class="flex justify-between">
          <view class="text-center">
            <view class="text-3xl font-bold">85%</view>
            <view class="text-sm opacity-80">完成率</view>
          </view>
          <view class="text-center">
            <view class="text-3xl font-bold">17</view>
            <view class="text-sm opacity-80">已完成</view>
          </view>
          <view class="text-center">
            <view class="text-3xl font-bold">3</view>
            <view class="text-sm opacity-80">待完成</view>
          </view>
        </view>
      </view>
      
      <!-- 今日待打卡任务 -->
      <view class="mb-6">
        <view class="flex justify-between items-center mb-4">
          <view class="text-lg font-semibold">今日待打卡</view>
          <view class="text-green-500" @click="navigateToTasks">查看全部 <text class="fas fa-chevron-right text-xs"></text></view>
        </view>
        
        <!-- 任务列表 -->
        <view class="space-y-3">
          <!-- 任务1 -->
          <view class="task-card p-4 flex items-center justify-between shadow-sm">
            <view class="flex items-center">
              <view class="task-checkbox w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center mr-3" @click="completeTask">
                <text class="fas fa-check text-white opacity-0"></text>
              </view>
              <view>
                <view class="font-medium">晨间冥想</view>
                <view class="text-xs text-gray-500">习惯养成 · 20分钟</view>
              </view>
            </view>
            <view class="bg-green-100 text-green-600 text-xs rounded-full px-2 py-1">
              9:00
            </view>
          </view>
          
          <!-- 任务2 -->
          <view class="task-card p-4 flex items-center justify-between shadow-sm">
            <view class="flex items-center">
              <view class="task-checkbox w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center mr-3" @click="completeTask">
                <text class="fas fa-check text-white opacity-0"></text>
              </view>
              <view>
                <view class="font-medium">阅读专业书籍</view>
                <view class="text-xs text-gray-500">学习提升 · 45分钟</view>
              </view>
            </view>
            <view class="bg-green-100 text-green-600 text-xs rounded-full px-2 py-1">
              14:00
            </view>
          </view>
          
          <!-- 任务3 已完成 -->
          <view class="task-card p-4 flex items-center justify-between shadow-sm bg-gray-50">
            <view class="flex items-center">
              <view class="task-checkbox checked w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
                <text class="fas fa-check text-white"></text>
              </view>
              <view>
                <view class="font-medium text-gray-500">晨跑5公里</view>
                <view class="text-xs text-gray-400">健康运动 · 30分钟</view>
              </view>
            </view>
            <view class="bg-green-100 text-green-600 text-xs rounded-full px-2 py-1">
              已完成
            </view>
          </view>
        </view>
      </view>
      
      <!-- 打卡时间轴 -->
      <view class="mb-6">
        <view class="flex justify-between items-center mb-4">
          <view class="text-lg font-semibold">打卡时间轴</view>
          <view class="text-green-500" @click="navigateToRecords">查看更多 <text class="fas fa-chevron-right text-xs"></text></view>
        </view>
        
        <!-- 时间轴标签页 -->
        <view class="timeline-tabs">
          <view class="timeline-tab active" data-view="today" @click="switchTimelineTab">今日</view>
          <view class="timeline-tab" data-view="week" @click="switchTimelineTab">本周</view>
          <view class="timeline-tab" data-view="month" @click="switchTimelineTab">本月</view>
        </view>
        
        <!-- 时间轴内容 -->
        <view class="timeline-container">
          <view class="timeline-line"></view>
          
          <!-- 未来事件 -->
          <view class="timeline-item">
            <view class="timeline-dot empty"></view>
            <view class="timeline-content">
              <view class="timeline-date">16:00</view>
              <view class="flex justify-between items-center">
                <view>
                  <view class="font-medium">瑜伽训练</view>
                  <view class="text-xs text-gray-500">健康 · 45分钟</view>
                </view>
                <view class="text-xs text-gray-400">未开始</view>
              </view>
            </view>
          </view>
          
          <!-- 当前事件 -->
          <view class="timeline-item">
            <view class="timeline-dot current"></view>
            <view class="timeline-content">
              <view class="timeline-date">14:00 - 现在</view>
              <view class="flex justify-between items-center">
                <view>
                  <view class="font-medium">阅读专业书籍</view>
                  <view class="text-xs text-gray-500">学习 · 45分钟</view>
                </view>
                <view class="bg-yellow-100 text-yellow-600 text-xs rounded-full px-2 py-1">
                  进行中
                </view>
              </view>
              <view class="mt-2">
                <view class="task-progress">
                  <view class="progress-bar green-bar" style="width: 62%"></view>
                </view>
                <view class="flex justify-between mt-1">
                  <text class="text-xs text-gray-500">已完成 28分钟</text>
                  <text class="text-xs text-gray-500">62%</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 已完成事件 -->
          <view class="timeline-item">
            <view class="timeline-dot"></view>
            <view class="timeline-content">
              <view class="timeline-date">9:00 - 9:20</view>
              <view class="flex justify-between items-center">
                <view>
                  <view class="font-medium">晨间冥想</view>
                  <view class="text-xs text-gray-500">习惯养成 · 20分钟</view>
                </view>
                <view class="bg-green-100 text-green-600 text-xs rounded-full px-2 py-1">
                  已完成
                </view>
              </view>
            </view>
          </view>
          
          <!-- 已完成事件 -->
          <view class="timeline-item">
            <view class="timeline-dot"></view>
            <view class="timeline-content">
              <view class="timeline-date">7:30 - 8:00</view>
              <view class="flex justify-between items-center">
                <view>
                  <view class="font-medium">晨跑5公里</view>
                  <view class="text-xs text-gray-500">健康运动 · 30分钟</view>
                </view>
                <view class="bg-green-100 text-green-600 text-xs rounded-full px-2 py-1">
                  已完成
                </view>
              </view>
              <view class="text-sm text-gray-600 mt-2">今天跑了5.2公里，状态不错！保持下去！</view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 最近打卡动态 -->
      <view>
        <view class="flex justify-between items-center mb-4">
          <view class="text-lg font-semibold">最近打卡动态</view>
          <view class="text-green-500" @click="navigateToFeeds">更多 <text class="fas fa-chevron-right text-xs"></text></view>
        </view>
        
        <!-- 动态列表 -->
        <view class="space-y-4">
          <!-- 动态1 -->
          <view class="task-card p-4 shadow-sm">
            <view class="flex items-start mb-2">
              <view class="w-10 h-10 rounded-full bg-cover bg-center mr-3" style="background-image: url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')"></view>
              <view>
                <view class="font-medium">李明</view>
                <view class="text-xs text-gray-500">完成了 晨跑5公里 · 30分钟前</view>
              </view>
            </view>
            <view class="text-sm text-gray-600">今天跑了5.2公里，状态不错！保持下去！</view>
          </view>
          
          <!-- 动态2 -->
          <view class="task-card p-4 shadow-sm">
            <view class="flex items-start mb-2">
              <view class="w-10 h-10 rounded-full bg-cover bg-center mr-3" style="background-image: url('https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')"></view>
              <view>
                <view class="font-medium">王芳</view>
                <view class="text-xs text-gray-500">完成了 每日阅读 · 2小时前</view>
              </view>
            </view>
            <view class="text-sm text-gray-600">今天读完了《原子习惯》第三章，很有收获！</view>
          </view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 底部导航栏 -->
    <view class="tab-bar fixed bottom-0 left-0 right-0 flex justify-around">
      <view class="tab-item active">
        <text class="fas fa-home text-xl"></text>
        <text class="text-xs mt-1">首页</text>
      </view>
      <view class="tab-item" @click="navigateToTasks">
        <text class="fas fa-tasks text-xl"></text>
        <text class="text-xs mt-1">任务</text>
      </view>
      <view class="tab-item" @click="navigateToCreateTask">
        <view class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
          <text class="fas fa-plus"></text>
        </view>
      </view>
      <view class="tab-item" @click="navigateToStats">
        <text class="fas fa-chart-bar text-xl"></text>
        <text class="text-xs mt-1">统计</text>
      </view>
      <view class="tab-item" @click="navigateToProfile">
        <text class="fas fa-user text-xl"></text>
        <text class="text-xs mt-1">我的</text>
      </view>
    </view>
    
    <!-- 评论对话框 -->
    <view class="overlay" :class="{ 'active': showCommentDialog }" @click="closeCommentDialog"></view>
    <view class="comment-dialog" :class="{ 'active': showCommentDialog }">
      <view class="text-lg font-bold mb-2">打卡感想</view>
      <view class="text-gray-600 mb-3">恭喜完成"{{ currentTask }}"！记录一下今天的感想吧~</view>
      <textarea class="comment-input mb-4" placeholder="写下你的感想..." v-model="commentText"></textarea>
      <view class="flex justify-end space-x-3">
        <button class="px-4 py-2 rounded-lg bg-gray-100 text-gray-700" @click="closeCommentDialog">取消</button>
        <button class="px-4 py-2 rounded-lg bg-green-500 text-white" @click="submitComment">提交</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      showCommentDialog: false,
      currentTask: '',
      commentText: '',
      activeTimelineTab: 'today'
    }
  },
  onLoad() {
    console.log('Home页面加载')
    // 在这里可以进行初始化操作，例如获取用户数据、任务列表等
  },
  methods: {
    // 导航到任务页面
    navigateToTasks() {
      console.log('跳转到任务页面')
      uni.navigateTo({
        url: '/pages/tasks/index'
      })
    },
    
    // 导航到创建任务页面
    navigateToCreateTask() {
      console.log('跳转到创建任务页面')
      uni.navigateTo({
        url: '/pages/create_task/index'
      })
    },
    
    // 导航到打卡记录页面
    navigateToRecords() {
      console.log('跳转到打卡记录页面')
      uni.navigateTo({
        url: '/pages/records/index'
      })
    },
    
    // 导航到动态页面
    navigateToFeeds() {
      console.log('跳转到动态页面')
      uni.navigateTo({
        url: '/pages/feeds/index'
      })
    },
    
    // 导航到统计页面
    navigateToStats() {
      console.log('跳转到统计页面')
      uni.switchTab({
        url: '/pages/statistics/index'
      })
    },
    
    // 导航到个人中心页面
    navigateToProfile() {
      console.log('跳转到个人中心页面')
      uni.switchTab({
        url: '/pages/profile/index'
      })
    },
    
    // 完成任务
    completeTask(event) {
      console.log('完成任务')
      const checkbox = event.currentTarget
      const taskName = checkbox.nextElementSibling.querySelector('.font-medium').innerText
      
      // 更新UI
      checkbox.classList.add('checked')
      checkbox.classList.remove('border-2', 'border-green-500')
      checkbox.classList.add('bg-green-500')
      checkbox.querySelector('.fas').style.opacity = '1'
      
      const taskCard = checkbox.closest('.task-card')
      taskCard.style.backgroundColor = '#f9fafb'
      taskCard.querySelector('.font-medium').classList.add('text-gray-500')
      taskCard.querySelector('.text-xs').classList.add('text-gray-400')
      
      // 更新任务状态
      const statusEl = taskCard.querySelector('view:last-child')
      statusEl.className = 'bg-green-100 text-green-600 text-xs rounded-full px-2 py-1'
      statusEl.innerText = '已完成'
      
      // 显示评论对话框
      this.showCommentDialog = true
      this.currentTask = taskName
      
      // 更新时间轴
      this.updateTimeline(taskName)
    },
    
    // 关闭评论对话框
    closeCommentDialog() {
      console.log('关闭评论对话框')
      this.showCommentDialog = false
      this.commentText = ''
    },
    
    // 提交评论
    submitComment() {
      console.log('提交评论:', this.commentText)
      
      if (this.commentText.trim()) {
        // 在动态列表中添加评论
        this.addCommentToFeed(this.currentTask, this.commentText)
        
        // 在时间轴中添加评论
        this.addCommentToTimeline(this.currentTask, this.commentText)
      }
      
      // 关闭对话框
      this.closeCommentDialog()
    },
    
    // 添加评论到动态流
    addCommentToFeed(taskName, commentText) {
      console.log('添加评论到动态流:', taskName, commentText)
      // 实际应用中，这里会调用API保存评论并更新UI
      // 这里仅作为演示，将评论添加到页面上
    },
    
    // 添加评论到时间轴
    addCommentToTimeline(taskName, commentText) {
      console.log('添加评论到时间轴:', taskName, commentText)
      // 实际应用中，这里会调用API保存评论并更新UI
    },
    
    // 更新时间轴
    updateTimeline(taskName) {
      console.log('更新时间轴:', taskName)
      // 获取当前时间
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const timeStr = `${hours}:${minutes}`
      
      // 实际应用中，这里会调用API保存打卡记录并更新UI
    },
    
    // 切换时间轴标签页
    switchTimelineTab(event) {
      const view = event.currentTarget.dataset.view
      console.log('切换时间轴视图:', view)
      
      // 移除所有标签页的active类
      const tabs = document.querySelectorAll('.timeline-tab')
      tabs.forEach(tab => {
        tab.classList.remove('active')
      })
      
      // 给当前标签页添加active类
      event.currentTarget.classList.add('active')
      
      this.activeTimelineTab = view
      // 在实际应用中，这里会根据选择的视图加载不同的时间轴数据
    }
  }
}
</script>

<style>
/* 导入CSS文件已移至App.vue全局导入 */
/* 全局样式在App.vue中定义 */

/* 组件特有样式 */
/* 状态栏样式 */
.status-bar {
  height: 44px;
  background-color: #f0fdf4;
  border-bottom: 1px solid #dcfce7;
}

/* 底部标签栏样式 */
.tab-bar {
  height: 83px;
  border-top: 1px solid #dcfce7;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  z-index: 9999;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  transition: color 0.2s;
}

.tab-item.active {
  color: #22c55e;
}

/* 欢迎卡片样式 */
.welcome-card {
  border-radius: 16px;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
}

/* 任务卡片样式 */
.task-card {
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.task-card:active {
  transform: scale(0.98);
}

/* 任务进度条样式 */
.task-progress {
  width: 100%;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.green-bar {
  background-color: #22c55e;
}

/* 时间轴样式 */
.timeline-container {
  position: relative;
  margin: 20px 0;
}

.timeline-line {
  position: absolute;
  left: 14px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #dcfce7;
  z-index: 1;
}

.timeline-item {
  position: relative;
  padding-left: 40px;
  margin-bottom: 16px;
  z-index: 2;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: 5px;
  top: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #22c55e;
  border: 4px solid #f0fdf4;
  z-index: 3;
}

.timeline-dot.empty {
  background-color: #f0fdf4;
  border: 2px solid #22c55e;
}

.timeline-dot.current {
  background-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
  animation: pulse 2s infinite;
}

.timeline-content {
  background-color: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.timeline-date {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
  margin-bottom: 4px;
}

.timeline-tabs {
  display: flex;
  border-radius: 12px;
  background-color: #f0fdf4;
  padding: 3px;
  margin-bottom: 16px;
}

.timeline-tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #6b7280;
  border-radius: 10px;
}

.timeline-tab.active {
  background-color: #22c55e;
  color: white;
  font-weight: 500;
}

/* 评论对话框样式 */
.comment-dialog {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  border-radius: 24px 24px 0 0;
  padding: 20px;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.comment-dialog.active {
  transform: translateY(0);
}

.overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: 50;
}

.overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.comment-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  height: 100px;
  outline: none;
  font-size: 16px;
  transition: border-color 0.2s;
}

.comment-input:focus {
  border-color: #4ade80;
}

/* 气泡动画 */
.bubble-animation {
  animation: bubble 2s infinite;
}

@keyframes bubble {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}
</style> 
<template>
  <view class="app-container">
    <!-- 页面内容将在这里渲染 -->
  </view>
</template>

<script>
export default {
  onLaunch() {
    console.log('App Launch')
    // 初始化工作，如读取本地存储的主题、语言等
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 引入全局样式变量 */
@import './uni.scss';

/* 全局样式 */
view, text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.app-container {
  width: 100%;
  min-height: 100vh;
}
</style>

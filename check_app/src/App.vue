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

<style>

@import './assets/css/tailwind.min.css';
/* 替换旧的fontawesome引用为自定义fontawesome CSS */
/* @import './assets/css/fontawesome.min.css'; */
@import './assets/css/font-awesome-custom.css';
/* 也可以直接引入node_modules中的CSS文件 */
/* @import '~@fortawesome/fontawesome-free/css/all.min.css'; */

/* 全局样式 */
view, text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f0fdf4;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}
</style>

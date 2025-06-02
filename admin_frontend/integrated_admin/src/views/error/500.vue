<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-code">500</div>
      <div class="error-title">服务器内部错误</div>
      <div class="error-desc">抱歉，服务器出现了问题，请稍后再试</div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="reload">刷新页面</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const reload = () => {
  window.location.reload()
}
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 500px;
  background-color: #f5f7fa;
}

.error-container {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #f56c6c;
  line-height: 1.2;
  margin-bottom: 20px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 28px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 15px;
}

.error-desc {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 22px;
  }
  
  .error-desc {
    font-size: 14px;
  }
}
</style> 
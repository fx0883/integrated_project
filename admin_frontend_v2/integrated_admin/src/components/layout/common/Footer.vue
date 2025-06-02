<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-copyright">
        © {{ currentYear }} 集成管理系统. 保留所有权利
      </div>
      <div class="footer-links">
        <router-link to="/about" class="footer-link">关于我们</router-link>
        <router-link to="/privacy" class="footer-link">隐私政策</router-link>
        <router-link to="/terms" class="footer-link">使用条款</router-link>
        <router-link to="/help" class="footer-link">帮助中心</router-link>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.app-footer {
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid #E8ECF4;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.footer-copyright {
  font-size: 14px;
  color: #6E7687;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-link {
  font-size: 14px;
  color: #0abab5;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #099490;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-links {
    justify-content: center;
  }
}
</style> 
<template>
  <div class="error-page">
    <div class="error-container">
      <h1>路由错误</h1>
      <p>初始化路由时发生错误，请检查以下信息：</p>
      
      <div class="debug-info">
        <h2>调试信息</h2>
        <div class="info-section">
          <h3>Token状态</h3>
          <div class="info-item">
            <span>Token存在:</span>
            <span>{{ tokenInfo.exists ? '是' : '否' }}</span>
          </div>
          <div class="info-item" v-if="tokenInfo.exists">
            <span>Token类型:</span>
            <span>{{ tokenInfo.type }}</span>
          </div>
          <div class="info-item" v-if="tokenInfo.exists">
            <span>过期状态:</span>
            <span :class="{ 'text-danger': tokenInfo.isExpired }">
              {{ tokenInfo.isExpired ? '已过期' : '有效' }}
            </span>
          </div>
          <div class="info-item" v-if="tokenInfo.exists && !tokenInfo.isExpired">
            <span>剩余有效期:</span>
            <span>{{ tokenInfo.remainingTime }}</span>
          </div>
        </div>
        
        <div class="info-section">
          <h3>用户信息</h3>
          <div class="info-item">
            <span>用户登录状态:</span>
            <span>{{ userInfo ? '已登录' : '未登录' }}</span>
          </div>
          <div v-if="userInfo">
            <div class="info-item">
              <span>用户名:</span>
              <span>{{ userInfo.username || '未知' }}</span>
            </div>
            <div class="info-item">
              <span>角色:</span>
              <span>{{ Array.isArray(userInfo.roles) ? userInfo.roles.join(', ') : '无角色' }}</span>
            </div>
          </div>
        </div>
        
        <div class="info-section">
          <h3>路由信息</h3>
          <div class="info-item">
            <span>当前路由:</span>
            <span>{{ $route.fullPath }}</span>
          </div>
          <div class="info-item">
            <span>菜单数量:</span>
            <span>{{ menuCount }}</span>
          </div>
          <div class="info-item">
            <span>路由数量:</span>
            <span>{{ routeCount }}</span>
          </div>
        </div>
        
        <div class="info-section">
          <h3>刷新计数器</h3>
          <div class="info-item">
            <span>刷新次数:</span>
            <span>{{ refreshCount }}</span>
          </div>
          <div class="info-item">
            <span>上次刷新时间:</span>
            <span>{{ lastRefreshTime }}</span>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <el-button type="primary" @click="goToLogin">返回登录页</el-button>
        <el-button @click="clearStorage">清除缓存</el-button>
        <el-button @click="refreshPage">刷新页面</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getToken, removeToken } from "@/utils/auth";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { storageLocal, storageSession } from "@pureadmin/utils";
import { userKey } from "@/utils/auth";
import { ElMessage } from "element-plus";

const router = useRouter();

// 获取Token信息
const tokenInfo = computed(() => {
  const data = getToken();
  const now = Date.now();
  const expires = data ? parseInt(data.expires) : 0;
  const isExpired = expires <= now;
  const remainingTime = isExpired ? "已过期" : `${Math.floor((expires - now) / 1000 / 60)}分钟`;
  
  return {
    exists: !!data,
    type: data ? "Bearer" : "无",
    isExpired,
    remainingTime,
    expiresTime: data ? new Date(expires).toLocaleString() : "无"
  };
});

// 获取用户信息
const userInfo = computed(() => {
  return storageLocal().getItem(userKey) as any;
});

// 获取菜单数量
const menuCount = computed(() => {
  return usePermissionStoreHook().wholeMenus.length;
});

// 获取路由数量
const routeCount = ref(0);

// 获取刷新计数
const refreshCount = ref(sessionStorage.getItem("router_refresh_count") || "0");
const lastRefreshTime = ref("未知");

// 页面加载时获取路由数量
onMounted(() => {
  routeCount.value = router.getRoutes().length;
  
  // 获取上次刷新时间
  const refreshFlag = sessionStorage.getItem("router_refresh_flag");
  if (refreshFlag) {
    const time = new Date(parseInt(refreshFlag));
    lastRefreshTime.value = time.toLocaleString();
  }
});

// 返回登录页
const goToLogin = () => {
  router.push("/login");
};

// 清除缓存
const clearStorage = () => {
  removeToken();
  sessionStorage.clear();
  localStorage.clear();
  ElMessage.success("缓存已清除，请刷新页面");
};

// 刷新页面
const refreshPage = () => {
  window.location.reload();
};
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.error-container {
  width: 800px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

h1 {
  color: #409eff;
  margin-bottom: 20px;
}

.debug-info {
  margin: 30px 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  background-color: #f8f9fa;
}

.info-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #dcdfe6;
}

.info-section:last-child {
  border-bottom: none;
}

h3 {
  color: #606266;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  margin-bottom: 5px;
}

.info-item span:first-child {
  width: 120px;
  color: #909399;
}

.text-danger {
  color: #f56c6c;
}

.actions {
  display: flex;
  gap: 10px;
}
</style> 
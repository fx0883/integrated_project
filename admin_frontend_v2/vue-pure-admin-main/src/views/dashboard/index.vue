<template>
  <div class="dashboard-container">
    <!-- 根据用户角色显示不同的仪表盘 -->
    <AdminDashboard v-if="userRole === 'super_admin'" />
    <TenantDashboard v-else-if="userRole === 'tenant_admin'" />
    <UserDashboard v-else />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useUserStoreHook } from "@/store/modules/user";
import AdminDashboard from "./admin.vue";
import TenantDashboard from "./tenant.vue";
import UserDashboard from "./user.vue";

const userStore = useUserStoreHook();

// 用户角色
const userRole = computed(() => {
  const roles = userStore.roles || [];
  
  if (roles.includes("super_admin")) {
    return "super_admin";
  }
  
  if (roles.includes("tenant_admin")) {
    return "tenant_admin";
  }
  
  return "user";
});

</script>

<style scoped>
.dashboard-container {
  height: 100%;
  width: 100%;
}
</style> 
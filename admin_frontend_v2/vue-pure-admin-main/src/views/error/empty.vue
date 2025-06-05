<template>
  <div class="empty-component">
    <el-alert
      title="组件不存在"
      type="warning"
      description="该路由对应的组件不存在，请检查组件路径配置"
      show-icon
      :closable="false"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  console.warn("渲染了空组件，可能是路由配置中组件路径错误");
});
</script>

<style scoped>
.empty-component {
  padding: 20px;
  text-align: center;
}
</style> 
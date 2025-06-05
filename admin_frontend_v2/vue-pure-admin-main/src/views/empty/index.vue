<template>
  <div class="empty-container">
    <el-empty description="空白页" />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Empty"
});
</script>

<style scoped>
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style> 
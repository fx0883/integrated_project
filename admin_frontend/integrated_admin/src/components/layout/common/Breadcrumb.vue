<template>
  <div class="app-breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item 
        v-for="(item, index) in items" 
        :key="index"
        :to="item.path"
      >
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup>
// 定义组件属性
const props = defineProps({
  items: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.app-breadcrumb {
  padding: 15px 20px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .app-breadcrumb {
    padding: 10px 15px;
  }
}
</style> 
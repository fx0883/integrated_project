<template>
  <!-- 空模板，仅作为重定向中转页面 -->
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { onBeforeMount } from 'vue'

// 获取路由实例
const route = useRoute()
const router = useRouter()

// 重定向到指定页面
onBeforeMount(() => {
  const { redirect } = route.query
  if (redirect) {
    router.replace(redirect)
  } else {
    // 如果没有重定向参数，回到首页
    router.replace('/')
  }
})
</script> 
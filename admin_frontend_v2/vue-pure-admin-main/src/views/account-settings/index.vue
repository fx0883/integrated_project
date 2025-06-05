<template>
  <div class="account-settings-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>账户设置</span>
        </div>
      </template>
      <div class="content">
        <el-form label-width="120px">
          <el-form-item label="用户名">
            <el-input v-model="userInfo.username" disabled />
          </el-form-item>
          <el-form-item label="电子邮箱">
            <el-input v-model="userInfo.email" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="userInfo.phone" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary">保存</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

defineOptions({
  name: "AccountSettings"
});

const userInfo = reactive({
  username: "admin",
  email: "admin@example.com",
  phone: "13800138000"
});
</script>

<style scoped>
.account-settings-container {
  padding: 20px;
}
.box-card {
  margin: 0 auto;
  max-width: 800px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.content {
  padding: 20px;
}
</style> 
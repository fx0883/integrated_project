<template>
  <div class="system-config-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">系统配置</span>
        </div>
      </template>
      
      <el-form ref="formRef" :model="configForm" label-width="120px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基础配置" name="basic">
            <el-form-item label="系统名称">
              <el-input v-model="configForm.systemName" />
            </el-form-item>
            <el-form-item label="系统描述">
              <el-input v-model="configForm.systemDescription" type="textarea" />
            </el-form-item>
            <el-form-item label="系统Logo">
              <el-upload
                class="avatar-uploader"
                action="#"
                :http-request="uploadLogo"
                :show-file-list="false"
              >
                <img v-if="configForm.logoUrl" :src="configForm.logoUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="邮件配置" name="email">
            <el-form-item label="SMTP服务器">
              <el-input v-model="configForm.smtpServer" />
            </el-form-item>
            <el-form-item label="SMTP端口">
              <el-input v-model="configForm.smtpPort" />
            </el-form-item>
            <el-form-item label="发件人邮箱">
              <el-input v-model="configForm.senderEmail" />
            </el-form-item>
            <el-form-item label="发件人密码">
              <el-input v-model="configForm.senderPassword" type="password" />
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="安全配置" name="security">
            <el-form-item label="密码策略">
              <el-select v-model="configForm.passwordPolicy">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </el-form-item>
            <el-form-item label="登录失败锁定">
              <el-switch v-model="configForm.loginLockEnabled" />
            </el-form-item>
            <el-form-item label="锁定阈值">
              <el-input-number v-model="configForm.loginLockThreshold" :min="1" :max="10" />
            </el-form-item>
            <el-form-item label="锁定时间(分钟)">
              <el-input-number v-model="configForm.loginLockTime" :min="5" :max="60" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
        
        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { UploadRequestOptions } from "element-plus";

// 表单引用
const formRef = ref();

// 当前激活的标签页
const activeTab = ref("basic");

// 配置表单数据
const configForm = reactive({
  systemName: "租户管理系统",
  systemDescription: "多租户SaaS管理平台",
  logoUrl: "",
  smtpServer: "smtp.example.com",
  smtpPort: "587",
  senderEmail: "admin@example.com",
  senderPassword: "",
  passwordPolicy: "medium",
  loginLockEnabled: true,
  loginLockThreshold: 5,
  loginLockTime: 30
});

// 上传Logo
const uploadLogo = (options: UploadRequestOptions): Promise<any> => {
  return new Promise((resolve) => {
    const { file } = options;
    // 这里应该是实际的文件上传逻辑，这里仅做演示
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        configForm.logoUrl = e.target.result as string;
      }
      resolve({ url: configForm.logoUrl });
    };
    reader.readAsDataURL(file as Blob);
  });
};

// 保存配置
const saveConfig = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      // 这里应该是实际的保存逻辑，这里仅做演示
      ElMessage.success("配置保存成功");
    }
  });
};

// 重置表单
const resetForm = () => {
  formRef.value.resetFields();
};

// 初始化时加载配置
onMounted(() => {
  // 这里应该是实际的加载配置逻辑，这里仅做演示
  console.log("加载系统配置");
});
</script>

<style scoped>
.system-config-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-uploader {
  width: 178px;
  height: 178px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style> 
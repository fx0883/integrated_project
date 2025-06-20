<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElLoading } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import type { AdminUserUpdateParams } from "@/types/adminUser";
import logger from "@/utils/logger";

const { t } = useI18n();
const userStore = useUserStoreHook();

// 表单数据
const formData = reactive<AdminUserUpdateParams>({
  nick_name: "",
  phone: "",
  first_name: "",
  last_name: ""
});

// 加载状态
const loading = ref(false);

// 获取当前管理员信息
const fetchCurrentAdmin = async () => {
  loading.value = true;
  try {
    const response = await userStore.fetchCurrentAdmin();
    if (response.success) {
      // 填充表单数据
      formData.nick_name = response.data.nick_name || "";
      formData.phone = response.data.phone || "";
      formData.first_name = response.data.first_name || "";
      formData.last_name = response.data.last_name || "";
    }
  } catch (error) {
    logger.error("获取当前管理员信息失败", error);
    ElMessage.error("获取当前管理员信息失败");
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await userStore.updateCurrentAdminInfo(formData);
  } catch (error) {
    logger.error("更新当前管理员信息失败", error);
  }
};

// 页面加载时获取当前管理员信息
onMounted(() => {
  fetchCurrentAdmin();
});
</script>

<template>
  <div class="admin-profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h3>{{ t("adminUser.profile") }}</h3>
        </div>
      </template>

      <el-skeleton :loading="loading" animated>
        <template #default>
          <el-form :model="formData" label-width="120px" label-position="left">
            <el-form-item :label="t('adminUser.username')">
              <el-input v-model="userStore.username" disabled />
            </el-form-item>

            <el-form-item :label="t('adminUser.email')">
              <el-input v-model="userStore.email" disabled />
            </el-form-item>

            <el-form-item :label="t('adminUser.nickName')">
              <el-input v-model="formData.nick_name" />
            </el-form-item>

            <el-form-item :label="t('adminUser.phone')">
              <el-input v-model="formData.phone" />
            </el-form-item>

            <el-form-item :label="t('adminUser.firstName')">
              <el-input v-model="formData.first_name" />
            </el-form-item>

            <el-form-item :label="t('adminUser.lastName')">
              <el-input v-model="formData.last_name" />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="handleSubmit"
                :loading="userStore.loading.updateCurrentAdmin"
              >
                {{ t("common.save") }}
              </el-button>
              <el-button @click="fetchCurrentAdmin">
                {{ t("common.reset") }}
              </el-button>
            </el-form-item>
          </el-form>
        </template>
      </el-skeleton>
    </el-card>
  </div>
</template>

<style scoped>
.admin-profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

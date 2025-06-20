<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import type { AdminUserUpdateParams } from "@/types/adminUser";
import logger from "@/utils/logger";

const { t } = useI18n();
const userStore = useUserStoreHook();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["update:visible"]);

// 关闭对话框
const handleClose = () => {
  emit("update:visible", false);
};

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
    if (response?.success) {
      // 填充表单数据
      formData.nick_name = response.data.nick_name || "";
      formData.phone = response.data.phone || "";
      formData.first_name = response.data.first_name || "";
      formData.last_name = response.data.last_name || "";
    }
  } catch (error) {
    logger.error("获取当前管理员信息失败", error);
    ElMessage.error(t("adminUser.profileFailed"));
  } finally {
    loading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await userStore.updateCurrentAdminInfo(formData);
    handleClose();
  } catch (error) {
    logger.error("更新当前管理员信息失败", error);
  }
};

// 监听对话框的显示状态，当显示时获取最新的用户信息
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      fetchCurrentAdmin();
    }
  }
);

// 页面加载时获取当前管理员信息
onMounted(() => {
  fetchCurrentAdmin();
});
</script>

<template>
  <el-dialog
    :title="t('adminUser.profile')"
    :model-value="visible"
    @update:model-value="handleClose"
    :close-on-click-modal="false"
    width="500px"
    class="profile-dialog"
  >
    <el-skeleton :loading="loading" animated>
      <template #default>
        <el-form :model="formData" label-width="100px" label-position="left">
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
        </el-form>
      </template>
    </el-skeleton>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">{{ t("common.cancel") }}</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="userStore.loading.updateCurrentAdmin"
        >
          {{ t("common.save") }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

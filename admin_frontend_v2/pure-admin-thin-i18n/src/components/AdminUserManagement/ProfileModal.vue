<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, type UploadProps } from "element-plus";
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
const uploadLoading = ref(false);

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

// 头像上传前检查
const beforeAvatarUpload: UploadProps["beforeUpload"] = file => {
  // 检查文件类型
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error("上传的文件必须是图片格式");
    return false;
  }

  // 检查文件大小，限制为2MB
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error("上传的图片大小不能超过2MB");
    return false;
  }

  return true;
};

// 自定义上传方法
const handleAvatarUpload: UploadProps["httpRequest"] = async ({ file }) => {
  if (!(file instanceof File)) return;

  uploadLoading.value = true;
  try {
    await userStore.uploadCurrentAdminAvatar(file);
  } catch (error) {
    logger.error("上传头像失败", error);
  } finally {
    uploadLoading.value = false;
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
        <div class="avatar-upload-section">
          <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="handleAvatarUpload"
            :before-upload="beforeAvatarUpload"
            :show-file-list="false"
            :disabled="uploadLoading"
            accept="image/*"
          >
            <div class="avatar-container">
              <img
                v-if="userStore.avatar"
                :src="userStore.avatar"
                class="avatar-image"
              />
              <el-icon v-else class="avatar-icon"><el-icon-plus /></el-icon>
            </div>
            <div class="upload-text">
              {{
                uploadLoading
                  ? t("adminUser.uploading")
                  : t("adminUser.uploadAvatar")
              }}
            </div>
          </el-upload>
        </div>

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

.avatar-upload-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-uploader {
  text-align: center;
}

.avatar-container {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-container:hover {
  border-color: #409eff;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-text {
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
}
</style>

<script lang="ts" setup>
import { ref, defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import type { UploadProps, UploadInstance, UploadRawFile } from "element-plus";
import { useAdminUserStoreHook } from "@/store/modules/adminUser";

const { t } = useI18n();
const adminUserStore = useAdminUserStoreHook();

const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  currentAvatar: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["uploaded"]);

// 上传组件引用
const uploadRef = ref<UploadInstance>();
// 加载状态
const loading = ref(false);

// 上传前检查
const beforeUpload: UploadProps["beforeUpload"] = file => {
  // 检查文件类型
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error(t("上传的文件必须是图片格式"));
    return false;
  }

  // 检查文件大小，限制为2MB
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error(t("上传的图片大小不能超过2MB"));
    return false;
  }

  return true;
};

// 自定义上传方法
const handleUpload: UploadProps["httpRequest"] = async ({ file }) => {
  if (file instanceof File) {
    loading.value = true;
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await adminUserStore.uploadAdminUserAvatarAction(
        props.userId,
        formData
      );

      if (response.success && response.data && response.data.avatar) {
        ElMessage.success(t("adminUser.uploadAvatarSuccess"));
        emit("uploaded", response.data.avatar);
      } else {
        ElMessage.error(response.message || t("adminUser.uploadAvatarFailed"));
      }
    } catch (error) {
      console.error("上传头像失败", error);
      ElMessage.error(t("adminUser.uploadAvatarFailed"));
    } finally {
      loading.value = false;
    }
  }
};

// 上传失败回调
const handleUploadError = () => {
  loading.value = false;
  ElMessage.error(t("adminUser.uploadAvatarFailed"));
};

// 清空上传
const clearUpload = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};
</script>

<template>
  <div class="avatar-upload">
    <el-upload
      ref="uploadRef"
      class="avatar-uploader"
      action="#"
      :http-request="handleUpload"
      :before-upload="beforeUpload"
      :on-error="handleUploadError"
      :disabled="disabled || loading"
      :show-file-list="false"
      accept="image/*"
    >
      <div class="avatar-container">
        <el-image
          v-if="currentAvatar"
          :src="currentAvatar"
          class="avatar-image"
          alt="Avatar"
          fit="cover"
          :loading="loading ? 'eager' : 'lazy'"
        >
          <template #error>
            <div class="avatar-error">
              <el-icon><el-icon-picture /></el-icon>
            </div>
          </template>
          <template #placeholder>
            <div class="avatar-loading">
              <el-icon class="is-loading"><el-icon-loading /></el-icon>
            </div>
          </template>
        </el-image>
        <el-icon v-else class="avatar-placeholder">
          <el-icon-plus />
        </el-icon>
      </div>
      <div class="avatar-upload-tip">
        {{ loading ? t("adminUser.uploading") : t("adminUser.uploadAvatar") }}
      </div>
      <template #tip>
        <div class="el-upload__tip">
          {{ t("格式支持JPG、PNG，文件大小不超过2MB") }}
        </div>
      </template>
    </el-upload>
  </div>
</template>

<style scoped>
.avatar-upload {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-uploader {
  display: inline-block;
  cursor: pointer;
}

.avatar-container {
  width: 120px;
  height: 120px;
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 28px;
  color: #8c939d;
}

.avatar-upload-tip {
  margin-top: 10px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.avatar-uploader:hover .avatar-container {
  border-color: var(--el-color-primary);
}

.avatar-error,
.avatar-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 24px;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

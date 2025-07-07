<template>
  <div class="avatar-upload">
    <el-upload
      class="avatar-uploader"
      :action="action"
      :http-request="customUpload"
      :show-file-list="false"
      :before-upload="beforeAvatarUpload"
      :disabled="disabled || loading"
    >
      <div class="avatar-container">
        <el-image
          v-if="imageUrl"
          :src="imageUrl"
          fit="cover"
          class="avatar-image"
          :class="{ 'is-loading': loading }"
        />
        <el-icon v-else class="avatar-icon"><Plus /></el-icon>
        <div v-if="loading" class="loading-mask">
          <el-icon class="loading-icon" :size="30"><Loading /></el-icon>
        </div>
        <div class="upload-text" v-if="!disabled">
          {{ $t("member.clickToUpload") }}
        </div>
      </div>
    </el-upload>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Plus, Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { UploadRequestOptions } from "element-plus";
import logger from "@/utils/logger";

const { t } = useI18n();

const props = defineProps({
  // 当前头像URL
  avatarUrl: {
    type: String,
    default: ""
  },
  // 是否禁用上传
  disabled: {
    type: Boolean,
    default: false
  },
  // 上传接口地址（如果不使用自定义上传）
  action: {
    type: String,
    default: ""
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: "update", file: File): void;
  (e: "success", url: string): void;
  (e: "error", error: any): void;
}>();

// 图片URL
const imageUrl = computed(() => {
  return props.avatarUrl || "";
});

// 上传前验证
const beforeAvatarUpload = (file: File) => {
  // 检查文件类型
  const isImage = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ].includes(file.type);
  if (!isImage) {
    ElMessage.error(t("member.avatarTypeError"));
    return false;
  }

  // 检查文件大小（限制为2MB）
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error(t("member.avatarSizeError"));
    return false;
  }

  return true;
};

// 自定义上传
const customUpload = (options: UploadRequestOptions) => {
  const { file } = options;
  if (!(file instanceof File)) {
    logger.error("上传文件类型错误");
    ElMessage.error(t("common.uploadError"));
    return;
  }

  // 触发上传事件，由父组件处理实际上传逻辑
  emit("update", file);
};
</script>

<style scoped>
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--el-fill-color-lighter);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-image.is-loading {
  opacity: 0.5;
}

.avatar-icon {
  font-size: 28px;
  color: var(--el-text-color-secondary);
}

.upload-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  position: absolute;
  bottom: 5px;
  background-color: rgba(255, 255, 255, 0.8);
  width: 100%;
  text-align: center;
  padding: 2px 0;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
}

.loading-icon {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

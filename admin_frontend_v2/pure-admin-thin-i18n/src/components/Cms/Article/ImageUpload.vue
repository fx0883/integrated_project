<script lang="ts" setup>
import { ref, defineProps, defineEmits, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import type { UploadProps, UploadInstance } from "element-plus";
import { useCmsStoreHook } from "@/store/modules/cms";
import { Plus, Delete } from "@element-plus/icons-vue";
import logger from "@/utils/logger";

const { t } = useI18n();
const cmsStore = useCmsStoreHook();

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    default: "article_covers"
  },
  maxSize: {
    type: Number,
    default: 5 // 默认5MB
  },
  width: {
    type: Number,
    default: 0 // 0表示不限制
  },
  height: {
    type: Number,
    default: 180
  },
  uploadText: {
    type: String,
    default: ""
  },
  tipText: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:modelValue"]);

// 上传组件引用
const uploadRef = ref<UploadInstance>();
// 加载状态
const loading = ref(false);

// 上传前检查
const beforeUpload: UploadProps["beforeUpload"] = file => {
  // 检查文件类型
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error(t("cms.article.imageTypeError"));
    return false;
  }

  // 检查文件大小，限制为maxSize MB
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    ElMessage.error(t("cms.article.imageSizeError"));
    return false;
  }

  return true;
};

// 自定义上传方法
const handleUpload: UploadProps["httpRequest"] = async ({ file }) => {
  if (file instanceof File) {
    loading.value = true;
    try {
      const response = await cmsStore.uploadCoverImage(file, props.folder);
      if (response && response.url) {
        emit("update:modelValue", response.url);
        ElMessage.success(t("cms.article.coverUploadSuccess"));
      }
    } catch (error) {
      logger.error("上传图片失败", error);
      ElMessage.error(t("cms.article.coverUploadFailed"));
    } finally {
      loading.value = false;
    }
  }
};

// 上传失败回调
const handleUploadError = () => {
  loading.value = false;
  ElMessage.error(t("cms.article.coverUploadFailed"));
};

// 移除图片
const handleRemove = () => {
  emit("update:modelValue", "");
};

// 清空上传
const clearUpload = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
};

// 计算样式
const containerStyle = computed(() => {
  const style = {
    height: `${props.height}px`
  };
  if (props.width > 0) {
    style.width = `${props.width}px`;
  }
  return style;
});

// 显示的上传文本
const displayUploadText = computed(() => {
  if (loading.value) {
    return t("cms.article.uploading");
  }
  return props.uploadText || t("cms.article.uploadCover");
});

// 显示的提示文本
const displayTipText = computed(() => {
  return props.tipText || t("cms.article.coverImageTip");
});
</script>

<template>
  <div class="image-upload">
    <el-upload
      v-if="!modelValue"
      ref="uploadRef"
      class="image-uploader"
      action="#"
      :http-request="handleUpload"
      :before-upload="beforeUpload"
      :on-error="handleUploadError"
      :disabled="disabled || loading"
      :show-file-list="false"
      accept="image/*"
    >
      <div class="image-container" :style="containerStyle">
        <el-icon v-if="loading" class="is-loading"><el-icon-loading /></el-icon>
        <el-icon v-else class="image-placeholder"><Plus /></el-icon>
      </div>
      <div class="upload-tip">
        {{ displayUploadText }}
      </div>
    </el-upload>

    <div v-else class="image-preview" :style="containerStyle">
      <el-image
        :src="modelValue"
        class="preview-image"
        fit="contain"
        :preview-src-list="[modelValue]"
      >
        <template #error>
          <div class="image-error">
            <el-icon><el-icon-picture /></el-icon>
          </div>
        </template>
      </el-image>
      <div class="image-actions" v-if="!disabled">
        <el-button
          type="danger"
          :icon="Delete"
          circle
          size="small"
          @click="handleRemove"
        />
      </div>
    </div>

    <div class="el-upload__tip">
      {{ displayTipText }}
    </div>
  </div>
</template>

<style scoped>
.image-upload {
  width: 100%;
  margin-bottom: 20px;
}

.image-uploader {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
}

.image-container {
  width: 180px;
  height: 180px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-fill-color-lighter);
}

.image-preview {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 6px;
  overflow: hidden;
}

.preview-image {
  width: 50%;
  height: 100%;
  margin-left: 0;
  display: block;
}

.image-placeholder {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  margin-top: 10px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.image-uploader:hover .image-container {
  border-color: var(--el-color-primary);
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 24px;
  background-color: var(--el-fill-color-light);
}

.image-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-actions {
  opacity: 1;
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

.el-upload__tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

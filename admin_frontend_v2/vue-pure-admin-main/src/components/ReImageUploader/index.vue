<template>
  <div class="re-image-uploader">
    <el-upload
      v-model:file-list="fileList"
      :action="action"
      :headers="headers"
      :multiple="multiple"
      :limit="limit"
      :disabled="disabled"
      :accept="accept"
      :list-type="listType"
      :auto-upload="autoUpload"
      :drag="drag"
      :data="data"
      :show-file-list="showFileList"
      :name="name"
      :with-credentials="withCredentials"
      :before-upload="handleBeforeUpload"
      :on-exceed="handleExceed"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-progress="handleProgress"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :on-change="handleChange"
    >
      <template #trigger>
        <slot name="trigger"></slot>
      </template>
      
      <template #default>
        <div v-if="drag">
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或 <em>点击上传</em>
          </div>
        </div>
        <slot v-else>
          <el-button type="primary">点击上传</el-button>
        </slot>
      </template>
      
      <template #tip>
        <slot name="tip">
          <div class="el-upload__tip" v-if="tip">
            {{ tip }}
          </div>
        </slot>
      </template>
      
      <template #file="{ file }">
        <slot name="file" :file="file"></slot>
      </template>
    </el-upload>
    
    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" :title="previewTitle" width="800px">
      <img :src="previewUrl" alt="Preview Image" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { UploadFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

interface FileItem {
  name: string;
  url: string;
  [key: string]: any;
}

// 组件属性
const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: ""
  },
  action: {
    type: String,
    default: ""
  },
  headers: {
    type: Object,
    default: () => ({})
  },
  multiple: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 5
  },
  disabled: {
    type: Boolean,
    default: false
  },
  accept: {
    type: String,
    default: "image/*"
  },
  listType: {
    type: String,
    default: "picture-card"
  },
  autoUpload: {
    type: Boolean,
    default: true
  },
  drag: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: () => ({})
  },
  showFileList: {
    type: Boolean,
    default: true
  },
  name: {
    type: String,
    default: "file"
  },
  withCredentials: {
    type: Boolean,
    default: false
  },
  tip: {
    type: String,
    default: ""
  },
  maxSize: {
    type: Number,
    default: 5 // 默认5MB
  },
  responseUrlKey: {
    type: String,
    default: "url"
  }
});

// 事件
const emit = defineEmits([
  "update:modelValue",
  "change",
  "success",
  "error",
  "exceed",
  "preview",
  "remove"
]);

// 文件列表
const fileList = ref<FileItem[]>([]);

// 预览相关
const previewVisible = ref(false);
const previewUrl = ref("");
const previewTitle = ref("");

// 初始化文件列表
const initFileList = () => {
  const value = props.modelValue;
  
  if (!value) {
    fileList.value = [];
    return;
  }
  
  if (typeof value === "string") {
    // 单个文件
    fileList.value = value
      ? [
          {
            name: value.split("/").pop() || "image",
            url: value
          }
        ]
      : [];
  } else if (Array.isArray(value)) {
    // 多个文件
    fileList.value = value.map(item => {
      if (typeof item === "string") {
        return {
          name: item.split("/").pop() || "image",
          url: item
        };
      } else {
        return {
          name: item.name || item.url.split("/").pop() || "image",
          url: item.url || item
        };
      }
    });
  }
};

// 监听值变化
watch(
  () => props.modelValue,
  () => {
    initFileList();
  },
  { immediate: true }
);

// 获取当前值
const getCurrentValue = () => {
  if (props.multiple) {
    return fileList.value.map(file => file.url);
  } else {
    return fileList.value.length > 0 ? fileList.value[0].url : "";
  }
};

// 上传前校验
const handleBeforeUpload = (file: File) => {
  // 检查文件类型
  if (props.accept && !file.type.match(props.accept.replace("*", ""))) {
    ElMessage.error(`请上传${props.accept}格式的文件`);
    return false;
  }
  
  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB!`);
    return false;
  }
  
  return true;
};

// 上传成功
const handleSuccess = (response: any, file: any, fileList: any[]) => {
  // 格式化响应数据
  const result = response.data || response;
  let url = "";
  
  if (result && (result.url || result[props.responseUrlKey])) {
    url = result.url || result[props.responseUrlKey];
  } else if (typeof result === "string") {
    url = result;
  }
  
  // 更新文件URL
  if (url) {
    file.url = url;
  }
  
  // 更新v-model值
  const newValue = props.multiple
    ? fileList.map(file => file.url || "")
    : file.url || "";
    
  emit("update:modelValue", newValue);
  emit("success", response, file, fileList);
  emit("change", fileList);
};

// 上传失败
const handleError = (error: any, file: any, fileList: any[]) => {
  ElMessage.error(`文件 ${file.name} 上传失败`);
  emit("error", error, file, fileList);
};

// 上传进度
const handleProgress = (event: any, file: any, fileList: any[]) => {
  // 可以添加进度处理逻辑
};

// 文件预览
const handlePreview = (file: any) => {
  previewUrl.value = file.url;
  previewTitle.value = file.name;
  previewVisible.value = true;
  emit("preview", file);
};

// 移除文件
const handleRemove = (file: any, fileList: any[]) => {
  const newValue = props.multiple
    ? fileList.map(file => file.url || "")
    : fileList.length > 0 ? fileList[0].url : "";
    
  emit("update:modelValue", newValue);
  emit("remove", file, fileList);
  emit("change", fileList);
};

// 文件状态改变
const handleChange = (file: any, fileList: any[]) => {
  emit("change", fileList);
};

// 文件超出限制
const handleExceed = (files: any[], fileList: any[]) => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`);
  emit("exceed", files, fileList);
};

// 手动上传方法
const submit = () => {
  const uploadRef = document.querySelector(".re-image-uploader .el-upload");
  if (uploadRef) {
    (uploadRef as any).submit();
  }
};

// 重置上传
const clearFiles = () => {
  const uploadRef = document.querySelector(".re-image-uploader .el-upload");
  if (uploadRef) {
    (uploadRef as any).clearFiles();
  }
  fileList.value = [];
  emit("update:modelValue", props.multiple ? [] : "");
  emit("change", []);
};

// 暴露方法
defineExpose({
  submit,
  clearFiles,
  fileList
});
</script>

<style scoped>
.re-image-uploader {
  width: 100%;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 7px;
}
</style> 
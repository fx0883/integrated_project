<script lang="ts" setup>
import { ref, reactive, defineEmits, defineProps } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled, Download, RefreshRight } from "@element-plus/icons-vue";
import { downloadOrderImportTemplate, importOrders } from "@/api/modules/order";
import type { OrderImportResponse } from "@/types/order";

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "success", result: OrderImportResponse): void;
}>();

// 上传状态
const uploadStatus = reactive({
  isUploading: false,
  progress: 0,
  file: null as File | null,
  fileName: "",
  fileSize: "",
  result: null as OrderImportResponse | null,
  error: ""
});

// 文件上传引用
const fileInputRef = ref<HTMLInputElement | null>(null);

// 关闭对话框
const handleClose = () => {
  if (uploadStatus.isUploading) {
    ElMessageBox.confirm(t("order.confirmCancelUpload"), t("common.confirm"), {
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      type: "warning"
    })
      .then(() => {
        emit("update:visible", false);
        resetUpload();
      })
      .catch(() => {});
    return;
  }
  emit("update:visible", false);
  resetUpload();
};

// 下载导入模板
const downloadTemplate = async () => {
  try {
    const response = await downloadOrderImportTemplate();
    const blob = new Blob([response], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "order_import_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to download template:", error);
    ElMessage.error(t("order.downloadTemplateFailed"));
  }
};

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    // 检查文件类型
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel" // .xls
    ];

    if (!validTypes.includes(file.type)) {
      ElMessage.error(t("order.invalidFileType"));
      resetUpload();
      return;
    }

    // 检查文件大小 (限制为10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error(t("order.fileTooLarge"));
      resetUpload();
      return;
    }

    uploadStatus.file = file;
    uploadStatus.fileName = file.name;
    uploadStatus.fileSize = formatFileSize(file.size);
    uploadStatus.error = "";
    uploadStatus.result = null;
  }
};

// 处理文件拖放
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];

    // 检查文件类型
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel" // .xls
    ];

    if (!validTypes.includes(file.type)) {
      ElMessage.error(t("order.invalidFileType"));
      return;
    }

    // 检查文件大小 (限制为10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      ElMessage.error(t("order.fileTooLarge"));
      return;
    }

    uploadStatus.file = file;
    uploadStatus.fileName = file.name;
    uploadStatus.fileSize = formatFileSize(file.size);
    uploadStatus.error = "";
    uploadStatus.result = null;
  }
};

// 阻止默认拖放行为
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

// 上传文件
const uploadFile = async () => {
  if (!uploadStatus.file) {
    ElMessage.warning(t("order.noFileSelected"));
    return;
  }

  uploadStatus.isUploading = true;
  uploadStatus.progress = 0;
  uploadStatus.error = "";

  try {
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadStatus.progress < 90) {
        uploadStatus.progress += 10;
      }
    }, 300);

    const response = await importOrders(uploadStatus.file);

    clearInterval(progressInterval);
    uploadStatus.progress = 100;

    if (response.success) {
      uploadStatus.result = response.data;
      emit("success", response.data);
      ElMessage.success(t("order.importSuccess"));
    } else {
      uploadStatus.error = response.message || t("order.importFailed");
      ElMessage.error(uploadStatus.error);
    }
  } catch (error) {
    console.error("Failed to import orders:", error);
    uploadStatus.error = error.message || t("order.importFailed");
    ElMessage.error(uploadStatus.error);
  } finally {
    uploadStatus.isUploading = false;
  }
};

// 重置上传状态
const resetUpload = () => {
  uploadStatus.isUploading = false;
  uploadStatus.progress = 0;
  uploadStatus.file = null;
  uploadStatus.fileName = "";
  uploadStatus.fileSize = "";
  uploadStatus.result = null;
  uploadStatus.error = "";

  // 重置文件输入
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
</script>

<template>
  <el-dialog
    :title="t('order.importDialogTitle')"
    :modelValue="visible"
    @update:modelValue="val => emit('update:visible', val)"
    @close="handleClose"
    width="550px"
    class="order-import-dialog"
    :close-on-click-modal="false"
  >
    <div class="import-dialog-content">
      <!-- 导入说明 -->
      <div class="import-instructions">
        <p>{{ t("order.importDialogDescription") }}</p>
        <el-button type="primary" @click="downloadTemplate" :icon="Download">
          {{ t("order.downloadTemplate") }}
        </el-button>
      </div>

      <!-- 文件上传区域 -->
      <div
        class="file-upload-area"
        @drop="handleDrop"
        @dragover="handleDragOver"
        v-if="!uploadStatus.isUploading && !uploadStatus.result"
      >
        <input
          type="file"
          ref="fileInputRef"
          @change="handleFileChange"
          accept=".xlsx,.xls"
          style="display: none"
        />

        <el-icon class="upload-icon"><UploadFilled /></el-icon>

        <div class="upload-text">
          <span>{{ t("order.dragFileHere") }}</span>
          <span>{{ t("common.or") }}</span>
          <el-button type="primary" @click="triggerFileSelect">
            {{ t("order.selectFile") }}
          </el-button>
        </div>

        <div class="file-info" v-if="uploadStatus.fileName">
          <span class="file-name">{{ uploadStatus.fileName }}</span>
          <span class="file-size">{{ uploadStatus.fileSize }}</span>
        </div>
      </div>

      <!-- 上传进度 -->
      <div class="upload-progress" v-if="uploadStatus.isUploading">
        <h4>{{ t("order.uploadProgress") }}</h4>
        <el-progress :percentage="uploadStatus.progress" />
        <p>{{ t("order.uploadingFile", { name: uploadStatus.fileName }) }}</p>
      </div>

      <!-- 导入结果 -->
      <div class="import-result" v-if="uploadStatus.result">
        <h4>{{ t("order.importResult") }}</h4>

        <div class="result-summary">
          <div class="result-item success">
            <span class="result-label">{{ t("order.successCount") }}:</span>
            <span class="result-value">{{
              uploadStatus.result.success_count
            }}</span>
          </div>
          <div class="result-item failed">
            <span class="result-label">{{ t("order.failedCount") }}:</span>
            <span class="result-value">{{
              uploadStatus.result.failed_count
            }}</span>
          </div>
          <div class="result-item total">
            <span class="result-label">{{ t("order.totalCount") }}:</span>
            <span class="result-value">{{ uploadStatus.result.total }}</span>
          </div>
        </div>

        <!-- 错误详情 -->
        <div
          class="error-details"
          v-if="
            uploadStatus.result.errors && uploadStatus.result.errors.length > 0
          "
        >
          <h5>{{ t("order.errorDetails") }}</h5>
          <el-table :data="uploadStatus.result.errors" size="small" border>
            <el-table-column
              prop="row"
              :label="t('order.rowNumber')"
              width="100"
            />
            <el-table-column prop="error" :label="t('order.errorMessage')" />
          </el-table>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="upload-error" v-if="uploadStatus.error">
        <el-alert
          :title="uploadStatus.error"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          {{ t("common.close") }}
        </el-button>

        <template v-if="!uploadStatus.result && !uploadStatus.isUploading">
          <el-button
            type="primary"
            @click="uploadFile"
            :disabled="!uploadStatus.file"
          >
            {{ t("order.importOrders") }}
          </el-button>
        </template>

        <template v-if="uploadStatus.result">
          <el-button type="primary" @click="resetUpload" :icon="RefreshRight">
            {{ t("order.resetUpload") }}
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.order-import-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.import-dialog-content {
  min-height: 300px;
}

.import-instructions {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-instructions p {
  margin: 0;
  flex: 1;
}

.file-upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
  margin-bottom: 20px;
}

.file-upload-area:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 10px;
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.file-info {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-name {
  font-weight: bold;
  word-break: break-all;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.upload-progress {
  padding: 20px 0;
}

.upload-progress h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.import-result {
  padding: 10px 0;
}

.import-result h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.result-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.result-item {
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.result-item.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.result-item.failed {
  background-color: #fef0f0;
  color: #f56c6c;
}

.result-item.total {
  background-color: #f4f4f5;
  color: #909399;
}

.result-label {
  font-weight: bold;
  margin-right: 5px;
}

.error-details {
  margin-top: 20px;
}

.error-details h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #f56c6c;
}

.upload-error {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

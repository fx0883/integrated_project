<script lang="ts" setup>
import { ref, defineProps, defineEmits } from "vue";

const props = defineProps<{
  visible: boolean;
  title: string;
  content: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: "success" | "warning" | "info" | "error";
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "update:visible", value: boolean): void;
}>();

// 关闭对话框
const handleClose = () => {
  emit("update:visible", false);
  emit("cancel");
};

// 确认操作
const handleConfirm = () => {
  emit("confirm");
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :visible="visible"
    :title="title"
    width="30%"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="confirm-dialog-content">
      <el-icon v-if="type" class="confirm-dialog-icon">
        <el-icon-warning v-if="type === 'warning'" />
        <el-icon-info v-else-if="type === 'info'" />
        <el-icon-success v-else-if="type === 'success'" />
        <el-icon-error v-else-if="type === 'error'" />
      </el-icon>
      <p v-html="content"></p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">
          {{ cancelButtonText || "取消" }}
        </el-button>
        <el-button :type="type || 'primary'" @click="handleConfirm">
          {{ confirmButtonText || "确认" }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.confirm-dialog-content {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
}

.confirm-dialog-icon {
  font-size: 24px;
  margin-right: 10px;
  color: var(--el-color-warning);
}

:deep(.el-icon-warning) {
  color: var(--el-color-warning);
}

:deep(.el-icon-info) {
  color: var(--el-color-info);
}

:deep(.el-icon-success) {
  color: var(--el-color-success);
}

:deep(.el-icon-error) {
  color: var(--el-color-danger);
}
</style>

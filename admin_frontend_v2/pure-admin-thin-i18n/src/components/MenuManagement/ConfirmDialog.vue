<template>
  <el-dialog
    :modelValue="visible"
    @update:modelValue="$emit('update:visible', $event)"
    :title="title"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="!loading"
    @close="handleCancel"
  >
    <div class="confirm-dialog-content">
      <el-icon v-if="type === 'warning'" class="confirm-icon warning">
        <el-icon-warning />
      </el-icon>
      <el-icon v-else-if="type === 'danger'" class="confirm-icon danger">
        <el-icon-delete />
      </el-icon>
      <el-icon v-else class="confirm-icon info">
        <el-icon-info-filled />
      </el-icon>
      <p class="confirm-text">{{ content }}</p>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="loading">
          {{ $t("menu.cancel") }}
        </el-button>
        <el-button
          :type="type === 'danger' ? 'danger' : 'primary'"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmButtonText || $t("buttons.pureConfirm") }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps<{
  visible: boolean;
  title: string;
  content: string;
  type?: "warning" | "danger" | "info";
  loading?: boolean;
  confirmButtonText?: string;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "update:visible", visible: boolean): void;
}>();

// 关闭对话框
const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};

// 确认操作
const handleConfirm = () => {
  emit("confirm");
};
</script>

<style scoped>
.confirm-dialog-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.confirm-icon {
  font-size: 24px;
  margin-right: 16px;
  margin-top: 2px;
}

.warning {
  color: #e6a23c;
}

.danger {
  color: #f56c6c;
}

.info {
  color: #409eff;
}

.confirm-text {
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>

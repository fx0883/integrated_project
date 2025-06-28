<script lang="ts" setup>
import { ref, computed, defineProps, defineEmits, watch } from "vue";
import {
  WarningFilled,
  InfoFilled,
  SuccessFilled,
  CircleCloseFilled
} from "@element-plus/icons-vue";
import logger from "@/utils/logger";

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

// 使用计算属性处理v-model
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 关闭对话框
const handleClose = () => {
  emit("update:visible", false);
  emit("cancel");
};

// 确认操作
const handleConfirm = () => {
  logger.debug("ConfirmDialog: 确认按钮被点击");
  emit("confirm");
  emit("update:visible", false);
};

// 监听visible属性变化
watch(
  () => props.visible,
  newVal => {
    logger.debug("ConfirmDialog visible属性变化：", newVal, props.title);
  }
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="30%"
    :destroy-on-close="true"
    @close="handleClose"
    @open="logger.debug('ConfirmDialog打开事件被触发')"
    :close-on-click-modal="false"
  >
    <div class="confirm-dialog-content">
      <el-icon v-if="type" class="confirm-dialog-icon">
        <warning-filled v-if="type === 'warning'" />
        <info-filled v-else-if="type === 'info'" />
        <success-filled v-else-if="type === 'success'" />
        <circle-close-filled v-else-if="type === 'error'" />
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
}

:deep(.warning-filled) {
  color: var(--el-color-warning);
}

:deep(.info-filled) {
  color: var(--el-color-info);
}

:deep(.success-filled) {
  color: var(--el-color-success);
}

:deep(.circle-close-filled) {
  color: var(--el-color-danger);
}
</style>

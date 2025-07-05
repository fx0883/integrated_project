<script lang="ts" setup>
import { defineProps, defineEmits, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  title: string;
  content: string;
  type?: "warning" | "danger" | "info" | "success";
  loading?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
  (e: "update:visible", value: boolean): void;
}>();

const dialogVisible = ref(props.visible);

// 监听visible属性变化
watch(
  () => props.visible,
  newVal => {
    dialogVisible.value = newVal;
  }
);

// 监听对话框可见性变化
watch(
  () => dialogVisible.value,
  newVal => {
    if (props.visible !== newVal) {
      emit("update:visible", newVal);
    }
  }
);

// 确认操作
const handleConfirm = () => {
  emit("confirm");
};

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  emit("cancel");
};

// 对话框类型
const dialogType = {
  warning: {
    icon: "Warning",
    color: "#E6A23C"
  },
  danger: {
    icon: "CircleClose",
    color: "#F56C6C"
  },
  info: {
    icon: "InfoFilled",
    color: "#909399"
  },
  success: {
    icon: "SuccessFilled",
    color: "#67C23A"
  }
};

// 获取当前类型配置
const typeConfig = () => {
  return dialogType[props.type || "warning"];
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="30%"
    top="20vh"
    @close="handleCancel"
  >
    <div class="confirm-dialog-content">
      <el-icon :class="`icon-${props.type || 'warning'}`">
        <component :is="typeConfig().icon" />
      </el-icon>
      <span class="confirm-dialog-text">{{ content }}</span>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">
          {{ cancelButtonText || t("common.cancel") }}
        </el-button>
        <el-button
          :type="props.type === 'danger' ? 'danger' : 'primary'"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmButtonText || t("common.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.confirm-dialog-content {
  display: flex;
  align-items: flex-start;
  padding: 10px;
}

.icon-warning {
  color: #e6a23c;
  font-size: 24px;
  margin-right: 15px;
}

.icon-danger {
  color: #f56c6c;
  font-size: 24px;
  margin-right: 15px;
}

.icon-info {
  color: #909399;
  font-size: 24px;
  margin-right: 15px;
}

.icon-success {
  color: #67c23a;
  font-size: 24px;
  margin-right: 15px;
}

.confirm-dialog-text {
  font-size: 16px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.dialog-footer .el-button {
  margin-left: 10px;
}
</style>

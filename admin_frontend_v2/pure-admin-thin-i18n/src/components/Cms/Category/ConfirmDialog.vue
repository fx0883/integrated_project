<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="30%"
    :close-on-click-modal="false"
  >
    <div class="confirm-content">
      <el-icon v-if="type === 'warning'" class="warning-icon"
        ><WarningFilled
      /></el-icon>
      <el-icon v-else-if="type === 'error'" class="error-icon"
        ><CircleCloseFilled
      /></el-icon>
      <el-icon v-else class="info-icon"><InfoFilled /></el-icon>
      <span>{{ message }}</span>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          :type="type === 'warning' || type === 'error' ? 'danger' : 'primary'"
          :loading="loading"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import {
  WarningFilled,
  CircleCloseFilled,
  InfoFilled
} from "@element-plus/icons-vue";

interface Props {
  visible: boolean;
  title?: string;
  message: string;
  type?: "info" | "warning" | "error";
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: "确认操作",
  message: "确定要执行此操作吗？",
  type: "info",
  loading: false
});

const emit = defineEmits(["confirm", "cancel", "update:visible"]);

const dialogVisible = ref(props.visible);

// 监听visible属性变化
watch(
  () => props.visible,
  newVal => {
    dialogVisible.value = newVal;
  }
);

// 监听dialogVisible变化，通知父组件
watch(
  () => dialogVisible.value,
  newVal => {
    emit("update:visible", newVal);
  }
);

// 计算标题
const title = computed(() => {
  if (props.title) return props.title;

  switch (props.type) {
    case "warning":
      return "警告";
    case "error":
      return "错误";
    default:
      return "确认";
  }
});

// 确认操作
const handleConfirm = () => {
  emit("confirm");
};

// 取消操作
const handleCancel = () => {
  emit("cancel");
  dialogVisible.value = false;
};
</script>

<style scoped>
.confirm-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.warning-icon {
  color: #e6a23c;
  font-size: 24px;
  margin-right: 10px;
}

.error-icon {
  color: #f56c6c;
  font-size: 24px;
  margin-right: 10px;
}

.info-icon {
  color: #409eff;
  font-size: 24px;
  margin-right: 10px;
}
</style>

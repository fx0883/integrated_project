<template>
  <el-dialog
    v-model="dialogVisible"
    :title="localTitle"
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
        <el-button @click="handleCancel">{{ $t("common.cancel") }}</el-button>
        <el-button
          :type="type === 'warning' || type === 'error' ? 'danger' : 'primary'"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ $t("common.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, computed } from "vue";
import {
  WarningFilled,
  CircleCloseFilled,
  InfoFilled
} from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  title: {
    type: String,
    default: ""
  },
  message: {
    type: String,
    default: ""
  },
  type: {
    type: String,
    default: "info",
    validator: (value: string) => ["info", "warning", "error"].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// 使用计算属性来处理默认值
const localTitle = computed(() => props.title || t("common.confirm"));
const localMessage = computed(
  () => props.message || t("common.confirmMessage") || "确认执行此操作吗？"
);

const emit = defineEmits(["confirm", "cancel"]);
const dialogVisible = ref(false);

// 打开对话框
const open = () => {
  dialogVisible.value = true;
};

// 关闭对话框
const close = () => {
  dialogVisible.value = false;
};

// 确认操作
const handleConfirm = () => {
  emit("confirm");
};

// 取消操作
const handleCancel = () => {
  emit("cancel");
  close();
};

// 暴露方法给父组件
defineExpose({
  open,
  close
});
</script>

<style scoped>
.confirm-content {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.warning-icon {
  color: #e6a23c;
  font-size: 24px;
  margin-right: 12px;
}

.error-icon {
  color: #f56c6c;
  font-size: 24px;
  margin-right: 12px;
}

.info-icon {
  color: #409eff;
  font-size: 24px;
  margin-right: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

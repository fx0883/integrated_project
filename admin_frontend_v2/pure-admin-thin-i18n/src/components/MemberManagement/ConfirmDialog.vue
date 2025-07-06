<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    @close="handleCancel"
  >
    <div class="confirm-content" :class="{ 'is-danger': type === 'danger' }">
      <el-icon v-if="type === 'warning'" class="confirm-icon warning">
        <WarningFilled />
      </el-icon>
      <el-icon v-else-if="type === 'danger'" class="confirm-icon danger">
        <CircleCloseFilled />
      </el-icon>
      <el-icon v-else-if="type === 'info'" class="confirm-icon info">
        <InfoFilled />
      </el-icon>
      <div class="confirm-message">{{ content }}</div>
    </div>

    <div v-if="showInput" class="confirm-input">
      <el-input
        v-model="inputValue"
        :type="inputType"
        :placeholder="inputPlaceholder"
        :show-password="inputType === 'password'"
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :disabled="loading">
          {{ cancelText }}
        </el-button>
        <el-button
          :type="confirmButtonType"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmText }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  WarningFilled,
  CircleCloseFilled,
  InfoFilled
} from "@element-plus/icons-vue";

const { t } = useI18n();

const props = defineProps({
  // 对话框标题
  title: {
    type: String,
    default: ""
  },
  // 对话框内容
  content: {
    type: String,
    default: ""
  },
  // 对话框类型
  type: {
    type: String as () => "warning" | "danger" | "info",
    default: "warning"
  },
  // 对话框宽度
  width: {
    type: String,
    default: "420px"
  },
  // 是否显示
  visible: {
    type: Boolean,
    default: false
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 确认按钮文本
  confirmText: {
    type: String,
    default: ""
  },
  // 取消按钮文本
  cancelText: {
    type: String,
    default: ""
  },
  // 是否显示输入框
  showInput: {
    type: Boolean,
    default: false
  },
  // 输入框类型
  inputType: {
    type: String as () => "text" | "password" | "number",
    default: "text"
  },
  // 输入框占位符
  inputPlaceholder: {
    type: String,
    default: ""
  }
});

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "confirm", inputValue?: string): void;
  (e: "cancel"): void;
}>();

// 对话框可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 输入框值
const inputValue = ref("");

// 确认按钮类型
const confirmButtonType = computed(() => {
  switch (props.type) {
    case "danger":
      return "danger";
    case "warning":
      return "warning";
    default:
      return "primary";
  }
});

// 监听visible变化，重置输入框值
watch(
  () => props.visible,
  newValue => {
    if (newValue && props.showInput) {
      inputValue.value = "";
    }
  }
);

// 处理确认
const handleConfirm = () => {
  if (props.showInput) {
    emit("confirm", inputValue.value);
  } else {
    emit("confirm");
  }
};

// 处理取消
const handleCancel = () => {
  if (!props.loading) {
    emit("cancel");
  }
};
</script>

<style scoped>
.confirm-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.confirm-icon {
  font-size: 24px;
  margin-right: 12px;
}

.confirm-icon.warning {
  color: var(--el-color-warning);
}

.confirm-icon.danger {
  color: var(--el-color-danger);
}

.confirm-icon.info {
  color: var(--el-color-info);
}

.confirm-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}

.confirm-input {
  margin-top: 16px;
}

.is-danger .confirm-message {
  color: var(--el-color-danger);
}
</style>

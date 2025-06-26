<script lang="ts" setup>
import { defineProps, defineEmits, ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ""
  },
  content: {
    type: String,
    default: ""
  },
  type: {
    type: String,
    default: "warning"
  },
  confirmButtonText: {
    type: String,
    default: "确认"
  },
  cancelButtonText: {
    type: String,
    default: "取消"
  }
});

// 创建内部响应式变量来跟踪对话框状态
const localVisible = ref(props.visible);

// 监听props.visible的变化来更新内部状态
watch(
  () => props.visible,
  newValue => {
    localVisible.value = newValue;
  }
);

// 监听内部状态变化，通过emit事件通知父组件
watch(localVisible, newValue => {
  if (newValue !== props.visible) {
    emit("update:visible", newValue);
  }
});

const emit = defineEmits(["update:visible", "confirm", "cancel"]);

const handleClose = () => {
  localVisible.value = false;
  emit("update:visible", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
  localVisible.value = false;
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="title"
    width="30%"
    @close="handleClose"
    destroy-on-close
  >
    <span>{{ content }}</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">{{ cancelButtonText }}</el-button>
        <el-button :type="type" @click="handleConfirm">
          {{ confirmButtonText }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

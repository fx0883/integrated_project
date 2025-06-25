<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";

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

const emit = defineEmits(["update:visible", "confirm", "cancel"]);

const handleClose = () => {
  emit("update:visible", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    v-model="visible"
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

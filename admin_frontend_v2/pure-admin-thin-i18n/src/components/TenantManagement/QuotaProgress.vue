<script lang="ts" setup>
import { computed, defineProps } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  label: string;
  current: number;
  max: number;
  unit?: string;
}>();

// 计算进度百分比
const percentage = computed(() => {
  if (props.max <= 0) return 0;
  return Math.min(Math.round((props.current / props.max) * 100), 100);
});

// 计算进度条状态
const status = computed(() => {
  if (percentage.value > 90) return "exception";
  if (percentage.value > 70) return "warning";
  return "success";
});

// 格式化数值显示
const formattedValue = computed(() => {
  if (props.unit) {
    return `${props.current}/${props.max} ${props.unit}`;
  }
  return `${props.current}/${props.max}`;
});
</script>

<template>
  <div class="quota-progress">
    <div class="quota-label">{{ label }}</div>
    <el-progress
      :percentage="percentage"
      :status="status"
      :format="() => formattedValue"
      :stroke-width="15"
    />
  </div>
</template>

<style scoped>
.quota-progress {
  margin-bottom: 20px;
}

.quota-label {
  font-size: 14px;
  margin-bottom: 5px;
  color: #606266;
}
</style>

<script lang="ts" setup>
import { defineProps, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { CustomerStatus } from "@/types/customer";

const { t } = useI18n();

const props = defineProps<{
  status: CustomerStatus;
  size?: "large" | "default" | "small";
}>();

// 根据状态获取标签类型
const tagType = computed(() => {
  switch (props.status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "prospect":
      return "info";
    case "churned":
      return "danger";
    default:
      return "info";
  }
});

// 根据状态获取标签文本
const tagText = computed(() => {
  switch (props.status) {
    case "active":
      return t("customer.statusActive");
    case "inactive":
      return t("customer.statusInactive");
    case "prospect":
      return t("customer.statusProspect");
    case "churned":
      return t("customer.statusChurned");
    default:
      return props.status;
  }
});
</script>

<template>
  <el-tag :type="tagType" :size="size || 'default'" effect="light">
    {{ tagText }}
  </el-tag>
</template>

<style scoped>
.el-tag {
  text-transform: capitalize;
}
</style>

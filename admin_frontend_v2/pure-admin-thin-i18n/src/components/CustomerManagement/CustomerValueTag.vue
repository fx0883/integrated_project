<script lang="ts" setup>
import { defineProps, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { CustomerValueLevel } from "@/types/customer";

const { t } = useI18n();

const props = defineProps<{
  valueLevel: CustomerValueLevel;
  size?: "large" | "default" | "small";
}>();

// 根据价值等级获取标签类型和样式
const tagConfig = computed(() => {
  switch (props.valueLevel) {
    case "platinum":
      return {
        type: "info",
        class: "value-platinum"
      };
    case "gold":
      return {
        type: "warning",
        class: "value-gold"
      };
    case "silver":
      return {
        type: "info",
        class: "value-silver"
      };
    case "bronze":
      return {
        type: "warning",
        class: "value-bronze"
      };
    default:
      return {
        type: "info",
        class: ""
      };
  }
});

// 根据价值等级获取标签文本
const tagText = computed(() => {
  switch (props.valueLevel) {
    case "platinum":
      return t("customer.valuePlatinum");
    case "gold":
      return t("customer.valueGold");
    case "silver":
      return t("customer.valueSilver");
    case "bronze":
      return t("customer.valueBronze");
    default:
      return props.valueLevel;
  }
});
</script>

<template>
  <el-tag
    :type="tagConfig.type"
    :size="size || 'default'"
    effect="dark"
    :class="tagConfig.class"
  >
    {{ tagText }}
  </el-tag>
</template>

<style scoped>
.el-tag {
  text-transform: capitalize;
}

.value-platinum {
  background-color: #8e9aaf;
  border-color: #8e9aaf;
}

.value-gold {
  background-color: #ffd700;
  border-color: #ffd700;
  color: #333;
}

.value-silver {
  background-color: #c0c0c0;
  border-color: #c0c0c0;
  color: #333;
}

.value-bronze {
  background-color: #cd7f32;
  border-color: #cd7f32;
}
</style>

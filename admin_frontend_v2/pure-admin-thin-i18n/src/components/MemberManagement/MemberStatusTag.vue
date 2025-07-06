<template>
  <el-tag :type="tagType" :effect="effect" size="small">
    {{ statusText }}
  </el-tag>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { MemberStatus } from "@/types/member";

const { t } = useI18n();

const props = defineProps({
  // 会员状态
  status: {
    type: String as () => MemberStatus,
    required: true
  },
  // 标签效果
  effect: {
    type: String as () => "light" | "dark" | "plain",
    default: "light"
  }
});

// 根据状态获取标签类型
const tagType = computed(() => {
  switch (props.status) {
    case "active":
      return "success";
    case "inactive":
      return "info";
    case "locked":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "info";
  }
});

// 根据状态获取显示文本
const statusText = computed(() => {
  switch (props.status) {
    case "active":
      return t("member.statusActive");
    case "inactive":
      return t("member.statusInactive");
    case "locked":
      return t("member.statusLocked");
    case "pending":
      return t("member.statusPending");
    default:
      return props.status;
  }
});
</script>

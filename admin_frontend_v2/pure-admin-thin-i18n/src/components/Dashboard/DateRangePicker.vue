<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";

const props = defineProps({
  startDate: {
    type: String,
    default: ""
  },
  endDate: {
    type: String,
    default: ""
  },
  shortcuts: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(["update:range"]);
const { t } = useI18n();

// 内部日期范围值
const dateRange = ref<string[]>([]);

// 初始化日期范围
watch(
  () => [props.startDate, props.endDate],
  ([newStartDate, newEndDate]) => {
    if (newStartDate && newEndDate) {
      dateRange.value = [newStartDate, newEndDate];
    }
  },
  { immediate: true }
);

/**
 * 日期变更处理
 */
const handleDateChange = (val: string[]) => {
  if (val && val.length === 2) {
    emit("update:range", { startDate: val[0], endDate: val[1] });
  } else {
    emit("update:range", { startDate: "", endDate: "" });
  }
};

/**
 * 获取快捷选项
 */
const getShortcuts = () => [
  {
    text: t("dashboard.today"),
    value: () => {
      const today = dayjs().format("YYYY-MM-DD");
      return [today, today];
    }
  },
  {
    text: t("dashboard.thisWeek"),
    value: () => {
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().subtract(6, "day").format("YYYY-MM-DD");
      return [start, end];
    }
  },
  {
    text: t("dashboard.thisMonth"),
    value: () => {
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().startOf("month").format("YYYY-MM-DD");
      return [start, end];
    }
  },
  {
    text: t("dashboard.last30Days"),
    value: () => {
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().subtract(29, "day").format("YYYY-MM-DD");
      return [start, end];
    }
  },
  {
    text: t("dashboard.last3Months"),
    value: () => {
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().subtract(3, "month").format("YYYY-MM-DD");
      return [start, end];
    }
  },
  {
    text: t("dashboard.thisYear"),
    value: () => {
      const end = dayjs().format("YYYY-MM-DD");
      const start = dayjs().startOf("year").format("YYYY-MM-DD");
      return [start, end];
    }
  }
];
</script>

<template>
  <div class="date-range-picker">
    <el-date-picker
      v-model="dateRange"
      type="daterange"
      :range-separator="t('dashboard.to')"
      :start-placeholder="t('dashboard.startDate')"
      :end-placeholder="t('dashboard.endDate')"
      :shortcuts="shortcuts ? getShortcuts() : []"
      value-format="YYYY-MM-DD"
      @change="handleDateChange"
      style="min-width: 300px"
    />
  </div>
</template>

<style scoped>
.date-range-picker {
  display: inline-block;
}
</style>

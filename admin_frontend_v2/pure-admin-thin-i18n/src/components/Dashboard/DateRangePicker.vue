<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";
import logger from "@/utils/logger";

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
      logger.debug("日期范围已初始化", dateRange.value);
    }
  },
  { immediate: true }
);

/**
 * 日期变更处理
 */
const handleDateChange = (val: string[]) => {
  logger.debug("日期选择变更", val);
  if (val && val.length === 2) {
    logger.debug("发送日期范围更新", { startDate: val[0], endDate: val[1] });
    emit("update:range", { startDate: val[0], endDate: val[1] });
  } else {
    logger.debug("清除日期范围");
    emit("update:range", { startDate: "", endDate: "" });
  }
};

/**
 * 获取快捷选项
 * 注意: 系统中仅存在2025年4月和5月的数据
 */
const getShortcuts = () => [
  {
    text: "数据时间范围(全部)",
    value: () => {
      return ["2025-03-13", "2025-06-13"];
    }
  },
  {
    text: "2025年5月",
    value: () => {
      return ["2025-05-01", "2025-05-31"];
    }
  },
  {
    text: "2025年4月",
    value: () => {
      return ["2025-04-01", "2025-04-30"];
    }
  },
  {
    text: "2025年4-5月",
    value: () => {
      return ["2025-04-01", "2025-05-31"];
    }
  }
];
</script>

<template>
  <div class="date-range-picker">
    <div class="date-range-tip">系统中仅有2025年4月-5月数据</div>
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

.date-range-tip {
  font-size: 12px;
  color: #f56c6c;
  margin-bottom: 5px;
  background-color: #fef0f0;
  padding: 2px 5px;
  border-radius: 3px;
  border: 1px solid #fcdee2;
}
</style>

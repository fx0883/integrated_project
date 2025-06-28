<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import type { ChartPeriod } from "@/types/tenant";

const props = defineProps({
  value: {
    type: String as () => ChartPeriod,
    default: "monthly"
  },
  options: {
    type: Array as () => ChartPeriod[],
    default: () => ["daily", "weekly", "monthly", "quarterly", "yearly"]
  }
});

const emit = defineEmits(["update:period"]);
const { t } = useI18n();

// 当前选中的周期
const currentPeriod = ref<ChartPeriod>(props.value);

// 监听value变化
watch(
  () => props.value,
  newValue => {
    if (newValue) {
      currentPeriod.value = newValue;
    }
  }
);

/**
 * 周期变更处理
 */
const handlePeriodChange = (value: ChartPeriod) => {
  emit("update:period", value);
};

/**
 * 检查周期选项是否可用
 */
const hasOption = (period: ChartPeriod): boolean => {
  return props.options.includes(period);
};

/**
 * 周期名称翻译
 */
const getPeriodName = (period: ChartPeriod): string => {
  switch (period) {
    case "daily":
      return t("dashboard.daily");
    case "weekly":
      return t("dashboard.weekly");
    case "monthly":
      return t("dashboard.monthly");
    case "quarterly":
      return t("dashboard.quarterly");
    case "yearly":
      return t("dashboard.yearly");
    default:
      return period;
  }
};
</script>

<template>
  <div class="period-selector">
    <el-radio-group v-model="currentPeriod" @change="handlePeriodChange">
      <el-radio-button v-if="hasOption('daily')" value="daily">
        {{ getPeriodName("daily") }}
      </el-radio-button>
      <el-radio-button v-if="hasOption('weekly')" value="weekly">
        {{ getPeriodName("weekly") }}
      </el-radio-button>
      <el-radio-button v-if="hasOption('monthly')" value="monthly">
        {{ getPeriodName("monthly") }}
      </el-radio-button>
      <el-radio-button v-if="hasOption('quarterly')" value="quarterly">
        {{ getPeriodName("quarterly") }}
      </el-radio-button>
      <el-radio-button v-if="hasOption('yearly')" value="yearly">
        {{ getPeriodName("yearly") }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<style scoped>
.period-selector {
  display: inline-block;
  margin-left: 10px;
}

@media (max-width: 768px) {
  .period-selector {
    margin-left: 0;
    margin-top: 10px;
  }
}
</style>

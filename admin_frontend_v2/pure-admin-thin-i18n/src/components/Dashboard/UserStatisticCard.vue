<script lang="ts" setup>
import { defineProps } from "vue";
import { useI18n } from "vue-i18n";
import type { UserSummary, ChartPeriod } from "@/types/user";

// 定义props
const props = defineProps({
  data: {
    type: Object as () => UserSummary,
    default: () => ({
      totalUsers: 0,
      growthRate: 0,
      avgGrowth: 0,
      activeRate: 0
    })
  },
  period: {
    type: String as () => ChartPeriod,
    default: "monthly"
  }
});

// i18n支持
const { t } = useI18n();

// 根据周期获取增长率单位
const growthRateUnit = () => {
  switch (props.period) {
    case "daily":
      return t("dashboard.day");
    case "weekly":
      return t("dashboard.week");
    case "monthly":
      return t("dashboard.month");
    case "quarterly":
      return t("dashboard.quarter");
    case "yearly":
      return t("dashboard.year");
    default:
      return t("dashboard.month");
  }
};

// 根据活跃率获取颜色
function getActiveRateColor(rate: number): string {
  if (rate >= 80) return "#67c23a"; // 高活跃度：绿色
  if (rate >= 50) return "#409eff"; // 中等活跃度：蓝色
  if (rate >= 30) return "#e6a23c"; // 低活跃度：橙色
  return "#f56c6c"; // 非常低活跃度：红色
}
</script>

<template>
  <div class="statistic-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="statistic-card">
          <div class="statistic-title">{{ t("dashboard.userTotal") }}</div>
          <div class="statistic-value">{{ data.totalUsers }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="statistic-card">
          <div class="statistic-title">{{ t("dashboard.growthRate") }}</div>
          <div class="statistic-value">
            {{ data.growthRate }}%
            <el-tag
              size="small"
              :type="data.growthRate >= 0 ? 'success' : 'danger'"
              effect="dark"
              class="statistic-tag"
            >
              {{ data.growthRate >= 0 ? "+" : "" }}{{ data.growthRate }}%
            </el-tag>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="statistic-card">
          <div class="statistic-title">{{ t("dashboard.avgGrowth") }}</div>
          <div class="statistic-value">
            {{ data.avgGrowth }}
            <span class="statistic-unit">/{{ growthRateUnit() }}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="statistic-card">
          <div class="statistic-title">{{ t("dashboard.activeRate") }}</div>
          <div class="statistic-value">
            {{ data.activeRate }}%
            <el-progress
              :percentage="data.activeRate"
              :color="getActiveRateColor(data.activeRate)"
              :stroke-width="6"
              class="statistic-progress"
            />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.statistic-container {
  margin-bottom: 20px;
}

.statistic-card {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.statistic-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.statistic-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.statistic-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: center;
}

.statistic-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.statistic-tag {
  margin-left: 8px;
  font-size: 12px;
}

.statistic-progress {
  margin-left: 10px;
  flex: 1;
}
</style>

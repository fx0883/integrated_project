<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import TenantCharts from "@/components/Dashboard/TenantCharts.vue";

const { t } = useI18n();
</script>

<template>
  <div class="dashboard-container">
    <el-card class="dashboard-card">
      <template #header>
        <div class="dashboard-header">
          <h2 class="dashboard-title">{{ t("dashboard.title") }}</h2>
        </div>
      </template>

      <!-- 租户图表 -->
      <div class="dashboard-section">
        <h3 class="section-title">{{ t("dashboard.tenantChartsTitle") }}</h3>
        <TenantCharts />
      </div>

      <!-- 这里可以添加更多的Dashboard组件 -->
    </el-card>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-card {
  margin-bottom: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.dashboard-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}
</style>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import TenantCharts from "@/components/Dashboard/TenantCharts.vue";
import UserCharts from "@/components/Dashboard/UserCharts.vue";

const { t } = useI18n();
const activeTab = ref("tenant"); // 默认选中租户统计tab
</script>

<template>
  <div class="dashboard-container">
    <el-card class="dashboard-card">
      <template #header>
        <div class="dashboard-header">
          <h2 class="dashboard-title">{{ t("dashboard.title") }}</h2>
        </div>
      </template>

      <!-- Tab页切换 -->
      <el-tabs v-model="activeTab" class="dashboard-tabs">
        <el-tab-pane name="tenant" :label="t('dashboard.tenantChartsTitle')">
          <div class="dashboard-section">
            <TenantCharts />
          </div>
        </el-tab-pane>
        <el-tab-pane name="user" :label="t('dashboard.userChartsTitle')">
          <div class="dashboard-section" v-if="activeTab === 'user'">
            <UserCharts />
          </div>
        </el-tab-pane>
      </el-tabs>
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

.dashboard-tabs {
  width: 100%;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}

.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
}
</style>

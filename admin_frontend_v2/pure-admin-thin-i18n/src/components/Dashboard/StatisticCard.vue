<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import type { TenantSummary, ChartPeriod } from '@/types/tenant';

const props = defineProps({
  data: {
    type: Object as () => TenantSummary,
    required: true
  },
  period: {
    type: String as () => ChartPeriod,
    default: 'monthly'
  }
});

const { t } = useI18n();

/**
 * 格式化周期名称
 */
const formatPeriod = computed(() => {
  switch (props.period) {
    case 'daily':
      return t('dashboard.day');
    case 'weekly':
      return t('dashboard.week');
    case 'monthly':
      return t('dashboard.month');
    case 'quarterly':
      return t('dashboard.quarter');
    case 'yearly':
      return t('dashboard.year');
    default:
      return props.period;
  }
});
</script>

<template>
  <div class="statistic-cards">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="card">
          <div class="stat-item">
            <div class="stat-title">{{ t('dashboard.tenantTotal') }}</div>
            <div class="stat-value">{{ data.total }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="card">
          <div class="stat-item">
            <div class="stat-title">{{ t('dashboard.growthRate') }}</div>
            <div class="stat-value">
              {{ data.growthRate }}%
              <el-icon v-if="data.growthRate > 0" class="trend-up">
                <ArrowUp />
              </el-icon>
              <el-icon v-else-if="data.growthRate < 0" class="trend-down">
                <ArrowDown />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="card">
          <div class="stat-item">
            <div class="stat-title">{{ t('dashboard.avgGrowth') }}</div>
            <div class="stat-value">
              {{ data.avgGrowth }} / {{ formatPeriod }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.statistic-cards {
  margin-bottom: 20px;
}

.card {
  margin-bottom: 10px;
  transition: all 0.3s;
}

.card:hover {
  transform: translateY(-2px);
}

.stat-item {
  text-align: center;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.trend-up {
  color: #67c23a;
  font-size: 16px;
}

.trend-down {
  color: #f56c6c;
  font-size: 16px;
}

@media (max-width: 768px) {
  .card {
    margin-bottom: 15px;
  }
}
</style> 
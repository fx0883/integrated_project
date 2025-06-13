# 租户图表组件设计文档

本文档详细描述了租户图表功能的各个组件设计，包括它们的功能、接口和实现方式。

## 组件结构概览

```
TenantCharts.vue (容器组件)
├── DateRangePicker.vue (日期范围选择器)
├── PeriodSelector.vue (周期选择器) 
├── StatisticCard.vue (统计卡片)
├── Charts/
│   ├── TenantTrendChart.vue (租户数量趋势图)
│   ├── TenantStatusChart.vue (租户状态分布图)
│   └── TenantCreationChart.vue (租户创建速率图)
```

## 组件详细设计

### 1. TenantCharts.vue

**功能描述**：
- 作为租户图表的主容器组件
- 管理所有子组件的状态和数据
- 处理API请求和数据转换
- 负责错误处理和加载状态

**Props**：
- `initialPeriod` (可选)：初始周期设置，默认为'monthly'
- `initialDateRange` (可选)：初始日期范围

**State**：
- `period`：当前选择的周期（daily, weekly, monthly等）
- `startDate`：开始日期
- `endDate`：结束日期
- `loading`：各图表加载状态
- `error`：错误信息
- `summaryData`：汇总数据
- `trendData`：趋势图数据
- `statusData`：状态分布图数据
- `creationRateData`：创建速率图数据

**方法**：
- `fetchAllData()`：获取所有图表数据
- `handlePeriodChange()`：处理周期变更
- `handleDateRangeChange()`：处理日期范围变更
- `handleError()`：统一错误处理

**事件**：
- `data-loaded`：数据加载完成时触发
- `error`：发生错误时触发

**布局设计**：
```vue
<template>
  <div class="tenant-charts-container">
    <!-- 筛选区域 -->
    <div class="filters-container">
      <DateRangePicker 
        :start-date="startDate" 
        :end-date="endDate" 
        @update:range="handleDateRangeChange" 
      />
      <PeriodSelector 
        :value="period" 
        @update:period="handlePeriodChange" 
      />
    </div>
    
    <!-- 汇总数据卡片 -->
    <div class="summary-container">
      <StatisticCard 
        v-if="summaryData" 
        :data="summaryData" 
        :period="period" 
      />
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-wrapper">
      <el-row :gutter="20">
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>租户数量趋势</h3>
            </div>
            <div class="chart-body">
              <TenantTrendChart 
                :data="trendData" 
                :loading="loading.trend" 
                :period="period"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="24" :lg="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>租户状态分布</h3>
            </div>
            <div class="chart-body">
              <TenantStatusChart 
                :data="statusData" 
                :loading="loading.status" 
              />
            </div>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="chart-card">
            <div class="chart-header">
              <h3>租户创建速率</h3>
            </div>
            <div class="chart-body">
              <TenantCreationChart 
                :data="creationRateData" 
                :loading="loading.creation" 
                :period="period"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="error = ''"
    />
  </div>
</template>
```

### 2. DateRangePicker.vue

**功能描述**：
- 提供日期范围选择功能
- 支持预设时间范围（今天、本周、本月、过去3个月等）
- 验证日期输入有效性

**Props**：
- `startDate`：开始日期
- `endDate`：结束日期
- `shortcuts`：是否显示快捷选项，默认为true

**事件**：
- `update:range`：日期范围变更时触发，参数为 { startDate, endDate }

**实现**：
使用Element Plus的DatePicker组件，type设为'daterange'

```vue
<template>
  <div class="date-range-picker">
    <el-date-picker
      v-model="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      :shortcuts="shortcuts ? getShortcuts() : []"
      value-format="YYYY-MM-DD"
      @change="handleDateChange"
    />
  </div>
</template>
```

### 3. PeriodSelector.vue

**功能描述**：
- 提供周期选择功能
- 支持日、周、月、季、年等周期选择

**Props**：
- `value`：当前选择的周期
- `options`：可选择的周期列表，默认为全部

**事件**：
- `update:period`：周期变更时触发

**实现**：
使用Element Plus的Radio组件实现周期切换

```vue
<template>
  <div class="period-selector">
    <el-radio-group v-model="currentPeriod" @change="handlePeriodChange">
      <el-radio-button v-if="hasOption('daily')" label="daily">日</el-radio-button>
      <el-radio-button v-if="hasOption('weekly')" label="weekly">周</el-radio-button>
      <el-radio-button v-if="hasOption('monthly')" label="monthly">月</el-radio-button>
      <el-radio-button v-if="hasOption('quarterly')" label="quarterly">季</el-radio-button>
      <el-radio-button v-if="hasOption('yearly')" label="yearly">年</el-radio-button>
    </el-radio-group>
  </div>
</template>
```

### 4. StatisticCard.vue

**功能描述**：
- 显示租户数据的关键指标
- 支持数据趋势展示（上升/下降指标）
- 响应式布局，适应不同屏幕尺寸

**Props**：
- `data`：汇总数据对象
- `period`：当前周期，用于显示

**实现**：
使用Element Plus的Card和Icon组件展示统计信息

```vue
<template>
  <div class="statistic-cards">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-title">租户总数</div>
            <div class="stat-value">{{ data.total }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-title">增长率</div>
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
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-title">平均增长</div>
            <div class="stat-value">{{ data.avgGrowth }} / {{ formatPeriod(period) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
```

### 5. TenantTrendChart.vue

**功能描述**：
- 以折线图展示租户数量趋势
- 支持响应式调整
- 显示加载状态和空数据状态

**Props**：
- `data`：趋势图数据
- `loading`：加载状态
- `period`：当前周期，用于显示

**实现**：
使用ECharts和自定义的useChart hook实现

```vue
<template>
  <div class="chart-container">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="!data || data.labels.length === 0" class="chart-empty">
      <el-empty description="暂无数据" />
    </div>
    <div v-else ref="chartRef" class="chart"></div>
  </div>
</template>
```

### 6. TenantStatusChart.vue

**功能描述**：
- 以饼图展示租户状态分布
- 支持图例显示和交互
- 显示加载状态和空数据状态

**Props**：
- `data`：状态分布数据
- `loading`：加载状态

**实现**：
使用ECharts和自定义的useChart hook实现

```vue
<template>
  <div class="chart-container">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="!data || data.labels.length === 0" class="chart-empty">
      <el-empty description="暂无数据" />
    </div>
    <div v-else ref="chartRef" class="chart"></div>
  </div>
</template>
```

### 7. TenantCreationChart.vue

**功能描述**：
- 以柱状图展示租户创建速率
- 支持响应式调整
- 显示加载状态和空数据状态

**Props**：
- `data`：创建速率数据
- `loading`：加载状态
- `period`：当前周期，用于显示

**实现**：
使用ECharts和自定义的useChart hook实现

```vue
<template>
  <div class="chart-container">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="!data || data.labels.length === 0" class="chart-empty">
      <el-empty description="暂无数据" />
    </div>
    <div v-else ref="chartRef" class="chart"></div>
  </div>
</template>
```

## ECharts 配置详情

### 1. 租户数量趋势图

```typescript
// 折线图配置
const trendChartOptions = computed<echarts.EChartsOption>(() => {
  if (!props.data) return {};
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.labels,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: '租户数量'
    },
    series: [
      {
        name: props.data.datasets[0].label || '租户数量',
        type: 'line',
        data: props.data.datasets[0].data,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: props.data.datasets[0].color || '#5470c6'
        },
        itemStyle: {
          color: props.data.datasets[0].color || '#5470c6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: props.data.datasets[0].color ? `${props.data.datasets[0].color}80` : 'rgba(84, 112, 198, 0.5)'
            }, {
              offset: 1,
              color: props.data.datasets[0].color ? `${props.data.datasets[0].color}05` : 'rgba(84, 112, 198, 0.05)'
            }]
          }
        }
      }
    ]
  };
});
```

### 2. 租户状态分布图

```typescript
// 饼图配置
const statusChartOptions = computed<echarts.EChartsOption>(() => {
  if (!props.data) return {};
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      data: props.data.labels
    },
    series: [
      {
        name: props.data.datasets[0].label || '租户状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data: props.data.labels.map((label, index) => ({
          value: props.data.datasets[0].data[index],
          name: label,
          itemStyle: {
            color: props.data.datasets[0].colors?.[index]
          }
        }))
      }
    ]
  };
});
```

### 3. 租户创建速率图

```typescript
// 柱状图配置
const creationChartOptions = computed<echarts.EChartsOption>(() => {
  if (!props.data) return {};
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: props.data.labels,
        axisTick: {
          alignWithLabel: true
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '新增租户数'
      }
    ],
    series: [
      {
        name: props.data.datasets[0].label || '新增租户',
        type: 'bar',
        barWidth: '60%',
        data: props.data.datasets[0].data,
        itemStyle: {
          color: props.data.datasets[0].color || '#91cc75'
        }
      }
    ]
  };
});
```

## 样式设计

各组件将采用符合Element Plus风格的设计，并确保良好的响应式布局。主要样式规范如下：

```scss
.tenant-charts-container {
  padding: 20px;
  
  .filters-container {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 20px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 10px;
    }
  }
  
  .summary-container {
    margin-bottom: 20px;
  }
  
  .chart-card {
    background: #fff;
    border-radius: 4px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    .chart-header {
      padding: 12px 20px;
      border-bottom: 1px solid #ebeef5;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
    }
    
    .chart-body {
      padding: 20px;
      height: 300px;
      
      @media (max-width: 768px) {
        height: 250px;
      }
    }
  }
  
  .chart-container {
    width: 100%;
    height: 100%;
    position: relative;
    
    .chart {
      width: 100%;
      height: 100%;
    }
    
    .chart-loading,
    .chart-empty {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(255, 255, 255, 0.7);
    }
  }
}

// 统计卡片样式
.statistic-cards {
  .stat-item {
    text-align: center;
    
    .stat-title {
      font-size: 14px;
      color: #909399;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin-top: 5px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
      
      .trend-up {
        color: #67c23a;
      }
      
      .trend-down {
        color: #f56c6c;
      }
    }
  }
}
```

## 国际化支持

所有组件内的文本将支持国际化，使用项目的i18n机制：

```typescript
// 示例：在组件中使用国际化文本
const { t } = useI18n();

const chartTitle = computed(() => t('dashboard.tenantTrendChart'));
```

## 数据结构转换

API返回的数据需要进行转换以适应ECharts的需求，示例：

```typescript
// 将API响应数据转换为趋势图所需格式
function transformTrendData(apiResponse: ApiResponse<TenantChartData>): TenantChartData {
  if (!apiResponse.success || !apiResponse.data) {
    return { labels: [], datasets: [] };
  }
  
  return apiResponse.data;
}
```

## 组件间通信流程

1. **用户操作**：用户更改日期范围或周期
2. **事件触发**：DateRangePicker或PeriodSelector触发更新事件
3. **容器响应**：TenantCharts组件接收事件，更新状态
4. **数据刷新**：TenantCharts重新请求并处理数据
5. **状态下发**：处理后的数据通过props传递给子图表组件
6. **重新渲染**：图表组件接收新数据并重新渲染

## 组件复用考虑

设计这些组件时，充分考虑了复用性：

1. **筛选组件**：DateRangePicker和PeriodSelector可用于其他报表场景
2. **图表组件**：通过合理的抽象，可以方便地扩展支持其他类型的数据可视化
3. **钩子函数**：useChart钩子可用于项目中任何需要ECharts的场景

## 后续优化方向

1. **主题支持**：增加深色模式支持
2. **图表交互增强**：添加图表缩放、数据钻取等功能
3. **数据导出**：增加将图表数据导出为CSV/Excel的功能
4. **快照保存**：支持将图表保存为图片的功能 
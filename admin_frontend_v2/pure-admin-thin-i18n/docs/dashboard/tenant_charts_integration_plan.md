# 租户图表Dashboard集成执行计划

本文档提供了将租户图表集成到Dashboard的详细执行计划。这是一个分步骤的指南，旨在实现租户数量趋势、租户状态分布和租户创建速率三个图表的集成。

## 目标

将后端提供的三个租户图表API集成到前端Dashboard中，包括：

1. 租户数量趋势图（折线图）
2. 租户状态分布图（饼图）
3. 租户创建速率图（柱状图）

同时实现日期范围筛选、周期选择和数据汇总功能。

## 前置条件

1. ECharts已安装但需要启用
2. HTTP请求封装已存在
3. 后端API已准备好，权限验证通过JWT实现
4. Dashboard页面已存在，但需要扩展

## 执行步骤

### 第一阶段：准备工作与基础设施

#### 步骤1：启用ECharts

1. 在`src/main.ts`中取消注释ECharts相关代码：
   - 取消注释`import { useEcharts } from "@/plugins/echarts";`
   - 取消注释`.use(useEcharts);`

2. 创建ECharts辅助hook：
   - 在`src/hooks`目录下创建`useChart.ts`
   - 封装ECharts初始化、响应式调整等功能

#### 步骤2：创建API请求模块

1. 在`src/api/modules`目录下创建`tenant.ts`文件，实现以下API：
   - `fetchTenantTrendData`: 获取租户数量趋势
   - `fetchTenantStatusDistribution`: 获取租户状态分布
   - `fetchTenantCreationRate`: 获取租户创建速率

2. 创建类型定义：
   - 在`src/types`目录下创建`tenant.ts`
   - 定义图表数据接口和请求参数类型

### 第二阶段：组件开发

#### 步骤3：创建基础组件

1. 创建筛选组件：
   - 在`src/components/Dashboard`目录下创建`DateRangePicker.vue`
   - 在`src/components/Dashboard`目录下创建`PeriodSelector.vue`

2. 创建数据汇总卡片组件：
   - 在`src/components/Dashboard`目录下创建`StatisticCard.vue`

#### 步骤4：创建图表组件

1. 创建租户数量趋势图组件：
   - 在`src/components/Dashboard/Charts`目录下创建`TenantTrendChart.vue`

2. 创建租户状态分布图组件：
   - 在`src/components/Dashboard/Charts`目录下创建`TenantStatusChart.vue`

3. 创建租户创建速率图组件：
   - 在`src/components/Dashboard/Charts`目录下创建`TenantCreationChart.vue`

#### 步骤5：创建租户图表容器组件

1. 创建租户图表容器组件：
   - 在`src/components/Dashboard`目录下创建`TenantCharts.vue`
   - 集成筛选组件、数据汇总组件和三个图表组件
   - 实现组件间的数据共享和状态管理

### 第三阶段：Dashboard集成

#### 步骤6：集成到Dashboard页面

1. 修改`src/views/dashboard/index.vue`：
   - 导入并使用`TenantCharts`组件
   - 设计合适的布局，以适合展示图表
   - 实现Dashboard与图表组件的交互

2. 添加错误处理和加载状态：
   - 使用加载指示器
   - 添加错误处理UI

### 第四阶段：测试与优化

#### 步骤7：功能测试

1. 测试API调用：
   - 验证API请求是否正常工作
   - 检查权限验证和错误处理

2. 测试UI交互：
   - 验证日期筛选和周期选择功能
   - 检查图表渲染和响应式布局

#### 步骤8：性能优化

1. 实现数据缓存：
   - 缓存相同参数的请求结果
   - 减少重复请求

2. 优化图表渲染：
   - 调整图表配置，提高渲染性能
   - 优化大数据量下的显示

## 详细技术实现

### API接口实现

```typescript
// src/api/modules/tenant.ts
import { http } from "@/utils/http";
import type { TenantChartData, TenantStatusData, TenantCreationData } from "@/types/tenant";
import type { ApiResponse } from "@/types/api";

/**
 * 获取租户数量趋势数据
 */
export function fetchTenantTrendData(period = 'monthly', startDate?: string, endDate?: string) {
  let url = `/admin/charts/tenant-trend/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  return http.request<ApiResponse<TenantChartData>>("get", url);
}

/**
 * 获取租户状态分布数据
 */
export function fetchTenantStatusDistribution() {
  return http.request<ApiResponse<TenantStatusData>>("get", "/admin/charts/tenant-status-distribution/");
}

/**
 * 获取租户创建速率数据
 */
export function fetchTenantCreationRate(period = 'monthly', startDate?: string, endDate?: string) {
  let url = `/admin/charts/tenant-creation-rate/?period=${period}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  return http.request<ApiResponse<TenantCreationData>>("get", url);
}
```

### 类型定义

```typescript
// src/types/tenant.ts
export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
  colors?: string[];
}

export interface TenantChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface TenantStatusData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface TenantCreationData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface TenantSummary {
  total: number;
  growthRate: number;
  avgGrowth: number;
}

export type ChartPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
```

### ECharts Hook实现

```typescript
// src/hooks/useChart.ts
import { onMounted, onUnmounted, ref, Ref, watch } from 'vue';
import * as echarts from 'echarts/core';
import { debounce } from '@pureadmin/utils';

export function useChart(
  chartRef: Ref<HTMLDivElement | null>,
  options: Ref<echarts.EChartsOption>,
  autoResize = true
) {
  let chartInstance: echarts.ECharts | null = null;
  const loading = ref(false);

  function initChart() {
    if (!chartRef.value) return;
    
    chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption(options.value);
    
    if (autoResize) {
      window.addEventListener('resize', resizeHandler);
    }
  }

  function updateChart() {
    if (!chartInstance) return;
    chartInstance.setOption(options.value);
  }

  function setLoading(status: boolean) {
    loading.value = status;
    if (!chartInstance) return;
    
    if (status) {
      chartInstance.showLoading({
        text: '加载中...',
        maskColor: 'rgba(255, 255, 255, 0.6)'
      });
    } else {
      chartInstance.hideLoading();
    }
  }

  watch(options, () => {
    updateChart();
  });

  const resizeHandler = debounce(() => {
    if (chartInstance) {
      chartInstance.resize();
    }
  }, 100);

  onMounted(() => {
    initChart();
  });

  onUnmounted(() => {
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
    if (autoResize) {
      window.removeEventListener('resize', resizeHandler);
    }
  });

  return {
    chartInstance,
    loading,
    setLoading,
    updateChart
  };
}
```

## 组件结构与通信

组件之间的通信基于Vue的props和emit事件：

1. `TenantCharts`组件负责数据获取和状态管理，通过props向下传递数据
2. 筛选组件通过emit事件向上传递筛选条件变更
3. 图表组件接收数据并负责渲染

## 时间计划

| 阶段 | 估计时间 |
|------|----------|
| 第一阶段：准备工作与基础设施 | 1天 |
| 第二阶段：组件开发 | 2-3天 |
| 第三阶段：Dashboard集成 | 1天 |
| 第四阶段：测试与优化 | 1-2天 |
| 总计 | 5-7天 |

## 风险评估

1. **API兼容性**：后端API可能与前端预期不一致，需要提前对接
2. **权限处理**：确保权限检查正确实现，只有超级管理员可访问
3. **性能问题**：大数据量下图表性能可能受影响，需要优化渲染
4. **浏览器兼容性**：确保ECharts在各浏览器中正常工作

## 下一步行动

1. 启用ECharts
2. 创建API请求模块
3. 开发基础组件
4. 开始图表组件开发 
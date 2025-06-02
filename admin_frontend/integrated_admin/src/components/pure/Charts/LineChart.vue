<template>
  <div class="pure-chart">
    <div ref="chartRef" class="chart-container" :style="{ height: height, width: width }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import {
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
])

const props = defineProps({
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // X轴数据
  xAxisData: {
    type: Array,
    default: () => []
  },
  // 系列配置
  series: {
    type: Array,
    default: () => []
  },
  // 图表标题
  title: {
    type: String,
    default: ''
  },
  // 图表副标题
  subtitle: {
    type: String,
    default: ''
  },
  // 图表高度
  height: {
    type: String,
    default: '400px'
  },
  // 图表宽度
  width: {
    type: String,
    default: '100%'
  },
  // 自动调整大小
  autoResize: {
    type: Boolean,
    default: true
  },
  // 主题
  theme: {
    type: String,
    default: ''
  },
  // 是否平滑曲线
  smooth: {
    type: Boolean,
    default: false
  },
  // 是否显示区域填充
  areaStyle: {
    type: Boolean,
    default: false
  },
  // 是否显示数据缩放组件
  dataZoom: {
    type: Boolean,
    default: false
  },
  // 是否显示工具箱
  toolbox: {
    type: Boolean,
    default: true
  },
  // 是否显示图例
  legend: {
    type: Boolean,
    default: true
  },
  // 图例位置
  legendPosition: {
    type: String,
    default: 'top'
  },
  // X轴类型
  xAxisType: {
    type: String,
    default: 'category'
  },
  // Y轴类型
  yAxisType: {
    type: String,
    default: 'value'
  },
  // X轴名称
  xAxisName: {
    type: String,
    default: ''
  },
  // Y轴名称
  yAxisName: {
    type: String,
    default: ''
  },
  // 是否显示Y轴最小值为0
  yAxisMinToZero: {
    type: Boolean,
    default: false
  },
  // 额外配置
  options: {
    type: Object,
    default: () => ({})
  }
})

// 图表实例
const chartRef = ref(null)
let chartInstance = null

// 初始化echarts
const initChart = () => {
  if (!chartRef.value) return
  
  // 销毁现有实例
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  // 创建新实例
  chartInstance = echarts.init(chartRef.value, props.theme)
  
  // 更新图表
  updateChart()
  
  // 窗口调整大小事件
  if (props.autoResize) {
    window.addEventListener('resize', handleResize)
  }
}

// 更新图表配置和数据
const updateChart = () => {
  if (!chartInstance) return
  
  // 组装图表配置
  const option = {
    // 标题配置
    title: {
      text: props.title,
      subtext: props.subtitle,
      left: 'center'
    },
    // 工具箱配置
    toolbox: {
      show: props.toolbox,
      feature: {
        saveAsImage: {},
        dataView: { readOnly: true },
        magicType: { type: ['line', 'bar'] },
        restore: {}
      },
      right: '4%'
    },
    // 图例配置
    legend: {
      show: props.legend,
      top: props.legendPosition === 'top' ? '10' : undefined,
      bottom: props.legendPosition === 'bottom' ? '10' : undefined,
      left: props.legendPosition === 'left' ? '10' : undefined,
      right: props.legendPosition === 'right' ? '10' : undefined
    },
    // 提示框配置
    tooltip: {
      trigger: 'axis'
    },
    // 数据缩放配置
    dataZoom: props.dataZoom ? [
      {
        type: 'slider', 
        show: true, 
        start: 0, 
        end: 100
      },
      {
        type: 'inside',
        start: 0,
        end: 100
      }
    ] : [],
    // X轴配置
    xAxis: {
      type: props.xAxisType,
      data: props.xAxisData,
      name: props.xAxisName,
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        rotate: 0
      }
    },
    // Y轴配置
    yAxis: {
      type: props.yAxisType,
      name: props.yAxisName,
      min: props.yAxisMinToZero ? 0 : undefined,
      axisLine: {
        show: true
      },
      axisLabel: {
        formatter: '{value}'
      }
    },
    // 系列配置
    series: props.series.length > 0 ? props.series : props.data.map(item => ({
      name: item.name,
      type: 'line',
      data: item.data,
      smooth: props.smooth,
      symbol: 'emptyCircle',
      symbolSize: 5,
      // 根据配置添加区域样式
      areaStyle: props.areaStyle ? {
        opacity: 0.2
      } : undefined
    }))
  }
  
  // 合并额外配置
  Object.assign(option, props.options)
  
  // 应用配置
  chartInstance.setOption(option)
}

// 处理窗口大小调整
const handleResize = () => {
  chartInstance?.resize()
}

// 监听数据变化
watch(() => [props.data, props.series, props.xAxisData], () => {
  nextTick(() => updateChart())
}, { deep: true })

// 监听主题变化
watch(() => props.theme, () => {
  initChart()
})

// 组件挂载
onMounted(() => {
  nextTick(() => initChart())
})

// 组件卸载
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  window.removeEventListener('resize', handleResize)
})

// 暴露方法
defineExpose({
  // 获取图表实例
  getChartInstance: () => chartInstance,
  // 刷新图表
  refresh: updateChart,
  // 重置图表大小
  resize: handleResize
})
</script>

<style scoped>
.pure-chart {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style> 
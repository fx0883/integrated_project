<template>
  <div class="statistics-page">
    <div class="page-header">
      <h2 class="page-title">内容统计分析</h2>
      <div class="page-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :shortcuts="dateShortcuts"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" @click="refreshData" icon="Refresh">刷新数据</el-button>
        <el-dropdown @command="handleExport">
          <el-button type="success">
            导出数据 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="excel">导出为Excel</el-dropdown-item>
              <el-dropdown-item command="csv">导出为CSV</el-dropdown-item>
              <el-dropdown-item command="pdf">导出为PDF</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 概览数据卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6" v-for="(item, index) in overviewCards" :key="index">
        <el-card shadow="hover" :body-style="{ padding: '20px' }">
          <div class="overview-card">
            <div class="overview-icon" :style="{ backgroundColor: item.color }">
              <el-icon>
                <component :is="item.icon"></component>
              </el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ item.value }}</div>
              <div class="overview-title">{{ item.title }}</div>
              <div class="overview-change" :class="item.change > 0 ? 'positive' : item.change < 0 ? 'negative' : ''">
                <el-icon v-if="item.change > 0"><arrow-up /></el-icon>
                <el-icon v-else-if="item.change < 0"><arrow-down /></el-icon>
                <span>{{ Math.abs(item.change) }}% {{ item.change > 0 ? '增长' : item.change < 0 ? '下降' : '持平' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 访问趋势和评论趋势图表 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">文章访问趋势</div>
              <el-radio-group v-model="visitTimeUnit" size="small" @change="handleVisitTimeUnitChange">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div ref="visitChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">评论数量趋势</div>
              <el-radio-group v-model="commentTimeUnit" size="small" @change="handleCommentTimeUnitChange">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div ref="commentChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门内容和用户互动 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">热门文章排行</div>
            </div>
          </template>
          <el-table :data="popularArticles" stripe style="width: 100%">
            <el-table-column prop="title" label="标题" min-width="200">
              <template #default="{ row }">
                <el-link type="primary" @click="viewArticle(row.id)">{{ row.title }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="views_count" label="浏览量" width="100" align="center" sortable />
            <el-table-column prop="comments_count" label="评论数" width="100" align="center" sortable />
            <el-table-column prop="likes_count" label="点赞数" width="100" align="center" sortable />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">用户互动数据</div>
              <el-tabs v-model="interactionTab" class="interaction-tabs" @tab-change="handleInteractionTabChange">
                <el-tab-pane label="访问来源" name="source"></el-tab-pane>
                <el-tab-pane label="设备类型" name="device"></el-tab-pane>
                <el-tab-pane label="访问时段" name="time"></el-tab-pane>
              </el-tabs>
            </div>
          </template>
          <div class="chart-container">
            <div ref="interactionChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门分类和标签 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">热门分类排行</div>
            </div>
          </template>
          <div class="chart-container">
            <div ref="categoryChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">热门标签排行</div>
            </div>
          </template>
          <div class="tag-cloud-container">
            <div v-for="tag in popularTags" :key="tag.id" 
                 class="tag-item"
                 :style="{ 
                   fontSize: getTagSize(tag.articles_count) + 'px',
                   color: getRandomColor(tag.id)
                 }">
              {{ tag.name }} ({{ tag.articles_count }})
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Refresh, ArrowUp, ArrowDown, Document, Comment, 
  User, View, DataLine, PieChart, Promotion, Calendar
} from '@element-plus/icons-vue'
import { statisticsApi } from '@/api/statistics'
import * as echarts from 'echarts/core'
import { 
  BarChart, LineChart, PieChart as EChartsPie, 
  RadarChart, ScatterChart 
} from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  DatasetComponent, TransformComponent, LegendComponent,
  ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ElMessage, ElLoading } from 'element-plus'
import { addDays, format, parseISO, subDays, subMonths } from 'date-fns'

// 注册必要的ECharts组件
echarts.use([
  BarChart, LineChart, EChartsPie, RadarChart, ScatterChart,
  TitleComponent, TooltipComponent, GridComponent,
  DatasetComponent, TransformComponent, LegendComponent,
  ToolboxComponent, CanvasRenderer
])

const router = useRouter()

// 图表实例
let visitChart = null
let commentChart = null
let interactionChart = null
let categoryChart = null

// 图表容器引用
const visitChartRef = ref(null)
const commentChartRef = ref(null)
const interactionChartRef = ref(null)
const categoryChartRef = ref(null)

// 日期范围相关
const dateRange = ref([
  format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  format(new Date(), 'yyyy-MM-dd')
])

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = subDays(end, 7)
      return [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = subDays(end, 30)
      return [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = subMonths(end, 3)
      return [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')]
    },
  },
]

// 图表时间单位
const visitTimeUnit = ref('day')
const commentTimeUnit = ref('day')
const interactionTab = ref('source')

// 数据状态
const overviewData = ref(null)
const popularArticles = ref([])
const popularCategories = ref([])
const popularTags = ref([])
const visitData = ref([])
const commentData = ref([])
const interactionData = reactive({
  source: [],
  device: [],
  time: []
})

// 概览卡片数据
const overviewCards = ref([
  { 
    title: '文章总数', 
    value: 0, 
    change: 0, 
    icon: 'Document', 
    color: '#409EFF' 
  },
  { 
    title: '总浏览量', 
    value: 0, 
    change: 0, 
    icon: 'View', 
    color: '#67C23A' 
  },
  { 
    title: '评论总数', 
    value: 0, 
    change: 0, 
    icon: 'Comment', 
    color: '#E6A23C' 
  },
  { 
    title: '用户互动', 
    value: 0, 
    change: 0, 
    icon: 'User', 
    color: '#F56C6C' 
  }
])

// 加载数据
const loadAllData = async () => {
  const loadingInstance = ElLoading.service({
    target: '.statistics-page',
    text: '加载统计数据中...'
  })
  
  try {
    // 并行加载多个数据
    await Promise.all([
      loadOverviewData(),
      loadVisitData(),
      loadCommentData(),
      loadPopularArticles(),
      loadPopularCategories(),
      loadPopularTags(),
      loadInteractionData()
    ])
    
    // 数据加载完成后渲染图表
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败，请稍后重试')
  } finally {
    loadingInstance.close()
  }
}

// 加载概览数据
const loadOverviewData = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    const response = await statisticsApi.getCmsOverview(params)
    overviewData.value = response.data
    
    // 更新概览卡片数据
    overviewCards.value[0].value = overviewData.value.articles_count || 0
    overviewCards.value[0].change = overviewData.value.articles_change || 0
    
    overviewCards.value[1].value = overviewData.value.views_count || 0
    overviewCards.value[1].change = overviewData.value.views_change || 0
    
    overviewCards.value[2].value = overviewData.value.comments_count || 0
    overviewCards.value[2].change = overviewData.value.comments_change || 0
    
    overviewCards.value[3].value = overviewData.value.interactions_count || 0
    overviewCards.value[3].change = overviewData.value.interactions_change || 0
  } catch (error) {
    console.error('加载概览数据失败:', error)
    throw error
  }
}

// 加载访问数据
const loadVisitData = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      unit: visitTimeUnit.value
    }
    const response = await statisticsApi.getAccessLogStatistics(params)
    visitData.value = response.data
  } catch (error) {
    console.error('加载访问数据失败:', error)
    throw error
  }
}

// 加载评论数据
const loadCommentData = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      unit: commentTimeUnit.value
    }
    const response = await statisticsApi.getCommentStatistics(params)
    commentData.value = response.data
  } catch (error) {
    console.error('加载评论数据失败:', error)
    throw error
  }
}

// 加载热门文章
const loadPopularArticles = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      limit: 10
    }
    const response = await statisticsApi.getPopularArticles(params)
    popularArticles.value = response.data
  } catch (error) {
    console.error('加载热门文章失败:', error)
    throw error
  }
}

// 加载热门分类
const loadPopularCategories = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      limit: 10
    }
    const response = await statisticsApi.getPopularCategories(params)
    popularCategories.value = response.data
  } catch (error) {
    console.error('加载热门分类失败:', error)
    throw error
  }
}

// 加载热门标签
const loadPopularTags = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      limit: 30
    }
    const response = await statisticsApi.getPopularTags(params)
    popularTags.value = response.data
  } catch (error) {
    console.error('加载热门标签失败:', error)
    throw error
  }
}

// 加载用户互动数据
const loadInteractionData = async () => {
  try {
    const params = {
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    
    // 加载访问来源数据
    const sourceResponse = await statisticsApi.getVisitSourceStatistics(params)
    interactionData.source = sourceResponse.data
    
    // 加载设备数据
    const deviceResponse = await statisticsApi.getDeviceStatistics(params)
    interactionData.device = deviceResponse.data
    
    // 加载时间段数据
    const timeResponse = await statisticsApi.getTimeRangeStatistics(params)
    interactionData.time = timeResponse.data
  } catch (error) {
    console.error('加载用户互动数据失败:', error)
    throw error
  }
}

// 初始化图表
const initCharts = () => {
  // 销毁旧图表实例
  if (visitChart) visitChart.dispose()
  if (commentChart) commentChart.dispose()
  if (interactionChart) interactionChart.dispose()
  if (categoryChart) categoryChart.dispose()
  
  // 初始化访问趋势图表
  initVisitChart()
  
  // 初始化评论趋势图表
  initCommentChart()
  
  // 初始化互动数据图表
  initInteractionChart()
  
  // 初始化分类图表
  initCategoryChart()
}

// 初始化访问趋势图表
const initVisitChart = () => {
  if (!visitChartRef.value) return
  
  visitChart = echarts.init(visitChartRef.value)
  
  const xAxisData = visitData.value.map(item => item.date)
  const seriesData = visitData.value.map(item => item.views_count)
  
  const option = {
    title: {
      text: '文章访问趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '访问次数'
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        data: seriesData,
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  
  visitChart.setOption(option)
}

// 初始化评论趋势图表
const initCommentChart = () => {
  if (!commentChartRef.value) return
  
  commentChart = echarts.init(commentChartRef.value)
  
  const xAxisData = commentData.value.map(item => item.date)
  const approvedData = commentData.value.map(item => item.approved_count || 0)
  const pendingData = commentData.value.map(item => item.pending_count || 0)
  const rejectedData = commentData.value.map(item => item.rejected_count || 0)
  
  const option = {
    title: {
      text: '评论数量趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['已批准', '待审核', '已拒绝'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '评论数'
    },
    series: [
      {
        name: '已批准',
        type: 'bar',
        stack: 'total',
        data: approvedData,
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '待审核',
        type: 'bar',
        stack: 'total',
        data: pendingData,
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '已拒绝',
        type: 'bar',
        stack: 'total',
        data: rejectedData,
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  }
  
  commentChart.setOption(option)
}

// 初始化互动数据图表
const initInteractionChart = () => {
  if (!interactionChartRef.value) return
  
  interactionChart = echarts.init(interactionChartRef.value)
  
  let option = {}
  
  // 根据当前选项卡显示不同图表
  if (interactionTab.value === 'source') {
    // 访问来源饼图
    const data = interactionData.source.map(item => ({
      name: item.source,
      value: item.count
    }))
    
    option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: data.map(item => item.name)
      },
      series: [
        {
          name: '访问来源',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    }
  } else if (interactionTab.value === 'device') {
    // 设备类型饼图
    const data = interactionData.device.map(item => ({
      name: item.device,
      value: item.count
    }))
    
    option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        data: data.map(item => item.name)
      },
      series: [
        {
          name: '设备类型',
          type: 'pie',
          radius: '55%',
          center: ['50%', '50%'],
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }
  } else {
    // 访问时段柱状图
    const xAxisData = interactionData.time.map(item => `${item.hour}:00`)
    const seriesData = interactionData.time.map(item => item.count)
    
    option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData
      },
      yAxis: {
        type: 'value',
        name: '访问次数'
      },
      series: [
        {
          name: '访问次数',
          type: 'bar',
          data: seriesData,
          itemStyle: {
            color: function(params) {
              // 根据小时生成不同颜色
              const hour = parseInt(params.name)
              if (hour >= 0 && hour < 6) {
                return '#8395a7' // 深夜
              } else if (hour >= 6 && hour < 12) {
                return '#54a0ff' // 上午
              } else if (hour >= 12 && hour < 18) {
                return '#feca57' // 下午
              } else {
                return '#5f27cd' // 晚上
              }
            }
          }
        }
      ]
    }
  }
  
  interactionChart.setOption(option)
}

// 初始化分类图表
const initCategoryChart = () => {
  if (!categoryChartRef.value) return
  
  categoryChart = echarts.init(categoryChartRef.value)
  
  const data = popularCategories.value.map(item => ({
    name: item.name,
    value: item.articles_count
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} 篇文章'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20,
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '分类文章数',
        type: 'pie',
        radius: '55%',
        center: ['40%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  categoryChart.setOption(option)
}

// 计算标签大小
const getTagSize = (count) => {
  if (!popularTags.value.length) return 14
  
  const maxCount = Math.max(...popularTags.value.map(tag => tag.articles_count || 0))
  if (maxCount <= 0) return 14
  
  const minSize = 12
  const maxSize = 28
  return minSize + (count / maxCount) * (maxSize - minSize)
}

// 根据ID生成随机颜色
const getRandomColor = (id) => {
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f',
    '#e67e22', '#e74c3c', '#34495e', '#16a085', '#27ae60',
    '#2980b9', '#8e44ad', '#f39c12', '#d35400', '#c0392b'
  ]
  
  // 使用ID作为索引以保证同一标签颜色一致
  return colors[id % colors.length]
}

// 事件处理函数
const handleDateRangeChange = () => {
  loadAllData()
}

const handleVisitTimeUnitChange = () => {
  loadVisitData().then(() => {
    initVisitChart()
  })
}

const handleCommentTimeUnitChange = () => {
  loadCommentData().then(() => {
    initCommentChart()
  })
}

const handleInteractionTabChange = () => {
  initInteractionChart()
}

// 刷新数据
const refreshData = () => {
  loadAllData()
}

// 导出数据
const handleExport = (type) => {
  const params = {
    start_date: dateRange.value[0],
    end_date: dateRange.value[1],
    format: type
  }
  
  statisticsApi.exportStatistics(params).then(() => {
    ElMessage.success(`数据已导出为${type.toUpperCase()}格式`)
  }).catch(error => {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败')
  })
}

// 查看文章详情
const viewArticle = (articleId) => {
  if (!articleId) return
  router.push(`/cms/article/view/${articleId}`)
}

// 窗口大小改变时重新调整图表大小
const handleResize = () => {
  visitChart?.resize()
  commentChart?.resize()
  interactionChart?.resize()
  categoryChart?.resize()
}

// 组件挂载时加载数据并初始化图表
onMounted(() => {
  loadAllData()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理图表实例和事件监听
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  visitChart?.dispose()
  commentChart?.dispose()
  interactionChart?.dispose()
  categoryChart?.dispose()
})
</script>

<style scoped>
.statistics-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
}

.page-actions {
  display: flex;
  gap: 12px;
}

/* 概览卡片样式 */
.overview-card {
  display: flex;
  align-items: center;
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
}

.overview-icon .el-icon {
  font-size: 30px;
  color: white;
}

.overview-info {
  flex: 1;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.overview-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.overview-change {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.overview-change.positive {
  color: #67C23A;
}

.overview-change.negative {
  color: #F56C6C;
}

.overview-change .el-icon {
  margin-right: 3px;
}

/* 图表容器样式 */
.chart-container {
  position: relative;
}

.chart {
  width: 100%;
  height: 350px;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
}

/* 标签云样式 */
.tag-cloud-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px;
  min-height: 350px;
}

.tag-item {
  padding: 5px 10px;
  border-radius: 15px;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tag-item:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 互动标签页样式 */
.interaction-tabs {
  margin-left: 20px;
}

.interaction-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.interaction-tabs :deep(.el-tabs__nav-wrap) {
  padding-right: 0;
}

/* 通用间距 */
.mb-4 {
  margin-bottom: 20px;
}
</style> 
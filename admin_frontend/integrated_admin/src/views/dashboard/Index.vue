<template>
  <div class="dashboard-container">
    <!-- 欢迎卡片 -->
    <div class="welcome-card">
      <div class="welcome-info">
        <h2>欢迎回来，{{ userDisplayName }}</h2>
        <p>{{ greeting }}</p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="data-overview">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statisticsData" :key="index">
        <el-card shadow="hover" class="statistics-card">
          <div class="statistics-icon" :class="item.color">
            <el-icon>
              <component :is="item.icon"></component>
            </el-icon>
          </div>
          <div class="statistics-info">
            <div class="statistics-title">{{ item.title }}</div>
            <div class="statistics-value">{{ item.value }}</div>
            <div class="statistics-trend" :class="item.trend > 0 ? 'up' : 'down'" v-if="item.trend !== 0">
              <el-icon>
                <component :is="item.trend > 0 ? 'ArrowUp' : 'ArrowDown'"></component>
              </el-icon>
              {{ Math.abs(item.trend) }}% {{ item.trend > 0 ? '增长' : '下降' }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-container">
      <!-- 趋势图 -->
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>使用趋势</span>
              <div class="chart-actions">
                <el-radio-group v-model="trendPeriod" size="small">
                  <el-radio-button label="week">本周</el-radio-button>
                  <el-radio-button label="month">本月</el-radio-button>
                  <el-radio-button label="year">全年</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div class="chart-content trend-chart" ref="trendChartRef"></div>
        </el-card>
      </el-col>

      <!-- 分布图 -->
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>用户分布</span>
              <el-dropdown trigger="click" @command="handleDistributionChange">
                <el-button size="small" type="primary" text>
                  {{ distributionTypes[distributionType] }}
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="(name, type) in distributionTypes" 
                                      :key="type" 
                                      :command="type">
                      {{ name }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <div class="chart-content pie-chart" ref="pieChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-row :gutter="20" class="activities-container">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <div class="card-header">
              <span>最近登录</span>
              <el-button size="small" text @click="loadMoreLogins">查看更多</el-button>
            </div>
          </template>
          <div class="activity-list login-list">
            <el-empty description="暂无登录记录" v-if="recentLogins.length === 0"></el-empty>
            <div v-for="(item, index) in recentLogins" :key="index" class="activity-item">
              <div class="activity-time">{{ item.time }}</div>
              <div class="activity-content">
                <el-avatar :size="32" :src="processAvatar(item.avatar)">
                  {{ item.name.charAt(0) }}
                </el-avatar>
                <div class="activity-info">
                  <div class="activity-title">{{ item.name }} 登录了系统</div>
                  <div class="activity-meta">{{ item.ip }} - {{ item.location }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="recent-card">
          <template #header>
            <div class="card-header">
              <span>系统日志</span>
              <el-button size="small" text @click="loadMoreLogs">查看更多</el-button>
            </div>
          </template>
          <div class="activity-list log-list">
            <el-empty description="暂无系统日志" v-if="systemLogs.length === 0"></el-empty>
            <div v-for="(item, index) in systemLogs" :key="index" class="activity-item">
              <div class="activity-time">{{ item.time }}</div>
              <div class="activity-content">
                <div class="activity-icon" :class="item.type">
                  <el-icon>
                    <component :is="getLogIcon(item.type)"></component>
                  </el-icon>
                </div>
                <div class="activity-info">
                  <div class="activity-title">{{ item.title }}</div>
                  <div class="activity-meta">{{ item.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useAuthStore } from '../../stores'
import * as echarts from 'echarts/core'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { LineChart, PieChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { 
  Setting, OfficeBuilding, User, Goods, Money, 
  ArrowUp, ArrowDown, DataLine, PieChart as PieChartIcon,
  SuccessFilled, WarningFilled, InfoFilled, CircleCloseFilled
} from '@element-plus/icons-vue'

// 注册必要的 echarts 组件
echarts.use([
  TitleComponent, TooltipComponent, LegendComponent, GridComponent,
  LineChart, PieChart, CanvasRenderer, UniversalTransition
])

// 获取认证信息
const authStore = useAuthStore()

// 用户显示名称
const userDisplayName = computed(() => {
  return authStore.user?.real_name || authStore.user?.username || '用户'
})

// 根据时间生成问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好！又是努力工作的一天。'
  if (hour < 9) return '早上好！愿你有个美好的一天。'
  if (hour < 12) return '上午好！今天工作进展如何？'
  if (hour < 14) return '中午好！记得午休一下哦。'
  if (hour < 18) return '下午好！再接再厉完成今天的任务吧。'
  if (hour < 22) return '晚上好！辛苦了，别忘了休息。'
  return '夜深了，注意休息哦。'
})

// 统计数据
const statisticsData = ref([
  { 
    title: '活跃用户',
    value: '1,234',
    icon: 'User',
    color: 'blue',
    trend: 12.5
  },
  { 
    title: '总租户数',
    value: '56',
    icon: 'OfficeBuilding',
    color: 'green',
    trend: 3.2
  },
  { 
    title: '系统资源',
    value: '85%',
    icon: 'DataLine',
    color: 'orange',
    trend: -2.1
  },
  { 
    title: '运行状态',
    value: '正常',
    icon: 'SuccessFilled',
    color: 'purple',
    trend: 0
  }
])

// 趋势图相关
const trendChartRef = ref(null)
let trendChart = null
const trendPeriod = ref('week')
const trendData = reactive({
  week: {
    labels: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    users: [120, 132, 101, 134, 90, 50, 70],
    visits: [220, 182, 191, 234, 290, 330, 310]
  },
  month: {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
    users: Array.from({ length: 30 }, () => Math.floor(Math.random() * 200 + 100)),
    visits: Array.from({ length: 30 }, () => Math.floor(Math.random() * 300 + 200))
  },
  year: {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    users: [320, 302, 301, 334, 390, 330, 320, 301, 302, 331, 342, 368],
    visits: [820, 832, 901, 934, 1290, 1330, 1320, 1001, 902, 931, 942, 1068]
  }
})

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  // 先销毁之前可能存在的实例
  if (trendChart) {
    trendChart.dispose()
  }
  
  // 创建图表实例
  trendChart = echarts.init(trendChartRef.value)
  
  // 设置图表选项
  updateTrendChart()
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    trendChart && trendChart.resize()
  })
}

// 更新趋势图数据
const updateTrendChart = () => {
  if (!trendChart) return
  
  // 获取当前周期的数据
  const data = trendData[trendPeriod.value]
  
  // 设置图表选项
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['用户数', '访问量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.labels
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '用户数',
        type: 'line',
        stack: 'Total',
        data: data.users,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      },
      {
        name: '访问量',
        type: 'line',
        stack: 'Total',
        data: data.visits,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#67C23A'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ]
          }
        }
      }
    ]
  }
  
  // 更新图表
  trendChart.setOption(option)
  
  // 输出日志，方便调试
  console.log(`趋势图更新完成，周期：${trendPeriod.value}`)
}

// 监听时间周期变化，更新趋势图
watch(trendPeriod, (newValue) => {
  console.log('时间周期已变更为:', newValue)
  nextTick(() => {
    updateTrendChart()
  })
})

// 分布图相关
const pieChartRef = ref(null)
let pieChart = null
const distributionType = ref('role')
const distributionTypes = {
  role: '按角色',
  region: '按地区',
  device: '按设备'
}
const distributionData = reactive({
  role: [
    { value: 45, name: '管理员' },
    { value: 25, name: '运营' },
    { value: 15, name: '财务' },
    { value: 15, name: '普通用户' }
  ],
  region: [
    { value: 35, name: '华东' },
    { value: 30, name: '华北' },
    { value: 20, name: '华南' },
    { value: 10, name: '西部' },
    { value: 5, name: '其他' }
  ],
  device: [
    { value: 60, name: '桌面端' },
    { value: 30, name: '移动端' },
    { value: 10, name: '其他' }
  ]
})

// 初始化分布图
const initPieChart = () => {
  if (!pieChartRef.value) return
  
  // 先销毁之前可能存在的实例
  if (pieChart) {
    pieChart.dispose()
  }
  
  // 创建图表实例
  pieChart = echarts.init(pieChartRef.value)
  
  // 设置图表选项
  updatePieChart()
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    pieChart && pieChart.resize()
  })
}

// 更新分布图数据
const updatePieChart = () => {
  if (!pieChart) return
  
  // 获取当前类型的数据
  const data = distributionData[distributionType.value]
  
  // 设置图表选项
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: distributionTypes[distributionType.value],
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
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
            fontSize: '14',
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
  
  // 更新图表
  pieChart.setOption(option)
  
  // 输出日志，方便调试
  console.log(`分布图更新完成，类型：${distributionTypes[distributionType.value]}`)
}

// 分布类型变更处理
const handleDistributionChange = (type) => {
  distributionType.value = type
  updatePieChart()
}

// 监听分布类型变化
watch(distributionType, (newValue) => {
  console.log('分布类型已变更为:', newValue)
  nextTick(() => {
    updatePieChart()
  })
})

// 最近登录数据
const recentLogins = ref([
  {
    name: '张三',
    time: '10分钟前',
    ip: '192.168.1.100',
    location: '北京',
    avatar: ''
  },
  {
    name: '李四',
    time: '30分钟前',
    ip: '192.168.1.101',
    location: '上海',
    avatar: ''
  },
  {
    name: '王五',
    time: '1小时前',
    ip: '192.168.1.102',
    location: '广州',
    avatar: ''
  },
  {
    name: '赵六',
    time: '2小时前',
    ip: '192.168.1.103',
    location: '深圳',
    avatar: ''
  }
])

// 加载更多登录记录
const loadMoreLogins = () => {
  console.log('加载更多登录记录')
  // 这里应该调用接口获取更多数据
}

// 系统日志数据
const systemLogs = ref([
  {
    title: '系统启动',
    content: '系统成功启动，所有服务正常运行',
    time: '今天 08:00',
    type: 'success'
  },
  {
    title: '备份完成',
    content: '系统自动备份完成，备份文件已保存',
    time: '今天 03:00',
    type: 'info'
  },
  {
    title: '数据同步',
    content: '与远程服务器数据同步完成',
    time: '昨天 20:30',
    type: 'success'
  },
  {
    title: '安全警告',
    content: '检测到多次失败的登录尝试',
    time: '昨天 16:45',
    type: 'warning'
  }
])

// 获取日志图标
const getLogIcon = (type) => {
  const icons = {
    success: 'SuccessFilled',
    warning: 'WarningFilled',
    info: 'InfoFilled',
    error: 'CircleCloseFilled'
  }
  return icons[type] || 'InfoFilled'
}

// 加载更多系统日志
const loadMoreLogs = () => {
  console.log('加载更多系统日志')
  // 这里应该调用接口获取更多数据
}

// 刷新数据
const refreshData = () => {
  console.log('刷新数据')
  // 实际项目中这里应该调用接口重新获取数据
}

// 定时器
let timer = null

// 刷新时间
const refreshTime = () => {
  console.log('自动刷新时间：', new Date().toLocaleTimeString())
  // 实际项目中可以在这里更新一些需要定时刷新的数据
}

// 初始化统计数据
const initCountData = async () => {
  try {
    console.log('正在初始化统计数据...')
    // 实际项目中应该调用API获取最新的统计数据
    // 这里使用模拟数据
    statisticsData.value = [
      { 
        title: '活跃用户',
        value: '1,234',
        icon: 'User',
        color: 'blue',
        trend: 12.5
      },
      { 
        title: '总租户数',
        value: '56',
        icon: 'OfficeBuilding',
        color: 'green',
        trend: 3.2
      },
      { 
        title: '系统资源',
        value: '85%',
        icon: 'DataLine',
        color: 'orange',
        trend: -2.1
      },
      { 
        title: '运行状态',
        value: '正常',
        icon: 'SuccessFilled',
        color: 'purple',
        trend: 0
      }
    ]
    console.log('统计数据初始化完成')
  } catch (error) {
    console.error('初始化统计数据失败:', error)
  }
}

// 解析头像URL
const processAvatar = (avatar) => {
  return avatar;
}

// 组件挂载后初始化图表
onMounted(() => {
  authStore.fetchCurrentUser()
  initCountData()
  nextTick(() => {
    initTrendChart()
    initPieChart()
  })
  timer = setInterval(() => {
    refreshTime()
  }, 60000)
})

// 组件卸载前销毁图表
onBeforeUnmount(() => {
  // 销毁图表实例
  trendChart && trendChart.dispose()
  pieChart && pieChart.dispose()
  
  // 清除定时器
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 0 0 20px 0;
  width: 100%;
  box-sizing: border-box;
}

/* 欢迎卡片 */
.welcome-card {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.welcome-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

/* 统计卡片 */
.data-overview {
  margin-bottom: 20px;
}

.statistics-card {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 20px;
  transition: all 0.3s;
}

.statistics-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.statistics-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-right: 15px;
}

.statistics-icon.blue {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.statistics-icon.green {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.statistics-icon.orange {
  background-color: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}

.statistics-icon.purple {
  background-color: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.statistics-info {
  flex: 1;
}

.statistics-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.statistics-value {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
}

.statistics-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.statistics-trend.up {
  color: #67C23A;
}

.statistics-trend.down {
  color: #F56C6C;
}

/* 图表区域 */
.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
  margin-bottom: 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.chart-content {
  width: 100%;
  height: 350px;
}

/* 最近活动 */
.activities-container {
  margin-bottom: 0;
}

.recent-card {
  height: 100%;
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.activity-content {
  display: flex;
  align-items: flex-start;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  font-size: 16px;
}

.activity-icon.success {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}

.activity-icon.warning {
  background-color: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}

.activity-icon.error {
  background-color: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

.activity-icon.info {
  background-color: rgba(144, 147, 153, 0.1);
  color: #909399;
}

.activity-info {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
}

.activity-meta {
  font-size: 12px;
  color: #909399;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
  
  .welcome-actions {
    margin-top: 15px;
    width: 100%;
  }
  
  .welcome-actions .el-button {
    width: 100%;
  }
  
  .statistics-card {
    margin-bottom: 15px;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-actions {
    margin-top: 10px;
    width: 100%;
  }
  
  .chart-content {
    height: 250px;
  }
  
  .data-overview .el-col {
    width: 100%;
  }
}

/* 响应式调整 */
@media (max-width: 992px) {
  .chart-content {
    height: 300px;
  }
  
  .statistics-card {
    margin-bottom: 20px;
  }
}
</style> 
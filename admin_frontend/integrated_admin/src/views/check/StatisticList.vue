<template>
  <div class="statistic-container">
    <div class="page-header">
      <h1>统计分析</h1>
    </div>

    <div class="filter-container">
      <div class="filter-panel">
        <h3>筛选条件</h3>
        
        <div class="filter-row">
          <div class="filter-item date-range">
            <label>时间范围：</label>
            <el-date-picker
              v-model="queryParams.start_date"
              type="date"
              placeholder="开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <span class="date-separator">至</span>
            <el-date-picker
              v-model="queryParams.end_date"
              type="date"
              placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
          
          <div class="filter-item">
            <label>类型：</label>
            <el-select v-model="queryParams.category" placeholder="全部类型" clearable>
              <el-option label="全部类型" value="" />
              <el-option
                v-for="item in categoryOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
        </div>
        
        <div class="filter-row filter-buttons">
          <el-button type="primary" @click="handleSearch">
            统计
          </el-button>
          <el-button type="success" @click="handleExport">
            导出
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stat-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-card-content">
          <div class="stat-title">总任务数</div>
          <div class="stat-value primary">{{ statistics.totalTasks }}</div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-card-content">
          <div class="stat-title">总打卡数</div>
          <div class="stat-value success">{{ statistics.totalRecords }}</div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-card-content">
          <div class="stat-title">平均打卡率</div>
          <div class="stat-value warning">{{ statistics.averageRate }}%</div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-card-content">
          <div class="stat-title">活跃用户数</div>
          <div class="stat-value purple">{{ statistics.activeUsers }}</div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>打卡趋势（近30天）</span>
              </div>
            </template>
            <div ref="trendChartRef" class="chart-content"></div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>打卡类型分布</span>
              </div>
            </template>
            <div ref="pieChartRef" class="chart-content"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <el-card class="data-table-card" shadow="hover">
      <template #header>
        <div class="table-header">
          <span>打卡记录明细</span>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="recordList"
        border
        style="width: 100%"
        row-key="id"
        stripe
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="user_name" label="用户名" width="100" />
        <el-table-column prop="task_name" label="任务名称" min-width="120" />
        <el-table-column prop="category_name" label="打卡类型" width="120" />
        <el-table-column prop="check_date" label="打卡日期" width="120" />
        <el-table-column prop="check_time" label="打卡时间" width="120" />
        <el-table-column prop="remarks" label="备注" min-width="180">
          <template #default="scope">
            <el-tooltip
              v-if="scope.row.remarks && scope.row.remarks.length > 20"
              :content="scope.row.remarks"
              placement="top"
            >
              <span>{{ scope.row.remarks.slice(0, 20) }}...</span>
            </el-tooltip>
            <span v-else>{{ scope.row.remarks || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <div class="pagination-info">
          共{{ total }}条记录，每页显示{{ queryParams.limit }}条
        </div>
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { checkApi } from '../../api'
import { request } from '../../utils/request'  // 导入request模块
import * as echarts from 'echarts'

// 统计数据
const statistics = reactive({
  totalTasks: 0,
  totalRecords: 0,
  averageRate: 0,
  activeUsers: 0
})

// 图表引用
const trendChartRef = ref(null)
const pieChartRef = ref(null)
let trendChart = null
let pieChart = null

// 数据和状态
const recordList = ref([])
const categoryOptions = ref([])
const loading = ref(false)
const total = ref(0)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  category: '',
  start_date: '',
  end_date: ''
})

// 模拟统计数据
const mockStatistics = () => {
  statistics.totalTasks = 48
  statistics.totalRecords = 256
  statistics.averageRate = 85.3
  statistics.activeUsers = 32
}

// 模拟趋势数据
const mockTrendData = () => {
  return {
    dates: Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - 29 + i)
      return `${date.getMonth() + 1}/${date.getDate()}`
    }),
    values: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20) + 5)
  }
}

// 模拟类型分布数据
const mockCategoryData = () => {
  return [
    { name: '学习打卡', value: 60 },
    { name: '运动打卡', value: 30 },
    { name: '阅读打卡', value: 10 }
  ]
}

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  // 销毁旧图表
  if (trendChart) {
    trendChart.dispose()
  }
  
  // 创建新图表
  trendChart = echarts.init(trendChartRef.value)
  
  // 模拟数据
  const { dates, values } = mockTrendData()
  
  // 设置图表选项
  const option = {
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
      data: dates,
      axisLabel: {
        interval: 3
      }
    },
    yAxis: {
      type: 'value',
      name: '打卡数',
      nameTextStyle: {
        color: '#808080'
      }
    },
    series: [
      {
        name: '打卡数',
        type: 'bar',
        data: values,
        itemStyle: {
          color: '#3380E5'
        }
      }
    ]
  }
  
  // 应用选项
  trendChart.setOption(option)
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    trendChart && trendChart.resize()
  })
  
  console.log('趋势图初始化完成')
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChartRef.value) return
  
  // 销毁旧图表
  if (pieChart) {
    pieChart.dispose()
  }
  
  // 创建新图表
  pieChart = echarts.init(pieChartRef.value)
  
  // 模拟数据
  const data = mockCategoryData()
  
  // 设置图表选项
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      x: 'left',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '类型分布',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
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
        data: data.map(item => ({
          name: item.name,
          value: item.value
        })),
        color: ['#3380E5', '#E58033', '#4DB24D']
      }
    ]
  }
  
  // 应用选项
  pieChart.setOption(option)
  
  // 响应窗口大小变化
  window.addEventListener('resize', () => {
    pieChart && pieChart.resize()
  })
  
  console.log('饼图初始化完成')
}

// 生命周期钩子
onMounted(() => {
  fetchData()
  fetchCategories()
  mockStatistics()
  
  // 等待DOM渲染完成后初始化图表
  nextTick(() => {
    initTrendChart()
    initPieChart()
  })
})

// 在组件卸载前销毁图表实例，避免内存泄漏
onUnmounted(() => {
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
  
  if (pieChart) {
    pieChart.dispose()
    pieChart = null
  }
  
  window.removeEventListener('resize', () => {
    trendChart && trendChart.resize()
    pieChart && pieChart.resize()
  })
})

// 获取打卡记录列表数据
const fetchData = async () => {
  try {
    loading.value = true
    
    const params = {
      page: queryParams.page,
      page_size: queryParams.limit,
      task_id: queryParams.category || undefined,
      start_date: queryParams.start_date || undefined,
      end_date: queryParams.end_date || undefined
    }
    
    console.log('获取打卡记录列表，参数:', params) // 添加日志
    const response = await checkApi.getRecords(params)
    
    // 使用request.getResponseData从data字段获取数据
    const responseData = request.getResponseData(response)
    
    // 尝试多种可能的响应格式
    recordList.value = responseData.results || responseData || []
    total.value = responseData.count || responseData.total || 0
    
    console.log('打卡记录列表数据:', recordList.value) // 添加日志
  } catch (error) {
    console.error('获取打卡记录列表失败:', error) // 添加错误日志
    ElMessage.error('获取打卡记录列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 获取类别选项
const fetchCategories = async () => {
  try {
    const response = await checkApi.getCategories()
    // 使用request.getResponseData从data字段获取数据
    const responseData = request.getResponseData(response)
    
    categoryOptions.value = responseData.results || responseData || []
    console.log('类型选项:', categoryOptions.value) // 添加日志
  } catch (error) {
    console.error('获取类型列表失败:', error) // 添加错误日志
    ElMessage.error('获取类型列表失败，请稍后重试')
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchData()
  
  // 重新获取统计数据
  mockStatistics() // 这里应该调用真实的统计API
  
  // 重新渲染图表
  nextTick(() => {
    initTrendChart()
    initPieChart()
  })
}

// 导出数据
const handleExport = () => {
  // 构建导出参数，与查询参数相同
  const params = { ...queryParams }
  delete params.page
  delete params.limit
  
  // 这里可以调用导出API或直接构造导出URL
  console.log('导出统计数据，参数:', params) // 添加日志
  ElMessage.success('导出功能待实现')
}

// 切换每页数量
const handleSizeChange = (val) => {
  queryParams.limit = val
  fetchData()
}

// 切换页码
const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchData()
}
</script>

<style scoped>
.statistic-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.page-header h1 {
  font-size: 24px;
  margin: 0;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-panel {
  background-color: #fafafa;
  border-radius: 4px;
  padding: 15px 20px;
}

.filter-panel h3 {
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 15px;
  color: #4d4d4d;
}

.filter-row {
  display: flex;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  flex: 1;
}

.filter-item label {
  margin-right: 8px;
  color: #4d4d4d;
}

.date-range {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.date-separator {
  margin: 0 10px;
  color: #4d4d4d;
}

.filter-buttons {
  margin-top: 10px;
}

/* 统计卡片样式 */
.stat-cards {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-card {
  width: calc(25% - 15px);
  margin-bottom: 15px;
  border-radius: 6px;
}

.stat-card-content {
  padding: 5px 10px;
}

.stat-title {
  font-size: 16px;
  color: #808080;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
}

.stat-value.primary {
  color: #3380E5;
}

.stat-value.success {
  color: #4DB24D;
}

.stat-value.warning {
  color: #E59933;
}

.stat-value.purple {
  color: #804DCC;
}

/* 图表区域 */
.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  font-size: 16px;
  font-weight: bold;
  color: #4d4d4d;
}

.chart-content {
  height: 350px;
}

/* 数据表格 */
.data-table-card {
  margin-bottom: 20px;
  overflow-x: hidden;
}

.table-header {
  font-size: 16px;
  font-weight: bold;
  color: #4d4d4d;
}

/* 表格容器样式 */
.el-table {
  overflow-x: auto;
  margin-bottom: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info {
  color: #808080;
  font-size: 14px;
}

/* 响应式布局 - 大屏幕 */
@media screen and (max-width: 1200px) {
  .stat-card {
    width: calc(50% - 10px);
  }
  
  .el-col {
    width: 100% !important;
  }
  
  .chart-card {
    margin-bottom: 20px;
  }
}

/* 响应式布局 - 中等屏幕 */
@media screen and (max-width: 992px) {
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-item {
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .date-range {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-separator {
    display: none;
  }
  
  .el-select,
  .el-date-picker {
    width: 100% !important;
  }
}

/* 响应式布局 - 平板 */
@media screen and (max-width: 768px) {
  .stat-card {
    width: 100%;
  }
  
  .pagination-container {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  .pagination-info {
    margin-bottom: 10px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .filter-panel {
    padding: 10px 15px;
  }
  
  .chart-content {
    height: 250px;
  }
  
  /* 表格响应式 */
  .el-table .el-table__header th {
    padding: 8px 0;
  }
  
  .el-table .el-table__body td {
    padding: 8px;
  }
  
  .el-table__body-wrapper {
    overflow-x: auto !important;
  }
  
  .el-table__header-wrapper {
    overflow-x: auto !important;
  }
}

/* 响应式布局 - 手机 */
@media screen and (max-width: 576px) {
  .filter-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-buttons .el-button {
    width: 100%;
  }
  
  .table-header {
    font-size: 14px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .chart-content {
    height: 200px;
  }
  
  .stat-cards {
    flex-direction: column;
  }
  
  .stat-card {
    width: 100% !important;
  }
}
</style> 
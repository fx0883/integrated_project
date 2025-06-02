<template>
  <div class="record-list-container">
    <div class="page-header">
      <h1>打卡记录查询</h1>
    </div>

    <div class="filter-container">
      <div class="filter-panel">
        <h3>筛选条件</h3>
        
        <div class="filter-row">
          <div class="filter-item">
            <label>用户：</label>
            <el-select v-model="queryParams.user" placeholder="全部用户" clearable>
              <el-option label="全部用户" value="" />
              <el-option
                v-for="item in userOptions"
                :key="item.id"
                :label="item.username"
                :value="item.id"
              />
            </el-select>
          </div>
          
          <div class="filter-item">
            <label>任务：</label>
            <el-select v-model="queryParams.task" placeholder="全部任务" clearable>
              <el-option label="全部任务" value="" />
              <el-option
                v-for="item in taskOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
        </div>
        
        <div class="filter-row">
          <div class="filter-item date-range">
            <label>日期范围：</label>
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
        </div>
        
        <div class="filter-row filter-buttons">
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button type="success" @click="handleExport">
            导出
          </el-button>
        </div>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="recordList"
      border
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="user_name" label="用户" width="100" />
      <el-table-column prop="task_name" label="任务名称" min-width="150" />
      <el-table-column prop="category_name" label="所属类型" width="120" />
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
      <el-table-column prop="created_at" label="创建时间" width="180" />
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCheckRecords } from '@/api/check'
import { getTasks } from '@/api/check'
import userApi from '@/api/user'
import { request } from '../../utils/request'

// 状态和数据
const recordList = ref([])
const userOptions = ref([])
const taskOptions = ref([])
const loading = ref(false)
const total = ref(0)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  user: '',
  task: '',
  start_date: '',
  end_date: ''
})

// 生命周期钩子
onMounted(() => {
  fetchData()
  fetchUsers()
  fetchTasks()
})

// 获取打卡记录列表数据
const fetchData = async () => {
  try {
    loading.value = true
    
    const params = {
      page: queryParams.page,
      page_size: queryParams.limit,
      task_id: queryParams.task || undefined,
      user_id: queryParams.user || undefined,
      start_date: queryParams.start_date || undefined,
      end_date: queryParams.end_date || undefined
    }
    
    const response = await getCheckRecords(params)
    // 使用request.getResponseData从data字段获取数据
    const responseData = request.getResponseData(response)
    
    // 尝试多种可能的响应格式
    recordList.value = responseData.results || responseData || []
    total.value = responseData.count || responseData.total || 0
    
    loading.value = false
    console.log('获取打卡记录成功', recordList.value)
  } catch (error) {
    console.error('获取打卡记录失败:', error)
    loading.value = false
    ElMessage.error('获取打卡记录失败')
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await userApi.getUsers({limit: 100})
    // 使用request.getResponseData从data字段获取数据
    const responseData = request.getResponseData(response)
    
    userOptions.value = responseData.results || responseData || []
    console.log('用户选项:', userOptions.value) // 添加日志
  } catch (error) {
    console.error('获取用户列表失败:', error) // 添加错误日志
    ElMessage.error('获取用户列表失败，请稍后重试')
  }
}

// 获取任务列表
const fetchTasks = async () => {
  try {
    const response = await getTasks({limit: 100})
    // 使用request.getResponseData从data字段获取数据
    const responseData = request.getResponseData(response)
    
    taskOptions.value = responseData.results || responseData || []
    console.log('任务选项:', taskOptions.value) // 添加日志
  } catch (error) {
    console.error('获取任务列表失败:', error) // 添加错误日志
    ElMessage.error('获取任务列表失败，请稍后重试')
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchData()
}

// 导出数据
const handleExport = () => {
  // 构建导出参数，与查询参数相同
  const params = { ...queryParams }
  delete params.page
  delete params.limit
  
  // 这里可以调用导出API或直接构造导出URL
  console.log('导出打卡记录数据，参数:', params) // 添加日志
  ElMessage.success('导出功能待实现')
  
  // 如果后端提供了导出API，可以这样调用
  // exportCheckRecords(params).then(response => {
  //   // 处理导出文件，通常是下载文件
  // }).catch(error => {
  //   console.error('导出失败:', error)
  //   ElMessage.error('导出失败，请稍后重试')
  // })
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
.record-list-container {
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
}

.filter-item label {
  margin-right: 8px;
  color: #4d4d4d;
  white-space: nowrap;
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* 添加响应式布局 */
@media screen and (max-width: 1200px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media screen and (max-width: 992px) {
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-item {
    width: 100%;
    margin-right: 0;
  }
  
  .filter-item > .el-select,
  .filter-item > .el-date-picker {
    width: 100%;
  }
  
  .date-range {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-separator {
    display: none;
  }
}

@media screen and (max-width: 768px) {
  .pagination-container {
    justify-content: center;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .filter-panel {
    padding: 10px 15px;
  }
  
  .el-table .el-table__header th {
    padding: 8px 0;
  }
  .el-table .el-table__body td {
    padding: 8px;
  }
  
  /* 确保表格可横向滚动 */
  .el-table__body-wrapper {
    overflow-x: auto !important;
  }
  
  .el-table__header-wrapper {
    overflow-x: auto !important;
  }
}

@media screen and (max-width: 576px) {
  .filter-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-buttons .el-button {
    width: 100%;
  }
  
  .page-header h1 {
    font-size: 18px;
  }
}
</style> 
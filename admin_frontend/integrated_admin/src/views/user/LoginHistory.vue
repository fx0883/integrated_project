<template>
  <div class="login-history-container">
    <div class="page-header">
      <h1 class="page-title">登录历史</h1>
      <div class="page-actions">
        <el-button @click="goBack" class="btn-secondary">
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>
    
    <el-card shadow="never" class="data-card" v-loading="loading">
      <template #header>
        <div class="card-title">
          <el-icon><Timer /></el-icon>
          <span>{{ userInfo.real_name || userInfo.username || '用户' }} 的登录记录</span>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <div class="filter-bar">
        <div class="date-range">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            @change="handleDateChange"
          />
        </div>
        <div class="filter-actions">
          <el-select 
            v-model="filterStatus"
            placeholder="状态"
            clearable
            class="filter-select"
          >
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-button type="primary" @click="getLoginHistory" class="filter-button">
            <el-icon><Search /></el-icon>筛选
          </el-button>
        </div>
      </div>
      
      <!-- 登录记录表格 -->
      <el-table
        :data="loginRecords"
        style="width: 100%"
        empty-text="暂无登录记录"
        class="data-table"
      >
        <el-table-column prop="login_time" label="登录时间" min-width="160" sortable />
        <el-table-column prop="ip_address" label="IP地址" min-width="140" />
        <el-table-column prop="location" label="登录地点" min-width="180" />
        <el-table-column prop="device" label="设备" min-width="160" />
        <el-table-column prop="browser" label="浏览器" min-width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
              {{ scope.row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Timer, Back, Search } from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const route = useRoute()
const userId = route.params.id

// 加载状态
const loading = ref(false)

// 用户信息
const userInfo = reactive({
  id: '',
  username: '',
  real_name: ''
})

// 分页
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 过滤条件
const dateRange = ref([])
const filterStatus = ref('')

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

// 登录记录数据
const loginRecords = ref([])

// 获取用户信息
const getUserInfo = async () => {
  try {
    loading.value = true
    console.log('获取用户信息, ID:', userId)
    
    // 模拟数据
    setTimeout(() => {
      const response = {
        id: userId,
        username: userId === '1' ? 'admin' : 'test',
        real_name: userId === '1' ? '管理员' : '测试用户'
      }
      
      // 更新用户信息
      Object.assign(userInfo, response)
      
      // 获取登录记录
      getLoginHistory()
      
      loading.value = false
      console.log('用户信息加载完成')
    }, 300)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    loading.value = false
    ElMessage.error('获取用户信息失败')
  }
}

// 获取登录历史
const getLoginHistory = () => {
  loading.value = true
  console.log('获取登录历史:', {
    userId,
    page: page.value,
    pageSize: pageSize.value,
    dateRange: dateRange.value,
    status: filterStatus.value
  })
  
  // 模拟数据
  setTimeout(() => {
    // 生成模拟的登录记录
    const records = []
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']
    const devices = ['Windows 10', 'macOS', 'iPhone', 'Android', 'iPad']
    const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉']
    
    for (let i = 0; i < 20; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // 如果有日期范围筛选，则检查是否在范围内
      if (dateRange.value && dateRange.value.length === 2) {
        const start = new Date(dateRange.value[0])
        const end = new Date(dateRange.value[1])
        end.setHours(23, 59, 59, 999) // 设置为当天的结束时间
        
        if (date < start || date > end) continue
      }
      
      const status = Math.random() > 0.2 ? 'success' : 'failed'
      
      // 如果有状态筛选，则检查是否匹配
      if (filterStatus.value && status !== filterStatus.value) continue
      
      records.push({
        id: i + 1,
        login_time: date.toLocaleString(),
        ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        status
      })
    }
    
    loginRecords.value = records.slice(0, pageSize.value)
    total.value = records.length
    
    loading.value = false
    console.log('登录历史加载完成')
  }, 500)
}

// 日期变化
const handleDateChange = () => {
  page.value = 1
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  getLoginHistory()
}

// 页码变化
const handleCurrentChange = (currentPage) => {
  page.value = currentPage
  getLoginHistory()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 生命周期钩子
onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.login-history-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  background-color: white;
  border-color: #E8ECF4;
  color: #6E7687;
}

.btn-secondary:hover {
  background-color: #e0f5f4;
  border-color: #0abab5;
  color: #0abab5;
}

.data-card {
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.date-range {
  flex: 1;
  min-width: 350px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.filter-select {
  min-width: 120px;
}

.data-table {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 
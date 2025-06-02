<template>
  <div class="page-container">
    <h1 class="page-title">Pure Admin 组件示例</h1>
    
    <!-- 表单组件示例 -->
    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <h2>表单组件示例</h2>
        </div>
      </template>
      
      <pure-form
        ref="formRef"
        v-model="formData"
        :items="formItems"
        :rules="formRules"
        label-width="100px"
        :grid="true"
      >
        <!-- 自定义插槽 -->
        <template #custom-slot="scope">
          <div class="custom-slot">
            <el-input v-model="scope.form.customField" placeholder="自定义表单项">
              <template #append>
                <el-button>获取</el-button>
              </template>
            </el-input>
          </div>
        </template>
      </pure-form>
      
      <div class="demo-card">
        <h3>表单数据预览</h3>
        <pre>{{ JSON.stringify(formData, null, 2) }}</pre>
      </div>
    </el-card>
    
    <!-- 表格组件示例 -->
    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <h2>表格组件示例</h2>
        </div>
      </template>
      
      <div class="mb-10">
        <el-button type="primary" @click="handleAdd">添加数据</el-button>
        <el-button type="danger" :disabled="!selectedRows.length" @click="handleBatchDelete">批量删除</el-button>
      </div>
      
      <pure-table
        ref="tableRef"
        :data="tableData"
        :columns="tableColumns"
        :loading="tableLoading"
        :selection="true"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @selection-change="handleSelectionChange"
        @update:currentPage="currentPage = $event"
        @update:pageSize="pageSize = $event"
        @refresh="loadTableData"
      >
        <!-- 自定义插槽 - 状态列 -->
        <template #status="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
        
        <!-- 自定义操作列 -->
        <template #operation="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" link @click="handleView(row)">查看</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </pure-table>
      
      <!-- 编辑对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '添加数据' : '编辑数据'"
        width="500px"
      >
        <pure-form
          ref="editFormRef"
          v-model="editForm"
          :items="editFormItems"
          label-width="80px"
        />
        
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </template>
      </el-dialog>
    </el-card>
    
    <!-- 图表组件示例 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>图表组件示例</h2>
          <div class="chart-controls">
            <el-radio-group v-model="chartType" size="small">
              <el-radio-button label="monthly">月度数据</el-radio-button>
              <el-radio-button label="weekly">周数据</el-radio-button>
              <el-radio-button label="daily">日数据</el-radio-button>
            </el-radio-group>
            
            <el-select v-model="chartTheme" placeholder="选择主题" size="small" style="margin-left: 10px;">
              <el-option label="默认主题" value=""></el-option>
              <el-option label="暗色主题" value="dark"></el-option>
            </el-select>
            
            <el-switch
              v-model="chartSmooth"
              active-text="平滑曲线"
              inactive-text="折线"
              size="small"
              style="margin-left: 10px;"
            />
            
            <el-switch
              v-model="chartArea"
              active-text="区域样式"
              inactive-text="无区域"
              size="small"
              style="margin-left: 10px;"
            />
          </div>
        </div>
      </template>
      
      <line-chart
        ref="chartRef"
        :data="chartData"
        :x-axis-data="chartXAxis"
        :title="chartTitle"
        :subtitle="chartSubtitle"
        :smooth="chartSmooth"
        :area-style="chartArea"
        :theme="chartTheme"
        :data-zoom="true"
        height="400px"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PureTable from '@/components/pure/Table'
import PureForm from '@/components/pure/Form'
import LineChart from '@/components/pure/Charts/LineChart.vue'

// 表单示例数据
const formRef = ref(null)
const formData = reactive({
  name: '',
  age: '',
  email: '',
  gender: 'male',
  hobbies: [],
  birthday: '',
  education: '',
  income: 5000,
  description: '',
  agree: false,
  customField: ''
})

// 表单项配置
const formItems = [
  {
    type: 'group',
    label: '基本信息',
    description: '请填写您的基本个人信息'
  },
  {
    label: '姓名',
    prop: 'name',
    required: true,
    span: 12
  },
  {
    label: '年龄',
    prop: 'age',
    type: 'number',
    span: 12,
    min: 0,
    max: 120
  },
  {
    label: '性别',
    prop: 'gender',
    type: 'radio',
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
      { label: '其他', value: 'other' }
    ],
    span: 12
  },
  {
    label: '爱好',
    prop: 'hobbies',
    type: 'checkbox',
    options: [
      { label: '阅读', value: 'reading' },
      { label: '旅游', value: 'travel' },
      { label: '音乐', value: 'music' },
      { label: '运动', value: 'sports' }
    ],
    span: 12
  },
  {
    label: '出生日期',
    prop: 'birthday',
    type: 'date',
    valueFormat: 'YYYY-MM-DD',
    span: 12
  },
  {
    type: 'divider',
    label: '更多信息'
  },
  {
    label: '学历',
    prop: 'education',
    type: 'select',
    options: [
      { label: '高中', value: 'highschool' },
      { label: '大专', value: 'college' },
      { label: '本科', value: 'bachelor' },
      { label: '硕士', value: 'master' },
      { label: '博士', value: 'phd' }
    ],
    span: 12
  },
  {
    label: '月收入',
    prop: 'income',
    type: 'slider',
    min: 0,
    max: 50000,
    step: 1000,
    showInput: true,
    span: 12
  },
  {
    label: '个人描述',
    prop: 'description',
    type: 'textarea',
    rows: 4,
    span: 24
  },
  {
    label: '自定义',
    prop: 'customField',
    slot: 'custom-slot',
    span: 24
  },
  {
    label: '',
    prop: 'agree',
    type: 'checkbox',
    options: [
      { label: '我已阅读并同意相关条款', value: true }
    ],
    span: 24
  }
]

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  agree: [
    { required: true, type: 'boolean', message: '请同意条款', trigger: 'change' }
  ]
}

// 表格示例数据
const tableRef = ref(null)
const tableLoading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const total = ref(100)
const currentPage = ref(1)
const pageSize = ref(10)

// 表格列配置
const tableColumns = [
  {
    label: '姓名',
    prop: 'name',
    minWidth: '120',
    showTooltip: true
  },
  {
    label: '年龄',
    prop: 'age',
    width: '80',
    align: 'center',
    sortable: true
  },
  {
    label: '邮箱',
    prop: 'email',
    minWidth: '180',
    showTooltip: true
  },
  {
    label: '状态',
    prop: 'status',
    width: '100',
    align: 'center',
    slot: 'status'
  },
  {
    label: '创建时间',
    prop: 'createTime',
    minWidth: '180'
  }
]

// 加载表格数据
const loadTableData = () => {
  tableLoading.value = true
  
  setTimeout(() => {
    const list = []
    const startIndex = (currentPage.value - 1) * pageSize.value
    
    for (let i = 0; i < pageSize.value; i++) {
      const index = startIndex + i
      if (index >= total.value) break
      
      list.push({
        id: `user_${index}`,
        name: `用户${index + 1}`,
        age: Math.floor(Math.random() * 50) + 18,
        email: `user${index + 1}@example.com`,
        status: Math.random() > 0.3 ? 'active' : 'disabled',
        createTime: new Date().toLocaleString()
      })
    }
    
    tableData.value = list
    tableLoading.value = false
  }, 500)
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add') // add or edit
const editFormRef = ref(null)
const editForm = reactive({
  id: '',
  name: '',
  age: '',
  email: '',
  status: 'active'
})

// 编辑表单项
const editFormItems = [
  {
    label: '姓名',
    prop: 'name',
    required: true
  },
  {
    label: '年龄',
    prop: 'age',
    type: 'number',
    min: 1,
    max: 120
  },
  {
    label: '邮箱',
    prop: 'email',
    required: true
  },
  {
    label: '状态',
    prop: 'status',
    type: 'radio',
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'disabled' }
    ]
  }
]

// 添加数据
const handleAdd = () => {
  dialogType.value = 'add'
  Object.keys(editForm).forEach(key => {
    editForm[key] = key === 'status' ? 'active' : ''
  })
  dialogVisible.value = true
}

// 编辑数据
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(editForm, row)
  dialogVisible.value = true
}

// 查看数据
const handleView = (row) => {
  ElMessage({
    message: `查看用户: ${row.name}`,
    type: 'info'
  })
}

// 删除数据
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除用户 ${row.name}?`, '提示', {
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    tableData.value = tableData.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 批量删除
const handleBatchDelete = () => {
  if (!selectedRows.value.length) return
  
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条数据?`, '提示', {
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    const ids = selectedRows.value.map(row => row.id)
    tableData.value = tableData.value.filter(item => !ids.includes(item.id))
    ElMessage.success('批量删除成功')
  }).catch(() => {})
}

// 保存数据
const handleSave = () => {
  editFormRef.value.validate().then(() => {
    // 模拟保存操作
    if (dialogType.value === 'add') {
      const newRow = {
        ...editForm,
        id: `user_${Date.now()}`,
        createTime: new Date().toLocaleString()
      }
      tableData.value.unshift(newRow)
      ElMessage.success('添加成功')
    } else {
      const index = tableData.value.findIndex(item => item.id === editForm.id)
      if (index !== -1) {
        tableData.value[index] = { ...tableData.value[index], ...editForm }
        ElMessage.success('更新成功')
      }
    }
    dialogVisible.value = false
  }).catch(() => {})
}

// 图表相关
const chartRef = ref(null)
const chartType = ref('monthly')
const chartTheme = ref('')
const chartSmooth = ref(true)
const chartArea = ref(true)

// 图表标题
const chartTitle = computed(() => {
  const typeMap = {
    monthly: '月度销售趋势',
    weekly: '周销售趋势',
    daily: '日销售趋势'
  }
  return typeMap[chartType.value] || '销售趋势'
})

// 图表副标题
const chartSubtitle = computed(() => {
  const date = new Date()
  return `更新时间: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
})

// 生成图表数据
const generateChartData = (type) => {
  let xAxisData = []
  
  // 根据类型生成X轴数据
  if (type === 'monthly') {
    xAxisData = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  } else if (type === 'weekly') {
    xAxisData = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周']
  } else if (type === 'daily') {
    xAxisData = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  }
  
  // 生成随机数据
  const generateRandomData = (base, volatility) => {
    return xAxisData.map(() => Math.floor(Math.random() * volatility) + base)
  }
  
  return {
    xAxis: xAxisData,
    data: [
      {
        name: '销售额',
        data: generateRandomData(5000, 3000)
      },
      {
        name: '访问量',
        data: generateRandomData(10000, 2000)
      },
      {
        name: '订单数',
        data: generateRandomData(500, 300)
      }
    ]
  }
}

// 图表X轴数据
const chartXAxis = ref([])

// 图表数据
const chartData = ref([])

// 更新图表数据
const updateChartData = () => {
  const { xAxis, data } = generateChartData(chartType.value)
  chartXAxis.value = xAxis
  chartData.value = data
}

// 监听图表类型变化
watch(chartType, updateChartData)

// 页面加载
onMounted(() => {
  loadTableData()
  updateChartData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mb-10 {
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.demo-card {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.demo-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.demo-card pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.custom-slot {
  width: 100%;
}

.chart-controls {
  display: flex;
  align-items: center;
}
</style> 
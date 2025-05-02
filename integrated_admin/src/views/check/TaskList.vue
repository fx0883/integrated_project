<template>
  <div class="task-list-container">
    <div class="page-header">
      <h1>打卡任务管理</h1>
      <div class="actions">
        <el-button type="primary" @click="handleCreate">
          + 新建任务
        </el-button>
      </div>
    </div>

    <div class="filter-container">
      <el-select v-model="queryParams.category" placeholder="打卡类型: 全部" clearable>
        <el-option label="全部" value="" />
        <el-option
          v-for="item in categoriesOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>

      <el-select v-model="queryParams.status" placeholder="任务状态: 进行中" clearable>
        <el-option label="全部" value="" />
        <el-option label="进行中" value="active" />
        <el-option label="已完成" value="completed" />
        <el-option label="已暂停" value="paused" />
        <el-option label="已归档" value="archived" />
      </el-select>

      <el-input
        v-model="queryParams.search"
        placeholder="搜索任务名称..."
        class="search-input"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon class="el-input__icon"><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table
      v-loading="loading"
      :data="taskList"
      border
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="任务名称" min-width="150" />
      <el-table-column prop="category_name" label="所属类型" min-width="120" />
      <el-table-column prop="start_date" label="开始日期" width="120" />
      <el-table-column prop="end_date" label="结束日期" width="120">
        <template #default="scope">
          {{ scope.row.end_date || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag
            :type="getStatusType(scope.row.status)"
            size="small"
            effect="light"
          >
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reminder" label="提醒设置" width="160">
        <template #default="scope">
          <div>
            <el-tag
              :type="scope.row.reminder ? 'info' : 'info'"
              size="small"
              effect="light"
              class="mr-1"
            >
              {{ scope.row.reminder ? '是' : '否' }}
            </el-tag>
            {{ scope.row.reminder ? scope.row.reminder_time : '-' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="scope">
          <el-button
            type="primary"
            size="small"
            @click="handleView(scope.row)"
          >
            查看
          </el-button>
          <el-button
            type="success"
            size="small"
            @click="handleEdit(scope.row)"
          >
            编辑
          </el-button>
        </template>
      </el-table-column>
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

    <!-- 任务表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建任务' : dialogType === 'edit' ? '编辑任务' : '查看任务'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input
            v-model="taskForm.name"
            placeholder="请输入任务名称"
            :disabled="dialogType === 'view'"
          />
        </el-form-item>

        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
            :disabled="dialogType === 'view'"
          />
        </el-form-item>

        <el-form-item label="所属类型" prop="category">
          <el-select
            v-model="taskForm.category"
            placeholder="请选择任务类型"
            style="width: 100%"
            :disabled="dialogType === 'view'"
          >
            <el-option
              v-for="item in categoriesOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间设置">
          <el-col :span="11">
            <el-form-item prop="start_date">
              <el-date-picker
                v-model="taskForm.start_date"
                type="date"
                placeholder="开始日期"
                style="width: 100%"
                :disabled="dialogType === 'view'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="2" class="text-center">
            <span class="text-gray-500">至</span>
          </el-col>
          <el-col :span="11">
            <el-form-item prop="end_date">
              <el-date-picker
                v-model="taskForm.end_date"
                type="date"
                placeholder="结束日期（可选）"
                style="width: 100%"
                :disabled="dialogType === 'view'"
              />
            </el-form-item>
          </el-col>
        </el-form-item>

        <el-form-item label="任务状态" prop="status">
          <el-select
            v-model="taskForm.status"
            placeholder="请选择任务状态"
            style="width: 100%"
            :disabled="dialogType === 'view'"
          >
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>

        <el-form-item label="提醒设置" prop="reminder">
          <div class="flex items-center">
            <el-switch
              v-model="taskForm.reminder"
              :disabled="dialogType === 'view'"
            />
            <span class="ml-2">{{ taskForm.reminder ? '启用提醒' : '不提醒' }}</span>
          </div>
        </el-form-item>

        <el-form-item v-if="taskForm.reminder" label="提醒时间" prop="reminder_time">
          <el-time-picker
            v-model="taskForm.reminder_time"
            format="HH:mm"
            placeholder="请选择提醒时间"
            style="width: 100%"
            :disabled="dialogType === 'view'"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            v-if="dialogType !== 'view'"
            type="primary"
            @click="submitForm"
            :loading="submitLoading"
          >
            {{ dialogType === 'create' ? '创建' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { 
  getTasks, createTask, getTask, updateTask, deleteTask
} from '@/api/check'
import { getTaskCategories } from '@/api/check'

// 状态和数据
const taskList = ref([])
const categoriesOptions = ref([])
const loading = ref(false)
const submitLoading = ref(false)
const total = ref(0)
const dialogVisible = ref(false)
const dialogType = ref('create') // create, edit, view
const taskFormRef = ref(null)

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  search: '',
  category: '',
  status: 'active'
})

// 表单数据
const taskForm = reactive({
  id: undefined,
  name: '',
  description: '',
  category: undefined,
  start_date: '',
  end_date: '',
  status: 'active',
  reminder: false,
  reminder_time: null
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  start_date: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择任务状态', trigger: 'change' }
  ],
  reminder_time: [
    { 
      required: true, 
      message: '启用提醒时需要设置提醒时间', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (taskForm.reminder && !value) {
          callback(new Error('启用提醒时需要设置提醒时间'))
        } else {
          callback()
        }
      }
    }
  ]
}

// 生命周期钩子
onMounted(() => {
  fetchData()
  fetchCategories()
})

// 监听查询参数变化，自动刷新数据
watch(
  () => [queryParams.category, queryParams.status],
  () => {
    queryParams.page = 1
    fetchData()
  }
)

// 获取任务列表数据
const fetchData = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: queryParams.page,
      page_size: queryParams.limit
    }
    
    if (queryParams.search) {
      params.search = queryParams.search
    }
    
    if (queryParams.category) {
      params.category = queryParams.category
    }
    
    if (queryParams.status) {
      params.status = queryParams.status
    }
    
    console.log('获取任务列表，参数:', params) // 添加日志
    const response = await getTasks(params)
    
    // 假设后端返回的数据结构包含 results 和 count
    taskList.value = response.results || response.data || []
    total.value = response.count || response.total || 0
    
    console.log('任务列表数据:', taskList.value) // 添加日志
  } catch (error) {
    console.error('获取任务列表失败:', error) // 添加错误日志
    ElMessage.error('获取任务列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 获取类别选项
const fetchCategories = async () => {
  try {
    const response = await getTaskCategories()
    categoriesOptions.value = response.results || response.data || []
    console.log('类型选项:', categoriesOptions.value) // 添加日志
  } catch (error) {
    console.error('获取类型列表失败:', error) // 添加错误日志
    ElMessage.error('获取类型列表失败，请稍后重试')
  }
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  fetchData()
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

// 获取状态标签类型
const getStatusType = (status) => {
  const map = {
    active: 'success',
    completed: 'info',
    paused: 'warning',
    archived: 'danger'
  }
  return map[status] || 'info'
}

// 获取状态显示文本
const getStatusText = (status) => {
  const map = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    archived: '已归档'
  }
  return map[status] || status
}

// 重置表单
const resetForm = () => {
  taskFormRef.value?.resetFields()
  Object.assign(taskForm, {
    id: undefined,
    name: '',
    description: '',
    category: undefined,
    start_date: '',
    end_date: '',
    status: 'active',
    reminder: false,
    reminder_time: null
  })
}

// 打开创建对话框
const handleCreate = () => {
  resetForm()
  dialogType.value = 'create'
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = async (row) => {
  resetForm()
  dialogType.value = 'edit'
  dialogVisible.value = true
  taskForm.id = row.id
  
  try {
    // 获取详细数据
    loading.value = true
    const response = await getTask(row.id)
    const data = response.data || response
    
    // 填充表单
    Object.keys(taskForm).forEach(key => {
      if (data[key] !== undefined) {
        taskForm[key] = data[key]
      }
    })
    
    console.log('编辑任务数据:', taskForm) // 添加日志
  } catch (error) {
    console.error('获取任务详情失败:', error) // 添加错误日志
    ElMessage.error('获取任务详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 打开查看对话框
const handleView = async (row) => {
  resetForm()
  dialogType.value = 'view'
  dialogVisible.value = true
  taskForm.id = row.id
  
  try {
    // 获取详细数据
    loading.value = true
    const response = await getTask(row.id)
    const data = response.data || response
    
    // 填充表单
    Object.keys(taskForm).forEach(key => {
      if (data[key] !== undefined) {
        taskForm[key] = data[key]
      }
    })
  } catch (error) {
    console.error('获取任务详情失败:', error) // 添加错误日志
    ElMessage.error('获取任务详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  if (!taskFormRef.value) return
  
  try {
    await taskFormRef.value.validate()
    
    submitLoading.value = true
    console.log('提交任务表单数据:', taskForm) // 添加日志
    
    if (dialogType.value === 'create') {
      await createTask(taskForm)
      ElMessage.success('创建任务成功')
    } else if (dialogType.value === 'edit') {
      await updateTask(taskForm.id, taskForm)
      ElMessage.success('更新任务成功')
    }
    
    dialogVisible.value = false
    fetchData() // 刷新列表
  } catch (error) {
    console.error('提交表单失败:', error) // 添加错误日志
    ElMessage.error('提交失败，请检查表单内容')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.task-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  margin: 0;
}

.filter-container {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.search-input {
  width: 240px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-center {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
}

.mr-1 {
  margin-right: 4px;
}
</style> 
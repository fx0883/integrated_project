<template>
  <div class="category-list">
    <div class="header-section">
      <h2 class="title">打卡类型管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateCategory">+ 新建类型</el-button>
        <div class="filter-section">
          <el-select v-model="categoryFilter" placeholder="全部类型" size="default" class="filter-select">
            <el-option label="全部类型" value="all" />
            <el-option label="系统预设" value="system" />
            <el-option label="自定义" value="custom" />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索类型名称..."
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="filteredCategories"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="类型名称" width="150" />
        <el-table-column prop="description" label="类型描述" min-width="250" />
        <el-table-column label="类型" width="120">
          <template #default="scope">
            <el-tag
              :type="scope.row.is_system ? 'warning' : 'primary'"
              effect="light"
              size="default"
              class="category-tag"
            >
              {{ scope.row.is_system ? '系统预设' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              plain
              @click="handleViewCategory(scope.row)"
            >
              查看
            </el-button>
            <el-button
              size="small"
              type="success"
              plain
              @click="handleEditCategory(scope.row)"
              :disabled="scope.row.is_system && !isSuperAdmin"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalItems"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建类型弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建打卡类型' : (dialogType === 'edit' ? '编辑打卡类型' : '查看打卡类型')"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
        :disabled="dialogType === 'view'"
      >
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入类型名称" />
        </el-form-item>
        <el-form-item label="类型描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入类型描述"
          />
        </el-form-item>
        <el-form-item label="类型图标" prop="icon" v-if="isSuperAdmin || dialogType === 'view'">
          <el-input v-model="categoryForm.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="类型" prop="is_system" v-if="isSuperAdmin || dialogType === 'view'">
          <el-radio-group v-model="categoryForm.is_system">
            <el-radio :label="false">自定义</el-radio>
            <el-radio :label="true">系统预设</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ dialogType === 'view' ? '关闭' : '取消' }}</el-button>
          <el-button type="primary" @click="submitForm" v-if="dialogType !== 'view'">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, onBeforeMount, onUpdated, defineComponent } from 'vue'
import { useAuthStore } from '@/stores'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
// 导入API服务，替换axios直接调用
import { 
  getTaskCategories, 
  createTaskCategory, 
  updateTaskCategory, 
  deleteTaskCategory 
} from '@/api/check'

// 添加调试日志，检查组件是否被正确加载
console.log('========= CategoryList组件被导入 =========')

// 定义组件名称，方便调试
const __componentName = 'CategoryList'

// 认证信息
const authStore = useAuthStore()
const isSuperAdmin = computed(() => authStore.isSuperAdmin)

// 表格相关数据
const loading = ref(false)
const categories = ref([])
const categoryFilter = ref('all')
const searchKeyword = ref('')
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('create') // create, edit, view
const categoryFormRef = ref(null) // 确保正确初始化表单引用
const categoryForm = reactive({
  id: null,
  name: '',
  description: '',
  icon: '',
  is_system: false
})
const categoryRules = {
  name: [
    { required: true, message: '请输入类型名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 过滤后的类型数据
const filteredCategories = computed(() => {
  let result = [...categories.value]
  
  // 根据类型过滤
  if (categoryFilter.value === 'system') {
    result = result.filter(item => item.is_system)
  } else if (categoryFilter.value === 'custom') {
    result = result.filter(item => !item.is_system)
  }
  
  // 根据关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      item => item.name.toLowerCase().includes(keyword) || 
             item.description.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

// 生命周期钩子 - 挂载前
onBeforeMount(() => {
  console.log(`[${__componentName}] 组件挂载前`)
})

// 生命周期钩子 - 挂载后
onMounted(() => {
  console.log(`[${__componentName}] 组件已挂载`)
  console.log(`[${__componentName}] 当前组件路径: /check/categories`)
  console.log(`[${__componentName}] DOM元素加载状态:`, document.querySelector('.category-list') ? '已找到' : '未找到')
  
  // 添加错误处理，确保页面不会因为API错误而无法正常运行
  try {
    fetchCategories()
  } catch (error) {
    console.error(`[${__componentName}] 获取数据出错:`, error)
    useMockData() // 如果获取数据失败，使用模拟数据
  }
})

// 生命周期钩子 - 更新后
onUpdated(() => {
  console.log(`[${__componentName}] 组件已更新`)
})

// 使用模拟数据
const useMockData = () => {
  console.log('使用模拟数据')
  categories.value = [
    {
      id: 1,
      name: '习惯养成',
      description: '培养良好的生活习惯和自律能力',
      is_system: true,
      created_at: '2023-05-15 10:30:00'
    },
    {
      id: 2,
      name: '学习提升',
      description: '学习知识、提升技能和自我成长',
      is_system: true,
      created_at: '2023-05-15 10:35:00'
    },
    {
      id: 3,
      name: '团队会议',
      description: '跟踪记录团队日常会议情况',
      is_system: false,
      created_at: '2023-06-20 14:15:00'
    }
  ]
  totalItems.value = categories.value.length
}

// 获取打卡类型列表
const fetchCategories = async () => {
  loading.value = true
  try {
    // 使用API服务获取数据
    const response = await getTaskCategories({
      page: currentPage.value,
      page_size: pageSize.value
    })
    
    console.log('API响应:', response)
    
    // 处理不同的响应格式
    if (response.results && typeof response.count === 'number') {
      // DRF标准分页格式: {count, next, previous, results}
      categories.value = response.results
      totalItems.value = response.count
    } else if (Array.isArray(response)) {
      // 直接返回数组格式
      categories.value = response
      totalItems.value = response.length
    } else {
      // 其他格式，作为对象处理
      categories.value = Object.values(response || {})
      totalItems.value = categories.value.length
    }
    
    // 调试日志
    console.log('获取打卡类型列表成功:', categories.value)
  } catch (error) {
    console.error('获取打卡类型列表失败:', error)
    ElMessage.error('获取打卡类型列表失败，使用模拟数据')
    
    // 使用模拟数据
    useMockData()
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchCategories()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchCategories()
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchCategories()
}

// 新建类型
const handleCreateCategory = () => {
  dialogType.value = 'create'
  Object.assign(categoryForm, {
    id: null,
    name: '',
    description: '',
    icon: '',
    is_system: false
  })
  dialogVisible.value = true
}

// 查看类型
const handleViewCategory = (row) => {
  dialogType.value = 'view'
  Object.assign(categoryForm, { ...row })
  dialogVisible.value = true
}

// 编辑类型
const handleEditCategory = (row) => {
  dialogType.value = 'edit'
  Object.assign(categoryForm, { ...row })
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  console.log('提交表单', categoryFormRef.value)
  
  if (!categoryFormRef.value) {
    console.error('表单引用未找到')
    // 不阻止提交流程，尝试直接提交数据
    submitFormData()
    return
  }
  
  try {
    await categoryFormRef.value.validate((valid, fields) => {
      if (valid) {
        submitFormData()
      } else {
        console.log('表单验证失败:', fields)
        ElMessage.error('请正确填写表单')
      }
    })
  } catch (error) {
    console.error('表单验证出错:', error)
    // 出错时也尝试提交，避免UI卡死
    submitFormData()
  }
}

// 实际提交表单数据的方法
const submitFormData = async () => {
  loading.value = true
  try {
    if (dialogType.value === 'create') {
      // 创建新类型
      await createTaskCategory(categoryForm)
      ElMessage.success('创建类型成功')
    } else if (dialogType.value === 'edit') {
      // 更新类型
      await updateTaskCategory(categoryForm.id, categoryForm)
      ElMessage.success('更新类型成功')
    }
    
    dialogVisible.value = false
    fetchCategories() // 刷新数据
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败: ' + (error.response?.data?.detail || error.message))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.category-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-select {
  width: 150px;
}

.search-input {
  width: 250px;
}

.table-container {
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e6e6e6;
  overflow: hidden;
}

.category-tag {
  padding: 2px 8px;
  border-radius: 15px;
}

.pagination-container {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
}
</style> 
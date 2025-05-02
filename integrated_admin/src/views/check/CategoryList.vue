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
        <el-table-column label="操作" width="250" fixed="right">
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
              :disabled="scope.row.is_system && !isSystemAdmin"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              @click="handleDeleteCategory(scope.row)"
              :disabled="scope.row.is_system && !isSystemAdmin"
            >
              删除
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
        <el-form-item label="类型图标" prop="icon" v-if="isSystemAdmin || dialogType === 'view'">
          <el-input v-model="categoryForm.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="类型" prop="is_system" v-if="isSystemAdmin || dialogType === 'view'">
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
  patchTaskCategory,
  deleteTaskCategory 
} from '@/api/check'

// 添加调试日志，检查组件是否被正确加载
console.log('========= CategoryList组件被导入 =========')

// 定义组件名称，方便调试
const __componentName = 'CategoryList'

// 认证信息
const authStore = useAuthStore()
const isSystemAdmin = computed(() => authStore.isAdmin)

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
  
  // 请求数据
  fetchCategories()
})

// 生命周期钩子 - 更新后
onUpdated(() => {
  console.log(`[${__componentName}] 组件已更新`)
})

// 获取打卡类型列表
const fetchCategories = async () => {
  loading.value = true
  console.log('开始获取打卡类型列表，当前页:', currentPage.value, '每页条数:', pageSize.value)
  
  try {
    // 使用API服务获取数据
    const response = await getTaskCategories({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchKeyword.value || undefined
    })
    
    console.log('API原始响应:', response)
    
    // 检查API返回格式
    if (response.success && response.code === 2000 && response.data) {
      // 当前后端返回格式: {success, code, message, data: {pagination, results}}
      console.log('识别到自定义返回格式')
      
      // 从data中获取结果
      const { pagination, results } = response.data
      categories.value = results || []
      totalItems.value = pagination?.count || 0
      
      console.log('解析后的数据:', {
        categories: categories.value,
        totalItems: totalItems.value,
        pagination: pagination
      })
    } else if (response.results && typeof response.count === 'number') {
      // DRF标准分页格式: {count, next, previous, results}
      console.log('识别到Django REST Framework标准分页格式')
      categories.value = response.results
      totalItems.value = response.count
    } else if (Array.isArray(response)) {
      // 直接返回数组格式
      console.log('识别到数组格式响应')
      categories.value = response
      totalItems.value = response.length
    } else {
      // 其他格式，作为对象处理
      console.log('识别到其他格式响应，尝试作为对象处理')
      categories.value = Array.isArray(response) ? response : []
      totalItems.value = categories.value.length
      
      // 如果没有数据，输出警告但不使用模拟数据
      if (categories.value.length === 0) {
        console.warn('接口未返回数据或数据格式不符合预期')
      }
    }
    
    // 调试日志
    console.log('获取打卡类型列表成功，数据条数:', categories.value.length)
  } catch (error) {
    console.error('获取打卡类型列表失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    ElMessage.error('获取打卡类型列表失败')
    
    // 不使用模拟数据，确保显示真实数据状态
    categories.value = []
    totalItems.value = 0
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

// 删除类型
const handleDeleteCategory = (row) => {
  ElMessageBox.confirm(
    `确定要删除打卡类型 "${row.name}" 吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
  .then(async () => {
    loading.value = true
    try {
      console.log('删除打卡类型:', row.id)
      await deleteTaskCategory(row.id)
      ElMessage.success('删除成功')
      fetchCategories() // 刷新数据
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      loading.value = false
    }
  })
  .catch(() => {
    ElMessage.info('已取消删除')
  })
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
    console.log(`提交类型数据: ${dialogType.value}`, categoryForm)
    
    if (dialogType.value === 'create') {
      // 创建新类型
      console.log('【前端操作】准备创建新打卡类型，数据:', JSON.stringify(categoryForm))
      const response = await createTaskCategory(categoryForm)
      console.log('【前端操作】创建打卡类型成功，响应:', response)
      ElMessage.success('创建类型成功')
    } else if (dialogType.value === 'edit') {
      // 更新类型
      if (Object.keys(categoryForm).length === 1 && categoryForm.id) {
        // 如果只有ID字段，说明没有任何修改，直接关闭弹窗
        console.log('【前端操作】没有修改任何内容，取消更新')
        ElMessage.info('没有修改任何内容')
        dialogVisible.value = false
        return
      }
      
      // 确定是全量更新还是部分更新
      const changedFields = { ...categoryForm }
      
      if (Object.keys(changedFields).length <= 3) {
        // 如果修改的字段较少，使用PATCH进行部分更新
        console.log('【前端操作】使用PATCH进行部分更新，数据:', JSON.stringify(changedFields))
        const response = await patchTaskCategory(categoryForm.id, changedFields)
        console.log('【前端操作】部分更新成功，响应:', response)
        ElMessage.success('更新类型成功 (部分更新)')
      } else {
        // 否则使用PUT进行全量更新
        console.log('【前端操作】使用PUT进行全量更新，数据:', JSON.stringify(categoryForm))
        const response = await updateTaskCategory(categoryForm.id, categoryForm)
        console.log('【前端操作】全量更新成功，响应:', response)
        ElMessage.success('更新类型成功 (全量更新)')
      }
    }
    
    console.log('【前端操作】关闭弹窗并刷新数据')
    dialogVisible.value = false
    fetchCategories() // 刷新数据
  } catch (error) {
    console.error('【前端错误】操作失败:', error)
    console.error('【前端错误】详细信息:', error.response?.data || error.message)
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
  flex-wrap: wrap;
  gap: 15px;
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
  flex-wrap: wrap;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
  overflow-x: auto; /* 添加水平滚动 */
}

/* 表格容器样式 */
.el-table {
  overflow-x: auto;
  margin-bottom: 10px;
}

/* 小屏幕下调整表格列宽 */
@media screen and (max-width: 768px) {
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

/* 超小屏幕适配 */
@media screen and (max-width: 576px) {
  .el-table .el-button {
    padding: 6px 10px;
    font-size: 12px;
    margin-right: 5px;
    margin-bottom: 5px;
  }
  
  .el-table-column--action .cell {
    display: flex;
    flex-wrap: wrap;
  }
}

.category-tag {
  padding: 2px 8px;
  border-radius: 15px;
}

.pagination-container {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    margin-top: 10px;
  }
}

@media screen and (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
  
  .filter-select, .search-input {
    width: 100%;
    margin-top: 10px;
  }
  
  .pagination-container {
    justify-content: center;
  }
}

@media screen and (max-width: 576px) {
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .title {
    font-size: 20px;
  }
}
</style> 
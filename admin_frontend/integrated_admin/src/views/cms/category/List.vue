<template>
  <div class="category-list-page">
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <div class="page-actions">
        <el-button type="primary" @click="handleCreate" icon="Plus">新建分类</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="main-card">
          <template #header>
            <div class="card-header">
              <div class="card-title">分类列表</div>
              <div class="card-actions">
                <el-tooltip content="刷新数据">
                  <el-button icon="Refresh" circle @click="loadCategoryTree" />
                </el-tooltip>
                <el-tooltip content="展开全部">
                  <el-button icon="ArrowDown" circle @click="expandAll" />
                </el-tooltip>
                <el-tooltip content="折叠全部">
                  <el-button icon="ArrowUp" circle @click="collapseAll" />
                </el-tooltip>
              </div>
            </div>
          </template>

          <div v-loading="loading" class="category-table-container">
            <el-table
              ref="categoryTableRef"
              :data="categoryData"
              row-key="id"
              border
              default-expand-all
              :expand-row-keys="expandedKeys"
              :tree-props="{ children: 'children', hasChildren: 'has_children' }"
            >
              <el-table-column prop="name" label="分类名称" min-width="250">
                <template #default="{ row }">
                  <div class="category-name-cell">
                    <el-icon v-if="row.icon" :class="row.icon" class="category-icon"></el-icon>
                    <span>{{ row.name }}</span>
                    <el-tag v-if="row.is_featured" type="warning" size="small" class="ml-2">特色</el-tag>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="description" label="描述" min-width="250">
                <template #default="{ row }">
                  <span>{{ row.description || '暂无描述' }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="slug" label="别名" width="150">
                <template #default="{ row }">
                  <el-tag effect="plain" size="small">{{ row.slug }}</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="order" label="排序" width="100" align="center">
                <template #default="{ row }">
                  <div class="order-column">
                    <span>{{ row.order }}</span>
                    <div class="order-actions">
                      <el-tooltip content="上移">
                        <el-button 
                          type="primary" 
                          link 
                          icon="ArrowUp" 
                          size="small"
                          @click="moveCategory(row, 'up')"
                        />
                      </el-tooltip>
                      <el-tooltip content="下移">
                        <el-button 
                          type="primary" 
                          link 
                          icon="ArrowDown" 
                          size="small"
                          @click="moveCategory(row, 'down')"
                        />
                      </el-tooltip>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.is_active" type="success">已启用</el-tag>
                  <el-tag v-else type="info">已禁用</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="文章数" width="100" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link>{{ row.articles_count || 0 }}</el-button>
                </template>
              </el-table-column>

              <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                  <span>{{ row.created_at }}</span>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <el-button-group>
                    <el-tooltip content="新建子分类">
                      <el-button 
                        icon="Plus" 
                        size="small" 
                        @click="handleCreateChild(row)"
                      />
                    </el-tooltip>
                    <el-tooltip content="编辑">
                      <el-button 
                        icon="Edit" 
                        size="small" 
                        @click="handleEdit(row)"
                      />
                    </el-tooltip>
                    <el-tooltip :content="row.is_active ? '禁用' : '启用'">
                      <el-button 
                        :icon="row.is_active ? 'Close' : 'Check'"
                        size="small"
                        @click="toggleStatus(row)"
                      />
                    </el-tooltip>
                    <el-tooltip content="删除">
                      <el-button 
                        icon="Delete" 
                        size="small" 
                        type="danger"
                        @click="handleDelete(row)"
                      />
                    </el-tooltip>
                  </el-button-group>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分类统计卡片 -->
    <el-row :gutter="20" class="mt-4">
      <el-col :span="24">
        <el-card class="statistics-card">
          <template #header>
            <div class="card-header">
              <div class="card-title">分类统计</div>
              <el-button type="primary" link icon="Refresh" @click="loadStatistics">刷新</el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">总分类数</div>
                <div class="statistic-value">{{ statistics.total_count || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">一级分类数</div>
                <div class="statistic-value">{{ statistics.root_count || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">活跃分类数</div>
                <div class="statistic-value">{{ statistics.active_count || 0 }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="statistic-item">
                <div class="statistic-title">最多文章分类</div>
                <div class="statistic-value">{{ statistics.most_articles_category?.name || '-' }}</div>
                <div class="statistic-subtitle">{{ statistics.most_articles_category?.articles_count || 0 }} 篇文章</div>
              </div>
            </el-col>
          </el-row>
          
          <el-divider />
          
          <h4>热门分类排行</h4>
          <div class="popular-categories">
            <el-table :data="statistics.popular_categories || []" style="width: 100%">
              <el-table-column prop="name" label="分类名称" min-width="200" />
              <el-table-column prop="articles_count" label="文章数" width="100" align="center" />
              <el-table-column prop="views_count" label="浏览量" width="100" align="center" />
              <el-table-column prop="comments_count" label="评论数" width="100" align="center" />
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formType === 'create' ? '新建分类' : '编辑分类'"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="rules"
        label-width="100px"
        status-icon
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="别名" prop="slug">
          <el-input v-model="categoryForm.slug" placeholder="请输入分类别名(英文字母、数字或连字符)" />
        </el-form-item>
        
        <el-form-item label="父级分类" prop="parent_id">
          <el-tree-select
            v-model="categoryForm.parent_id"
            :data="categoryOptions"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            placeholder="请选择父级分类(不选则为顶级分类)"
            check-strictly
            clearable
            class="w-full"
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="封面图片" prop="cover_image">
          <el-upload
            class="cover-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            :on-success="handleCoverSuccess"
            :on-error="handleCoverError"
            :disabled="!categoryForm.id"
          >
            <img v-if="categoryForm.cover_image" :src="categoryForm.cover_image" class="cover-image" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="cover-tip" v-if="!categoryForm.id">请先保存分类，再上传封面图片</div>
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <el-input v-model="categoryForm.icon" placeholder="请输入图标类名" />
        </el-form-item>
        
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="categoryForm.order" :min="0" />
        </el-form-item>
        
        <el-form-item label="状态" prop="is_active">
          <el-switch
            v-model="categoryForm.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item label="特色分类" prop="is_featured">
          <el-switch v-model="categoryForm.is_featured" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, ArrowUp, ArrowDown, Refresh, Check, Close } from '@element-plus/icons-vue'
import { categoryApi } from '@/api/category'
import { debounce } from 'lodash-es'

// 状态变量
const loading = ref(false)
const categoryData = ref([])
const expandedKeys = ref([])
const statistics = ref({})
const dialogVisible = ref(false)
const formType = ref('create') // create 或 edit
const categoryFormRef = ref(null)
const submitLoading = ref(false)

// 表格引用
const categoryTableRef = ref(null)

// 表单数据
const categoryForm = reactive({
  id: null,
  name: '',
  slug: '',
  description: '',
  parent_id: null,
  order: 0,
  icon: '',
  cover_image: '',
  is_active: true,
  is_featured: false
})

// 验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入分类别名', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ]
}

// 上传相关
const uploadAction = computed(() => {
  return categoryForm.id ? `/api/cms/categories/${categoryForm.id}/cover-image/` : ''
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  }
})

// 分类选项(不包含当前编辑的分类及其子分类)
const categoryOptions = computed(() => {
  if (formType.value === 'create') {
    return categoryData.value
  } else {
    // 编辑模式下，不能选择自己或自己的子分类作为父级
    const excludeIds = getChildrenIds(categoryForm.id)
    excludeIds.push(categoryForm.id)
    return filterCategories(categoryData.value, excludeIds)
  }
})

// 过滤分类选项
const filterCategories = (categories, excludeIds) => {
  if (!categories) return []
  
  return categories.filter(item => !excludeIds.includes(item.id)).map(item => {
    const newItem = { ...item }
    if (item.children && item.children.length > 0) {
      newItem.children = filterCategories(item.children, excludeIds)
    }
    return newItem
  })
}

// 获取所有子分类ID
const getChildrenIds = (parentId) => {
  const ids = []
  const findChildren = (categories, pid) => {
    if (!categories) return
    
    categories.forEach(item => {
      if (item.parent_id === pid) {
        ids.push(item.id)
        if (item.children && item.children.length > 0) {
          findChildren(item.children, item.id)
        }
      } else if (item.children && item.children.length > 0) {
        findChildren(item.children, pid)
      }
    })
  }
  
  findChildren(flattenCategories(categoryData.value), parentId)
  return ids
}

// 展开所有节点
const expandAll = () => {
  const keys = getAllIds(categoryData.value)
  expandedKeys.value = keys
}

// 折叠所有节点
const collapseAll = () => {
  expandedKeys.value = []
}

// 获取所有分类ID
const getAllIds = (categories) => {
  if (!categories) return []
  
  let ids = []
  categories.forEach(item => {
    ids.push(item.id)
    if (item.children && item.children.length > 0) {
      ids = ids.concat(getAllIds(item.children))
    }
  })
  return ids
}

// 扁平化分类数据
const flattenCategories = (categories) => {
  if (!categories) return []
  
  let result = []
  categories.forEach(item => {
    result.push({ ...item })
    if (item.children && item.children.length > 0) {
      result = result.concat(flattenCategories(item.children))
    }
  })
  return result
}

// 加载分类树数据
const loadCategoryTree = async () => {
  loading.value = true
  try {
    const response = await categoryApi.getCategoryTree()
    categoryData.value = response.data
    
    // 默认展开第一级
    if (categoryData.value.length > 0) {
      expandedKeys.value = categoryData.value.map(item => item.id)
    }
    
    // 加载统计数据
    await loadStatistics()
  } catch (error) {
    console.error('获取分类数据失败:', error)
    ElMessage.error('获取分类数据失败')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 这里假设后端提供了获取分类统计数据的接口
    // 如果没有，可以根据已有数据计算
    const response = await categoryApi.getCategories({ with_statistics: true })
    
    // 计算统计数据
    const allCategories = flattenCategories(categoryData.value)
    const rootCategories = categoryData.value
    const activeCategories = allCategories.filter(item => item.is_active)
    
    // 排序找出最多文章的分类
    allCategories.sort((a, b) => (b.articles_count || 0) - (a.articles_count || 0))
    const popularCategories = allCategories.slice(0, 5)
    
    statistics.value = {
      total_count: allCategories.length,
      root_count: rootCategories.length,
      active_count: activeCategories.length,
      most_articles_category: allCategories[0],
      popular_categories: popularCategories
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

// 表单提交
const submitForm = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (formType.value === 'create') {
        await categoryApi.createCategory(categoryForm)
        ElMessage.success('分类创建成功')
      } else {
        const { id, ...updateData } = categoryForm
        await categoryApi.updateCategory(id, updateData)
        ElMessage.success('分类更新成功')
      }
      
      dialogVisible.value = false
      await loadCategoryTree()
    } catch (error) {
      console.error('保存分类失败:', error)
      ElMessage.error('保存分类失败')
    } finally {
      submitLoading.value = false
    }
  })
}

// 处理创建分类
const handleCreate = () => {
  resetForm()
  formType.value = 'create'
  dialogVisible.value = true
}

// 处理创建子分类
const handleCreateChild = (row) => {
  resetForm()
  formType.value = 'create'
  categoryForm.parent_id = row.id
  dialogVisible.value = true
}

// 处理编辑分类
const handleEdit = (row) => {
  resetForm()
  formType.value = 'edit'
  
  Object.keys(categoryForm).forEach(key => {
    if (key in row) {
      categoryForm[key] = row[key]
    }
  })
  
  dialogVisible.value = true
}

// 处理删除分类
const handleDelete = async (row) => {
  // 检查是否有子分类
  if (row.children && row.children.length > 0) {
    ElMessage.warning('该分类下有子分类，无法删除')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${row.name}" 吗？${row.articles_count > 0 ? `该分类下有 ${row.articles_count} 篇文章，删除后文章将失去此分类。` : ''}`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await categoryApi.deleteCategory(row.id)
    ElMessage.success('分类删除成功')
    await loadCategoryTree()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除分类失败')
    }
  }
}

// 切换分类状态
const toggleStatus = async (row) => {
  try {
    await categoryApi.patchCategory(row.id, { is_active: !row.is_active })
    ElMessage.success(`分类已${row.is_active ? '禁用' : '启用'}`)
    
    // 更新本地数据状态
    row.is_active = !row.is_active
  } catch (error) {
    console.error('更新分类状态失败:', error)
    ElMessage.error('更新分类状态失败')
  }
}

// 分类排序操作
const moveCategory = async (row, direction) => {
  const parent = findParentCategory(categoryData.value, row.id)
  const siblings = parent ? parent.children : categoryData.value
  const index = siblings.findIndex(item => item.id === row.id)
  
  if (direction === 'up' && index > 0) {
    // 上移
    const prevItem = siblings[index - 1]
    await swapCategoryOrder(row, prevItem)
  } else if (direction === 'down' && index < siblings.length - 1) {
    // 下移
    const nextItem = siblings[index + 1]
    await swapCategoryOrder(row, nextItem)
  }
}

// 找到父分类
const findParentCategory = (categories, childId) => {
  for (const category of categories) {
    if (category.children && category.children.some(child => child.id === childId)) {
      return category
    }
    
    if (category.children) {
      const found = findParentCategory(category.children, childId)
      if (found) return found
    }
  }
  
  return null
}

// 交换分类排序
const swapCategoryOrder = async (category1, category2) => {
  try {
    // 保存原始顺序值
    const order1 = category1.order
    const order2 = category2.order
    
    // 交换顺序值
    await categoryApi.updateCategoryOrder({
      categories: [
        { id: category1.id, order: order2 },
        { id: category2.id, order: order1 }
      ]
    })
    
    // 更新本地数据
    category1.order = order2
    category2.order = order1
    
    // 重新加载分类树
    await loadCategoryTree()
    
    ElMessage.success('分类排序已更新')
  } catch (error) {
    console.error('更新分类排序失败:', error)
    ElMessage.error('更新分类排序失败')
  }
}

// 上传图片前检查
const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  
  return true
}

// 图片上传成功回调
const handleCoverSuccess = (response) => {
  categoryForm.cover_image = response.data.url
  ElMessage.success('封面图片上传成功')
}

// 图片上传失败回调
const handleCoverError = () => {
  ElMessage.error('封面图片上传失败')
}

// 重置表单
const resetForm = () => {
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
  
  Object.assign(categoryForm, {
    id: null,
    name: '',
    slug: '',
    description: '',
    parent_id: null,
    order: 0,
    icon: '',
    cover_image: '',
    is_active: true,
    is_featured: false
  })
}

// 生命周期钩子
onMounted(() => {
  loadCategoryTree()
})
</script>

<style scoped>
.category-list-page {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.category-table-container {
  margin-bottom: 20px;
}

.category-name-cell {
  display: flex;
  align-items: center;
}

.category-icon {
  margin-right: 8px;
  font-size: 16px;
}

.order-column {
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-actions {
  margin-left: 8px;
  display: flex;
}

.mt-4 {
  margin-top: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.w-full {
  width: 100%;
}

.statistics-card {
  margin-bottom: 20px;
}

.statistic-item {
  text-align: center;
  padding: 20px 0;
}

.statistic-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.statistic-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.statistic-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.popular-categories {
  margin-top: 15px;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.cover-uploader:hover {
  border-color: #409EFF;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-image {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.cover-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style> 
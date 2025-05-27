<template>
  <div class="article-list-page">
    <div class="page-header">
      <h2 class="page-title">文章管理</h2>
      <div class="page-actions">
        <el-button type="primary" @click="handleCreate" icon="Plus">创建文章</el-button>
      </div>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <el-card class="filter-container">
      <el-form :model="queryParams" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="标题/内容"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.category_id" placeholder="全部分类" clearable>
            <el-option 
              v-for="category in categories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="Search">搜索</el-button>
          <el-button @click="resetQuery" icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 批量操作工具栏 -->
    <el-card class="table-container">
      <div class="toolbar">
        <div class="batch-actions" v-if="selectedArticles.length > 0">
          <span class="selected-count">已选择 {{ selectedArticles.length }} 项</span>
          <el-dropdown @command="handleBatchCommand">
            <el-button type="primary">
              批量操作
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="publish">批量发布</el-dropdown-item>
                <el-dropdown-item command="draft">设为草稿</el-dropdown-item>
                <el-dropdown-item command="archive">归档</el-dropdown-item>
                <el-dropdown-item command="delete" divided>批量删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="table-settings">
          <el-tooltip content="刷新数据">
            <el-button icon="Refresh" circle @click="getArticleList" />
          </el-tooltip>
          <el-tooltip content="列设置">
            <el-button icon="SetUp" circle @click="showColumnSettings = true" />
          </el-tooltip>
        </div>
      </div>
      
      <!-- 文章表格 -->
      <el-table
        v-loading="loading"
        :data="articleList"
        @selection-change="handleSelectionChange"
        style="width: 100%"
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="文章信息" min-width="300">
          <template #default="{ row }">
            <div class="article-info">
              <div class="article-thumbnail" v-if="row.cover_image">
                <el-image :src="row.cover_image" fit="cover" :preview-src-list="[row.cover_image]" />
              </div>
              <div class="article-content">
                <div class="article-title">
                  <router-link :to="`/cms/articles/view/${row.id}`">{{ row.title }}</router-link>
                  <el-tag size="small" v-if="row.is_featured" type="warning">特色</el-tag>
                  <el-tag size="small" v-if="row.is_pinned" type="success">置顶</el-tag>
                </div>
                <div class="article-excerpt">{{ row.excerpt || '暂无摘要' }}</div>
                <div class="article-meta">
                  <span>
                    <el-icon><View /></el-icon> {{ row.views_count || 0 }}
                  </span>
                  <span>
                    <el-icon><ChatDotRound /></el-icon> {{ row.comments_count || 0 }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-for="category in row.categories" :key="category.id" size="small" effect="plain" class="mr-1">
              {{ category.name }}
            </el-tag>
            <span v-if="!row.categories || row.categories.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="150">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag.id" size="small" type="info" effect="plain" class="mr-1">
              {{ tag.name }}
            </el-tag>
            <span v-if="!row.tags || row.tags.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="author.username" label="作者" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">
            {{ row.published_at || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-tooltip content="查看">
                <el-button icon="View" size="small" @click="handleView(row)" />
              </el-tooltip>
              <el-tooltip content="编辑">
                <el-button icon="Edit" size="small" @click="handleEdit(row)" />
              </el-tooltip>
              <el-dropdown trigger="click" @command="(command) => handleCommand(command, row)">
                <el-button size="small">
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.status !== 'published'" command="publish">发布</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === 'published'" command="draft">设为草稿</el-dropdown-item>
                    <el-dropdown-item v-if="row.status !== 'archived'" command="archive">归档</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.per_page"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 列设置对话框 -->
    <el-dialog v-model="showColumnSettings" title="列设置" width="500px">
      <el-checkbox-group v-model="visibleColumns">
        <el-checkbox v-for="col in availableColumns" :key="col.prop" :label="col.prop">
          {{ col.label }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="showColumnSettings = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { articleApi } from '@/api/article'
import { categoryApi } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, ArrowDown, View, Edit, More, ChatDotRound } from '@element-plus/icons-vue'

const router = useRouter()

// 状态变量
const loading = ref(false)
const articleList = ref([])
const categories = ref([])
const total = ref(0)
const selectedArticles = ref([])
const showColumnSettings = ref(false)

// 查询参数
const queryParams = reactive({
  page: 1,
  per_page: 10,
  keyword: '',
  status: '',
  category_id: '',
  start_date: '',
  end_date: '',
  sort_by: 'created_at',
  sort_order: 'desc'
})

// 日期范围
const dateRange = ref([])

// 监听日期范围变化
watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.start_date = newVal[0]
    queryParams.end_date = newVal[1]
  } else {
    queryParams.start_date = ''
    queryParams.end_date = ''
  }
})

// 列配置
const availableColumns = [
  { prop: 'title', label: '标题' },
  { prop: 'categories', label: '分类' },
  { prop: 'tags', label: '标签' },
  { prop: 'author', label: '作者' },
  { prop: 'status', label: '状态' },
  { prop: 'published_at', label: '发布时间' },
  { prop: 'created_at', label: '创建时间' },
]
const visibleColumns = ref(['title', 'categories', 'tags', 'author', 'status', 'published_at'])

// 获取文章列表
const getArticleList = async () => {
  loading.value = true
  try {
    const response = await articleApi.getArticles(queryParams)
    articleList.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取文章列表失败:', error)
    ElMessage.error('获取文章列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategoryList = async () => {
  try {
    const response = await categoryApi.getCategories({ is_active: true })
    categories.value = response.data.items
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 状态转换
const getStatusType = (status) => {
  const statusMap = {
    draft: 'info',
    pending: 'warning',
    published: 'success',
    archived: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    draft: '草稿',
    pending: '待审核',
    published: '已发布',
    archived: '已归档'
  }
  return statusMap[status] || status
}

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedArticles.value = selection
}

// 搜索
const handleSearch = () => {
  queryParams.page = 1
  getArticleList()
}

// 重置查询
const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.status = ''
  queryParams.category_id = ''
  queryParams.start_date = ''
  queryParams.end_date = ''
  dateRange.value = []
  handleSearch()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  queryParams.page = page
  getArticleList()
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  queryParams.per_page = size
  queryParams.page = 1
  getArticleList()
}

// 应用列设置
const applyColumnSettings = () => {
  showColumnSettings.value = false
  // 这里可以保存用户的列设置到本地存储
  localStorage.setItem('articleListColumns', JSON.stringify(visibleColumns.value))
}

// 创建文章
const handleCreate = () => {
  router.push('/cms/articles/create')
}

// 查看文章
const handleView = (row) => {
  router.push(`/cms/articles/view/${row.id}`)
}

// 编辑文章
const handleEdit = (row) => {
  router.push(`/cms/articles/edit/${row.id}`)
}

// 处理下拉菜单命令
const handleCommand = async (command, row) => {
  switch (command) {
    case 'publish':
      await updateArticleStatus(row.id, 'published')
      break
    case 'draft':
      await updateArticleStatus(row.id, 'draft')
      break
    case 'archive':
      await updateArticleStatus(row.id, 'archived')
      break
    case 'duplicate':
      await duplicateArticle(row.id)
      break
    case 'delete':
      await deleteArticle(row.id)
      break
  }
}

// 批量操作
const handleBatchCommand = async (command) => {
  const ids = selectedArticles.value.map(item => item.id)
  if (ids.length === 0) {
    ElMessage.warning('请选择要操作的文章')
    return
  }
  
  switch (command) {
    case 'publish':
      await batchUpdateStatus(ids, 'published')
      break
    case 'draft':
      await batchUpdateStatus(ids, 'draft')
      break
    case 'archive':
      await batchUpdateStatus(ids, 'archived')
      break
    case 'delete':
      await batchDelete(ids)
      break
  }
}

// 更新文章状态
const updateArticleStatus = async (id, status) => {
  try {
    await articleApi.updateArticleStatus(id, status)
    ElMessage.success(`文章状态已更新为${getStatusText(status)}`)
    getArticleList()
  } catch (error) {
    console.error('更新文章状态失败:', error)
    ElMessage.error('更新文章状态失败')
  }
}

// 复制文章
const duplicateArticle = async (id) => {
  try {
    const response = await articleApi.getArticleById(id)
    const article = response.data
    
    // 创建新文章，复制原文章内容
    const newArticle = {
      title: `${article.title} (复制)`,
      content: article.content,
      content_type: article.content_type,
      excerpt: article.excerpt,
      status: 'draft'
    }
    
    await articleApi.createArticle(newArticle)
    ElMessage.success('文章已复制')
    getArticleList()
  } catch (error) {
    console.error('复制文章失败:', error)
    ElMessage.error('复制文章失败')
  }
}

// 删除文章
const deleteArticle = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await articleApi.deleteArticle(id)
    ElMessage.success('文章已删除')
    getArticleList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
      ElMessage.error('删除文章失败')
    }
  }
}

// 批量更新状态
const batchUpdateStatus = async (ids, status) => {
  try {
    // 这里假设后端提供了批量更新状态的接口
    // 实际实现可能需要循环调用单个更新接口
    for (const id of ids) {
      await articleApi.updateArticleStatus(id, status)
    }
    ElMessage.success(`已将${ids.length}篇文章状态更新为${getStatusText(status)}`)
    getArticleList()
  } catch (error) {
    console.error('批量更新状态失败:', error)
    ElMessage.error('批量更新状态失败')
  }
}

// 批量删除
const batchDelete = async (ids) => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的${ids.length}篇文章吗？此操作不可恢复。`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里假设后端提供了批量删除的接口
    // 实际实现可能需要循环调用单个删除接口
    for (const id of ids) {
      await articleApi.deleteArticle(id)
    }
    ElMessage.success(`已删除${ids.length}篇文章`)
    getArticleList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 生命周期钩子
onMounted(() => {
  // 尝试从本地存储加载列设置
  const savedColumns = localStorage.getItem('articleListColumns')
  if (savedColumns) {
    try {
      visibleColumns.value = JSON.parse(savedColumns)
    } catch (e) {
      console.error('解析保存的列设置失败:', e)
    }
  }
  
  getArticleList()
  getCategoryList()
})
</script>

<style scoped>
.article-list-page {
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

.filter-container {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.batch-actions {
  display: flex;
  align-items: center;
}

.selected-count {
  margin-right: 10px;
  font-size: 14px;
  color: #606266;
}

.table-settings {
  display: flex;
  gap: 8px;
}

.article-info {
  display: flex;
  align-items: flex-start;
}

.article-thumbnail {
  width: 60px;
  height: 60px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.article-thumbnail .el-image {
  width: 100%;
  height: 100%;
}

.article-content {
  flex: 1;
}

.article-title {
  font-weight: bold;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.article-title a {
  color: #303133;
  text-decoration: none;
  margin-right: 8px;
}

.article-title a:hover {
  color: #409EFF;
}

.article-excerpt {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-meta {
  display: flex;
  font-size: 12px;
  color: #909399;
}

.article-meta span {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.article-meta .el-icon {
  margin-right: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mr-1 {
  margin-right: 4px;
}
</style> 
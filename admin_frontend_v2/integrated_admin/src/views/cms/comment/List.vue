<template>
  <div class="comment-list-page">
    <div class="page-header">
      <h2 class="page-title">评论管理</h2>
      <div class="page-actions">
        <el-button type="primary" @click="handleRefresh" icon="Refresh">刷新数据</el-button>
      </div>
    </div>

    <!-- 筛选表单 -->
    <el-card class="filter-card mb-4">
      <template #header>
        <div class="card-header">
          <div class="card-title">筛选条件</div>
          <el-button type="primary" link @click="toggleFilterForm">
            {{ showFilter ? '收起' : '展开' }}
            <el-icon>
              <component :is="showFilter ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
          </el-button>
        </div>
      </template>

      <el-form
        v-show="showFilter"
        ref="filterFormRef"
        :model="filterForm"
        inline
        class="filter-form"
      >
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="评论内容/作者"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="文章">
          <el-input
            v-model="filterForm.article"
            placeholder="文章标题"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="垃圾评论" value="spam" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 评论列表 -->
    <el-card class="comment-list-card">
      <template #header>
        <div class="card-header">
          <div class="card-title">评论列表</div>
          <div class="batch-actions" v-if="selectedComments.length">
            <el-dropdown @command="handleBatchAction">
              <el-button type="primary">
                批量操作 <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="approve">批准</el-dropdown-item>
                  <el-dropdown-item command="reject">拒绝</el-dropdown-item>
                  <el-dropdown-item command="spam">标记为垃圾</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <span class="selected-count">已选择 {{ selectedComments.length }} 条评论</span>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="comment-table-container">
        <el-table
          ref="commentTableRef"
          :data="commentList"
          @selection-change="handleSelectionChange"
          border
          style="width: 100%"
        >
          <el-table-column type="selection" width="50" />
          
          <el-table-column label="评论内容" min-width="300">
            <template #default="{ row }">
              <div class="comment-content">
                <div class="comment-author">
                  <el-avatar :size="32" :src="row.author_avatar">{{ row.author_name?.charAt(0) }}</el-avatar>
                  <div class="author-info">
                    <div class="author-name">{{ row.author_name }}</div>
                    <div class="author-email">{{ row.author_email }}</div>
                  </div>
                </div>
                
                <div class="comment-text">{{ row.content }}</div>
                
                <div class="comment-meta">
                  <span>{{ row.created_at }}</span>
                  <span v-if="row.ip_address">IP: {{ row.ip_address }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="article.title" label="所属文章" min-width="200">
            <template #default="{ row }">
              <el-link type="primary" @click="viewArticle(row.article?.id)">
                {{ row.article?.title || '未知文章' }}
              </el-link>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'approved'" type="success">已批准</el-tag>
              <el-tag v-else-if="row.status === 'pending'" type="warning">待审核</el-tag>
              <el-tag v-else-if="row.status === 'rejected'" type="info">已拒绝</el-tag>
              <el-tag v-else-if="row.status === 'spam'" type="danger">垃圾评论</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-tooltip content="查看详情">
                  <el-button icon="View" size="small" @click="handleView(row)" />
                </el-tooltip>
                
                <el-tooltip content="回复">
                  <el-button icon="ChatLineRound" size="small" @click="handleReply(row)" />
                </el-tooltip>
                
                <el-tooltip v-if="row.status !== 'approved'" content="批准">
                  <el-button icon="Check" size="small" type="success" @click="handleApprove(row)" />
                </el-tooltip>
                
                <el-tooltip v-if="row.status !== 'rejected'" content="拒绝">
                  <el-button icon="Close" size="small" type="info" @click="handleReject(row)" />
                </el-tooltip>
                
                <el-tooltip v-if="row.status !== 'spam'" content="标记为垃圾">
                  <el-button icon="Warning" size="small" type="warning" @click="handleMarkAsSpam(row)" />
                </el-tooltip>
                
                <el-tooltip content="删除">
                  <el-button icon="Delete" size="small" type="danger" @click="handleDelete(row)" />
                </el-tooltip>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 评论详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="评论详情"
      width="600px"
    >
      <div v-if="currentComment" class="comment-detail">
        <div class="detail-item">
          <div class="detail-label">评论者：</div>
          <div class="detail-value">{{ currentComment.author_name }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">邮箱：</div>
          <div class="detail-value">{{ currentComment.author_email }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">IP地址：</div>
          <div class="detail-value">{{ currentComment.ip_address || '未知' }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">评论时间：</div>
          <div class="detail-value">{{ currentComment.created_at }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">所属文章：</div>
          <div class="detail-value">
            <el-link type="primary" @click="viewArticle(currentComment.article?.id)">
              {{ currentComment.article?.title || '未知文章' }}
            </el-link>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">状态：</div>
          <div class="detail-value">
            <el-tag v-if="currentComment.status === 'approved'" type="success">已批准</el-tag>
            <el-tag v-else-if="currentComment.status === 'pending'" type="warning">待审核</el-tag>
            <el-tag v-else-if="currentComment.status === 'rejected'" type="info">已拒绝</el-tag>
            <el-tag v-else-if="currentComment.status === 'spam'" type="danger">垃圾评论</el-tag>
          </div>
        </div>
        
        <div class="detail-item" v-if="currentComment.parent">
          <div class="detail-label">回复评论：</div>
          <div class="detail-value parent-comment">
            <div class="parent-author">{{ currentComment.parent.author_name }} 说：</div>
            <div class="parent-content">{{ currentComment.parent.content }}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">评论内容：</div>
          <div class="detail-value comment-content-detail">{{ currentComment.content }}</div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button v-if="currentComment?.status !== 'approved'" type="success" @click="handleApprove(currentComment)">批准</el-button>
          <el-button v-if="currentComment?.status !== 'rejected'" type="info" @click="handleReject(currentComment)">拒绝</el-button>
          <el-button v-if="currentComment?.status !== 'spam'" type="warning" @click="handleMarkAsSpam(currentComment)">标记为垃圾</el-button>
          <el-button type="primary" @click="handleReply(currentComment)">回复</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回复评论对话框 -->
    <el-dialog
      v-model="replyDialogVisible"
      title="回复评论"
      width="600px"
    >
      <div v-if="currentComment" class="reply-dialog-content">
        <div class="original-comment">
          <div class="original-author">{{ currentComment.author_name }} 说：</div>
          <div class="original-content">{{ currentComment.content }}</div>
        </div>
        
        <el-form ref="replyFormRef" :model="replyForm" :rules="replyRules">
          <el-form-item label="回复内容" prop="content">
            <el-input
              v-model="replyForm.content"
              type="textarea"
              :rows="4"
              placeholder="请输入回复内容"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="replyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReply" :loading="submitLoading">提交回复</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  Refresh, View, Check, Close, Warning, Delete, ChatLineRound,
  ArrowDown, ArrowUp 
} from '@element-plus/icons-vue'
import { commentApi } from '@/api/comment'

const router = useRouter()

// 状态变量
const loading = ref(false)
const commentList = ref([])
const currentComment = ref(null)
const detailDialogVisible = ref(false)
const replyDialogVisible = ref(false)
const submitLoading = ref(false)
const showFilter = ref(true)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 批量操作相关
const selectedComments = ref([])
const commentTableRef = ref(null)

// 表单相关
const filterFormRef = ref(null)
const replyFormRef = ref(null)

// 筛选表单数据
const filterForm = reactive({
  keyword: '',
  article: '',
  status: '',
  dateRange: []
})

// 回复表单数据
const replyForm = reactive({
  content: ''
})

// 回复表单验证规则
const replyRules = {
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 1, max: 1000, message: '长度在 1 到 1000 个字符', trigger: 'blur' }
  ]
}

// 加载评论列表
const loadComments = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    
    // 添加筛选条件
    if (filterForm.keyword) {
      params.keyword = filterForm.keyword
    }
    
    if (filterForm.article) {
      params.article_title = filterForm.article
    }
    
    if (filterForm.status) {
      params.status = filterForm.status
    }
    
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.start_date = filterForm.dateRange[0]
      params.end_date = filterForm.dateRange[1]
    }
    
    const response = await commentApi.getComments(params)
    commentList.value = response.data.results || response.data
    total.value = response.data.count || commentList.value.length
  } catch (error) {
    console.error('获取评论列表失败:', error)
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const handleRefresh = () => {
  loadComments()
}

// 切换筛选表单显示状态
const toggleFilterForm = () => {
  showFilter.value = !showFilter.value
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  loadComments()
}

// 重置筛选条件
const resetFilter = () => {
  filterFormRef.value?.resetFields()
  handleSearch()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  loadComments()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  loadComments()
}

// 查看文章
const viewArticle = (articleId) => {
  if (!articleId) return
  router.push(`/cms/article/view/${articleId}`)
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedComments.value = selection
}

// 查看评论详情
const handleView = (row) => {
  currentComment.value = row
  detailDialogVisible.value = true
}

// 回复评论
const handleReply = (row) => {
  currentComment.value = row
  replyForm.content = ''
  replyDialogVisible.value = true
}

// 提交回复
const submitReply = async () => {
  if (!currentComment.value) return
  
  try {
    await replyFormRef.value.validate()
    
    submitLoading.value = true
    await commentApi.replyToComment(currentComment.value.id, { content: replyForm.content })
    
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('回复评论失败:', error)
      ElMessage.error('回复评论失败')
    }
  } finally {
    submitLoading.value = false
  }
}

// 批准评论
const handleApprove = async (row) => {
  if (!row) return
  
  try {
    await commentApi.approveComment(row.id)
    ElMessage.success('评论已批准')
    
    // 更新本地数据
    if (row === currentComment.value) {
      currentComment.value.status = 'approved'
    }
    
    // 刷新列表
    loadComments()
  } catch (error) {
    console.error('批准评论失败:', error)
    ElMessage.error('批准评论失败')
  }
}

// 拒绝评论
const handleReject = async (row) => {
  if (!row) return
  
  try {
    await commentApi.rejectComment(row.id)
    ElMessage.success('评论已拒绝')
    
    // 更新本地数据
    if (row === currentComment.value) {
      currentComment.value.status = 'rejected'
    }
    
    // 刷新列表
    loadComments()
  } catch (error) {
    console.error('拒绝评论失败:', error)
    ElMessage.error('拒绝评论失败')
  }
}

// 标记为垃圾评论
const handleMarkAsSpam = async (row) => {
  if (!row) return
  
  try {
    await commentApi.markAsSpam(row.id)
    ElMessage.success('已标记为垃圾评论')
    
    // 更新本地数据
    if (row === currentComment.value) {
      currentComment.value.status = 'spam'
    }
    
    // 刷新列表
    loadComments()
  } catch (error) {
    console.error('标记垃圾评论失败:', error)
    ElMessage.error('标记垃圾评论失败')
  }
}

// 删除评论
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该评论吗？删除后将无法恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await commentApi.deleteComment(row.id)
    ElMessage.success('评论已删除')
    
    // 关闭详情对话框
    if (row === currentComment.value) {
      detailDialogVisible.value = false
    }
    
    // 刷新列表
    loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除评论失败')
    }
  }
}

// 批量操作
const handleBatchAction = async (action) => {
  if (selectedComments.value.length === 0) return
  
  const ids = selectedComments.value.map(item => item.id)
  
  try {
    switch (action) {
      case 'approve':
        await commentApi.batchOperateComments('approve', ids)
        ElMessage.success(`已批准 ${ids.length} 条评论`)
        break
      case 'reject':
        await commentApi.batchOperateComments('reject', ids)
        ElMessage.success(`已拒绝 ${ids.length} 条评论`)
        break
      case 'spam':
        await commentApi.batchOperateComments('spam', ids)
        ElMessage.success(`已将 ${ids.length} 条评论标记为垃圾评论`)
        break
      case 'delete':
        await ElMessageBox.confirm(
          `确定要删除选中的 ${ids.length} 条评论吗？删除后将无法恢复。`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        await commentApi.batchOperateComments('delete', ids)
        ElMessage.success(`已删除 ${ids.length} 条评论`)
        break
    }
    
    // 清空选择
    commentTableRef.value?.clearSelection()
    
    // 刷新列表
    loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量操作失败:', error)
      ElMessage.error('批量操作失败')
    }
  }
}

// 生命周期钩子
onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.comment-list-page {
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

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin-top: 15px;
}

.comment-list-card {
  margin-bottom: 20px;
}

.comment-table-container {
  margin-bottom: 20px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  color: #606266;
  font-size: 14px;
}

.comment-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: bold;
}

.author-email {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  line-height: 1.5;
  color: #303133;
  margin: 8px 0;
  word-break: break-word;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情对话框样式 */
.comment-detail {
  max-height: 500px;
  overflow-y: auto;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
}

.detail-label {
  width: 100px;
  font-weight: bold;
  color: #606266;
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  word-break: break-word;
}

.parent-comment {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 5px;
}

.parent-author {
  font-weight: bold;
  margin-bottom: 5px;
}

.comment-content-detail {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.5;
}

/* 回复对话框样式 */
.reply-dialog-content {
  padding: 0 0 20px 0;
}

.original-comment {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.original-author {
  font-weight: bold;
  margin-bottom: 10px;
}

.original-content {
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style> 
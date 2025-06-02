<template>
  <div class="main-container">
    <!-- 筛选区域 -->
    <el-card class="filter-container">
      <el-form :inline="true" :model="queryParams" @keyup.enter="handleSearch">
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="评论内容/作者" clearable />
        </el-form-item>
        <el-form-item label="文章">
          <el-select v-model="queryParams.article_id" placeholder="选择文章" clearable filterable>
            <el-option
              v-for="article in articles"
              :key="article.id"
              :label="article.title"
              :value="article.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="评论状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="垃圾评论" value="spam" />
          </el-select>
        </el-form-item>
        <el-form-item label="评论日期">
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
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            <span>搜索</span>
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            <span>重置</span>
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计区域 -->
    <el-card class="stats-container">
      <div class="stats-header">
        <div class="stats-title">评论统计</div>
        <div class="stats-action">
          <el-button type="primary" plain size="small" @click="handleRefreshStats">
            <el-icon><RefreshRight /></el-icon>
            <span>刷新统计</span>
          </el-button>
        </div>
      </div>
      <div class="stats-body">
        <div class="stats-item">
          <div class="stats-label">总评论数</div>
          <div class="stats-value">{{ commentStats.total }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">待审核</div>
          <div class="stats-value">{{ commentStats.pending }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">已批准</div>
          <div class="stats-value">{{ commentStats.approved }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">已拒绝</div>
          <div class="stats-value">{{ commentStats.rejected }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">垃圾评论</div>
          <div class="stats-value">{{ commentStats.spam }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-label">今日评论</div>
          <div class="stats-value">{{ commentStats.today }}</div>
        </div>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-container">
      <div class="table-header">
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedComments.length === 0"
            @click="handleBatchApprove"
          >
            批量批准
          </el-button>
          <el-button
            type="warning"
            :disabled="selectedComments.length === 0"
            @click="handleBatchReject"
          >
            批量拒绝
          </el-button>
          <el-button
            type="danger"
            :disabled="selectedComments.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button
            :disabled="selectedComments.length === 0"
            @click="handleBatchSpam"
          >
            标记垃圾评论
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="comments"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="内容" prop="content" show-overflow-tooltip min-width="250">
          <template #default="{ row }">
            <el-tooltip
              :content="row.content"
              placement="top"
              :show-after="1000"
            >
              <div class="comment-content">{{ row.content }}</div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="作者" prop="user_name" width="120">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="30" :src="row.user_avatar">{{ row.user_name.substring(0, 1) }}</el-avatar>
              <span class="user-name">{{ row.user_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="文章" prop="article_title" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100">
          <template #default="{ row }">
            <el-tag
              :type="statusTagType(row.status)"
              :effect="statusTagEffect(row.status)"
            >
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日期" prop="created_at" width="180" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'approved'"
              type="success"
              link
              @click="handleApprove(row)"
            >
              批准
            </el-button>
            <el-button
              v-if="row.status !== 'rejected'"
              type="warning"
              link
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status !== 'spam'"
              link
              @click="handleSpam(row)"
            >
              垃圾评论
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 评论详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="评论详情"
      width="600px"
    >
      <div v-loading="detailLoading" class="comment-detail">
        <template v-if="currentComment">
          <div class="detail-header">
            <div class="user-info">
              <el-avatar :size="40" :src="currentComment.user_avatar">
                {{ currentComment.user_name?.substring(0, 1) }}
              </el-avatar>
              <div class="user-meta">
                <div class="user-name">{{ currentComment.user_name }}</div>
                <div class="user-email">{{ currentComment.user_email }}</div>
              </div>
            </div>
            <div class="comment-meta">
              <div class="comment-date">{{ currentComment.created_at }}</div>
              <div class="comment-ip">IP: {{ currentComment.ip_address }}</div>
            </div>
          </div>
          <div class="detail-body">
            <div class="article-info">
              <div class="article-label">文章：</div>
              <div class="article-title">{{ currentComment.article_title }}</div>
            </div>
            <div class="comment-content">{{ currentComment.content }}</div>
          </div>
          <div class="detail-footer">
            <div class="reply-form">
              <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef">
                <el-form-item prop="content">
                  <el-input
                    v-model="replyForm.content"
                    type="textarea"
                    rows="3"
                    placeholder="输入回复内容"
                  />
                </el-form-item>
              </el-form>
              <div class="form-actions">
                <el-button type="primary" @click="handleReply">回复</el-button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { Search, RefreshRight } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, FormInstance } from "element-plus";
import { useCommentStore } from "@/store/modules/cms";
import { useArticleStore } from "@/store/modules/cms";
import { Comment, CommentQuery, CommentStatus } from "@/../types/cms/comment";

// 状态与查询参数
const commentStore = useCommentStore();
const articleStore = useArticleStore();
const loading = computed(() => commentStore.loading);
const comments = computed(() => commentStore.comments);
const total = computed(() => commentStore.total);
const commentStats = computed(() => commentStore.commentStats);
const articles = ref([]);
const queryParams = reactive<CommentQuery>({
  page: 1,
  limit: 10,
});
const dateRange = ref([]);

// 选择与操作状态
const selectedComments = ref<Comment[]>([]);
const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const currentComment = ref<Comment | null>(null);
const replyForm = reactive({
  content: ""
});
const replyFormRef = ref<FormInstance>();
const replyRules = {
  content: [
    { required: true, message: "请输入回复内容", trigger: "blur" },
    { min: 1, max: 500, message: "回复内容长度应在1到500个字符之间", trigger: "blur" }
  ]
};

// 状态文本与样式
const statusText = (status: CommentStatus) => {
  const statusMap = {
    pending: "待审核",
    approved: "已批准",
    rejected: "已拒绝",
    spam: "垃圾评论"
  };
  return statusMap[status] || status;
};

const statusTagType = (status: CommentStatus) => {
  const typeMap = {
    pending: "info",
    approved: "success",
    rejected: "warning",
    spam: "danger"
  };
  return typeMap[status] || "";
};

const statusTagEffect = (status: CommentStatus) => {
  return status === "approved" ? "dark" : "light";
};

// 加载数据
const loadData = async () => {
  // 处理日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.start_date = dateRange.value[0];
    queryParams.end_date = dateRange.value[1];
  } else {
    queryParams.start_date = undefined;
    queryParams.end_date = undefined;
  }
  
  await commentStore.fetchComments(queryParams);
};

const loadStats = async () => {
  await commentStore.fetchCommentStats();
};

// 事件处理
const handleSearch = () => {
  queryParams.page = 1;
  loadData();
};

const handleReset = () => {
  queryParams.keyword = undefined;
  queryParams.article_id = undefined;
  queryParams.status = undefined;
  dateRange.value = [];
  queryParams.start_date = undefined;
  queryParams.end_date = undefined;
  queryParams.page = 1;
  loadData();
};

const handleRefreshStats = () => {
  loadStats();
};

const handleSelectionChange = (selection: Comment[]) => {
  selectedComments.value = selection;
};

const handleSizeChange = (size: number) => {
  queryParams.limit = size;
  loadData();
};

const handleCurrentChange = (page: number) => {
  queryParams.page = page;
  loadData();
};

// 单条评论操作
const handleApprove = async (row: Comment) => {
  await commentStore.reviewCommentAction(row.id, "approved");
  loadStats();
};

const handleReject = async (row: Comment) => {
  await commentStore.reviewCommentAction(row.id, "rejected");
  loadStats();
};

const handleSpam = async (row: Comment) => {
  await commentStore.reviewCommentAction(row.id, "spam");
  loadStats();
};

const handleViewDetail = async (row: Comment) => {
  detailLoading.value = true;
  detailDialogVisible.value = true;
  currentComment.value = row;
  
  // 可以在这里加载评论详情和回复列表
  const comment = await commentStore.fetchCommentDetail(row.id);
  if (comment) {
    currentComment.value = comment;
  }
  
  detailLoading.value = false;
};

const handleDelete = async (row: Comment) => {
  ElMessageBox.confirm(
    "确定要删除这条评论吗？此操作不可恢复。",
    "警告",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    await commentStore.deleteCommentAction(row.id);
    loadStats();
  }).catch(() => {});
};

const handleReply = async () => {
  if (!replyFormRef.value) return;
  
  await replyFormRef.value.validate(async (valid) => {
    if (valid && currentComment.value) {
      await commentStore.replyCommentAction(currentComment.value.id, replyForm.content);
      replyForm.content = "";
      detailDialogVisible.value = false;
    }
  });
};

// 批量操作
const handleBatchApprove = async () => {
  if (selectedComments.value.length === 0) return;
  
  const ids = selectedComments.value.map(item => item.id);
  await commentStore.batchActionCommentsAction(ids, "approve");
  loadData();
  loadStats();
};

const handleBatchReject = async () => {
  if (selectedComments.value.length === 0) return;
  
  const ids = selectedComments.value.map(item => item.id);
  await commentStore.batchActionCommentsAction(ids, "reject");
  loadData();
  loadStats();
};

const handleBatchSpam = async () => {
  if (selectedComments.value.length === 0) return;
  
  const ids = selectedComments.value.map(item => item.id);
  await commentStore.batchActionCommentsAction(ids, "spam");
  loadData();
  loadStats();
};

const handleBatchDelete = async () => {
  if (selectedComments.value.length === 0) return;
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedComments.value.length} 条评论吗？此操作不可恢复。`,
    "警告",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    const ids = selectedComments.value.map(item => item.id);
    await commentStore.batchActionCommentsAction(ids, "delete");
    loadData();
    loadStats();
  }).catch(() => {});
};

// 初始化
onMounted(async () => {
  loadData();
  loadStats();
  
  // 加载文章列表用于筛选
  try {
    const res = await articleStore.fetchArticles({ limit: 100 });
    if (res?.data?.list) {
      articles.value = res.data.list;
    }
  } catch (error) {
    console.error("加载文章列表失败:", error);
  }
});
</script>

<style scoped>
.main-container {
  padding: 16px;
}

.filter-container, .stats-container, .table-container {
  margin-bottom: 16px;
}

.stats-container {
  background-color: #f8f9fa;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stats-title {
  font-size: 16px;
  font-weight: 600;
}

.stats-body {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.stats-item {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.stats-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.table-header {
  margin-bottom: 16px;
}

.comment-content {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 40px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 评论详情样式 */
.comment-detail {
  min-height: 200px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.user-meta {
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.user-email {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.comment-meta {
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.comment-date {
  margin-bottom: 4px;
}

.detail-body {
  margin-bottom: 24px;
}

.article-info {
  display: flex;
  margin-bottom: 12px;
}

.article-label {
  font-weight: 600;
  margin-right: 8px;
}

.article-title {
  color: #409eff;
}

.detail-footer {
  margin-top: 24px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style> 
<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElDivider } from "element-plus";
import {
  Edit,
  Delete,
  Back,
  ChatDotRound,
  Check,
  Close,
  Warning
} from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import ConfirmDialog from "@/components/Cms/Comment/ConfirmDialog.vue";
import CommentForm from "@/components/Cms/Comment/CommentForm.vue";
import type { Comment, CommentUpdateParams } from "@/types/cms";
import logger from "@/utils/logger";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const cmsStore = useCmsStoreHook();

// 评论ID
const commentId = computed(() => Number(route.params.id));

// 详情加载状态
const loading = computed(() => cmsStore.loading.commentDetail);

// 当前评论
const currentComment = computed(() => cmsStore.currentComment);

// 回复列表
const replies = ref<Comment[]>([]);
const repliesLoading = ref(false);

// 编辑对话框状态
const editDialog = reactive({
  visible: false,
  loading: false
});

// 回复对话框状态
const replyDialog = reactive({
  visible: false,
  loading: false
});

// 确认对话框状态
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null
});

// 获取评论详情
const fetchCommentDetail = async () => {
  if (!commentId.value) {
    ElMessage.error(t("cms.comment.invalidId"));
    router.push("/cms/comment");
    return;
  }

  try {
    await cmsStore.fetchCommentDetail(commentId.value);
    if (!currentComment.value) {
      ElMessage.error(t("cms.comment.notFound"));
      router.push("/cms/comment");
    } else {
      // 获取回复列表
      fetchReplies();
    }
  } catch (error) {
    logger.error("获取评论详情失败", error);
    ElMessage.error(t("cms.comment.fetchDetailFailed"));
    router.push("/cms/comment");
  }
};

// 获取回复列表
const fetchReplies = async () => {
  if (!commentId.value) return;

  repliesLoading.value = true;
  try {
    const response = await cmsStore.fetchCommentReplies(commentId.value);
    if (response.success && response.data) {
      replies.value = Array.isArray(response.data) ? response.data : [];
    }
  } catch (error) {
    logger.error("获取回复列表失败", error);
  } finally {
    repliesLoading.value = false;
  }
};

// 返回列表页
const goBack = () => {
  router.push("/cms/comment");
};

// 编辑评论
const handleEdit = () => {
  editDialog.visible = true;
};

// 提交编辑
const handleEditSubmit = async (formData: CommentUpdateParams) => {
  if (!currentComment.value) return;

  editDialog.loading = true;
  try {
    await cmsStore.updateComment(currentComment.value.id, formData);
    editDialog.visible = false;
    await fetchCommentDetail(); // 刷新详情
  } catch (error) {
    logger.error("更新评论失败", error);
  } finally {
    editDialog.loading = false;
  }
};

// 回复评论
const handleReply = () => {
  replyDialog.visible = true;
};

// 提交回复
const handleReplySubmit = async formData => {
  replyDialog.loading = true;
  try {
    await cmsStore.createComment(formData);
    replyDialog.visible = false;
    fetchReplies(); // 刷新回复列表
  } catch (error) {
    logger.error("回复评论失败", error);
  } finally {
    replyDialog.loading = false;
  }
};

// 批准评论
const handleApprove = () => {
  if (!currentComment.value) return;

  confirmDialog.title = t("cms.comment.confirmApprove");
  confirmDialog.content = t("cms.comment.confirmApproveMessage");
  confirmDialog.type = "info";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.approveComment(currentComment.value!.id);
      await fetchCommentDetail(); // 刷新详情
    } catch (error) {
      logger.error("批准评论失败", error);
    }
  };
  confirmDialog.visible = true;
};

// 拒绝评论
const handleReject = () => {
  if (!currentComment.value) return;

  confirmDialog.title = t("cms.comment.confirmReject");
  confirmDialog.content = t("cms.comment.confirmRejectMessage");
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.rejectComment(currentComment.value!.id);
      await fetchCommentDetail(); // 刷新详情
    } catch (error) {
      logger.error("拒绝评论失败", error);
    }
  };
  confirmDialog.visible = true;
};

// 标记为垃圾评论
const handleMarkAsSpam = () => {
  if (!currentComment.value) return;

  confirmDialog.title = t("cms.comment.confirmMarkAsSpam");
  confirmDialog.content = t("cms.comment.confirmMarkAsSpamMessage");
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.markCommentAsSpam(currentComment.value!.id);
      await fetchCommentDetail(); // 刷新详情
    } catch (error) {
      logger.error("标记为垃圾评论失败", error);
    }
  };
  confirmDialog.visible = true;
};

// 删除评论
const handleDelete = () => {
  if (!currentComment.value) return;

  confirmDialog.title = t("cms.comment.confirmDelete");
  confirmDialog.content = t("cms.comment.confirmDeleteMessage");
  confirmDialog.type = "error";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.deleteComment(currentComment.value!.id);
      ElMessage.success(t("cms.comment.deleteSuccess"));
      router.push("/cms/comment");
    } catch (error) {
      logger.error("删除评论失败", error);
      ElMessage.error(t("cms.comment.deleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

// 格式化评论状态
const formatStatus = (status: string) => {
  const statusMap = {
    pending: { label: t("cms.comment.statusPending"), type: "warning" },
    approved: { label: t("cms.comment.statusApproved"), type: "success" },
    spam: { label: t("cms.comment.statusSpam"), type: "danger" },
    trash: { label: t("cms.comment.statusTrash"), type: "info" }
  };

  return statusMap[status] || { label: status, type: "default" };
};

// 页面加载时获取数据
onMounted(() => {
  fetchCommentDetail();
});
</script>

<template>
  <div class="comment-detail-container" v-loading="loading">
    <!-- 页头 -->
    <div class="comment-detail-header">
      <div class="header-left">
        <el-button :icon="Back" @click="goBack">{{
          t("common.back")
        }}</el-button>
        <h2 class="header-title">{{ t("cms.comment.commentDetail") }}</h2>
      </div>

      <div class="header-actions" v-if="currentComment">
        <el-button
          v-if="currentComment.status !== 'approved'"
          type="success"
          :icon="Check"
          @click="handleApprove"
        >
          {{ t("cms.comment.approve") }}
        </el-button>
        <el-button
          v-if="currentComment.status !== 'trash'"
          type="info"
          :icon="Close"
          @click="handleReject"
        >
          {{ t("cms.comment.reject") }}
        </el-button>
        <el-button
          v-if="currentComment.status !== 'spam'"
          type="warning"
          :icon="Warning"
          @click="handleMarkAsSpam"
        >
          {{ t("cms.comment.markAsSpam") }}
        </el-button>
        <el-button type="primary" :icon="Edit" @click="handleEdit">
          {{ t("common.edit") }}
        </el-button>
        <el-button type="primary" :icon="ChatDotRound" @click="handleReply">
          {{ t("cms.comment.reply") }}
        </el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete">
          {{ t("common.delete") }}
        </el-button>
      </div>
    </div>

    <!-- 评论详情 -->
    <el-card v-if="currentComment" class="comment-card">
      <div class="comment-meta">
        <div class="meta-item">
          <span class="meta-label">{{ t("cms.comment.id") }}:</span>
          <span>{{ currentComment.id }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t("cms.comment.article") }}:</span>
          <el-link
            type="primary"
            :href="`/cms/article/detail/${currentComment.article}`"
            target="_blank"
          >
            ID: {{ currentComment.article }}
          </el-link>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t("cms.comment.status") }}:</span>
          <el-tag :type="formatStatus(currentComment.status).type">
            {{ formatStatus(currentComment.status).label }}
          </el-tag>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t("cms.comment.createTime") }}:</span>
          <span>{{ formatDate(currentComment.created_at) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">{{ t("cms.comment.updateTime") }}:</span>
          <span>{{ formatDate(currentComment.updated_at) }}</span>
        </div>
        <div class="meta-item" v-if="currentComment.is_pinned">
          <span class="meta-label">{{ t("cms.comment.pinned") }}:</span>
          <el-tag type="success">{{ t("common.yes") }}</el-tag>
        </div>
      </div>

      <el-divider />

      <div class="comment-author">
        <div v-if="currentComment.user_info" class="author-info">
          <div class="avatar">
            <el-avatar
              v-if="currentComment.user_info.avatar"
              :src="currentComment.user_info.avatar"
              :size="40"
            />
            <el-avatar v-else :size="40">
              {{ currentComment.user_info.username.charAt(0).toUpperCase() }}
            </el-avatar>
          </div>
          <div class="author-details">
            <div class="author-name">
              {{ currentComment.user_info.username }}
            </div>
            <div class="author-email" v-if="currentComment.user_info.email">
              {{ currentComment.user_info.email }}
            </div>
          </div>
        </div>
        <div v-else-if="currentComment.guest_name" class="author-info">
          <div class="avatar">
            <el-avatar :size="40">
              {{ currentComment.guest_name.charAt(0).toUpperCase() }}
            </el-avatar>
          </div>
          <div class="author-details">
            <div class="author-name">
              {{ currentComment.guest_name }}
              <span class="guest-tag">{{ t("cms.comment.guest") }}</span>
            </div>
            <div class="author-email" v-if="currentComment.guest_email">
              {{ currentComment.guest_email }}
            </div>
            <div class="author-website" v-if="currentComment.guest_website">
              <el-link :href="currentComment.guest_website" target="_blank">
                {{ currentComment.guest_website }}
              </el-link>
            </div>
          </div>
        </div>
        <div v-else class="author-info">
          <div class="avatar">
            <el-avatar :size="40">?</el-avatar>
          </div>
          <div class="author-details">
            <div class="author-name">
              {{ t("cms.comment.anonymous") }}
            </div>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="comment-content">
        {{ currentComment.content }}
      </div>

      <div
        v-if="currentComment.ip_address || currentComment.user_agent"
        class="comment-tech-info"
      >
        <div v-if="currentComment.ip_address" class="tech-item">
          <span class="tech-label">{{ t("cms.comment.ipAddress") }}:</span>
          <span>{{ currentComment.ip_address }}</span>
        </div>
        <div v-if="currentComment.user_agent" class="tech-item">
          <span class="tech-label">{{ t("cms.comment.userAgent") }}:</span>
          <span>{{ currentComment.user_agent }}</span>
        </div>
      </div>
    </el-card>

    <!-- 评论回复 -->
    <div class="comment-replies-section">
      <div class="replies-header">
        <h3>{{ t("cms.comment.replies") }} ({{ replies.length }})</h3>
        <el-button type="primary" :icon="ChatDotRound" @click="handleReply">
          {{ t("cms.comment.addReply") }}
        </el-button>
      </div>

      <el-card class="replies-card" v-loading="repliesLoading">
        <div v-if="replies.length > 0" class="replies-list">
          <div v-for="reply in replies" :key="reply.id" class="reply-item">
            <div class="reply-author">
              <div v-if="reply.user_info" class="author-info">
                <el-avatar
                  v-if="reply.user_info.avatar"
                  :src="reply.user_info.avatar"
                  :size="32"
                />
                <el-avatar v-else :size="32">
                  {{ reply.user_info.username.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="author-name">{{ reply.user_info.username }}</span>
              </div>
              <div v-else-if="reply.guest_name" class="author-info">
                <el-avatar :size="32">
                  {{ reply.guest_name.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="author-name">
                  {{ reply.guest_name }}
                  <span class="guest-tag">{{ t("cms.comment.guest") }}</span>
                </span>
              </div>
              <div v-else class="author-info">
                <el-avatar :size="32">?</el-avatar>
                <span class="author-name">{{
                  t("cms.comment.anonymous")
                }}</span>
              </div>

              <div class="reply-time">
                {{ formatDate(reply.created_at) }}
              </div>

              <el-tag :type="formatStatus(reply.status).type" size="small">
                {{ formatStatus(reply.status).label }}
              </el-tag>
            </div>

            <div class="reply-content">
              {{ reply.content }}
            </div>

            <div class="reply-actions">
              <el-button
                size="small"
                type="primary"
                :icon="Edit"
                text
                @click="router.push(`/cms/comment/detail/${reply.id}`)"
              >
                {{ t("common.view") }}
              </el-button>
            </div>
          </div>
        </div>

        <div v-else class="no-replies">
          {{ t("cms.comment.noReplies") }}
        </div>
      </el-card>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      :title="t('cms.comment.editComment')"
      width="50%"
      destroy-on-close
    >
      <CommentForm
        v-if="currentComment"
        mode="edit"
        :comment="currentComment"
        :loading="editDialog.loading"
        @submit="handleEditSubmit"
        @cancel="editDialog.visible = false"
      />
    </el-dialog>

    <!-- 回复对话框 -->
    <el-dialog
      v-model="replyDialog.visible"
      :title="t('cms.comment.replyComment')"
      width="50%"
      destroy-on-close
    >
      <CommentForm
        v-if="currentComment"
        mode="reply"
        :article-id="currentComment.article"
        :parent-id="currentComment.id"
        :loading="replyDialog.loading"
        @submit="handleReplySubmit"
        @cancel="replyDialog.visible = false"
      />
    </el-dialog>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      @confirm="confirmDialog.confirmAction && confirmDialog.confirmAction()"
    />
  </div>
</template>

<style scoped>
.comment-detail-container {
  padding: 20px;
}

.comment-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.comment-card {
  margin-bottom: 30px;
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-weight: 500;
  color: #606266;
}

.comment-author {
  margin-bottom: 20px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.author-name {
  font-weight: 500;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.guest-tag {
  font-size: 12px;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  color: #909399;
}

.author-email,
.author-website {
  font-size: 14px;
  color: #606266;
}

.comment-content {
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 20px;
}

.comment-tech-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  font-size: 14px;
}

.tech-item {
  margin-bottom: 5px;
}

.tech-label {
  font-weight: 500;
  margin-right: 10px;
  color: #606266;
}

.comment-replies-section {
  margin-top: 30px;
}

.replies-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.replies-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.replies-card {
  min-height: 100px;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reply-item {
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.reply-author {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reply-time {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
  margin-right: 10px;
}

.reply-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 10px;
  padding: 0 10px;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
}

.no-replies {
  text-align: center;
  padding: 30px;
  color: #909399;
  font-size: 14px;
}
</style>

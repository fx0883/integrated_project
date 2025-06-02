import { defineStore } from "pinia";
import { ref } from "vue";
import { Comment, CommentStats, CommentQuery, CommentStatus } from "@/../types/cms/comment";
import { 
  getCommentList, 
  getCommentDetail, 
  reviewComment, 
  replyComment, 
  deleteComment, 
  batchActionComments, 
  getCommentStats 
} from "@/api/cms/comment";
import { message } from "@/utils/message";

export const useCommentStore = defineStore("cms-comment", () => {
  // 状态
  const comments = ref<Comment[]>([]);
  const total = ref<number>(0);
  const loading = ref<boolean>(false);
  const commentStats = ref<CommentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0,
    today: 0,
    trend: []
  });

  // 获取评论列表
  const fetchComments = async (params: CommentQuery) => {
    loading.value = true;
    try {
      const res = await getCommentList(params);
      if (res.data.success) {
        comments.value = res.data.data.list;
        total.value = res.data.data.total;
      }
      return res.data;
    } catch (error) {
      console.error("获取评论列表失败:", error);
      message("获取评论列表失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 获取评论详情
  const fetchCommentDetail = async (id: number) => {
    try {
      const res = await getCommentDetail(id);
      if (res.data.success) {
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error("获取评论详情失败:", error);
      message("获取评论详情失败", { type: "error" });
      return null;
    }
  };

  // 审核评论
  const reviewCommentAction = async (id: number, status: CommentStatus) => {
    try {
      const res = await reviewComment(id, status);
      
      if (res.data.success) {
        // 更新列表中的评论状态
        const index = comments.value.findIndex(item => item.id === id);
        if (index !== -1) {
          comments.value[index].status = status;
        }
        
        message("评论状态已更新", { type: "success" });
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error("更新评论状态失败:", error);
      message("更新评论状态失败", { type: "error" });
      return null;
    }
  };

  // 回复评论
  const replyCommentAction = async (commentId: number, content: string) => {
    try {
      const res = await replyComment(commentId, content);
      if (res.data.success) {
        message("回复已发送", { type: "success" });
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error("回复评论失败:", error);
      message("回复评论失败", { type: "error" });
      return null;
    }
  };

  // 删除评论
  const deleteCommentAction = async (id: number) => {
    try {
      const res = await deleteComment(id);
      
      if (res.data.success) {
        // 从列表中移除该评论
        comments.value = comments.value.filter(item => item.id !== id);
        total.value -= 1;
        
        message("评论已删除", { type: "success" });
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error("删除评论失败:", error);
      message("删除评论失败", { type: "error" });
      return null;
    }
  };

  // 批量操作评论
  const batchActionCommentsAction = async (ids: number[], action: "approve" | "reject" | "spam" | "delete") => {
    try {
      const res = await batchActionComments(ids, action);
      
      if (res.data.success) {
        const affected = res.data.data.affected;
        
        if (action === "delete") {
          // 从列表中删除这些评论
          comments.value = comments.value.filter(item => !ids.includes(item.id));
          total.value -= affected;
        } else {
          // 更新评论状态
          const statusMap = {
            "approve": "approved" as CommentStatus,
            "reject": "rejected" as CommentStatus,
            "spam": "spam" as CommentStatus
          };
          
          comments.value.forEach(item => {
            if (ids.includes(item.id)) {
              item.status = statusMap[action];
            }
          });
        }
        
        message(`已成功处理 ${affected} 条评论`, { type: "success" });
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error("批量操作评论失败:", error);
      message("批量操作评论失败", { type: "error" });
      return null;
    }
  };

  // 获取评论统计数据
  const fetchCommentStats = async () => {
    try {
      const res = await getCommentStats();
      if (res.data.success) {
        commentStats.value = res.data.data;
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error("获取评论统计数据失败:", error);
      message("获取评论统计数据失败", { type: "error" });
      return null;
    }
  };

  return {
    comments,
    total,
    loading,
    commentStats,
    fetchComments,
    fetchCommentDetail,
    reviewCommentAction,
    replyCommentAction,
    deleteCommentAction,
    batchActionCommentsAction,
    fetchCommentStats
  };
});

export function useCommentStoreHook() {
  return useCommentStore();
} 
import { http } from "@/utils/http";
import {
  CommentListResult,
  CommentDetailResult,
  CommentActionResult,
  CommentBatchResult,
  CommentStatsResult,
  CommentQuery,
  CommentStatus
} from "@/../types/cms/comment";

/**
 * 评论管理相关API接口
 */

/** 
 * 获取评论列表
 * @param params 查询参数
 */
export const getCommentList = (params?: CommentQuery) => {
  return http.request<CommentListResult>("get", "/api/cms/comments", { params });
};

/** 
 * 获取评论详情
 * @param id 评论ID
 */
export const getCommentDetail = (id: number) => {
  return http.request<CommentDetailResult>("get", `/api/cms/comments/${id}`);
};

/** 
 * 审核评论
 * @param id 评论ID
 * @param status 审核状态: approved - 批准, rejected - 拒绝, spam - 标记为垃圾评论
 */
export const reviewComment = (id: number, status: CommentStatus) => {
  return http.request<CommentActionResult>("put", `/api/cms/comments/${id}/status`, { 
    data: { status } 
  });
};

/** 
 * 回复评论
 * @param commentId 评论ID
 * @param content 回复内容
 */
export const replyComment = (commentId: number, content: string) => {
  return http.request<CommentActionResult>("post", `/api/cms/comments/${commentId}/reply`, { 
    data: { content } 
  });
};

/** 
 * 删除评论
 * @param id 评论ID
 */
export const deleteComment = (id: number) => {
  return http.request<CommentActionResult>("delete", `/api/cms/comments/${id}`);
};

/** 
 * 批量操作评论
 * @param ids 评论ID数组
 * @param action 操作类型: approve - 批准, reject - 拒绝, spam - 标记垃圾评论, delete - 删除
 */
export const batchActionComments = (ids: number[], action: "approve" | "reject" | "spam" | "delete") => {
  return http.request<CommentBatchResult>("post", "/api/cms/comments/batch", { 
    data: { ids, action } 
  });
};

/** 
 * 获取评论统计数据
 */
export const getCommentStats = () => {
  return http.request<CommentStatsResult>("get", "/api/cms/comments/stats");
}; 
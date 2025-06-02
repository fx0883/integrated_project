/**
 * 评论相关类型定义
 */

/**
 * 评论状态枚举
 */
export type CommentStatus = "pending" | "approved" | "rejected" | "spam";

/**
 * 评论对象
 */
export interface Comment {
  id: number;
  article_id: number;
  article_title: string;
  parent_id: number | null;
  user_id: number;
  user_name: string;
  user_email: string;
  user_avatar: string;
  content: string;
  status: CommentStatus;
  ip_address: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

/**
 * 评论查询参数
 */
export interface CommentQuery {
  page: number;
  limit: number;
  keyword?: string;
  article_id?: number;
  status?: CommentStatus;
  start_date?: string;
  end_date?: string;
}

/**
 * 评论列表响应
 */
export interface CommentListResult {
  success: boolean;
  data: {
    list: Comment[];
    total: number;
  };
}

/**
 * 评论详情响应
 */
export interface CommentDetailResult {
  success: boolean;
  data: Comment;
}

/**
 * 评论操作响应
 */
export interface CommentActionResult {
  success: boolean;
  data: {
    id: number;
    status?: CommentStatus;
  };
}

/**
 * 批量操作响应
 */
export interface CommentBatchResult {
  success: boolean;
  data: {
    affected: number;
  };
}

/**
 * 评论统计数据
 */
export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
  today: number;
  trend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * 评论统计响应
 */
export interface CommentStatsResult {
  success: boolean;
  data: CommentStats;
}

/**
 * 评论状态
 */
export interface CommentState {
  comments: Comment[];
  total: number;
  loading: boolean;
  commentStats: CommentStats;
} 
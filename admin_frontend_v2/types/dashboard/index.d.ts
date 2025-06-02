import { ApiResult } from "../user";

/**
 * 系统概览数据
 */
export interface SystemOverview {
  total_users: number;
  active_users: number;
  total_tenants: number;
  active_tenants: number;
  total_articles: number;
  total_comments: number;
  total_check_ins: number;
  check_in_completion_rate: number;
  server_status: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    uptime: number;
  };
}

/**
 * 租户统计数据
 */
export interface TenantStatistics {
  tenant_id: number;
  tenant_name: string;
  user_count: number;
  active_users: number;
  article_count: number;
  comment_count: number;
  check_in_count: number;
  check_in_completion_rate: number;
  created_at: string;
}

/**
 * 用户活跃度数据项
 */
export interface UserActivityItem {
  date: string;
  active_users: number;
  new_users: number;
  login_count: number;
}

/**
 * 内容统计数据项
 */
export interface ContentStatisticsItem {
  date: string;
  articles: number;
  comments: number;
  views: number;
}

/**
 * 打卡完成率数据项
 */
export interface CheckInCompletionItem {
  date: string;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}

/**
 * 超级管理员仪表盘数据
 */
export interface SuperAdminDashboard {
  system_overview: SystemOverview;
  tenant_statistics: TenantStatistics[];
  user_activity: UserActivityItem[];
  content_statistics: ContentStatisticsItem[];
  check_in_completion: CheckInCompletionItem[];
}

/**
 * 租户管理员仪表盘数据
 */
export interface TenantAdminDashboard {
  tenant_overview: {
    user_count: number;
    active_users: number;
    article_count: number;
    comment_count: number;
    check_in_count: number;
    check_in_completion_rate: number;
  };
  user_activity: UserActivityItem[];
  content_statistics: ContentStatisticsItem[];
  check_in_completion: CheckInCompletionItem[];
  recent_articles: {
    id: number;
    title: string;
    created_at: string;
    view_count: number;
    comment_count: number;
  }[];
  recent_check_ins: {
    id: number;
    task_name: string;
    user_name: string;
    created_at: string;
  }[];
}

/**
 * 普通用户仪表盘数据
 */
export interface UserDashboard {
  user_overview: {
    check_in_count: number;
    article_count: number;
    comment_count: number;
    last_login: string;
  };
  recent_articles: {
    id: number;
    title: string;
    created_at: string;
    view_count: number;
    comment_count: number;
  }[];
  recent_check_ins: {
    id: number;
    task_name: string;
    created_at: string;
    status: string;
  }[];
  upcoming_tasks: {
    id: number;
    task_name: string;
    due_date: string;
  }[];
}

/**
 * 仪表盘状态
 */
export interface DashboardState {
  superAdminData: SuperAdminDashboard | null;
  tenantAdminData: TenantAdminDashboard | null;
  userData: UserDashboard | null;
  loading: boolean;
} 
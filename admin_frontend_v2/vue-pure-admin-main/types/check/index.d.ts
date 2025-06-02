// 打卡系统相关类型定义

// 打卡类型基本信息接口
export interface CheckCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  task_count: number;
}

// 打卡任务基本信息接口
export interface CheckTask {
  id: number;
  title: string;
  description?: string;
  category_id: number;
  category_name: string;
  start_date: string;
  end_date: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_count: number;
  completion_rate: number;
}

// 打卡记录基本信息接口
export interface CheckRecord {
  id: number;
  task_id: number;
  task_title: string;
  user_id: number;
  user_name: string;
  check_date: string;
  comment?: string;
  images?: string[];
  location?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// 打卡统计信息接口
export interface CheckStatistic {
  task_id: number;
  task_title: string;
  total_records: number;
  total_users: number;
  completion_rate: number;
  daily_data: Array<{date: string, count: number}>;
  user_data: Array<{user_id: number, user_name: string, completion_rate: number}>;
}

// 打卡类型状态接口
export interface CheckCategoryState {
  categories: CheckCategory[];
  total: number;
  loading: boolean;
  currentCategory: CheckCategory | null;
}

// 打卡任务状态接口
export interface CheckTaskState {
  tasks: CheckTask[];
  total: number;
  loading: boolean;
  currentTask: CheckTask | null;
}

// 打卡记录状态接口
export interface CheckRecordState {
  records: CheckRecord[];
  total: number;
  loading: boolean;
  currentRecord: CheckRecord | null;
}

// 打卡类型列表查询参数
export interface CheckCategoryListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 打卡任务列表查询参数
export interface CheckTaskListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  category_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 打卡记录列表查询参数
export interface CheckRecordListParams {
  page?: number;
  limit?: number;
  task_id?: number;
  user_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 打卡类型列表响应
export interface CheckCategoryListResult {
  success: boolean;
  data: {
    list: CheckCategory[];
    total: number;
  };
}

// 打卡任务列表响应
export interface CheckTaskListResult {
  success: boolean;
  data: {
    list: CheckTask[];
    total: number;
  };
}

// 打卡记录列表响应
export interface CheckRecordListResult {
  success: boolean;
  data: {
    list: CheckRecord[];
    total: number;
  };
}

// 打卡统计响应
export interface CheckStatisticResult {
  success: boolean;
  data: CheckStatistic;
}

// 打卡类型创建请求
export interface CheckCategoryCreateRequest {
  name: string;
  description?: string;
  icon?: string;
}

// 打卡任务创建请求
export interface CheckTaskCreateRequest {
  title: string;
  description?: string;
  category_id: number;
  start_date: string;
  end_date: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

// 打卡记录创建请求
export interface CheckRecordCreateRequest {
  task_id: number;
  check_date: string;
  comment?: string;
  images?: string[];
  location?: string;
} 
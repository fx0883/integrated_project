// CMS标签相关类型定义

// 标签基本信息接口
export interface Tag {
  id: number;
  name: string;
  description?: string;
  color?: string;
  article_count: number;
  created_at: string;
  updated_at: string;
}

// 标签列表项接口
export interface TagListItem extends Tag {
  // 列表特有字段可以在这里添加
}

// 标签状态接口
export interface TagState {
  tags: TagListItem[];
  total: number;
  loading: boolean;
  currentTag: Tag | null;
}

// 标签列表查询参数
export interface TagListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 标签列表响应
export interface TagListResult {
  success: boolean;
  data: {
    list: TagListItem[];
    total: number;
  };
}

// 标签详情响应
export interface TagDetailResult {
  success: boolean;
  data: Tag;
}

// 标签创建请求
export interface TagCreateRequest {
  name: string;
  description?: string;
  color?: string;
}

// 标签更新请求
export interface TagUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
} 
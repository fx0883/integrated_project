// CMS分类相关类型定义

// 分类基本信息接口
export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent_name?: string;
  icon?: string;
  sort_order?: number;
  article_count: number;
  created_at: string;
  updated_at: string;
}

// 分类列表项接口
export interface CategoryListItem extends Category {
  // 列表特有字段可以在这里添加
}

// 分类详情接口
export interface CategoryDetail extends Category {
  children?: Category[];
}

// 分类状态接口
export interface CategoryState {
  categories: CategoryListItem[];
  total: number;
  loading: boolean;
  currentCategory: CategoryDetail | null;
}

// 分类列表查询参数
export interface CategoryListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  parent_id?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 分类列表响应
export interface CategoryListResult {
  success: boolean;
  data: {
    list: CategoryListItem[];
    total: number;
  };
}

// 分类详情响应
export interface CategoryDetailResult {
  success: boolean;
  data: CategoryDetail;
}

// 分类创建请求
export interface CategoryCreateRequest {
  name: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  sort_order?: number;
}

// 分类更新请求
export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  sort_order?: number;
} 
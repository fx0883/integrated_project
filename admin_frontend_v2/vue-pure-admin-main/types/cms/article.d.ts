// CMS文章相关类型定义

// 文章标签接口
export interface ArticleTag {
  id: number;
  name: string;
}

// 文章基本信息接口
export interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  cover_image?: string;
  author: string;
  author_id: number;
  category_id: number;
  category_name: string;
  tags: ArticleTag[];
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  comment_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  publish_date?: string;
}

// 文章列表项接口
export interface ArticleListItem {
  id: number;
  title: string;
  summary: string;
  cover_image?: string;
  author: string;
  category_name: string;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  comment_count: number;
  created_at: string;
  is_featured?: boolean;
}

// 文章详情接口
export interface ArticleDetail extends Article {
  // 详情特有字段可以在这里添加
}

// 文章状态接口
export interface ArticleState {
  articles: ArticleListItem[];
  total: number;
  loading: boolean;
  currentArticle: ArticleDetail | null;
}

// 文章列表查询参数
export interface ArticleListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  category_id?: number;
  tag_id?: number;
  author_id?: number;
  is_featured?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// 文章列表响应
export interface ArticleListResult {
  success: boolean;
  data: {
    list: ArticleListItem[];
    total: number;
  };
}

// 文章详情响应
export interface ArticleDetailResult {
  success: boolean;
  data: ArticleDetail;
}

// 文章创建请求
export interface ArticleCreateRequest {
  title: string;
  content: string;
  summary: string;
  cover_image?: string;
  category_id: number;
  tags: number[];
  status: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  publish_date?: string;
}

// 文章更新请求
export interface ArticleUpdateRequest {
  title?: string;
  content?: string;
  summary?: string;
  cover_image?: string;
  category_id?: number;
  tags?: number[];
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  publish_date?: string;
} 
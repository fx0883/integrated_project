// 全局类型定义

// 分页参数类型
export interface PaginationParams {
  page: number;
  page_size: number;
  [key: string]: any;
}

// 分页响应类型
export interface PaginationResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// 标准API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// 带分页的API响应类型
export interface PaginatedApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: {
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      page_size: number;
      current_page: number;
      total_pages: number;
    };
    results: T[];
  };
}

// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  real_name?: string;
  avatar?: string;
  is_active: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  tenant_id?: number;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
}

// 路由元数据类型
export interface RouteMeta {
  title?: string;
  icon?: string;
  requiresAuth?: boolean;
  roles?: string[];
  hidden?: boolean;
  parentTitle?: string;
  keepAlive?: boolean;
}

// 声明Vue路由的类型增强
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    icon?: string;
    requiresAuth?: boolean;
    roles?: string[];
    hidden?: boolean;
    parentTitle?: string;
    keepAlive?: boolean;
  }
}

// 声明Vite环境变量类型
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_DESC: string;
  readonly VITE_BASE_API: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_USE_HTTPS: string;
  readonly VITE_SHOW_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 
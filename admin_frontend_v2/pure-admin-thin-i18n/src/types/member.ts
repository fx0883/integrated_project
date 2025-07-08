/**
 * 会员管理相关类型定义
 */

// 会员状态
export type MemberStatus = "active" | "inactive" | "locked" | "pending";

// 会员基本信息接口
export interface Member {
  id: number; // 会员ID
  username: string; // 用户名
  nick_name: string; // 昵称
  email: string; // 邮箱
  phone?: string; // 手机号
  avatar?: string; // 头像URL
  status: MemberStatus; // 状态
  tenant_id?: number; // 所属租户ID
  tenant_name?: string; // 所属租户名称（可选，仅在详情中返回）
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  last_login?: string; // 最后登录时间
  notes?: string; // 备注
  customer_count?: number; // 关联客户数量（可选，仅在详情中返回）
  first_name?: string; // 名
  last_name?: string; // 姓
}

// 会员列表请求参数接口
export interface MemberListParams {
  search?: string; // 搜索关键词
  status?: MemberStatus; // 状态过滤
  tenant_id?: number; // 租户ID过滤
  page?: number; // 页码
  page_size?: number; // 每页条数
  sort_by?: string; // 排序字段
  sort_order?: "asc" | "desc"; // 排序方向
}

// 创建/更新会员请求参数接口
export interface MemberCreateUpdateParams {
  username: string; // 用户名
  nick_name: string; // 昵称
  first_name?: string; // 名
  last_name?: string; // 姓
  email: string; // 邮箱
  phone?: string; // 手机号
  password?: string; // 密码（仅创建时需要）
  password_confirm?: string; // 确认密码（仅创建时需要）
  status?: MemberStatus; // 状态
  tenant_id?: number; // 所属租户ID
  notes?: string; // 备注
  avatarFile?: File; // 头像文件（仅在前端使用）
}

// 会员-客户关系接口
export interface MemberCustomerRelation {
  id: number; // 关系ID
  member: {
    // 所属会员
    id: number;
    name: string;
    username: string;
  };
  customer: {
    // 客户信息
    id: number;
    name: string;
    type: string;
  };
  role: string; // 会员角色
  is_primary: boolean; // 是否主要客户
  remarks?: string; // 备注
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 会员-客户关系请求参数接口
export interface MemberCustomerRelationCreateUpdateParams {
  member_id: number; // 会员ID
  customer_id: number; // 客户ID
  role: string; // 会员角色
  is_primary?: boolean; // 是否主要客户
  remarks?: string; // 备注
}

// 会员密码重置请求参数接口
export interface MemberPasswordResetParams {
  new_password: string; // 新密码
}

// 会员头像上传响应接口
export interface MemberAvatarUploadResponse {
  avatar_url?: string; // 头像URL（旧版API可能返回此字段）
  avatar?: string; // 头像URL（新版API返回此字段）
}

// 批量操作请求参数接口
export interface MemberBulkOperationParams {
  member_ids: number[]; // 会员ID数组
  operation_type: "update" | "delete"; // 操作类型
  data?: Partial<MemberCreateUpdateParams>; // 更新数据（仅在update操作时需要）
}

// 批量操作响应接口
export interface MemberBulkOperationResponse {
  success_count: number; // 成功处理的记录数
  failed_count: number; // 失败的记录数
  failed_ids?: number[]; // 失败的会员ID数组
  error_messages?: Record<string, string>; // 错误信息，键为会员ID
}

// 会员搜索结果接口
export interface MemberSearchResult {
  id: number; // 会员ID
  username: string; // 用户名
  name: string; // 姓名
  email: string; // 邮箱
  status: MemberStatus; // 状态
  tenant_name?: string; // 所属租户名称
  highlight?: {
    // 高亮信息
    name?: string[]; // 高亮的姓名片段
    username?: string[]; // 高亮的用户名片段
    email?: string[]; // 高亮的邮箱片段
  };
} 
import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Member,
  MemberListParams,
  MemberCreateUpdateParams,
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams,
  MemberPasswordResetParams,
  MemberBulkOperationParams,
  MemberBulkOperationResponse,
  MemberAvatarUploadResponse,
  MemberSearchResult
} from "@/types/member";
import logger from "@/utils/logger";

/**
 * 会员基础操作API
 */

/**
 * 获取会员列表
 */
export function getMemberList(params: MemberListParams = {}) {
  logger.debug("API请求: 获取会员列表", params);
  
  return http.request<PaginationResponse<Member>>(
    "get",
    "/members/",
    { params }
  );
}

/**
 * 获取会员详情
 */
export function getMemberDetail(id: number) {
  logger.debug("API请求: 获取会员详情", { id });
  
  return http.request<ApiResponse<Member>>(
    "get",
    `/members/${id}/`
  );
}

/**
 * 创建会员
 */
export function createMember(data: MemberCreateUpdateParams) {
  logger.debug("API请求: 创建会员", data);
  
  return http.request<ApiResponse<Member>>(
    "post",
    "/members/",
    { data }
  );
}

/**
 * 更新会员
 */
export function updateMember(id: number, data: MemberCreateUpdateParams) {
  logger.debug("API请求: 更新会员", { id, data });
  
  return http.request<ApiResponse<Member>>(
    "put",
    `/members/${id}/`,
    { data }
  );
}

/**
 * 删除会员
 */
export function deleteMember(id: number) {
  logger.debug("API请求: 删除会员", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/members/${id}/`
  );
}

/**
 * 搜索会员
 */
export function searchMembers(query: string, params: MemberListParams = {}) {
  logger.debug("API请求: 搜索会员", { query, params });
  
  return http.request<PaginationResponse<MemberSearchResult>>(
    "get",
    `/members/?search=${encodeURIComponent(query)}`,
    { params }
  );
}

/**
 * 会员批量操作API
 */

/**
 * 批量更新会员
 */
export function bulkUpdateMembers(data: MemberBulkOperationParams) {
  logger.debug("API请求: 批量更新会员", { count: data.member_ids.length });
  
  return http.request<ApiResponse<MemberBulkOperationResponse>>(
    "put",
    "/members/bulk/update/",
    { data }
  );
}

/**
 * 批量删除会员
 */
export function bulkDeleteMembers(memberIds: number[]) {
  logger.debug("API请求: 批量删除会员", { count: memberIds.length });
  
  return http.request<ApiResponse<MemberBulkOperationResponse>>(
    "delete",
    "/members/bulk/delete/",
    { data: { member_ids: memberIds } }
  );
}

/**
 * 会员-客户关系API
 */

/**
 * 获取会员的客户关系列表
 */
export function getMemberCustomerRelations(memberId: number, params: { page?: number; page_size?: number } = {}) {
  logger.debug("API请求: 获取会员的客户关系", { memberId, params });
  
  return http.request<ApiResponse<any[]>>(
    "get",
    `/customers/members/relations/member-customers/?member_id=${memberId}`,
    { params }
  );
}

/**
 * 创建会员-客户关系
 */
export function createMemberCustomerRelation(data: MemberCustomerRelationCreateUpdateParams) {
  logger.debug("API请求: 创建会员-客户关系", data);
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "post",
    `/customers/members/relations/`,
    { data }
  );
}

/**
 * 获取会员-客户关系详情
 */
export function getMemberCustomerRelationDetail(memberId: number, relationId: number) {
  logger.debug("API请求: 获取会员-客户关系详情", { memberId, relationId });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "get",
    `/members/${memberId}/customers/${relationId}/`
  );
}

/**
 * 更新会员-客户关系
 */
export function updateMemberCustomerRelation(memberId: number, relationId: number, data: Omit<MemberCustomerRelationCreateUpdateParams, 'member_id'>) {
  logger.debug("API请求: 更新会员-客户关系", { memberId, relationId, data });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "put",
    `/customers/members/relations/${relationId}/`,
    { data }
  );
}

/**
 * 删除会员-客户关系
 */
export function deleteMemberCustomerRelation(memberId: number, relationId: number) {
  logger.debug("API请求: 删除会员-客户关系", { memberId, relationId });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/members/${memberId}/customers/${relationId}/`
  );
}

/**
 * 设置主要客户
 */
export function setPrimaryCustomerRelation(memberId: number, relationId: number) {
  logger.debug("API请求: 设置主要客户", { memberId, relationId });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "post",
    `/members/${memberId}/customers/${relationId}/set-primary/`
  );
}

/**
 * 获取主要客户
 */
export function getPrimaryCustomerRelation(memberId: number) {
  logger.debug("API请求: 获取主要客户", { memberId });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "get",
    `/members/${memberId}/customers/primary/`
  );
}

/**
 * 会员密码管理API
 */

/**
 * 重置会员密码
 */
export function resetMemberPassword(memberId: number, data: MemberPasswordResetParams) {
  logger.debug("API请求: 重置会员密码", { memberId });
  
  return http.request<ApiResponse<any>>(
    "post",
    `/members/${memberId}/reset-password/`,
    { data }
  );
}

/**
 * 会员头像管理API
 */

/**
 * 上传会员头像
 */
export function uploadMemberAvatar(memberId: number, formData: FormData) {
  logger.debug("API请求: 上传会员头像", { memberId });
  
  return http.request<ApiResponse<MemberAvatarUploadResponse>>(
    "post",
    `/members/${memberId}/avatar/upload/`,
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 删除会员-客户关系 (新API)
 */
export function deleteMemberCustomerRelations(memberId: number, customerIds: number[]) {
  logger.debug("API请求: 删除会员-客户关系", { memberId, customerIds });
  
  return http.request<ApiResponse<any>>(
    "post",
    `/customers/members/relations/member-customers/delete/`,
    { 
      data: { 
        member_id: memberId, 
        customer_ids: customerIds 
      } 
    }
  );
} 
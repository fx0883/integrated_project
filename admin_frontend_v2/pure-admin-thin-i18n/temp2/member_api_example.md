/**
 * 会员管理相关API
 * 
 * 本模块提供与会员管理相关的API调用函数，包括会员基本操作、子账号管理、
 * 会员-客户关系管理和头像管理等功能。
 */

import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Member,
  MemberListParams,
  MemberCreateUpdateParams,
  SubAccount,
  SubAccountCreateUpdateParams,
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams
} from "@/types/member";
import logger from "@/utils/logger";

/**
 * 会员基本操作API
 */

/**
 * 获取会员列表
 * @param params 查询参数
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
 * @param id 会员ID
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
 * @param data 会员创建参数
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
 * @param id 会员ID
 * @param data 会员更新参数
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
 * @param id 会员ID
 */
export function deleteMember(id: number) {
  logger.debug("API请求: 删除会员", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/members/${id}/`
  );
}

/**
 * 获取当前登录会员信息
 */
export function getCurrentMember() {
  logger.debug("API请求: 获取当前登录会员信息");
  
  return http.request<ApiResponse<Member>>(
    "get",
    "/members/me/"
  );
}

/**
 * 子账号管理API
 */

/**
 * 获取子账号列表
 * @param params 查询参数
 */
export function getSubAccountList(params: MemberListParams = {}) {
  logger.debug("API请求: 获取子账号列表", params);
  
  return http.request<PaginationResponse<SubAccount>>(
    "get",
    "/members/sub-accounts/",
    { params }
  );
}

/**
 * 获取子账号详情
 * @param id 子账号ID
 */
export function getSubAccountDetail(id: number) {
  logger.debug("API请求: 获取子账号详情", { id });
  
  return http.request<ApiResponse<SubAccount>>(
    "get",
    `/members/sub-accounts/${id}/`
  );
}

/**
 * 创建子账号
 * @param data 子账号创建参数
 */
export function createSubAccount(data: SubAccountCreateUpdateParams) {
  logger.debug("API请求: 创建子账号", data);
  
  return http.request<ApiResponse<SubAccount>>(
    "post",
    "/members/sub-accounts/",
    { data }
  );
}

/**
 * 更新子账号
 * @param id 子账号ID
 * @param data 子账号更新参数
 */
export function updateSubAccount(id: number, data: SubAccountCreateUpdateParams) {
  logger.debug("API请求: 更新子账号", { id, data });
  
  return http.request<ApiResponse<SubAccount>>(
    "put",
    `/members/sub-accounts/${id}/`,
    { data }
  );
}

/**
 * 删除子账号
 * @param id 子账号ID
 */
export function deleteSubAccount(id: number) {
  logger.debug("API请求: 删除子账号", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/members/sub-accounts/${id}/`
  );
}

/**
 * 会员-客户关系管理API
 */

/**
 * 获取会员的客户关系列表
 * @param memberId 会员ID
 * @param params 查询参数
 */
export function getMemberCustomerRelations(memberId: number, params: any = {}) {
  logger.debug("API请求: 获取会员的客户关系列表", { memberId, params });
  
  return http.request<PaginationResponse<MemberCustomerRelation>>(
    "get",
    "/customers/members/relations/",
    { params: { ...params, member_id: memberId } }
  );
}

/**
 * 创建会员-客户关系
 * @param data 关系创建参数
 */
export function createMemberCustomerRelation(data: MemberCustomerRelationCreateUpdateParams) {
  logger.debug("API请求: 创建会员-客户关系", data);
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "post",
    "/customers/members/relations/",
    { data }
  );
}

/**
 * 获取会员-客户关系详情
 * @param id 关系ID
 */
export function getMemberCustomerRelationDetail(id: number) {
  logger.debug("API请求: 获取会员-客户关系详情", { id });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "get",
    `/customers/members/relations/${id}/`
  );
}

/**
 * 更新会员-客户关系
 * @param id 关系ID
 * @param data 关系更新参数
 */
export function updateMemberCustomerRelation(id: number, data: MemberCustomerRelationCreateUpdateParams) {
  logger.debug("API请求: 更新会员-客户关系", { id, data });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "put",
    `/customers/members/relations/${id}/`,
    { data }
  );
}

/**
 * 删除会员-客户关系
 * @param id 关系ID
 */
export function deleteMemberCustomerRelation(id: number) {
  logger.debug("API请求: 删除会员-客户关系", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/customers/members/relations/${id}/`
  );
}

/**
 * 设置主要客户关系
 * @param id 关系ID
 */
export function setPrimaryCustomerRelation(id: number) {
  logger.debug("API请求: 设置主要客户关系", { id });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "post",
    `/customers/members/relations/${id}/set-primary/`
  );
}

/**
 * 获取会员的主要客户关系
 * @param memberId 会员ID
 */
export function getPrimaryCustomerRelation(memberId: number) {
  logger.debug("API请求: 获取会员的主要客户关系", { memberId });
  
  return http.request<ApiResponse<MemberCustomerRelation>>(
    "get",
    `/customers/members/relations/primary/?member_id=${memberId}`
  );
}

/**
 * 头像管理API
 */

/**
 * 上传当前会员头像
 * @param formData 包含头像文件的FormData对象
 */
export function uploadCurrentAvatar(formData: FormData) {
  logger.debug("API请求: 上传当前会员头像");
  
  return http.request<ApiResponse<{ avatar: string }>>(
    "post",
    "/members/avatar/upload/",
    { 
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 为特定会员上传头像
 * @param id 会员ID
 * @param formData 包含头像文件的FormData对象
 */
export function uploadMemberAvatar(id: number, formData: FormData) {
  logger.debug("API请求: 为特定会员上传头像", { id });
  
  return http.request<ApiResponse<{ avatar: string }>>(
    "post",
    `/members/${id}/avatar/upload/`,
    { 
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 密码管理API
 */

/**
 * 修改当前会员密码
 * @param data 包含旧密码和新密码的对象
 */
export function changePassword(data: { old_password: string; new_password: string; new_password_confirm: string }) {
  logger.debug("API请求: 修改当前会员密码");
  
  return http.request<ApiResponse<{ detail: string }>>(
    "post",
    "/members/me/password/",
    { data }
  );
}

/**
 * 管理员重置会员密码
 * @param id 会员ID
 */
export function resetMemberPassword(id: number) {
  logger.debug("API请求: 管理员重置会员密码", { id });
  
  return http.request<ApiResponse<{ detail: string }>>(
    "post",
    `/members/${id}/reset-password/`
  );
} 
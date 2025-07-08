import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Customer,
  CustomerListParams,
  CustomerCreateUpdateParams,
  CustomerMemberRelation,
  CustomerMemberRelationCreateUpdateParams,
  CustomerTenantRelation,
  CustomerTenantRelationCreateUpdateParams,
  CustomerBulkOperationParams,
  CustomerBulkOperationResponse,
  CustomerStatistics,
  CustomerSearchResult
} from "@/types/customer";
import type { Member } from "@/types/member";
import logger from "@/utils/logger";

/**
 * 客户基础操作API
 */

/**
 * 获取客户列表
 */
export function getCustomerList(params: CustomerListParams = {}) {
  logger.debug("API请求: 获取客户列表", params);

  return http.request<PaginationResponse<Customer>>("get", "/customers/", {
    params
  });
}

/**
 * 获取客户详情
 */
export function getCustomerDetail(id: number) {
  logger.debug("API请求: 获取客户详情", { id });

  return http.request<ApiResponse<Customer>>("get", `/customers/${id}/`);
}

/**
 * 创建客户
 */
export function createCustomer(data: CustomerCreateUpdateParams) {
  logger.debug("API请求: 创建客户", data);

  return http.request<ApiResponse<Customer>>("post", "/customers/", { data });
}

/**
 * 更新客户
 */
export function updateCustomer(id: number, data: CustomerCreateUpdateParams) {
  logger.debug("API请求: 更新客户", { id, data });

  return http.request<ApiResponse<Customer>>("put", `/customers/${id}/`, {
    data
  });
}

/**
 * 删除客户
 */
export function deleteCustomer(id: number) {
  logger.debug("API请求: 删除客户", { id });

  return http.request<ApiResponse<any>>("delete", `/customers/${id}/`);
}

/**
 * 搜索客户
 */
export function searchCustomers(
  query: string,
  params: CustomerListParams = {}
) {
  logger.debug("API请求: 搜索客户", { query, params });

  return http.request<PaginationResponse<CustomerSearchResult>>(
    "get",
    `/customers/search/?query=${encodeURIComponent(query)}`,
    { params }
  );
}

/**
 * 获取客户统计数据
 */
export function getCustomerStatistics() {
  logger.debug("API请求: 获取客户统计数据");

  return http.request<ApiResponse<CustomerStatistics>>(
    "get",
    "/customers/statistics/"
  );
}

/**
 * 客户批量操作API
 */

/**
 * 批量创建客户
 */
export function bulkCreateCustomers(data: CustomerCreateUpdateParams[]) {
  logger.debug("API请求: 批量创建客户", { count: data.length });

  return http.request<ApiResponse<CustomerBulkOperationResponse>>(
    "post",
    "/customers/bulk/create/",
    { data }
  );
}

/**
 * 批量更新客户
 */
export function bulkUpdateCustomers(data: CustomerBulkOperationParams) {
  logger.debug("API请求: 批量更新客户", { count: data.customer_ids.length });

  return http.request<ApiResponse<CustomerBulkOperationResponse>>(
    "put",
    "/customers/bulk/update/",
    { data }
  );
}

/**
 * 批量删除客户
 */
export function bulkDeleteCustomers(customerIds: number[]) {
  logger.debug("API请求: 批量删除客户", { count: customerIds.length });

  return http.request<ApiResponse<CustomerBulkOperationResponse>>(
    "delete",
    "/customers/bulk/delete/",
    { data: { customer_ids: customerIds } }
  );
}

/**
 * 客户-联系人关系API
 */

/**
 * 获取客户的联系人关系列表
 */
export function getCustomerMemberRelations(
  customerId: number,
  params: { page?: number; page_size?: number } = {}
) {
  logger.debug("API请求: 获取客户的联系人关系", { customerId, params });

  return http.request<ApiResponse<Member[]>>(
    "get",
    `/customers/members/relations/customer-members/?customer_id=${customerId}`,
    { params }
  );
}

/**
 * 创建客户-联系人关系
 */
export function createCustomerMemberRelation(
  data: CustomerMemberRelationCreateUpdateParams
) {
  logger.debug("API请求: 创建客户-联系人关系", data);

  return http.request<ApiResponse<CustomerMemberRelation>>(
    "post",
    `/customers/members/relations/`,
    { data }
  );
}

/**
 * 获取客户-联系人关系详情
 */
export function getCustomerMemberRelationDetail(
  customerId: number,
  relationId: number
) {
  logger.debug("API请求: 获取客户-联系人关系详情", { customerId, relationId });

  return http.request<ApiResponse<CustomerMemberRelation>>(
    "get",
    `/customers/${customerId}/members/${relationId}/`
  );
}

/**
 * 更新客户-联系人关系
 */
export function updateCustomerMemberRelation(
  customerId: number,
  relationId: number,
  data: Omit<CustomerMemberRelationCreateUpdateParams, "customer_id">
) {
  logger.debug("API请求: 更新客户-联系人关系", {
    customerId,
    relationId,
    data
  });

  return http.request<ApiResponse<CustomerMemberRelation>>(
    "put",
    `/customers/members/relations/${relationId}/`,
    { data }
  );
}

/**
 * 删除客户-联系人关系
 */
export function deleteCustomerMemberRelation(
  customerId: number,
  relationId: number
) {
  logger.debug("API请求: 删除客户-联系人关系", { customerId, relationId });

  return http.request<ApiResponse<any>>(
    "delete",
    `/customers/${customerId}/members/${relationId}/`
  );
}

/**
 * 设置主要联系人
 */
export function setPrimaryMemberRelation(
  customerId: number,
  relationId: number
) {
  logger.debug("API请求: 设置主要联系人", { customerId, relationId });

  return http.request<ApiResponse<CustomerMemberRelation>>(
    "post",
    `/customers/${customerId}/members/${relationId}/set-primary/`
  );
}

/**
 * 获取主要联系人
 */
export function getPrimaryMemberRelation(customerId: number) {
  logger.debug("API请求: 获取主要联系人", { customerId });

  return http.request<ApiResponse<CustomerMemberRelation>>(
    "get",
    `/customers/${customerId}/members/primary/`
  );
}

/**
 * 客户-租户关系API
 */

/**
 * 获取客户的租户关系列表
 */
export function getCustomerTenantRelations(
  customerId: number,
  params: { page?: number; page_size?: number } = {}
) {
  logger.debug("API请求: 获取客户的租户关系", { customerId, params });

  return http.request<PaginationResponse<CustomerTenantRelation>>(
    "get",
    `/customers/${customerId}/tenants/`,
    { params }
  );
}

/**
 * 创建客户-租户关系
 */
export function createCustomerTenantRelation(
  data: CustomerTenantRelationCreateUpdateParams
) {
  logger.debug("API请求: 创建客户-租户关系", data);

  return http.request<ApiResponse<CustomerTenantRelation>>(
    "post",
    `/customers/${data.customer_id}/tenants/`,
    { data }
  );
}

/**
 * 获取客户-租户关系详情
 */
export function getCustomerTenantRelationDetail(
  customerId: number,
  relationId: number
) {
  logger.debug("API请求: 获取客户-租户关系详情", { customerId, relationId });

  return http.request<ApiResponse<CustomerTenantRelation>>(
    "get",
    `/customers/${customerId}/tenants/${relationId}/`
  );
}

/**
 * 更新客户-租户关系
 */
export function updateCustomerTenantRelation(
  customerId: number,
  relationId: number,
  data: Omit<CustomerTenantRelationCreateUpdateParams, "customer_id">
) {
  logger.debug("API请求: 更新客户-租户关系", { customerId, relationId, data });

  return http.request<ApiResponse<CustomerTenantRelation>>(
    "put",
    `/customers/${customerId}/tenants/${relationId}/`,
    { data }
  );
}

/**
 * 删除客户-租户关系
 */
export function deleteCustomerTenantRelation(
  customerId: number,
  relationId: number
) {
  logger.debug("API请求: 删除客户-租户关系", { customerId, relationId });

  return http.request<ApiResponse<any>>(
    "delete",
    `/customers/${customerId}/tenants/${relationId}/`
  );
}

/**
 * 设置主要租户关系
 */
export function setPrimaryTenantRelation(
  customerId: number,
  relationId: number
) {
  logger.debug("API请求: 设置主要租户关系", { customerId, relationId });

  return http.request<ApiResponse<CustomerTenantRelation>>(
    "post",
    `/customers/${customerId}/tenants/${relationId}/set-primary/`
  );
}

/**
 * 获取主要租户关系
 */
export function getPrimaryTenantRelation(customerId: number) {
  logger.debug("API请求: 获取主要租户关系", { customerId });

  return http.request<ApiResponse<CustomerTenantRelation>>(
    "get",
    `/customers/${customerId}/tenants/primary/`
  );
}

/**
 * 获取客户与租户之间的关系
 */
export function getRelationBetween(customerId: number, tenantId: number) {
  logger.debug("API请求: 获取客户与租户之间的关系", { customerId, tenantId });

  return http.request<ApiResponse<CustomerTenantRelation>>(
    "get",
    `/customers/${customerId}/tenants/relation/${tenantId}/`
  );
}

/**
 * 批量删除客户-会员关系
 */
export function batchDeleteCustomerMemberRelations(relationIds: number[]) {
  logger.debug("API请求: 批量删除客户-会员关系", { count: relationIds.length });

  return http.request<
    ApiResponse<{
      success_count: number;
      failed_count: number;
      failed_ids?: number[];
    }>
  >("delete", "/customers/members/bulk/delete/", {
    data: { relation_ids: relationIds }
  });
}

/**
 * 按客户ID和会员ID数组批量删除客户-会员关系
 */
export function batchDeleteCustomerMembersByIds(
  customerId: number,
  memberIds: number[]
) {
  logger.debug("API请求: 按客户ID和会员ID批量删除会员关系", {
    customerId,
    count: memberIds.length
  });

  return http.request<
    ApiResponse<{
      success_count: number;
      failed_count: number;
      failed_ids?: number[];
    }>
  >("post", "/customers/members/relations/customer-members/delete/", {
    data: {
      customer_id: customerId,
      member_ids: memberIds
    }
  });
}

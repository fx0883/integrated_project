import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Order,
  OrderListParams,
  OrderCreateUpdateParams,
  OrderHistory,
  OrderStatistics,
  OrderReminders,
  OrderBulkOperationParams,
  OrderBulkOperationResponse,
  OrderImportResponse
} from "@/types/order";
import logger from "@/utils/logger";

/**
 * 订单基础操作API
 */

/**
 * 获取订单列表
 */
export function getOrderList(params: OrderListParams = {}) {
  logger.debug("API请求: 获取订单列表", params);

  return http.request<PaginationResponse<Order>>("get", "/orders/", {
    params
  });
}

/**
 * 获取订单详情
 */
export function getOrderDetail(id: number) {
  logger.debug("API请求: 获取订单详情", { id });

  return http.request<ApiResponse<Order>>("get", `/orders/${id}/`);
}

/**
 * 创建订单
 */
export function createOrder(data: OrderCreateUpdateParams) {
  logger.debug("API请求: 创建订单", data);

  return http.request<ApiResponse<Order>>("post", "/orders/", { data });
}

/**
 * 更新订单
 */
export function updateOrder(id: number, data: OrderCreateUpdateParams) {
  logger.debug("API请求: 更新订单", { id, data });

  return http.request<ApiResponse<Order>>("put", `/orders/${id}/`, {
    data
  });
}

/**
 * 删除订单
 */
export function deleteOrder(id: number) {
  logger.debug("API请求: 删除订单", { id });

  return http.request<ApiResponse<any>>("delete", `/orders/${id}/`);
}

/**
 * 搜索订单
 */
export function searchOrders(
  query: string,
  params: OrderListParams = {}
) {
  logger.debug("API请求: 搜索订单", { query, params });

  return http.request<PaginationResponse<Order>>(
    "get",
    `/orders/search/?query=${encodeURIComponent(query)}`,
    { params }
  );
}

/**
 * 订单批量操作API
 */

/**
 * 批量更新订单
 */
export function bulkUpdateOrders(data: OrderBulkOperationParams) {
  logger.debug("API请求: 批量更新订单", { count: data.order_ids.length });

  return http.request<ApiResponse<OrderBulkOperationResponse>>(
    "put",
    "/orders/bulk/update/",
    { data }
  );
}

/**
 * 批量删除订单
 */
export function bulkDeleteOrders(orderIds: number[]) {
  logger.debug("API请求: 批量删除订单", { count: orderIds.length });

  return http.request<ApiResponse<OrderBulkOperationResponse>>(
    "delete",
    "/orders/bulk/delete/",
    { data: { order_ids: orderIds } }
  );
}

/**
 * 订单导出API
 */
export function exportOrders(params: OrderListParams = {}) {
  logger.debug("API请求: 导出订单", params);

  return http.request<Blob>(
    "get",
    "/orders/export/",
    { 
      params,
      responseType: "blob"
    }
  );
}

/**
 * 下载订单导入模板
 */
export function downloadOrderImportTemplate() {
  logger.debug("API请求: 下载订单导入模板");

  return http.request<Blob>(
    "get",
    "/orders/import/template/",
    { responseType: "blob" }
  );
}

/**
 * 导入订单
 */
export function importOrders(file: File) {
  logger.debug("API请求: 导入订单", { fileName: file.name });

  const formData = new FormData();
  formData.append("file", file);

  return http.request<ApiResponse<OrderImportResponse>>(
    "post",
    "/orders/import/",
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 订单统计API
 */

/**
 * 获取订单统计数据
 */
export function getOrderStatistics(params: {
  period?: string;
  start_date?: string;
  end_date?: string;
} = {}) {
  logger.debug("API请求: 获取订单统计数据", params);

  return http.request<ApiResponse<OrderStatistics>>(
    "get",
    "/orders/statistics/",
    { params }
  );
}

/**
 * 获取最近的订单提醒
 */
export function getOrderReminders(params: {
  days?: number;
  limit?: number;
} = {}) {
  logger.debug("API请求: 获取订单提醒", params);

  return http.request<ApiResponse<OrderReminders>>(
    "get",
    "/orders/reminders/",
    { params }
  );
}

/**
 * 订单历史API
 */

/**
 * 获取订单历史记录列表
 */
export function getOrderHistoryList(orderId: number, params: {
  page?: number;
  page_size?: number;
} = {}) {
  logger.debug("API请求: 获取订单历史记录", { orderId, params });

  return http.request<PaginationResponse<OrderHistory>>(
    "get",
    `/orders/${orderId}/history/`,
    { params }
  );
}

/**
 * 获取订单历史记录详情
 */
export function getOrderHistoryDetail(orderId: number, historyId: number) {
  logger.debug("API请求: 获取订单历史记录详情", { orderId, historyId });

  return http.request<ApiResponse<OrderHistory>>(
    "get",
    `/orders/${orderId}/history/${historyId}/`
  );
}

/**
 * 恢复订单到某个历史版本
 */
export function restoreOrderVersion(orderId: number, historyId: number) {
  logger.debug("API请求: 恢复订单历史版本", { orderId, historyId });

  return http.request<ApiResponse<Order>>(
    "post",
    `/orders/${orderId}/history/${historyId}/restore/`,
    {}
  );
}

/**
 * 获取客户的订单列表
 */
export function getCustomerOrderList(customerId: number, params: OrderListParams = {}) {
  logger.debug("API请求: 获取客户的订单列表", { customerId, params });

  return http.request<PaginationResponse<Order>>(
    "get",
    `/customers/${customerId}/orders/`,
    { params }
  );
}

/**
 * 获取联系人的订单列表
 */
export function getMemberOrderList(memberId: number, params: OrderListParams = {}) {
  logger.debug("API请求: 获取联系人的订单列表", { memberId, params });

  return http.request<PaginationResponse<Order>>(
    "get",
    `/members/${memberId}/orders/`,
    { params }
  );
} 
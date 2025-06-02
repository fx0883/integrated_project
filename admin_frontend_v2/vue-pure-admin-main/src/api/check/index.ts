import { http } from "@/utils/http";
import type { 
  CheckCategoryListResult,
  CheckTaskListResult,
  CheckRecordListResult,
  CheckStatisticResult,
  CheckCategoryListParams,
  CheckTaskListParams,
  CheckRecordListParams,
  CheckCategoryCreateRequest,
  CheckTaskCreateRequest,
  CheckRecordCreateRequest
} from "../../../types/check";
import type { ApiResult } from "../../../types/user";

// 打卡类型相关接口

/** 获取打卡类型列表 */
export const getCheckCategories = (params?: CheckCategoryListParams) => {
  return http.request<CheckCategoryListResult>("get", "/check/categories/", { params });
};

/** 获取打卡类型详情 */
export const getCheckCategoryById = (id: number) => {
  return http.request<ApiResult>("get", `/check/categories/${id}/`);
};

/** 创建打卡类型 */
export const createCheckCategory = (data: CheckCategoryCreateRequest) => {
  return http.request<ApiResult>("post", "/check/categories/", { data });
};

/** 更新打卡类型 */
export const updateCheckCategory = (id: number, data: CheckCategoryCreateRequest) => {
  return http.request<ApiResult>("put", `/check/categories/${id}/`, { data });
};

/** 删除打卡类型 */
export const deleteCheckCategory = (id: number) => {
  return http.request<ApiResult>("delete", `/check/categories/${id}/`);
};

// 打卡任务相关接口

/** 获取打卡任务列表 */
export const getCheckTasks = (params?: CheckTaskListParams) => {
  return http.request<CheckTaskListResult>("get", "/check/tasks/", { params });
};

/** 获取打卡任务详情 */
export const getCheckTaskById = (id: number) => {
  return http.request<ApiResult>("get", `/check/tasks/${id}/`);
};

/** 创建打卡任务 */
export const createCheckTask = (data: CheckTaskCreateRequest) => {
  return http.request<ApiResult>("post", "/check/tasks/", { data });
};

/** 更新打卡任务 */
export const updateCheckTask = (id: number, data: CheckTaskCreateRequest) => {
  return http.request<ApiResult>("put", `/check/tasks/${id}/`, { data });
};

/** 删除打卡任务 */
export const deleteCheckTask = (id: number) => {
  return http.request<ApiResult>("delete", `/check/tasks/${id}/`);
};

/** 完成打卡任务 */
export const completeCheckTask = (id: number) => {
  return http.request<ApiResult>("post", `/check/tasks/${id}/complete/`);
};

/** 取消打卡任务 */
export const cancelCheckTask = (id: number) => {
  return http.request<ApiResult>("post", `/check/tasks/${id}/cancel/`);
};

// 打卡记录相关接口

/** 获取打卡记录列表 */
export const getCheckRecords = (params?: CheckRecordListParams) => {
  return http.request<CheckRecordListResult>("get", "/check/records/", { params });
};

/** 获取打卡记录详情 */
export const getCheckRecordById = (id: number) => {
  return http.request<ApiResult>("get", `/check/records/${id}/`);
};

/** 创建打卡记录 */
export const createCheckRecord = (data: CheckRecordCreateRequest) => {
  return http.request<ApiResult>("post", "/check/records/", { data });
};

/** 审核打卡记录 */
export const reviewCheckRecord = (id: number, status: 'approved' | 'rejected', comment?: string) => {
  return http.request<ApiResult>("post", `/check/records/${id}/review/`, { 
    data: { status, comment } 
  });
};

/** 删除打卡记录 */
export const deleteCheckRecord = (id: number) => {
  return http.request<ApiResult>("delete", `/check/records/${id}/`);
};

// 打卡统计相关接口

/** 获取打卡任务统计 */
export const getCheckTaskStatistic = (id: number, params?: object) => {
  return http.request<CheckStatisticResult>("get", `/check/tasks/${id}/statistics/`, { params });
};

/** 获取整体打卡统计 */
export const getCheckStatistics = (params?: object) => {
  return http.request<ApiResult>("get", "/check/statistics/", { params });
}; 
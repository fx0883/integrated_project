import { ElMessage, ElNotification } from "element-plus";

/**
 * API响应处理工具
 * 用于统一处理API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  data?: T;
  message?: string;
  timestamp?: number;
}

// 成功状态码
const SUCCESS_CODES = [200, 0, 2000];

/**
 * 检查响应是否成功
 * @param response API响应对象
 * @returns 是否成功
 */
export function isSuccess(response: ApiResponse): boolean {
  if (!response) return false;
  
  // 检查success字段
  if (response.success === true) return true;
  
  // 检查状态码
  if (response.code !== undefined && SUCCESS_CODES.includes(response.code)) {
    return true;
  }
  
  return false;
}

/**
 * 统一处理API响应
 * @param response API响应对象
 * @param successMessage 成功时的提示信息，不传则不提示
 * @param errorMessage 失败时的提示信息，不传则使用响应中的message
 * @returns 处理后的数据
 */
export function handleResponse<T = any>(
  response: ApiResponse<T>,
  successMessage?: string,
  errorMessage?: string
): T | null {
  if (!response) {
    ElMessage.error("响应数据为空");
    return null;
  }
  
  // 成功处理
  if (isSuccess(response)) {
    // 显示成功提示
    if (successMessage) {
      ElMessage.success(successMessage);
    }
    
    // 返回数据
    return response.data ?? null;
  }
  
  // 错误处理
  const msg = errorMessage || response.message || "请求失败";
  ElMessage.error(msg);
  return null;
}

/**
 * 格式化API响应为标准格式
 * @param response 原始响应
 * @returns 标准格式的响应
 */
export function formatResponse<T = any>(response: any): ApiResponse<T> {
  // 已经是标准格式
  if (response && typeof response === 'object' && 'success' in response) {
    return response as ApiResponse<T>;
  }
  
  // 转换为标准格式
  const standardResponse: ApiResponse<T> = {
    success: false,
    code: 500,
    data: null as any,
    message: "未知错误"
  };
  
  if (!response) return standardResponse;
  
  // 尝试从不同格式中提取信息
  if (typeof response === 'object') {
    // 提取code
    if ('code' in response) {
      standardResponse.code = Number(response.code);
      standardResponse.success = SUCCESS_CODES.includes(standardResponse.code);
    } else if ('statusCode' in response) {
      standardResponse.code = Number(response.statusCode);
      standardResponse.success = SUCCESS_CODES.includes(standardResponse.code);
    }
    
    // 提取message
    if ('message' in response) {
      standardResponse.message = String(response.message);
    } else if ('msg' in response) {
      standardResponse.message = String(response.msg);
    } else if ('errorMessage' in response) {
      standardResponse.message = String(response.errorMessage);
    }
    
    // 提取data
    if ('data' in response) {
      standardResponse.data = response.data;
    } else if ('result' in response) {
      standardResponse.data = response.result;
    } else {
      // 如果没有data字段，可能整个response就是data
      const { code, message, msg, success, ...rest } = response;
      if (Object.keys(rest).length > 0) {
        standardResponse.data = rest as T;
      }
    }
  }
  
  // 添加时间戳
  standardResponse.timestamp = Date.now();
  
  return standardResponse;
}

/**
 * 显示API错误
 * @param error 错误对象
 * @param title 错误标题
 */
export function showApiError(error: any, title: string = "请求错误") {
  let message = "未知错误";
  
  if (typeof error === 'string') {
    message = error;
  } else if (error && error.message) {
    message = error.message;
  } else if (error && error.msg) {
    message = error.msg;
  } else if (error && error.errorMessage) {
    message = error.errorMessage;
  }
  
  ElNotification({
    title,
    message,
    type: "error"
  });
} 
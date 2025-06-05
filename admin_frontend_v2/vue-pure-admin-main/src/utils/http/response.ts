import { ElMessage, ElNotification } from "element-plus";
import { safeDeepClone } from "../common";

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
    console.error('[API 响应处理] 响应数据为空');
    ElMessage.error("响应数据为空");
    return null;
  }
  
  // 成功处理
  if (isSuccess(response)) {
    console.log('[API 响应处理] 请求成功', {
      响应数据: response,
      成功提示: successMessage || '无提示'
    });
    
    // 显示成功提示
    if (successMessage) {
      ElMessage.success(successMessage);
    }
    
    // 返回数据
    return response.data ?? null;
  }
  
  // 错误处理
  const msg = errorMessage || response.message || "请求失败";
  console.error('[API 响应处理] 请求失败', {
    响应数据: response,
    错误信息: msg
  });
  
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
    console.log('[API 响应格式化] 已是标准格式', response);
    return response as ApiResponse<T>;
  }
  
  // 转换为标准格式
  const standardResponse: ApiResponse<T> = {
    success: false,
    code: 500,
    data: null as any,
    message: "未知错误"
  };
  
  if (!response) {
    console.warn('[API 响应格式化] 响应为空');
    return standardResponse;
  }
  
  try {
    // 使用安全深拷贝函数处理可能的循环引用
    console.log('[API 响应格式化] 尝试安全复制响应对象');
    const safeResponse = safeDeepClone(response, 20); // 限制递归深度为20
    console.log('[API 响应格式化] 安全复制完成');
    
    // 尝试从不同格式中提取信息
    if (typeof safeResponse === 'object') {
      // 提取code
      if ('code' in safeResponse) {
        standardResponse.code = Number(safeResponse.code);
        standardResponse.success = SUCCESS_CODES.includes(standardResponse.code);
      } else if ('statusCode' in safeResponse) {
        standardResponse.code = Number(safeResponse.statusCode);
        standardResponse.success = SUCCESS_CODES.includes(standardResponse.code);
      }
      
      // 提取message
      if ('message' in safeResponse) {
        standardResponse.message = String(safeResponse.message);
      } else if ('msg' in safeResponse) {
        standardResponse.message = String(safeResponse.msg);
      } else if ('errorMessage' in safeResponse) {
        standardResponse.message = String(safeResponse.errorMessage);
      }
      
      // 提取data
      if ('data' in safeResponse) {
        standardResponse.data = safeResponse.data;
      } else if ('result' in safeResponse) {
        standardResponse.data = safeResponse.result;
      } else {
        // 如果没有data字段，可能整个response就是data
        const { code, message, msg, success, ...rest } = safeResponse;
        if (Object.keys(rest).length > 0) {
          standardResponse.data = rest as T;
        }
      }
    }
  } catch (error) {
    console.error('[API 响应格式化] 格式化过程出错', error);
    standardResponse.message = '响应格式化失败';
  }
  
  // 添加时间戳
  standardResponse.timestamp = Date.now();
  
  console.log('[API 响应格式化] 原始格式转为标准格式', {
    标准化结果: standardResponse
  });
  
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
  
  console.error('[API 错误处理]', {
    标题: title,
    消息: message,
    原始错误: error
  });
  
  ElNotification({
    title,
    message,
    type: "error"
  });
} 
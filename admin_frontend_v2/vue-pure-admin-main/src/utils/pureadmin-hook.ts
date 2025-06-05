/**
 * @pureadmin/utils 安全包装
 * 处理可能导致循环引用的函数调用
 */
import { safeDeepClone, safeStringify } from "./common";

// 导入原始模块
import * as PureAdminUtils from "@pureadmin/utils";

// 记录被拦截和包装的函数调用
const interceptedCalls = {
  count: 0,
  lastCalled: "",
  errors: [] as string[]
};

// 安全调用函数的包装器
function safeCall<T extends Function>(fn: T, fnName: string): T {
  return ((...args: any[]) => {
    try {
      interceptedCalls.count++;
      interceptedCalls.lastCalled = fnName;
      
      // 在执行原函数前检查参数，避免传递可能导致循环引用的对象
      const safeArgs = args.map((arg, index) => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            // 尝试检测循环引用
            JSON.stringify(arg);
            return arg; // 如果没有循环引用，直接使用原参数
          } catch (error) {
            console.warn(`[PureAdmin安全调用] ${fnName} 的参数 ${index} 包含循环引用，将尝试安全克隆`);
            try {
              // 尝试安全克隆
              return safeDeepClone(arg);
            } catch (cloneError) {
              console.error(`[PureAdmin安全调用] ${fnName} 的参数 ${index} 无法安全克隆:`, cloneError);
              // 对于无法安全处理的对象，返回简化版本
              return typeof arg === 'object' ? 
                (Array.isArray(arg) ? [] : {}) : 
                arg;
            }
          }
        }
        return arg;
      });
      
      console.log(`[PureAdmin安全调用] 调用 ${fnName}`);
      // 使用null代替this，避免上下文问题
      const result = fn.apply(null, safeArgs);
      return result;
    } catch (error) {
      console.error(`[PureAdmin安全调用] ${fnName} 调用失败:`, error);
      interceptedCalls.errors.push(`${fnName}: ${error.message}`);
      
      // 根据函数返回类型提供适当的默认值
      if (fnName.startsWith('is') || fnName.endsWith('able')) {
        return false; // 对于布尔检查函数
      } else if (fnName.includes('get') || fnName.includes('find')) {
        return null; // 对于获取类函数
      } else if (fnName.includes('array') || fnName.includes('list')) {
        return []; // 对于数组类函数
      } else {
        return {}; // 默认返回空对象
      }
    }
  }) as unknown as T;
}

// 创建安全包装版本
export const pureUtils = Object.entries(PureAdminUtils).reduce((acc, [key, value]) => {
  if (typeof value === 'function') {
    acc[key] = safeCall(value, key);
  } else {
    acc[key] = value; // 直接复制非函数属性
  }
  return acc;
}, {} as typeof PureAdminUtils);

// 导出拦截记录，用于调试
export function getPureUtilsInterceptLog() {
  return {
    ...interceptedCalls,
    errorRate: interceptedCalls.count > 0 ? 
      (interceptedCalls.errors.length / interceptedCalls.count * 100).toFixed(2) + '%' : 
      '0%'
  };
}

// 默认导出
export default pureUtils; 
/**
 * 通用工具函数
 * 处理数据安全、循环引用等常见问题
 */

/**
 * 安全深拷贝，能够处理循环引用
 * @param obj 要拷贝的对象
 * @param maxDepth 最大递归深度，防止无限递归
 * @param currentDepth 当前递归深度
 * @param cache 用于检测循环引用的WeakMap
 */
export function safeDeepClone<T>(
  obj: T, 
  maxDepth = 50, 
  currentDepth = 0,
  cache = new WeakMap()
): T {
  // 处理基本类型和null
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  // 防止递归过深
  if (currentDepth > maxDepth) {
    console.warn("[安全深拷贝] 达到最大递归深度限制:", maxDepth);
    return { 
      _maxDepthReached: true, 
      _originalType: Object.prototype.toString.call(obj) 
    } as any;
  }
  
  // 检测循环引用
  if (cache.has(obj as any)) {
    console.warn("[安全深拷贝] 检测到循环引用");
    return { 
      _circularReference: true, 
      _originalType: Object.prototype.toString.call(obj) 
    } as any;
  }
  
  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  // 处理正则表达式
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as any;
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    cache.set(obj, true);
    const result = [] as any[];
    for (let i = 0; i < obj.length; i++) {
      result[i] = safeDeepClone(obj[i], maxDepth, currentDepth + 1, cache);
    }
    return result as any;
  }
  
  // 处理普通对象
  const result = {} as any;
  cache.set(obj as any, true);
  
  try {
    // 复制所有属性
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = safeDeepClone(obj[key], maxDepth, currentDepth + 1, cache);
      }
    }
  } catch (error) {
    console.error("[安全深拷贝] 复制属性时出错:", error);
    result._error = true;
    result._errorMsg = String(error);
  }
  
  return result;
}

/**
 * 安全JSON序列化，处理循环引用
 * @param obj 要序列化的对象
 * @param maxDepth 最大递归深度
 */
export function safeStringify(obj: any, maxDepth = 50): string {
  try {
    // 先进行安全深拷贝，处理循环引用
    const safeObj = safeDeepClone(obj, maxDepth);
    return JSON.stringify(safeObj);
  } catch (error) {
    console.error("[安全JSON序列化] 序列化失败:", error);
    return JSON.stringify({
      _error: true,
      _errorMsg: String(error),
      _originalType: Object.prototype.toString.call(obj)
    });
  }
}

/**
 * 安全JSON解析
 * @param text 要解析的JSON字符串
 */
export function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("[安全JSON解析] 解析失败:", error);
    return {
      _error: true,
      _errorMsg: String(error),
      _originalText: text.length > 100 ? text.substring(0, 100) + "..." : text
    };
  }
}

/**
 * 安全获取对象属性，避免空值错误
 * @param obj 对象
 * @param path 属性路径，如 "user.address.city"
 * @param defaultValue 默认值
 */
export function safeGet(obj: any, path: string, defaultValue: any = undefined): any {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
} 
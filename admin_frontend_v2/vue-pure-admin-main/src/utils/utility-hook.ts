/**
 * 工具函数安全包装器
 * 用于拦截和监控可能导致堆栈溢出的操作
 */

/**
 * 防止递归过深导致栈溢出的装饰器
 * @param fn 需要限制递归深度的函数
 * @param maxDepth 最大递归深度
 * @returns 包装后的安全函数
 */
export function limitRecursion<T extends (...args: any[]) => any>(
  fn: T,
  maxDepth = 100
): T {
  const recursionMap = new Map<string, number>();
  
  const safeFunction = function(this: any, ...args: any[]) {
    // 创建调用点标识
    const callId = `${fn.name || 'anonymous'}_${Math.random().toString(36).slice(2, 7)}`;
    
    // 获取当前调用深度
    const currentDepth = recursionMap.get(callId) || 0;
    
    // 检查是否超过最大递归深度
    if (currentDepth > maxDepth) {
      console.warn(`[安全调用] 函数 ${fn.name || 'anonymous'} 递归层数(${currentDepth})超过限制(${maxDepth})`);
      return null;
    }
    
    // 增加递归深度计数
    recursionMap.set(callId, currentDepth + 1);
    
    try {
      // 调用原函数
      const result = fn.apply(this, args);
      return result;
    } finally {
      // 减少递归深度计数
      recursionMap.set(callId, currentDepth);
      
      // 如果回到顶层，清理递归计数
      if (currentDepth === 0) {
        recursionMap.delete(callId);
      }
    }
  };
  
  return safeFunction as T;
}

/**
 * 安全地处理可能包含循环引用的对象
 * @param obj 要处理的对象
 * @param handler 处理函数
 * @returns 处理结果
 */
export function safelyHandleObject<T, R>(
  obj: T,
  handler: (safeObj: T) => R
): R {
  // 尝试检测对象是否包含循环引用
  try {
    JSON.stringify(obj);
    // 没有循环引用，直接处理
    return handler(obj);
  } catch (error) {
    // 可能存在循环引用，使用安全版本处理
    console.warn(`[安全处理] 检测到可能的循环引用，将使用安全模式处理`);
    
    // 创建一个简化版本的对象
    const simplifiedObj = simplifyObject(obj);
    return handler(simplifiedObj as T);
  }
}

/**
 * 简化对象，移除可能导致循环引用的部分
 * @param obj 要简化的对象
 * @param depth 当前递归深度
 * @param seen 已处理过的对象集合
 * @returns 简化后的对象
 */
export function simplifyObject(
  obj: any, 
  depth = 0, 
  seen = new WeakSet()
): any {
  // 处理基本类型
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 防止递归过深
  if (depth > 20) {
    return '[对象嵌套过深]';
  }
  
  // 检测循环引用
  if (seen.has(obj)) {
    return '[循环引用]';
  }
  
  seen.add(obj);
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.slice(0, 10).map(item => simplifyObject(item, depth + 1, seen));
  }
  
  // 处理普通对象
  const result = {};
  const keys = Object.keys(obj).slice(0, 20); // 限制属性数量
  
  for (const key of keys) {
    try {
      result[key] = simplifyObject(obj[key], depth + 1, seen);
    } catch (e) {
      result[key] = '[无法访问的属性]';
    }
  }
  
  return result;
} 
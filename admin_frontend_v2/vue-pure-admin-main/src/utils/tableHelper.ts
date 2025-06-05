/**
 * 表格组件辅助工具
 * 用于检测和处理表格数据中的循环引用问题
 */
import { safeDeepClone, safeStringify } from "./common";

/**
 * 检查对象是否包含循环引用
 * @param obj 要检查的对象
 * @returns 是否包含循环引用
 */
export function hasCircularReference(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return false;
  } catch (error) {
    // 如果报错是循环引用错误
    if (error instanceof Error && error.message.includes("circular")) {
      return true;
    }
    return false;
  }
}

/**
 * 安全处理表格数据，避免循环引用
 * @param data 原始表格数据
 * @returns 处理后的安全数据
 */
export function safeTableData<T = any>(data: T[]): T[] {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  console.log("[表格助手] 安全处理表格数据");
  
  try {
    // 尝试安全克隆数据
    return safeDeepClone(data) as T[];
  } catch (error) {
    console.error("[表格助手] 表格数据克隆失败，尝试逐项处理", error);
    
    // 逐项处理数据
    return data.map(item => {
      try {
        return safeDeepClone(item);
      } catch (itemError) {
        console.error("[表格助手] 表格行数据克隆失败", itemError);
        // 最后手段：创建简化版本的对象
        const simplifiedItem: Record<string, any> = {};
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            try {
              // 尝试获取简单值
              const value = item[key];
              if (typeof value !== "object" || value === null) {
                simplifiedItem[key] = value;
              } else if (Array.isArray(value)) {
                // 处理数组
                simplifiedItem[key] = "[数组内容]";
              } else {
                // 复杂对象用占位符替代
                simplifiedItem[key] = "[对象内容]";
              }
            } catch (propError) {
              simplifiedItem[key] = "[无法访问的数据]";
            }
          }
        }
        return simplifiedItem as unknown as T;
      }
    });
  }
}

/**
 * 监测表格数据变化
 * @param data 表格数据
 * @param componentName 组件名称，用于日志标识
 */
export function monitorTableData(data: any[], componentName: string = "表格组件"): void {
  console.log(`[${componentName}] 监测表格数据变化`);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log(`[${componentName}] 表格数据为空`);
    return;
  }
  
  // 尝试检测循环引用
  if (hasCircularReference(data)) {
    console.error(`[${componentName}] 检测到表格数据存在循环引用!`);
    return;
  }
  
  // 尝试安全克隆
  try {
    const dataCopy = safeDeepClone(data);
    console.log(`[${componentName}] 表格数据安全检查通过，共 ${data.length} 行`);
  } catch (error) {
    console.error(`[${componentName}] 表格数据存在潜在问题:`, error);
  }
} 
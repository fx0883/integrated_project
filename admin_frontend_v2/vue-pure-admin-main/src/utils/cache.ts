import { ref } from "vue";
import { formatResponse } from "@/utils/http/response";

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expires: number;
};

/**
 * 数据缓存管理类，用于减少API请求次数
 */
class DataCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param expires 过期时间(毫秒)，默认5分钟
   */
  set<T>(key: string, data: T, expires: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires
    });
  }
  
  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据，如果已过期返回null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 清除特定前缀的缓存
   * @param prefix 前缀
   */
  clearByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * 获取缓存数量
   */
  size(): number {
    return this.cache.size;
  }
}

// 创建全局缓存实例
export const apiCache = new DataCache();

/**
 * 缓存API请求结果
 * @param apiFunc API请求函数
 * @param cacheKey 缓存键
 * @param expires 过期时间(毫秒)
 * @param forceRefresh 是否强制刷新
 * @returns 请求结果
 */
export async function cacheApiResult<T>(
  apiFunc: () => Promise<any>,
  cacheKey: string,
  expires: number = 5 * 60 * 1000,
  forceRefresh: boolean = false
): Promise<T> {
  // 如果强制刷新或缓存不存在，则发起请求
  if (forceRefresh || !apiCache.get(cacheKey)) {
    const response = await apiFunc();
    const standardResponse = formatResponse(response);
    
    // 检查响应是否成功
    if (standardResponse.success && standardResponse.data) {
      // 缓存结果
      apiCache.set(cacheKey, standardResponse.data, expires);
    }
    
    return standardResponse.data as T;
  }
  
  // 返回缓存的结果
  return apiCache.get(cacheKey) as T;
}

/**
 * 创建一个响应式的API结果，支持缓存
 * @param apiFunc API请求函数
 * @param cacheKey 缓存键
 * @param expires 过期时间(毫秒)
 * @returns 响应式数据和加载函数
 */
export function useApiWithCache<T>(
  apiFunc: () => Promise<any>,
  cacheKey: string,
  expires: number = 5 * 60 * 1000
) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  const fetchData = async (forceRefresh: boolean = false) => {
    loading.value = true;
    error.value = null;
    
    try {
      data.value = await cacheApiResult<T>(apiFunc, cacheKey, expires, forceRefresh);
    } catch (err) {
      error.value = err as Error;
      console.error(`API请求错误(${cacheKey}):`, err);
    } finally {
      loading.value = false;
    }
  };
  
  // 初始化时尝试从缓存加载
  if (apiCache.get(cacheKey)) {
    data.value = apiCache.get(cacheKey) as T;
  }
  
  return {
    data,
    loading,
    error,
    fetchData
  };
} 
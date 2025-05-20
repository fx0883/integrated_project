/**
 * 本地存储工具函数
 */

/**
 * 存储数据到 localStorage
 * @param {string} key 存储键名
 * @param {any} value 存储值，会自动序列化
 */
export const setLocalStorage = (key, value) => {
  try {
    // 对复杂数据类型进行序列化
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value
    localStorage.setItem(key, serializedValue)
    console.log(`[Storage] 数据已存储到 localStorage，键名: ${key}`)
    return true
  } catch (error) {
    console.error(`[Storage] 存储数据到 localStorage 失败，键名: ${key}`, error)
    return false
  }
}

/**
 * 从 localStorage 获取数据
 * @param {string} key 存储键名
 * @param {any} defaultValue 默认值，当获取不到数据时返回
 * @returns {any} 存储的数据或默认值
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key)
    
    // 如果没有找到值，返回默认值
    if (value === null) {
      return defaultValue
    }
    
    // 尝试解析 JSON
    try {
      return JSON.parse(value)
    } catch (e) {
      // 如果不是 JSON 格式，则直接返回原始值
      return value
    }
  } catch (error) {
    console.error(`[Storage] 从 localStorage 获取数据失败，键名: ${key}`, error)
    return defaultValue
  }
}

/**
 * 从 localStorage 删除数据
 * @param {string} key 存储键名
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key)
    console.log(`[Storage] 已从 localStorage 删除数据，键名: ${key}`)
    return true
  } catch (error) {
    console.error(`[Storage] 从 localStorage 删除数据失败，键名: ${key}`, error)
    return false
  }
}

/**
 * 清空 localStorage 中的所有数据
 */
export const clearLocalStorage = () => {
  try {
    localStorage.clear()
    console.log('[Storage] 已清空 localStorage 中的所有数据')
    return true
  } catch (error) {
    console.error('[Storage] 清空 localStorage 失败', error)
    return false
  }
}

/**
 * 存储数据到 sessionStorage
 * @param {string} key 存储键名
 * @param {any} value 存储值，会自动序列化
 */
export const setSessionStorage = (key, value) => {
  try {
    // 对复杂数据类型进行序列化
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value
    sessionStorage.setItem(key, serializedValue)
    console.log(`[Storage] 数据已存储到 sessionStorage，键名: ${key}`)
    return true
  } catch (error) {
    console.error(`[Storage] 存储数据到 sessionStorage 失败，键名: ${key}`, error)
    return false
  }
}

/**
 * 从 sessionStorage 获取数据
 * @param {string} key 存储键名
 * @param {any} defaultValue 默认值，当获取不到数据时返回
 * @returns {any} 存储的数据或默认值
 */
export const getSessionStorage = (key, defaultValue = null) => {
  try {
    const value = sessionStorage.getItem(key)
    
    // 如果没有找到值，返回默认值
    if (value === null) {
      return defaultValue
    }
    
    // 尝试解析 JSON
    try {
      return JSON.parse(value)
    } catch (e) {
      // 如果不是 JSON 格式，则直接返回原始值
      return value
    }
  } catch (error) {
    console.error(`[Storage] 从 sessionStorage 获取数据失败，键名: ${key}`, error)
    return defaultValue
  }
}

/**
 * 从 sessionStorage 删除数据
 * @param {string} key 存储键名
 */
export const removeSessionStorage = (key) => {
  try {
    sessionStorage.removeItem(key)
    console.log(`[Storage] 已从 sessionStorage 删除数据，键名: ${key}`)
    return true
  } catch (error) {
    console.error(`[Storage] 从 sessionStorage 删除数据失败，键名: ${key}`, error)
    return false
  }
}

/**
 * 清空 sessionStorage 中的所有数据
 */
export const clearSessionStorage = () => {
  try {
    sessionStorage.clear()
    console.log('[Storage] 已清空 sessionStorage 中的所有数据')
    return true
  } catch (error) {
    console.error('[Storage] 清空 sessionStorage 失败', error)
    return false
  }
} 
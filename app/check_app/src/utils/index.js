/**
 * 工具函数入口文件
 */

// 导入所有日期工具函数
import * as dateUtils from './date'
// 导入所有存储工具函数
import * as storageUtils from './storage'

// 暴露所有工具函数
export { dateUtils, storageUtils }

// 默认导出所有工具函数
export default {
  dateUtils,
  storageUtils,
} 
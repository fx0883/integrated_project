/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期为 YYYY-MM-DD HH:MM:SS 格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化时间为 HH:MM:SS 格式
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 解析日期字符串为 Date 对象
 * @param {string} dateStr 日期字符串，格式为 YYYY-MM-DD
 * @returns {Date} 日期对象
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return null
  
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 解析日期时间字符串为 Date 对象
 * @param {string} dateTimeStr 日期时间字符串，格式为 YYYY-MM-DD HH:MM:SS 或 YYYY-MM-DDTHH:MM:SSZ
 * @returns {Date} 日期对象
 */
export const parseDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return null
  
  // 处理 ISO 格式的日期时间 (YYYY-MM-DDTHH:MM:SSZ)
  if (dateTimeStr.includes('T')) {
    return new Date(dateTimeStr)
  }
  
  // 处理普通格式的日期时间 (YYYY-MM-DD HH:MM:SS)
  const [datePart, timePart] = dateTimeStr.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes, seconds] = timePart.split(':').map(Number)
  
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

/**
 * 获取当前日期字符串，格式为 YYYY-MM-DD
 * @returns {string} 当前日期字符串
 */
export const getCurrentDateStr = () => {
  return formatDate(new Date())
}

/**
 * 获取当前日期时间字符串，格式为 YYYY-MM-DD HH:MM:SS
 * @returns {string} 当前日期时间字符串
 */
export const getCurrentDateTimeStr = () => {
  return formatDateTime(new Date())
}

/**
 * 获取日期对应的星期几
 * @param {Date} date 日期对象
 * @param {Object} options 选项
 * @param {string} options.lang 语言，支持 'zh-CN' 和 'en-US'，默认为 'zh-CN'
 * @param {boolean} options.short 是否使用简短形式，默认为 false
 * @returns {string} 星期几
 */
export const getWeekDay = (date, options = {}) => {
  const { lang = 'zh-CN', short = false } = options
  
  const weekdayIndex = date.getDay() // 0-6，表示周日到周六
  
  if (lang === 'zh-CN') {
    const weekdays = short 
      ? ['日', '一', '二', '三', '四', '五', '六']
      : ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    
    return weekdays[weekdayIndex]
  } else {
    const weekdays = short
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return weekdays[weekdayIndex]
  }
}

/**
 * 计算两个日期之间相差的天数
 * @param {Date|string} date1 日期对象或日期字符串
 * @param {Date|string} date2 日期对象或日期字符串
 * @returns {number} 相差的天数（绝对值）
 */
export const getDaysDiff = (date1, date2) => {
  // 转换为 Date 对象
  const d1 = date1 instanceof Date ? date1 : parseDate(date1)
  const d2 = date2 instanceof Date ? date2 : parseDate(date2)
  
  if (!d1 || !d2) return null
  
  // 清除时间部分，只保留日期
  const time1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime()
  const time2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime()
  
  // 计算相差的毫秒数，除以一天的毫秒数，取绝对值
  return Math.abs(Math.round((time2 - time1) / (1000 * 60 * 60 * 24)))
}

/**
 * 获取指定月份的天数
 * @param {number} year 年份
 * @param {number} month 月份，1-12
 * @returns {number} 天数
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate()
}

/**
 * 获取日期所在月份的第一天
 * @param {Date} date 日期对象
 * @returns {Date} 该月第一天的日期对象
 */
export const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * 获取日期所在月份的最后一天
 * @param {Date} date 日期对象
 * @returns {Date} 该月最后一天的日期对象
 */
export const getLastDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/**
 * 格式化相对时间
 * @param {Date|string} date 日期对象或日期字符串
 * @param {Object} options 选项
 * @param {string} options.lang 语言，支持 'zh-CN' 和 'en-US'，默认为 'zh-CN'
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (date, options = {}) => {
  const { lang = 'zh-CN' } = options
  
  // 转换为 Date 对象
  const d = date instanceof Date ? date : parseDateTime(date)
  if (!d) return ''
  
  const now = new Date()
  const diff = now.getTime() - d.getTime() // 毫秒数差值
  
  // 将毫秒转换为秒
  const diffInSeconds = Math.floor(diff / 1000)
  
  if (lang === 'zh-CN') {
    if (diffInSeconds < 60) return '刚刚'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}天前`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}周前`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}个月前`
    return `${Math.floor(diffInSeconds / 31536000)}年前`
  } else {
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
    return `${Math.floor(diffInSeconds / 31536000)} years ago`
  }
} 
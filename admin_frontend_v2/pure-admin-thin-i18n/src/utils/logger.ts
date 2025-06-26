/**
 * 日志记录工具
 * 用于记录API请求、响应和错误信息到控制台
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// 日志颜色配置
const LogColors = {
  [LogLevel.DEBUG]: '#8a8a8a', // 灰色
  [LogLevel.INFO]: '#2196f3',  // 蓝色
  [LogLevel.WARN]: '#ff9800',  // 橙色
  [LogLevel.ERROR]: '#f44336'  // 红色
};

// 默认日志配置
const config = {
  enabled: true,
  level: LogLevel.DEBUG,
  apiLogging: true,
  apiLogFullResponse: true,
  useColors: true  // 是否使用彩色输出
};

/**
 * 创建时间戳
 */
const timestamp = (): string => {
  const now = new Date();
  return [
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
    now.getMilliseconds().toString().padStart(3, '0')
  ].join(':');
};

/**
 * 格式化对象为可读字符串
 */
const formatObject = (obj: any, depth: number = 2): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      // 处理循环引用和过深的对象
      if (typeof value === 'object' && value !== null) {
        if (depth <= 0) {
          return '[Object]';
        }
        return Object.keys(value).reduce((acc, k) => {
          if (typeof value[k] === 'object' && value[k] !== null) {
            acc[k] = formatObject(value[k], depth - 1);
          } else {
            acc[k] = value[k];
          }
          return acc;
        }, {});
      }
      return value;
    }, 2);
  } catch (error) {
    return '[无法序列化的对象]';
  }
};

/**
 * 日志记录函数
 */
const log = (level: LogLevel, message: string, ...args: any[]): void => {
  if (!config.enabled || LogLevel[level] === undefined) return;
  
  const levelIndex = Object.values(LogLevel).indexOf(level);
  const configLevelIndex = Object.values(LogLevel).indexOf(config.level);
  
  if (levelIndex < configLevelIndex) return;
  
  const time = timestamp();
  const formattedArgs = args.map(arg => 
    typeof arg === 'object' ? formatObject(arg) : arg
  );
  
  const logFn = console[level] || console.log;
  const color = LogColors[level];
  const logPrefix = `[${time}] [${level.toUpperCase()}] `;
  
  // 简化日志输出方式，确保在所有环境中正常工作
  try {
    // 尝试使用带颜色的输出
    if (config.useColors) {
      logFn(`%c${logPrefix}${message}`, `color: ${color}; font-weight: bold;`, ...formattedArgs);
    } else {
      // 简单输出，无颜色
      logFn(`${logPrefix}${message}`, ...formattedArgs);
    }
  } catch (e) {
    // 如果出错，回退到最基本的输出
    console.log(`${logPrefix}${message}`, ...formattedArgs);
  }
};

/**
 * API请求日志记录
 */
export const logRequest = (config: any): void => {
  if (!config.apiLogging) return;
  
  const { method, url, data, params } = config;
  
  log(
    LogLevel.INFO,
    `🚀 API请求 [${method?.toUpperCase()}] ${url}`,
    { 
      url,
      method: method?.toUpperCase(),
      params: params || {},
      data: data || {},
      headers: config.headers || {}
    }
  );
};

/**
 * API响应日志记录
 */
export const logResponse = (response: any): void => {
  if (!config.apiLogging) return;
  
  const { config: responseConfig, status, statusText, data } = response;
  const { method, url } = responseConfig;
  
  log(
    LogLevel.INFO,
    `✅ API响应 [${method?.toUpperCase()}] ${url} - ${status} ${statusText}`,
    {
      url,
      method: method?.toUpperCase(),
      status,
      statusText,
      data: config.apiLogFullResponse ? data : (
        typeof data === 'object' ? { 
          ...data,
          data: data.data ? '[已截断]' : undefined
        } : data
      )
    }
  );
  
  return response;
};

/**
 * API错误日志记录
 */
export const logError = (error: any): void => {
  if (!config || !config.apiLogging) return;
  
  // 提取请求信息
  const { config: errorConfig, response } = error;
  let requestInfo = '未知请求';
  
  if (errorConfig) {
    const { method, url } = errorConfig;
    requestInfo = `[${method?.toUpperCase()}] ${url}`;
  }
  
  // 错误详情
  let errorDetails: any = {
    message: error.message || '未知错误'
  };
  
  // 如果有响应，记录响应信息
  if (response) {
    const { status, statusText, data } = response;
    errorDetails = {
      ...errorDetails,
      status,
      statusText,
      data
    };
  }
  
  log(
    LogLevel.ERROR,
    `❌ API错误 ${requestInfo}`,
    errorDetails
  );
  
  return error;
};

/**
 * 调试日志
 */
export const debug = (message: string, ...args: any[]): void => {
  log(LogLevel.DEBUG, message, ...args);
  // 直接输出简单信息，确保能看到
  console.log(`DEBUG: ${message}`);
};

/**
 * 信息日志
 */
export const info = (message: string, ...args: any[]): void => {
  log(LogLevel.INFO, message, ...args);
  // 直接输出简单信息，确保能看到
  console.log(`INFO: ${message}`);
};

/**
 * 警告日志
 */
export const warn = (message: string, ...args: any[]): void => {
  log(LogLevel.WARN, message, ...args);
  // 直接输出简单信息，确保能看到
  console.warn(`WARN: ${message}`);
};

/**
 * 错误日志
 */
export const error = (message: string, ...args: any[]): void => {
  log(LogLevel.ERROR, message, ...args);
  // 直接输出简单信息，确保能看到
  console.error(`ERROR: ${message}`);
};

/**
 * 设置日志配置
 */
export const configure = (options: Partial<typeof config>): void => {
  Object.assign(config, options);
  
  // 立即输出配置信息，确认日志系统已经启动
  console.log("日志系统已初始化", config);
};

export default {
  debug,
  info,
  warn,
  error,
  logRequest,
  logResponse,
  logError,
  configure,
  LogLevel
}; 
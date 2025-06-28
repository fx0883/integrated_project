/**
 * 日志记录工具
 * 用于记录API请求、响应和错误信息到控制台
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error"
}

// 默认日志配置
const config = {
  enabled: true,
  level: LogLevel.DEBUG,
  apiLogging: true,
  apiLogFullResponse: true,
  useColors: true, // 是否使用彩色输出
  consoleOutput: true // 是否输出到控制台
};

/**
 * 创建时间戳
 */
const timestamp = (): string => {
  const now = new Date();
  return [
    now.getHours().toString().padStart(2, "0"),
    now.getMinutes().toString().padStart(2, "0"),
    now.getSeconds().toString().padStart(2, "0"),
    now.getMilliseconds().toString().padStart(3, "0")
  ].join(":");
};

/**
 * 格式化对象为可读字符串
 */
const formatObject = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "[无法序列化的对象]";
  }
};

/**
 * 日志记录函数
 */
const log = (level: LogLevel, message: string, ...args: any[]): void => {
  // 检查配置
  if (!config.enabled) return;
  if (!config.consoleOutput) return;

  // 检查日志级别
  const levels = Object.values(LogLevel);
  const currentLevelIndex = levels.indexOf(level);
  const configLevelIndex = levels.indexOf(config.level);
  if (currentLevelIndex < configLevelIndex) return;

  // 格式化参数
  const formattedArgs = args.map(arg =>
    typeof arg === "object" ? formatObject(arg) : arg
  );

  // 创建日志前缀
  const time = timestamp();
  const prefix = `[${time}] [${level.toUpperCase()}]`;

  // 根据日志级别选择控制台方法
  switch (level) {
    case LogLevel.DEBUG:
      console.log(`${prefix} ${message}`, ...formattedArgs);
      break;
    case LogLevel.INFO:
      console.info(`${prefix} ${message}`, ...formattedArgs);
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}`, ...formattedArgs);
      break;
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}`, ...formattedArgs);
      break;
  }
};

/**
 * API请求日志记录
 */
export const logRequest = (config: any): void => {
  if (!config.apiLogging) return;

  const { method, url, data, params } = config;

  log(LogLevel.INFO, `🚀 API请求 [${method?.toUpperCase()}] ${url}`, {
    url,
    method: method?.toUpperCase(),
    params: params || {},
    data: data || {},
    headers: config.headers || {}
  });
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
      data: config.apiLogFullResponse
        ? data
        : typeof data === "object"
          ? {
              ...data,
              data: data.data ? "[已截断]" : undefined
            }
          : data
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
  let requestInfo = "未知请求";

  if (errorConfig) {
    const { method, url } = errorConfig;
    requestInfo = `[${method?.toUpperCase()}] ${url}`;
  }

  // 错误详情
  let errorDetails: any = {
    message: error.message || "未知错误"
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

  log(LogLevel.ERROR, `❌ API错误 ${requestInfo}`, errorDetails);

  return error;
};

/**
 * 调试日志
 */
export const debug = (message: string, ...args: any[]): void => {
  log(LogLevel.DEBUG, message, ...args);
};

/**
 * 信息日志
 */
export const info = (message: string, ...args: any[]): void => {
  log(LogLevel.INFO, message, ...args);
};

/**
 * 警告日志
 */
export const warn = (message: string, ...args: any[]): void => {
  log(LogLevel.WARN, message, ...args);
};

/**
 * 错误日志
 */
export const error = (message: string, ...args: any[]): void => {
  log(LogLevel.ERROR, message, ...args);
};

/**
 * 设置日志配置
 */
export const configure = (options: Partial<typeof config>): void => {
  Object.assign(config, options);
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

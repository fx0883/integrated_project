import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import NProgress from "../progress";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { formatResponse, showApiError } from "./response";
import { safeStringify } from "../common";

// 获取环境变量中的API基础URL
const BASE_API = import.meta.env.VITE_BASE_API || "";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // API请求的基础URL
  baseURL: BASE_API,
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

// 输出当前API基础URL到控制台，方便调试
console.log(`[API配置] 当前API基础URL: ${BASE_API}`);

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        console.log(`[API 重试请求] ${config.method?.toUpperCase()} ${config.url} - 使用新Token`);
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 开启进度条动画
        NProgress.start();
        
        try {
          // 添加请求拦截日志（使用安全序列化避免循环引用）
          console.log(`[API请求拦截] ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            params: config.params ? safeStringify(config.params) : undefined,
            data: config.data ? safeStringify(config.data) : undefined
          });
        } catch (error) {
          console.error("[API请求拦截] 日志记录失败", error);
        }
        
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = ["/refresh-token", "/login"];
        return whiteList.some(url => config.url.endsWith(url))
          ? config
          : new Promise(resolve => {
              const data = getToken();
              if (data) {
                const now = new Date().getTime();
                const expired = parseInt(data.expires) - now <= 0;
                if (expired) {
                  console.log(`[API Token过期] ${config.url} - 尝试刷新Token`);
                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    // token过期刷新
                    useUserStoreHook()
                      .handRefreshToken({ refreshToken: data.refreshToken })
                      .then(res => {
                        const token = res.data.accessToken;
                        console.log(`[API Token刷新成功] ${config.url} - 新的Token已获取`);
                        config.headers["Authorization"] = formatToken(token);
                        PureHttp.requests.forEach(cb => cb(token));
                        PureHttp.requests = [];
                      })
                      .catch(refreshError => {
                        console.error(`[API Token刷新失败] ${config.url}`, refreshError);
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  }
                  console.log(`[API 请求重试] ${config.url} - 等待新Token`);
                  resolve(PureHttp.retryOriginalRequest(config));
                } else {
                  config.headers["Authorization"] = formatToken(
                    data.accessToken
                  );
                  console.log(`[API Token有效] ${config.url} - 使用现有Token`);
                  resolve(config);
                }
              } else {
                console.log(`[API 无Token] ${config.url} - 未找到Token信息`);
                resolve(config);
              }
            });
      },
      error => {
        console.error(`[API 请求拦截错误]`, error);
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 关闭进度条动画
        NProgress.done();
        
        try {
          // 添加响应日志（使用安全序列化避免循环引用）
          console.log(`[API响应拦截] ${$config.method?.toUpperCase()} ${$config.url}`, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: safeStringify(response.data)
          });
        } catch (error) {
          console.error("[API响应拦截] 日志记录失败", error);
        }
        
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        
        // 格式化响应数据为标准格式
        const standardResponse = formatResponse(response.data);
        return standardResponse;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 关闭进度条动画
        NProgress.done();
        
        try {
          // 添加错误日志（使用安全序列化避免循环引用）
          console.error(`[API响应拦截错误]`, {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            data: error.response?.data ? safeStringify(error.response.data) : undefined
          });
        } catch (logError) {
          console.error("[API响应拦截] 错误日志记录失败", logError);
        }
        
        // 处理错误响应
        if (error.response) {
          // 服务器返回错误响应
          const statusCode = error.response.status;
          const errorData = error.response.data as Record<string, any>;
          
          // 处理特定状态码
          switch (statusCode) {
            case 401: // 未授权
              useUserStoreHook().logOut();
              showApiError("登录状态已过期，请重新登录", "授权失败");
              break;
            case 403: // 禁止访问
              showApiError("您没有权限访问该资源", "权限不足");
              break;
            case 404: // 资源不存在
              showApiError("请求的资源不存在", "请求失败");
              break;
            case 500: // 服务器错误
              showApiError("服务器内部错误，请稍后重试", "服务器错误");
              break;
            default:
              // 尝试从响应中获取错误信息
              const errorMsg = errorData?.message || errorData?.msg || "请求失败";
              showApiError(errorMsg, `请求错误(${statusCode})`);
              break;
          }
        } else if (error.request) {
          // 请求发出但未收到响应
          showApiError("服务器无响应，请检查网络连接", "网络错误");
        } else {
          // 请求配置错误
          showApiError(error.message || "请求配置错误", "请求错误");
        }
        
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 添加请求日志（使用安全序列化避免循环引用）
    try {
      console.log(`[API请求] ${method.toUpperCase()} ${url}`, {
        params: param?.params ? safeStringify(param.params) : '{}',
        data: param?.data ? safeStringify(param.data) : '{}',
        headers: config.headers || {}
      });
    } catch (error) {
      console.error(`[API请求日志记录失败] ${method.toUpperCase()} ${url}`, error);
    }

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: any) => {
          // 添加响应成功日志
          try {
            console.log(`[API响应成功] ${method.toUpperCase()} ${url}`, 
              typeof response === 'object' ? safeStringify(response) : response);
          } catch (error) {
            console.error(`[API响应成功日志记录失败] ${method.toUpperCase()} ${url}`, error);
          }
          resolve(response);
        })
        .catch(error => {
          // 添加响应错误日志
          try {
            console.error(`[API响应错误] ${method.toUpperCase()} ${url}`, 
              error ? safeStringify(error) : 'Unknown error');
          } catch (logError) {
            console.error(`[API响应错误日志记录失败] ${method.toUpperCase()} ${url}`, logError);
          }
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    try {
      console.log(`[API POST请求] ${url}`, params ? safeStringify(params) : '{}');
    } catch (error) {
      console.error(`[API POST请求日志记录失败] ${url}`, error);
    }
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    try {
      console.log(`[API GET请求] ${url}`, params ? safeStringify(params) : '{}');
    } catch (error) {
      console.error(`[API GET请求日志记录失败] ${url}`, error);
    }
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();

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

// 获取环境变量中的API基础URL
const API_URL = import.meta.env.VITE_API_URL || "";
const BASE_API = import.meta.env.VITE_BASE_API || "";

// 完整的API基础URL
const FULL_BASE_URL = API_URL + BASE_API;

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // API请求的基础URL
  baseURL: FULL_BASE_URL,
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
console.log(`[API配置] 当前API基础URL: ${FULL_BASE_URL}`);

// 判断是否启用Mock
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === "true";
console.log(`[API配置] Mock状态: ${USE_MOCK ? '启用' : '禁用'}`);

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
        
        // 添加请求拦截日志
        console.log(`[API请求拦截] ${config.method?.toUpperCase()} ${config.url}`, config);
        
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
        
        // 添加响应日志
        console.log(`[API响应拦截] ${$config.method?.toUpperCase()} ${$config.url}`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        
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
        
        // 添加错误日志
        console.error(`[API响应拦截错误]`, $error);
        
        // 处理错误响应
        if (error.response) {
          // 服务器返回错误响应
          console.error(`[API响应错误] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error);
          // 显示API错误提示
          showApiError(error);
        } else if (error.request) {
          // 请求已发送但未收到响应
          console.error(`[API 网络错误] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.message);
          // 如果启用了Mock但服务器无响应，可能是Mock服务器未启动或配置有误
          if (USE_MOCK && error.config?.url?.includes("/get-async-routes")) {
            console.warn("[API mock警告] Mock服务可能未启动或配置错误，尝试使用备用路由");
            // 在这种情况下，错误会被传递到API调用处理函数，让路由加载逻辑使用本地路由
          }
        } else {
          // 请求设置时发生错误
          console.error(`[API 错误处理]`, error.message);
        }
        
        return Promise.reject(error);
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
    // 请求开始前记录日志
    console.log(`[API请求] ${method.toUpperCase()} ${url}`, param);
    
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          console.error(`[API 请求失败] ${method.toUpperCase()} ${url}`, error);
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
    console.log(`[API POST请求] ${url}`, params);
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    console.log(`[API GET请求] ${url}`, params);
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();

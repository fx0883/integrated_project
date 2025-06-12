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
import { message } from "@/utils/message";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求基础地址
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
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

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** 等待重试的请求队列 */
  private static pendingRequests: Array<() => Promise<any>> = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.pendingRequests.push(() => {
        // 获取新token
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        resolve(config);
        return Promise.resolve();
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 开启进度条动画
        NProgress.start();
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        
        // 添加CSRF Token
        const csrfToken = document.cookie.match(/csrftoken=([^;]*)/)?.[1];
        if (csrfToken) {
          config.headers["X-CSRFTOKEN"] = csrfToken;
        }
        
        /** 请求白名单，放置一些不需要`token`的接口 */
        const whiteList = ["/auth/login/"];
        if (whiteList.some(url => config.url.endsWith(url))) {
          return config;
        }
        
        // 从localStorage获取token
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        
        return config;
      },
      error => {
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
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        
        // 统一处理API响应格式
        const res = response.data;
        
        // 已经符合标准格式的响应直接返回
        if (res.success !== undefined && res.code !== undefined && res.message !== undefined) {
          return res;
        }
        
        // 处理不符合标准格式的响应，将其转换为标准格式
        const standardResponse = {
          success: true,
          code: 2000,
          message: '操作成功',
          data: res
        };
        
        return standardResponse;
      },
      async (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 关闭进度条动画
        NProgress.done();
        
        // 创建统一的错误响应格式
        let errorResponse = {
          success: false,
          code: 5000,  // 默认服务器错误
          message: '服务器内部错误',
          data: null
        };
        
        if (error.response) {
          const { status, config } = error.response;
          
          // 处理401未授权（Token过期）
          if (status === 401) {
            // 防止重复刷新
            if (!PureHttp.isRefreshing) {
              PureHttp.isRefreshing = true;
              
              try {
                // 尝试刷新Token
                const result = await this.refreshToken();
                if (result) {
                  // Token刷新成功，执行队列中的请求
                  PureHttp.pendingRequests.forEach(callback => callback());
                  PureHttp.pendingRequests = [];
                  
                  // 重试当前请求
                  return this.retryRequest(config);
                } else {
                  // Token刷新失败，跳转到登录页
                  this.logout();
                  errorResponse.code = 4001;
                  errorResponse.message = '认证失败，请重新登录';
                }
              } catch (refreshError) {
                // 刷新Token出错，跳转到登录页
                this.logout();
                errorResponse.code = 4001;
                errorResponse.message = '认证失败，请重新登录';
              } finally {
                PureHttp.isRefreshing = false;
              }
            } else {
              // 正在刷新token，将请求加入队列
              return new Promise(resolve => {
                PureHttp.pendingRequests.push(() => {
                  resolve(this.retryRequest(config));
                  return Promise.resolve();
                });
              });
            }
          } else {
            // 处理其他错误状态码
            switch (status) {
              case 400:
                errorResponse.code = 4000;
                errorResponse.message = '请求参数错误';
                break;
              case 403:
                errorResponse.code = 4003;
                errorResponse.message = '您没有权限执行此操作';
                break;
              case 404:
                errorResponse.code = 4004;
                errorResponse.message = '请求的资源不存在';
                break;
              case 500:
                errorResponse.code = 5000;
                errorResponse.message = '服务器内部错误';
                break;
              default:
                errorResponse.code = 5000;
                errorResponse.message = '请求失败';
            }
            
            // 尝试从响应中获取更详细的错误信息
            if (error.response.data) {
              // 保存原始错误数据
              errorResponse.data = error.response.data;
              
              // 如果响应已经符合标准格式，直接使用
              if (error.response.data && 
                  typeof error.response.data === 'object' && 
                  'success' in error.response.data && 
                  'code' in error.response.data && 
                  'message' in error.response.data &&
                  error.response.data.success === false) {
                errorResponse = error.response.data as typeof errorResponse;
              } else {
                // 提取错误消息
                if (error.response.data && 
                    typeof error.response.data === 'object' && 
                    'message' in error.response.data) {
                  errorResponse.message = String(error.response.data.message);
                } else if (error.response.data && 
                          typeof error.response.data === 'object' && 
                          'detail' in error.response.data) {
                  errorResponse.message = String(error.response.data.detail);
                }
              }
            }
          }
        } else {
          // 网络错误
          errorResponse.code = 5000;
          errorResponse.message = '网络连接失败，请检查您的网络';
        }
        
        // 显示错误消息
        message(errorResponse.message, { type: 'error' });
        
        return Promise.reject(errorResponse);
      }
    );
  }

  /** 刷新Token方法 */
  private async refreshToken(): Promise<boolean> {
    try {
      // 获取刷新Token
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }
      
      // 调用刷新Token接口
      const response = await Axios.post(
        `${defaultConfig.baseURL}/auth/refresh/`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // 处理响应
      if (response.data && (response.data.success || response.data.data)) {
        // 获取新token
        const data = response.data.data || response.data;
        const newToken = data.token;
        const newRefreshToken = data.refresh_token;
        
        if (newToken) {
          // 更新localStorage中的token
          localStorage.setItem('access_token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('刷新Token失败:', error);
      return false;
    }
  }

  /** 重试请求方法 */
  private async retryRequest(config: AxiosRequestConfig): Promise<any> {
    try {
      // 获取新token
      const token = localStorage.getItem('access_token');
      if (token) {
        // 更新请求头中的token
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 重新发起请求
      const response = await Axios(config);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /** 登出方法 */
  private logout(): void {
    // 清除localStorage中的token和用户信息
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    
    // 跳转到登录页
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
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

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
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
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();

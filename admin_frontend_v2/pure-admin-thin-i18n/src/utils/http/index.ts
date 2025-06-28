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
import logger from "@/utils/logger"; // 导入日志工具

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
          // 记录请求日志
          logger.logRequest(config);
          return config;
        }
        
        // 从localStorage获取token
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        
        // 记录请求日志
        logger.logRequest(config);
        
        // 特别记录撤销超级管理员的请求
        if (config.url && config.url.includes('revoke-super-admin')) {
          logger.info('发送撤销超级管理员请求:', {
            url: config.url,
            method: config.method,
            data: config.data,
            headers: config.headers
          });
        }
        
        return config;
      },
      error => {
        // 记录错误日志
        logger.error('请求拦截器错误', error);
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
          // 记录响应日志
          logger.logResponse(response);
          
          // 特别记录撤销超级管理员的响应
          if (response.config.url && response.config.url.includes('revoke-super-admin')) {
            logger.info('收到撤销超级管理员响应:', {
              url: response.config.url,
              status: response.status,
              data: response.data
            });
          }
          
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          // 记录响应日志
          logger.logResponse(response);
          
          // 特别记录撤销超级管理员的响应
          if (response.config.url && response.config.url.includes('revoke-super-admin')) {
            logger.info('收到撤销超级管理员响应:', {
              url: response.config.url,
              status: response.status,
              data: response.data
            });
          }
          
          return response.data;
        }
        
        // 统一处理API响应格式
        const res = response.data;
        
        // 已经符合标准格式的响应直接返回
        if (res.success !== undefined && res.code !== undefined && res.message !== undefined) {
          // 记录响应日志
          logger.logResponse(response);
          
          // 特别记录撤销超级管理员的响应
          if (response.config.url && response.config.url.includes('revoke-super-admin')) {
            logger.info('收到撤销超级管理员响应:', {
              url: response.config.url,
              status: response.status,
              data: response.data
            });
          }
          
          return res;
        }
        
        // 处理不符合标准格式的响应，将其转换为标准格式
        const standardResponse = {
          success: true,
          code: 2000,
          message: '操作成功',
          data: res
        };
        
        // 记录响应日志
        logger.logResponse({...response, data: standardResponse});
        
        return standardResponse;
      },
      async (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 关闭进度条动画
        NProgress.done();
        
        // 特别记录撤销超级管理员的错误
        if (error.config?.url && error.config.url.includes('revoke-super-admin')) {
          logger.error('撤销超级管理员请求错误:', {
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
        
        // 创建统一的错误响应格式
        let errorResponse = {
          success: false,
          code: 5000,  // 默认服务器错误
          message: '服务器内部错误',
          data: null
        };
        
        if (error.response) {
          const { status, config: errorConfig } = error.response;
          
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
                  return this.retryRequest(errorConfig);
                } else {
                  // Token刷新失败，执行登出
                  this.logout();
                  
                  errorResponse = {
                    success: false,
                    code: 4001,
                    message: '登录已过期，请重新登录',
                    data: null
                  };
                }
              } catch (refreshError) {
                // 刷新Token出错，执行登出
                logger.error('刷新Token失败', refreshError);
                this.logout();
                
                errorResponse = {
                  success: false,
                  code: 4001,
                  message: '登录已过期，请重新登录',
                  data: null
                };
              } finally {
                PureHttp.isRefreshing = false;
              }
            } else {
              // 已经在刷新Token，将请求加入队列
              return new Promise(resolve => {
                PureHttp.pendingRequests.push(() => {
                  resolve(this.retryRequest(errorConfig));
                  return Promise.resolve();
                });
              });
            }
          } else if (status === 403) {
            errorResponse = {
              success: false,
              code: 4003,
              message: '没有权限执行此操作',
              data: error.response.data
            };
          } else if (status === 404) {
            errorResponse = {
              success: false,
              code: 4004,
              message: '请求的资源不存在',
              data: null
            };
          } else if (status === 400) {
            // 处理表单验证错误
            const data = error.response.data;
            let message = '请求参数错误';
            
            if (data && typeof data === 'object') {
              if (data.message) {
                message = data.message;
              } else if (data.detail) {
                message = data.detail;
              } else {
                // 尝试提取第一个字段错误
                const firstField = Object.keys(data)[0];
                if (firstField && Array.isArray(data[firstField])) {
                  message = `${firstField}: ${data[firstField][0]}`;
                }
              }
            }
            
            errorResponse = {
              success: false,
              code: 4000,
              message,
              data: data
            };
          } else if (status >= 500) {
            errorResponse = {
              success: false,
              code: 5000,
              message: '服务器内部错误',
              data: error.response.data
            };
          }
        } else if (error.message && error.message.includes('timeout')) {
          errorResponse = {
            success: false,
            code: 5001,
            message: '请求超时，请稍后重试',
            data: null
          };
        } else if (error.message && error.message.includes('Network Error')) {
          errorResponse = {
            success: false,
            code: 5002,
            message: '网络连接错误，请检查网络设置',
            data: null
          };
        }
        
        // 记录错误日志
        logger.logError(error);
        
        // 显示错误消息
        message.error(errorResponse.message);
        
        return Promise.reject(errorResponse);
      }
    );
  }

  /**
   * 刷新Token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }
      
      const response = await Axios.post(
        `${defaultConfig.baseURL}/auth/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 && response.data.access) {
        // 更新存储的token
        localStorage.setItem('access_token', response.data.access);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('刷新Token请求失败', error);
      return false;
    }
  }

  /**
   * 重试请求
   */
  private async retryRequest(config: AxiosRequestConfig): Promise<any> {
    try {
      // 获取新的token
      const token = localStorage.getItem('access_token');
      
      // 创建新的请求配置
      const newConfig = { ...config };
      if (token) {
        newConfig.headers = {
          ...newConfig.headers,
          Authorization: `Bearer ${token}`
        };
      }
      
      // 发起重试请求
      const response = await Axios(newConfig);
      return response.data;
    } catch (error) {
      logger.error('重试请求失败', error);
      return Promise.reject(error);
    }
  }

  /**
   * 登出操作
   */
  private logout(): void {
    // 清除token
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // 使用store的登出方法
    useUserStoreHook().logOut();
    
    // 跳转到登录页
    window.location.href = '/login';
  }

  /**
   * 通用请求工具函数
   * @param method - 请求方法
   * @param url - 请求地址
   * @param param - 请求参数
   * @param axiosConfig - axios配置
   */
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
          resolve(response as unknown as Promise<T>);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * POST请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /**
   * GET请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }

  /**
   * PUT请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public put<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("put", url, params, config);
  }

  /**
   * PATCH请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public patch<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("patch", url, params, config);
  }

  /**
   * DELETE请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public delete<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("delete", url, params, config);
  }
}

export const http = new PureHttp();

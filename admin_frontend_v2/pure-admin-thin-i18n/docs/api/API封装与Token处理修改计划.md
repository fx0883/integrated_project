# API封装与Token处理修改计划

本文档详细说明了对pure-admin-thin-i18n项目中API请求和Token处理的封装与修改计划。

## 1. 修改目标

1. 统一封装API返回格式，适配后端标准响应结构
2. 优化Token处理机制，实现静默刷新Token
3. 支持请求失败后自动重试
4. 添加更完善的错误处理

## 2. 后端API响应格式

后端API返回的标准格式为：

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

## 3. Token处理机制

### 3.1 Token存储

- 使用localStorage存储token
  - `access_token`: 访问令牌
  - `refresh_token`: 刷新令牌
  - `user_info`: 用户信息

### 3.2 Token使用

- 在请求头中添加: `Authorization: Bearer ${token}`
- 对于不需要认证的接口(如登录、注册、刷新token)不添加token

### 3.3 Token刷新

- **静默刷新**: 当收到401响应时，自动尝试刷新token，无需用户交互
- **请求重试**: 刷新token成功后，自动重试失败的请求，无需刷新页面
- **刷新接口参数**: 使用`{ refresh_token: refreshToken }`格式

## 4. 具体实现计划

### 4.1 创建API类型定义

1. 在`src/types`目录下创建`api.ts`文件，定义API响应类型

```typescript
// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;      // 请求是否成功
  code: number;          // 状态码
  message: string;       // 消息
  data: T;               // 响应数据
}

// 分页数据接口
export interface PaginationData<T = any> {
  total: number;         // 总条数
  page: number;          // 当前页码
  limit: number;         // 每页条数
  data: T[];             // 数据列表
}

// 分页响应接口
export interface PaginationResponse<T = any> extends ApiResponse<PaginationData<T>> {}
```

### 4.2 修改HTTP请求工具

1. 修改`src/utils/http/index.ts`文件，增强HTTP请求功能

```typescript
// 添加请求队列，用于存储等待重试的请求
private static pendingRequests: Array<() => Promise<any>> = [];

// 修改请求拦截器
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
      
      // 请求白名单处理
      const whiteList = ["/auth/login/"];
      if (!whiteList.some(url => config.url.endsWith(url))) {
        // 从localStorage获取token
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
      
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
}

// 修改响应拦截器
private httpInterceptorsResponse(): void {
  const instance = PureHttp.axiosInstance;
  instance.interceptors.response.use(
    (response: PureHttpResponse) => {
      const $config = response.config;
      // 关闭进度条动画
      NProgress.done();
      
      // 统一处理API响应格式
      const res = response.data;
      
      // 已经符合标准格式的响应直接返回
      if (res.success !== undefined && res.code !== undefined && res.message !== undefined) {
        return res;
      }
      
      // 处理不符合标准格式的响应，将其转换为标准格式
      let standardResponse = {
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
          // 尝试刷新Token
          const result = await this.refreshToken();
          if (result) {
            // Token刷新成功，重试原始请求
            return this.retryRequest(config);
          } else {
            // Token刷新失败，跳转到登录页
            this.logout();
            errorResponse.code = 4001;
            errorResponse.message = '认证失败，请重新登录';
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
            if (error.response.data.success === false && error.response.data.code && error.response.data.message) {
              errorResponse = error.response.data;
            } else {
              // 提取错误消息
              if (error.response.data.message) {
                errorResponse.message = error.response.data.message;
              } else if (error.response.data.detail) {
                errorResponse.message = error.response.data.detail;
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

// 刷新Token方法
private async refreshToken(): Promise<boolean> {
  try {
    // 获取刷新Token
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return false;
    }
    
    // 调用刷新Token接口
    const response = await Axios.post(
      `${import.meta.env.VITE_API_BASE_URL || ''}/auth/refresh/`,
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

// 重试请求方法
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
    return response;
  } catch (error) {
    return Promise.reject(error);
  }
}

// 登出方法
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
```

### 4.3 修改API调用代码

1. 修改`src/api/user.ts`文件，适配新的API响应格式

```typescript
import { http } from "@/utils/http";
import { ApiResponse } from '@/types/api';

// 定义用户登录响应数据类型
export interface LoginResponseData {
  token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    nick_name: string;
    is_admin: boolean;
    is_super_admin: boolean;
    avatar: string;
  };
}

// 定义登录响应类型
export type LoginResponse = ApiResponse<LoginResponseData>;

// 定义刷新令牌响应数据类型
export interface RefreshTokenResponseData {
  token: string;
  refresh_token: string;
}

// 定义刷新令牌响应类型
export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseData>;

/**
 * 登录
 * @param data 登录数据
 * @returns 登录响应
 */
export const getLogin = (data?: object) => {
  return http.request<LoginResponse>("post", "/auth/login/", { data });
};

/**
 * 刷新令牌
 * @param data 刷新令牌数据
 * @returns 刷新令牌响应
 */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResponse>("post", "/auth/refresh/", { data });
};
```

### 4.4 修改用户存储模块

1. 修改`src/store/modules/user.ts`文件，适配新的Token处理方式

```typescript
/** 登入 */
async loginByUsername(data) {
  return new Promise<LoginResponse>((resolve, reject) => {
    getLogin(data)
      .then(response => {
        if (response?.success && response.code === 2000) {
          // 适配后端返回的数据结构
          const { token, refresh_token, user } = response.data;
          
          // 存储token到localStorage
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', refresh_token);
          
          // 构建用户数据
          const userData = {
            accessToken: token,
            refreshToken: refresh_token,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 假设token有效期为24小时
            id: user.id,
            username: user.username,
            nick_name: user.nick_name,
            email: user.email,
            is_admin: user.is_admin,
            is_super_admin: user.is_super_admin,
            is_member: user.is_member || false,
            phone: user.phone || "",
            status: user.status || "active",
            last_login_ip: user.last_login_ip || "",
            tenant: user.tenant,
            parent: user.parent,
            avatar: user.avatar || "",
            roles: [user.is_super_admin ? "super" : (user.is_admin ? "admin" : "member")],
            permissions: ["*:*:*"] // 假设拥有所有权限，根据实际情况调整
          };
          
          // 存储用户信息
          setToken(userData);
          
          // 存储原始用户信息到localStorage
          localStorage.setItem('user_info', JSON.stringify(user));
        }
        resolve(response);
      })
      .catch(error => {
        reject(error);
      });
  });
}

/** 刷新`token` */
async handRefreshToken(data) {
  return new Promise<RefreshTokenResponse>((resolve, reject) => {
    refreshTokenApi(data)
      .then(response => {
        if (response?.success && response.code === 2000) {
          // 适配后端返回的数据结构
          const { token, refresh_token } = response.data;
          
          // 更新localStorage中的token
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', refresh_token);
          
          // 更新用户数据
          const userData = {
            accessToken: token,
            refreshToken: refresh_token,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 假设token有效期为24小时
          };
          setToken(userData);
        }
        resolve(response);
      })
      .catch(error => {
        reject(error);
      });
  });
}

/** 前端登出（不调用接口） */
logOut() {
  this.username = "";
  this.roles = [];
  this.permissions = [];
  
  // 清除localStorage中的token和用户信息
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  
  // 清除cookie中的token
  removeToken();
  
  // 重置路由和跳转到登录页
  useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
  resetRouter();
  router.push("/login");
}
```

## 5. 实施步骤

1. 创建API类型定义文件
2. 修改HTTP请求工具
3. 修改用户API文件
4. 修改用户存储模块
5. 测试登录和Token刷新功能
6. 测试请求失败自动重试功能

## 6. 注意事项

1. **Token存储**: 同时保留localStorage和cookie两种存储方式，以兼容现有代码
2. **请求URL**: 确保所有请求URL末尾都添加斜杠，以符合Django的URL规范
3. **错误处理**: 统一处理API错误响应，提供友好的错误提示
4. **兼容性**: 确保修改后的代码与现有功能兼容，不破坏已有的业务逻辑 
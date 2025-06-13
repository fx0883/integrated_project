# pure-admin-thin-i18n API文档

本文档提供 pure-admin-thin-i18n 项目中 API 接口的详细说明、使用方式和自定义封装说明。

## 1. API 架构概述

项目采用了模块化的 API 设计，基于 Axios 进行了二次封装，实现了统一的请求处理、响应处理、错误处理和 Token 管理。

### 1.1 目录结构

```
src/
├── api/                # API 模块目录
│   ├── modules/        # 按业务模块划分的 API
│   ├── types/          # API 类型定义
│   ├── utils/          # API 工具函数
│   ├── routes.ts       # 路由相关 API
│   └── user.ts         # 用户相关 API
├── types/
│   └── api.ts          # API 通用类型定义
└── utils/
    └── http/           # HTTP 请求工具
        ├── index.ts    # HTTP 客户端封装
        └── types.d.ts  # HTTP 类型定义
```

### 1.2 API 响应格式

所有 API 响应都统一为标准化的格式：

```typescript
// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;      // 请求是否成功
  code: number;          // 状态码
  message: string;       // 消息
  data: T;               // 响应数据
}
```

分页数据格式：

```typescript
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

## 2. HTTP 请求工具

### 2.1 基本配置

HTTP 客户端基于 Axios 封装，核心配置如下：

```typescript
// src/utils/http/index.ts
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
  // 数组格式参数序列化
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};
```

### 2.2 请求方法

HTTP 客户端提供了以下核心方法：

#### 2.2.1 通用请求方法

```typescript
/**
 * 发起 HTTP 请求
 * @param method 请求方法
 * @param url 请求 URL
 * @param param 请求参数
 * @param axiosConfig 额外的 Axios 配置
 */
request<T>(
  method: RequestMethods,
  url: string,
  param?: AxiosRequestConfig,
  axiosConfig?: PureHttpRequestConfig
): Promise<T>
```

#### 2.2.2 便捷请求方法

```typescript
// GET 请求
get<T, P>(url: string, params?: AxiosRequestConfig<P>, config?: PureHttpRequestConfig): Promise<T>

// POST 请求
post<T, P>(url: string, params?: AxiosRequestConfig<P>, config?: PureHttpRequestConfig): Promise<T>

// PUT 请求 (类似方式实现)

// DELETE 请求 (类似方式实现)
```

### 2.3 请求拦截器

请求拦截器负责处理请求发送前的逻辑，包括：

- 添加请求头
- 添加认证信息
- 处理白名单接口

```typescript
private httpInterceptorsRequest(): void {
  PureHttp.axiosInstance.interceptors.request.use(
    async (config: PureHttpRequestConfig): Promise<any> => {
      // 开启进度条动画
      NProgress.start();
      
      // 处理自定义回调
      if (typeof config.beforeRequestCallback === "function") {
        config.beforeRequestCallback(config);
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
```

### 2.4 响应拦截器

响应拦截器负责处理响应数据的统一处理，包括：

- 统一响应格式
- 错误处理
- Token 过期刷新

```typescript
private httpInterceptorsResponse(): void {
  const instance = PureHttp.axiosInstance;
  instance.interceptors.response.use(
    (response: PureHttpResponse) => {
      // 关闭进度条
      NProgress.done();
      
      // 处理自定义回调
      if (typeof $config.beforeResponseCallback === "function") {
        $config.beforeResponseCallback(response);
        return response.data;
      }
      
      // 统一处理API响应格式
      const res = response.data;
      
      // 已经符合标准格式的响应直接返回
      if (res.success !== undefined && res.code !== undefined && res.message !== undefined) {
        return res;
      }
      
      // 处理不符合标准格式的响应，将其转换为标准格式
      return {
        success: true,
        code: 2000,
        message: '操作成功',
        data: res
      };
    },
    async (error: PureHttpError) => {
      // 关闭进度条
      NProgress.done();
      
      // 处理错误响应
      if (error.response) {
        const { status, config } = error.response;
        
        // 处理401未授权（Token过期）
        if (status === 401) {
          try {
            // Token刷新和请求重试逻辑
            // ...
          } catch {
            // 处理刷新失败
          }
        }
      }
      
      // 返回统一的错误格式
      return Promise.reject({
        success: false,
        code: error.response?.status || 5000,
        message: error.message || '请求失败',
        data: null
      });
    }
  );
}
```

### 2.5 Token 刷新机制

项目实现了无感知的 Token 刷新机制，当请求返回 401 状态码时，会自动尝试刷新 Token 并重试请求：

```typescript
// Token 刷新和请求重试的核心逻辑
private static pendingRequests: Array<() => Promise<any>> = [];
private static isRefreshing = false;

// 刷新 Token 方法
private async refreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;
    
    // 请求刷新接口
    const { data } = await useUserStoreHook().refreshTokenApi();
    
    // 更新 Token
    if (data.token) {
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// 重试请求方法
private async retryRequest(config: AxiosRequestConfig): Promise<any> {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return PureHttp.axiosInstance(config);
}
```

## 3. API 模块示例

### 3.1 用户相关 API

用户相关 API 封装在 `src/api/user.ts` 文件中：

```typescript
import { http } from "@/utils/http";
import { ApiResponse, LoginResponseData, RefreshTokenResponseData, UserInfo } from "@/types/api";

export type UserResult = ApiResponse<LoginResponseData>;
export type RefreshTokenResult = ApiResponse<RefreshTokenResponseData>;

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/auth/login/", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/auth/refresh/", { data });
};
```

### 3.2 路由相关 API

路由相关 API 封装在 `src/api/routes.ts` 文件中：

```typescript
import { http } from "@/utils/http";

/** 获取用户菜单和按钮权限列表 */
export const getAuthMenuList = () => {
  return http.request<ApiResponse>("get", "/menu/list");
};
```

## 4. API 类型定义

项目使用 TypeScript 类型系统来定义 API 请求和响应的类型，提高开发时的类型安全：

### 4.1 基础 API 类型

```typescript
// src/types/api.ts
/**
 * API响应类型定义
 */

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

### 4.2 用户相关类型

```typescript
// 用户信息接口
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  nick_name: string;
  is_admin: boolean;
  is_super_admin: boolean;
  is_member?: boolean;
  avatar?: string;
  phone?: string;
  status?: string;
  last_login_ip?: string;
  tenant?: any;
  parent?: any;
}

// 登录响应数据接口
export interface LoginResponseData {
  token: string;
  refresh_token: string;
  user: UserInfo;
}

// 刷新令牌响应数据接口
export interface RefreshTokenResponseData {
  token: string;
  refresh_token: string;
} 
```

## 5. API 使用示例

### 5.1 基本使用

```typescript
import { getLogin } from "@/api/user";

// 登录
const login = async () => {
  try {
    const { success, data, message } = await getLogin({
      username: "admin",
      password: "123456"
    });
    
    if (success) {
      // 处理登录成功
      console.log("登录成功", data);
    } else {
      // 处理登录失败
      console.error(message);
    }
  } catch (error) {
    console.error("登录异常", error);
  }
};
```

### 5.2 在 Pinia Store 中使用

```typescript
// src/store/modules/user.ts
import { defineStore } from "pinia";
import { getLogin, refreshTokenApi } from "@/api/user";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem("access_token") || "",
    refreshToken: localStorage.getItem("refresh_token") || "",
    userInfo: null
  }),
  
  actions: {
    // 登录
    async login(params) {
      try {
        const { success, data } = await getLogin(params);
        if (success && data) {
          this.token = data.token;
          this.refreshToken = data.refresh_token;
          this.userInfo = data.user;
          
          // 存储 Token
          localStorage.setItem("access_token", data.token);
          localStorage.setItem("refresh_token", data.refresh_token);
          
          return Promise.resolve(data);
        }
        return Promise.reject(new Error("登录失败"));
      } catch (error) {
        return Promise.reject(error);
      }
    },
    
    // 刷新 Token
    async refreshToken() {
      try {
        const { success, data } = await refreshTokenApi({
          refresh_token: this.refreshToken
        });
        
        if (success && data) {
          this.token = data.token;
          this.refreshToken = data.refresh_token;
          
          localStorage.setItem("access_token", data.token);
          localStorage.setItem("refresh_token", data.refresh_token);
          
          return Promise.resolve(data);
        }
        return Promise.reject(new Error("刷新Token失败"));
      } catch (error) {
        return Promise.reject(error);
      }
    }
  }
});
```

### 5.3 分页查询示例

```typescript
// 分页查询 API
export const getTableList = (params?: object) => {
  return http.request<PaginationResponse<TableItem>>("get", "/table/list", { params });
};

// 使用分页查询
const fetchTableData = async (page = 1, limit = 10) => {
  try {
    const { success, data } = await getTableList({ page, limit });
    if (success && data) {
      tableData.value = data.data;
      total.value = data.total;
      currentPage.value = data.page;
      pageSize.value = data.limit;
    }
  } catch (error) {
    console.error("获取表格数据失败", error);
  }
};
```

## 6. 自定义 API 封装指南

### 6.1 创建新的 API 模块

1. 在 `src/api/modules/` 目录下创建一个新的文件，例如 `example.ts`：

```typescript
import { http } from "@/utils/http";
import { ApiResponse } from "@/types/api";

// 定义数据类型
export interface ExampleItem {
  id: number;
  name: string;
  description: string;
  // 其他字段...
}

// 定义响应类型
export type ExampleResult = ApiResponse<ExampleItem[]>;
export type ExampleDetailResult = ApiResponse<ExampleItem>;

// 获取列表
export const getExampleList = (params?: object) => {
  return http.request<ExampleResult>("get", "/example/list", { params });
};

// 获取详情
export const getExampleDetail = (id: number) => {
  return http.request<ExampleDetailResult>("get", `/example/${id}`);
};

// 创建
export const createExample = (data: Partial<ExampleItem>) => {
  return http.request<ApiResponse>("post", "/example", { data });
};

// 更新
export const updateExample = (id: number, data: Partial<ExampleItem>) => {
  return http.request<ApiResponse>("put", `/example/${id}`, { data });
};

// 删除
export const deleteExample = (id: number) => {
  return http.request<ApiResponse>("delete", `/example/${id}`);
};
```

### 6.2 添加自定义请求处理

如果需要为特定 API 添加自定义请求处理，可以使用 `beforeRequestCallback` 参数：

```typescript
export const getExampleWithCustomHandling = (params?: object) => {
  return http.request<ApiResponse>(
    "get",
    "/example/custom",
    { params },
    {
      beforeRequestCallback: config => {
        // 添加自定义请求头
        config.headers["X-Custom-Header"] = "CustomValue";
        
        // 修改请求参数
        if (config.params) {
          config.params.timestamp = Date.now();
        }
        
        return config;
      },
      beforeResponseCallback: response => {
        // 自定义响应处理
        console.log("Custom response handling", response);
        return response;
      }
    }
  );
};
```

### 6.3 批量请求处理

使用 Promise.all 进行批量请求处理：

```typescript
export const batchOperations = async (ids: number[]) => {
  try {
    const requests = ids.map(id => getExampleDetail(id));
    const results = await Promise.all(requests);
    
    // 处理结果
    const successResults = results.filter(res => res.success);
    const failedResults = results.filter(res => !res.success);
    
    return {
      success: failedResults.length === 0,
      successCount: successResults.length,
      failedCount: failedResults.length,
      data: successResults.map(res => res.data)
    };
  } catch (error) {
    return {
      success: false,
      message: "批量操作失败",
      data: null
    };
  }
};
```

## 7. 错误处理

### 7.1 全局错误处理

项目中实现了统一的 API 错误处理机制：

```typescript
// HTTP 响应拦截器中的错误处理
async (error: PureHttpError) => {
  // 创建统一的错误响应格式
  let errorResponse = {
    success: false,
    code: 5000,  // 默认服务器错误
    message: '服务器内部错误',
    data: null
  };
  
  if (error.response) {
    const { status } = error.response;
    
    // 根据状态码定制错误信息
    switch (status) {
      case 400:
        errorResponse.code = 4000;
        errorResponse.message = '请求参数错误';
        break;
      case 401:
        // Token 过期处理
        break;
      case 403:
        errorResponse.code = 4003;
        errorResponse.message = '没有权限访问';
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
        errorResponse.code = status || 5000;
        errorResponse.message = '请求失败';
    }
  }
  
  // 显示错误提示
  message.error(errorResponse.message);
  
  return Promise.reject(errorResponse);
}
```

### 7.2 API 调用层错误处理

在调用 API 时，应当使用 try-catch 处理可能的错误：

```typescript
const handleOperation = async () => {
  try {
    loading.value = true;
    const { success, data, message: msg } = await someApiCall();
    
    if (success) {
      // 成功处理
      message.success(msg || '操作成功');
      return data;
    } else {
      // 业务逻辑错误处理
      message.warning(msg || '操作失败');
      return null;
    }
  } catch (error: any) {
    // 捕获并处理异常
    console.error('操作异常', error);
    message.error(error.message || '系统异常');
    return null;
  } finally {
    loading.value = false;
  }
};
```

## 8. 最佳实践

### 8.1 API 设计原则

1. **模块化**: 按业务功能组织 API 文件
2. **类型安全**: 为所有 API 请求和响应定义类型
3. **统一格式**: 保持 API 响应格式的一致性
4. **错误处理**: 统一处理错误，并提供友好的错误信息
5. **参数验证**: 在 API 调用前验证参数

### 8.2 性能优化

1. **请求合并**: 使用批量请求减少 HTTP 请求数量
2. **请求缓存**: 缓存不经常变化的数据
3. **节流和防抖**: 对频繁触发的请求使用节流或防抖
4. **取消请求**: 在组件卸载时取消未完成的请求

```typescript
// 使用 AbortController 取消请求
import { onBeforeUnmount } from 'vue';

const controller = new AbortController();

const fetchData = async () => {
  try {
    const res = await http.request("get", "/api/data", {}, {
      axiosConfig: {
        signal: controller.signal
      }
    });
    return res;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('请求已取消');
    } else {
      console.error('请求错误', error);
    }
    return null;
  }
};

// 组件卸载时取消请求
onBeforeUnmount(() => {
  controller.abort();
});
```

### 8.3 API 文档维护

为项目中的 API 模块添加详细的注释和文档：

```typescript
/**
 * 获取用户列表
 * @param params 查询参数
 * @param params.page 页码，默认 1
 * @param params.limit 每页条数，默认 10
 * @param params.keyword 搜索关键字
 * @param params.status 用户状态
 * @returns 用户列表及分页信息
 */
export const getUserList = (params?: UserListParams) => {
  return http.request<PaginationResponse<UserItem>>("get", "/user/list", { params });
};
```

### 8.4 接口 Mock

对于前后端并行开发的场景，可以使用 Mock 数据：

1. 使用 Vite 插件 `vite-plugin-fake-server` 配置 Mock
2. 在 `mock/` 目录下创建对应的 Mock 文件

```typescript
// mock/user.ts
import { MockMethod } from "vite-plugin-fake-server";

export default [
  {
    url: "/api/v1/user/list",
    method: "get",
    response: ({ query }) => {
      const { page = 1, limit = 10, keyword = "" } = query;
      
      // 生成模拟数据
      const mockList = Array.from({ length: 100 }).map((_, index) => ({
        id: index + 1,
        username: `user${index + 1}`,
        email: `user${index + 1}@example.com`,
        status: ["active", "inactive", "locked"][Math.floor(Math.random() * 3)]
      }));
      
      // 过滤数据
      const filteredList = keyword
        ? mockList.filter(item => item.username.includes(keyword))
        : mockList;
      
      // 分页
      const pageList = filteredList.slice(
        (page - 1) * limit,
        page * limit
      );
      
      return {
        success: true,
        code: 2000,
        message: "操作成功",
        data: {
          total: filteredList.length,
          page: Number(page),
          limit: Number(limit),
          data: pageList
        }
      };
    }
  }
] as MockMethod[];
``` 
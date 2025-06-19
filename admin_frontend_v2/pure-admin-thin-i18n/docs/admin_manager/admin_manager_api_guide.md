# 管理员用户管理模块 - API集成指南

本文档提供管理员用户管理模块API的集成指南，包括API封装、请求参数、响应处理和错误处理等方面的实现细节。

## 1. API概述

管理员用户管理模块需要与后端的管理员用户API进行交互，主要包括以下功能：

- 获取管理员用户列表
- 获取管理员用户详情
- 创建管理员用户
- 更新管理员用户信息
- 删除管理员用户
- 授予/撤销超级管理员权限
- 上传管理员头像
- 重置管理员密码

## 2. API封装

在`src/api/modules/adminUser.ts`文件中封装管理员用户相关的API调用：

```typescript
import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  AdminUser,
  AdminUserListParams,
  AdminUserCreateParams,
  AdminUserUpdateParams
} from "@/types/adminUser";
import logger from "@/utils/logger";

/**
 * 获取管理员用户列表
 */
export function getAdminUserList(params: AdminUserListParams = {}) {
  logger.debug("API请求: 获取管理员用户列表", params);
  
  return http.request<PaginationResponse<AdminUser>>(
    "get",
    "/admin-users/",
    { params }
  );
}

/**
 * 创建管理员用户
 */
export function createAdminUser(data: AdminUserCreateParams) {
  logger.debug("API请求: 创建管理员用户", data);
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    "/admin-users/",
    { data }
  );
}

/**
 * 获取管理员用户详情
 */
export function getAdminUserDetail(id: number) {
  logger.debug("API请求: 获取管理员用户详情", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "get",
    `/admin-users/${id}/`
  );
}

/**
 * 更新管理员用户信息
 */
export function updateAdminUser(id: number, data: AdminUserUpdateParams) {
  logger.debug("API请求: 更新管理员用户信息", { id, data });
  
  return http.request<ApiResponse<AdminUser>>(
    "put",
    `/admin-users/${id}/`,
    { data }
  );
}

/**
 * 删除管理员用户
 */
export function deleteAdminUser(id: number) {
  logger.debug("API请求: 删除管理员用户", { id });
  
  return http.request<ApiResponse<any>>(
    "delete",
    `/admin-users/${id}/`
  );
}

/**
 * 授予超级管理员权限
 */
export function grantSuperAdmin(id: number) {
  logger.debug("API请求: 授予超级管理员权限", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/grant-super-admin/`
  );
}

/**
 * 撤销超级管理员权限
 */
export function revokeSuperAdmin(id: number) {
  logger.debug("API请求: 撤销超级管理员权限", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/revoke-super-admin/`
  );
}

/**
 * 创建超级管理员
 */
export function createSuperAdmin(data: AdminUserCreateParams) {
  logger.debug("API请求: 创建超级管理员", data);
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    "/admin-users/super-admin/create/",
    { data }
  );
}

/**
 * 上传管理员头像
 */
export function uploadAdminUserAvatar(id: number, formData: FormData) {
  logger.debug("API请求: 上传管理员头像", { id });
  
  return http.request<ApiResponse<{ avatar: string }>>(
    "post",
    `/admin-users/${id}/avatar/upload/`,
    { 
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 重置管理员密码
 */
export function resetAdminUserPassword(id: number, data: { password: string, password_confirm: string }) {
  logger.debug("API请求: 重置管理员密码", { id });
  
  return http.request<ApiResponse<{ success: boolean }>>(
    "post",
    `/admin-users/${id}/reset-password/`,
    { data }
  );
}

/**
 * 激活管理员账号
 */
export function activateAdminUser(id: number) {
  logger.debug("API请求: 激活管理员账号", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/activate/`
  );
}

/**
 * 停用管理员账号
 */
export function deactivateAdminUser(id: number) {
  logger.debug("API请求: 停用管理员账号", { id });
  
  return http.request<ApiResponse<AdminUser>>(
    "post",
    `/admin-users/${id}/deactivate/`
  );
}
```

## 3. 类型定义

在`src/types/adminUser.ts`文件中定义管理员用户相关的类型：

```typescript
/**
 * 管理员用户状态
 */
export type AdminUserStatus = 'active' | 'suspended' | 'inactive';

/**
 * 管理员用户角色
 */
export type AdminUserRole = 'super_admin' | 'tenant_admin';

/**
 * 管理员用户对象
 */
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  nick_name: string | null;
  first_name: string;
  last_name: string;
  is_active: boolean;
  avatar: string;
  tenant: number | null;
  tenant_name: string | null;
  is_admin: boolean;
  is_member: boolean;
  is_super_admin: boolean;
  role: string;
  status: AdminUserStatus;
  last_login_time: string | null;
  last_login_ip: string | null;
  date_joined: string;
}

/**
 * 管理员用户列表查询参数
 */
export interface AdminUserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: AdminUserStatus;
  is_super_admin?: boolean;
  tenant_id?: number;
}

/**
 * 创建管理员用户参数
 */
export interface AdminUserCreateParams {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  phone?: string;
  nick_name?: string;
  first_name?: string;
  last_name?: string;
  tenant_id?: number;
  is_active?: boolean;
  is_super_admin?: boolean;
}

/**
 * 更新管理员用户参数
 */
export interface AdminUserUpdateParams {
  email?: string;
  phone?: string;
  nick_name?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  status?: AdminUserStatus;
}
```

## 4. API使用方式

### 4.1 获取管理员用户列表

```typescript
import { getAdminUserList } from "@/api/modules/adminUser";

// 在组件中使用
const fetchAdminUsers = async (params: AdminUserListParams) => {
  try {
    const response = await getAdminUserList(params);
    if (response.success) {
      // 处理响应数据
      const adminUsers = response.data.results;
      const total = response.data.count;
      // ...
    } else {
      // 处理错误
      ElMessage.error(response.message || "获取管理员用户列表失败");
    }
  } catch (error) {
    // 处理异常
    console.error("获取管理员用户列表失败", error);
    ElMessage.error("获取管理员用户列表失败");
  }
};
```

### 4.2 创建管理员用户

```typescript
import { createAdminUser } from "@/api/modules/adminUser";

// 在组件中使用
const createAdmin = async (formData: AdminUserCreateParams) => {
  try {
    const response = await createAdminUser(formData);
    if (response.success) {
      // 处理成功响应
      ElMessage.success(response.message || "创建管理员用户成功");
      // 重新加载列表或跳转到详情页
    } else {
      // 处理错误
      ElMessage.error(response.message || "创建管理员用户失败");
    }
  } catch (error) {
    // 处理异常
    console.error("创建管理员用户失败", error);
    ElMessage.error("创建管理员用户失败");
  }
};
```

### 4.3 获取管理员用户详情

```typescript
import { getAdminUserDetail } from "@/api/modules/adminUser";

// 在组件中使用
const fetchAdminUserDetail = async (id: number) => {
  try {
    const response = await getAdminUserDetail(id);
    if (response.success) {
      // 处理响应数据
      const adminUser = response.data;
      // ...
    } else {
      // 处理错误
      ElMessage.error(response.message || "获取管理员用户详情失败");
    }
  } catch (error) {
    // 处理异常
    console.error("获取管理员用户详情失败", error);
    ElMessage.error("获取管理员用户详情失败");
  }
};
```

## 5. 状态管理集成

在Pinia状态管理中集成API调用：

```typescript
// src/store/modules/adminUser.ts
import { defineStore } from "pinia";
import {
  getAdminUserList,
  getAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  grantSuperAdmin,
  revokeSuperAdmin,
  activateAdminUser,
  deactivateAdminUser
} from "@/api/modules/adminUser";
import type {
  AdminUser,
  AdminUserListParams,
  AdminUserCreateParams,
  AdminUserUpdateParams
} from "@/types/adminUser";
import type { PaginationData } from "@/types/api";
import logger from "@/utils/logger";

interface AdminUserState {
  // 管理员用户列表数据
  adminUserList: PaginationData<AdminUser>;
  // 当前选中的管理员用户
  currentAdminUser: AdminUser | null;
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    grantSuperAdmin: boolean;
    revokeSuperAdmin: boolean;
    activate: boolean;
    deactivate: boolean;
  };
}

export const useAdminUserStore = defineStore("adminUser", {
  state: (): AdminUserState => ({
    adminUserList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentAdminUser: null,
    loading: {
      list: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      grantSuperAdmin: false,
      revokeSuperAdmin: false,
      activate: false,
      deactivate: false
    }
  }),
  
  actions: {
    /**
     * 获取管理员用户列表
     */
    async fetchAdminUserList(params: AdminUserListParams = {}) {
      this.loading.list = true;
      try {
        const response = await getAdminUserList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.adminUserList = {
              total: response.data.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              data: response.data.results || []
            };
          } else {
            logger.warn("管理员用户列表数据结构不符合预期", response.data);
            this.adminUserList.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取管理员用户列表失败", error);
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取管理员用户详情
     */
    async fetchAdminUserDetail(id: number) {
      this.loading.detail = true;
      try {
        const response = await getAdminUserDetail(id);
        if (response.success) {
          this.currentAdminUser = response.data;
          return response;
        } else {
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取管理员用户详情失败", error);
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    // ... 更多action
  }
});

export function useAdminUserStoreHook() {
  return useAdminUserStore();
}
```

## 6. 错误处理

为了统一处理API错误，建议采用以下错误处理策略：

1. **API层错误捕获**：在API函数中使用try-catch捕获并记录错误
2. **状态管理层错误处理**：在store的actions中处理API错误，并提供友好的错误信息
3. **组件层错误展示**：在组件中展示错误信息，并提供用户友好的错误提示
4. **全局错误拦截**：通过HTTP客户端拦截器处理常见错误，如认证失败、网络错误等

示例错误处理流程：

```typescript
// API调用
try {
  const response = await getAdminUserList(params);
  if (response.success) {
    // 处理成功响应
  } else {
    // 处理业务错误
    logger.warn("业务错误", response);
    return Promise.reject(new Error(response.message));
  }
} catch (error) {
  // 处理技术错误
  logger.error("技术错误", error);
  throw error;
}

// 组件中使用
try {
  await adminUserStore.fetchAdminUserList(params);
} catch (error) {
  // 显示友好的错误提示
  ElMessage.error(error.message || "获取管理员用户列表失败");
}
```

## 7. 分页和筛选

管理员用户列表API支持分页和筛选功能，示例用法：

```typescript
// 分页参数
const params: AdminUserListParams = {
  page: 1,
  page_size: 10,
  search: "admin",
  status: "active",
  is_super_admin: true,
  tenant_id: 1
};

// 调用API
const response = await getAdminUserList(params);
```

## 8. 文件上传

头像上传需要特殊处理，使用FormData对象：

```typescript
const uploadAvatar = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  
  try {
    const response = await uploadAdminUserAvatar(id, formData);
    if (response.success) {
      // 更新头像URL
      return response.data.avatar;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error("上传头像失败", error);
    throw error;
  }
};
```

## 9. API错误码对照表

| 错误码 | 错误描述 | 处理方式 |
|--------|----------|----------|
| 4000 | 请求参数错误 | 检查请求参数是否正确 |
| 4001 | 认证失败 | 重新登录 |
| 4003 | 权限不足 | 显示权限不足提示 |
| 4004 | 资源不存在 | 检查资源ID是否正确 |
| 4009 | 用户名已存在 | 提示用户更换用户名 |
| 4010 | 邮箱已存在 | 提示用户更换邮箱 |
| 5000 | 服务器内部错误 | 联系管理员或稍后重试 |

## 10. API文档参考

详细的API文档请参考：

- [管理员用户API使用指南](../admin_users/admin_user_api_guide.md)
- [管理员用户API示例](../admin_users/admin_user_api_examples.md)
- [管理员用户错误处理](../admin_users/admin_user_error_handling.md) 
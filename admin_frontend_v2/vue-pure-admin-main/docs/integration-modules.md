# 业务模块迁移详解

本文档详细说明各个业务模块从 integrated_admin 迁移到 vue-pure-admin-main 的具体实施方法和注意事项。

## 1. 认证模块迁移

### 1.1 认证流程对比

| integrated_admin | vue-pure-admin-main |
|------------------|---------------------|
| 基本 Token 认证 | 访问/刷新 Token 认证 |
| localStorage 存储 | 灵活存储选项（localStorage/sessionStorage/cookie） |
| 无 Token 刷新机制 | 自动 Token 刷新机制 |

### 1.2 迁移步骤

1. **分析认证逻辑**
   - 比较两个项目的登录流程和认证方式
   - 确定是否需要对接口进行调整

2. **修改类型定义**
   - 扩展用户信息类型，包含 `is_admin` 和 `is_super_admin` 字段
   ```typescript
   // types/user.d.ts
   export interface UserInfo extends BasicUserInfo {
     is_admin: boolean;
     is_super_admin: boolean;
     // 其他特有字段
   }
   ```

3. **适配登录接口**
   - 迁移登录、注册和密码找回接口
   - 调整响应处理逻辑

4. **权限识别适配**
   - 实现超级管理员和租户管理员的权限标识
   - 修改权限检查逻辑

### 1.3 关键代码调整

```typescript
// 修改 src/store/modules/user.ts
import { defineStore } from "pinia";
import { getLogin, refreshTokenApi } from "@/api/user";

export const useUserStore = defineStore({
  id: "pure-user",
  // ... 原有代码

  actions: {
    // 扩展登录处理逻辑
    async loginByUsername(data) {
      try {
        const { data: loginData } = await getLogin(data);
        this.setToken(loginData);
        
        // 存储用户角色信息
        if (loginData.user.is_super_admin) {
          this.roles = ["super_admin"];
        } else if (loginData.user.is_admin) {
          this.roles = ["admin"];
        } else {
          this.roles = ["user"];
        }
        
        return loginData;
      } catch (error) {
        return Promise.reject(error);
      }
    }
  }
});
```

## 2. 用户管理模块

### 2.1 功能对比

| integrated_admin | vue-pure-admin-main |
|------------------|---------------------|
| 用户列表、创建、编辑、查看 | 用户列表、角色分配 |
| 简单的用户角色管理 | 完善的RBAC权限系统 |

### 2.2 迁移步骤

1. **创建类型定义**
   ```typescript
   // types/user.d.ts
   export interface UserListItem {
     id: number;
     username: string;
     nickname: string;
     email: string;
     is_admin: boolean;
     is_super_admin: boolean;
     status: "active" | "inactive";
     created_at: string;
     tenant_id?: number;
   }
   
   export interface UserListResult {
     success: boolean;
     data: {
       list: UserListItem[];
       total: number;
     };
   }
   ```

2. **迁移 API 接口**
   ```typescript
   // src/api/user.ts 新增接口
   export const getUserList = (params?: object) => {
     return http.request<UserListResult>("get", "/users", { params });
   };
   
   export const createUser = (data: object) => {
     return http.request<ApiResult>("post", "/users", { data });
   };
   
   export const updateUser = (id: number, data: object) => {
     return http.request<ApiResult>("put", `/users/${id}`, { data });
   };
   
   export const deleteUser = (id: number) => {
     return http.request<ApiResult>("delete", `/users/${id}`);
   };
   ```

3. **创建 Store 模块**
   ```typescript
   // src/store/modules/userManagement.ts
   import { defineStore } from "pinia";
   import { getUserList, createUser, updateUser, deleteUser } from "@/api/user";
   
   export const useUserManagementStore = defineStore({
     id: "userManagement",
     state: () => ({
       users: [],
       total: 0,
       loading: false
     }),
     actions: {
       async fetchUsers(params) {
         this.loading = true;
         try {
           const { data } = await getUserList(params);
           this.users = data.list;
           this.total = data.total;
           return data;
         } finally {
           this.loading = false;
         }
       },
       
       // 其他用户管理操作
     }
   });
   ```

4. **创建视图组件**
   - 用户列表、创建、编辑和查看页面

### 2.3 权限适配

- 确保只有超级管理员和租户管理员可以访问用户管理模块
- 超级管理员可以管理所有用户，租户管理员只能管理本租户的用户

## 3. 租户管理模块

### 3.1 功能迁移

1. **类型定义**
   ```typescript
   // types/tenant.d.ts
   export interface Tenant {
     id: number;
     name: string;
     description: string;
     status: "active" | "inactive";
     created_at: string;
     user_count: number;
   }
   
   export interface TenantState {
     tenants: Tenant[];
     total: number;
     loading: boolean;
   }
   ```

2. **API 接口**
   ```typescript
   // src/api/tenant.ts
   import { http } from "@/utils/http";
   import type { TenantResult } from "@/types/tenant";
   
   export const getTenants = (params?: object) => {
     return http.request<TenantResult>("get", "/tenants", { params });
   };
   
   // 其他租户相关接口
   ```

3. **Store 模块**
   ```typescript
   // src/store/modules/tenant.ts
   import { defineStore } from "pinia";
   import { TenantState, Tenant } from "@/types/tenant";
   import { getTenants, createTenant, updateTenant, deleteTenant } from "@/api/tenant";
   
   export const useTenantStore = defineStore({
     id: "tenant",
     state: (): TenantState => ({
       tenants: [],
       total: 0,
       loading: false
     }),
     actions: {
       // 获取租户列表
       async fetchTenants(params) {
         // ...实现逻辑
       },
       
       // 其他操作
     }
   });
   ```

4. **视图组件**
   - 创建租户列表、创建、编辑和查看页面
   - 实现租户用户管理功能

### 3.2 权限控制

- 租户管理模块只能由超级管理员访问
- 添加路由和组件级别的权限控制

## 4. CMS 管理模块

### 4.1 文章管理迁移

1. **类型定义**
   ```typescript
   // types/cms/article.d.ts
   export interface Article {
     id: number;
     title: string;
     content: string;
     summary: string;
     cover_image: string;
     author: string;
     category_id: number;
     category_name: string;
     tags: Array<{id: number, name: string}>;
     status: 'draft' | 'published' | 'archived';
     view_count: number;
     comment_count: number;
     like_count: number;
     created_at: string;
     updated_at: string;
   }
   ```

2. **API 接口**
   ```typescript
   // src/api/cms/article.ts
   import { http } from "@/utils/http";
   import type { ArticleResult } from "@/types/cms/article";
   
   // 文章管理相关API
   export const getArticles = (params?: object) => {
     return http.request<ArticleResult>("get", "/articles", { params });
   };
   
   // 其他文章相关接口
   ```

3. **Store 模块**
   ```typescript
   // src/store/modules/article.ts
   import { defineStore } from "pinia";
   import { ArticleState } from "@/types/cms/article";
   import { getArticles, createArticle, updateArticle, deleteArticle } from "@/api/cms/article";
   
   export const useArticleStore = defineStore({
     id: "article",
     state: (): ArticleState => ({
       articles: [],
       total: 0,
       loading: false
     }),
     actions: {
       // 文章管理相关操作
     }
   });
   ```

4. **视图组件**
   - 文章列表、创建、编辑和查看页面
   - 富文本编辑器组件适配

### 4.2 分类和标签管理

类似文章管理，迁移分类和标签管理功能。

### 4.3 评论管理

迁移评论列表、审核和回复功能。

## 5. 打卡管理模块

### 5.1 打卡类型管理

1. **类型定义**
   ```typescript
   // types/check/category.d.ts
   export interface CheckCategory {
     id: number;
     name: string;
     description: string;
     icon: string;
     created_at: string;
   }
   ```

2. **API 接口与 Store 模块**
   - 迁移打卡类型相关的API和业务逻辑

3. **视图组件**
   - 打卡类型列表、创建和编辑页面

### 5.2 打卡任务管理

1. **类型定义**
   ```typescript
   // types/check/task.d.ts
   export interface CheckTask {
     id: number;
     title: string;
     description: string;
     category_id: number;
     category_name: string;
     start_date: string;
     end_date: string;
     frequency: 'daily' | 'weekly' | 'monthly';
     status: 'active' | 'completed' | 'cancelled';
     created_at: string;
   }
   ```

2. **API 接口与 Store 模块**
   - 迁移打卡任务相关的API和业务逻辑

3. **视图组件**
   - 打卡任务列表、创建和编辑页面

### 5.3 打卡记录管理

1. **类型定义**
   ```typescript
   // types/check/record.d.ts
   export interface CheckRecord {
     id: number;
     task_id: number;
     task_title: string;
     user_id: number;
     user_name: string;
     check_date: string;
     comment: string;
     images: string[];
     created_at: string;
   }
   ```

2. **API 接口与 Store 模块**
   - 迁移打卡记录相关的API和业务逻辑

3. **视图组件**
   - 打卡记录列表和详情页面

### 5.4 统计分析

1. **类型定义**
   ```typescript
   // types/check/statistic.d.ts
   export interface CheckStatistic {
     task_id: number;
     task_title: string;
     total_records: number;
     total_users: number;
     completion_rate: number;
     daily_data: Array<{date: string, count: number}>;
   }
   ```

2. **API 接口与 Store 模块**
   - 迁移统计分析相关的API和业务逻辑

3. **视图组件**
   - 统计分析页面，使用 ECharts 图表

## 6. 仪表盘模块

### 6.1 仪表盘内容规划

1. **超级管理员仪表盘**
   - 系统概览：用户数、租户数、文章数等
   - 租户统计：租户活跃度、用户分布
   - 内容统计：文章发布趋势、评论趋势

2. **租户管理员仪表盘**
   - 用户概览：用户数、活跃用户
   - 内容统计：文章数、评论数、阅读量
   - 打卡统计：任务完成率、打卡趋势

### 6.2 实现步骤

1. **类型定义**
   ```typescript
   // types/dashboard.d.ts
   export interface DashboardData {
     userCount: number;
     tenantCount: number;
     articleCount: number;
     commentCount: number;
     recentArticles: Array<{id: number, title: string, created_at: string}>;
     articleTrend: Array<{date: string, count: number}>;
     // 其他统计数据
   }
   ```

2. **API 接口**
   ```typescript
   // src/api/dashboard.ts
   import { http } from "@/utils/http";
   import type { DashboardResult } from "@/types/dashboard";
   
   export const getDashboardData = () => {
     return http.request<DashboardResult>("get", "/dashboard");
   };
   
   // 其他统计接口
   ```

3. **视图组件**
   - 根据用户角色显示不同的仪表盘内容
   - 使用 vue-pure-admin 的图表组件展示数据

## 7. 通用组件适配

### 7.1 表单组件

1. **表单处理**
   - 使用 Element Plus 表单组件
   - 添加表单验证和处理逻辑

2. **示例代码**
   ```vue
   <template>
     <el-form
       ref="formRef"
       :model="form"
       :rules="rules"
       label-width="100px"
     >
       <el-form-item label="标题" prop="title">
         <el-input v-model="form.title" placeholder="请输入标题" />
       </el-form-item>
       
       <!-- 其他表单项 -->
       
       <el-form-item>
         <el-button type="primary" @click="submitForm">提交</el-button>
         <el-button @click="resetForm">重置</el-button>
       </el-form-item>
     </el-form>
   </template>
   
   <script setup lang="ts">
   import { ref, reactive } from "vue";
   import type { FormInstance, FormRules } from "element-plus";
   
   const formRef = ref<FormInstance>();
   const form = reactive({
     title: "",
     // 其他字段
   });
   
   const rules = reactive<FormRules>({
     title: [
       { required: true, message: "请输入标题", trigger: "blur" },
       { min: 3, max: 100, message: "长度在 3 到 100 个字符", trigger: "blur" }
     ],
     // 其他验证规则
   });
   
   const submitForm = async () => {
     if (!formRef.value) return;
     await formRef.value.validate((valid, fields) => {
       if (valid) {
         console.log("提交表单:", form);
         // 提交表单逻辑
       } else {
         console.error("表单验证失败:", fields);
       }
     });
   };
   
   const resetForm = () => {
     if (!formRef.value) return;
     formRef.value.resetFields();
   };
   </script>
   ```

### 7.2 列表组件

1. **列表处理**
   - 使用 PureTable 组件替代原有表格
   - 添加搜索、排序和分页功能

2. **示例代码**
   ```vue
   <template>
     <div class="main-container">
       <div class="search-section">
         <el-form :inline="true" :model="searchForm">
           <el-form-item label="关键词">
             <el-input v-model="searchForm.keyword" placeholder="请输入关键词" />
           </el-form-item>
           <el-form-item>
             <el-button type="primary" @click="handleSearch">搜索</el-button>
             <el-button @click="resetSearch">重置</el-button>
           </el-form-item>
         </el-form>
       </div>
       
       <pure-table
         v-loading="loading"
         :data="tableData"
         :columns="columns"
         :pagination="{ 
           total, 
           currentPage: queryParams.page,
           pageSize: queryParams.limit 
         }"
         @page-change="handlePageChange"
       >
         <!-- 自定义插槽 -->
       </pure-table>
     </div>
   </template>
   
   <script setup lang="ts">
   // 实现逻辑
   </script>
   ```

### 7.3 富文本编辑器

1. **编辑器选择**
   - 使用 vue-pure-admin 推荐的编辑器
   - 添加图片上传和格式控制

2. **适配代码**
   ```vue
   <template>
     <div class="editor-container">
       <Tinymce
         v-model="content"
         :height="400"
         :upload-handler="handleUpload"
       />
     </div>
   </template>
   
   <script setup lang="ts">
   import { ref } from "vue";
   import { Tinymce } from "@/components/ReEditor";
   
   const content = ref("");
   
   const handleUpload = async (file: File) => {
     // 实现图片上传逻辑
   };
   </script>
   ```

## 8. 多环境配置

### 8.1 环境变量配置

1. **创建环境文件**
   - .env.development
   - .env.production
   - .env.test

2. **配置内容**
   ```
   # .env.development
   VITE_BASE_API=/api/v1
   VITE_USE_MOCK=true
   
   # .env.production
   VITE_BASE_API=https://api.example.com/api/v1
   VITE_USE_MOCK=false
   ```

### 8.2 API 基础路径配置

调整 HTTP 请求配置，使用环境变量中的 API 基础路径：

```typescript
// src/utils/http/index.ts
// 在创建 axios 实例时使用环境变量
const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
  timeout: 15000,
  // 其他配置
});
```

## 9. 调试与测试技巧

### 9.1 TypeScript 类型调试

- 使用 VSCode 的类型提示功能
- 添加临时的 `// @ts-ignore` 注释解决紧急问题
- 使用 `console.log` 输出类型信息

### 9.2 组件测试

- 单独测试每个迁移的组件
- 测试表单提交和数据流程
- 验证权限控制逻辑

### 9.3 API 接口测试

- 使用浏览器开发工具监控网络请求
- 验证请求和响应格式
- 检查错误处理逻辑 
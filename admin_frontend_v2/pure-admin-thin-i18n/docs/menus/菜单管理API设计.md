# 菜单管理API设计

## 概述

本文档详细描述菜单管理功能的API设计，包括API模块结构、接口定义、参数说明和响应格式。菜单管理API将基于项目现有的HTTP请求工具封装，提供完整的菜单CRUD操作支持。

## API模块设计

菜单管理API模块将创建在 `src/api/modules/menu.ts` 文件中，提供以下功能：

1. 获取菜单列表
2. 获取菜单树形结构
3. 创建菜单
4. 更新菜单
5. 删除菜单
6. 切换菜单状态

## API接口定义

### 1. 获取菜单列表

获取分页格式的菜单列表数据。

```typescript
/**
 * 获取菜单列表
 * @param params 查询参数
 */
export function getMenuList(params: MenuListParams = {}) {
  return http.request<PaginationResponse<Menu>>(
    "get",
    "/menus/",
    { params }
  );
}
```

#### 参数定义

```typescript
/**
 * 菜单列表查询参数
 */
export interface MenuListParams {
  search?: string;       // 搜索关键词
  is_active?: boolean;   // 菜单状态
  page?: number;         // 页码
  page_size?: number;    // 每页条数
}
```

#### 响应格式

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "count": 10,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "name": "dashboard",
        "code": "dashboard",
        "path": "/dashboard",
        "component": "layout/Dashboard",
        "redirect": null,
        "title": "仪表盘",
        "icon": "dashboard",
        "extra_icon": null,
        "rank": 1,
        "show_link": true,
        "show_parent": true,
        "roles": ["admin"],
        "auths": [],
        "keep_alive": false,
        "frame_src": null,
        "frame_loading": true,
        "hidden_tag": false,
        "dynamic_level": null,
        "active_path": null,
        "transition_name": null,
        "enter_transition": null,
        "leave_transition": null,
        "parent_id": null,
        "is_active": true,
        "remarks": "系统仪表盘",
        "created_at": "2023-01-01T08:00:00+08:00",
        "updated_at": "2023-01-01T08:00:00+08:00"
      },
      // 更多菜单项...
    ]
  }
}
```

### 2. 获取菜单树形结构

获取树形结构的菜单数据，便于前端渲染。

```typescript
/**
 * 获取菜单树形结构
 */
export function getMenuTree() {
  return http.request<ApiResponse<MenuTree[]>>(
    "get",
    "/menus/tree/"
  );
}
```

#### 响应格式

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "dashboard",
      "code": "dashboard",
      "path": "/dashboard",
      "component": "layout/Dashboard",
      "redirect": null,
      "title": "仪表盘",
      "icon": "dashboard",
      // ...其他字段
      "parent_id": null,
      "is_active": true,
      "children": [
        {
          "id": 2,
          "name": "dashboard_overview",
          "code": "dashboard_overview",
          "path": "/dashboard/overview",
          // ...其他字段
          "parent_id": 1,
          "is_active": true,
          "children": []
        }
      ]
    },
    // 更多菜单项...
  ]
}
```

### 3. 获取单个菜单详情

获取单个菜单的详细信息。

```typescript
/**
 * 获取菜单详情
 * @param id 菜单ID
 */
export function getMenuDetail(id: number) {
  return http.request<ApiResponse<Menu>>(
    "get",
    `/menus/${id}/`
  );
}
```

#### 响应格式

```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "id": 1,
    "name": "dashboard",
    "code": "dashboard",
    "path": "/dashboard",
    "component": "layout/Dashboard",
    "redirect": null,
    "title": "仪表盘",
    "icon": "dashboard",
    // ...其他字段
    "is_active": true
  }
}
```

### 4. 创建菜单

创建新的菜单项。

```typescript
/**
 * 创建菜单
 * @param data 菜单数据
 */
export function createMenu(data: MenuCreateUpdateParams) {
  return http.request<ApiResponse<Menu>>(
    "post",
    "/menus/",
    { data }
  );
}
```

#### 参数定义

```typescript
/**
 * 创建/更新菜单请求参数
 */
export interface MenuCreateUpdateParams {
  name: string;              // 路由名称
  code: string;              // 菜单标识码
  path: string;              // 路由路径
  component: string;         // 组件路径
  redirect?: string;         // 重定向路径
  title?: string;            // 菜单标题
  icon?: string;             // 菜单图标
  extra_icon?: string;       // 额外图标
  rank?: number;             // 菜单排序
  show_link?: boolean;       // 是否在菜单中显示
  show_parent?: boolean;     // 是否显示父级菜单
  roles?: string[];          // 页面级别权限设置
  auths?: string[];          // 按钮级别权限设置
  keep_alive?: boolean;      // 是否缓存该路由页面
  frame_src?: string;        // iframe链接地址
  frame_loading?: boolean;   // iframe是否开启首次加载动画
  hidden_tag?: boolean;      // 禁止添加到标签页
  dynamic_level?: number;    // 标签页最大数量
  active_path?: string;      // 激活菜单的路径
  transition_name?: string;  // 页面动画名称
  enter_transition?: string; // 进场动画
  leave_transition?: string; // 离场动画
  parent_id?: number;        // 父菜单ID
  is_active?: boolean;       // 是否激活
  remarks?: string;          // 备注
}
```

### 5. 更新菜单

更新现有菜单项。

```typescript
/**
 * 更新菜单
 * @param id 菜单ID
 * @param data 菜单数据
 */
export function updateMenu(id: number, data: MenuCreateUpdateParams) {
  return http.request<ApiResponse<Menu>>(
    "put",
    `/menus/${id}/`,
    { data }
  );
}
```

### 6. 删除菜单

删除指定的菜单项。

```typescript
/**
 * 删除菜单
 * @param id 菜单ID
 */
export function deleteMenu(id: number) {
  return http.request<ApiResponse<any>>(
    "delete",
    `/menus/${id}/`
  );
}
```

### 7. 切换菜单状态

启用或禁用菜单。

```typescript
/**
 * 切换菜单状态
 * @param id 菜单ID
 * @param active 是否激活
 */
export function toggleMenuStatus(id: number, active: boolean) {
  return http.request<ApiResponse<Menu>>(
    "patch",
    `/menus/${id}/toggle_status/`,
    { data: { is_active: active } }
  );
}
```

## 类型定义

菜单相关的TypeScript接口定义将放在 `src/types/menu.ts` 文件中：

```typescript
/**
 * 菜单项接口
 */
export interface Menu {
  id: number;               // 菜单ID
  name: string;             // 路由名称
  code: string;             // 菜单标识码
  path: string;             // 路由路径
  component: string;        // 组件路径
  redirect: string | null;  // 重定向路径
  title: string;            // 菜单标题
  icon: string | null;      // 菜单图标
  extra_icon: string | null;// 额外图标
  rank: number;             // 菜单排序
  show_link: boolean;       // 是否在菜单中显示
  show_parent: boolean;     // 是否显示父级菜单
  roles: string[];          // 页面级别权限设置
  auths: string[];          // 按钮级别权限设置
  keep_alive: boolean;      // 是否缓存该路由页面
  frame_src: string | null; // iframe链接地址
  frame_loading: boolean;   // iframe是否开启首次加载动画
  hidden_tag: boolean;      // 禁止添加到标签页
  dynamic_level: number | null; // 标签页最大数量
  active_path: string | null;   // 激活菜单的路径
  transition_name: string | null;  // 页面动画名称
  enter_transition: string | null; // 进场动画
  leave_transition: string | null; // 离场动画
  parent_id: number | null;  // 父菜单ID
  is_active: boolean;        // 是否激活
  remarks: string | null;    // 备注
  created_at: string;        // 创建时间
  updated_at: string;        // 更新时间
}

/**
 * 树形菜单接口
 */
export interface MenuTree extends Menu {
  children: MenuTree[];     // 子菜单
}

/**
 * 菜单列表查询参数
 */
export interface MenuListParams {
  search?: string;          // 搜索关键词
  is_active?: boolean;      // 菜单状态
  page?: number;            // 页码
  page_size?: number;       // 每页条数
}

/**
 * 创建/更新菜单请求参数
 */
export interface MenuCreateUpdateParams {
  name: string;              // 路由名称
  code: string;              // 菜单标识码
  path: string;              // 路由路径
  component: string;         // 组件路径
  redirect?: string;         // 重定向路径
  title?: string;            // 菜单标题
  icon?: string;             // 菜单图标
  extra_icon?: string;       // 额外图标
  rank?: number;             // 菜单排序
  show_link?: boolean;       // 是否在菜单中显示
  show_parent?: boolean;     // 是否显示父级菜单
  roles?: string[];          // 页面级别权限设置
  auths?: string[];          // 按钮级别权限设置
  keep_alive?: boolean;      // 是否缓存该路由页面
  frame_src?: string;        // iframe链接地址
  frame_loading?: boolean;   // iframe是否开启首次加载动画
  hidden_tag?: boolean;      // 禁止添加到标签页
  dynamic_level?: number;    // 标签页最大数量
  active_path?: string;      // 激活菜单的路径
  transition_name?: string;  // 页面动画名称
  enter_transition?: string; // 进场动画
  leave_transition?: string; // 离场动画
  parent_id?: number;        // 父菜单ID
  is_active?: boolean;       // 是否激活
  remarks?: string;          // 备注
}
```

## 错误处理

API模块将使用项目现有的错误处理机制，包括：

1. HTTP错误处理
2. 业务逻辑错误处理
3. 超时和网络错误处理

错误将通过Promise的reject方式抛出，并包含适当的错误信息。

## 日志记录

所有API请求将使用项目的日志工具记录请求和响应信息，便于调试和问题排查：

```typescript
import logger from "@/utils/logger";

// 日志记录示例
logger.debug("API请求: 获取菜单列表", params);
```

## 国际化支持

错误消息和提示信息将支持国际化：

```typescript
import { useI18n } from "vue-i18n";
const { t } = useI18n();

ElMessage.error(t("menu.fetchFailed"));
```

## 安全考虑

1. 所有请求都需要JWT认证
2. 敏感操作(创建、更新、删除)需要超级管理员权限
3. 参数验证在前端和后端都会进行

## 示例用法

```typescript
// 在组件中使用
import { getMenuList, createMenu, updateMenu, deleteMenu } from "@/api/modules/menu";

// 获取菜单列表
async function fetchMenus() {
  try {
    const response = await getMenuList({ page: 1, page_size: 10 });
    if (response.success) {
      menus.value = response.data.results;
    }
  } catch (error) {
    console.error("获取菜单失败", error);
  }
}

// 创建菜单
async function addMenu(menuData) {
  try {
    const response = await createMenu(menuData);
    if (response.success) {
      ElMessage.success("创建菜单成功");
      // 刷新菜单列表
      fetchMenus();
    }
  } catch (error) {
    console.error("创建菜单失败", error);
  }
} 
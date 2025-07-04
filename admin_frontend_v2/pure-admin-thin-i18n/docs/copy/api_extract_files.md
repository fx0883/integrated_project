# API文件提取列表

本文档列出需要从当前项目提取到另一个项目的所有API相关文件。这些文件组成了一个完整的API调用系统，包括HTTP请求、认证、错误处理和日志记录等功能。

## 提取文件列表

### 核心API文件

| 类别 | 文件路径 | 说明 |
|------|----------|------|
| API入口 | `src/api/routes.ts` | 定义API路由 |
| API入口 | `src/api/user.ts` | 用户认证相关API |

### API模块文件

| 类别 | 文件路径 | 说明 |
|------|----------|------|
| API模块 | `src/api/modules/adminUser.ts` | 管理员用户API |
| API模块 | `src/api/modules/cms.ts` | 内容管理系统API |
| API模块 | `src/api/modules/menu.ts` | 菜单管理API |
| API模块 | `src/api/modules/tenant.ts` | 租户管理API |
| API模块 | `src/api/modules/user.ts` | 用户管理API |
| API模块 | `src/api/modules/tenantManagement.ts` | 租户管理相关API |

### HTTP和认证工具

| 类别 | 文件路径 | 说明 |
|------|----------|------|
| HTTP工具 | `src/utils/http/index.ts` | HTTP请求工具核心实现 |
| HTTP工具 | `src/utils/http/types.d.ts` | HTTP请求相关类型定义 |
| 认证工具 | `src/utils/auth.ts` | Token管理工具 |

### 辅助工具

| 类别 | 文件路径 | 说明 |
|------|----------|------|
| 日志工具 | `src/utils/logger.ts` | API请求日志记录工具 |
| 消息工具 | `src/utils/message.ts` | 消息提示工具 |
| 进度条 | `src/utils/progress/index.ts` | 请求进度条实现 |

### 类型定义

| 类别 | 文件路径 | 说明 |
|------|----------|------|
| 类型定义 | `src/types/api.ts` | API响应通用类型定义 |
| 类型定义 | `src/types/user.ts` | 用户相关类型定义 |
| 类型定义 | `src/types/menu.ts` | 菜单相关类型定义 |
| 类型定义 | `src/types/tenant.ts` | 租户相关类型定义 |
| 类型定义 | `src/types/adminUser.ts` | 管理员用户类型定义 |
| 类型定义 | `src/types/cms.ts` | CMS内容类型定义 |

## 依赖关系

这些文件之间存在复杂的依赖关系：

1. API模块文件依赖于HTTP工具
2. HTTP工具依赖于认证工具、日志工具和消息工具
3. 所有文件都依赖于各自的类型定义

提取这些文件时，需要确保所有依赖都被正确处理，并在新项目中安装相应的第三方依赖包（例如axios、js-cookie等）。

## 第三方依赖

提取的API系统依赖于以下第三方库：

- `axios` - HTTP请求客户端
- `js-cookie` - Cookie管理
- `qs` - 请求参数序列化
- `nprogress` - 进度条
- `element-plus` (仅消息提示部分)

在新项目中需要安装这些依赖，或者替换为等效的实现。 
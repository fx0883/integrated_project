<h1>vue-pure-admin精简版（国际化版本）</h1>

[![license](https://img.shields.io/github/license/pure-admin/vue-pure-admin.svg)](LICENSE)

**中文** | [English](./README.en-US.md)

## 介绍

精简版是基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 提炼出的架子，包含主体功能，更适合实际项目开发，打包后的大小在全局引入 [element-plus](https://element-plus.org) 的情况下仍然低于 `2.3MB`，并且会永久同步完整版的代码。开启 `brotli` 压缩和 `cdn` 替换本地库模式后，打包大小低于 `350kb`

## 版本选择

当前是国际化版本，如果您需要非国际化版本 [请点击](https://github.com/pure-admin/pure-admin-thin)

## 配套视频

[点我查看 UI 设计](https://www.bilibili.com/video/BV17g411T7rq)  
[点我查看快速开发教程](https://www.bilibili.com/video/BV1kg411v7QT)

## 配套保姆级文档

[点我查看 vue-pure-admin 文档](https://pure-admin.cn/)  
[点我查看 @pureadmin/utils 文档](https://pure-admin-utils.netlify.app)

## 高级服务

[点我查看详情](https://pure-admin.cn/pages/service/)

## 预览

[查看预览](https://pure-admin-thin.netlify.app/#/login)

## 维护者

[xiaoxian521](https://github.com/xiaoxian521)

## ⚠️ 注意

精简版不接受任何 `issues` 和 `pr`，如果有问题请到完整版 [issues](https://github.com/pure-admin/vue-pure-admin/issues/new/choose) 去提，谢谢！

## 许可证

[MIT © 2020-present, pure-admin](./LICENSE)

## 项目修改记录

### 2023-11-01 API封装与Token处理机制优化

#### 本次会话的主要目标
优化API请求与Token处理机制，实现静默刷新Token和请求自动重试功能，解决Token过期时页面刷新和用户交互中断问题。

#### 已完成的具体任务
1. 创建了API类型定义文件，统一管理API响应格式
2. 修改了HTTP请求工具，实现静默刷新Token和请求重试功能
3. 更新了用户API文件，使用新的API类型定义
4. 修改了用户存储模块，适配新的Token处理方式
5. 创建了实施步骤文档，指导如何测试修改

#### 采用的技术方案及决策理由
- **Token存储方式**：同时使用localStorage和cookie存储Token，以兼容现有代码
- **静默刷新Token**：当收到401响应时，自动尝试刷新Token，无需用户交互
- **请求重试机制**：刷新Token成功后，自动重试失败的请求，无需刷新页面
- **统一错误处理**：统一处理API错误响应，提供友好的错误提示

#### 使用的主要技术栈
- Vue 3
- Pinia
- Axios
- TypeScript

#### 变更的文件清单
1. `/src/types/api.ts` (新增)
2. `/src/api/user.ts` (修改)
3. `/src/utils/http/index.ts` (修改)
4. `/src/store/modules/user.ts` (修改)
5. `/docs/API封装与Token处理修改计划.md` (新增)
6. `/docs/实施步骤.md` (新增)

### 2023-12-15 项目文档生成

#### 本次会话的主要目标
为项目生成全面详细的文档，包括项目概述、技术详解、开发指南和API接口文档，提高项目的可维护性和开发效率。

#### 已完成的具体任务
1. 创建了项目概述文档，全面介绍项目架构和功能
2. 编写了技术详解文档，深入解析核心技术实现
3. 制作了开发指南，包含环境搭建、开发、构建和部署流程
4. 整理了API接口文档，详细说明API封装与使用方法
5. 更新了项目README，添加文档索引

#### 采用的技术方案及决策理由
- **文档分类**：按照不同的关注点将文档分为概述、技术详解、开发指南和API文档四部分
- **详细示例**：每个文档部分都提供了丰富的代码示例和配置说明
- **最佳实践**：总结了项目开发中的最佳实践和常见问题解决方案
- **格式规范**：使用Markdown格式，结构清晰，便于阅读和维护

#### 使用的主要技术栈
- Markdown
- TypeScript
- Vue 3
- Vite
- Element Plus
- Axios

#### 变更的文件清单
1. `/docs/项目概述文档.md` (新增)
2. `/docs/项目技术详解.md` (新增)
3. `/docs/开发指南.md` (新增)
4. `/docs/API文档.md` (新增)
5. `/README.md` (更新)

### 2024-07-09 租户图表Dashboard集成

#### 本次会话的主要目标
将租户相关的三个统计图表（租户数量趋势、租户状态分布、租户创建速率）集成到管理控制台Dashboard中，提供数据可视化和筛选功能。

#### 已完成的具体任务
1. 启用了ECharts库，并创建了图表相关钩子函数
2. 开发了三个主要图表组件：趋势图、状态分布图、创建速率图
3. 实现了日期范围和周期筛选功能
4. 创建了统计数据汇总卡片
5. 完成了国际化支持和错误处理
6. 编写了详细的设计文档和实施方案

#### 采用的技术方案及决策理由
- **组件化设计**：将图表和筛选功能拆分为多个可复用组件
- **响应式设计**：确保在各种屏幕尺寸下都能正常显示
- **统一数据流**：使用容器组件统一管理数据和状态
- **性能优化**：实现数据缓存和按需渲染，提高性能
- **错误处理**：完善的错误处理和友好的UI提示

#### 使用的主要技术栈
- Vue 3
- TypeScript
- ECharts
- Element Plus
- Dayjs
- Axios

#### 变更的文件清单
1. `/src/main.ts` (修改：启用ECharts)
2. `/src/hooks/useChart.ts` (新增：ECharts辅助钩子)
3. `/src/types/tenant.ts` (新增：租户图表类型定义)
4. `/src/api/modules/tenant.ts` (新增：租户API请求模块)
5. `/src/components/Dashboard/*` (新增：多个图表相关组件)
6. `/src/views/dashboard/index.vue` (修改：集成租户图表)
7. `/locales/zh-CN.yaml` 和 `/locales/en.yaml` (修改：添加国际化文本)
8. `/docs/dashboard/*` (新增：租户图表设计和实施文档)

## 会话总结 2023-05-14

### 本次会话的主要目标
为租户图表API集成添加全面的调试日志功能，实现API请求、响应和图表操作的详细日志记录，便于问题排查和性能监控。

### 已完成的具体任务
1. 创建了专用的日志记录模块：`src/utils/logger.ts`，支持不同日志级别、颜色标识和格式化输出
2. 对HTTP请求处理模块进行了增强，添加了请求和响应日志记录
3. 在租户API模块添加了API调用参数和结果的详细日志记录
4. 为所有租户图表组件添加了生命周期和数据变化的调试日志
5. 优化了图表钩子函数，添加了图表初始化、更新和错误处理的日志记录

### 采用的技术方案及决策理由
- **集中式日志模块设计**：创建独立的日志工具而非修改各处现有代码，避免侵入性修改
- **按照功能分层添加日志**：HTTP层、API层、组件层均有不同级别的日志，便于追踪问题
- **使用唯一标识符**：为每个图表实例生成唯一ID，便于在复杂界面中追踪特定图表的行为
- **格式化对象输出**：优化复杂对象的序列化展示，避免日志过于冗长或出现循环引用问题
- **灵活的日志级别控制**：支持动态调整日志级别，便于在开发和生产环境中进行不同级别的调试

### 使用的主要技术栈
- Vue 3 组合式API
- TypeScript
- ECharts
- Axios

### 变更的文件清单
1. `src/utils/logger.ts`（新增）- 核心日志工具模块
2. `src/utils/http/index.ts`（修改）- HTTP请求模块日志增强
3. `src/api/modules/tenant.ts`（修改）- 租户API模块日志增强
4. `src/hooks/useChart.ts`（修改）- 图表钩子日志增强
5. `src/components/Dashboard/TenantCharts.vue`（修改）- 主图表组件日志增强
6. `src/components/Dashboard/Charts/TenantTrendChart.vue`（修改）- 趋势图组件日志增强
7. `src/components/Dashboard/Charts/TenantStatusChart.vue`（修改）- 状态图组件日志增强
8. `src/components/Dashboard/Charts/TenantCreationChart.vue`（修改）- 创建速率图组件日志增强

## 图表组件优化记录 - 2023-11-18

### 本次会话的主要目标
优化 dashboard 中所有图表组件的数据加载流程，实现更合理的初始化和数据获取顺序。

### 已完成的具体任务
1. 创建了新的 `useChartDataFlow` hook，实现正确的图表初始化和数据加载流程
2. 修改了所有图表组件（LoginHeatmapChart、ActiveUsersChart、TenantTrendChart、TenantStatusChart、TenantCreationChart等）
3. 调整了 UserCharts 和 TenantCharts 容器组件，使其适配新的图表组件流程
4. 修改了数据获取函数，使其在图表初始化完成后再调用 API

### 采用的技术方案及决策理由
采用了"先初始化图表再加载数据"的流程，主要解决了以下问题：
1. 解决了由于 DOM 未就绪导致图表初始化失败的问题
2. 使用 MutationObserver 监听 DOM 变化，确保图表容器已完全渲染
3. 实现了图表组件与数据获取的解耦，提高了组件的复用性
4. 通过事件通知机制，实现了父子组件之间的协调

### 使用的主要技术栈
- Vue 3 Composition API
- TypeScript
- ECharts
- MutationObserver API

### 变更的文件清单
1. src/hooks/useChartDataFlow.ts (新增)
2. src/components/Dashboard/Charts/LoginHeatmapChart.vue
3. src/components/Dashboard/Charts/ActiveUsersChart.vue
4. src/components/Dashboard/Charts/TenantTrendChart.vue
5. src/components/Dashboard/Charts/TenantStatusChart.vue
6. src/components/Dashboard/Charts/TenantCreationChart.vue
7. src/components/Dashboard/UserCharts.vue
8. src/components/Dashboard/TenantCharts.vue

## 图表组件DOM未就绪问题修复 (2024-06-14)

### 本次会话的主要目标
解决Dashboard图表组件中的DOM未就绪问题，确保图表正确初始化和渲染。

### 已完成的具体任务
1. 修复了图表组件DOM未就绪问题，解决了控制台中持续显示的"DOM未就绪"错误
2. 改进了图表组件的模板结构，确保图表容器DOM元素始终存在，不受数据加载状态的影响
3. 优化了`useChartDataFlow`钩子的实现，增加了强制初始化选项和更灵活的DOM检测机制
4. 缩短了等待DOM就绪的超时时间，提高了图表初始化的效率
5. 添加了重试机制，确保图表能够在各种情况下正确初始化

### 采用的技术方案及决策理由
1. **DOM结构优化**：将图表容器DOM元素移出条件渲染逻辑，确保其始终存在，解决了循环依赖问题（图表初始化需要DOM就绪，而DOM渲染又依赖于数据加载）
2. **覆盖层设计**：使用绝对定位的覆盖层显示加载状态和无数据状态，而不是替换图表容器
3. **强制初始化选项**：添加forceInit参数，允许在特定情况下跳过DOM就绪检查，直接初始化图表
4. **增强的重试机制**：实现了更健壮的初始化重试逻辑，确保图表能够在各种环境下正确渲染

### 使用的主要技术栈
- Vue 3 组合式API
- ECharts 图表库
- CSS绝对定位和覆盖层
- MutationObserver API

### 变更的文件清单
1. src/hooks/useChartDataFlow.ts
2. src/components/Dashboard/Charts/LoginHeatmapChart.vue
3. src/components/Dashboard/Charts/ActiveUsersChart.vue
4. src/components/Dashboard/Charts/TenantTrendChart.vue
5. src/components/Dashboard/Charts/TenantStatusChart.vue
6. src/components/Dashboard/Charts/TenantCreationChart.vue

## 用户统计图表DOM未就绪问题修复 (2024-06-14)

### 本次会话的主要目标
解决Dashboard中用户统计图表组件的DOM未就绪问题，确保所有图表能够正确初始化和渲染。

### 已完成的具体任务
1. 修复了UserGrowthChart和UserRoleChart组件中的DOM未就绪问题
2. 改进了图表组件的模板结构，确保图表容器DOM元素始终存在，不受数据加载状态的影响
3. 将这两个图表组件迁移到使用useChartDataFlow钩子，与其他图表组件保持一致
4. 修改了UserCharts父组件中的forceReinitCharts函数，使其直接调用子组件方法而不是通过事件触发
5. 优化了组件挂载逻辑，确保DOM有足够时间渲染后再加载数据

### 采用的技术方案及决策理由
1. **DOM结构优化**：将图表容器DOM元素移出条件渲染逻辑，确保其始终存在，解决了循环依赖问题
2. **统一钩子使用**：将所有图表组件迁移到使用同一个useChartDataFlow钩子，保持代码一致性
3. **直接方法调用**：使用组件引用直接调用子组件方法，而不是通过事件通知，提高了代码的可维护性
4. **延迟初始化**：在组件挂载后添加适当的延迟，确保DOM完全渲染后再进行图表初始化

### 使用的主要技术栈
- Vue 3 组合式API
- ECharts 图表库
- CSS绝对定位和覆盖层
- Vue组件间通信（props、events、refs）

### 变更的文件清单
1. src/components/Dashboard/Charts/UserGrowthChart.vue
2. src/components/Dashboard/Charts/UserRoleChart.vue
3. src/components/Dashboard/UserCharts.vue
4. README.md

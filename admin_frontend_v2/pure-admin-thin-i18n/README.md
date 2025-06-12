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

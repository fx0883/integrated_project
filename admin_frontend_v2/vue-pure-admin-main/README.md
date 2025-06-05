<h1>vue-pure-admin</h1>

![GitHub license](https://img.shields.io/github/license/pure-admin/vue-pure-admin?style=flat)
![GitHub stars](https://img.shields.io/github/stars/pure-admin/vue-pure-admin?color=fa6470&style=flat)
![GitHub forks](https://img.shields.io/github/forks/pure-admin/vue-pure-admin?style=flat)

**中文** | [English](./README.en-US.md)

## 简介

`vue-pure-admin` 是一款开源免费且开箱即用的中后台管理系统模版。完全采用 `ECMAScript` 模块（`ESM`）规范来编写和组织代码，使用了最新的 `Vue3`、
`Vite`、`Element-Plus`、`TypeScript`、`Pinia`、`Tailwindcss` 等主流技术开发

## 研发理念

稳定中求创新，技术中见未来

## 精简版本（实际项目开发请用精简版本，提供 `非国际化` 、`国际化` 两个版本选择）

精简版本是基于 [vue-pure-admin](https://github.com/pure-admin/vue-pure-admin) 提炼出的架子，包含主体功能，更适合实际项目开发，打包后的大小在全局引入 [element-plus](https://element-plus.org) 的情况下仍然低于 `2.3MB`，并且会永久同步完整版的代码。开启 `brotli` 压缩和 `cdn` 替换本地库模式后，打包大小低于 `350kb`

[点我查看非国际化精简版本](https://github.com/pure-admin/pure-admin-thin)  
[点我查看国际化精简版本](https://github.com/pure-admin/pure-admin-thin/tree/i18n)

## 配套视频

[点我查看 UI 设计](https://www.bilibili.com/video/BV17g411T7rq)  
[点我查看快速开发教程](https://www.bilibili.com/video/BV1kg411v7QT)

## 配套保姆级文档

[点我查看 vue-pure-admin 文档](https://pure-admin.cn/)  
[点我查看 @pureadmin/utils 文档](https://pure-admin-utils.netlify.app)

## 高级服务

[点我查看详情](https://pure-admin.cn/pages/service/)

## `Tauri` 版本

[点我查看 Tauri 版本](https://github.com/pure-admin/tauri-pure-admin)

## `Electron` 版本

[点我查看 Electron 版本](https://github.com/pure-admin/electron-pure-admin)

## 预览

[点我查看预览](https://pure-admin.github.io/vue-pure-admin)

`PC` 端

<p align="center">
  <img alt="PureAdmin" src="https://xiaoxian521.github.io/hyperlink/img/vue-pure-admin/1.jpg">
  <br />
  <img alt="PureAdmin" src="https://xiaoxian521.github.io/hyperlink/img/vue-pure-admin/2.jpg">
</p>

暗色风格

<p align="center">
  <img alt="PureAdmin" src="https://xiaoxian521.github.io/hyperlink/img/vue-pure-admin/3.jpg">
  <br />
  <img alt="PureAdmin" src="https://xiaoxian521.github.io/hyperlink/img/vue-pure-admin/4.jpg">
</p>

移动端

<p align="center">
  <img alt="PureAdmin" src="https://xiaoxian521.github.io/hyperlink/img/vue-pure-admin/5.jpg">
</p>

### 使用 `Gitpod`

在 `Gitpod`（适用于 `GitHub` 的免费在线开发环境）中打开项目，并立即开始编码.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/pure-admin/vue-pure-admin)

## 安装使用

### 拉取代码

#### 推荐使用 `@pureadmin/cli` 脚手架

<br/>
<img src="https://xiaoxian521.github.io/hyperlink/gif/pure-admin-cli.gif" alt="pure-admin-cli" />

1. 全局安装

```bash
npm install -g @pureadmin/cli
```

2. 交互式选择模板并创建项目

```bash
pure create
```

[点我查看 @pureadmin/cli 脚手架详细用法](https://github.com/pure-admin/pure-admin-cli#pureadmincli)

#### 从 `GitHub` 上拉取

```bash
git clone https://github.com/pure-admin/vue-pure-admin.git
```

#### 从 `Gitee` 上拉取

```bash
git clone https://gitee.com/yiming_chang/vue-pure-admin.git
```

### 安装依赖

```bash
cd vue-pure-admin

pnpm install
```

### 启动平台

```bash
pnpm dev
```

### 项目打包

```bash
pnpm build
```

## Docker 支持

1. 自定义镜像名为 `vue-pure-admin` 的镜像（请注意下面命令末尾有一个点 `.` 表示使用当前路径下的 `Dockerfile` 文件，可根据实际情况指定路径）

```bash
docker build -t vue-pure-admin .
```

2. 端口映射并启动 `docker` 容器（`8080:80`：表示在容器中使用 `80` 端口，并将该端口转发到主机的 `8080` 端口；`pure-admin`：表示自定义容器名；`vue-pure-admin`：表示自定义镜像名）

```bash
docker run -dp 8080:80  --name pure-admin vue-pure-admin
```

操作完上面两个命令后，在浏览器打开 `http://localhost:8080` 即可预览

当然也可以通过 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 可视化界面去操作 `docker` 项目，如下图

<p align="center">
  <img alt="docker-desktop" width="100%" src="https://xiaoxian521.github.io/hyperlink/img/docker-desktop.jpg">
</p>

## 更新日志

[CHANGELOG](./CHANGELOG.zh_CN.md)

## 如何贡献

非常欢迎您的加入！[提一个 Issue](https://github.com/pure-admin/vue-pure-admin/issues/new/choose) 或者提交一个 `Pull Request`

**Pull Request:**

1. Fork 代码!
2. 创建自己的分支: `git checkout -b feat/xxxx`
3. 提交您的修改: `git commit -am 'feat(function): add xxxxx'`
4. 推送您的分支: `git push origin feat/xxxx`
5. 提交`pull request`

## 特别代码贡献

非常感谢你们能深入了解源码并对 `pure-admin` 组织作出优秀贡献 ❤️

|                   **贡献人**                    |                                   **具体代码**                                   |
| :---------------------------------------------: | :------------------------------------------------------------------------------: |
|       [hb0730](https://github.com/hb0730)       |    [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=hb0730)    |
|         [o-cc](https://github.com/o-cc)         |     [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=o-cc)     |
| [yj-liuzepeng](https://github.com/yj-liuzepeng) | [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=yj-liuzepeng) |
|   [skyline523](https://github.com/skyline523)   |  [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=skyline523)  |
| [shark-lajiao](https://github.com/shark-lajiao) | [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=shark-lajiao) |
|      [WitMiao](https://github.com/WitMiao)      |   [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=WitMiao)    |
|     [QFifteen](https://github.com/QFifteen)     |   [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=QFifteen)   |
|      [edgexie](https://github.com/edgexie)      |   [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=edgexie)    |
|       [way-jm](https://github.com/way-jm)       |    [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=way-jm)    |
|   [simple-hui](https://github.com/simple-hui)   |  [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=simple-hui)  |
|   [tinysimple](https://github.com/tinysimple)   |  [代码](https://github.com/pure-admin/vue-pure-admin/commits?author=tinysimple)  |

## `Git` 贡献提交规范

参考 [vue](https://github.com/vuejs/vue/blob/dev/.github/COMMIT_CONVENTION.md) 规范 ([Angular](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular))

- `feat` 增加新功能
- `fix` 修复问题/BUG
- `style` 代码风格相关无影响运行结果的
- `perf` 优化/性能提升
- `refactor` 重构
- `revert` 撤销修改
- `test` 测试相关
- `docs` 文档/注释
- `chore` 依赖更新/脚手架配置修改等
- `workflow` 工作流改进
- `ci` 持续集成
- `types` 类型定义文件更改
- `wip` 开发中

## 浏览器支持

本地开发推荐使用 `Chrome`、`Edge`、`Firefox` 浏览器，作者常用的是最新版 `Chrome` 浏览器  
实际使用中感觉 `Firefox` 在动画上要比别的浏览器更加丝滑，只是作者用 `Chrome` 已经习惯了，看个人爱好选择吧  
更详细的浏览器兼容性支持请看 [Vue 支持哪些浏览器？](https://cn.vuejs.org/about/faq.html#what-browsers-does-vue-support) 和 [Vite 浏览器兼容性](https://cn.vitejs.dev/guide/build#browser-compatibility)

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt=" Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>IE | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt=" Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|                                                                                                不支持                                                                                                |                                                                                              最后两个版本                                                                                              |                                                                                                   最后两个版本                                                                                                    |                                                                                                 最后两个版本                                                                                                  |                                                                                                 最后两个版本                                                                                                  |

## 维护者

[xiaoxian521](https://github.com/xiaoxian521)、[Ten-K](https://github.com/Ten-K)

## 许可证

完全免费开源

[MIT © 2020-present, pure-admin](./LICENSE)

## `Star`

非常感谢留下星星的好心人，感谢您的支持 :heart:

[![Stargazers repo roster for @pure-admin/vue-pure-admin](https://bytecrank.com/nastyox/reporoster/php/stargazersSVG.php?user=pure-admin&repo=vue-pure-admin)](https://github.com/pure-admin/vue-pure-admin/stargazers)

## `Fork`

瞧，那些 `小哥哥` 、`小姐姐` 认真 `学习` 的样子真滴是 `哎呦不错哦` :heart:

[![Forkers repo roster for @pure-admin/vue-pure-admin](https://bytecrank.com/nastyox/reporoster/php/forkersSVG.php?user=pure-admin&repo=vue-pure-admin)](https://github.com/pure-admin/vue-pure-admin/network/members)

## 项目合并总结

### 本次会话的主要目标
完善菜单管理功能，将integrated_admin项目的菜单管理模块集成到vue-pure-admin-main项目中

### 已完成的具体任务
1. 创建了菜单管理模块的API接口，支持菜单的增删改查操作
2. 修改了现有菜单管理页面，使其能够与后端API集成
3. 添加了菜单状态字段，支持菜单的启用/禁用功能
4. 实现了树形结构菜单的过滤和搜索功能

### 采用的技术方案及决策理由
- **API适配层**：创建与integrated_admin兼容的菜单API，便于数据交互
- **数据转换**：实现后端菜单数据与前端组件格式的转换逻辑
- **树形结构处理**：针对菜单的树形特性，实现了专门的递归处理逻辑
- **组件复用**：复用了现有的表单组件，并进行扩展以支持新增字段

### 使用的主要技术栈
- Vue 3 Composition API
- TypeScript
- Element Plus UI
- Vue Router
- 树形数据处理

### 变更的文件清单
1. `src/api/menu.ts` - 新增菜单API模块
2. `src/views/system/menu/utils/hook.tsx` - 更新菜单管理钩子函数
3. `src/views/system/menu/form.vue` - 添加菜单状态字段
4. `src/views/system/menu/utils/types.ts` - 更新菜单表单类型定义

## 项目清理记录

### 2023-10-20 清理无关代码

- 删除了与业务逻辑无关的视图目录，仅保留核心业务模块（dashboard、cms、user、check、tenant）和必要的系统页面（login、error）
- 删除了与业务逻辑无关的路由模块文件，仅保留核心业务模块路由和必要的系统路由
- 修改了路由配置文件，移除了自动导入所有路由模块的逻辑，改为显式导入业务相关模块
- 优化了项目结构，减少了不必要的代码文件，提高了项目的可维护性和加载性能

## API调用日志记录优化

### 本次会话的主要目标
优化项目的API调用，在所有API请求处添加详细的控制台日志输出，便于开发调试和问题排查。

### 已完成的具体任务
1. 在HTTP请求拦截器中添加请求详情和Token处理过程的日志
2. 在HTTP响应拦截器中添加响应详情的日志
3. 在HTTP通用请求方法中添加请求和响应信息的日志
4. 在HTTP GET和POST方法中添加特定请求类型的日志
5. 在响应格式化逻辑中添加响应数据处理过程的日志
6. 在错误处理逻辑中添加错误信息的日志
7. 在Token刷新和请求重试过程中添加完整流程的日志

### 采用的技术方案及决策理由
- **分层日志记录**：在HTTP请求的各个环节添加日志，确保整个请求流程可跟踪
- **统一日志格式**：为不同类型的日志制定统一的格式，使日志易于识别和分析
- **详细错误信息**：对错误情况进行详细记录，包括完整的错误对象和状态信息
- **请求参数记录**：记录请求的URL、方法、参数和数据，便于复现问题
- **Token处理流程记录**：详细记录Token的处理过程，包括过期检测、刷新和重试

### 使用的主要技术栈
- Axios请求拦截器和响应拦截器
- JavaScript Console API
- Promise链式处理
- Vue 3生态系统

### 变更的文件清单
1. `src/utils/http/index.ts` - 添加请求、响应和Token处理的日志
2. `src/utils/http/response.ts` - 添加响应格式化和错误处理的日志

## 路由错误修复总结

### 问题描述
登录后出现 `Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'findIndex')` 错误，导致异步路由加载失败。

### 修复方案
1. **路由初始化问题修复**：
   - 确保`router.options.routes[0]`和`router.options.routes[0].children`存在
   - 添加根路由(/)作为所有路由的父级
   - 在路由处理函数中添加空值检查和防御性代码

2. **组件路径解析增强**：
   - 改进`addAsyncRoutes`函数中的组件路径查找逻辑
   - 尝试多种可能的路径格式匹配组件
   - 添加找不到组件时的备用空组件

3. **环境配置完善**：
   - 创建`.env.local`文件配置API基础URL和mock服务
   - 在`build/utils.ts`中为环境变量添加默认值
   - 修改`build/plugins.ts`正确处理环境变量

4. **调试支持增强**：
   - 添加详细的路由处理日志
   - 在关键步骤添加错误处理和警告信息
   - 提供本地路由数据作为API失败的备选方案

### 相关文件
- `src/router/utils.ts`
- `src/router/index.ts`
- `src/api/routes.ts`
- `src/views/error/empty.vue`
- `build/plugins.ts`
- `.env.local`

### 使用说明
1. 确保`.env.local`文件中配置了正确的环境变量：
   ```
   VITE_BASE_API=/api
   VITE_USE_MOCK=true
   ```

2. 如果需要禁用mock服务，将`VITE_USE_MOCK`设置为`false`
3. 如果需要修改API基础URL，更改`VITE_BASE_API`的值

## 堆栈溢出错误修复总结

### 问题描述
启动项目时出现 `Uncaught RangeError: Maximum call stack size exceeded` 错误，错误出现在 @pureadmin_utils.js 文件中，可能是由于循环引用导致的堆栈溢出。

### 修复方案
1. **循环引用检测**：
   - 在所有递归处理树结构的函数中添加循环引用检测
   - 使用 `Set` 数据结构追踪已处理过的节点
   - 当检测到循环引用时，跳过该节点或提前返回

2. **深拷贝处理**：
   - 在 `handleTree` 函数中使用 `JSON.parse(JSON.stringify())` 对输入数据进行深拷贝
   - 避免对原始数据的修改，防止意外创建循环引用

3. **健壮性增强**：
   - 添加更多空值检查，如 `Array.isArray()` 检查
   - 优化递归终止条件，确保在各种边缘情况下都能正确返回
   - 添加详细的警告日志，帮助定位循环引用问题的根源

### 修复的函数
1. `buildHierarchyTree`: 创建层级关系时检测循环引用
2. `extractPathList`: 提取菜单路径时检测循环引用
3. `deleteChildren`: 删除子节点时检测循环引用
4. `getNodeByUniqueId`: 查找节点时检测循环引用并优化搜索逻辑
5. `appendFieldByUniqueId`: 追加字段时检测循环引用
6. `handleTree`: 构造树型结构时添加深拷贝和循环引用检测

### 额外配置
创建 `.env.development.local` 文件，添加 `VITE_MAX_RECURSION_DEPTH=100` 配置项，为递归操作设置深度限制，增强开发环境下的错误排查能力。

## API响应循环引用修复总结

### 问题描述
项目启动时出现 `Uncaught RangeError: Maximum call stack size exceeded` 错误，错误出现在 @pureadmin_utils.js 文件中，与API响应处理相关。根据错误堆栈信息，问题出在处理API返回数据时的循环引用问题。

### 修复方案
1. **安全深拷贝工具**：
   - 创建了 `safeDeepClone` 函数处理循环引用问题
   - 实现了 `safeStringify` 和 `safeParse` 安全序列化工具
   - 添加了最大递归深度限制，防止堆栈溢出

2. **HTTP请求响应处理改造**：
   - 修改 `formatResponse` 函数，使用安全深拷贝函数
   - 为API请求、响应和错误处理添加错误捕获
   - 使用 `safeStringify` 输出日志，避免循环引用引起的错误

3. **表格数据处理工具**：
   - 添加 `tableHelper.ts` 工具，专门处理表格数据的安全问题
   - 实现 `hasCircularReference` 检测函数
   - 添加 `safeTableData` 函数处理表格数据，即使有循环引用也能正常显示

### 相关文件
- `src/utils/common.ts`: 新增安全深拷贝工具函数
- `src/utils/http/response.ts`: 修改API响应格式化逻辑
- `src/utils/http/index.ts`: 修改请求和响应拦截器
- `src/utils/tableHelper.ts`: 新增表格数据安全处理工具

### 环境变量配置
添加了以下环境变量，用于控制安全处理功能：
```
# 是否启用调试工具函数
DEBUG_UTILS=true

# 是否启用循环引用安全检查
CIRCLE_SAFE=true
```

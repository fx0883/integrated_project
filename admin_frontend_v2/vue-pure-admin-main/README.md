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

## 会话总结：解决租户管理路由匹配错误

### 本次会话的主要目标
修复访问网页时报错 "No match for" 租户管理路由的问题

### 已完成的具体任务
- 分析了路由匹配错误的原因
- 修正了租户模块路由配置中的子路由路径格式
- 改进了路由组件查找逻辑，增加了多种匹配模式
- 在本地mock异步路由数据中添加了租户管理相关路由
- 添加了路由缓存清理逻辑

### 采用的技术方案及决策理由
- 路径格式统一化：将子路由从绝对路径改为相对路径，符合Vue Router的嵌套路由规范
- 组件查找优化：增加多级路径匹配策略，提高组件匹配成功率
- 缓存清理策略：强制刷新路由配置，确保使用最新的路由定义

### 使用的主要技术栈
- Vue 3
- Vue Router
- Vite

### 变更的文件清单
- vue-pure-admin-main/src/router/modules/tenant.ts - 修正路由路径格式
- vue-pure-admin-main/src/api/routes.ts - 添加租户管理本地路由配置
- vue-pure-admin-main/src/router/utils.ts - 改进路由匹配逻辑和缓存处理

## 会话总结：解决CMS统计分析路由匹配错误

### 本次会话的主要目标
修复访问网页时报错 "No match for" CMS统计分析路由的问题

### 已完成的具体任务
- 分析了CMS模块路由匹配错误的原因
- 修正了CMS模块所有路由配置中的路径格式，从绝对路径改为相对路径
- 在本地mock异步路由数据中添加了CMS统计分析相关路由
- 调整了CMS文章管理的redirect路径格式

### 采用的技术方案及决策理由
- 路径格式统一化：将子路由从绝对路径改为相对路径，符合Vue Router的嵌套路由规范
- 确保本地mock数据与静态路由配置一致：避免前后端路由结构不一致导致的匹配错误
- 正确设置redirect路径：确保重定向路径与子路由路径格式匹配

### 使用的主要技术栈
- Vue 3
- Vue Router
- Vite

### 变更的文件清单
- vue-pure-admin-main/src/router/modules/cms.ts - 修正路由路径格式
- vue-pure-admin-main/src/api/routes.ts - 添加CMS统计分析路由配置

## 会话总结：解决CMS分类管理路由匹配错误

### 本次会话的主要目标
修复启动首页时报错 "No match for" CMS分类管理路由的问题

### 已完成的具体任务
- 分析了错误路径"/error/category"与正确组件名"CMSCategory"不匹配的问题
- 在本地mock异步路由数据中添加了CMS分类管理、标签管理和评论管理路由
- 添加了路径冲突检测机制，可自动识别并修复路径冲突
- 实现了基于组件名称的路径修正逻辑，处理错误路径前缀
- 优化了重定向路径生成，支持相对路径和绝对路径混合使用

### 采用的技术方案及决策理由
- 路径冲突检测：通过Map记录所有路径，检测并修复重复注册的路由
- 名称冲突检测：确保路由名称唯一，自动为冲突名称添加时间戳后缀
- 基于名称的路径修正：利用组件名称的命名规则来推断正确的路径前缀
- 智能重定向生成：根据子路由路径格式自动生成正确的重定向URL

### 使用的主要技术栈
- Vue Router
- JavaScript Map和Set数据结构
- 正则表达式
- 字符串处理

### 变更的文件清单
- vue-pure-admin-main/src/api/routes.ts - 添加CMS相关路由配置
- vue-pure-admin-main/src/router/utils.ts - 增强路由处理逻辑，添加冲突检测和路径修正

## 会话总结

### 本次会话的主要目标
解决Vue应用在退出系统时出现的错误:"Cannot read properties of null (reading 'parentNode')"

### 已完成的具体任务
1. 分析了错误日志，定位到问题出现在路由退出导航过程中
2. 修复了lay-content组件中的transitionMain组件插槽处理逻辑
3. 优化了user store中的logout方法，增加延迟导航确保DOM更新完成

### 采用的技术方案及决策理由
1. 在transitionMain组件中增加插槽验证：确保插槽函数存在后再调用，防止空引用
2. 添加onBeforeLeave钩子以处理过渡动画可能引起的DOM问题
3. 在logout方法中使用setTimeout延迟导航，确保DOM更新后再跳转到登录页面

### 使用的主要技术栈
- Vue 3 + Vite
- Vue Router
- Pinia状态管理
- Element Plus组件库

### 变更的文件清单
1. vue-pure-admin-main/src/layout/components/lay-content/index.vue - 修复transition组件插槽处理
2. vue-pure-admin-main/src/store/modules/user.ts - 优化退出登录逻辑

## 本次会话总结 (2024-06-06)

### 本次会话的主要目标
配置超级管理员菜单，包括租户管理、用户管理和菜单管理三个主要模块。

### 已完成的具体任务
1. **菜单管理模块开发**
   - 创建了菜单管理的路由模块 (src/router/modules/menu.ts)
   - 创建了菜单管理的API接口 (src/api/menu.ts)
   - 创建了菜单管理的状态管理模块 (src/store/modules/menu.ts)
   - 创建了菜单管理的视图组件 (src/views/menu/index.vue)
   - 更新了路由配置，添加菜单管理模块 (src/router/index.ts)

2. **超级管理员权限配置**
   - 在菜单路由中添加了角色限制，只有super_admin可以访问菜单管理
   - 确保租户管理、用户管理和菜单管理三个模块对超级管理员可见

### 采用的技术方案及决策理由
1. **菜单管理实现**
   - 参考了原始项目中的菜单管理实现，但使用TypeScript重构
   - 使用树形表格展示菜单层级结构，提供直观的管理界面
   - 添加了菜单的增删改查功能，支持子菜单管理

2. **权限控制**
   - 使用meta.roles字段控制菜单的访问权限
   - 在路由守卫中检查用户角色，确保只有超级管理员可以访问特定页面

3. **API响应处理**
   - 统一处理API响应格式，确保前端组件能正确处理后端返回的数据
   - 添加错误处理和提示，提高用户体验

### 使用的主要技术栈
- Vue 3
- TypeScript
- Element Plus
- Vue Router
- Pinia
- Axios

### 变更的文件清单
1. src/router/modules/menu.ts (新建)
2. src/api/menu.ts (新建)
3. src/store/modules/menu.ts (新建)
4. src/views/menu/index.vue (新建)
5. src/router/index.ts (修改)

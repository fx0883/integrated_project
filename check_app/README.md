# Check App - 打卡系统

基于 uni-app 3.0 框架开发的打卡系统应用，支持 H5、微信小程序和 App 三端。使用 Vue 3 组合式 API 和 JavaScript 语言开发。

## 项目简介

本项目是一个综合性打卡系统，支持创建任务、设置打卡类型、记录打卡、查看统计等功能。支持多语言和主题切换。

### 主要功能

- 首页：展示概览和快捷入口
- 任务列表：查看和管理打卡任务
- 创建新任务：设置任务属性和打卡规则
- 打卡类型：管理打卡类型分类
- 创建打卡类型：添加新的打卡类型
- 数据统计：图表展示打卡记录和完成情况
- 个人中心：用户信息和设置

## 技术栈

- uni-app 3.0
- Vue 3（组合式 API）
- JavaScript
- pinia 状态管理
- i18n 国际化

## 项目结构

```
src/
├── assets/           # 静态资源（图片、icon等）
├── components/       # 通用组件
│   ├── common/       # 通用基础组件
│   ├── task/         # 任务相关组件
│   └── category/     # 类型相关组件
├── i18n/             # 国际化语言包
│   ├── index.js      # 国际化入口
│   ├── zh-CN.js      # 中文语言包
│   └── en-US.js      # 英文语言包
├── mock/             # mock 数据
│   ├── user.js       # 用户数据
│   ├── tasks.js      # 任务数据
│   ├── categories.js # 类型数据
│   └── records.js    # 打卡记录数据
├── pages/            # 页面
│   ├── home/         # 首页
│   ├── tasks/        # 任务列表页
│   ├── create_task/  # 创建任务页
│   ├── categories/   # 打卡类型页
│   ├── create_category/ # 创建打卡类型页
│   ├── statistics/   # 数据统计页
│   └── profile/      # 个人中心页
├── store/            # pinia 状态管理
│   ├── index.js      # store 入口
│   ├── user.js       # 用户状态
│   ├── theme.js      # 主题状态
│   └── lang.js       # 语言状态
├── theme/            # 主题色配置
│   ├── index.js      # 主题入口
│   ├── green.js      # 绿色主题
│   ├── blue.js       # 蓝色主题
│   └── orange.js     # 橙色主题
├── utils/            # 工具函数
│   ├── request.js    # 请求封装
│   ├── date.js       # 日期工具
│   └── storage.js    # 本地存储
├── App.vue           # 应用入口组件
├── main.js           # 应用入口文件
├── uni.scss          # 全局样式变量
└── pages.json        # 页面路由配置
```

## 开发说明

### 安装依赖

```bash
npm install
```

### 运行项目

```bash
# 运行到 H5
npm run dev:h5

# 运行到微信小程序
npm run dev:mp-weixin

# 运行到 App（需要 HBuilderX）
npm run dev:app
```

### 构建项目

```bash
# 构建 H5
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin

# 构建 App（需要 HBuilderX）
npm run build:app
```

## Mock 数据说明

项目使用本地 mock 数据模拟后端接口，数据位于 `src/mock/` 目录：

- `user.js`: 用户数据，包括主用户和子用户
- `tasks.js`: 打卡任务数据
- `categories.js`: 打卡类型数据
- `records.js`: 打卡记录数据

## 国际化说明

项目支持中文和英文两种语言，系统启动时会根据用户系统语言自动切换。语言包位于 `src/i18n/` 目录。

## 主题切换说明

项目支持三种主题色：绿色、蓝色和橙色，默认使用绿色主题。
主题配置位于 `src/theme/` 目录，用户可在个人中心页面进行切换，选择会被保存到本地。 
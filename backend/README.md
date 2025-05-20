# 多租户用户管理系统

## 项目介绍

多租户用户管理系统是一个基于Django和Django REST Framework开发的后端应用，用于管理多个租户（组织或客户）及其用户。系统采用共享数据库、共享架构(Shared Database, Shared Schema)的多租户架构模式，通过租户ID字段实现数据隔离。

## 主要功能

- **租户管理**：支持创建、查询、更新和删除租户
- **用户管理**：多级用户角色（超级管理员、租户管理员、普通用户）
- **资源配额**：每个租户有独立的资源配额限制
- **数据隔离**：不同租户之间的数据完全隔离
- **API审计日志**：记录所有API访问，便于问题排查

## 技术栈

- **后端框架**：Django 5.2, Django REST Framework
- **数据库**：MySQL
- **认证方式**：JWT (JSON Web Token)
- **API文档**：Swagger/OpenAPI (drf-spectacular)

## 系统架构

### 多租户隔离

系统通过以下机制实现租户隔离：

1. **TenantMiddleware**：自动设置当前请求的租户上下文
2. **BaseModel**：所有业务模型继承此基类，包含租户外键
3. **TenantManager**：自动根据当前租户上下文过滤查询结果

### 用户角色

系统定义了三种主要角色：

- **超级管理员(SuperAdmin)**：可以管理所有租户和用户
- **租户管理员(TenantAdmin)**：可以管理其所属租户内的用户和数据
- **普通用户(Member)**：只能访问所属租户内的数据

## 项目结构

```
integrated_project/
├── core/                 # 项目核心配置
├── common/               # 公共功能模块
│   ├── authentication/   # 认证相关
│   ├── exceptions/       # 自定义异常
│   ├── middleware/       # 中间件
│   ├── pagination/       # 分页配置
│   └── utils/            # 工具类
├── users/                # 用户模块
│   ├── management/       # 自定义管理命令
│   ├── migrations/       # 数据库迁移
│   ├── urls/             # URL配置
│   └── views/            # 视图函数
├── tenants/              # 租户模块
├── logs/                 # 日志文件
└── media/                # 媒体文件
```

## API接口文档

系统提供了Swagger文档，访问 `/api/v1/docs/` 可以查看完整的API文档。

主要API接口包括：

- 认证API: `/api/v1/auth/`
- 用户管理API: `/api/v1/users/`
- 租户管理API: `/api/v1/tenants/`
- 系统管理API: `/api/v1/common/`

## 配额管理

每个租户有独立的资源配额，包括：

- 最大用户数
- 最大管理员数
- 最大存储空间
- 最大产品数

## 快速开始

### 环境要求

- Python 3.9+
- MySQL 5.7+

### 安装步骤

1. 克隆代码库
   ```bash
   git clone https://github.com/yourusername/integrated_project.git
   cd integrated_project
   ```

2. 创建虚拟环境
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

3. 安装依赖
   ```bash
   pip install -r requirements.txt
   ```

4. 配置环境变量
   复制 `.env.example` 到 `.env` 并修改配置

5. 数据库迁移
   ```bash
   python manage.py migrate
   ```

6. 创建超级管理员
   ```bash
   python manage.py create_super_admin --username admin --password password --email admin@example.com
   ```

7. 启动开发服务器
   ```bash
   python manage.py runserver
   ```

## 部署

### 生产环境配置

1. 修改 `.env` 文件
   ```
   DEBUG=False
   SECRET_KEY=your-secure-key
   ALLOWED_HOSTS=your-domain.com
   ```

2. 配置反向代理（Nginx/Apache）

3. 使用 Gunicorn 或 uWSGI 运行应用

## 贡献

欢迎提交Issue和Pull Request贡献代码。

## 许可证

MIT License 

# 自律打卡小程序

## 关于图标

本项目需要以下图标资源：

### 底部选项卡图标
- 首页图标：`images/tabbar/home.png` 和 `images/tabbar/home-active.png`
- 任务图标：`images/tabbar/tasks.png` 和 `images/tabbar/tasks-active.png`
- 统计图标：`images/tabbar/stats.png` 和 `images/tabbar/stats-active.png`
- 我的图标：`images/tabbar/profile.png` 和 `images/tabbar/profile-active.png`

请将这些图标文件添加到相应目录，或者修改 `app.json` 文件中的路径配置。

目前已临时移除tabBar的图标配置以允许项目运行。

### 其他必需图标
以下图标目录已创建占位符：
- `images/icons/` - 基本操作图标
- `images/icons/category/` - 分类图标
- `images/empty/` - 空状态图标

## 快速启动

为了临时解决图标缺失问题：
1. 我们已经将 `app.json` 中的 tabBar 图标路径移除
2. 创建了必要的图标目录和占位文件

请在正式开发和部署前替换这些图标文件。 
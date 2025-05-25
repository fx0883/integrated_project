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

# 内容管理系统(CMS)

## 会话总结 - CMS应用迁移问题解决记录

### 本次会话的主要目标
解决Django CMS应用的数据库迁移问题，使CMS模块能够正常工作。

### 已完成的具体任务
1. 修复了CMS应用的迁移问题
2. 取消了settings.py中对'cms'应用的注释
3. 删除了根目录下冗余的models.py和admin.py文件
4. 安装了cryptography包，解决MySQL SHA-2认证问题
5. 成功创建并应用了cms应用的迁移文件

### 采用的技术方案及决策理由
1. **迁移冲突解决方案**：删除根目录下的模型文件，保留应用目录内的文件，遵循Django应用结构规范
2. **依赖管理**：安装cryptography包支持MySQL的SHA-2认证，确保数据库连接安全
3. **应用注册**：将cms应用重新添加到INSTALLED_APPS，确保Django能够正确识别应用模型

### 使用的主要技术栈
- Django 5.2
- Django ORM
- MySQL (使用pymysql作为连接器)
- cryptography (提供MySQL SHA-2认证支持)

### 变更的文件清单
- core/settings.py - 取消cms应用注释
- 删除的文件: 根目录的models.py和admin.py
- cms/migrations/0001_initial.py - 新创建的迁移文件 

# 集成项目后端

这是集成项目的后端部分，包含了多个功能模块，提供完整的API支持。

## 项目模块

- **用户管理** - 用户认证、权限管理
- **租户管理** - 多租户支持和隔离
- **打卡系统** - 任务管理、打卡记录、统计分析
- **CMS系统** - 内容管理、文章发布、分类标签管理

## 技术栈

- Django & Django REST Framework
- PostgreSQL数据库
- JWT认证
- OpenAPI文档（drf-spectacular）
- 多租户架构
- 国际化支持

## 本次会话总结

### 本次会话的主要目标
实现CMS系统模块的API接口，包括文章、分类、标签和评论管理功能，确保与项目其他部分集成良好。

### 已完成的具体任务
1. 创建了CMS模块的权限控制系统，支持租户隔离和用户角色权限
2. 实现了全部CMS相关的序列化器，包括文章、分类、标签和评论等
3. 开发了完整的API视图集，包括：
   - 文章管理：CRUD操作、版本控制、统计数据、状态管理
   - 分类管理：CRUD操作、分类树结构
   - 标签管理：CRUD操作、标签组管理、标签使用统计
   - 评论管理：CRUD操作、审核流程、垃圾评论管理
4. 配置了URL路由，将CMS API集成到主项目中
5. 为所有API添加了OpenAPI文档支持

### 采用的技术方案及决策理由
1. **分层架构设计**：将权限、序列化器和视图分离，提高代码可维护性和可测试性
2. **完整的租户隔离**：所有API均支持租户隔离，确保数据安全
3. **版本控制系统**：为文章内容提供版本管理，支持内容变更历史追踪
4. **OpenAPI文档**：使用drf-spectacular提供完整的API文档，便于前端集成
5. **操作日志记录**：记录所有关键操作，提供审计支持
6. **批量操作API**：提供批量删除等功能，优化前端体验

### 使用的主要技术栈
- Django REST Framework - API实现
- drf-spectacular - API文档生成
- django-filter - 复杂过滤查询支持
- 自定义权限类 - 精细化的权限控制
- Django ORM - 数据查询和统计

### 变更的文件清单
1. cms/permissions.py - 新增CMS模块权限控制
2. cms/serializers.py - 新增CMS模块序列化器
3. cms/views.py - 新增CMS模块视图集
4. cms/urls.py - 新增CMS模块URL配置
5. core/urls.py - 更新主URL配置，添加CMS路由 
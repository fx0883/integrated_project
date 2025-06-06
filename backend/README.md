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

# 内容管理系统 (CMS) 模块

## 项目概述

本CMS模块是一个功能完善的内容管理系统，为Django应用提供全面的内容创建、发布、管理和分析功能。系统采用前后端分离架构，后端基于Django REST Framework构建API服务，前端采用Vue.js 3框架构建交互式用户界面。

## 主要功能

- **文章管理**：支持文章的创建、编辑、发布、归档和删除
- **分类与标签**：灵活的内容分类系统，支持多级分类和标签组管理
- **用户权限**：精细的权限控制，支持多种用户角色和权限级别
- **评论系统**：多级评论功能，支持审核、回复和管理
- **数据分析**：全面的内容统计和分析功能，洞察内容表现
- **版本控制**：文章历史版本追踪，支持版本比较和回滚
- **SEO优化**：内置SEO工具，优化内容的搜索引擎表现

## 技术栈

- **后端**：Django 4.2+, Django REST Framework 3.14+
- **数据库**：MySQL 8.0+
- **缓存**：Redis 6.x
- **任务队列**：Celery 5.x
- **前端**：Vue.js 3, Element Plus, Pinia
- **编辑器**：支持Markdown和富文本编辑

## 项目结构

```
cms/
├── models.py          # 数据模型定义
├── serializers.py     # API序列化器
├── views.py           # API视图和接口
├── urls.py            # URL路由配置
├── permissions.py     # 权限控制
├── admin.py           # Django管理界面配置
└── apps.py            # 应用配置
```

## 数据模型

系统包含以下核心数据模型：

- **Article**：文章核心模型
- **Category**：分类模型，支持层级结构
- **Tag/TagGroup**：标签和标签组模型
- **Comment**：评论模型，支持嵌套结构
- **ArticleVersion**：文章版本模型
- **Interaction**：用户互动记录
- **ArticleMeta**：文章元数据
- **ArticleStatistics**：文章统计数据

## API接口

系统提供以下主要API端点：

- `/api/cms/articles/` - 文章管理
- `/api/cms/categories/` - 分类管理
- `/api/cms/tags/` - 标签管理
- `/api/cms/comments/` - 评论管理
- `/api/cms/tag-groups/` - 标签组管理

## 安装与配置

1. 确保已安装所需依赖
2. 在settings中添加'cms'到INSTALLED_APPS
3. 运行数据库迁移
4. 配置URL路由

## 文档

详细文档位于 `docs/cms_system/` 目录：

- `requirements_analysis.md` - 需求分析
- `technology_stack.md` - 技术栈
- `data_model_design.md` - 数据模型设计
- `uiux_design_overview.md` - UI/UX设计
- `project_plan.md` - 项目计划

## 开发状态

项目当前处于第三阶段后期，核心功能已完成，部分高级功能正在开发中。

---

## 会话记录

### 2023-12-20：CMS文档更新

**本次会话的主要目标**：
- 更新CMS系统相关文档，使其与当前代码实现保持一致

**已完成的具体任务**：
- 更新了数据模型设计文档，反映当前所有模型字段
- 更新了技术栈文档，添加了已实现的具体技术细节
- 更新了需求分析文档，标记了已实现和未实现的功能
- 更新了项目计划文档，标记了各阶段的完成状态
- 更新了UI/UX设计文档，标记了已实现的界面组件
- 创建了项目README文档，提供系统概览

**采用的技术方案及决策理由**：
- 采用文档标记系统（✅/⏳）清晰区分已完成和进行中的功能
- 保留原有文档结构，确保与之前的文档保持一致性
- 添加具体实现细节，便于开发团队了解系统当前状态

**使用的主要技术栈**：
- Markdown文档格式
- Django 4.2+和Django REST Framework 3.14+
- 前端Vue.js 3框架

**变更的文件清单**：
- docs/cms_system/data_model_design.md
- docs/cms_system/technology_stack.md
- docs/cms_system/requirements_analysis.md
- docs/cms_system/project_plan.md
- docs/cms_system/uiux_design_overview.md
- README.md 

# 水产养殖系统模块

## 项目概述

水产养殖系统模块是一个专为水产养殖行业设计的综合管理系统，提供池塘管理、水质监测、投喂记录、生长监控、疾病防治等功能，帮助养殖户提高生产效率和管理水平。系统已集成到多租户架构中，通过租户ID字段实现数据隔离。

## 主要功能

- **池塘管理**：记录和管理养殖池塘的基本信息
- **水质监测**：追踪和分析水质参数变化
- **投喂管理**：记录饲料投喂情况
- **生长监控**：跟踪养殖品种的生长情况
- **疾病防治**：记录疾病发生和治疗过程
- **设备管理**：管理养殖相关设备
- **批次管理**：分批次管理养殖过程
- **成本核算**：计算和分析养殖成本
- **销售记录**：管理产品销售情况

## 技术栈

- **后端**：Django, Django REST Framework
- **数据库**：MySQL/PostgreSQL
- **前端**：Vue.js/React
- **移动端**：响应式Web或原生App

## 多租户集成

系统采用共享数据库、共享架构(Shared Database, Shared Schema)的多租户架构模式：

1. 所有表都包含`tenant_id`字段，用于关联到租户表
2. 每个租户只能访问和管理自己的数据
3. 用户通过系统现有的用户管理模块管理，不再单独设计用户表
4. 表中的`created_by`字段关联到系统用户表的ID

## 数据库设计

系统包含13个核心数据表，详细的数据库模型设计文档位于 `@aquaculture_system/aquaculture_database_model.md`。

## 系统线框图

系统的线框图和架构设计位于 `@aquaculture_system/system_wireframe.md`，包含系统架构、模块划分、数据流和用户界面导航结构等内容。

## 本次会话总结

### 主要目标
- 集成水产养殖系统到多租户架构
- 调整数据库模型以支持多租户数据隔离
- 创建系统线框图和架构设计

### 已完成的任务
- 分析了现有的多租户和用户系统架构
- 移除了水产养殖系统中的用户表，使用系统现有的用户管理模块
- 在所有水产养殖相关表中添加了tenant_id字段，实现多租户数据隔离
- 调整了表关系和索引设计，适应多租户架构
- 创建了完整的系统线框图，包括系统架构、模块划分、数据流和用户界面导航
- 更新了数据库模型设计文档

### 采用的技术方案
- 共享数据库、共享架构(Shared Database, Shared Schema)的多租户模式
- 使用租户ID字段实现数据隔离
- 统一的用户管理和认证系统
- 模块化设计，清晰的功能划分
- 完善的权限控制矩阵

### 主要技术栈
- 多租户架构：Django中间件实现租户上下文和数据隔离
- 数据库：MySQL/PostgreSQL，InnoDB存储引擎
- 字符集：utf8mb4
- 认证：JWT (JSON Web Token)

### 变更的文件清单
- 更新文件: @aquaculture_system/aquaculture_database_model.md（移除用户表，添加tenant_id字段）
- 新建文件: @aquaculture_system/system_wireframe.md（系统线框图和架构设计）
- 更新文件: README.md（添加多租户集成信息） 

## 会话记录

### 2025-05-31 菜单权限更新问题修复

#### 本次会话的主要目标
修复管理员菜单权限更新问题，使菜单权限分配按照替换而非添加的方式工作。

#### 已完成的具体任务
- 分析了菜单权限更新API的逻辑问题
- 修改了`AdminMenuViewSet.create`方法，添加了禁用不在`menu_ids`列表中的菜单权限的逻辑
- 更新了`AdminMenuViewSet.get_queryset`方法，使其默认只返回活跃状态的菜单权限

#### 采用的技术方案及决策理由
- 使用`UserMenu.objects.filter(user=user).exclude(menu_id__in=menu_ids).update(is_active=False)`来禁用不在新列表中的菜单权限
- 采用禁用（设置`is_active=False`）而非删除的方式，可以保留历史记录并方便后续恢复
- 在查询时添加`is_active=True`过滤条件，确保只返回当前有效的权限

#### 使用的主要技术栈
- Django REST Framework
- Django ORM事务管理

#### 变更的文件清单
- `menus/views/admin_menu_views.py`
  - 修改了`get_queryset`方法，添加了`is_active=True`过滤条件
  - 修改了`create`方法，添加了禁用不在`menu_ids`列表中的菜单的逻辑 
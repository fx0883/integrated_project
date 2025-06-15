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

# 会话总结记录

## 2025-06-06：实现管理员菜单路由API

### 本次会话的主要目标
实现一个获取管理员菜单的API接口，用于前端动态生成管理员菜单。

### 已完成的具体任务
1. 创建了Config模型，用于存储系统级别的配置信息
2. 实现了管理员菜单路由API（`/api/v1/common/routes/`）
3. 创建了初始化超级管理员菜单配置的命令（`init_super_admin_menu`）
4. 编写了测试用例，验证API的正确性

### 采用的技术方案及决策理由
- 使用Config模型存储菜单配置，便于通过管理界面动态修改
- 实现了RecursiveField序列化器，支持无限层级的菜单结构
- 根据用户角色返回不同的菜单配置，实现权限控制
- 使用JSONField存储菜单结构，提供灵活的数据结构支持

### 使用的主要技术栈
- Django REST Framework
- Django ORM (JSONField)
- Django Management Commands
- Django Testing Framework

### 变更的文件清单
- `common/models.py`：添加Config模型
- `common/admin.py`：注册Config模型到管理界面
- `common/views.py`：添加管理员菜单路由API视图
- `common/urls.py`：添加API路由配置
- `common/management/commands/init_super_admin_menu.py`：创建初始化命令
- `common/tests.py`：添加API测试用例 

## 2023-06-07：优化管理员菜单路由API

### 本次会话的主要目标
- 将管理员菜单路由API从common模块移动到menus模块
- 将Config模型加入Django admin管理界面
- 为API添加OpenAPI/Swagger文档支持

### 已完成的具体任务
- 将`/api/v1/common/routes/` API从common模块移动到menus模块
- 增强了AdminRoutesView视图，支持租户管理员菜单查询
- 通过查询租户菜单表实现了租户管理员的菜单权限控制
- 确认Config模型已正确注册到Django admin
- 为API添加了drf_spectacular支持，完善了API文档

### 采用的技术方案及决策理由
- 将菜单路由API移至menus模块，提高代码组织的逻辑性
- 利用menus模块中的TenantMenu模型，实现租户管理员的菜单权限控制
- 使用drf_spectacular为API添加文档支持，提高API可用性
- 保持与原有API响应格式一致，确保前端兼容性

### 使用的主要技术栈
- Django REST Framework
- drf-spectacular (OpenAPI文档)
- Django ORM
- Django Admin

### 变更的文件清单
- `common/urls.py`：移除AdminRoutesView路由
- `common/views.py`：移除AdminRoutesView及相关序列化器
- `menus/serializers.py`：添加路由相关序列化器
- `menus/views.py`：添加AdminRoutesView视图类
- `menus/urls.py`：添加routes路由
- `README.md`：更新会话记录 

## 2025-06-13：实现租户图表API

### 本次会话的主要目标
基于implementation_plan.md文件，实现租户数据仪表盘图表API，为超级管理员提供系统租户数据的可视化功能。

### 已完成的具体任务
1. 创建了新的charts Django应用
2. 实现了三个租户图表API接口：
   - 租户数量趋势图API：显示系统内租户总数随时间的变化趋势
   - 租户状态分布API：显示不同状态(活跃/暂停/已删除)租户的比例
   - 租户创建速率API：显示每月/每周新增租户数量
3. 添加了必要的权限控制：仅超级管理员可访问图表API
4. 实现了API数据缓存机制，提高系统性能
5. 创建了图表API的测试用例，确保功能正常工作

### 采用的技术方案及决策理由
1. 模块化设计：创建独立的charts应用处理所有图表相关功能，提高代码组织性和可维护性
2. 权限分离：使用自定义权限类IsSuperAdminOnly，确保只有超级管理员可访问敏感数据
3. 数据缓存：利用Django缓存系统缓存图表数据，减少数据库查询，提高API响应速度
4. 通用格式化：通过工具函数统一图表数据格式，确保前端易于集成
5. 数据分期展示：支持按日/周/月/季/年等不同时间粒度展示数据，满足多种分析需求

### 使用的主要技术栈
- Django REST Framework：构建图表API接口
- Django ORM：进行复杂数据查询和聚合
- DRF Spectacular：API文档自动生成
- Django Cache Framework：实现高效的数据缓存
- Django Testing Framework：编写单元测试

### 变更的文件清单
- `charts/utils.py`: 图表数据处理工具函数
- `charts/views.py`: 图表API视图类
- `charts/permissions.py`: 图表API权限控制
- `charts/schema.py`: API文档模式定义
- `charts/urls.py`: URL路由配置
- `charts/tests.py`: API测试用例
- `core/settings.py`: 注册charts应用
- `core/urls.py`: 添加charts应用URL路由 

## 会话总结：修复图表API数据问题 (2023-06-13)

### 本次会话的主要目标
修复租户仪表盘的图表API返回空数据数组的问题。尽管数据库中有租户记录，图表API返回的labels和datasets均为空数组。

### 已完成的具体任务
1. 分析了数据库中的租户数据和时区设置
2. 创建了测试脚本验证数据库中确实存在租户记录
3. 定位了问题根源：Django的日期截断函数(TruncDay/TruncMonth等)在某些数据库配置下可能存在问题
4. 修改了图表API中的日期处理逻辑，使用Python代码手动处理日期分组而不依赖数据库函数
5. 编写了测试脚本验证修复的有效性

### 采用的技术方案及决策理由
- 使用Python的`defaultdict`和日期处理函数手动分组汇总数据，规避了Django ORM中日期截断函数的问题
- 使用`strftime`格式化日期字符串，确保了月份格式的一致性
- 保持了API的接口不变，仅修改了内部实现，确保前端无需做任何更改

### 使用的主要技术栈
- Django REST Framework (API框架)
- Python datetime (日期处理)
- Django ORM (数据查询)
- Python collections.defaultdict (数据分组)

### 变更的文件清单
- charts/views.py - 修改了租户趋势图和租户创建速率图API的实现
- check_tenants.py - 新增测试脚本，用于分析租户数据
- test_charts_api.py - 新增测试脚本，用于验证API修复

### 根本问题分析
图表API返回空数据数组的问题主要是由于Django的日期截断函数(如TruncMonth)在处理数据库日期时的兼容性问题导致。当使用这些函数对数据进行分组时，可能因为数据库时区设置或日期格式的差异，导致查询结果为空。改用Python代码手动处理日期分组解决了这个问题，确保了图表数据正确显示。

## 用户统计分析图表API实现总结

### 本次会话的主要目标
实现用户统计分析图表API，为管理员仪表盘提供用户相关的统计数据可视化支持。

### 已完成的具体任务
1. 实现了用户总量与增长趋势API，支持按日/周/月/季度/年统计
2. 实现了用户角色分布API，展示超级管理员、租户管理员、普通用户的比例
3. 实现了活跃用户统计API，按日/周/月统计活跃用户数量和活跃率
4. 实现了用户登录情况热力图API，展示不同时间段的登录活跃度
5. 编写了完整的单元测试，确保API功能正常
6. 创建了前端集成指南，帮助前端开发人员集成这些API

### 采用的技术方案及决策理由
1. 使用Django REST framework实现API，保持与现有系统的一致性
2. 使用drf-spectacular生成OpenAPI文档，提高API的可发现性和可用性
3. 实现基于权限的访问控制，确保只有超级管理员可以访问这些敏感数据
4. 采用缓存策略提高性能，减少数据库查询
5. 使用统一的响应格式，便于前端处理
6. 支持时间范围参数，提高灵活性和性能

### 使用的主要技术栈
- Django REST framework
- drf-spectacular
- Django ORM
- 缓存机制

### 变更的文件清单
1. charts/schema.py - 添加用户统计图表相关的OpenAPI模式定义
2. charts/utils.py - 添加用户统计图表相关的数据处理函数
3. charts/views.py - 添加用户统计图表相关的API视图
4. charts/urls.py - 添加用户统计图表相关的URL路由
5. charts/tests.py - 添加用户统计图表相关的测试用例
6. docs/admin_dashboard_charts/02_user_statistics_charts_frontend_guide.md - 创建前端集成指南
7. docs/admin_dashboard_charts/user_statistics_charts_summary.md - 创建实现总结文档 

## 会话总结：修复MySQL时区问题 (2023-06-14)

### 本次会话的主要目标
修复活跃用户统计API返回的时区错误问题："Database returned an invalid datetime value. Are time zone definitions for your database installed?"

### 已完成的具体任务
1. 分析了活跃用户统计API的错误原因，确认为MySQL时区配置问题
2. 修改了`charts/utils.py`中的`get_active_users`函数，不再依赖数据库时区功能
3. 创建了`fix_timezone.py`脚本，用于检查和修复MySQL时区表
4. 创建了`fix_mysql_timezone.sql`脚本，用于设置MySQL时区为+08:00
5. 创建了`update_mysql_config.py`工具，用于永久更新MySQL配置文件的时区设置
6. 编写了详细的`timezone_fix_README.md`文档，提供多种解决方案和操作步骤

### 采用的技术方案及决策理由
1. **代码修改方案**：修改`get_active_users`函数，使用Python处理时区而非依赖数据库函数，这是最简单直接的解决方案，无需修改数据库配置
2. **数据库配置方案**：提供了两种修改MySQL时区配置的方法（临时设置和永久设置），适用于需要在数据库级别解决问题的情况
3. **时区表安装方案**：提供了在不同操作系统上安装MySQL时区表的指南，这是最彻底的解决方案

### 使用的主要技术栈
- Django ORM
- Python datetime处理
- MySQL时区配置
- Python文件操作和正则表达式

### 变更的文件清单
1. charts/utils.py - 修改了`get_active_users`函数的实现
2. fix_timezone.py - 新增脚本，用于检查和修复MySQL时区表
3. fix_mysql_timezone.sql - 新增SQL脚本，用于设置MySQL时区
4. update_mysql_config.py - 新增工具，用于更新MySQL配置文件
5. timezone_fix_README.md - 新增文档，详细说明解决方案和操作步骤 

# 用户系统拆分设计

## 会话总结

### 本次会话的主要目标
设计将现有的单一User模型拆分为User和Member两个独立模型的方案，其中User模型只包含超级管理员和租户管理员，Member模型只包含普通成员并保留父子账号关系。

### 已完成的具体任务
1. 创建了完整的用户系统拆分设计文档，包括：
   - 概述文档：系统拆分的背景、需求和方案选择
   - 模型设计文档：详细的模型结构、字段和方法设计
   - 认证系统设计文档：支持两种用户模型的认证机制
   - API设计文档：API端点调整和权限控制方案
   - 数据迁移方案：详细的迁移步骤、注意事项和回滚策略
   - 总结文档：设计方案的优势、挑战和解决方案

### 采用的技术方案及决策理由
采用**共享基类方案**，创建一个抽象基类`BaseUserModel`，User和Member模型继承该基类。选择此方案的原因：
- 减少代码重复，共享基本用户字段和方法
- 统一认证机制，简化用户登录和验证流程
- 简化权限控制，基于用户类型实现细粒度权限
- 便于未来扩展，两个模型可以独立演化

### 使用的主要技术栈
- Django ORM：模型设计和数据库交互
- Django AbstractUser：用户模型基类
- JWT (JSON Web Token)：用户认证
- Django REST Framework：API设计和权限控制
- Django迁移框架：数据迁移

### 变更的文件清单
- docs/member/overview.md：用户系统拆分概述
- docs/member/model_design.md：模型设计文档
- docs/member/auth_design.md：认证系统设计文档
- docs/member/api_design.md：API设计文档
- docs/member/migration_plan.md：数据迁移方案
- docs/member/summary.md：设计方案总结 

# 用户系统拆分迁移记录

## 2025-06-15 用户模型拆分为User和Member

### 本次会话的主要目标
将Django项目中的单一User模型拆分为User和Member两个独立模型，实现不同类型用户的职责分离。

### 已完成的具体任务
1. 创建了BaseUserModel抽象基类，包含所有用户类型共有的字段和方法
2. 修改了User模型，移除is_member字段，添加is_admin字段，仅保留管理员用户
3. 创建了新的Member模型，专门用于普通成员，保留父子账号关系
4. 更新了admin.py，添加了MemberAdmin类用于管理普通成员
5. 创建了三个数据库迁移文件：
   - 0003_create_member_model.py：创建Member模型结构
   - 0004_migrate_member_data.py：将普通成员数据从User表迁移到Member表
   - 0005_cleanup_user_model.py：清理User表中的普通成员数据，移除parent字段

### 采用的技术方案及决策理由
采用了共享基类方案，通过创建抽象基类BaseUserModel实现代码复用。这种方案的优势：
1. 减少代码重复，统一认证机制
2. 简化权限控制，便于未来扩展
3. 保持数据库结构清晰，职责单一

### 使用的主要技术栈
- Django ORM
- Django Admin
- Django数据库迁移系统

### 变更的文件清单
1. users/models.py - 添加BaseUserModel抽象类，修改User模型，添加Member模型
2. users/admin.py - 更新UserAdmin类，添加MemberAdmin类
3. users/migrations/0003_create_member_model.py - 创建Member模型结构
4. users/migrations/0004_migrate_member_data.py - 数据迁移脚本
5. users/migrations/0005_cleanup_user_model.py - 清理脚本 
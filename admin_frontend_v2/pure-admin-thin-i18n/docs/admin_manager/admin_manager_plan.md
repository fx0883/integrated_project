# 管理员用户管理模块实现规划

## 1. 概述

管理员用户管理模块是系统的核心功能之一，用于管理系统中的管理员账号。本文档描述了将该功能集成到现有系统中的详细规划，包括UI设计、API集成、组件开发和权限控制等方面。

## 2. 功能范围

管理员用户管理模块将包含以下核心功能：

- 管理员用户列表与搜索
- 管理员用户详情查看
- 创建管理员用户
- 编辑管理员用户信息
- 删除管理员用户
- 管理员权限管理（授予/撤销超级管理员权限）
- 管理员状态管理（激活/停用）
- 管理员头像上传

## 3. 技术架构

管理员用户管理模块将遵循项目现有的技术架构和模式，主要包括：

- **前端框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **HTTP客户端**：Axios (通过封装的http工具)
- **国际化**：Vue I18n
- **样式**：SCSS + TailwindCSS

## 4. 模块结构

```
src/
├── api/
│   └── modules/
│       └── adminUser.ts            # 管理员用户API封装
├── components/
│   └── AdminUserManagement/
│       ├── AdminUserForm.vue       # 管理员表单组件
│       ├── AdminUserTable.vue      # 管理员表格组件
│       ├── AvatarUpload.vue        # 头像上传组件
│       └── ConfirmDialog.vue       # 确认对话框组件
├── store/
│   └── modules/
│       └── adminUser.ts            # 管理员用户状态管理
├── types/
│   └── adminUser.ts                # 管理员用户类型定义
├── views/
│   └── admin-user/
│       ├── index.vue               # 管理员列表页面
│       ├── create.vue              # 创建管理员页面
│       ├── edit.vue                # 编辑管理员页面
│       └── detail.vue              # 管理员详情页面
└── router/
    └── modules/
        └── adminUser.ts            # 管理员用户路由配置
```

## 5. 菜单与路由配置

需要在超级管理员菜单中添加管理员用户管理相关菜单项：

```json
{
  "meta": {
    "icon": "ep:user",
    "rank": 4,
    "roles": [
      "super_admin"
    ],
    "title": "adminUser.management",
    "showLink": true
  },
  "name": "AdminUserManagement",
  "path": "/admin-user/",
  "children": [
    {
      "meta": {
        "icon": "ep:list",
        "roles": [
          "super_admin"
        ],
        "title": "adminUser.list",
        "showLink": true,
        "keepAlive": true,
        "transition": {
          "name": "fade",
          "enterTransition": "animate__fadeInLeft",
          "leaveTransition": "animate__fadeOutRight"
        }
      },
      "name": "AdminUserList",
      "path": "/admin-user/index",
      "component": "/src/views/admin-user/index"
    },
    {
      "meta": {
        "icon": "ep:plus",
        "roles": [
          "super_admin"
        ],
        "title": "adminUser.create",
        "showLink": false,
        "keepAlive": false,
        "transition": {
          "name": "fade",
          "enterTransition": "animate__fadeInLeft",
          "leaveTransition": "animate__fadeOutRight"
        }
      },
      "name": "AdminUserCreate",
      "path": "/admin-user/create",
      "component": "/src/views/admin-user/create"
    },
    {
      "meta": {
        "icon": "ep:edit",
        "roles": [
          "super_admin"
        ],
        "title": "adminUser.edit",
        "showLink": false,
        "keepAlive": false,
        "transition": {
          "name": "fade",
          "enterTransition": "animate__fadeInLeft",
          "leaveTransition": "animate__fadeOutRight"
        }
      },
      "name": "AdminUserEdit",
      "path": "/admin-user/edit/:id",
      "component": "/src/views/admin-user/edit"
    },
    {
      "meta": {
        "icon": "ep:view",
        "roles": [
          "super_admin"
        ],
        "title": "adminUser.detail",
        "showLink": false,
        "keepAlive": false,
        "transition": {
          "name": "fade",
          "enterTransition": "animate__fadeInLeft",
          "leaveTransition": "animate__fadeOutRight"
        }
      },
      "name": "AdminUserDetail",
      "path": "/admin-user/detail/:id",
      "component": "/src/views/admin-user/detail"
    }
  ],
  "redirect": "/admin-user/index",
  "component": "Layout1"
}
```

## 6. 国际化配置

在`locales/zh-CN.yaml`和`locales/en.yaml`中添加管理员用户管理相关的国际化内容：

```yaml
# 管理员用户管理相关国际化
adminUser:
  management: 管理员用户管理
  list: 管理员用户列表
  create: 创建管理员
  edit: 编辑管理员
  detail: 管理员详情
  delete: 删除管理员
  title: 管理员用户管理
  id: 用户ID
  username: 用户名
  email: 邮箱
  phone: 手机号
  nickName: 昵称
  avatar: 头像
  status: 状态
  roles: 角色
  tenant: 所属租户
  isSuperAdmin: 超级管理员
  isAdmin: 管理员
  createdAt: 创建时间
  lastLogin: 最后登录时间
  lastLoginIp: 最后登录IP
  actions: 操作
  search: 搜索管理员
  password: 密码
  confirmPassword: 确认密码
  # ... 更多国际化内容
```

## 7. 实施步骤

1. **准备阶段**
   - 创建所需的类型定义
   - 封装API调用
   - 配置Pinia状态管理

2. **基础设施建设**
   - 添加路由配置
   - 添加菜单配置
   - 添加国际化内容

3. **组件开发**
   - 开发可复用组件
   - 开发页面组件

4. **集成与测试**
   - 集成API
   - 测试功能
   - 处理边缘情况

5. **完善与优化**
   - 权限控制
   - 用户体验优化
   - 性能优化

## 8. 后续文档

- [UI设计规范](./admin_manager_ui_design.md)
- [API集成指南](./admin_manager_api_guide.md)
- [组件开发指南](./admin_manager_component_guide.md)
- [线框图设计](./admin_manager_wireframes.md) 
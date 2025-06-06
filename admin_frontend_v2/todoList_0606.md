# 租户管理系统迁移待办事项清单

## 项目概述

- **源项目**: integrated_admin（基于Vue 3 + Element Plus）
- **目标项目**: vue-pure-admin-main（基于Vue 3 + Element Plus + TypeScript）
- **迁移目标**: 将integrated_admin的业务逻辑代码移植到vue-pure-admin-main项目中

## 已完成工作

通过代码分析，发现以下模块已经开始迁移：

1. **API接口层**
   - 租户管理API (tenant.js → tenant.ts)
   - 用户管理API (部分迁移)
   - CMS相关API (部分迁移)

2. **视图组件**
   - 租户管理相关页面 (List.vue, Create.vue, Edit.vue → list.vue, form.vue, detail.vue, quota.vue)
   - 用户管理相关页面 (部分迁移，已创建目录结构)
   - CMS模块相关页面 (已创建目录结构)

## 待完成工作

### 1. API接口层迁移

- [ ] **用户管理API完善**
  - 完成user.ts中的所有API接口定义
  - 确保类型定义完整
  
- [ ] **CMS模块API迁移**
  - 完成article.ts的API接口定义
  - 完成category.ts的API接口定义
  - 完成tag.ts的API接口定义
  - 完成comment.ts的API接口定义
  - 完成statistics.ts的API接口定义
  
- [ ] **其他API迁移**
  - 完成menu.ts的API接口定义
  - 完成auth.ts的API接口定义
  - 完成check.ts的API接口定义

### 2. 视图组件迁移

- [ ] **用户管理模块**
  - 完成用户列表页面 (List.vue → list/)
  - 完成用户创建页面 (Create.vue → form/)
  - 完成用户编辑页面 (Edit.vue → form/)
  - 完成用户详情页面 (View.vue → detail/)
  - 完成登录历史页面 (LoginHistory.vue → 待确定位置)
  
- [ ] **CMS模块**
  - 完成文章管理相关页面 (article/)
  - 完成分类管理相关页面 (category/)
  - 完成标签管理相关页面 (tag/)
  - 完成评论管理相关页面 (comment/)
  - 完成统计分析相关页面 (statistics/)
  
- [ ] **其他模块**
  - 完成菜单管理相关页面 (menu/)
  - 完成权限管理相关页面 (auth/)
  - 完成审核管理相关页面 (check/)
  - 完成帮助中心相关页面 (help/)
  - 完成关于页面 (about/)

### 3. 类型定义

- [ ] **完善类型定义文件**
  - 创建/完善tenant相关类型定义
  - 创建/完善user相关类型定义
  - 创建/完善cms相关类型定义
  - 创建/完善menu相关类型定义
  - 创建/完善auth相关类型定义
  - 创建/完善check相关类型定义

### 4. 工具函数迁移

- [ ] **迁移utils目录下的工具函数**
  - 确认request.js中的请求方法与http.ts的兼容性
  - 迁移其他工具函数

### 5. 状态管理

- [ ] **迁移Pinia状态管理**
  - 迁移stores目录下的状态管理逻辑到store目录
  - 适配TypeScript类型

### 6. 路由配置

- [ ] **更新路由配置**
  - 将integrated_admin的路由配置迁移到vue-pure-admin-main
  - 确保路由权限控制正常工作

### 7. 样式与主题

- [ ] **统一样式与主题**
  - 确保迁移后的页面样式与vue-pure-admin-main风格一致
  - 处理可能的样式冲突

### 8. 依赖管理

- [ ] **检查并解决依赖冲突**
  - 确认integrated_admin中使用的第三方库在vue-pure-admin-main中是否已存在
  - 处理版本差异和兼容性问题

### 9. 测试与验证

- [ ] **功能测试**
  - 测试所有迁移的API接口
  - 测试所有迁移的页面功能
  - 验证数据流转与状态管理

- [ ] **UI/UX测试**
  - 确保页面布局和交互符合预期
  - 验证响应式设计

### 10. 文档更新

- [ ] **更新开发文档**
  - 记录迁移过程中的重要决策和变更
  - 更新API接口文档
  - 更新组件使用说明

## 注意事项

1. **TypeScript适配**：源项目使用JavaScript，目标项目使用TypeScript，需要添加适当的类型定义
2. **框架差异**：vue-pure-admin-main使用了更多高级特性和组件，需要适当调整代码结构
3. **依赖管理**：vue-pure-admin-main使用pnpm进行包管理，与源项目可能存在依赖管理差异
4. **样式系统**：vue-pure-admin-main使用了tailwindcss，需要适配原有的CSS样式

## 优先级建议

1. 完成API接口层迁移
2. 完成类型定义
3. 迁移核心业务组件
4. 完成状态管理迁移
5. 处理路由配置
6. 统一样式与主题
7. 测试与验证
8. 文档更新 
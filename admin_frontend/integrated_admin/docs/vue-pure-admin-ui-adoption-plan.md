# Vue-Pure-Admin UI 组件标准化方案

## 1. 目标

确保项目中所有UI组件都按照vue-pure-admin的样式和标准实现，保持统一的视觉风格和交互体验。

## 2. 组件命名规范

遵循vue-pure-admin的组件命名规范：
- 全局通用组件使用`Re`前缀，如`ReIcon`、`ReDialog`等
- 业务组件根据功能命名，使用Pascal命名法，如`UserForm`、`RoleSelect`等
- 页面级组件保持原命名规范

## 3. UI组件分类及实现标准

### 3.1 基础组件

从vue-pure-admin中直接采用的基础组件：

| 组件名 | 说明 | 实现方式 |
| ------ | ---- | ------- |
| ReIcon | 图标组件 | 直接使用vue-pure-admin的实现 |
| ReDialog | 对话框组件 | 直接使用vue-pure-admin的实现 |
| ReSegmented | 分段控制器 | 直接使用vue-pure-admin的实现 |
| ReCol | 列布局组件 | 直接使用vue-pure-admin的实现 |

### 3.2 业务组件

已在`src/components/pure`目录下开始实现的业务组件：

| 组件类别 | 说明 | 命名规范 |
| ------ | ---- | ------- |
| Table | 表格相关组件 | PureTable系列组件 |
| Form | 表单相关组件 | PureForm系列组件 |
| Charts | 图表相关组件 | PureChart系列组件 |

### 3.3 布局组件

布局组件应完全按照vue-pure-admin的实现方式：

- 顶栏组件：顶部导航栏、面包屑、标签页等
- 侧边栏：菜单、导航等
- 内容区：主体内容、卡片、容器等

## 4. CSS样式规范

### 4.1 使用Tailwind CSS优先

- 优先使用Tailwind CSS实现样式，减少自定义CSS的使用
- 使用Element Plus组件时，使用Tailwind CSS覆盖其默认样式

样式实现优先级：
1. Tailwind CSS原子类
2. Element Plus组件属性
3. 自定义CSS（仅当前两者无法满足需求时）

### 4.2 暗黑模式支持

确保所有组件都支持暗黑模式切换：
- 使用CSS变量定义主题颜色
- 遵循Element Plus的暗黑模式切换机制
- 为自定义组件添加`.dark`类样式变体

## 5. 实施步骤

### 5.1 基础组件迁移

1. 从vue-pure-admin中提取核心基础组件
2. 创建`src/components/re`目录存放基础组件
3. 按需引入并注册全局组件

### 5.2 业务组件改造

1. 继续完善`src/components/pure`目录下的业务组件
2. 按照vue-pure-admin的设计风格重构现有业务组件
3. 为每个业务组件创建示例和文档

### 5.3 页面UI升级

1. 优先升级高频使用页面的UI
2. 统一使用Card组件包裹页面内容
3. 应用统一的间距和布局规范

### 5.4 表格标准化

表格组件是后台管理系统的重要部分，需要特别关注：

1. 使用PureTable组件替换所有el-table直接使用
2. 实现统一的表格功能：
   - 列设置
   - 密度调整
   - 全屏切换
   - 刷新功能
   - 导出功能

### 5.5 表单标准化

1. 使用PureForm组件替换直接使用的el-form
2. 统一表单验证规则和交互方式
3. 实现统一的表单布局和响应式处理

## 6. 开发规范

### 6.1 组件使用规范

- 禁止直接使用Element Plus组件，必须通过封装的Pure组件使用
- 页面级组件应专注业务逻辑，UI展示交由Pure组件处理
- 组件属性命名保持与Element Plus一致，便于理解和使用

### 6.2 代码提交规范

- 提交前确保组件符合vue-pure-admin的UI风格
- 组件改造完成后，更新组件文档
- 使用统一的Git提交规范记录UI改造进度

## 7. 工具与资源

### 7.1 参考项目

- pure-admin-thin-ref: vue-pure-admin精简版参考
- pure-admin-ref: vue-pure-admin完整版参考

### 7.2 文档资源

- [vue-pure-admin官方文档](https://pure-admin.github.io/vue-pure-admin)
- [Element Plus官方文档](https://element-plus.org/zh-CN/)
- [Tailwind CSS官方文档](https://tailwindcss.com/docs)

## 8. 验收标准

1. 视觉一致性：与vue-pure-admin模板视觉效果一致
2. 功能完整性：保留原有业务功能，增强UI交互体验
3. 代码规范性：符合命名规范和代码组织结构
4. 兼容性：支持暗黑模式和响应式布局

## 9. 时间规划

| 阶段 | 内容 | 时间 |
| ---- | ---- | ---- |
| 第一阶段 | 基础组件迁移 | 1周 |
| 第二阶段 | 业务组件改造 | 2周 |
| 第三阶段 | 页面UI升级 | 2周 |
| 第四阶段 | 测试和优化 | 1周 | 
# CMS模块国际化完善计划

## 概述

本文档专注于CMS模块的国际化完善工作，详细列出需要添加或优化的国际化翻译项。目前项目支持中文(zh-CN)和英文(en)两种语言，需要确保CMS模块的所有功能在这两种语言下都有完整的翻译支持。

## 国际化现状分析

通过对`locales/zh-CN.yaml`文件的分析，发现CMS模块的国际化翻译存在以下问题：

1. **基本菜单项已翻译**：
   - 已有"内容管理"(cmsManagement)
   - 已有"文章管理"(articleManagement)
   - 已有"评论管理"(commentManagement)
   - 已有"文章创建/编辑/详情"相关翻译

2. **评论管理相关翻译较完整**：
   - 已有评论状态、操作按钮等翻译

3. **缺失或不完整的翻译**：
   - ✅ 分类管理(categoryManagement)相关翻译不完整
   - ✅ 标签管理(tagManagement)相关翻译不完整
   - ✅ 标签组管理相关翻译缺失
   - ✅ 文章版本历史相关翻译缺失
   - ✅ 文章统计数据相关翻译缺失

## 待添加的国际化翻译项

### 1. 分类管理相关翻译

✅ 已完成

```yaml
cms:
  category:
    categoryManagement: 分类管理
    id: 分类ID
    name: 分类名称
    slug: 分类别名
    description: 分类描述
    parent: 父级分类
    level: 层级
    path: 路径
    sortOrder: 排序值
    icon: 图标
    isActive: 状态
    createdAt: 创建时间
    updatedAt: 更新时间
    articleCount: 文章数量
    children: 子分类
    actions: 操作
    search: 搜索分类
    searchPlaceholder: 输入分类名称搜索
    statusActive: 启用
    statusInactive: 禁用
    statusAll: 全部
    noParent: 无父级分类
    rootCategory: 根分类
    createCategory: 创建分类
    editCategory: 编辑分类
    deleteCategory: 删除分类
    confirmDelete: 确认删除分类
    confirmDeleteMessage: 您确定要删除分类"{name}"吗？此操作可能会影响关联的文章。
    deleteSuccess: 删除分类成功
    deleteFailed: 删除分类失败
    createSuccess: 创建分类成功
    createFailed: 创建分类失败
    updateSuccess: 更新分类成功
    updateFailed: 更新分类失败
    nameRequired: 分类名称不能为空
    slugInvalid: 分类别名格式不正确
    dragToSort: 拖拽排序
    updateOrder: 更新排序
    updateOrderSuccess: 更新排序成功
    updateOrderFailed: 更新排序失败
    expandAll: 展开全部
    collapseAll: 折叠全部
    categoryTree: 分类树
    basicInfo: 基本信息
    advancedSettings: 高级设置
```

### 2. 标签管理相关翻译

✅ 已完成

```yaml
cms:
  tag:
    tagManagement: 标签管理
    id: 标签ID
    name: 标签名称
    slug: 标签别名
    description: 标签描述
    color: 标签颜色
    isActive: 状态
    createdAt: 创建时间
    updatedAt: 更新时间
    articleCount: 文章数量
    actions: 操作
    search: 搜索标签
    searchPlaceholder: 输入标签名称搜索
    statusActive: 启用
    statusInactive: 禁用
    statusAll: 全部
    createTag: 创建标签
    editTag: 编辑标签
    deleteTag: 删除标签
    confirmDelete: 确认删除标签
    confirmDeleteMessage: 您确定要删除标签"{name}"吗？此操作可能会影响关联的文章。
    deleteSuccess: 删除标签成功
    deleteFailed: 删除标签失败
    createSuccess: 创建标签成功
    createFailed: 创建标签失败
    updateSuccess: 更新标签成功
    updateFailed: 更新标签失败
    nameRequired: 标签名称不能为空
    slugInvalid: 标签别名格式不正确
    selectColor: 选择颜色
    defaultColor: 默认颜色
    basicInfo: 基本信息
    advancedSettings: 高级设置
```

### 3. 标签组管理相关翻译

✅ 已完成

```yaml
cms:
  tagGroup:
    tagGroupManagement: 标签组管理
    id: 标签组ID
    name: 标签组名称
    slug: 标签组别名
    description: 标签组描述
    isActive: 状态
    createdAt: 创建时间
    updatedAt: 更新时间
    tagCount: 标签数量
    actions: 操作
    search: 搜索标签组
    searchPlaceholder: 输入标签组名称搜索
    statusActive: 启用
    statusInactive: 禁用
    statusAll: 全部
    createTagGroup: 创建标签组
    editTagGroup: 编辑标签组
    deleteTagGroup: 删除标签组
    confirmDelete: 确认删除标签组
    confirmDeleteMessage: 您确定要删除标签组"{name}"吗？此操作不会删除组内的标签。
    deleteSuccess: 删除标签组成功
    deleteFailed: 删除标签组失败
    createSuccess: 创建标签组成功
    createFailed: 创建标签组失败
    updateSuccess: 更新标签组成功
    updateFailed: 更新标签组失败
    nameRequired: 标签组名称不能为空
    slugInvalid: 标签组别名格式不正确
    tagsInGroup: 组内标签
    addTagToGroup: 添加标签到组
    removeTagFromGroup: 从组中移除标签
    noTags: 暂无标签
```

### 4. 文章版本历史相关翻译

✅ 已完成

```yaml
cms:
  article:
    versionHistory: 版本历史
    versionNumber: 版本号
    versionCreatedAt: 创建时间
    versionCreatedBy: 创建者
    compareVersions: 比较版本
    restoreVersion: 恢复此版本
    currentVersion: 当前版本
    versionDiff: 版本差异
    noVersions: 暂无版本历史
    confirmRestore: 确认恢复版本
    confirmRestoreMessage: 您确定要恢复到版本 {version} 吗？当前未保存的更改将丢失。
    restoreSuccess: 恢复版本成功
    restoreFailed: 恢复版本失败
```

### 5. 文章统计数据相关翻译

✅ 已完成

```yaml
cms:
  article:
    statistics: 统计数据
    viewCount: 浏览量
    uniqueViewCount: 唯一访客数
    commentCount: 评论数
    likeCount: 点赞数
    bookmarkCount: 收藏数
    averageReadingTime: 平均阅读时间
    bounceRate: 跳出率
    minutes: 分钟
    seconds: 秒
    statisticsTitle: 文章统计
    viewTrend: 浏览趋势
    interactionTrend: 互动趋势
    lastDays: 最近 {days} 天
    noStatisticsData: 暂无统计数据
```

## 实施计划

1. **第一阶段：基础翻译补充** ✅
   - 补充分类管理相关翻译
   - 补充标签管理相关翻译

2. **第二阶段：高级功能翻译** ✅
   - 添加标签组管理相关翻译
   - 添加文章版本历史相关翻译
   - 添加文章统计数据相关翻译

3. **第三阶段：验证与优化** ✅
   - 检查所有CMS页面，确保没有遗漏的翻译项
   - 确保英文翻译的准确性和专业性
   - 优化翻译文本，确保语义清晰

## 注意事项

1. 所有翻译项应同时添加到`locales/zh-CN.yaml`和`locales/en.yaml`文件中
2. 英文翻译应遵循专业术语和行业标准
3. 翻译文本应简洁明了，避免冗长表达
4. 保持与现有翻译风格的一致性

## 完成标准

- 所有CMS页面元素都有对应的翻译项
- 切换语言时，所有文本正确显示对应语言
- 没有硬编码的文本字符串
- 所有操作提示和错误信息都有对应翻译 
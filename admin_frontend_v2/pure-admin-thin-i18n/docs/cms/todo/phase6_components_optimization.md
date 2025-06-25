# 第六阶段：组件开发与优化

## 概述

在完成CMS模块的主要功能开发后，第六阶段将专注于开发可复用组件、优化性能和用户体验，以及进行全面测试。本文档描述组件开发与优化的实施计划。

## 可复用组件开发

### 1. 文章编辑器组件

文章编辑器是CMS模块的核心组件之一，用于创建和编辑文章内容。

路径：`src/components/Cms/Editor/MarkdownEditor.vue`

功能需求：
- Markdown 语法支持
- 工具栏（加粗、斜体、标题、链接、图片等）
- 预览功能
- 代码高亮
- 文件上传（图片、附件）
- 全屏编辑模式

实现思路：
- 基于项目中现有的Markdown控件进行封装
- 添加自定义功能（如图片上传、文件管理等）
- 提供统一的API接口，便于在文章创建和编辑页面中使用

### 2. 分类选择器组件

分类选择器用于在文章编辑页面中选择文章分类。

路径：`src/components/Cms/Category/CategorySelector.vue`

功能需求：
- 树形结构展示分类
- 支持单选和多选
- 支持搜索
- 支持限制最大选择数量
- 支持只读模式（用于展示）

实现思路：
- 基于Element Plus的树形选择器组件进行封装
- 添加分类加载和搜索功能
- 提供统一的API接口，便于在各页面中使用

### 3. 标签选择器组件

标签选择器用于在文章编辑页面中选择文章标签。

路径：`src/components/Cms/Tag/TagSelector.vue`

功能需求：
- 支持多选标签
- 支持按标签组筛选
- 支持搜索
- 支持创建新标签
- 支持限制最大选择数量
- 支持只读模式（用于展示）

实现思路：
- 基于Element Plus的选择器组件进行封装
- 添加标签加载、搜索和创建功能
- 提供统一的API接口，便于在各页面中使用

### 4. 文件管理器组件

文件管理器用于上传和管理CMS中使用的图片和文件。

路径：`src/components/Cms/FileManager/index.vue`

功能需求：
- 文件上传（支持拖拽）
- 文件列表展示
- 文件预览（图片、文档等）
- 文件删除
- 文件重命名
- 文件夹管理

实现思路：
- 基于Element Plus的上传组件进行封装
- 添加文件预览和管理功能
- 提供统一的API接口，便于在各页面中使用

## 性能优化

### 1. 组件懒加载

为了提高页面加载速度，对CMS模块的页面和组件进行懒加载处理：

```typescript
// 修改路由配置，使用懒加载
const routes = [
  {
    path: "/cms",
    component: () => import("@/views/cms/index.vue"),
    children: [
      {
        path: "article",
        component: () => import("@/views/cms/article/index.vue"),
      },
      {
        path: "article/create",
        component: () => import("@/views/cms/article/create.vue"),
      },
      // 其他路由...
    ],
  },
];
```

### 2. 数据缓存

对频繁使用但变化不大的数据进行缓存处理，减少不必要的API请求：

```typescript
// 在Store中添加缓存逻辑
async fetchCategoryList(params?: CategoryListParams, forceRefresh = false) {
  // 如果有缓存且不强制刷新，则使用缓存数据
  if (this.categories.length > 0 && !forceRefresh) {
    return { data: this.categories };
  }
  
  this.loading.categoryList = true;
  try {
    const { data } = await cmsApi.getCategoryList(params);
    this.categories = data.data;
    return data;
  } catch (error) {
    logger.error("获取分类列表失败", error);
    throw error;
  } finally {
    this.loading.categoryList = false;
  }
}
```

### 3. 虚拟滚动

对于可能包含大量数据的列表，使用虚拟滚动技术优化性能：

```vue
<template>
  <el-scrollbar>
    <div class="infinite-list-wrapper">
      <el-virtual-list
        :items="commentList"
        :item-size="80"
        :cache="200"
        style="height: 500px"
      >
        <template #default="{ item }">
          <comment-item :comment="item" />
        </template>
      </el-virtual-list>
    </div>
  </el-scrollbar>
</template>
```

### 4. 按需导入

确保Element Plus和其他库的组件都是按需导入的，减少打包体积：

```typescript
// 使用按需导入
import { ElButton, ElTable, ElInput } from "element-plus";
```

## 用户体验优化

### 1. 加载状态优化

为所有异步操作添加适当的加载状态提示：

```vue
<template>
  <div v-loading="tableLoading" class="loading-container">
    <!-- 表格内容 -->
  </div>
</template>
```

### 2. 错误处理优化

统一处理API请求错误，提供友好的错误提示：

```typescript
// 全局错误处理器
const handleApiError = (error, message = "操作失败") => {
  logger.error(message, error);
  
  if (error.response) {
    const errorMsg = error.response.data.message || message;
    ElMessage.error(errorMsg);
  } else {
    ElMessage.error(message);
  }
};
```

### 3. 表单验证优化

为所有表单添加适当的验证规则，提供实时反馈：

```vue
<template>
  <el-form
    :model="form"
    :rules="rules"
    status-icon
    label-position="top"
  >
    <!-- 表单内容 -->
  </el-form>
</template>
```

### 4. 响应式设计优化

确保所有页面在不同屏幕尺寸下都能正常显示：

```vue
<template>
  <el-row :gutter="20">
    <el-col :xs="24" :sm="24" :md="16" :lg="18" :xl="20">
      <!-- 主要内容 -->
    </el-col>
    <el-col :xs="24" :sm="24" :md="8" :lg="6" :xl="4">
      <!-- 侧边栏 -->
    </el-col>
  </el-row>
</template>
```

## 测试计划

### 1. 单元测试

为核心组件和函数编写单元测试，确保代码质量：

```typescript
// 示例单元测试
describe("CmsStore", () => {
  let store;
  
  beforeEach(() => {
    store = useCmsStore();
  });
  
  test("should fetch article list", async () => {
    // 模拟API响应
    const mockResponse = {
      data: {
        data: [{ id: 1, title: "Test Article" }],
        total: 1,
        page: 1,
        limit: 10
      }
    };
    
    // 模拟API调用
    jest.spyOn(cmsApi, "getArticleList").mockResolvedValue(mockResponse);
    
    // 执行操作
    await store.fetchArticleList();
    
    // 验证结果
    expect(store.articles.data).toHaveLength(1);
    expect(store.articles.data[0].title).toBe("Test Article");
  });
});
```

### 2. 集成测试

测试组件之间的交互，确保功能正常：

- 测试文章创建流程
- 测试评论管理流程
- 测试分类和标签管理流程

### 3. E2E测试

使用Cypress或其他E2E测试工具，测试完整的用户操作流程：

```javascript
// 示例E2E测试
describe("Article Management", () => {
  beforeEach(() => {
    cy.login("admin", "password");
    cy.visit("/cms/article");
  });
  
  it("should create a new article", () => {
    cy.get("[data-test=create-article-button]").click();
    cy.url().should("include", "/cms/article/create");
    
    cy.get("[data-test=article-title]").type("Test Article");
    cy.get("[data-test=article-content]").type("This is a test article");
    
    cy.get("[data-test=submit-button]").click();
    
    cy.url().should("include", "/cms/article");
    cy.contains("Test Article").should("be.visible");
  });
});
```

## 文档完善

### 1. 开发文档

编写CMS模块的开发文档，包括：

- 架构设计
- 组件说明
- API接口说明
- 状态管理说明

### 2. 用户指南

编写CMS模块的用户指南，包括：

- 功能介绍
- 操作指南
- 常见问题解答

### 3. API文档

编写CMS API的详细文档，包括：

- 请求参数
- 响应格式
- 错误码说明
- 示例代码

## 后续维护计划

### 1. 持续集成

设置持续集成流程，自动运行测试并生成报告：

- 配置GitHub Actions或Jenkins等CI工具
- 添加代码质量检查
- 添加自动化测试

### 2. 性能监控

添加性能监控工具，实时监控CMS模块的性能：

- 页面加载时间
- API请求响应时间
- 资源使用情况

### 3. 功能扩展计划

根据用户反馈，计划后续功能扩展：

- 高级搜索功能
- 内容版本比较
- 内容审核流程
- 自定义字段
- 内容导入/导出 
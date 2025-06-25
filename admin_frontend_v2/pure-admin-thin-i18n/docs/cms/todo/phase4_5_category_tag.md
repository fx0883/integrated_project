# 第四、五阶段：分类和标签管理功能

## 概述

分类和标签是CMS内容管理的重要组织工具，允许用户对内容进行分类和标记。本文档描述分类管理和标签管理功能的实现计划。

## 第四阶段：分类管理功能

### 1. 分类API接口

首先在 `src/api/modules/cms.ts` 中实现分类相关的API接口：

```typescript
/**
 * 获取分类列表
 * @param params 查询参数
 */
export function getCategoryList(params?: CategoryListParams) {
  logger.debug("API请求: 获取分类列表", params);
  
  return http.request<ApiResponse<Category[]>>(
    "get",
    "/api/v1/cms/categories/",
    { params }
  );
}

/**
 * 获取分类树形结构
 */
export function getCategoryTree() {
  logger.debug("API请求: 获取分类树形结构");
  
  return http.request<ApiResponse<Category[]>>(
    "get",
    "/api/v1/cms/categories/tree/"
  );
}

/**
 * 获取分类详情
 * @param id 分类ID
 */
export function getCategoryDetail(id: number) {
  logger.debug("API请求: 获取分类详情", { id });
  
  return http.request<ApiResponse<Category>>(
    "get",
    `/api/v1/cms/categories/${id}/`
  );
}

/**
 * 创建分类
 * @param data 分类数据
 */
export function createCategory(data: CategoryCreateParams) {
  logger.debug("API请求: 创建分类", data);
  
  return http.request<ApiResponse<Category>>(
    "post",
    "/api/v1/cms/categories/",
    { data }
  );
}

/**
 * 更新分类
 * @param id 分类ID
 * @param data 分类数据
 */
export function updateCategory(id: number, data: CategoryUpdateParams) {
  logger.debug("API请求: 更新分类", { id, data });
  
  return http.request<ApiResponse<Category>>(
    "put",
    `/api/v1/cms/categories/${id}/`,
    { data }
  );
}

/**
 * 删除分类
 * @param id 分类ID
 */
export function deleteCategory(id: number) {
  logger.debug("API请求: 删除分类", { id });
  
  return http.request<ApiResponse<null>>(
    "delete",
    `/api/v1/cms/categories/${id}/`
  );
}

/**
 * 更新分类排序
 * @param data 排序数据
 */
export function updateCategoryOrder(data: { id: number; sort_order: number }[]) {
  logger.debug("API请求: 更新分类排序", data);
  
  return http.request<ApiResponse<{ updated: number }>>(
    "post",
    "/api/v1/cms/categories/reorder/",
    { data }
  );
}
```

### 2. 分类状态管理

在 `src/store/modules/cms.ts` 中添加分类相关的状态和操作：

```typescript
// 分类相关操作
async fetchCategoryList(params?: CategoryListParams) {
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
},

async fetchCategoryTree() {
  this.loading.categoryList = true;
  try {
    const { data } = await cmsApi.getCategoryTree();
    this.categoryTree = data.data;
    return data;
  } catch (error) {
    logger.error("获取分类树失败", error);
    throw error;
  } finally {
    this.loading.categoryList = false;
  }
},

async fetchCategoryDetail(id: number) {
  this.loading.categoryDetail = true;
  try {
    const { data } = await cmsApi.getCategoryDetail(id);
    this.currentCategory = data.data;
    return data;
  } catch (error) {
    logger.error("获取分类详情失败", error);
    throw error;
  } finally {
    this.loading.categoryDetail = false;
  }
},

async createCategory(categoryData: CategoryCreateParams) {
  this.loading.categoryCreate = true;
  try {
    const { data } = await cmsApi.createCategory(categoryData);
    // 刷新分类列表
    await this.fetchCategoryList();
    return data;
  } catch (error) {
    logger.error("创建分类失败", error);
    throw error;
  } finally {
    this.loading.categoryCreate = false;
  }
},

async updateCategory(id: number, categoryData: CategoryUpdateParams) {
  this.loading.categoryUpdate = true;
  try {
    const { data } = await cmsApi.updateCategory(id, categoryData);
    // 更新当前分类
    if (this.currentCategory && this.currentCategory.id === id) {
      this.currentCategory = data.data;
    }
    // 刷新分类列表
    await this.fetchCategoryList();
    return data;
  } catch (error) {
    logger.error("更新分类失败", error);
    throw error;
  } finally {
    this.loading.categoryUpdate = false;
  }
},

async deleteCategory(id: number) {
  this.loading.categoryDelete = true;
  try {
    const { data } = await cmsApi.deleteCategory(id);
    // 清空当前分类
    if (this.currentCategory && this.currentCategory.id === id) {
      this.currentCategory = null;
    }
    // 刷新分类列表
    await this.fetchCategoryList();
    return data;
  } catch (error) {
    logger.error("删除分类失败", error);
    throw error;
  } finally {
    this.loading.categoryDelete = false;
  }
},

async updateCategoryOrder(sortData: { id: number; sort_order: number }[]) {
  this.loading.categoryUpdate = true;
  try {
    const { data } = await cmsApi.updateCategoryOrder(sortData);
    // 刷新分类列表
    await this.fetchCategoryList();
    return data;
  } catch (error) {
    logger.error("更新分类排序失败", error);
    throw error;
  } finally {
    this.loading.categoryUpdate = false;
  }
}
```

### 3. 分类管理页面

创建分类管理页面，用于展示和管理所有分类：

路径：`src/views/cms/category/index.vue`

主要功能：
- 分类树形结构展示
- 分类搜索
- 分类创建、编辑和删除
- 分类排序
- 分类详情查看

### 4. 分类表单组件

创建一个可复用的分类表单组件，用于创建和编辑分类：

路径：`src/components/Cms/Category/CategoryForm.vue`

主要功能：
- 分类基本信息表单（名称、别名、描述等）
- 父分类选择
- 分类排序设置
- SEO信息设置

## 第五阶段：标签管理功能

### 1. 标签API接口

在 `src/api/modules/cms.ts` 中实现标签相关的API接口：

```typescript
/**
 * 获取标签列表
 * @param params 查询参数
 */
export function getTagList(params?: TagListParams) {
  logger.debug("API请求: 获取标签列表", params);
  
  return http.request<PaginationResponse<Tag>>(
    "get",
    "/api/v1/cms/tags/",
    { params }
  );
}

/**
 * 获取标签详情
 * @param id 标签ID
 */
export function getTagDetail(id: number) {
  logger.debug("API请求: 获取标签详情", { id });
  
  return http.request<ApiResponse<Tag>>(
    "get",
    `/api/v1/cms/tags/${id}/`
  );
}

/**
 * 创建标签
 * @param data 标签数据
 */
export function createTag(data: TagCreateParams) {
  logger.debug("API请求: 创建标签", data);
  
  return http.request<ApiResponse<Tag>>(
    "post",
    "/api/v1/cms/tags/",
    { data }
  );
}

/**
 * 更新标签
 * @param id 标签ID
 * @param data 标签数据
 */
export function updateTag(id: number, data: TagUpdateParams) {
  logger.debug("API请求: 更新标签", { id, data });
  
  return http.request<ApiResponse<Tag>>(
    "put",
    `/api/v1/cms/tags/${id}/`,
    { data }
  );
}

/**
 * 删除标签
 * @param id 标签ID
 */
export function deleteTag(id: number) {
  logger.debug("API请求: 删除标签", { id });
  
  return http.request<ApiResponse<null>>(
    "delete",
    `/api/v1/cms/tags/${id}/`
  );
}

/**
 * 获取标签组列表
 * @param params 查询参数
 */
export function getTagGroupList(params?: TagGroupListParams) {
  logger.debug("API请求: 获取标签组列表", params);
  
  return http.request<PaginationResponse<TagGroup>>(
    "get",
    "/api/v1/cms/tag-groups/",
    { params }
  );
}

/**
 * 获取标签组详情
 * @param id 标签组ID
 */
export function getTagGroupDetail(id: number) {
  logger.debug("API请求: 获取标签组详情", { id });
  
  return http.request<ApiResponse<TagGroup>>(
    "get",
    `/api/v1/cms/tag-groups/${id}/`
  );
}

/**
 * 创建标签组
 * @param data 标签组数据
 */
export function createTagGroup(data: TagGroupCreateParams) {
  logger.debug("API请求: 创建标签组", data);
  
  return http.request<ApiResponse<TagGroup>>(
    "post",
    "/api/v1/cms/tag-groups/",
    { data }
  );
}

/**
 * 更新标签组
 * @param id 标签组ID
 * @param data 标签组数据
 */
export function updateTagGroup(id: number, data: TagGroupUpdateParams) {
  logger.debug("API请求: 更新标签组", { id, data });
  
  return http.request<ApiResponse<TagGroup>>(
    "put",
    `/api/v1/cms/tag-groups/${id}/`,
    { data }
  );
}

/**
 * 删除标签组
 * @param id 标签组ID
 */
export function deleteTagGroup(id: number) {
  logger.debug("API请求: 删除标签组", { id });
  
  return http.request<ApiResponse<null>>(
    "delete",
    `/api/v1/cms/tag-groups/${id}/`
  );
}
```

### 2. 标签状态管理

在 `src/store/modules/cms.ts` 中添加标签相关的状态和操作：

```typescript
// 标签相关操作
async fetchTagList(params?: TagListParams) {
  this.loading.tagList = true;
  try {
    const { data } = await cmsApi.getTagList(params);
    this.tags = data.data;
    return data;
  } catch (error) {
    logger.error("获取标签列表失败", error);
    throw error;
  } finally {
    this.loading.tagList = false;
  }
},

async fetchTagDetail(id: number) {
  this.loading.tagDetail = true;
  try {
    const { data } = await cmsApi.getTagDetail(id);
    this.currentTag = data.data;
    return data;
  } catch (error) {
    logger.error("获取标签详情失败", error);
    throw error;
  } finally {
    this.loading.tagDetail = false;
  }
},

async createTag(tagData: TagCreateParams) {
  this.loading.tagCreate = true;
  try {
    const { data } = await cmsApi.createTag(tagData);
    // 刷新标签列表
    await this.fetchTagList();
    return data;
  } catch (error) {
    logger.error("创建标签失败", error);
    throw error;
  } finally {
    this.loading.tagCreate = false;
  }
},

async updateTag(id: number, tagData: TagUpdateParams) {
  this.loading.tagUpdate = true;
  try {
    const { data } = await cmsApi.updateTag(id, tagData);
    // 更新当前标签
    if (this.currentTag && this.currentTag.id === id) {
      this.currentTag = data.data;
    }
    // 刷新标签列表
    await this.fetchTagList();
    return data;
  } catch (error) {
    logger.error("更新标签失败", error);
    throw error;
  } finally {
    this.loading.tagUpdate = false;
  }
},

async deleteTag(id: number) {
  this.loading.tagDelete = true;
  try {
    const { data } = await cmsApi.deleteTag(id);
    // 清空当前标签
    if (this.currentTag && this.currentTag.id === id) {
      this.currentTag = null;
    }
    // 刷新标签列表
    await this.fetchTagList();
    return data;
  } catch (error) {
    logger.error("删除标签失败", error);
    throw error;
  } finally {
    this.loading.tagDelete = false;
  }
},

// 标签组相关操作
async fetchTagGroupList(params?: TagGroupListParams) {
  this.loading.tagGroupList = true;
  try {
    const { data } = await cmsApi.getTagGroupList(params);
    this.tagGroups = data.data;
    return data;
  } catch (error) {
    logger.error("获取标签组列表失败", error);
    throw error;
  } finally {
    this.loading.tagGroupList = false;
  }
},

async fetchTagGroupDetail(id: number) {
  this.loading.tagGroupDetail = true;
  try {
    const { data } = await cmsApi.getTagGroupDetail(id);
    this.currentTagGroup = data.data;
    return data;
  } catch (error) {
    logger.error("获取标签组详情失败", error);
    throw error;
  } finally {
    this.loading.tagGroupDetail = false;
  }
},

async createTagGroup(tagGroupData: TagGroupCreateParams) {
  this.loading.tagGroupCreate = true;
  try {
    const { data } = await cmsApi.createTagGroup(tagGroupData);
    // 刷新标签组列表
    await this.fetchTagGroupList();
    return data;
  } catch (error) {
    logger.error("创建标签组失败", error);
    throw error;
  } finally {
    this.loading.tagGroupCreate = false;
  }
},

async updateTagGroup(id: number, tagGroupData: TagGroupUpdateParams) {
  this.loading.tagGroupUpdate = true;
  try {
    const { data } = await cmsApi.updateTagGroup(id, tagGroupData);
    // 更新当前标签组
    if (this.currentTagGroup && this.currentTagGroup.id === id) {
      this.currentTagGroup = data.data;
    }
    // 刷新标签组列表
    await this.fetchTagGroupList();
    return data;
  } catch (error) {
    logger.error("更新标签组失败", error);
    throw error;
  } finally {
    this.loading.tagGroupUpdate = false;
  }
},

async deleteTagGroup(id: number) {
  this.loading.tagGroupDelete = true;
  try {
    const { data } = await cmsApi.deleteTagGroup(id);
    // 清空当前标签组
    if (this.currentTagGroup && this.currentTagGroup.id === id) {
      this.currentTagGroup = null;
    }
    // 刷新标签组列表
    await this.fetchTagGroupList();
    return data;
  } catch (error) {
    logger.error("删除标签组失败", error);
    throw error;
  } finally {
    this.loading.tagGroupDelete = false;
  }
}
```

### 3. 标签管理页面

创建标签管理页面，用于展示和管理所有标签：

路径：`src/views/cms/tag/index.vue`

主要功能：
- 标签列表展示
- 标签组管理
- 标签创建、编辑和删除
- 标签搜索和筛选

### 4. 标签表单组件

创建一个可复用的标签表单组件，用于创建和编辑标签：

路径：`src/components/Cms/Tag/TagForm.vue`

主要功能：
- 标签基本信息表单（名称、别名、描述等）
- 标签组选择
- 标签颜色设置

## 可复用组件开发

为了提高代码复用性，在开发分类和标签管理功能时，需要同时开发以下可复用组件：

### 1. 分类选择器组件

路径：`src/components/Cms/Category/CategorySelector.vue`

功能：
- 树形选择器展示所有分类
- 支持单选和多选
- 支持搜索和筛选

### 2. 标签选择器组件

路径：`src/components/Cms/Tag/TagSelector.vue`

功能：
- 多选标签展示
- 支持按标签组筛选
- 支持搜索
- 支持创建新标签

## 国际化支持

在 `locales/zh-CN.yaml` 和 `locales/en.yaml` 文件中添加分类和标签管理相关的翻译。

## 后续开发计划

完成分类和标签管理功能后，将全面测试CMS模块的所有功能，包括文章、评论、分类和标签的管理，确保各个功能之间的交互正常，UI风格统一，并进行性能优化。 
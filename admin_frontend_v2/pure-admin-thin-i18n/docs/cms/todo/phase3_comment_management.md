# 第三阶段：评论管理功能

## 概述

评论管理功能允许管理员查看、审核、回复和管理用户对文章的评论。本文档描述评论管理功能的实现计划。

## 实现步骤

### 1. 评论API接口

首先需要在 `src/api/modules/cms.ts` 中实现评论相关的API接口：

```typescript
/**
 * 获取评论列表
 * @param params 查询参数
 */
export function getCommentList(params: CommentListParams) {
  logger.debug("API请求: 获取评论列表", params);
  
  return http.request<PaginationResponse<Comment>>(
    "get",
    "/api/v1/cms/comments/",
    { params }
  );
}

/**
 * 获取评论详情
 * @param id 评论ID
 */
export function getCommentDetail(id: number) {
  logger.debug("API请求: 获取评论详情", { id });
  
  return http.request<ApiResponse<Comment>>(
    "get",
    `/api/v1/cms/comments/${id}/`
  );
}

/**
 * 更新评论
 * @param id 评论ID
 * @param data 评论数据
 */
export function updateComment(id: number, data: CommentUpdateParams) {
  logger.debug("API请求: 更新评论", { id, data });
  
  return http.request<ApiResponse<Comment>>(
    "put",
    `/api/v1/cms/comments/${id}/`,
    { data }
  );
}

/**
 * 批准评论
 * @param id 评论ID
 */
export function approveComment(id: number) {
  logger.debug("API请求: 批准评论", { id });
  
  return http.request<ApiResponse<Comment>>(
    "post",
    `/api/v1/cms/comments/${id}/approve/`
  );
}

/**
 * 拒绝评论
 * @param id 评论ID
 */
export function rejectComment(id: number) {
  logger.debug("API请求: 拒绝评论", { id });
  
  return http.request<ApiResponse<Comment>>(
    "post",
    `/api/v1/cms/comments/${id}/reject/`
  );
}

/**
 * 标记为垃圾评论
 * @param id 评论ID
 */
export function markCommentAsSpam(id: number) {
  logger.debug("API请求: 标记为垃圾评论", { id });
  
  return http.request<ApiResponse<Comment>>(
    "post",
    `/api/v1/cms/comments/${id}/mark-spam/`
  );
}

/**
 * 获取评论的回复
 * @param id 评论ID
 */
export function getCommentReplies(id: number) {
  logger.debug("API请求: 获取评论的回复", { id });
  
  return http.request<PaginationResponse<Comment>>(
    "get",
    `/api/v1/cms/comments/${id}/replies/`
  );
}

/**
 * 回复评论
 * @param data 评论数据
 */
export function replyToComment(data: CommentCreateParams) {
  logger.debug("API请求: 回复评论", data);
  
  return http.request<ApiResponse<Comment>>(
    "post",
    "/api/v1/cms/comments/",
    { data }
  );
}

/**
 * 批量处理评论
 * @param data 批量操作数据
 */
export function batchProcessComments(data: {
  comment_ids: number[];
  action: "approve" | "reject" | "spam" | "delete";
}) {
  logger.debug("API请求: 批量处理评论", data);
  
  return http.request<ApiResponse<{
    processed: number;
    success_ids: number[];
    failed_ids: number[];
  }>>(
    "post",
    "/api/v1/cms/comments/batch/",
    { data }
  );
}

/**
 * 删除评论
 * @param id 评论ID
 */
export function deleteComment(id: number) {
  logger.debug("API请求: 删除评论", { id });
  
  return http.request<ApiResponse<null>>(
    "delete",
    `/api/v1/cms/comments/${id}/`
  );
}
```

### 2. 评论状态管理

在 `src/store/modules/cms.ts` 中添加评论相关的状态和操作：

```typescript
// 评论相关操作
async fetchCommentList(params: CommentListParams) {
  this.loading.commentList = true;
  try {
    const { data } = await cmsApi.getCommentList(params);
    this.comments = data.data;
    return data;
  } catch (error) {
    logger.error("获取评论列表失败", error);
    throw error;
  } finally {
    this.loading.commentList = false;
  }
},

async fetchCommentDetail(id: number) {
  this.loading.commentDetail = true;
  try {
    const { data } = await cmsApi.getCommentDetail(id);
    this.currentComment = data.data;
    return data;
  } catch (error) {
    logger.error("获取评论详情失败", error);
    throw error;
  } finally {
    this.loading.commentDetail = false;
  }
},

async approveComment(id: number) {
  this.loading.commentModerate = true;
  try {
    const { data } = await cmsApi.approveComment(id);
    return data;
  } catch (error) {
    logger.error("批准评论失败", error);
    throw error;
  } finally {
    this.loading.commentModerate = false;
  }
},

async rejectComment(id: number) {
  this.loading.commentModerate = true;
  try {
    const { data } = await cmsApi.rejectComment(id);
    return data;
  } catch (error) {
    logger.error("拒绝评论失败", error);
    throw error;
  } finally {
    this.loading.commentModerate = false;
  }
},

async markCommentAsSpam(id: number) {
  this.loading.commentModerate = true;
  try {
    const { data } = await cmsApi.markCommentAsSpam(id);
    return data;
  } catch (error) {
    logger.error("标记为垃圾评论失败", error);
    throw error;
  } finally {
    this.loading.commentModerate = false;
  }
},

async deleteComment(id: number) {
  this.loading.commentDelete = true;
  try {
    const { data } = await cmsApi.deleteComment(id);
    return data;
  } catch (error) {
    logger.error("删除评论失败", error);
    throw error;
  } finally {
    this.loading.commentDelete = false;
  }
},

async batchProcessComments(commentIds: number[], action: "approve" | "reject" | "spam" | "delete") {
  this.loading.commentModerate = true;
  try {
    const { data } = await cmsApi.batchProcessComments({
      comment_ids: commentIds,
      action
    });
    return data;
  } catch (error) {
    logger.error("批量处理评论失败", error);
    throw error;
  } finally {
    this.loading.commentModerate = false;
  }
},

async getCommentReplies(id: number) {
  this.loading.commentDetail = true;
  try {
    const { data } = await cmsApi.getCommentReplies(id);
    return data;
  } catch (error) {
    logger.error("获取评论回复失败", error);
    throw error;
  } finally {
    this.loading.commentDetail = false;
  }
},

async replyToComment(commentData: CommentCreateParams) {
  this.loading.commentCreate = true;
  try {
    const { data } = await cmsApi.replyToComment(commentData);
    return data;
  } catch (error) {
    logger.error("回复评论失败", error);
    throw error;
  } finally {
    this.loading.commentCreate = false;
  }
}
```

### 3. 评论列表页

创建评论列表页，用于展示和管理所有评论：

路径：`src/views/cms/comment/index.vue`

主要功能：
- 评论列表展示
- 评论状态筛选（待审核、已批准、垃圾评论等）
- 评论搜索
- 评论批量操作（批准、拒绝、标记为垃圾、删除）
- 单个评论操作（查看、回复、批准、拒绝等）

### 4. 评论详情/回复页

创建评论详情页，用于查看评论详情和回复评论：

路径：`src/views/cms/comment/detail.vue`

主要功能：
- 评论详情展示
- 评论回复列表
- 回复功能
- 评论操作（批准、拒绝、标记为垃圾、删除）

### 5. 国际化支持

在 `locales/zh-CN.yaml` 和 `locales/en.yaml` 文件中添加评论管理相关的翻译。

## 详细设计

### 评论列表页设计

评论列表页将包含以下主要组件：

1. 搜索和筛选区域
   - 关键词搜索（评论内容、用户名等）
   - 状态筛选（全部、待审核、已批准、垃圾评论、已删除）
   - 日期范围筛选
   - 文章筛选（可选择特定文章）

2. 批量操作工具栏
   - 批准选中评论
   - 拒绝选中评论
   - 标记为垃圾评论
   - 删除选中评论

3. 评论列表表格
   - 评论ID
   - 评论内容（摘要）
   - 作者信息
   - 对应文章
   - 评论状态
   - 创建时间
   - 操作按钮（查看、回复、批准、拒绝、标记为垃圾、删除）

4. 分页控件

### 评论详情页设计

评论详情页将包含以下主要组件：

1. 评论详情卡片
   - 评论内容
   - 作者信息
   - 评论状态
   - 评论时间
   - 对应文章链接

2. 评论操作按钮
   - 批准/拒绝评论
   - 标记为垃圾评论
   - 删除评论

3. 回复列表
   - 显示该评论的所有回复
   - 树形结构展示多级回复

4. 回复表单
   - 回复内容输入框
   - 提交按钮

## 后续开发计划

完成评论管理功能后，将继续实现分类管理和标签管理功能。
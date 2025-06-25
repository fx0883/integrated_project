# 第二阶段：文章管理功能（文章列表页）

## 概述

文章列表页是CMS模块的核心页面之一，允许用户查看、搜索、筛选和管理所有文章。本文档详细描述文章列表页的实现计划。

## 实现步骤

### 1. 创建目录结构

首先，我们需要创建文章管理相关的目录结构：

```
src/
└── views/
    └── cms/
        └── article/
            ├── index.vue       # 文章列表页
            ├── create.vue      # 文章创建页
            ├── edit.vue        # 文章编辑页
            ├── detail.vue      # 文章详情页
            └── version.vue     # 文章版本历史页
```

### 2. 文章列表页设计

`src/views/cms/article/index.vue` 将包含以下主要功能：

1. 搜索和筛选区域
2. 文章列表表格
3. 分页控件
4. 操作按钮（创建、编辑、删除、发布等）

### 3. 文章列表页实现

下面是文章列表页的具体实现代码：

```vue
<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus, Edit, Delete, View, Upload, Download, Archive } from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import type { Article, ArticleStatus, ArticleListParams } from "@/types/cms";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const cmsStore = useCmsStoreHook();

// 表格加载状态
const tableLoading = computed(() => cmsStore.loading.articleList);

// 表格数据
const articleList = computed(() => cmsStore.articles.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => cmsStore.articles.total),
});

// 搜索条件
const searchForm = reactive<ArticleListParams>({
  search: "",
  status: undefined,
  category: undefined,
  tag: undefined,
  is_featured: undefined,
  is_pinned: undefined,
  date_from: "",
  date_to: "",
});

// 状态选项
const statusOptions = [
  { value: undefined, label: t("cms.article.statusAll") },
  { value: "draft", label: t("cms.article.statusDraft") },
  { value: "pending", label: t("cms.article.statusPending") },
  { value: "published", label: t("cms.article.statusPublished") },
  { value: "archived", label: t("cms.article.statusArchived") },
];

// 特性选项
const featuredOptions = [
  { value: undefined, label: t("cms.article.featuredAll") },
  { value: true, label: t("cms.article.featuredTrue") },
  { value: false, label: t("cms.article.featuredFalse") },
];

// 置顶选项
const pinnedOptions = [
  { value: undefined, label: t("cms.article.pinnedAll") },
  { value: true, label: t("cms.article.pinnedTrue") },
  { value: false, label: t("cms.article.pinnedFalse") },
];

// 确认对话框
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null,
});

// 获取文章列表
const fetchArticleList = async () => {
  try {
    const params: ArticleListParams = {
      ...searchForm,
      page: pagination.currentPage,
      per_page: pagination.pageSize,
    };
    
    await cmsStore.fetchArticleList(params);
  } catch (error) {
    logger.error("获取文章列表失败", error);
    ElMessage.error(t("cms.article.fetchListFailed"));
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchArticleList();
};

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = undefined;
  });
  searchForm.search = "";
  searchForm.date_from = "";
  searchForm.date_to = "";
  pagination.currentPage = 1;
  fetchArticleList();
};

// 处理分页变化
const handlePageChange = (page: number) => {
  pagination.currentPage = page;
  fetchArticleList();
};

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchArticleList();
};

// 创建文章
const handleCreateArticle = () => {
  router.push("/cms/article/create");
};

// 编辑文章
const handleEditArticle = (row: Article) => {
  router.push(`/cms/article/edit/${row.id}`);
};

// 查看文章详情
const handleViewArticle = (row: Article) => {
  router.push(`/cms/article/detail/${row.id}`);
};

// 删除文章
const handleDeleteArticle = (row: Article) => {
  confirmDialog.title = t("cms.article.confirmDelete");
  confirmDialog.content = t("cms.article.confirmDeleteMessage", { title: row.title });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.deleteArticle(row.id);
      ElMessage.success(t("cms.article.deleteSuccess"));
      fetchArticleList();
    } catch (error) {
      logger.error("删除文章失败", error);
      ElMessage.error(t("cms.article.deleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 批量删除文章
const multipleSelection = ref<Article[]>([]);
const handleSelectionChange = (val: Article[]) => {
  multipleSelection.value = val;
};

const handleBatchDelete = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("cms.article.selectArticlesToDelete"));
    return;
  }
  
  confirmDialog.title = t("cms.article.confirmBatchDelete");
  confirmDialog.content = t("cms.article.confirmBatchDeleteMessage", { count: multipleSelection.value.length });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      const ids = multipleSelection.value.map(item => item.id);
      await cmsStore.batchDeleteArticles(ids);
      ElMessage.success(t("cms.article.batchDeleteSuccess"));
      fetchArticleList();
      // 清空选择
      multipleSelection.value = [];
    } catch (error) {
      logger.error("批量删除文章失败", error);
      ElMessage.error(t("cms.article.batchDeleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 发布文章
const handlePublishArticle = (row: Article) => {
  confirmDialog.title = t("cms.article.confirmPublish");
  confirmDialog.content = t("cms.article.confirmPublishMessage", { title: row.title });
  confirmDialog.type = "info";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.publishArticle(row.id);
      ElMessage.success(t("cms.article.publishSuccess"));
      fetchArticleList();
    } catch (error) {
      logger.error("发布文章失败", error);
      ElMessage.error(t("cms.article.publishFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 取消发布文章
const handleUnpublishArticle = (row: Article) => {
  confirmDialog.title = t("cms.article.confirmUnpublish");
  confirmDialog.content = t("cms.article.confirmUnpublishMessage", { title: row.title });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.unpublishArticle(row.id);
      ElMessage.success(t("cms.article.unpublishSuccess"));
      fetchArticleList();
    } catch (error) {
      logger.error("取消发布文章失败", error);
      ElMessage.error(t("cms.article.unpublishFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 归档文章
const handleArchiveArticle = (row: Article) => {
  confirmDialog.title = t("cms.article.confirmArchive");
  confirmDialog.content = t("cms.article.confirmArchiveMessage", { title: row.title });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.archiveArticle(row.id);
      ElMessage.success(t("cms.article.archiveSuccess"));
      fetchArticleList();
    } catch (error) {
      logger.error("归档文章失败", error);
      ElMessage.error(t("cms.article.archiveFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 获取状态标签类型
const getStatusTagType = (status: ArticleStatus) => {
  switch (status) {
    case "published":
      return "success";
    case "pending":
      return "warning";
    case "draft":
      return "info";
    case "archived":
      return "danger";
    default:
      return "";
  }
};

// 初始化
onMounted(() => {
  fetchArticleList();
});
</script>

<template>
  <div class="article-list-container">
    <!-- 搜索和操作区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('cms.article.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('cms.article.searchPlaceholder')"
            clearable
          />
        </el-form-item>
        
        <el-form-item :label="t('cms.article.status')">
          <el-select v-model="searchForm.status" clearable>
            <el-option
              v-for="item in statusOptions"
              :key="item.value || 'all'"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('cms.article.featured')">
          <el-select v-model="searchForm.is_featured" clearable>
            <el-option
              v-for="item in featuredOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('cms.article.pinned')">
          <el-select v-model="searchForm.is_pinned" clearable>
            <el-option
              v-for="item in pinnedOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('cms.article.dateRange')">
          <el-date-picker
            v-model="searchForm.date_from"
            type="date"
            :placeholder="t('cms.article.startDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 160px;"
          />
          <span class="date-separator"> - </span>
          <el-date-picker
            v-model="searchForm.date_to"
            type="date"
            :placeholder="t('cms.article.endDate')"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 160px;"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            {{ t('common.search') }}
          </el-button>
          <el-button @click="resetSearch">
            {{ t('common.reset') }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="action-buttons">
        <el-button type="primary" @click="handleCreateArticle" :icon="Plus">
          {{ t('cms.article.create') }}
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="multipleSelection.length === 0">
          {{ t('cms.article.batchDelete') }}
        </el-button>
      </div>
    </el-card>
    
    <!-- 文章列表表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="tableLoading"
        :data="articleList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column :label="t('cms.article.title')" min-width="200">
          <template #default="{ row }">
            <div class="article-title">
              <div>{{ row.title }}</div>
              <div class="article-slug">{{ row.slug }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column :label="t('cms.article.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ t(`cms.article.status${row.status.charAt(0).toUpperCase() + row.status.slice(1)}`) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column :label="t('cms.article.features')" width="120">
          <template #default="{ row }">
            <div class="feature-tags">
              <el-tag v-if="row.is_featured" type="success" size="small">
                {{ t('cms.article.featuredTrue') }}
              </el-tag>
              <el-tag v-if="row.is_pinned" type="warning" size="small">
                {{ t('cms.article.pinnedTrue') }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column :label="t('cms.article.author')" width="120">
          <template #default="{ row }">
            <div v-if="row.author_info">
              {{ row.author_info.username }}
            </div>
            <div v-else>-</div>
          </template>
        </el-table-column>
        
        <el-table-column :label="t('cms.article.date')" width="160">
          <template #default="{ row }">
            <div>
              {{ row.published_at ? new Date(row.published_at).toLocaleString() : t('cms.article.unpublished') }}
            </div>
            <div class="date-created">
              {{ t('cms.article.created') }}: {{ new Date(row.created_at).toLocaleDateString() }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column :label="t('cms.article.statistics')" width="120">
          <template #default="{ row }">
            <div class="statistics">
              <div>{{ t('cms.article.views') }}: {{ row.view_count || 0 }}</div>
              <div>{{ t('cms.article.comments') }}: {{ row.comment_count || 0 }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column :label="t('common.actions')" fixed="right" width="200">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              :icon="View" 
              @click="handleViewArticle(row)" 
              circle
              :title="t('common.view')"
            />
            <el-button 
              type="warning" 
              size="small" 
              :icon="Edit" 
              @click="handleEditArticle(row)" 
              circle
              :title="t('common.edit')"
            />
            <el-button 
              v-if="row.status !== 'published'"
              type="success" 
              size="small" 
              :icon="Upload" 
              @click="handlePublishArticle(row)" 
              circle
              :title="t('cms.article.publish')"
            />
            <el-button 
              v-if="row.status === 'published'"
              type="info" 
              size="small" 
              :icon="Download" 
              @click="handleUnpublishArticle(row)" 
              circle
              :title="t('cms.article.unpublish')"
            />
            <el-button 
              v-if="row.status !== 'archived'"
              type="info" 
              size="small" 
              :icon="Archive" 
              @click="handleArchiveArticle(row)" 
              circle
              :title="t('cms.article.archive')"
            />
            <el-button 
              type="danger" 
              size="small" 
              :icon="Delete" 
              @click="handleDeleteArticle(row)" 
              circle
              :title="t('common.delete')"
            />
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
    
    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmDialog.visible"
      :title="confirmDialog.title"
      width="30%"
    >
      <span>{{ confirmDialog.content }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialog.visible = false">
            {{ t('common.cancel') }}
          </el-button>
          <el-button
            :type="confirmDialog.type"
            @click="confirmDialog.confirmAction?.().finally(() => (confirmDialog.visible = false))"
          >
            {{ t('common.confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.article-list-container {
  padding: 16px;
}

.search-card {
  margin-bottom: 16px;
}

.action-buttons {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}

.date-separator {
  margin: 0 8px;
}

.article-title {
  display: flex;
  flex-direction: column;
}

.article-slug {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.feature-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-created {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.statistics {
  font-size: 13px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
```

### 4. 添加国际化支持

在 `locales/zh-CN.yaml` 和 `locales/en.yaml` 文件中添加文章管理相关的翻译：

#### zh-CN.yaml:

```yaml
cms:
  article:
    # 文章状态
    statusAll: 全部状态
    statusDraft: 草稿
    statusPending: 待审核
    statusPublished: 已发布
    statusArchived: 已归档
    
    # 特性选项
    featuredAll: 全部
    featuredTrue: 特色文章
    featuredFalse: 普通文章
    
    # 置顶选项
    pinnedAll: 全部
    pinnedTrue: 置顶
    pinnedFalse: 非置顶
    
    # 搜索表单
    search: 搜索
    searchPlaceholder: 搜索文章标题或内容
    status: 状态
    featured: 特色
    pinned: 置顶
    dateRange: 日期范围
    startDate: 开始日期
    endDate: 结束日期
    
    # 表格标题
    title: 标题
    author: 作者
    date: 日期
    statistics: 统计
    features: 特性
    
    # 统计信息
    views: 浏览
    comments: 评论
    created: 创建于
    unpublished: 未发布
    
    # 操作按钮
    create: 创建文章
    publish: 发布
    unpublish: 取消发布
    archive: 归档
    batchDelete: 批量删除
    
    # 确认信息
    selectArticlesToDelete: 请选择要删除的文章
    confirmDelete: 确认删除
    confirmDeleteMessage: 确定要删除文章 "{title}" 吗？
    confirmBatchDelete: 确认批量删除
    confirmBatchDeleteMessage: 确定要删除选中的 {count} 篇文章吗？
    confirmPublish: 确认发布
    confirmPublishMessage: 确定要发布文章 "{title}" 吗？
    confirmUnpublish: 确认取消发布
    confirmUnpublishMessage: 确定要取消发布文章 "{title}" 吗？
    confirmArchive: 确认归档
    confirmArchiveMessage: 确定要归档文章 "{title}" 吗？
    
    # 操作结果
    fetchListFailed: 获取文章列表失败
    deleteSuccess: 删除文章成功
    deleteFailed: 删除文章失败
    batchDeleteSuccess: 批量删除文章成功
    batchDeleteFailed: 批量删除文章失败
    publishSuccess: 发布文章成功
    publishFailed: 发布文章失败
    unpublishSuccess: 取消发布文章成功
    unpublishFailed: 取消发布文章失败
    archiveSuccess: 归档文章成功
    archiveFailed: 归档文章失败
```

#### en.yaml:

```yaml
cms:
  article:
    # Article Status
    statusAll: All Status
    statusDraft: Draft
    statusPending: Pending
    statusPublished: Published
    statusArchived: Archived
    
    # Feature Options
    featuredAll: All
    featuredTrue: Featured
    featuredFalse: Not Featured
    
    # Pinned Options
    pinnedAll: All
    pinnedTrue: Pinned
    pinnedFalse: Not Pinned
    
    # Search Form
    search: Search
    searchPlaceholder: Search article title or content
    status: Status
    featured: Featured
    pinned: Pinned
    dateRange: Date Range
    startDate: Start Date
    endDate: End Date
    
    # Table Headers
    title: Title
    author: Author
    date: Date
    statistics: Statistics
    features: Features
    
    # Statistics
    views: Views
    comments: Comments
    created: Created
    unpublished: Unpublished
    
    # Action Buttons
    create: Create Article
    publish: Publish
    unpublish: Unpublish
    archive: Archive
    batchDelete: Batch Delete
    
    # Confirmation Messages
    selectArticlesToDelete: Please select articles to delete
    confirmDelete: Confirm Delete
    confirmDeleteMessage: Are you sure you want to delete article "{title}"?
    confirmBatchDelete: Confirm Batch Delete
    confirmBatchDeleteMessage: Are you sure you want to delete {count} selected articles?
    confirmPublish: Confirm Publish
    confirmPublishMessage: Are you sure you want to publish article "{title}"?
    confirmUnpublish: Confirm Unpublish
    confirmUnpublishMessage: Are you sure you want to unpublish article "{title}"?
    confirmArchive: Confirm Archive
    confirmArchiveMessage: Are you sure you want to archive article "{title}"?
    
    # Operation Results
    fetchListFailed: Failed to fetch article list
    deleteSuccess: Article deleted successfully
    deleteFailed: Failed to delete article
    batchDeleteSuccess: Batch delete articles successfully
    batchDeleteFailed: Failed to batch delete articles
    publishSuccess: Article published successfully
    publishFailed: Failed to publish article
    unpublishSuccess: Article unpublished successfully
    unpublishFailed: Failed to unpublish article
    archiveSuccess: Article archived successfully
    archiveFailed: Failed to archive article
```

## 下一步计划

完成文章列表页后，我们将继续实现文章的创建、编辑、详情和版本历史页面。
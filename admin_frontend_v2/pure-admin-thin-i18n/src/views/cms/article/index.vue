<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Search,
  Plus,
  Edit,
  Delete,
  View,
  Upload,
  Download,
  Archive
} from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import { useUserStoreHook } from "@/store/modules/user";
import ConfirmDialog from "@/components/Cms/Article/ConfirmDialog.vue";
import ArticleForm from "@/components/Cms/Article/ArticleForm.vue";
import type {
  Article,
  ArticleStatus,
  ArticleVisibility,
  ArticleListParams,
  ArticleCreateParams,
  Category,
  Tag
} from "@/types/cms";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const cmsStore = useCmsStoreHook();
const userStore = useUserStoreHook();

// 检查用户权限
const checkPermission = () => {
  // 这里可以根据实际需求检查权限
  return true;
};

// 表格加载状态
const tableLoading = computed(() => cmsStore.loading.articleList);

// 表格数据
const articles = computed(() => cmsStore.articles.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => cmsStore.articles.total)
});

// 搜索表单
const searchForm = reactive<ArticleListParams>({
  search: "",
  status: undefined,
  category: undefined,
  tag: undefined,
  is_featured: undefined,
  is_pinned: undefined,
  date_from: "",
  date_to: "",
  page: 1,
  per_page: 10
});

// 确认对话框
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null
});

// 创建文章模态窗口
const createArticleDialog = reactive({
  visible: false,
  loading: false
});

// 编辑文章模态窗口
const editArticleDialog = reactive({
  visible: false,
  loading: false,
  articleId: null as number | null,
  articleData: null as Article | null
});

// 分类和标签数据
const categories = ref<Category[]>([]);
const tags = ref<Tag[]>([]);

// 状态选项
const statusOptions = [
  { value: "", label: t("cms.article.statusAll") },
  { value: "draft", label: t("cms.article.statusDraft") },
  { value: "pending", label: t("cms.article.statusPending") },
  { value: "published", label: t("cms.article.statusPublished") },
  { value: "archived", label: t("cms.article.statusArchived") }
];

// 特性选项
const featuredOptions = [
  { value: "", label: t("cms.article.featuredAll") },
  { value: "true", label: t("cms.article.featuredTrue") },
  { value: "false", label: t("cms.article.featuredFalse") }
];

// 置顶选项
const pinnedOptions = [
  { value: "", label: t("cms.article.pinnedAll") },
  { value: "true", label: t("cms.article.pinnedTrue") },
  { value: "false", label: t("cms.article.pinnedFalse") }
];

// 多选相关
const multipleSelection = ref<Article[]>([]);
const handleSelectionChange = (val: Article[]) => {
  multipleSelection.value = val;
};

// 获取文章列表
const fetchArticles = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.per_page = pagination.pageSize;

    // 处理布尔值转换
    const params = { ...searchForm };
    if (params.is_featured === "true") params.is_featured = true;
    if (params.is_featured === "false") params.is_featured = false;
    if (params.is_pinned === "true") params.is_pinned = true;
    if (params.is_pinned === "false") params.is_pinned = false;

    // 记录请求参数，用于调试
    console.log("[ArticleIndex] 文章列表请求参数:", params);

    // 确保分类ID是数字类型
    if (params.category !== undefined && params.category !== null) {
      params.category = Number(params.category);
      console.log("[ArticleIndex] 使用分类过滤:", params.category);
    }

    // 确保标签ID是数字类型
    if (params.tag !== undefined && params.tag !== null) {
      params.tag = Number(params.tag);
      console.log("[ArticleIndex] 使用标签过滤:", params.tag);
    }

    await cmsStore.fetchArticleList(params);
  } catch (error) {
    logger.error("获取文章列表失败", error);
    ElMessage.error(t("cms.article.fetchListFailed"));
  }
};

// 获取分类列表
const fetchCategories = async () => {
  console.log("[ArticleIndex] 开始获取分类列表");
  try {
    const response = await cmsStore.fetchCategoryList();
    console.log("[ArticleIndex] 获取分类列表成功:", response);

    // 从响应中提取分类数据
    if (response && Array.isArray(response)) {
      categories.value = response;
      console.log(
        "[ArticleIndex] 分类数据已更新, 数量:",
        categories.value.length
      );
    } else if (response && response.data && Array.isArray(response.data)) {
      categories.value = response.data;
      console.log(
        "[ArticleIndex] 分类数据已更新, 数量:",
        categories.value.length
      );
    } else {
      console.warn("[ArticleIndex] 分类数据格式异常:", response);
      categories.value = [];
    }
  } catch (error) {
    console.error("[ArticleIndex] 获取分类列表失败:", error);
    logger.error("获取分类列表失败", error);
    ElMessage.error(t("cms.category.fetchListFailed"));
    categories.value = [];
  }
};

// 获取标签列表
const fetchTags = async () => {
  console.log("[ArticleIndex] 开始获取标签列表");
  try {
    const response = await cmsStore.fetchTagList();
    console.log("[ArticleIndex] 获取标签列表成功:", response);

    // 从响应中提取标签数据
    if (
      response &&
      response.data &&
      response.data.results &&
      Array.isArray(response.data.results)
    ) {
      // 分页响应格式
      tags.value = response.data.results;
      console.log(
        "[ArticleIndex] 标签数据已更新(分页格式), 数量:",
        tags.value.length
      );
    } else if (response && response.data && Array.isArray(response.data)) {
      // 直接是数组
      tags.value = response.data;
      console.log(
        "[ArticleIndex] 标签数据已更新(数组格式), 数量:",
        tags.value.length
      );
    } else if (response && Array.isArray(response)) {
      // 直接是数组
      tags.value = response;
      console.log(
        "[ArticleIndex] 标签数据已更新(直接数组), 数量:",
        tags.value.length
      );
    } else {
      console.warn("[ArticleIndex] 标签数据格式异常:", response);
      tags.value = [];
    }

    // 检查是否成功获取了标签数据
    if (tags.value.length === 0) {
      console.warn("[ArticleIndex] 未能获取到标签数据");
    }
  } catch (error) {
    console.error("[ArticleIndex] 获取标签列表失败:", error);
    logger.error("获取标签列表失败", error);
    ElMessage.error(t("cms.tag.fetchListFailed"));
    tags.value = [];
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchArticles();
};

// 重置搜索
const resetSearch = () => {
  searchForm.search = "";
  searchForm.status = undefined;
  searchForm.category = undefined;
  searchForm.tag = undefined;
  searchForm.is_featured = undefined;
  searchForm.is_pinned = undefined;
  searchForm.date_from = "";
  searchForm.date_to = "";
  pagination.currentPage = 1;
  fetchArticles();
};

// 监视分页参数变化
watch(
  () => pagination.currentPage,
  newPage => {
    if (newPage) {
      fetchArticles();
    }
  }
);

watch(
  () => pagination.pageSize,
  newSize => {
    if (newSize) {
      pagination.currentPage = 1; // 当每页条数变化时，重置为第一页
      fetchArticles();
    }
  }
);

// 新建文章 - 修改为打开模态窗口
const handleCreate = async () => {
  createArticleDialog.visible = true;
  // 加载分类和标签数据
  await Promise.all([fetchCategories(), fetchTags()]);
};

// 处理文章表单提交
const handleFormSubmit = async (formData: ArticleCreateParams) => {
  try {
    createArticleDialog.loading = true;
    await cmsStore.createArticle(formData);
    ElMessage.success(t("cms.article.createSuccess"));
    createArticleDialog.visible = false;
    // 刷新文章列表
    fetchArticles();
  } catch (error) {
    logger.error("创建文章失败", error);
    ElMessage.error(t("cms.article.createFailed"));
  } finally {
    createArticleDialog.loading = false;
  }
};

// 处理文章表单取消
const handleFormCancel = () => {
  createArticleDialog.visible = false;
};

// 编辑文章
const handleEdit = async (row: Article) => {
  editArticleDialog.articleId = row.id;
  editArticleDialog.loading = true;

  try {
    // 加载分类和标签数据
    await Promise.all([fetchCategories(), fetchTags()]);

    // 获取文章详情
    const response = await cmsStore.fetchArticleDetail(row.id);
    console.log("[ArticleIndex] 获取到的文章详情数据:", response);

    // 确保我们获取到了文章数据对象
    if (response && response.data) {
      editArticleDialog.articleData = response.data;
    } else if (cmsStore.currentArticle) {
      // 如果响应中没有直接提供数据，但store中已更新了currentArticle
      editArticleDialog.articleData = cmsStore.currentArticle;
    } else {
      // 如果无法获取详细数据，至少使用表格中的行数据（不够完整但至少有基本信息）
      editArticleDialog.articleData = row;
      console.warn("[ArticleIndex] 无法获取完整的文章详情，使用表格行数据");
    }

    console.log(
      "[ArticleIndex] 传递给编辑表单的文章数据:",
      editArticleDialog.articleData
    );
    editArticleDialog.visible = true;
  } catch (error) {
    console.error("[ArticleIndex] 获取文章详情失败:", error);
    logger.error("获取文章详情失败", error);
    ElMessage.error(t("cms.article.fetchDetailFailed"));
  } finally {
    editArticleDialog.loading = false;
  }
};

// 查看文章详情
const handleDetail = (row: Article) => {
  // 在新窗口中打开文章详情页面，使用不带布局的预览路由
  const routeUrl = router.resolve({
    path: `/preview/article/${row.id}`
  });
  window.open(routeUrl.href, "_blank");
};

// 删除文章
const handleDelete = (row: Article) => {
  confirmDialog.title = t("cms.article.confirmDelete");
  confirmDialog.content = t("cms.article.confirmDeleteMessage", {
    title: row.title
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.deleteArticle(row.id);
      ElMessage.success(t("cms.article.deleteSuccess"));
      fetchArticles();
    } catch (error) {
      logger.error("删除文章失败", error);
      ElMessage.error(t("cms.article.deleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 批量删除文章
const handleBatchDelete = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("cms.article.selectArticlesToDelete"));
    return;
  }

  const ids = multipleSelection.value.map(item => item.id);
  confirmDialog.title = t("cms.article.confirmBatchDelete");
  confirmDialog.content = t("cms.article.confirmBatchDeleteMessage", {
    count: ids.length
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.batchDeleteArticles(ids);
      ElMessage.success(t("cms.article.batchDeleteSuccess"));
      fetchArticles();
      multipleSelection.value = [];
    } catch (error) {
      logger.error("批量删除文章失败", error);
      ElMessage.error(t("cms.article.batchDeleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 发布文章
const handlePublish = (row: Article) => {
  confirmDialog.title = t("cms.article.confirmPublish");
  confirmDialog.content = t("cms.article.confirmPublishMessage", {
    title: row.title
  });
  confirmDialog.type = "info";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.publishArticle(row.id);
      ElMessage.success(t("cms.article.publishSuccess"));
      fetchArticles();
    } catch (error) {
      logger.error("发布文章失败", error);
      ElMessage.error(t("cms.article.publishFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

// 处理编辑文章表单提交
const handleEditFormSubmit = async (formData: ArticleCreateParams) => {
  try {
    editArticleDialog.loading = true;
    if (!editArticleDialog.articleId) {
      throw new Error("文章ID不存在");
    }

    await cmsStore.updateArticle(editArticleDialog.articleId, formData);
    ElMessage.success(t("cms.article.updateSuccess"));
    editArticleDialog.visible = false;

    // 刷新文章列表
    fetchArticles();
  } catch (error) {
    logger.error("更新文章失败", error);
    ElMessage.error(t("cms.article.updateFailed"));
  } finally {
    editArticleDialog.loading = false;
  }
};

// 处理编辑文章表单取消
const handleEditFormCancel = () => {
  editArticleDialog.visible = false;
};

// 分类选择器变化时触发搜索
const handleCategoryChange = () => {
  pagination.currentPage = 1;
  fetchArticles();
};

// 标签选择器变化时触发搜索
const handleTagChange = () => {
  pagination.currentPage = 1;
  fetchArticles();
};

// 页面加载时获取数据
onMounted(() => {
  if (checkPermission()) {
    fetchArticles();
    // 加载分类和标签数据，确保搜索下拉框有数据
    fetchCategories();
    fetchTags();
  }
});
</script>

<template>
  <div class="article-list-container">
    <!-- 标题和新建按钮 -->
    <div class="article-list-header">
      <h2 class="article-list-title">
        {{ t("cms.article.articleManagement") }}
      </h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ t("cms.article.createArticle") }}
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form
        :model="searchForm"
        label-width="100px"
        @keyup.enter="handleSearch"
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="t('cms.article.keyword')">
              <el-input
                v-model="searchForm.search"
                :placeholder="t('cms.article.searchPlaceholder')"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item :label="t('cms.article.status')">
              <el-select v-model="searchForm.status" clearable class="w-full">
                <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item :label="t('cms.article.featured')">
              <el-select
                v-model="searchForm.is_featured"
                clearable
                class="w-full"
              >
                <el-option
                  v-for="option in featuredOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              :label="t('cms.article.dateRange')"
              class="date-range-form-item"
            >
              <el-date-picker
                v-model="searchForm.date_from"
                type="date"
                :placeholder="t('cms.article.startDate')"
                style="width: 45%"
                value-format="YYYY-MM-DD"
                clearable
              />
              <span class="date-separator">-</span>
              <el-date-picker
                v-model="searchForm.date_to"
                type="date"
                :placeholder="t('cms.article.endDate')"
                style="width: 45%"
                value-format="YYYY-MM-DD"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="t('cms.article.category')">
              <el-select
                v-model="searchForm.category"
                clearable
                class="w-full"
                placeholder="选择分类"
                @change="handleCategoryChange"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="t('cms.article.tag')">
              <el-select 
                v-model="searchForm.tag" 
                clearable 
                class="w-full"
                placeholder="选择标签"
                @change="handleTagChange"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="t('cms.article.pinned')">
              <el-select
                v-model="searchForm.is_pinned"
                clearable
                class="w-full"
              >
                <el-option
                  v-for="option in pinnedOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item class="search-buttons">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            {{ t("common.search") }}
          </el-button>
          <el-button @click="resetSearch">
            {{ t("common.reset") }}
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="multipleSelection.length === 0"
            @click="handleBatchDelete"
          >
            {{ t("cms.article.batchDelete") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文章列表表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="tableLoading"
        :data="articles"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="id" label="ID" width="80" />

        <!-- 封面图片列 -->
        <el-table-column :label="t('cms.article.coverImage')" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_image"
              :src="row.cover_image"
              style="width: 100px; height: 60px"
              fit="contain"
              :preview-src-list="[row.cover_image]"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><el-icon-picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="no-image">
              {{ t("cms.article.noCover") }}
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="t('cms.article.title')" min-width="220">
          <template #default="{ row }">
            <div class="article-title">
              <el-tooltip
                v-if="row.is_featured"
                :content="t('cms.article.featuredTooltip')"
                placement="top"
              >
                <el-tag size="small" type="danger" class="featured-tag">{{
                  t("cms.article.featured")
                }}</el-tag>
              </el-tooltip>
              <el-tooltip
                v-if="row.is_pinned"
                :content="t('cms.article.pinnedTooltip')"
                placement="top"
              >
                <el-tag size="small" type="warning" class="pinned-tag">{{
                  t("cms.article.pinned")
                }}</el-tag>
              </el-tooltip>
              <span class="title-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="t('cms.article.status')" width="120">
          <template #default="{ row }">
            <el-tag
              :type="
                row.status === 'published'
                  ? 'success'
                  : row.status === 'draft'
                    ? 'info'
                    : row.status === 'pending'
                      ? 'warning'
                      : 'danger'
              "
              size="small"
            >
              {{
                row.status === "published"
                  ? t("cms.article.statusPublished")
                  : row.status === "draft"
                    ? t("cms.article.statusDraft")
                    : row.status === "pending"
                      ? t("cms.article.statusPending")
                      : t("cms.article.statusArchived")
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          :label="t('cms.article.author')"
          prop="author_info.username"
          width="120"
        />

        <el-table-column :label="t('cms.article.createTime')" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column :label="t('cms.article.publishTime')" width="180">
          <template #default="{ row }">
            {{ row.published_at ? formatDate(row.published_at) : "-" }}
          </template>
        </el-table-column>

        <el-table-column
          :label="t('common.operation')"
          fixed="right"
          width="220"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              :icon="View"
              @click="handleDetail(row)"
              title="查看"
              text
            />
            <el-button
              size="small"
              :icon="Edit"
              type="primary"
              @click="handleEdit(row)"
              title="编辑"
              text
            />
            <el-button
              v-if="row.status !== 'published'"
              size="small"
              :icon="Upload"
              type="success"
              @click="handlePublish(row)"
              title="发布"
              text
            />
            <el-button
              size="small"
              :icon="Delete"
              type="danger"
              @click="handleDelete(row)"
              title="删除"
              text
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:currentPage="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        />
      </div>
    </el-card>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      @confirm="confirmDialog.confirmAction && confirmDialog.confirmAction()"
    />

    <!-- 创建文章模态窗口 -->
    <el-dialog
      v-model="createArticleDialog.visible"
      :title="t('cms.article.createArticle')"
      width="70%"
      destroy-on-close
    >
      <ArticleForm
        mode="create"
        :loading="createArticleDialog.loading"
        :categories="categories"
        :tags="tags"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </el-dialog>

    <!-- 编辑文章模态窗口 -->
    <el-dialog
      v-model="editArticleDialog.visible"
      :title="t('cms.article.editArticle')"
      width="70%"
      destroy-on-close
    >
      <ArticleForm
        mode="edit"
        :loading="editArticleDialog.loading"
        :categories="categories"
        :tags="tags"
        :article="editArticleDialog.articleData"
        @submit="handleEditFormSubmit"
        @cancel="handleEditFormCancel"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.article-list-container {
  padding: 20px;
}

.article-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.article-list-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.article-title {
  display: flex;
  align-items: center;
  gap: 5px;
}

.featured-tag,
.pinned-tag {
  margin-right: 5px;
}

.title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-range-form-item :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
}

.date-separator {
  margin: 0 5px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.w-full {
  width: 100%;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.no-image {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}
</style>

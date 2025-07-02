<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Edit,
  Delete,
  Upload,
  Download,
  Archive,
  Document
} from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import { useUserStoreHook } from "@/store/modules/user";
import ConfirmDialog from "@/components/Cms/Article/ConfirmDialog.vue";
import ArticleForm from "@/components/Cms/Article/ArticleForm.vue";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const cmsStore = useCmsStoreHook();
const userStore = useUserStoreHook();

// 获取文章ID
const articleId = computed(() => Number(route.params.id));

// 编辑模式状态
const isEditMode = ref(false);

// 检查用户权限
const checkPermission = () => {
  // 这里可以根据实际需求检查权限
  return true;
};

// 如果没有权限，显示无权限提示
if (!checkPermission()) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 当前文章
const currentArticle = computed(() => cmsStore.currentArticle);

// 文章统计数据
const articleStatistics = computed(() => cmsStore.articleStatistics);

// 可用分类列表和标签列表
const categories = ref([]);
const tags = ref([]);

// 确认对话框
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null
});

// 获取文章详情
const fetchArticleDetail = async () => {
  try {
    await cmsStore.fetchArticleDetail(articleId.value);

    // 获取文章统计数据
    // 在实际项目中应该调用相应的API
    // 例如：await cmsStore.fetchArticleStatistics(articleId.value);
  } catch (error) {
    logger.error("获取文章详情失败", error);
    ElMessage.error(t("cms.article.fetchDetailFailed"));
    router.push("/cms/article");
  }
};

// 编辑文章
const handleEdit = async () => {
  // 开启编辑模式前先加载分类和标签数据
  await loadCategoriesAndTags();
  // 开启编辑模式
  isEditMode.value = true;
};

// 加载分类和标签数据
const loadCategoriesAndTags = async () => {
  try {
    console.log("[ArticleDetail] 开始加载分类和标签数据");
    
    // 加载分类数据
    const categoryResponse = await cmsStore.fetchCategoryList();
    console.log("[ArticleDetail] 分类数据响应:", categoryResponse);
    
    if (categoryResponse && categoryResponse.data) {
      categories.value = Array.isArray(categoryResponse.data) 
        ? categoryResponse.data 
        : [];
      console.log("[ArticleDetail] 已加载分类数据:", categories.value);
    } else {
      console.warn("[ArticleDetail] 分类数据响应为空或格式不正确");
      categories.value = [];
    }

    // 加载标签数据
    const tagResponse = await cmsStore.fetchTagList();
    console.log("[ArticleDetail] 标签数据响应:", tagResponse);
    
    if (tagResponse && tagResponse.data) {
      if (Array.isArray(tagResponse.data)) {
        tags.value = tagResponse.data;
      } else if (tagResponse.data.results && Array.isArray(tagResponse.data.results)) {
        tags.value = tagResponse.data.results;
      } else {
        tags.value = [];
      }
      console.log("[ArticleDetail] 已加载标签数据:", tags.value);
    } else {
      console.warn("[ArticleDetail] 标签数据响应为空或格式不正确");
      tags.value = [];
    }
  } catch (error) {
    console.error("[ArticleDetail] 获取分类和标签数据失败", error);
    ElMessage.warning(t("cms.article.fetchCategoriesTagsFailed"));
    // 确保在发生错误时也有空数组而不是undefined
    categories.value = [];
    tags.value = [];
  }
};

// 取消编辑
const handleCancelEdit = () => {
  // 关闭编辑模式
  isEditMode.value = false;
};

// 提交表单
const handleSubmitEdit = async formData => {
  try {
    await cmsStore.updateArticle(articleId.value, formData);
    ElMessage.success(t("cms.article.updateSuccess"));
    isEditMode.value = false;
    fetchArticleDetail(); // 重新获取文章详情
  } catch (error) {
    logger.error("更新文章失败", error);
    ElMessage.error(t("cms.article.updateFailed"));
  }
};

// 删除文章
const handleDelete = () => {
  confirmDialog.title = t("cms.article.confirmDelete");
  confirmDialog.content = t("cms.article.confirmDeleteMessage", {
    title: currentArticle.value?.title
  });
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.deleteArticle(articleId.value);
      ElMessage.success(t("cms.article.deleteSuccess"));
      router.push("/cms/article");
    } catch (error) {
      logger.error("删除文章失败", error);
      ElMessage.error(t("cms.article.deleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 发布文章
const handlePublish = () => {
  confirmDialog.title = t("cms.article.confirmPublish");
  confirmDialog.content = t("cms.article.confirmPublishMessage", {
    title: currentArticle.value?.title
  });
  confirmDialog.type = "info";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.publishArticle(articleId.value);
      ElMessage.success(t("cms.article.publishSuccess"));
      fetchArticleDetail();
    } catch (error) {
      logger.error("发布文章失败", error);
      ElMessage.error(t("cms.article.publishFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

// 格式化文章状态
const formatStatus = (status: string) => {
  switch (status) {
    case "draft":
      return t("cms.article.statusDraft");
    case "pending":
      return t("cms.article.statusPending");
    case "published":
      return t("cms.article.statusPublished");
    case "archived":
      return t("cms.article.statusArchived");
    default:
      return status;
  }
};

// 格式化文章可见性
const formatVisibility = (visibility: string) => {
  switch (visibility) {
    case "public":
      return t("cms.article.visibilityPublic");
    case "private":
      return t("cms.article.visibilityPrivate");
    case "password":
      return t("cms.article.visibilityPassword");
    default:
      return visibility;
  }
};

// 格式化内容类型
const formatContentType = (contentType: string) => {
  switch (contentType) {
    case "markdown":
      return t("cms.article.contentTypeMarkdown");
    case "html":
      return t("cms.article.contentTypeHtml");
    default:
      return contentType;
  }
};

// 查看版本历史
const viewVersionHistory = () => {
  router.push(`/cms/article/version/${articleId.value}`);
};

// 页面加载时获取数据
onMounted(() => {
  fetchArticleDetail();
  // 预加载分类和标签数据，以便快速进入编辑模式
  loadCategoriesAndTags();
});
</script>

<template>
  <div
    class="article-detail-container"
    v-loading="cmsStore.loading.articleDetail"
  >
    <!-- 标题和操作按钮 -->
    <div class="article-detail-header">
      <h2 class="article-detail-title">
        {{
          isEditMode
            ? t("cms.article.editArticle")
            : t("cms.article.articleDetail")
        }}
      </h2>
      <div class="article-detail-actions">
        <template v-if="!isEditMode">
          <el-button type="primary" :icon="Edit" @click="handleEdit">
            {{ t("common.edit") }}
          </el-button>
          <el-button
            v-if="currentArticle && currentArticle.status !== 'published'"
            type="success"
            :icon="Upload"
            @click="handlePublish"
          >
            {{ t("cms.article.publish") }}
          </el-button>
          <el-button :icon="Document" @click="viewVersionHistory">
            {{ t("cms.article.versionHistory") }}
          </el-button>
          <el-button type="danger" :icon="Delete" @click="handleDelete">
            {{ t("common.delete") }}
          </el-button>
        </template>
        <template v-else>
          <el-button @click="handleCancelEdit">
            {{ t("common.cancel") }}
          </el-button>
        </template>
      </div>
    </div>

    <!-- 编辑模式 -->
    <div v-if="isEditMode && currentArticle" class="article-edit-content">
      <el-card>
        <ArticleForm
          mode="edit"
          :article="currentArticle"
          :loading="cmsStore.loading.articleUpdate"
          :categories="categories"
          :tags="tags"
          @submit="handleSubmitEdit"
          @cancel="handleCancelEdit"
        />
      </el-card>
    </div>

    <!-- 详情模式 -->
    <template v-if="!isEditMode">
      <!-- 文章基本信息 -->
      <el-card class="article-info-card" v-if="currentArticle">
        <template #header>
          <div class="article-info-header">
            <span>{{ t("cms.article.basicInfo") }}</span>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item :label="t('cms.article.title')" :span="3">
            <div class="article-title">
              <el-tag
                v-if="currentArticle.is_featured"
                type="danger"
                size="small"
              >
                {{ t("cms.article.featured") }}
              </el-tag>
              <el-tag
                v-if="currentArticle.is_pinned"
                type="warning"
                size="small"
              >
                {{ t("cms.article.pinned") }}
              </el-tag>
              {{ currentArticle.title }}
            </div>
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.slug')">
            {{ currentArticle.slug }}
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.status')">
            <el-tag
              :type="
                currentArticle.status === 'published'
                  ? 'success'
                  : currentArticle.status === 'draft'
                    ? 'info'
                    : currentArticle.status === 'pending'
                      ? 'warning'
                      : 'danger'
              "
            >
              {{ formatStatus(currentArticle.status) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.visibility')">
            <el-tag type="info">
              {{ formatVisibility(currentArticle.visibility) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.author')">
            {{ currentArticle.author_info?.username || "-" }}
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.contentType')">
            {{ formatContentType(currentArticle.content_type) }}
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.allowComment')">
            <el-tag :type="currentArticle.allow_comment ? 'success' : 'danger'">
              {{
                currentArticle.allow_comment ? t("common.yes") : t("common.no")
              }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.createTime')">
            {{ formatDate(currentArticle.created_at) }}
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.updateTime')">
            {{ formatDate(currentArticle.updated_at) }}
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.publishTime')">
            {{
              currentArticle.published_at
                ? formatDate(currentArticle.published_at)
                : "-"
            }}
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.categories')" :span="3">
            <div class="tags-container">
              <el-tag
                v-for="category in currentArticle.categories"
                :key="typeof category === 'object' ? category.id : category"
                class="category-tag"
              >
                {{ typeof category === "object" ? category.name : category }}
              </el-tag>
              <span
                v-if="
                  !currentArticle.categories ||
                  currentArticle.categories.length === 0
                "
              >
                {{ t("cms.article.noCategories") }}
              </span>
            </div>
          </el-descriptions-item>

          <el-descriptions-item :label="t('cms.article.tags')" :span="3">
            <div class="tags-container">
              <el-tag
                v-for="tag in currentArticle.tags"
                :key="typeof tag === 'object' ? tag.id : tag"
                type="success"
                class="tag-item"
              >
                {{ typeof tag === "object" ? tag.name : tag }}
              </el-tag>
              <span
                v-if="!currentArticle.tags || currentArticle.tags.length === 0"
              >
                {{ t("cms.article.noTags") }}
              </span>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 文章内容 -->
      <el-card class="article-content-card" v-if="currentArticle">
        <template #header>
          <div class="article-content-header">
            <span>{{ t("cms.article.content") }}</span>
          </div>
        </template>

        <div class="article-excerpt">
          <h3>{{ t("cms.article.excerpt") }}</h3>
          <div class="excerpt-content">
            {{ currentArticle.excerpt || t("cms.article.noExcerpt") }}
          </div>
        </div>

        <el-divider />

        <div class="article-content">
          <h3>{{ t("cms.article.mainContent") }}</h3>
          <div
            class="content-display"
            :class="{
              'markdown-content': currentArticle.content_type === 'markdown'
            }"
          >
            {{ currentArticle.content }}
          </div>
        </div>
      </el-card>

      <!-- 文章统计 -->
      <el-card class="article-stats-card" v-if="currentArticle">
        <template #header>
          <div class="article-stats-header">
            <span>{{ t("cms.article.statistics") }}</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic
              :title="t('cms.article.viewCount')"
              :value="currentArticle.view_count || 0"
            >
              <template #suffix>
                <el-icon><View /></el-icon>
              </template>
            </el-statistic>
          </el-col>

          <el-col :span="6">
            <el-statistic
              :title="t('cms.article.commentCount')"
              :value="currentArticle.comment_count || 0"
            >
              <template #suffix>
                <el-icon><ChatLineRound /></el-icon>
              </template>
            </el-statistic>
          </el-col>

          <el-col :span="6">
            <el-statistic
              :title="t('cms.article.likeCount')"
              :value="currentArticle.like_count || 0"
            >
              <template #suffix>
                <el-icon><Star /></el-icon>
              </template>
            </el-statistic>
          </el-col>

          <el-col :span="6">
            <el-statistic
              :title="t('cms.article.wordCount')"
              :value="currentArticle.content?.length || 0"
            >
              <template #suffix>
                <el-icon><Document /></el-icon>
              </template>
            </el-statistic>
          </el-col>
        </el-row>
      </el-card>
    </template>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      @confirm="confirmDialog.confirmAction && confirmDialog.confirmAction()"
    />
  </div>
</template>

<style scoped>
.article-detail-container {
  padding: 20px;
}

.article-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.article-detail-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.article-detail-actions {
  display: flex;
  gap: 10px;
}

.article-info-card,
.article-content-card,
.article-stats-card,
.article-edit-content {
  margin-bottom: 20px;
}

.article-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag,
.tag-item {
  margin-right: 5px;
}

.article-excerpt {
  margin-bottom: 20px;
}

.excerpt-content {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-style: italic;
}

.content-display {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 200px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.markdown-content {
  font-family: "Courier New", Courier, monospace;
}
</style>

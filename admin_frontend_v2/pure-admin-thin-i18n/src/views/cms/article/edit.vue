<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useCmsStoreHook } from "@/store/modules/cms";
import { useUserStoreHook } from "@/store/modules/user";
import ArticleForm from "@/components/Cms/Article/ArticleForm.vue";
import type { ArticleUpdateParams } from "@/types/cms";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const cmsStore = useCmsStoreHook();
const userStore = useUserStoreHook();

// 获取文章ID
const articleId = computed(() => Number(route.params.id));

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

// 加载状态
const loading = computed(
  () => cmsStore.loading.articleDetail || cmsStore.loading.articleUpdate
);

// 可用分类列表
const categories = ref([]);

// 可用标签列表
const tags = ref([]);

// 获取文章详情
const fetchArticleDetail = async () => {
  try {
    await cmsStore.fetchArticleDetail(articleId.value);
  } catch (error) {
    logger.error("获取文章详情失败", error);
    ElMessage.error(t("cms.article.fetchDetailFailed"));
    router.push("/cms/article");
  }
};

// 提交表单
const handleSubmit = async (formData: ArticleUpdateParams) => {
  try {
    await cmsStore.updateArticle(articleId.value, formData);
    ElMessage.success(t("cms.article.updateSuccess"));

    // 更新成功后跳转到文章列表
    router.push("/cms/article");
  } catch (error) {
    logger.error("更新文章失败", error);
    ElMessage.error(t("cms.article.updateFailed"));
  }
};

// 取消编辑
const handleCancel = () => {
  router.push("/cms/article");
};

// 页面加载时获取数据
onMounted(async () => {
  await fetchArticleDetail();

  // 这里应该加载分类和标签数据
  // 在实际项目中，需要调用相应的API获取这些数据
  // 例如：await cmsStore.fetchCategoryList();
  //      await cmsStore.fetchTagList();
});
</script>

<template>
  <div class="article-edit-container">
    <div class="article-edit-header">
      <h2 class="article-edit-title">{{ t("cms.article.editArticle") }}</h2>
    </div>

    <div class="article-edit-content">
      <el-card v-loading="cmsStore.loading.articleDetail">
        <ArticleForm
          v-if="currentArticle"
          mode="edit"
          :article="currentArticle"
          :loading="cmsStore.loading.articleUpdate"
          :categories="categories"
          :tags="tags"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.article-edit-container {
  padding: 20px;
}

.article-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.article-edit-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.article-edit-content {
  max-width: 1200px;
}
</style>

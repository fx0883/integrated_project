<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useCmsStoreHook } from "@/store/modules/cms";
import { useUserStoreHook } from "@/store/modules/user";
import ArticleForm from "@/components/Cms/Article/ArticleForm.vue";
import type { ArticleCreateParams } from "@/types/cms";
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

// 如果没有权限，显示无权限提示
if (!checkPermission()) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 表单加载状态
const loading = computed(() => cmsStore.loading.articleCreate);

// 可用分类列表
const categories = ref([]);

// 可用标签列表
const tags = ref([]);

// 提交表单
const handleSubmit = async (formData: ArticleCreateParams) => {
  try {
    await cmsStore.createArticle(formData);
    ElMessage.success(t("cms.article.createSuccess"));

    // 创建成功后跳转到文章列表
    router.push("/cms/article");
  } catch (error) {
    logger.error("创建文章失败", error);
    ElMessage.error(t("cms.article.createFailed"));
  }
};

// 取消创建
const handleCancel = () => {
  router.push("/cms/article");
};

// 页面加载时获取分类和标签数据
onMounted(() => {
  // 这里应该加载分类和标签数据
  // 在实际项目中，需要调用相应的API获取这些数据
  // 例如：await cmsStore.fetchCategoryList();
  //      await cmsStore.fetchTagList();
});
</script>

<template>
  <div class="article-create-container">
    <div class="article-create-header">
      <h2 class="article-create-title">
        {{ t("cms.article.createArticle") }}
      </h2>
    </div>

    <div class="article-create-content">
      <el-card>
        <ArticleForm
          mode="create"
          :loading="loading"
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
.article-create-container {
  padding: 20px;
}

.article-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.article-create-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.article-create-content {
  max-width: 1200px;
}
</style>

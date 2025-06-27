<template>
  <div class="comment-create-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t("cms.comment.createComment") }}</span>
          <el-button @click="goBack" link>{{ $t("common.back") }}</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="right"
        v-loading="loading"
      >
        <el-form-item :label="$t('cms.comment.article')" prop="article">
          <el-select
            v-model="form.article"
            filterable
            remote
            :remote-method="searchArticles"
            :loading="articleLoading"
            :placeholder="$t('cms.comment.selectArticle')"
          >
            <el-option
              v-for="item in articleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('cms.comment.parent')" prop="parent">
          <el-select
            v-model="form.parent"
            filterable
            clearable
            :disabled="!form.article"
            :placeholder="$t('cms.comment.selectParentComment')"
          >
            <el-option
              v-for="item in parentCommentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('cms.comment.content')" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            :placeholder="$t('cms.comment.contentPlaceholder')"
          />
        </el-form-item>

        <el-divider>{{ $t("cms.comment.guestInfo") }}</el-divider>

        <el-form-item :label="$t('cms.comment.guestName')" prop="guest_name">
          <el-input v-model="form.guest_name" />
        </el-form-item>

        <el-form-item :label="$t('cms.comment.guestEmail')" prop="guest_email">
          <el-input v-model="form.guest_email" />
        </el-form-item>

        <el-form-item
          :label="$t('cms.comment.guestWebsite')"
          prop="guest_website"
        >
          <el-input v-model="form.guest_website" />
        </el-form-item>

        <div class="form-actions">
          <el-button @click="goBack">{{ $t("common.cancel") }}</el-button>
          <el-button type="primary" @click="submitForm">
            {{ $t("common.save") }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import { useCmsStore } from "@/store/modules/cms";
import { useI18n } from "vue-i18n";
import type { Article, Comment } from "@/types/cms";

const { t } = useI18n();
const router = useRouter();
const cmsStore = useCmsStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const articleLoading = ref(false);
const articleOptions = ref<{ label: string; value: number }[]>([]);
const parentCommentOptions = ref<{ label: string; value: number }[]>([]);

// 表单数据
const form = reactive({
  article: undefined as number | undefined,
  parent: undefined as number | undefined,
  content: "",
  guest_name: "",
  guest_email: "",
  guest_website: ""
});

// 表单验证规则
const rules = reactive<FormRules>({
  article: [
    {
      required: true,
      message: t("cms.comment.articleRequired"),
      trigger: "change"
    }
  ],
  content: [
    {
      required: true,
      message: t("cms.comment.contentRequired"),
      trigger: "blur"
    },
    {
      min: 2,
      max: 1000,
      message: t("common.lengthLimit", { min: 2, max: 1000 }),
      trigger: "blur"
    }
  ],
  guest_name: [
    {
      required: true,
      message: t("cms.comment.guestNameRequired"),
      trigger: "blur"
    }
  ],
  guest_email: [
    {
      required: true,
      message: t("cms.comment.guestEmailRequired"),
      trigger: "blur"
    },
    { type: "email", message: t("cms.comment.invalidEmail"), trigger: "blur" }
  ]
});

// 搜索文章
const searchArticles = async (query: string) => {
  if (query.length < 2) return;

  try {
    articleLoading.value = true;
    const response = await cmsStore.fetchArticleList({
      search: query,
      per_page: 20
    });
    articleOptions.value = response.data.map((article: Article) => ({
      label: article.title,
      value: article.id
    }));
  } catch (error) {
    console.error("Failed to search articles:", error);
    ElMessage.error(t("common.fetchFailed"));
  } finally {
    articleLoading.value = false;
  }
};

// 获取父评论选项
const fetchParentComments = async (articleId: number) => {
  if (!articleId) return;

  try {
    loading.value = true;
    const response = await cmsStore.fetchCommentList({
      article: articleId,
      per_page: 100
    });
    parentCommentOptions.value = response.data.map((comment: Comment) => ({
      label:
        comment.content.length > 50
          ? `${comment.content.substring(0, 50)}...`
          : comment.content,
      value: comment.id
    }));
  } catch (error) {
    console.error("Failed to fetch parent comments:", error);
    ElMessage.error(t("common.fetchFailed"));
  } finally {
    loading.value = false;
  }
};

// 监听文章选择变化
watch(
  () => form.article,
  newValue => {
    if (newValue) {
      form.parent = undefined;
      fetchParentComments(newValue);
    } else {
      parentCommentOptions.value = [];
    }
  }
);

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        loading.value = true;
        await cmsStore.createComment({
          article: form.article!,
          parent: form.parent,
          content: form.content,
          guest_name: form.guest_name,
          guest_email: form.guest_email,
          guest_website: form.guest_website
        });
        ElMessage.success(t("cms.comment.createSuccess"));
        goBack();
      } catch (error) {
        console.error("Failed to create comment:", error);
        ElMessage.error(t("cms.comment.createFailed"));
      } finally {
        loading.value = false;
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  router.push("/cms/comment");
};
</script>

<style scoped>
.comment-create-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-actions {
  margin-top: 20px;
  text-align: right;
}
</style>

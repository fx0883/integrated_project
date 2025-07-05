<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type {
  Article,
  ArticleCreateParams,
  ArticleUpdateParams,
  ArticleStatus,
  ArticleVisibility,
  ContentType,
  Category,
  Tag
} from "@/types/cms";
import { slugify } from "@/utils/string";
import logger from "@/utils/logger";
import ImageUpload from "./ImageUpload.vue";

const { t } = useI18n();

// 定义组件属性
const props = defineProps({
  // 模式：创建/编辑
  mode: {
    type: String,
    default: "create",
    validator: (value: string) => ["create", "edit"].includes(value)
  },
  // 文章对象（编辑模式下必须提供）
  article: {
    type: Object as () => Article,
    default: null
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 可用分类列表
  categories: {
    type: Array as () => Category[],
    default: () => []
  },
  // 可用标签列表
  tags: {
    type: Array as () => Tag[],
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(["submit", "cancel"]);

// 表单引用
const formRef = ref(null);

// 编辑器内容
const editorContent = ref("");

// 表单数据
const formData = reactive<ArticleCreateParams | ArticleUpdateParams>({
  title: "",
  slug: "",
  content: "",
  content_type: "markdown",
  excerpt: "",
  status: "draft",
  is_featured: false,
  is_pinned: false,
  allow_comment: true,
  visibility: "public",
  password: "",
  cover_image: "",
  categories: [],
  tags: []
});

// 表单验证规则
const rules = {
  title: [
    {
      required: true,
      message: t("cms.article.titleRequired"),
      trigger: "blur"
    },
    { min: 2, max: 200, message: t("cms.article.titleLength"), trigger: "blur" }
  ],
  content: [
    {
      required: true,
      message: t("cms.article.contentRequired"),
      trigger: "blur"
    }
  ],
  visibility: [
    {
      required: true,
      message: t("cms.article.visibilityRequired"),
      trigger: "change"
    }
  ],
  password: [
    {
      validator: (rule, value, callback) => {
        if (formData.visibility === "password" && !value) {
          callback(new Error(t("cms.article.passwordRequired")));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};

// 状态选项
const statusOptions = [
  { value: "draft", label: t("cms.article.statusDraft") },
  { value: "pending", label: t("cms.article.statusPending") },
  { value: "published", label: t("cms.article.statusPublished") }
];

// 可见性选项
const visibilityOptions = [
  { value: "public", label: t("cms.article.visibilityPublic") },
  { value: "private", label: t("cms.article.visibilityPrivate") },
  { value: "password", label: t("cms.article.visibilityPassword") }
];

// 内容类型选项
const contentTypeOptions = [
  { value: "markdown", label: t("cms.article.contentTypeMarkdown") },
  { value: "html", label: t("cms.article.contentTypeHtml") }
];

// 是否需要密码
const needPassword = computed(() => formData.visibility === "password");

// 编辑模式下，初始化表单数据
const initFormData = () => {
  console.log("[ArticleForm] 开始初始化表单数据, 模式:", props.mode);
  console.log("[ArticleForm] 接收到的文章数据:", props.article);

  if (props.mode === "edit" && props.article) {
    const article = props.article;
    console.log("[ArticleForm] 填充表单数据:", article);

    // 重置表单，防止旧数据残留
    Object.keys(formData).forEach(key => {
      // 对于数组类型的字段，初始化为空数组而不是undefined
      if (Array.isArray(formData[key])) {
        formData[key] = [];
      } else if (typeof formData[key] === "boolean") {
        formData[key] = false;
      } else if (typeof formData[key] === "string") {
        formData[key] = "";
      }
    });

    // 填充表单数据
    Object.keys(formData).forEach(key => {
      if (key in article) {
        formData[key] = article[key];
        console.log(`[ArticleForm] 设置字段 ${key}:`, article[key]);
      }
    });

    // 单独处理content字段
    editorContent.value = article.content || "";
    console.log(
      "[ArticleForm] 设置编辑器内容:",
      editorContent.value.substring(0, 100) +
        (editorContent.value.length > 100 ? "..." : "")
    );

    console.log("[ArticleForm] 表单数据初始化完成:", formData);
  } else if (props.mode === "create") {
    // 创建模式，重置为默认值
    resetForm();
  }
};

// 自动生成 slug
const generateSlug = () => {
  if (!formData.title) return;

  formData.slug = slugify(formData.title);
};

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 同步编辑器内容到表单
    formData.content = editorContent.value;

    emit("submit", { ...formData });
  } catch (error) {
    logger.error("表单验证失败", error);
    return false;
  }
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  editorContent.value = "";
};

// 监听文章变化，更新表单数据
watch(
  () => props.article,
  newVal => {
    if (newVal) {
      initFormData();
    }
  }
);

// 监听分类和标签列表变化
watch(
  () => props.categories,
  newVal => {
    console.log("[ArticleForm] 监听到categories变化:", newVal);
  },
  { deep: true }
);

watch(
  () => props.tags,
  newVal => {
    console.log("[ArticleForm] 监听到tags变化:", newVal);
  },
  { deep: true }
);

// 监听编辑器内容变化，同步到表单数据的content字段
watch(
  () => editorContent.value,
  newVal => {
    formData.content = newVal;
  }
);

// 在组件挂载后检查分类和标签数据
onMounted(() => {
  initFormData();
  // 记录初始props数据
  console.log("[ArticleForm] 挂载时的categories:", props.categories);
  console.log("[ArticleForm] 挂载时的tags:", props.tags);
});
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="100px"
    class="article-form"
    v-loading="loading"
  >
    <!-- 基本信息 -->
    <el-form-item :label="t('cms.article.title')" prop="title">
      <el-input
        v-model="formData.title"
        :placeholder="t('cms.article.titlePlaceholder')"
        @blur="generateSlug"
      />
    </el-form-item>

    <el-form-item :label="t('cms.article.slug')" prop="slug">
      <el-input
        v-model="formData.slug"
        :placeholder="t('cms.article.slugPlaceholder')"
      />
    </el-form-item>

    <!-- 封面图片上传 -->
    <el-form-item :label="t('cms.article.coverImage')" prop="cover_image">
      <ImageUpload
        v-model="formData.cover_image"
        :disabled="loading"
        :folder="'article_covers'"
        :uploadText="t('cms.article.uploadCover')"
        :tipText="t('cms.article.coverImageTip')"
      />
    </el-form-item>

    <el-form-item :label="t('cms.article.excerpt')" prop="excerpt">
      <el-input
        v-model="formData.excerpt"
        type="textarea"
        :rows="3"
        :placeholder="t('cms.article.excerptPlaceholder')"
      />
    </el-form-item>

    <!-- 内容编辑器 -->
    <el-form-item :label="t('cms.article.content')" prop="content">
      <el-input
        v-model="editorContent"
        type="textarea"
        :rows="15"
        :placeholder="t('cms.article.contentPlaceholder')"
      />
      <div class="editor-tip">{{ t("cms.article.editorTip") }}</div>
    </el-form-item>

    <!-- 文章设置 -->
    <el-divider>{{ t("cms.article.settings") }}</el-divider>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item :label="t('cms.article.status')" prop="status">
          <el-select v-model="formData.status" class="w-full">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="8">
        <el-form-item :label="t('cms.article.contentType')" prop="content_type">
          <el-select v-model="formData.content_type" class="w-full">
            <el-option
              v-for="option in contentTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="8">
        <el-form-item :label="t('cms.article.visibility')" prop="visibility">
          <el-select v-model="formData.visibility" class="w-full">
            <el-option
              v-for="option in visibilityOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item
      v-if="needPassword"
      :label="t('cms.article.password')"
      prop="password"
    >
      <el-input
        v-model="formData.password"
        type="password"
        :placeholder="t('cms.article.passwordPlaceholder')"
        show-password
      />
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item :label="t('cms.article.featured')">
          <el-switch v-model="formData.is_featured" />
        </el-form-item>
      </el-col>

      <el-col :span="8">
        <el-form-item :label="t('cms.article.pinned')">
          <el-switch v-model="formData.is_pinned" />
        </el-form-item>
      </el-col>

      <el-col :span="8">
        <el-form-item :label="t('cms.article.allowComment')">
          <el-switch v-model="formData.allow_comment" />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 分类和标签 -->
    <el-form-item :label="t('cms.article.categories')" prop="categories">
      <el-select
        v-model="formData.categories"
        multiple
        filterable
        :placeholder="t('cms.article.categoriesPlaceholder')"
        class="w-full"
      >
        <div v-if="!categories || categories.length === 0" class="empty-tip">
          {{ t("cms.article.noCategories") }}
        </div>
        <el-option
          v-for="category in categories"
          :key="category.id"
          :label="category.name"
          :value="category.id"
        />
      </el-select>
      <div class="selection-debug">
        {{ categories?.length || 0 }} {{ t("cms.article.categoriesAvailable") }}
      </div>
    </el-form-item>

    <el-form-item :label="t('cms.article.tags')" prop="tags">
      <el-select
        v-model="formData.tags"
        multiple
        filterable
        :placeholder="t('cms.article.tagsPlaceholder')"
        class="w-full"
      >
        <div v-if="!tags || tags.length === 0" class="empty-tip">
          {{ t("cms.article.noTags") }}
        </div>
        <el-option
          v-for="tag in tags"
          :key="tag.id"
          :label="tag.name"
          :value="tag.id"
        />
      </el-select>
      <div class="selection-debug">
        {{ tags?.length || 0 }} {{ t("cms.article.tagsAvailable") }}
      </div>
    </el-form-item>

    <!-- 表单按钮 -->
    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ mode === "create" ? t("common.create") : t("common.save") }}
      </el-button>
      <el-button @click="handleCancel">{{ t("common.cancel") }}</el-button>
      <el-button v-if="mode === 'create'" @click="resetForm">{{
        t("common.reset")
      }}</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.article-form {
  padding: 20px 0;
}

.w-full {
  width: 100%;
}

.editor-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.selection-debug {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.empty-tip {
  padding: 8px 12px;
  color: #909399;
  font-style: italic;
}

:deep(.el-textarea__inner) {
  font-family: "Courier New", Courier, monospace;
}
</style>

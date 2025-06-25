# 第二阶段：文章管理功能（文章创建页）

## 概述

文章创建页是CMS模块的重要页面，允许用户创建新的文章内容，包括文章标题、内容、分类、标签和元数据等信息。本文档详细描述文章创建页的实现计划。

## 实现步骤

### 1. 文章创建页设计

`src/views/cms/article/create.vue` 将包含以下主要功能：

1. 文章基本信息表单
2. Markdown/富文本编辑器
3. 分类和标签选择
4. 文章属性设置（状态、可见性、置顶等）
5. SEO 信息设置
6. 保存和发布按钮

### 2. 文章创建页实现

下面是文章创建页的具体实现代码：

```vue
<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useCmsStoreHook } from "@/store/modules/cms";
import type { 
  ArticleCreateParams, 
  ArticleStatus, 
  ArticleVisibility,
  ContentType
} from "@/types/cms";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const cmsStore = useCmsStoreHook();

// 表单加载状态
const formLoading = computed(() => cmsStore.loading.articleCreate);

// 文章表单
const articleForm = reactive<ArticleCreateParams>({
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
  categories: [],
  tags: []
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: t("cms.article.titleRequired"), trigger: "blur" },
    { min: 2, max: 200, message: t("cms.article.titleLength"), trigger: "blur" }
  ],
  content: [
    { required: true, message: t("cms.article.contentRequired"), trigger: "blur" }
  ],
  visibility: [
    { required: true, message: t("cms.article.visibilityRequired"), trigger: "change" }
  ],
  password: [
    { 
      required: true, 
      message: t("cms.article.passwordRequired"), 
      trigger: "blur",
      validator: (rule, value, callback) => {
        if (articleForm.visibility === "password" && !value) {
          callback(new Error(t("cms.article.passwordRequired")));
        } else {
          callback();
        }
      } 
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

// 表单引用
const formRef = ref(null);

// 编辑器引用
const editorRef = ref(null);

// 自动生成 slug
const generateSlug = () => {
  if (!articleForm.title) return;
  
  // 简单的 slug 生成逻辑，实际项目中可能需要更复杂的处理
  const slug = articleForm.title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  
  articleForm.slug = slug;
};

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    // 如果编辑器存在，同步编辑器内容到表单
    if (editorRef.value && typeof editorRef.value.getContent === "function") {
      articleForm.content = editorRef.value.getContent();
    }
    
    await cmsStore.createArticle(articleForm);
    ElMessage.success(t("cms.article.createSuccess"));
    
    // 返回文章列表页
    router.push("/cms/article");
  } catch (error) {
    logger.error("创建文章失败", error);
    if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error(t("cms.article.createFailed"));
    }
  }
};

// 处理表单重置
const handleReset = () => {
  if (!formRef.value) return;
  
  formRef.value.resetFields();
  
  // 如果编辑器存在，清空编辑器内容
  if (editorRef.value && typeof editorRef.value.setContent === "function") {
    editorRef.value.setContent("");
  }
};

// 处理取消
const handleCancel = () => {
  ElMessageBox.confirm(
    t("cms.article.confirmCancel"),
    t("common.warning"),
    {
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      type: "warning"
    }
  )
    .then(() => {
      router.push("/cms/article");
    })
    .catch(() => {
      // 用户取消了确认框，不做任何操作
    });
};

// 初始化
onMounted(() => {
  // 这里可以添加一些初始化逻辑，例如获取分类和标签列表等
});
</script>

<template>
  <div class="article-create-container">
    <el-card class="form-card">
      <template #header>
        <div class="form-header">
          <h2>{{ t('cms.article.createArticle') }}</h2>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="articleForm"
        :rules="rules"
        label-position="top"
        v-loading="formLoading"
      >
        <!-- 基本信息部分 -->
        <el-row :gutter="20">
          <el-col :span="16">
            <!-- 标题 -->
            <el-form-item :label="t('cms.article.title')" prop="title">
              <el-input 
                v-model="articleForm.title" 
                :placeholder="t('cms.article.titlePlaceholder')"
                @blur="generateSlug"
              />
            </el-form-item>
            
            <!-- Slug -->
            <el-form-item :label="t('cms.article.slug')" prop="slug">
              <el-input 
                v-model="articleForm.slug" 
                :placeholder="t('cms.article.slugPlaceholder')"
              />
            </el-form-item>
            
            <!-- 内容类型 -->
            <el-form-item :label="t('cms.article.contentType')" prop="content_type">
              <el-radio-group v-model="articleForm.content_type">
                <el-radio-button 
                  v-for="option in contentTypeOptions" 
                  :key="option.value" 
                  :label="option.value"
                >
                  {{ option.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            
            <!-- 内容 -->
            <el-form-item :label="t('cms.article.content')" prop="content">
              <!-- 这里需要集成Markdown或富文本编辑器 -->
              <div class="editor-container">
                <!-- 此处应该集成项目中现有的Markdown编辑器控件 -->
                <el-input
                  v-if="!editorRef"
                  v-model="articleForm.content"
                  type="textarea"
                  :rows="15"
                  :placeholder="t('cms.article.contentPlaceholder')"
                />
              </div>
            </el-form-item>
            
            <!-- 摘要 -->
            <el-form-item :label="t('cms.article.excerpt')" prop="excerpt">
              <el-input
                v-model="articleForm.excerpt"
                type="textarea"
                :rows="3"
                :placeholder="t('cms.article.excerptPlaceholder')"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <div class="sidebar-section">
              <!-- 状态与发布信息 -->
              <div class="sidebar-box">
                <h3>{{ t('cms.article.publishInfo') }}</h3>
                
                <el-form-item :label="t('cms.article.status')" prop="status">
                  <el-select v-model="articleForm.status" style="width: 100%">
                    <el-option
                      v-for="option in statusOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item :label="t('cms.article.visibility')" prop="visibility">
                  <el-select 
                    v-model="articleForm.visibility" 
                    style="width: 100%"
                  >
                    <el-option
                      v-for="option in visibilityOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
                
                <!-- 密码保护 -->
                <el-form-item 
                  v-if="articleForm.visibility === 'password'" 
                  :label="t('cms.article.password')" 
                  prop="password"
                >
                  <el-input 
                    v-model="articleForm.password" 
                    type="password"
                    :placeholder="t('cms.article.passwordPlaceholder')"
                  />
                </el-form-item>
              </div>
              
              <!-- 分类 -->
              <div class="sidebar-box">
                <h3>{{ t('cms.article.categories') }}</h3>
                <p class="sidebar-hint">{{ t('cms.article.categoriesHint') }}</p>
                
                <!-- 此处应该集成分类选择器组件 -->
                <el-form-item prop="categories">
                  <el-select
                    v-model="articleForm.categories"
                    multiple
                    filterable
                    style="width: 100%"
                    :placeholder="t('cms.article.categoriesPlaceholder')"
                  >
                    <!-- 这里应该动态加载分类选项 -->
                  </el-select>
                </el-form-item>
              </div>
              
              <!-- 标签 -->
              <div class="sidebar-box">
                <h3>{{ t('cms.article.tags') }}</h3>
                <p class="sidebar-hint">{{ t('cms.article.tagsHint') }}</p>
                
                <!-- 此处应该集成标签选择器组件 -->
                <el-form-item prop="tags">
                  <el-select
                    v-model="articleForm.tags"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    style="width: 100%"
                    :placeholder="t('cms.article.tagsPlaceholder')"
                  >
                    <!-- 这里应该动态加载标签选项 -->
                  </el-select>
                </el-form-item>
              </div>
              
              <!-- 文章属性 -->
              <div class="sidebar-box">
                <h3>{{ t('cms.article.properties') }}</h3>
                
                <el-form-item>
                  <el-checkbox v-model="articleForm.is_featured">
                    {{ t('cms.article.featuredArticle') }}
                  </el-checkbox>
                </el-form-item>
                
                <el-form-item>
                  <el-checkbox v-model="articleForm.is_pinned">
                    {{ t('cms.article.pinnedArticle') }}
                  </el-checkbox>
                </el-form-item>
                
                <el-form-item>
                  <el-checkbox v-model="articleForm.allow_comment">
                    {{ t('cms.article.allowComment') }}
                  </el-checkbox>
                </el-form-item>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <!-- 表单按钮 -->
        <div class="form-actions">
          <el-button @click="handleCancel">
            {{ t('common.cancel') }}
          </el-button>
          <el-button @click="handleReset">
            {{ t('common.reset') }}
          </el-button>
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="formLoading"
          >
            {{ t('common.save') }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.article-create-container {
  padding: 16px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-card {
  margin-bottom: 16px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.sidebar-section {
  position: sticky;
  top: 16px;
}

.sidebar-box {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.sidebar-box h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
}

.sidebar-hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
```

### 3. 添加国际化支持

在 `locales/zh-CN.yaml` 和 `locales/en.yaml` 文件中添加文章创建页面相关的翻译：

#### zh-CN.yaml:

```yaml
cms:
  article:
    # 文章创建
    createArticle: 创建文章
    title: 标题
    titlePlaceholder: 请输入文章标题
    titleRequired: 请输入文章标题
    titleLength: 标题长度应在2到200个字符之间
    slug: 别名
    slugPlaceholder: 文章URL别名，留空将自动生成
    content: 内容
    contentPlaceholder: 请输入文章内容
    contentRequired: 请输入文章内容
    excerpt: 摘要
    excerptPlaceholder: 请输入文章摘要（可选）
    
    # 内容类型
    contentType: 内容类型
    contentTypeMarkdown: Markdown
    contentTypeHtml: HTML
    
    # 发布信息
    publishInfo: 发布信息
    status: 状态
    visibility: 可见性
    visibilityPublic: 公开
    visibilityPrivate: 仅登录用户
    visibilityPassword: 密码保护
    visibilityRequired: 请选择可见性
    password: 访问密码
    passwordPlaceholder: 请输入访问密码
    passwordRequired: 请输入访问密码
    
    # 分类和标签
    categories: 分类
    categoriesPlaceholder: 请选择分类
    categoriesHint: 选择一个或多个分类
    tags: 标签
    tagsPlaceholder: 请选择或创建标签
    tagsHint: 选择现有标签或创建新标签
    
    # 文章属性
    properties: 文章属性
    featuredArticle: 特色文章
    pinnedArticle: 置顶文章
    allowComment: 允许评论
    
    # 操作结果
    createSuccess: 创建文章成功
    createFailed: 创建文章失败
    confirmCancel: 确定要取消创建吗？未保存的内容将丢失
```

#### en.yaml:

```yaml
cms:
  article:
    # Article Creation
    createArticle: Create Article
    title: Title
    titlePlaceholder: Enter article title
    titleRequired: Please enter article title
    titleLength: Title length should be between 2 and 200 characters
    slug: Slug
    slugPlaceholder: Article URL slug, leave empty to generate automatically
    content: Content
    contentPlaceholder: Enter article content
    contentRequired: Please enter article content
    excerpt: Excerpt
    excerptPlaceholder: Enter article excerpt (optional)
    
    # Content Type
    contentType: Content Type
    contentTypeMarkdown: Markdown
    contentTypeHtml: HTML
    
    # Publish Info
    publishInfo: Publish Information
    status: Status
    visibility: Visibility
    visibilityPublic: Public
    visibilityPrivate: Registered Users Only
    visibilityPassword: Password Protected
    visibilityRequired: Please select visibility
    password: Access Password
    passwordPlaceholder: Enter access password
    passwordRequired: Please enter access password
    
    # Categories and Tags
    categories: Categories
    categoriesPlaceholder: Select categories
    categoriesHint: Select one or more categories
    tags: Tags
    tagsPlaceholder: Select or create tags
    tagsHint: Select existing tags or create new ones
    
    # Article Properties
    properties: Article Properties
    featuredArticle: Featured Article
    pinnedArticle: Pinned Article
    allowComment: Allow Comments
    
    # Operation Results
    createSuccess: Article created successfully
    createFailed: Failed to create article
    confirmCancel: Are you sure you want to cancel? Unsaved content will be lost
```

## 后续开发计划

完成文章创建页后，我们需要开发以下功能：

1. 集成Markdown编辑器组件
2. 实现分类选择器组件
3. 实现标签选择器组件
4. 实现文章编辑页，复用创建页的大部分代码，但需要添加数据加载逻辑
5. 实现文章详情页和版本历史页

文章编辑页(`src/views/cms/article/edit.vue`)将基于创建页进行开发，主要区别在于：
1. 需要根据路由参数加载文章数据
2. 表单提交时调用更新接口而非创建接口
3. 可能需要显示更多信息，如创建时间、更新时间等
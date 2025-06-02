<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">{{ isEdit ? "编辑文章" : "创建文章" }}</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Back"
              @click="goBack"
            >
              返回列表
            </el-button>
          </div>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="mt-4"
        v-loading="loading"
      >
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        
        <el-form-item label="文章分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择文章分类">
            <el-option
              v-for="item in categoryList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="文章标签" prop="tags">
          <el-select
            v-model="form.tags"
            placeholder="请选择文章标签"
            multiple
            filterable
            allow-create
            default-first-option
          >
            <el-option
              v-for="item in tagList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <div class="form-item-tip">可以输入新标签并回车创建</div>
        </el-form-item>
        
        <el-form-item label="封面图片" prop="cover_image">
          <el-upload
            class="cover-upload"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
          >
            <img v-if="form.cover_image" :src="form.cover_image" class="cover-image" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="文章摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="请输入文章摘要"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="文章内容" prop="content">
          <div class="editor-container">
            <!-- 这里可以集成富文本编辑器，如TinyMCE、Quill等 -->
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="15"
              placeholder="请输入文章内容"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="置顶文章" prop="is_featured">
          <el-switch v-model="form.is_featured" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useArticleStoreHook } from "@/store/modules/cms/article";
import { useCategoryStoreHook } from "@/store/modules/cms/category";
import { useTagStoreHook } from "@/store/modules/cms/tag";
import type { FormInstance, FormRules } from "element-plus";
import type { CategoryListItem } from "../../../../types/cms/category";
import type { TagListItem } from "../../../../types/cms/tag";
import { Back, Plus } from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// store实例
const articleStore = useArticleStoreHook();
const categoryStore = useCategoryStoreHook();
const tagStore = useTagStoreHook();

// 表单ref
const formRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 分类列表
const categoryList = ref<CategoryListItem[]>([]);
// 标签列表
const tagList = ref<TagListItem[]>([]);

// 是否为编辑模式
const isEdit = computed(() => {
  return route.name === "ArticleEdit";
});

// 获取文章ID（编辑模式）
const articleId = computed(() => {
  return isEdit.value ? parseInt(route.params.id as string) : 0;
});

// 表单数据
const form = reactive({
  title: "",
  category_id: undefined as number | undefined,
  tags: [] as number[],
  cover_image: "",
  summary: "",
  content: "",
  status: "draft",
  is_featured: false
});

// 表单校验规则
const rules = reactive<FormRules>({
  title: [
    { required: true, message: "请输入文章标题", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 到 100 个字符", trigger: "blur" }
  ],
  category_id: [
    { required: true, message: "请选择文章分类", trigger: "change" }
  ],
  summary: [
    { max: 200, message: "摘要最多200个字符", trigger: "blur" }
  ],
  content: [
    { required: true, message: "请输入文章内容", trigger: "blur" }
  ],
  status: [
    { required: true, message: "请选择文章状态", trigger: "change" }
  ]
});

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchTags()
  ]);
  
  if (isEdit.value) {
    await fetchArticleDetail();
  }
});

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true;
  try {
    const result = await categoryStore.fetchCategories();
    if (result) {
      categoryList.value = result.list;
    }
  } finally {
    loading.value = false;
  }
};

// 获取标签列表
const fetchTags = async () => {
  loading.value = true;
  try {
    const result = await tagStore.fetchTags();
    if (result) {
      tagList.value = result.list;
    }
  } finally {
    loading.value = false;
  }
};

// 获取文章详情（编辑模式）
const fetchArticleDetail = async () => {
  loading.value = true;
  try {
    const data = await articleStore.fetchArticleDetail(articleId.value);
    if (data) {
      // 填充表单数据
      form.title = data.title;
      form.category_id = data.category_id;
      form.tags = data.tags.map(tag => tag.id);
      form.cover_image = data.cover_image || "";
      form.summary = data.summary;
      form.content = data.content;
      form.status = data.status;
      form.is_featured = data.is_featured;
    } else {
      ElMessage.error("获取文章信息失败");
      goBack();
    }
  } finally {
    loading.value = false;
  }
};

// 上传封面前的校验
const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('封面只能是图片格式!');
  }
  
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!');
  }
  
  return isImage && isLt2M;
};

// 上传封面成功回调
const handleCoverSuccess = (res: any, file: File) => {
  if (res.success && res.data) {
    form.cover_image = res.data.url;
  } else {
    ElMessage.error("上传失败");
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        let result;
        
        // 准备提交的数据
        const submitData = {
          title: form.title,
          category_id: form.category_id,
          tags: form.tags,
          cover_image: form.cover_image,
          summary: form.summary,
          content: form.content,
          status: form.status,
          is_featured: form.is_featured
        };
        
        if (isEdit.value) {
          // 编辑模式
          result = await articleStore.updateArticle(articleId.value, submitData);
        } else {
          // 创建模式
          result = await articleStore.createArticle(submitData);
        }
        
        if (result && result.success) {
          ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
          goBack();
        } else {
          ElMessage.error(result?.message || (isEdit.value ? "更新失败" : "创建失败"));
        }
      } finally {
        loading.value = false;
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  
  // 如果是编辑模式，重新获取文章信息
  if (isEdit.value) {
    fetchArticleDetail();
  }
};

// 返回列表页
const goBack = () => {
  router.push("/cms/article/list");
};
</script>

<style scoped>
.main {
  margin: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.cover-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 300px;
  height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-upload:hover {
  border-color: #409EFF;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.editor-container {
  min-height: 400px;
  width: 100%;
}
</style> 
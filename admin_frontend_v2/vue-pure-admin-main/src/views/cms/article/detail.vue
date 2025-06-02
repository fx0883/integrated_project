<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">文章详情</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Edit"
              @click="handleEdit"
            >
              编辑
            </el-button>
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
      
      <div v-loading="loading">
        <el-empty v-if="!article" description="未找到文章信息"></el-empty>
        
        <template v-else>
          <div class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ article.author }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ article.created_at }}
              </span>
              <span class="meta-item">
                <el-icon><View /></el-icon>
                {{ article.views }} 阅读
              </span>
              <span class="meta-item">
                <el-icon><Collection /></el-icon>
                {{ article.category_name }}
              </span>
              <el-tag
                v-for="tag in article.tags"
                :key="tag.id"
                size="small"
                class="meta-tag"
              >
                {{ tag.name }}
              </el-tag>
            </div>
            <div class="article-status">
              <el-tag
                :type="article.status === 'published' ? 'success' : article.status === 'draft' ? 'info' : 'warning'"
              >
                {{ article.status === 'published' ? '已发布' : article.status === 'draft' ? '草稿' : '已归档' }}
              </el-tag>
              <el-tag v-if="article.is_featured" type="danger" class="ml-2">置顶</el-tag>
            </div>
          </div>
          
          <el-divider />
          
          <div class="article-content" v-html="article.content"></div>
          
          <el-divider />
          
          <div class="article-footer">
            <div class="action-row">
              <el-button
                v-if="article.status !== 'published'"
                type="success"
                :icon="Upload"
                @click="handlePublish"
              >
                发布文章
              </el-button>
              <el-button
                v-if="article.status !== 'archived'"
                type="warning"
                :icon="Folder"
                @click="handleArchive"
              >
                归档文章
              </el-button>
              <el-button
                v-if="!article.is_featured"
                type="primary"
                :icon="Top"
                @click="handleFeatured(true)"
              >
                置顶文章
              </el-button>
              <el-button
                v-else
                type="info"
                :icon="Bottom"
                @click="handleFeatured(false)"
              >
                取消置顶
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                @click="handleDelete"
              >
                删除文章
              </el-button>
            </div>
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useArticleStoreHook } from "@/store/modules/cms/article";
import type { ArticleDetail } from "../../../../types/cms/article";
import {
  Edit,
  Back,
  Upload,
  Folder,
  Top,
  Bottom,
  Delete,
  User,
  Calendar,
  View,
  Collection
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// 文章store
const articleStore = useArticleStoreHook();

// 文章详情数据
const article = ref<ArticleDetail | null>(null);
const loading = ref(false);

// 获取文章ID
const articleId = parseInt(route.params.id as string);

// 初始化
onMounted(async () => {
  if (articleId) {
    await fetchArticleDetail();
  }
});

// 获取文章详情
const fetchArticleDetail = async () => {
  loading.value = true;
  try {
    const data = await articleStore.fetchArticleDetail(articleId);
    article.value = data;
    
    if (!data) {
      ElMessage.error("获取文章信息失败");
      goBack();
    }
  } finally {
    loading.value = false;
  }
};

// 编辑文章
const handleEdit = () => {
  router.push(`/cms/article/edit/${articleId}`);
};

// 发布文章
const handlePublish = () => {
  if (!article.value) return;
  
  ElMessageBox.confirm(`确认要发布文章 ${article.value.title} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.publishArticle(articleId);
      if (result && result.success) {
        ElMessage.success("文章已发布");
        fetchArticleDetail();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 归档文章
const handleArchive = () => {
  if (!article.value) return;
  
  ElMessageBox.confirm(`确认要归档文章 ${article.value.title} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.archiveArticle(articleId);
      if (result && result.success) {
        ElMessage.success("文章已归档");
        fetchArticleDetail();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 置顶/取消置顶文章
const handleFeatured = (featured: boolean) => {
  if (!article.value) return;
  
  const actionText = featured ? "置顶" : "取消置顶";
  ElMessageBox.confirm(`确认要${actionText}文章 ${article.value.title} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.featuredArticle(articleId, featured);
      if (result && result.success) {
        ElMessage.success(`文章已${actionText}`);
        fetchArticleDetail();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 删除文章
const handleDelete = () => {
  if (!article.value) return;
  
  ElMessageBox.confirm(`确认要删除文章 ${article.value.title} 吗？此操作不可恢复！`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.deleteArticle(articleId);
      if (result && result.success) {
        ElMessage.success("删除成功");
        goBack();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
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

.article-header {
  margin-bottom: 20px;
}

.article-title {
  font-size: 24px;
  margin-bottom: 15px;
  font-weight: bold;
}

.article-meta {
  color: #606266;
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.meta-item {
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.meta-item .el-icon {
  margin-right: 5px;
}

.meta-tag {
  margin-right: 5px;
}

.article-status {
  margin-top: 10px;
}

.article-content {
  line-height: 1.8;
  font-size: 16px;
  padding: 10px 0;
}

.article-footer {
  margin-top: 20px;
}

.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style> 
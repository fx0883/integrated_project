<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">文章列表</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleCreate"
            >
              新增文章
            </el-button>
          </div>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="queryParams"
        :inline="true"
        class="search-form mb-4"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入文章标题"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select
            v-model="queryParams.category_id"
            placeholder="请选择分类"
            clearable
          >
            <el-option
              v-for="item in categoryList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="articleList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column label="标签" width="180">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag.id"
              size="small"
              class="mr-1"
            >
              {{ tag.name }}
            </el-tag>
            <span v-if="!row.tags || row.tags.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'published' ? 'success' : row.status === 'draft' ? 'info' : 'warning'"
            >
              {{ row.status === 'published' ? '已发布' : row.status === 'draft' ? '草稿' : '已归档' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="置顶" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_featured" type="danger">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="views" label="浏览量" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="View"
              @click="handleDetail(row)"
            >
              详情
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status !== 'published'"
              link
              type="success"
              :icon="Upload"
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button
              v-if="row.status !== 'archived'"
              link
              type="warning"
              :icon="Folder"
              @click="handleArchive(row)"
            >
              归档
            </el-button>
            <el-button
              v-if="!row.is_featured"
              link
              type="primary"
              :icon="Top"
              @click="handleFeatured(row, true)"
            >
              置顶
            </el-button>
            <el-button
              v-else
              link
              type="info"
              :icon="Bottom"
              @click="handleFeatured(row, false)"
            >
              取消置顶
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useArticleStoreHook } from "@/store/modules/cms/article";
import { useCategoryStoreHook } from "@/store/modules/cms/category";
import type { ArticleListItem } from "../../../../types/cms/article";
import type { CategoryListItem } from "../../../../types/cms/category";
import {
  Plus,
  Search,
  Refresh,
  Edit,
  Delete,
  View,
  Upload,
  Folder,
  Top,
  Bottom
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();

// store实例
const articleStore = useArticleStoreHook();
const categoryStore = useCategoryStoreHook();

// 文章列表数据
const articleList = ref<ArticleListItem[]>([]);
const categoryList = ref<CategoryListItem[]>([]);
const total = ref(0);
const loading = ref(false);

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  title: "",
  category_id: "",
  status: ""
});

// 表单ref
const formRef = ref();

// 初始化
onMounted(() => {
  getList();
  getCategoryList();
});

// 获取列表数据
const getList = async () => {
  loading.value = true;
  try {
    const result = await articleStore.fetchArticles(queryParams);
    if (result) {
      articleList.value = result.list;
      total.value = result.total;
    }
  } finally {
    loading.value = false;
  }
};

// 获取分类列表
const getCategoryList = async () => {
  const result = await categoryStore.fetchCategories();
  if (result) {
    categoryList.value = result.list;
  }
};

// 查询
const handleQuery = () => {
  queryParams.page = 1;
  getList();
};

// 重置查询
const resetQuery = () => {
  formRef.value?.resetFields();
  queryParams.page = 1;
  getList();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.limit = val;
  getList();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  getList();
};

// 新增文章
const handleCreate = () => {
  router.push("/cms/article/create");
};

// 编辑文章
const handleEdit = (row: ArticleListItem) => {
  router.push(`/cms/article/edit/${row.id}`);
};

// 查看详情
const handleDetail = (row: ArticleListItem) => {
  router.push(`/cms/article/detail/${row.id}`);
};

// 发布文章
const handlePublish = (row: ArticleListItem) => {
  ElMessageBox.confirm(`确认要发布文章 ${row.title} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.publishArticle(row.id);
      if (result && result.success) {
        ElMessage.success("文章已发布");
        getList();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 归档文章
const handleArchive = (row: ArticleListItem) => {
  ElMessageBox.confirm(`确认要归档文章 ${row.title} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.archiveArticle(row.id);
      if (result && result.success) {
        ElMessage.success("文章已归档");
        getList();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 置顶/取消置顶文章
const handleFeatured = (row: ArticleListItem, featured: boolean) => {
  const actionText = featured ? "置顶" : "取消置顶";
  ElMessageBox.confirm(`确认要${actionText}文章 ${row.title} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.featuredArticle(row.id, featured);
      if (result && result.success) {
        ElMessage.success(`文章已${actionText}`);
        getList();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 删除文章
const handleDelete = (row: ArticleListItem) => {
  ElMessageBox.confirm(`确认要删除文章 ${row.title} 吗？此操作不可恢复！`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await articleStore.deleteArticle(row.id);
      if (result && result.success) {
        ElMessage.success("删除成功");
        getList();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
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

.search-form {
  margin-bottom: 15px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style> 
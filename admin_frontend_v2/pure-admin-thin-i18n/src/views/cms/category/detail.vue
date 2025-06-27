<template>
  <div class="category-detail-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t("cms.category.categoryDetail") }}</span>
          <div class="header-actions">
            <el-button @click="handleEdit" type="primary" link>
              {{ $t("common.edit") }}
            </el-button>
            <el-button @click="goBack" link>{{ $t("common.back") }}</el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <el-empty v-if="!category" :description="$t('common.noData')" />

        <template v-else>
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="$t('cms.category.id')">
              {{ category.id }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.name')">
              {{ category.name }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.slug')">
              {{ category.slug }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.parent')">
              <template v-if="category.parent_id">
                {{ getParentName(category.parent_id) }}
              </template>
              <template v-else>
                {{ $t("cms.category.noParent") }}
              </template>
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.level')">
              {{ category.level }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.path')">
              {{ category.path }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.description')">
              {{ category.description || $t("common.none") }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.icon')">
              <el-icon v-if="category.icon">
                <component :is="category.icon" />
              </el-icon>
              <span v-else>{{ $t("common.none") }}</span>
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.sortOrder')">
              {{ category.sort_order }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.isActive')">
              <el-tag :type="category.is_active ? 'success' : 'danger'">
                {{
                  category.is_active
                    ? $t("cms.category.statusActive")
                    : $t("cms.category.statusInactive")
                }}
              </el-tag>
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.articleCount')">
              {{ category.article_count || 0 }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.createdAt')">
              {{ formatDateTime(category.created_at) }}
            </el-descriptions-item>

            <el-descriptions-item :label="$t('cms.category.updatedAt')">
              {{ formatDateTime(category.updated_at) }}
            </el-descriptions-item>
          </el-descriptions>

          <div
            v-if="category.children && category.children.length > 0"
            class="sub-categories"
          >
            <h3>{{ $t("cms.category.children") }}</h3>
            <el-table :data="category.children" stripe>
              <el-table-column
                prop="id"
                :label="$t('cms.category.id')"
                width="80"
              />
              <el-table-column prop="name" :label="$t('cms.category.name')" />
              <el-table-column prop="slug" :label="$t('cms.category.slug')" />
              <el-table-column :label="$t('cms.category.isActive')" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.is_active ? 'success' : 'danger'">
                    {{
                      row.is_active
                        ? $t("cms.category.statusActive")
                        : $t("cms.category.statusInactive")
                    }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('cms.category.actions')" width="150">
                <template #default="{ row }">
                  <el-button @click="viewCategory(row.id)" link>
                    {{ $t("common.view") }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useCmsStore } from "@/store/modules/cms";
import { useI18n } from "vue-i18n";
import type { Category } from "@/types/cms";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const cmsStore = useCmsStore();
const loading = ref(false);

// 获取分类ID
const categoryId = computed(() => Number(route.params.id));

// 获取分类详情
const category = computed<Category | null>(() => cmsStore.currentCategory);

// 格式化日期时间
const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString();
};

// 获取父分类名称
const getParentName = (parentId: number) => {
  const parent = cmsStore.categories.find(item => item.id === parentId);
  return parent ? parent.name : $t("common.unknown");
};

// 获取分类详情
const fetchCategoryDetail = async () => {
  try {
    loading.value = true;
    await Promise.all([
      cmsStore.fetchCategoryDetail(categoryId.value),
      cmsStore.fetchCategoryList()
    ]);
  } catch (error) {
    console.error("Failed to fetch category detail:", error);
    ElMessage.error(t("common.fetchFailed"));
  } finally {
    loading.value = false;
  }
};

// 查看子分类
const viewCategory = (id: number) => {
  router.push(`/cms/category/${id}`);
};

// 编辑分类
const handleEdit = () => {
  router.push(`/cms/category/edit/${categoryId.value}`);
};

// 返回上一页
const goBack = () => {
  router.push("/cms/category");
};

// 初始化
onMounted(() => {
  fetchCategoryDetail();
});
</script>

<style scoped>
.category-detail-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.sub-categories {
  margin-top: 30px;
}
</style>

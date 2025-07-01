<template>
  <div class="tag-list-container">
    <!-- 标题和新建按钮 -->
    <div class="tag-list-header">
      <h2 class="tag-list-title">{{ $t("cms.tag.tagManagement") }}</h2>
      <el-button type="primary" :icon="Plus" @click="handleAddTag">
        {{ $t("cms.tag.createTag") }}
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form @keyup.enter="handleSearch">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="$t('cms.tag.keyword')">
              <el-input
                v-model="searchKeyword"
                :placeholder="$t('cms.tag.searchPlaceholder')"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="$t('cms.tag.isActive')">
              <el-select
                v-model="queryParams.is_active"
                :placeholder="$t('cms.tag.isActive')"
                clearable
                style="width: 100%"
                @change="handleStatusChange"
              >
                <el-option :label="$t('cms.tag.statusAll')" value="" />
                <el-option :label="$t('cms.tag.statusActive')" :value="true" />
                <el-option
                  :label="$t('cms.tag.statusInactive')"
                  :value="false"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item class="search-buttons">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            {{ $t("common.search") }}
          </el-button>
          <el-button :icon="Refresh" @click="refreshData">
            {{ $t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 标签列表表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="cmsStore.tagLoading"
        :data="cmsStore.tagList"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" :label="$t('cms.tag.id')" width="80" />
        <el-table-column :label="$t('cms.tag.name')" min-width="180">
          <template #default="{ row }">
            <div class="tag-name-container">
              <div
                class="color-dot"
                :style="{ backgroundColor: row.color || '#409EFF' }"
              ></div>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="slug"
          :label="$t('cms.tag.slug')"
          min-width="180"
        />
        <el-table-column
          prop="description"
          :label="$t('cms.tag.description')"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="article_count"
          :label="$t('cms.tag.articleCount')"
          width="100"
          align="center"
        />
        <el-table-column
          :label="$t('cms.tag.isActive')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{
                row.is_active
                  ? $t("cms.tag.statusActive")
                  : $t("cms.tag.statusInactive")
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="created_at"
          :label="$t('cms.tag.createdAt')"
          width="180"
        />
        <el-table-column
          :label="$t('cms.tag.actions')"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEditTag(row)">
              {{ $t("common.edit") }}
            </el-button>
            <el-button type="danger" link @click="handleDeleteTag(row)">
              {{ $t("common.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="cmsStore.tagTotal"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 标签表单对话框 -->
    <el-dialog
      v-model="tagFormVisible"
      :title="
        formMode === 'create' ? $t('cms.tag.createTag') : $t('cms.tag.editTag')
      "
      width="50%"
      :close-on-click-modal="false"
    >
      <TagForm ref="tagFormRef" :tag="currentTag" :loading="formLoading" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="tagFormVisible = false">{{
            $t("common.cancel")
          }}</el-button>
          <el-button
            type="primary"
            :loading="formLoading"
            @click="handleFormSubmit"
          >
            {{ $t("common.confirm") }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 确认删除对话框 -->
    <ConfirmDialog
      ref="confirmDialogRef"
      :title="$t('cms.tag.confirmDelete')"
      :message="
        $t('cms.tag.confirmDeleteMessage', {
          name: tagToDelete ? tagToDeleteName : ''
        })
      "
      type="warning"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import { useCmsStore } from "@/store/modules/cms";
import { Tag, TagListParams } from "@/types/cms";
import TagForm from "@/components/Cms/Tag/TagForm.vue";
import ConfirmDialog from "@/components/Cms/Tag/ConfirmDialog.vue";
import { useI18n } from "vue-i18n";
import logger from "@/utils/logger";

// 组件引用
const tagFormRef = ref();
const confirmDialogRef = ref();
const { t } = useI18n();

// Store
const cmsStore = useCmsStore();

// 状态
const searchKeyword = ref("");
const tagFormVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const currentTag = ref<Tag | null>(null);
const formLoading = ref(false);
const deleteLoading = ref(false);
const tagToDelete = ref<number | null>(null);
const tagToDeleteName = ref("");

// 查询参数
const queryParams = reactive<TagListParams>({
  search: "",
  is_active: "",
  page: 1,
  page_size: 10
});

// 获取标签列表数据
const fetchData = async () => {
  try {
    await cmsStore.fetchTagList(queryParams);
  } catch (error) {
    logger.error(t("cms.tag.fetchListFailed"), error);
    ElMessage.error(t("cms.tag.fetchListFailed"));
  }
};

// 刷新数据
const refreshData = () => {
  // 重置所有查询参数
  searchKeyword.value = "";
  queryParams.search = "";
  queryParams.is_active = "";
  queryParams.page = 1;
  queryParams.page_size = 10;
  fetchData();
};

// 搜索
const handleSearch = () => {
  queryParams.search = searchKeyword.value;
  queryParams.page = 1;
  fetchData();
};

// 状态过滤变化
const handleStatusChange = () => {
  queryParams.page = 1;
  fetchData();
};

// 页码变化
const handleCurrentChange = (page: number) => {
  queryParams.page = page;
  fetchData();
};

// 每页条数变化
const handleSizeChange = (size: number) => {
  queryParams.page_size = size;
  queryParams.page = 1;
  fetchData();
};

// 添加标签
const handleAddTag = () => {
  formMode.value = "create";
  currentTag.value = null;
  tagFormVisible.value = true;

  // 等待DOM更新后重置表单
  setTimeout(() => {
    tagFormRef.value?.resetForm();
  }, 0);
};

// 编辑标签
const handleEditTag = (tag: Tag) => {
  formMode.value = "edit";
  currentTag.value = { ...tag };
  tagFormVisible.value = true;
};

// 删除标签
const handleDeleteTag = (tag: Tag) => {
  tagToDelete.value = tag.id;
  tagToDeleteName.value = tag.name;
  confirmDialogRef.value?.open();
};

// 确认删除
const confirmDelete = async () => {
  if (tagToDelete.value === null) return;

  deleteLoading.value = true;
  try {
    await cmsStore.deleteTag(tagToDelete.value);
    ElMessage.success(t("cms.tag.deleteSuccess"));
    fetchData();
    confirmDialogRef.value?.close();
  } catch (error) {
    logger.error(t("cms.tag.deleteFailed"), error);
    ElMessage.error(t("cms.tag.deleteFailed"));
  } finally {
    deleteLoading.value = false;
    tagToDelete.value = null;
    tagToDeleteName.value = "";
  }
};

// 表单提交
const handleFormSubmit = async () => {
  formLoading.value = true;
  try {
    await tagFormRef.value?.submitForm();
    const formData = tagFormRef.value?.form;

    if (!formData) {
      throw new Error(t("cms.tag.formDataError") || "获取表单数据失败");
    }

    if (formMode.value === "create") {
      await cmsStore.createTag(formData);
      ElMessage.success(t("cms.tag.createSuccess"));
    } else {
      if (!currentTag.value?.id) {
        throw new Error(t("cms.tag.idNotFound") || "标签ID不存在");
      }
      await cmsStore.updateTag(currentTag.value.id, formData);
      ElMessage.success(t("cms.tag.updateSuccess"));
    }

    tagFormVisible.value = false;
    fetchData();
  } catch (error) {
    logger.error(
      formMode.value === "create"
        ? t("cms.tag.createFailed")
        : t("cms.tag.updateFailed"),
      error
    );
    ElMessage.error(
      formMode.value === "create"
        ? t("cms.tag.createFailed")
        : t("cms.tag.updateFailed")
    );
  } finally {
    formLoading.value = false;
  }
};

// 生命周期钩子
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.tag-list-container {
  padding: 20px;
}

.tag-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tag-list-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.tag-name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

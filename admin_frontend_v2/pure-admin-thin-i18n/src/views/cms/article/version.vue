<template>
  <div
    class="article-version-history"
    v-loading="cmsStore.loading.articleVersions"
  >
    <!-- 标题和操作按钮 -->
    <div class="article-version-header">
      <h2 class="article-version-title">
        {{ $t("cms.article.versionHistory") }}
      </h2>
      <div class="article-version-actions">
        <el-button :icon="Back" @click="handleBack">
          {{ $t("common.back") }}
        </el-button>
      </div>
    </div>

    <!-- 版本列表 -->
    <el-card class="version-list-card">
      <template #header>
        <div class="version-list-header">
          <span>{{ $t("cms.article.versionList") }}</span>
        </div>
      </template>

      <el-table
        v-loading="loading.articleVersions"
        :data="articleVersions"
        style="width: 100%"
      >
        <el-table-column
          prop="version_number"
          :label="$t('cms.article.versionNumber')"
          width="120"
        />
        <el-table-column
          prop="created_at"
          :label="$t('cms.article.versionCreatedAt')"
          width="180"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="user.username"
          :label="$t('cms.article.versionCreatedBy')"
          width="180"
        />
        <el-table-column :label="$t('common.actions')" width="280">
          <template #default="scope">
            <el-button
              size="small"
              @click="viewVersion(scope.row.version_number)"
            >
              {{ $t("common.view") }}
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="compareWithCurrent(scope.row.version_number)"
            >
              {{ $t("cms.article.compareVersions") }}
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="confirmRestore(scope.row.version_number)"
            >
              {{ $t("cms.article.restoreVersion") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="articleVersions.length === 0" class="no-data">
        {{ $t("cms.article.noVersions") }}
      </div>
    </el-card>

    <!-- 版本详情对话框 -->
    <el-dialog
      v-model="versionDetailVisible"
      :title="$t('cms.article.versionDetail')"
      width="80%"
    >
      <div v-loading="loading.versionDetail">
        <h2>{{ versionDetail?.title }}</h2>
        <div class="version-meta">
          <p>{{ $t("cms.article.versionNumber") }}: {{ selectedVersion }}</p>
          <p>
            {{ $t("cms.article.status") }}:
            {{ formatStatus(versionDetail?.status) }}
          </p>
          <p>
            {{ $t("cms.article.createdAt") }}:
            {{ formatDateTime(versionDetail?.created_at) }}
          </p>
        </div>
        <el-divider />
        <div class="version-content">
          <div
            :class="{
              'markdown-content': versionDetail?.content_type === 'markdown'
            }"
          >
            {{ versionDetail?.content }}
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 版本比较对话框 -->
    <el-dialog
      v-model="versionCompareVisible"
      :title="$t('cms.article.versionDiff')"
      width="90%"
    >
      <div v-loading="loading.versionCompare" class="version-diff">
        <div class="diff-header">
          <div class="diff-version">
            <span class="version-label"
              >{{ $t("cms.article.oldVersion") }}:</span
            >
            <span class="version-number">{{ selectedVersion }}</span>
          </div>
          <div class="diff-version">
            <span class="version-label"
              >{{ $t("cms.article.currentVersion") }}:</span
            >
            <span class="version-number">{{ $t("cms.article.latest") }}</span>
          </div>
        </div>
        <el-divider />
        <div class="diff-container" v-html="diffResult"></div>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmRestoreVisible"
      :title="$t('cms.article.confirmRestore')"
      width="30%"
    >
      <span>{{
        $t("cms.article.confirmRestoreMessage", { version: selectedVersion })
      }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmRestoreVisible = false">{{
            $t("common.cancel")
          }}</el-button>
          <el-button
            type="primary"
            @click="restoreVersion"
            :loading="loading.restore"
          >
            {{ $t("common.confirm") }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Back } from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import logger from "@/utils/logger";
import type { ArticleVersion, Article } from "@/types/cms";
import * as Diff from "diff";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const cmsStore = useCmsStoreHook();

// 获取文章ID
const articleId = computed(() => Number(route.params.id));

// 版本列表
const articleVersions = computed(() => cmsStore.articleVersions || []);

// 加载状态
const loading = reactive({
  articleVersions: false,
  versionDetail: false,
  versionCompare: false,
  restore: false
});

// 版本详情相关
const versionDetailVisible = ref(false);
const versionDetail = ref<Article | null>(null);
const selectedVersion = ref<number>(0);

// 版本比较相关
const versionCompareVisible = ref(false);
const diffResult = ref("");

// 恢复确认相关
const confirmRestoreVisible = ref(false);

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString();
};

// 格式化文章状态
const formatStatus = (status: string) => {
  switch (status) {
    case "draft":
      return t("cms.article.statusDraft");
    case "pending":
      return t("cms.article.statusPending");
    case "published":
      return t("cms.article.statusPublished");
    case "archived":
      return t("cms.article.statusArchived");
    default:
      return status || "-";
  }
};

// 初始化
onMounted(async () => {
  await fetchVersions();
});

// 获取版本历史
async function fetchVersions() {
  loading.articleVersions = true;
  try {
    await cmsStore.fetchArticleVersions(articleId.value);
  } catch (error) {
    logger.error("获取文章版本历史失败", error);
    ElMessage.error(t("cms.article.fetchVersionsFailed"));
  } finally {
    loading.articleVersions = false;
  }
}

// 查看特定版本
async function viewVersion(versionNumber: number) {
  selectedVersion.value = versionNumber;
  versionDetailVisible.value = true;
  loading.versionDetail = true;

  try {
    const response = await cmsStore.fetchArticleVersionDetail(
      articleId.value,
      versionNumber
    );
    versionDetail.value = response.data;
  } catch (error) {
    logger.error("获取文章版本详情失败", error);
    ElMessage.error(t("cms.article.fetchVersionDetailFailed"));
  } finally {
    loading.versionDetail = false;
  }
}

// 与当前版本比较
async function compareWithCurrent(versionNumber: number) {
  selectedVersion.value = versionNumber;
  versionCompareVisible.value = true;
  loading.versionCompare = true;

  try {
    // 获取历史版本
    const historicalVersionResponse = await cmsStore.fetchArticleVersionDetail(
      articleId.value,
      versionNumber
    );
    const historicalVersion = historicalVersionResponse.data;

    // 获取当前版本
    const currentVersionResponse = await cmsStore.fetchArticleDetail(
      articleId.value
    );
    const currentVersion = currentVersionResponse;

    // 实现差异比较逻辑
    const oldContent = historicalVersion.content || "";
    const newContent = currentVersion.content || "";

    // 文本差异
    const diffParts = Diff.diffWords(oldContent, newContent);

    // 将差异结果渲染为HTML
    const diffHtml = diffParts
      .map(part => {
        const color = part.added ? "green" : part.removed ? "red" : "grey";
        const bgColor = part.added
          ? "#e6ffe6"
          : part.removed
            ? "#ffe6e6"
            : "transparent";
        return `<span style="color: ${color}; background-color: ${bgColor};">${part.value}</span>`;
      })
      .join("");

    diffResult.value = diffHtml;
  } catch (error) {
    logger.error("比较版本失败", error);
    ElMessage.error(t("cms.article.compareVersionsFailed"));
  } finally {
    loading.versionCompare = false;
  }
}

// 确认恢复版本
function confirmRestore(versionNumber: number) {
  selectedVersion.value = versionNumber;
  confirmRestoreVisible.value = true;
}

// 恢复到特定版本
async function restoreVersion() {
  loading.restore = true;
  try {
    // 获取历史版本内容
    const response = await cmsStore.fetchArticleVersionDetail(
      articleId.value,
      selectedVersion.value
    );
    const versionData = response.data;

    // 使用历史版本数据更新当前文章
    await cmsStore.updateArticle(articleId.value, {
      title: versionData.title,
      content: versionData.content,
      content_type: versionData.content_type,
      excerpt: versionData.excerpt,
      status: versionData.status,
      visibility: versionData.visibility,
      allow_comment: versionData.allow_comment,
      categories: versionData.categories,
      tags: versionData.tags
    });

    ElMessage.success(t("cms.article.restoreSuccess"));
    confirmRestoreVisible.value = false;
    router.push(`/cms/article/detail/${articleId.value}`);
  } catch (error) {
    logger.error("恢复版本失败", error);
    ElMessage.error(t("cms.article.restoreFailed"));
  } finally {
    loading.restore = false;
  }
}

// 返回文章详情页
function handleBack() {
  router.push(`/cms/article/detail/${articleId.value}`);
}
</script>

<style scoped>
.article-version-history {
  padding: 20px;
}

.article-version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.article-version-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.article-version-actions {
  display: flex;
  gap: 10px;
}

.version-list-card {
  margin-bottom: 20px;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 30px 0;
}

.version-meta {
  color: #666;
  margin-bottom: 20px;
}

.version-content {
  border: 1px solid #eee;
  padding: 20px;
  border-radius: 4px;
  background-color: #fafafa;
  min-height: 200px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.markdown-content {
  font-family: "Courier New", Courier, monospace;
}

.version-diff {
  min-height: 400px;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.diff-version {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-label {
  font-weight: bold;
}

.version-number {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.diff-container {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 15px;
  overflow: auto;
  min-height: 300px;
  white-space: pre-wrap;
  font-family: "Courier New", Courier, monospace;
  line-height: 1.5;
}
</style>

# 文章版本历史功能实现计划

## 功能概述

文章版本历史功能允许用户查看文章的历史版本，比较不同版本之间的差异，并在需要时恢复到特定版本。这是CMS系统中的一个重要功能，可以帮助内容创建者跟踪文章的变更历史，防止内容丢失，并在需要时回滚不当的修改。

## 需求分析

### 功能需求

1. **版本列表查看**：
   - 显示文章的所有历史版本
   - 包含版本号、创建时间、创建者等信息
   - 支持分页和排序

2. **版本详情查看**：
   - 查看特定版本的完整内容
   - 显示该版本的元数据（如标题、摘要、状态等）

3. **版本比较**：
   - 选择两个版本进行差异比较
   - 以可视化方式显示内容差异
   - 支持行级差异显示

4. **版本恢复**：
   - 将文章恢复到特定历史版本
   - 恢复操作应创建一个新的版本，而不是覆盖当前版本

### 技术需求

1. **API集成**：
   - 使用现有的`getArticleVersions`和`getArticleVersionDetail` API
   - 需要实现版本比较和恢复的前端逻辑

2. **UI组件**：
   - 版本列表组件
   - 版本比较组件（支持差异高亮显示）
   - 版本详情查看组件

3. **状态管理**：
   - 在Pinia store中添加版本历史相关状态
   - 实现版本数据的加载和缓存逻辑

## 实现计划

### 1. 创建版本历史页面

在`src/views/cms/article/`目录下创建`version.vue`文件，实现版本历史页面：

```vue
<template>
  <div class="article-version-history">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('cms.article.versionHistory') }}</span>
          <el-button
            type="primary"
            size="small"
            @click="goBack"
          >
            {{ $t('common.back') }}
          </el-button>
        </div>
      </template>
      
      <!-- 版本列表 -->
      <div class="version-list">
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
          <el-table-column
            :label="$t('common.actions')"
            width="280"
          >
            <template #default="scope">
              <el-button
                size="small"
                @click="viewVersion(scope.row.version_number)"
              >
                {{ $t('common.view') }}
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="compareWithCurrent(scope.row.version_number)"
              >
                {{ $t('cms.article.compareVersions') }}
              </el-button>
              <el-button
                size="small"
                type="warning"
                @click="confirmRestore(scope.row.version_number)"
              >
                {{ $t('cms.article.restoreVersion') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 版本详情对话框 -->
      <el-dialog
        v-model="versionDetailVisible"
        :title="$t('cms.article.versionDetail')"
        width="80%"
      >
        <div v-loading="loading.versionDetail">
          <h2>{{ versionDetail?.title }}</h2>
          <div class="version-meta">
            <p>{{ $t('cms.article.versionNumber') }}: {{ selectedVersion }}</p>
            <p>{{ $t('cms.article.status') }}: {{ versionDetail?.status }}</p>
          </div>
          <div class="version-content" v-html="renderedContent"></div>
        </div>
      </el-dialog>
      
      <!-- 版本比较对话框 -->
      <el-dialog
        v-model="versionCompareVisible"
        :title="$t('cms.article.versionDiff')"
        width="90%"
      >
        <div v-loading="loading.versionCompare" class="version-diff">
          <!-- 差异比较组件将在这里实现 -->
          <div class="diff-container"></div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useCmsStore } from '@/store/modules/cms';
import { formatDateTime } from '@/utils/format';
import type { ArticleVersion } from '@/types/cms';

// 获取路由参数
const route = useRoute();
const router = useRouter();
const articleId = computed(() => Number(route.params.id));

// 状态管理
const cmsStore = useCmsStore();
const articleVersions = computed(() => cmsStore.articleVersions);
const loading = ref({
  articleVersions: false,
  versionDetail: false,
  versionCompare: false
});

// 版本详情相关
const versionDetailVisible = ref(false);
const versionDetail = ref(null);
const selectedVersion = ref(0);
const renderedContent = computed(() => {
  if (!versionDetail.value?.content) return '';
  // 根据content_type渲染内容
  return versionDetail.value.content;
});

// 版本比较相关
const versionCompareVisible = ref(false);
const diffResult = ref('');

// 初始化
onMounted(async () => {
  await fetchVersions();
});

// 获取版本历史
async function fetchVersions() {
  loading.value.articleVersions = true;
  try {
    await cmsStore.fetchArticleVersions(articleId.value);
  } catch (error) {
    ElMessage.error('Failed to load article versions');
    console.error(error);
  } finally {
    loading.value.articleVersions = false;
  }
}

// 查看特定版本
async function viewVersion(versionNumber: number) {
  selectedVersion.value = versionNumber;
  versionDetailVisible.value = true;
  loading.value.versionDetail = true;
  
  try {
    const response = await cmsStore.fetchArticleVersionDetail(articleId.value, versionNumber);
    versionDetail.value = response.data;
  } catch (error) {
    ElMessage.error('Failed to load version details');
    console.error(error);
  } finally {
    loading.value.versionDetail = false;
  }
}

// 与当前版本比较
async function compareWithCurrent(versionNumber: number) {
  versionCompareVisible.value = true;
  loading.value.versionCompare = true;
  
  try {
    // 获取历史版本
    const historicalVersion = await cmsStore.fetchArticleVersionDetail(articleId.value, versionNumber);
    
    // 获取当前版本
    const currentVersion = await cmsStore.fetchArticleDetail(articleId.value);
    
    // 实现差异比较逻辑
    // 这里需要引入差异比较库，如diff或jsdiff
    
    // 示例：
    // diffResult.value = createDiff(historicalVersion.data.content, currentVersion.data.content);
    
  } catch (error) {
    ElMessage.error('Failed to compare versions');
    console.error(error);
  } finally {
    loading.value.versionCompare = false;
  }
}

// 确认恢复版本
function confirmRestore(versionNumber: number) {
  ElMessageBox.confirm(
    `${versionNumber}`,
    { 
      title: $t('cms.article.confirmRestore'),
      type: 'warning'
    }
  ).then(() => {
    restoreVersion(versionNumber);
  }).catch(() => {
    // 用户取消操作
  });
}

// 恢复到特定版本
async function restoreVersion(versionNumber: number) {
  try {
    // 获取历史版本内容
    const response = await cmsStore.fetchArticleVersionDetail(articleId.value, versionNumber);
    const versionData = response.data;
    
    // 使用历史版本数据更新当前文章
    await cmsStore.updateArticle(articleId.value, {
      title: versionData.title,
      content: versionData.content,
      content_type: versionData.content_type,
      excerpt: versionData.excerpt,
      // 其他需要恢复的字段...
    });
    
    ElMessage.success($t('cms.article.restoreSuccess'));
    router.push(`/cms/article/detail/${articleId.value}`);
  } catch (error) {
    ElMessage.error($t('cms.article.restoreFailed'));
    console.error(error);
  }
}

// 返回文章详情页
function goBack() {
  router.push(`/cms/article/detail/${articleId.value}`);
}
</script>

<style scoped>
.article-version-history {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.version-diff {
  min-height: 400px;
}

.diff-container {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: auto;
}
</style>

## 实现总结

### 已完成的工作

1. **版本历史页面创建**
   - 创建了`src/views/cms/article/version.vue`文件，实现了版本历史页面
   - 实现了版本列表展示功能
   - 实现了版本详情查看功能
   - 实现了版本恢复功能

2. **路由配置**
   - 在`src/router/modules/cms.ts`中添加了版本历史页面的路由配置
   - 在文章详情页添加了查看版本历史的按钮

3. **状态管理**
   - 在`src/store/modules/cms.ts`中添加了版本历史相关的状态和方法
   - 实现了版本列表和版本详情的数据加载逻辑

4. **国际化支持**
   - 在`locales/zh-CN.yaml`和`locales/en.yaml`中添加了版本历史相关的翻译

### 未完成的工作

1. **版本比较功能**
   - 由于暂时不实现版本比较功能，未添加diff库
   - 版本比较对话框和相关逻辑已预留，但未实现具体功能

2. **优化和测试**
   - 需要进一步优化版本历史页面的UI和交互体验
   - 需要进行全面的功能测试，确保版本恢复功能正常工作

### 后续计划

1. 在适当的时候实现版本比较功能，可以考虑使用以下diff库：
   - `diff`：轻量级的文本差异比较库
   - `diff-match-patch`：Google的差异比较库，功能强大
   - `monaco-diff-editor`：基于Monaco编辑器的差异比较组件

2. 优化版本历史页面的UI和交互体验：
   - 添加更丰富的版本元数据展示
   - 改进版本详情查看体验
   - 添加版本筛选和搜索功能

3. 完善错误处理和边缘情况处理：
   - 处理版本加载失败的情况
   - 处理版本恢复失败的情况
   - 添加更友好的错误提示

文章版本历史功能的基本框架已经实现，可以满足用户查看和恢复历史版本的需求。后续将根据用户反馈和项目需求，进一步完善和优化这一功能。 
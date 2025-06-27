<template>
  <div class="comment-edit-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t("cms.comment.editComment") }}</span>
          <el-button @click="goBack" link>{{ $t("common.back") }}</el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-empty v-if="!comment" :description="$t('common.noData')" />

        <el-form
          v-else
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          label-position="right"
        >
          <el-form-item :label="$t('cms.comment.article')">
            <div class="readonly-field">
              {{ articleTitle }}
              <el-link
                v-if="comment.article"
                @click="viewArticle(comment.article)"
                type="primary"
                :underline="false"
                class="view-link"
              >
                {{ $t("common.view") }}
              </el-link>
            </div>
          </el-form-item>

          <el-form-item :label="$t('cms.comment.parent')" v-if="comment.parent">
            <div class="readonly-field">
              {{ parentCommentContent }}
              <el-link
                v-if="comment.parent"
                @click="viewComment(comment.parent)"
                type="primary"
                :underline="false"
                class="view-link"
              >
                {{ $t("common.view") }}
              </el-link>
            </div>
          </el-form-item>

          <el-form-item :label="$t('cms.comment.author')">
            <div class="readonly-field">
              <template v-if="comment.user_info">
                {{ comment.user_info.username }}
              </template>
              <template v-else>
                {{ comment.guest_name || $t("common.anonymous") }}
                <span v-if="comment.guest_email" class="text-muted">
                  ({{ comment.guest_email }})
                </span>
              </template>
            </div>
          </el-form-item>

          <el-form-item :label="$t('cms.comment.content')" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="5"
              :placeholder="$t('cms.comment.contentPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('cms.comment.status')" prop="status">
            <el-select v-model="form.status">
              <el-option
                v-for="status in commentStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('cms.comment.isPinned')" prop="is_pinned">
            <el-switch v-model="form.is_pinned" />
          </el-form-item>

          <div class="form-actions">
            <el-button @click="goBack">{{ $t("common.cancel") }}</el-button>
            <el-button type="primary" @click="submitForm">
              {{ $t("common.save") }}
            </el-button>
          </div>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import { useCmsStore } from "@/store/modules/cms";
import { useI18n } from "vue-i18n";
import type { Comment } from "@/types/cms";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const cmsStore = useCmsStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

// 获取评论ID
const commentId = computed(() => Number(route.params.id || route.query.id));

// 评论状态选项
const commentStatuses = [
  { label: t("cms.comment.statusPending"), value: "pending" },
  { label: t("cms.comment.statusApproved"), value: "approved" },
  { label: t("cms.comment.statusSpam"), value: "spam" },
  { label: t("cms.comment.statusTrash"), value: "trash" }
];

// 表单数据
const form = reactive({
  content: "",
  status: "pending",
  is_pinned: false
});

// 表单验证规则
const rules = reactive<FormRules>({
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
  ]
});

// 获取评论数据
const comment = computed<Comment | null>(() => cmsStore.currentComment);

// 获取文章标题
const articleTitle = computed(() => {
  if (!comment.value || !comment.value.article) return "";

  // 这里应该从store中获取文章标题，但为简化实现，我们假设有一个articleInfo字段
  // 实际项目中可能需要单独获取文章信息
  return `ID: ${comment.value.article}`;
});

// 获取父评论内容
const parentCommentContent = computed(() => {
  if (!comment.value || !comment.value.parent) return "";

  // 同样，这里应该从store中获取父评论内容，但为简化实现，我们只显示ID
  return `ID: ${comment.value.parent}`;
});

// 获取评论详情
const fetchCommentDetail = async () => {
  try {
    loading.value = true;
    await cmsStore.fetchCommentDetail(commentId.value);
    const commentData = cmsStore.currentComment;

    if (commentData) {
      form.content = commentData.content;
      form.status = commentData.status;
      form.is_pinned = commentData.is_pinned;
    }
  } catch (error) {
    console.error("Failed to fetch comment detail:", error);
    ElMessage.error(t("common.fetchFailed"));
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        loading.value = true;
        await cmsStore.updateComment(commentId.value, form);
        ElMessage.success(t("cms.comment.updateSuccess"));
        goBack();
      } catch (error) {
        console.error("Failed to update comment:", error);
        ElMessage.error(t("cms.comment.updateFailed"));
      } finally {
        loading.value = false;
      }
    }
  });
};

// 查看文章
const viewArticle = (id: number) => {
  router.push(`/cms/article/detail/${id}`);
};

// 查看评论
const viewComment = (id: number) => {
  router.push(`/cms/comment/detail/${id}`);
};

// 返回上一页
const goBack = () => {
  router.push("/cms/comment");
};

// 初始化
onMounted(() => {
  fetchCommentDetail();
});
</script>

<style scoped>
.comment-edit-container {
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

.readonly-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-link {
  margin-left: 10px;
}

.text-muted {
  color: #909399;
  font-size: 0.9em;
}
</style>

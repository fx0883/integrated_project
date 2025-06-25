<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type {
  Comment,
  CommentStatus,
  CommentCreateParams,
  CommentUpdateParams
} from "@/types/cms";
import logger from "@/utils/logger";

const { t } = useI18n();

// 定义组件属性
const props = defineProps({
  // 模式：create/edit/reply
  mode: {
    type: String,
    default: "create",
    validator: (value: string) => ["create", "edit", "reply"].includes(value)
  },
  // 评论对象（编辑模式下必须提供）
  comment: {
    type: Object as () => Comment,
    default: null
  },
  // 文章ID（创建和回复模式下必须提供）
  articleId: {
    type: Number,
    default: null
  },
  // 父评论ID（回复模式下必须提供）
  parentId: {
    type: Number,
    default: null
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(["submit", "cancel"]);

// 表单引用
const formRef = ref(null);

// 表单数据
const formData = reactive<CommentCreateParams | CommentUpdateParams>({
  article: props.articleId || 0,
  parent: props.parentId || undefined,
  content: "",
  guest_name: "",
  guest_email: "",
  guest_website: "",
  status: undefined,
  is_pinned: false
});

// 表单验证规则
const rules = {
  content: [
    {
      required: true,
      message: t("cms.comment.contentRequired"),
      trigger: "blur"
    },
    {
      min: 2,
      max: 1000,
      message: t("cms.comment.contentLength"),
      trigger: "blur"
    }
  ],
  guest_name: [
    {
      required: props.mode === "create" || props.mode === "reply",
      message: t("cms.comment.nameRequired"),
      trigger: "blur"
    }
  ],
  guest_email: [
    {
      required: props.mode === "create" || props.mode === "reply",
      message: t("cms.comment.emailRequired"),
      trigger: "blur"
    },
    { type: "email", message: t("cms.comment.emailInvalid"), trigger: "blur" }
  ]
};

// 状态选项
const statusOptions = [
  { value: "pending", label: t("cms.comment.statusPending") },
  { value: "approved", label: t("cms.comment.statusApproved") },
  { value: "spam", label: t("cms.comment.statusSpam") },
  { value: "trash", label: t("cms.comment.statusTrash") }
];

// 初始化表单数据
const initFormData = () => {
  if (props.mode === "edit" && props.comment) {
    const comment = props.comment;
    Object.keys(formData).forEach(key => {
      if (key in comment) {
        formData[key] = comment[key];
      }
    });
  } else if (props.mode === "reply") {
    formData.article = props.articleId;
    formData.parent = props.parentId;
  } else if (props.mode === "create") {
    formData.article = props.articleId;
  }
};

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (props.mode === "edit") {
      // 编辑模式下只提交更新相关字段
      const updateData: CommentUpdateParams = {
        content: formData.content,
        status: formData.status as CommentStatus,
        is_pinned: formData.is_pinned as boolean
      };
      emit("submit", updateData);
    } else {
      // 创建和回复模式下提交全部字段
      emit("submit", { ...formData });
    }
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
};

// 是否显示管理员操作
const showAdminControls = computed(() => props.mode === "edit");

// 初始化
onMounted(() => {
  initFormData();
});

// 监听评论变化，更新表单数据
watch(
  () => props.comment,
  newVal => {
    if (newVal) {
      initFormData();
    }
  }
);

// 监听模式变化，更新表单数据
watch(
  () => props.mode,
  () => {
    initFormData();
  }
);
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    class="comment-form"
    v-loading="loading"
  >
    <!-- 评论内容 -->
    <el-form-item :label="t('cms.comment.content')" prop="content">
      <el-input
        v-model="formData.content"
        type="textarea"
        :rows="4"
        :placeholder="t('cms.comment.contentPlaceholder')"
      />
    </el-form-item>

    <!-- 游客信息（创建和回复模式下显示） -->
    <template v-if="mode === 'create' || mode === 'reply'">
      <el-form-item :label="t('cms.comment.guestName')" prop="guest_name">
        <el-input
          v-model="formData.guest_name"
          :placeholder="t('cms.comment.guestNamePlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('cms.comment.guestEmail')" prop="guest_email">
        <el-input
          v-model="formData.guest_email"
          :placeholder="t('cms.comment.guestEmailPlaceholder')"
        />
      </el-form-item>

      <el-form-item :label="t('cms.comment.guestWebsite')" prop="guest_website">
        <el-input
          v-model="formData.guest_website"
          :placeholder="t('cms.comment.guestWebsitePlaceholder')"
        />
      </el-form-item>
    </template>

    <!-- 管理员选项（编辑模式下显示） -->
    <template v-if="showAdminControls">
      <el-divider>{{ t("cms.comment.adminOptions") }}</el-divider>

      <el-form-item :label="t('cms.comment.status')" prop="status">
        <el-select v-model="formData.status" class="w-full">
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('cms.comment.pinned')">
        <el-switch v-model="formData.is_pinned" />
      </el-form-item>
    </template>

    <!-- 表单按钮 -->
    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{
          mode === "create"
            ? t("common.create")
            : mode === "edit"
              ? t("common.save")
              : t("cms.comment.reply")
        }}
      </el-button>
      <el-button @click="handleCancel">{{ t("common.cancel") }}</el-button>
      <el-button v-if="mode !== 'edit'" @click="resetForm">{{
        t("common.reset")
      }}</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.comment-form {
  padding: 20px 0;
}

.w-full {
  width: 100%;
}
</style>

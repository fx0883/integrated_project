<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="loading"
  >
    <el-form-item :label="$t('cms.tag.name')" prop="name">
      <el-input v-model="form.name" :placeholder="$t('cms.tag.nameRequired')" />
    </el-form-item>

    <el-form-item :label="$t('cms.tag.slug')" prop="slug">
      <el-input v-model="form.slug" :placeholder="$t('cms.tag.slugTip')">
        <template #append>
          <el-button
            :icon="RefreshRight"
            @click="generateSlug"
            :title="$t('cms.tag.generateSlug')"
          />
        </template>
      </el-input>
      <div class="text-gray-400 text-xs mt-1">
        {{ $t("cms.tag.slugTip") }}
      </div>
    </el-form-item>

    <el-form-item :label="$t('cms.tag.description')" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="3"
        :placeholder="$t('cms.tag.description')"
      />
    </el-form-item>

    <el-form-item :label="$t('cms.tag.color')" prop="color">
      <el-color-picker v-model="form.color" show-alpha />
      <el-input v-model="form.color" placeholder="#RRGGBB" class="ml-2 w-40" />
      <div class="text-gray-400 text-xs mt-1">
        {{ $t("cms.tag.colorTip") }}
      </div>
    </el-form-item>

    <el-form-item :label="$t('cms.tag.isActive')" prop="is_active">
      <el-switch
        v-model="form.is_active"
        :active-value="true"
        :inactive-value="false"
        :active-text="$t('cms.tag.statusActive')"
        :inactive-text="$t('cms.tag.statusInactive')"
      />
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { ref, reactive, PropType, defineEmits, defineProps } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import { Tag, TagCreateParams, TagUpdateParams } from "@/types/cms";
import { useCmsStore } from "@/store/modules/cms";
import { useI18n } from "vue-i18n";
import { slugify } from "@/utils/string";

const props = defineProps({
  tag: {
    type: Object as PropType<Tag>,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["submit", "cancel"]);
const formRef = ref();
const cmsStore = useCmsStore();
const { t } = useI18n();

// 表单数据
const form = reactive<TagCreateParams>({
  name: "",
  slug: "",
  description: "",
  color: "#409EFF",
  is_active: true
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: t("cms.tag.nameRequired"), trigger: "blur" },
    {
      min: 1,
      max: 50,
      message:
        t("cms.tag.nameLength", { min: 1, max: 50 }) || "长度在1到50个字符之间",
      trigger: "blur"
    }
  ],
  slug: [
    {
      pattern: /^[a-z0-9-]+$/,
      message: t("cms.tag.slugInvalid"),
      trigger: "blur"
    }
  ]
};

// 初始化表单数据
const initForm = () => {
  if (props.tag) {
    form.name = props.tag.name;
    form.slug = props.tag.slug;
    form.description = props.tag.description || "";
    form.color = props.tag.color || "#409EFF";
    form.is_active = props.tag.is_active;
  } else {
    form.name = "";
    form.slug = "";
    form.description = "";
    form.color = "#409EFF";
    form.is_active = true;
  }
};

// 根据名称生成别名
const generateSlug = () => {
  if (!form.name) {
    ElMessage.warning(t("cms.tag.nameRequired"));
    return;
  }

  form.slug = slugify(form.name);
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      emit("submit", form);
    }
  });
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
    initForm();
  }
};

// 暴露方法给父组件
defineExpose({
  submitForm,
  resetForm,
  form
});

// 初始化
initForm();
</script>

<style scoped>
.el-form {
  max-width: 600px;
}
</style>

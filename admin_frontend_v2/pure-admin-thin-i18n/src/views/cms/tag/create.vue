<template>
  <div class="tag-create-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t("cms.tag.createTag") }}</span>
          <el-button @click="goBack" link>{{ $t("common.back") }}</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="right"
        v-loading="loading"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="$t('cms.tag.basicInfo')" name="basic">
            <el-form-item :label="$t('cms.tag.name')" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>

            <el-form-item :label="$t('cms.tag.slug')" prop="slug">
              <el-input v-model="form.slug">
                <template #append>
                  <el-button @click="generateSlug">
                    {{ $t("common.generate") }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item :label="$t('cms.tag.description')" prop="description">
              <el-input v-model="form.description" type="textarea" rows="3" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane :label="$t('cms.tag.advancedSettings')" name="advanced">
            <el-form-item :label="$t('cms.tag.color')" prop="color">
              <el-color-picker v-model="form.color" show-alpha />
              <span
                class="color-preview"
                :style="{ backgroundColor: form.color }"
              ></span>
            </el-form-item>

            <el-form-item :label="$t('cms.tag.isActive')" prop="is_active">
              <el-switch v-model="form.is_active" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>

        <div class="form-actions">
          <el-button @click="goBack">{{ $t("common.cancel") }}</el-button>
          <el-button type="primary" @click="submitForm">
            {{ $t("common.save") }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import { useCmsStore } from "@/store/modules/cms";
import { useI18n } from "vue-i18n";
import { slugify } from "@/utils/string";

const { t } = useI18n();
const router = useRouter();
const cmsStore = useCmsStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const activeTab = ref("basic");

// 表单数据
const form = reactive({
  name: "",
  slug: "",
  description: "",
  color: "#409EFF",
  is_active: true
});

// 表单验证规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: t("cms.tag.nameRequired"), trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: t("common.lengthLimit", { min: 2, max: 50 }),
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
});

// 生成别名
const generateSlug = () => {
  if (form.name) {
    form.slug = slugify(form.name);
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        loading.value = true;
        await cmsStore.createTag(form);
        ElMessage.success(t("cms.tag.createSuccess"));
        goBack();
      } catch (error) {
        console.error("Failed to create tag:", error);
        ElMessage.error(t("cms.tag.createFailed"));
      } finally {
        loading.value = false;
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  router.push("/cms/tag");
};
</script>

<style scoped>
.tag-create-container {
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

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-left: 10px;
  border: 1px solid #dcdfe6;
}
</style>

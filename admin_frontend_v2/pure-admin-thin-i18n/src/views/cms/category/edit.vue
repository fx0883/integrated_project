<template>
  <div class="category-edit-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t("cms.category.editCategory") }}</span>
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
          <el-tab-pane :label="$t('cms.category.basicInfo')" name="basic">
            <el-form-item :label="$t('cms.category.name')" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>

            <el-form-item :label="$t('cms.category.slug')" prop="slug">
              <el-input v-model="form.slug">
                <template #append>
                  <el-button @click="generateSlug">
                    {{ $t("common.generate") }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item :label="$t('cms.category.parent')" prop="parent_id">
              <el-cascader
                v-model="form.parent_id"
                :options="categoryTree"
                :props="{
                  checkStrictly: true,
                  label: 'name',
                  value: 'id',
                  emitPath: false
                }"
                clearable
                :placeholder="$t('cms.category.noParent')"
              />
            </el-form-item>

            <el-form-item
              :label="$t('cms.category.description')"
              prop="description"
            >
              <el-input v-model="form.description" type="textarea" rows="3" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane
            :label="$t('cms.category.advancedSettings')"
            name="advanced"
          >
            <el-form-item :label="$t('cms.category.icon')" prop="icon">
              <el-input v-model="form.icon" />
            </el-form-item>

            <el-form-item
              :label="$t('cms.category.sortOrder')"
              prop="sort_order"
            >
              <el-input-number v-model="form.sort_order" :min="0" :step="1" />
            </el-form-item>

            <el-form-item :label="$t('cms.category.isActive')" prop="is_active">
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
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import { useCmsStore } from "@/store/modules/cms";
import { useI18n } from "vue-i18n";
import { slugify } from "@/utils/string";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const cmsStore = useCmsStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const activeTab = ref("basic");

// 获取分类ID
const categoryId = computed(() => Number(route.params.id));

// 表单数据
const form = reactive({
  name: "",
  slug: "",
  description: "",
  parent_id: null as number | null,
  icon: "",
  sort_order: 0,
  is_active: true
});

// 表单验证规则
const rules = reactive<FormRules>({
  name: [
    {
      required: true,
      message: t("cms.category.nameRequired"),
      trigger: "blur"
    },
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
      message: t("cms.category.slugInvalid"),
      trigger: "blur"
    }
  ]
});

// 获取分类树
const categoryTree = computed(() => {
  return cmsStore.categoryTree.filter(item => item.id !== categoryId.value);
});

// 生成别名
const generateSlug = () => {
  if (form.name) {
    form.slug = slugify(form.name);
  }
};

// 获取分类详情
const fetchCategoryDetail = async () => {
  try {
    loading.value = true;
    await cmsStore.fetchCategoryDetail(categoryId.value);
    const category = cmsStore.currentCategory;

    if (category) {
      form.name = category.name;
      form.slug = category.slug;
      form.description = category.description || "";
      form.parent_id = category.parent_id;
      form.icon = category.icon || "";
      form.sort_order = category.sort_order;
      form.is_active = category.is_active;
    }
  } catch (error) {
    console.error("Failed to fetch category detail:", error);
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
        await cmsStore.updateCategory(categoryId.value, form);
        ElMessage.success(t("cms.category.updateSuccess"));
        goBack();
      } catch (error) {
        console.error("Failed to update category:", error);
        ElMessage.error(t("cms.category.updateFailed"));
      } finally {
        loading.value = false;
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  router.push("/cms/category");
};

// 初始化
onMounted(async () => {
  await Promise.all([cmsStore.fetchCategoryTree(), fetchCategoryDetail()]);
});
</script>

<style scoped>
.category-edit-container {
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
</style>

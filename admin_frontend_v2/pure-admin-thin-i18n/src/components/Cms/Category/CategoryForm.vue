<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    :disabled="loading"
  >
    <el-form-item label="名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入分类名称" />
    </el-form-item>

    <el-form-item label="别名" prop="slug">
      <el-input v-model="form.slug" placeholder="请输入分类别名">
        <template #append>
          <el-button
            :icon="RefreshRight"
            @click="generateSlug"
            title="根据名称自动生成别名"
          />
        </template>
      </el-input>
      <div class="text-gray-400 text-xs mt-1">
        用于URL的标识，建议使用英文字母、数字和连字符
      </div>
    </el-form-item>

    <el-form-item label="父级分类" prop="parent_id">
      <el-tree-select
        v-model="form.parent_id"
        placeholder="请选择父级分类（可选）"
        :data="categoryTree"
        :props="{
          label: 'name',
          value: 'id',
          children: 'children',
          disabled: formMode === 'edit' ? data => data.id === editId : false
        }"
        clearable
        node-key="id"
        check-strictly
        default-expand-all
      />
      <div class="text-gray-400 text-xs mt-1">不选择则为顶级分类</div>
    </el-form-item>

    <el-form-item label="图标" prop="icon">
      <el-input v-model="form.icon" placeholder="请输入图标类名">
        <template #prepend>
          <i :class="form.icon || 'el-icon-folder'" />
        </template>
      </el-input>
    </el-form-item>

    <el-form-item label="排序" prop="sort_order">
      <el-input-number
        v-model="form.sort_order"
        :min="0"
        :max="999"
        placeholder="排序值"
      />
      <div class="text-gray-400 text-xs mt-1">
        数字越小越靠前，默认按创建时间排序
      </div>
    </el-form-item>

    <el-form-item label="状态" prop="is_active">
      <el-switch
        v-model="form.is_active"
        :active-value="true"
        :inactive-value="false"
        active-text="启用"
        inactive-text="禁用"
      />
    </el-form-item>

    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        rows="3"
        placeholder="请输入分类描述"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ submitButtonText }}
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight } from "@element-plus/icons-vue";
import { useCmsStore } from "@/store/modules/cms";
import type {
  Category,
  CategoryCreateParams,
  CategoryUpdateParams
} from "@/types/cms";

interface Props {
  formMode: "create" | "edit";
  editId?: number;
  categoryData?: Category | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  formMode: "create",
  editId: undefined,
  categoryData: null,
  loading: false
});

const emit = defineEmits(["submit", "cancel"]);

const cmsStore = useCmsStore();
const formRef = ref();
const loading = ref(props.loading);

const submitButtonText = computed(() => {
  return props.formMode === "create" ? "创建" : "更新";
});

// 分类树数据
const categoryTree = ref<Category[]>([]);

// 表单数据
const form = reactive<CategoryCreateParams>({
  name: "",
  slug: "",
  description: "",
  parent_id: null,
  icon: "",
  is_active: true,
  sort_order: 0
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ],
  slug: [
    { required: false, message: "请输入分类别名", trigger: "blur" },
    {
      pattern: /^[a-z0-9-]+$/,
      message: "只能包含小写字母、数字和连字符",
      trigger: "blur"
    }
  ]
};

// 初始化数据
const initFormData = () => {
  if (props.formMode === "edit" && props.categoryData) {
    Object.assign(form, {
      name: props.categoryData.name,
      slug: props.categoryData.slug,
      description: props.categoryData.description || "",
      parent_id: props.categoryData.parent_id,
      icon: props.categoryData.icon || "",
      is_active: props.categoryData.is_active,
      sort_order: props.categoryData.sort_order
    });
  }
};

// 监听分类数据变化
watch(
  () => props.categoryData,
  newVal => {
    if (newVal) {
      initFormData();
    }
  },
  { immediate: true }
);

// 获取分类树
const fetchCategoryTree = async () => {
  try {
    const result = await cmsStore.fetchCategoryTree();
    categoryTree.value = result;
  } catch (error) {
    // 已在store中处理错误
  }
};

// 生成别名
const generateSlug = () => {
  if (!form.name) {
    ElMessage.warning("请先输入分类名称");
    return;
  }

  // 将中文转为拼音，简单处理
  const slug = form.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  form.slug = slug || form.name.toLowerCase().replace(/\s+/g, "-");
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    loading.value = true;
    const formData = { ...form };

    if (props.formMode === "create") {
      await cmsStore.createCategory(formData);
    } else if (props.formMode === "edit" && props.editId) {
      await cmsStore.updateCategory(
        props.editId,
        formData as CategoryUpdateParams
      );
    }

    emit("submit");
  } catch (error) {
    console.error("表单验证失败", error);
  } finally {
    loading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  emit("cancel");
};

// 组件挂载后获取分类树
onMounted(() => {
  fetchCategoryTree();
});
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>

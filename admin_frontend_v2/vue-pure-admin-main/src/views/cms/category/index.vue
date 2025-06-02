<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">分类管理</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleAddCategory"
            >
              新增分类
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="categoryList"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="slug" label="分类别名" width="180" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="article_count" label="文章数量" width="100" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleEditCategory(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="!row.parent_id"
              link
              type="primary"
              :icon="Plus"
              @click="handleAddSubCategory(row)"
            >
              添加子分类
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDeleteCategory(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑分类' : isSubMode ? '添加子分类' : '新增分类'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="分类别名" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入分类别名，用于URL" />
          <div class="form-tip">别名用于URL中，只能包含字母、数字、短横线</div>
        </el-form-item>
        
        <el-form-item v-if="!isSubMode" label="父级分类" prop="parent_id">
          <el-select v-model="form.parent_id" placeholder="请选择父级分类" clearable>
            <el-option
              v-for="item in rootCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="0" />
          <div class="form-tip">数值越小排序越靠前</div>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { useCategoryStoreHook } from "@/store/modules/cms/category";
import type { CategoryListItem } from "../../../../types/cms/category";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";

// store实例
const categoryStore = useCategoryStoreHook();

// 分类列表数据
const categoryList = ref<CategoryListItem[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitLoading = ref(false);

// 表单ref
const formRef = ref<FormInstance>();

// 表单数据
const form = reactive({
  id: 0,
  name: "",
  slug: "",
  parent_id: undefined as number | undefined,
  order: 0,
  description: ""
});

// 编辑模式
const isEditMode = ref(false);
// 子分类模式
const isSubMode = ref(false);

// 表单校验规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ],
  slug: [
    { required: true, message: "请输入分类别名", trigger: "blur" },
    { pattern: /^[a-z0-9\-]+$/, message: "别名只能包含小写字母、数字、短横线", trigger: "blur" }
  ],
  order: [
    { required: true, message: "请输入排序值", trigger: "blur" }
  ]
});

// 获取根分类列表
const rootCategories = computed(() => {
  return categoryList.value.filter(item => !item.parent_id);
});

// 初始化
onMounted(() => {
  fetchCategories();
});

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true;
  try {
    const result = await categoryStore.fetchCategories();
    if (result) {
      // 处理树形结构
      const list = result.list;
      const rootList: CategoryListItem[] = [];
      const map = new Map<number, CategoryListItem>();
      
      // 先把所有节点存入map
      list.forEach(item => {
        // 确保children属性存在
        const category = { ...item, children: [] };
        map.set(item.id, category);
      });
      
      // 处理层级关系
      list.forEach(item => {
        const category = map.get(item.id);
        if (category) {
          if (item.parent_id && map.has(item.parent_id)) {
            // 如果有父节点，添加到父节点的children
            const parent = map.get(item.parent_id);
            if (parent && parent.children) {
              parent.children.push(category);
            }
          } else {
            // 没有父节点或父节点不存在，作为根节点
            rootList.push(category);
          }
        }
      });
      
      categoryList.value = rootList;
    }
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.id = 0;
  form.name = "";
  form.slug = "";
  form.parent_id = undefined;
  form.order = 0;
  form.description = "";
  isEditMode.value = false;
  isSubMode.value = false;
};

// 新增分类
const handleAddCategory = () => {
  resetForm();
  dialogVisible.value = true;
};

// 新增子分类
const handleAddSubCategory = (row: CategoryListItem) => {
  resetForm();
  form.parent_id = row.id;
  isSubMode.value = true;
  dialogVisible.value = true;
};

// 编辑分类
const handleEditCategory = (row: CategoryListItem) => {
  resetForm();
  form.id = row.id;
  form.name = row.name;
  form.slug = row.slug;
  form.parent_id = row.parent_id;
  form.order = row.order || 0;
  form.description = row.description || "";
  isEditMode.value = true;
  dialogVisible.value = true;
};

// 删除分类
const handleDeleteCategory = (row: CategoryListItem) => {
  // 检查是否有子分类
  if (row.children && row.children.length > 0) {
    ElMessage.warning("该分类下有子分类，不能删除");
    return;
  }
  
  ElMessageBox.confirm(`确认要删除分类 ${row.name} 吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await categoryStore.deleteCategory(row.id);
      if (result && result.success) {
        ElMessage.success("删除成功");
        fetchCategories();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        let result;
        
        if (isEditMode.value) {
          // 编辑模式
          result = await categoryStore.updateCategory(form.id, {
            name: form.name,
            slug: form.slug,
            parent_id: form.parent_id,
            order: form.order,
            description: form.description
          });
        } else {
          // 新增模式
          result = await categoryStore.createCategory({
            name: form.name,
            slug: form.slug,
            parent_id: form.parent_id,
            order: form.order,
            description: form.description
          });
        }
        
        if (result && result.success) {
          ElMessage.success(isEditMode.value ? "更新成功" : "创建成功");
          dialogVisible.value = false;
          fetchCategories();
        } else {
          ElMessage.error(result?.message || (isEditMode.value ? "更新失败" : "创建失败"));
        }
      } finally {
        submitLoading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.main {
  margin: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style> 
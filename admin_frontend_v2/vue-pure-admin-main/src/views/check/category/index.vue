<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">打卡类型管理</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleAddCategory"
            >
              新增类型
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item>
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索类型名称..."
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="categoryList"
        border
        row-key="id"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="类型名称" min-width="120" />
        <el-table-column prop="description" label="类型描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.icon">
              <component :is="row.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="task_count" label="任务数量" width="100" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="View"
              @click="handleViewCategory(row)"
            >
              查看
            </el-button>
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleEditCategory(row)"
            >
              编辑
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
      
      <!-- 分页区域 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.limit"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        :disabled="viewMode"
      >
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入类型名称" />
        </el-form-item>
        
        <el-form-item label="类型描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入类型描述"
          />
        </el-form-item>
        
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标名称" />
          <div class="form-tip">输入Element Plus图标名称，例如：Calendar</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ viewMode ? '关闭' : '取消' }}</el-button>
          <el-button type="primary" @click="submitForm" v-if="!viewMode" :loading="submitLoading">
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
import { useCheckCategoryStoreHook } from "@/store/modules/check/category";
import type { CheckCategory } from "../../../../types/check";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Edit, Delete, View, Search } from "@element-plus/icons-vue";

// store实例
const categoryStore = useCheckCategoryStoreHook();

// 列表数据
const categoryList = ref<CheckCategory[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const submitLoading = ref(false);
const viewMode = ref(false);

// 表单ref
const formRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  keyword: ""
});

// 表单数据
const form = reactive({
  id: 0,
  name: "",
  description: "",
  icon: ""
});

// 对话框标题
const dialogTitle = computed(() => {
  if (viewMode.value) {
    return "查看打卡类型";
  }
  return form.id ? "编辑打卡类型" : "新增打卡类型";
});

// 表单校验规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入类型名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ],
  description: [
    { max: 200, message: "描述最多 200 个字符", trigger: "blur" }
  ]
});

// 初始化
onMounted(() => {
  fetchCategories();
});

// 获取打卡类型列表
const fetchCategories = async () => {
  loading.value = true;
  try {
    const result = await categoryStore.fetchCategories(queryParams);
    if (result) {
      categoryList.value = result.list;
      total.value = result.total;
    }
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  queryParams.page = 1;
  fetchCategories();
};

// 重置查询
const resetQuery = () => {
  queryParams.keyword = "";
  queryParams.page = 1;
  fetchCategories();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.limit = val;
  fetchCategories();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  fetchCategories();
};

// 重置表单
const resetForm = () => {
  form.id = 0;
  form.name = "";
  form.description = "";
  form.icon = "";
  viewMode.value = false;
};

// 新增打卡类型
const handleAddCategory = () => {
  resetForm();
  dialogVisible.value = true;
};

// 查看打卡类型
const handleViewCategory = (row: CheckCategory) => {
  resetForm();
  form.id = row.id;
  form.name = row.name;
  form.description = row.description || "";
  form.icon = row.icon || "";
  viewMode.value = true;
  dialogVisible.value = true;
};

// 编辑打卡类型
const handleEditCategory = (row: CheckCategory) => {
  resetForm();
  form.id = row.id;
  form.name = row.name;
  form.description = row.description || "";
  form.icon = row.icon || "";
  dialogVisible.value = true;
};

// 删除打卡类型
const handleDeleteCategory = (row: CheckCategory) => {
  ElMessageBox.confirm(`确认要删除打卡类型 ${row.name} 吗？`, "警告", {
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
        
        const submitData = {
          name: form.name,
          description: form.description,
          icon: form.icon
        };
        
        if (form.id) {
          // 编辑模式
          result = await categoryStore.updateCategory(form.id, submitData);
        } else {
          // 新增模式
          result = await categoryStore.createCategory(submitData);
        }
        
        if (result && result.success) {
          ElMessage.success(form.id ? "更新成功" : "创建成功");
          dialogVisible.value = false;
          fetchCategories();
        } else {
          ElMessage.error(result?.message || (form.id ? "更新失败" : "创建失败"));
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

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style> 
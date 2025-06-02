<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">标签管理</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleAddTag"
            >
              新增标签
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="tagList"
        border
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="标签名称" min-width="120" />
        <el-table-column label="标签展示" width="150">
          <template #default="{ row }">
            <el-tag>{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="article_count" label="文章数量" width="100" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              @click="handleEditTag(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              :icon="Delete"
              @click="handleDeleteTag(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
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
    
    <!-- 标签表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑标签' : '新增标签'"
      width="400px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" />
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
import { ref, reactive, onMounted } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { useTagStoreHook } from "@/store/modules/cms/tag";
import type { TagListItem } from "../../../../types/cms/tag";
import type { FormInstance, FormRules } from "element-plus";
import { Plus, Edit, Delete } from "@element-plus/icons-vue";

// store实例
const tagStore = useTagStoreHook();

// 标签列表数据
const tagList = ref<TagListItem[]>([]);
const total = ref(0);
const loading = ref(false);
const dialogVisible = ref(false);
const submitLoading = ref(false);

// 表单ref
const formRef = ref<FormInstance>();

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10
});

// 表单数据
const form = reactive({
  id: 0,
  name: ""
});

// 编辑模式
const isEditMode = ref(false);

// 表单校验规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入标签名称", trigger: "blur" },
    { min: 1, max: 30, message: "长度在 1 到 30 个字符", trigger: "blur" }
  ]
});

// 初始化
onMounted(() => {
  fetchTags();
});

// 获取标签列表
const fetchTags = async () => {
  loading.value = true;
  try {
    const result = await tagStore.fetchTags(queryParams);
    if (result) {
      tagList.value = result.list;
      total.value = result.total;
    }
  } finally {
    loading.value = false;
  }
};

// 分页大小变化
const handleSizeChange = (val: number) => {
  queryParams.limit = val;
  fetchTags();
};

// 页码变化
const handleCurrentChange = (val: number) => {
  queryParams.page = val;
  fetchTags();
};

// 重置表单
const resetForm = () => {
  form.id = 0;
  form.name = "";
  isEditMode.value = false;
};

// 新增标签
const handleAddTag = () => {
  resetForm();
  dialogVisible.value = true;
};

// 编辑标签
const handleEditTag = (row: TagListItem) => {
  resetForm();
  form.id = row.id;
  form.name = row.name;
  isEditMode.value = true;
  dialogVisible.value = true;
};

// 删除标签
const handleDeleteTag = (row: TagListItem) => {
  ElMessageBox.confirm(`确认要删除标签 ${row.name} 吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await tagStore.deleteTag(row.id);
      if (result && result.success) {
        ElMessage.success("删除成功");
        fetchTags();
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
          result = await tagStore.updateTag(form.id, {
            name: form.name
          });
        } else {
          // 新增模式
          result = await tagStore.createTag({
            name: form.name
          });
        }
        
        if (result && result.success) {
          ElMessage.success(isEditMode.value ? "更新成功" : "创建成功");
          dialogVisible.value = false;
          fetchTags();
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

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style> 
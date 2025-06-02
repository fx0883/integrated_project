<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">{{ isEdit ? "编辑打卡任务" : "创建打卡任务" }}</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Back"
              @click="goBack"
            >
              返回列表
            </el-button>
          </div>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="mt-4"
        v-loading="loading"
      >
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入任务标题" />
        </el-form-item>
        
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        
        <el-form-item label="所属类型" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择所属类型">
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="打卡频率" prop="frequency">
          <el-radio-group v-model="form.frequency">
            <el-radio label="daily">每日</el-radio>
            <el-radio label="weekly">每周</el-radio>
            <el-radio label="monthly">每月</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="时间范围" prop="date_range" required>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useCheckTaskStoreHook } from "@/store/modules/check/task";
import { useCheckCategoryStoreHook } from "@/store/modules/check/category";
import type { CheckCategory } from "../../../../types/check";
import type { FormInstance, FormRules } from "element-plus";
import { Back } from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// store实例
const taskStore = useCheckTaskStoreHook();
const categoryStore = useCheckCategoryStoreHook();

// 表单ref
const formRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 类型选项
const categoryOptions = ref<CheckCategory[]>([]);

// 是否为编辑模式
const isEdit = computed(() => {
  return route.name === "CheckTaskEdit";
});

// 获取任务ID（编辑模式）
const taskId = computed(() => {
  return isEdit.value ? parseInt(route.params.id as string) : 0;
});

// 日期范围
const dateRange = ref<string[]>([]);

// 表单数据
const form = reactive({
  title: "",
  description: "",
  category_id: undefined as number | undefined,
  frequency: "daily" as "daily" | "weekly" | "monthly",
  start_date: "",
  end_date: ""
});

// 表单校验规则
const rules = reactive<FormRules>({
  title: [
    { required: true, message: "请输入任务标题", trigger: "blur" },
    { min: 2, max: 100, message: "长度在 2 到 100 个字符", trigger: "blur" }
  ],
  category_id: [
    { required: true, message: "请选择所属类型", trigger: "change" }
  ],
  frequency: [
    { required: true, message: "请选择打卡频率", trigger: "change" }
  ]
});

// 初始化
onMounted(async () => {
  await fetchCategories();
  
  if (isEdit.value) {
    await fetchTaskDetail();
  }
});

// 获取类型列表
const fetchCategories = async () => {
  loading.value = true;
  try {
    const result = await categoryStore.fetchCategories();
    if (result) {
      categoryOptions.value = result.list;
    }
  } finally {
    loading.value = false;
  }
};

// 获取任务详情（编辑模式）
const fetchTaskDetail = async () => {
  loading.value = true;
  try {
    const data = await taskStore.fetchTaskDetail(taskId.value);
    if (data) {
      // 填充表单数据
      form.title = data.title;
      form.description = data.description || "";
      form.category_id = data.category_id;
      form.frequency = data.frequency;
      form.start_date = data.start_date;
      form.end_date = data.end_date;
      
      // 设置日期范围
      dateRange.value = [data.start_date, data.end_date];
    } else {
      ElMessage.error("获取任务信息失败");
      goBack();
    }
  } finally {
    loading.value = false;
  }
};

// 日期范围变化
const handleDateRangeChange = (val: string[]) => {
  if (val && val.length === 2) {
    form.start_date = val[0];
    form.end_date = val[1];
  } else {
    form.start_date = "";
    form.end_date = "";
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!form.start_date || !form.end_date) {
        ElMessage.warning("请选择时间范围");
        return;
      }
      
      loading.value = true;
      try {
        let result;
        
        // 准备提交的数据
        const submitData = {
          title: form.title,
          description: form.description,
          category_id: form.category_id,
          frequency: form.frequency,
          start_date: form.start_date,
          end_date: form.end_date
        };
        
        if (isEdit.value) {
          // 编辑模式
          result = await taskStore.updateTask(taskId.value, submitData);
        } else {
          // 创建模式
          result = await taskStore.createTask(submitData);
        }
        
        if (result && result.success) {
          ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
          goBack();
        } else {
          ElMessage.error(result?.message || (isEdit.value ? "更新失败" : "创建失败"));
        }
      } finally {
        loading.value = false;
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  dateRange.value = [];
  
  // 如果是编辑模式，重新获取任务信息
  if (isEdit.value) {
    fetchTaskDetail();
  } else {
    form.start_date = "";
    form.end_date = "";
  }
};

// 返回列表页
const goBack = () => {
  router.push("/check/task/list");
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
</style> 
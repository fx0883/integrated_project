<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">{{ isEdit ? "编辑租户" : "创建租户" }}</span>
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
        <el-form-item label="租户名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入租户名称" />
        </el-form-item>
        <el-form-item label="租户域名" prop="domain">
          <el-input v-model="form.domain" placeholder="请输入租户域名" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_name">
          <el-input v-model="form.contact_name" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="contact_email">
          <el-input v-model="form.contact_email" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="租户描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入租户描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="suspended">暂停</el-radio>
          </el-radio-group>
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
import { useTenantStoreHook } from "@/store/modules/tenant";
import type { FormInstance, FormRules } from "element-plus";
import { Back } from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// 租户store
const tenantStore = useTenantStoreHook();

// 表单ref
const formRef = ref<FormInstance>();

// 加载状态
const loading = ref(false);

// 是否为编辑模式
const isEdit = computed(() => {
  return route.name === "TenantEdit";
});

// 获取租户ID（编辑模式）
const tenantId = computed(() => {
  return isEdit.value ? parseInt(route.params.id as string) : 0;
});

// 表单数据
const form = reactive({
  name: "",
  domain: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  description: "",
  status: "active"
});

// 表单校验规则
const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入租户名称", trigger: "blur" }],
  domain: [{ required: true, message: "请输入租户域名", trigger: "blur" }],
  contact_name: [{ required: true, message: "请输入联系人姓名", trigger: "blur" }],
  contact_phone: [
    { required: true, message: "请输入联系电话", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号码",
      trigger: "blur"
    }
  ],
  contact_email: [
    { required: true, message: "请输入联系邮箱", trigger: "blur" },
    {
      type: "email",
      message: "请输入正确的邮箱地址",
      trigger: "blur"
    }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
});

// 初始化
onMounted(async () => {
  if (isEdit.value) {
    await fetchTenantDetail();
  }
});

// 获取租户详情
const fetchTenantDetail = async () => {
  loading.value = true;
  try {
    const data = await tenantStore.fetchTenantDetail(tenantId.value);
    if (data) {
      // 填充表单数据
      Object.assign(form, data);
    } else {
      ElMessage.error("获取租户信息失败");
      goBack();
    }
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        let result;
        
        if (isEdit.value) {
          // 编辑模式
          result = await tenantStore.updateTenant(tenantId.value, form);
        } else {
          // 创建模式
          result = await tenantStore.createTenant(form);
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
  
  // 如果是编辑模式，重新获取租户信息
  if (isEdit.value) {
    fetchTenantDetail();
  }
};

// 返回列表页
const goBack = () => {
  router.push("/tenant/list");
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
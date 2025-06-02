<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">租户配额管理</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Back"
              @click="goBack"
            >
              返回详情
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-loading="loading">
        <el-empty v-if="!tenant" description="未找到租户信息"></el-empty>
        
        <template v-else>
          <el-descriptions :column="1" border title="租户基本信息" class="mb-4">
            <el-descriptions-item label="租户ID">{{ tenant.id }}</el-descriptions-item>
            <el-descriptions-item label="租户名称">{{ tenant.name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="tenant.status === 'active' ? 'success' : 'danger'">
                {{ tenant.status === 'active' ? '正常' : '暂停' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <!-- 配额信息 -->
          <el-form
            ref="formRef"
            :model="quotaForm"
            :rules="rules"
            label-width="150px"
            class="quota-form"
          >
            <el-divider content-position="left">配额设置</el-divider>
            
            <el-form-item label="最大用户数" prop="max_users">
              <el-input-number 
                v-model="quotaForm.max_users" 
                :min="1" 
                :precision="0"
                controls-position="right" 
              />
            </el-form-item>
            
            <el-form-item label="最大存储空间(MB)" prop="max_storage">
              <el-input-number 
                v-model="quotaForm.max_storage" 
                :min="10" 
                :precision="0"
                controls-position="right" 
              />
            </el-form-item>
            
            <el-form-item label="最大文章数" prop="max_articles">
              <el-input-number 
                v-model="quotaForm.max_articles" 
                :min="1" 
                :precision="0"
                controls-position="right" 
              />
            </el-form-item>
            
            <el-form-item label="最大打卡任务数" prop="max_checks">
              <el-input-number 
                v-model="quotaForm.max_checks" 
                :min="1" 
                :precision="0"
                controls-position="right" 
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="submitForm">保存配额</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
          
          <!-- 使用情况 -->
          <template v-if="quotaUsage">
            <el-divider content-position="left">使用情况</el-divider>
            
            <el-row :gutter="20">
              <el-col :span="6">
                <el-card class="usage-card">
                  <div class="usage-title">用户数</div>
                  <el-progress 
                    type="dashboard" 
                    :percentage="calculatePercentage(quotaUsage.user_count, quotaForm.max_users)"
                    :color="getProgressColor"
                  />
                  <div class="usage-info">
                    {{ quotaUsage.user_count }} / {{ quotaForm.max_users }}
                  </div>
                </el-card>
              </el-col>
              
              <el-col :span="6">
                <el-card class="usage-card">
                  <div class="usage-title">存储空间</div>
                  <el-progress 
                    type="dashboard" 
                    :percentage="calculatePercentage(quotaUsage.storage_used, quotaForm.max_storage)"
                    :color="getProgressColor"
                  />
                  <div class="usage-info">
                    {{ quotaUsage.storage_used }}MB / {{ quotaForm.max_storage }}MB
                  </div>
                </el-card>
              </el-col>
              
              <el-col :span="6">
                <el-card class="usage-card">
                  <div class="usage-title">文章数</div>
                  <el-progress 
                    type="dashboard" 
                    :percentage="calculatePercentage(quotaUsage.article_count, quotaForm.max_articles)"
                    :color="getProgressColor"
                  />
                  <div class="usage-info">
                    {{ quotaUsage.article_count }} / {{ quotaForm.max_articles }}
                  </div>
                </el-card>
              </el-col>
              
              <el-col :span="6">
                <el-card class="usage-card">
                  <div class="usage-title">打卡任务数</div>
                  <el-progress 
                    type="dashboard" 
                    :percentage="calculatePercentage(quotaUsage.check_count, quotaForm.max_checks)"
                    :color="getProgressColor"
                  />
                  <div class="usage-info">
                    {{ quotaUsage.check_count }} / {{ quotaForm.max_checks }}
                  </div>
                </el-card>
              </el-col>
            </el-row>
            
            <div class="updated-time">
              更新时间: {{ quotaUsage.updated_at }}
            </div>
          </template>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import type { TenantDetail, TenantQuota, TenantQuotaUsage } from "../../../types/tenant";
import type { FormInstance, FormRules } from "element-plus";
import { Back } from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// 租户store
const tenantStore = useTenantStoreHook();

// 租户详情数据
const tenant = ref<TenantDetail | null>(null);
const quotaUsage = ref<TenantQuotaUsage | null>(null);
const loading = ref(false);

// 表单ref
const formRef = ref<FormInstance>();

// 获取租户ID
const tenantId = parseInt(route.params.id as string);

// 配额表单
const quotaForm = reactive({
  max_users: 10,
  max_storage: 100,
  max_articles: 50,
  max_checks: 20
});

// 表单校验规则
const rules = reactive<FormRules>({
  max_users: [
    { required: true, message: "请输入最大用户数", trigger: "blur" },
    { type: "number", min: 1, message: "最小为1", trigger: "blur" }
  ],
  max_storage: [
    { required: true, message: "请输入最大存储空间", trigger: "blur" },
    { type: "number", min: 10, message: "最小为10MB", trigger: "blur" }
  ],
  max_articles: [
    { required: true, message: "请输入最大文章数", trigger: "blur" },
    { type: "number", min: 1, message: "最小为1", trigger: "blur" }
  ],
  max_checks: [
    { required: true, message: "请输入最大打卡任务数", trigger: "blur" },
    { type: "number", min: 1, message: "最小为1", trigger: "blur" }
  ]
});

// 初始化
onMounted(async () => {
  if (tenantId) {
    await Promise.all([
      fetchTenantDetail(),
      fetchTenantQuota(),
      fetchTenantQuotaUsage()
    ]);
  }
});

// 获取租户详情
const fetchTenantDetail = async () => {
  loading.value = true;
  try {
    const data = await tenantStore.fetchTenantDetail(tenantId);
    tenant.value = data;
    
    if (!data) {
      ElMessage.error("获取租户信息失败");
      goBack();
    }
  } finally {
    loading.value = false;
  }
};

// 获取租户配额
const fetchTenantQuota = async () => {
  loading.value = true;
  try {
    const result = await tenantStore.fetchTenantQuota(tenantId);
    if (result && result.success && result.data) {
      const quota = result.data;
      // 更新表单数据
      Object.assign(quotaForm, {
        max_users: quota.max_users,
        max_storage: quota.max_storage,
        max_articles: quota.max_articles,
        max_checks: quota.max_checks
      });
    }
  } finally {
    loading.value = false;
  }
};

// 获取租户配额使用情况
const fetchTenantQuotaUsage = async () => {
  loading.value = true;
  try {
    const result = await tenantStore.fetchTenantQuotaUsage(tenantId);
    if (result && result.success && result.data) {
      quotaUsage.value = result.data;
    }
  } finally {
    loading.value = false;
  }
};

// 计算百分比
const calculatePercentage = (used: number, total: number): number => {
  if (total === 0) return 0;
  const percentage = Math.round((used / total) * 100);
  return Math.min(percentage, 100);
};

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 70) return '#67c23a';
  if (percentage < 90) return '#e6a23c';
  return '#f56c6c';
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const result = await tenantStore.updateTenantQuota(tenantId, quotaForm);
        
        if (result && result.success) {
          ElMessage.success("配额更新成功");
          fetchTenantQuotaUsage();
        } else {
          ElMessage.error(result?.message || "配额更新失败");
        }
      } finally {
        loading.value = false;
      }
    }
  });
};

// 重置表单
const resetForm = () => {
  fetchTenantQuota();
};

// 返回详情页
const goBack = () => {
  router.push(`/tenant/detail/${tenantId}`);
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

.quota-form {
  margin: 20px 0;
}

.usage-card {
  text-align: center;
  padding: 10px;
}

.usage-title {
  margin-bottom: 10px;
  font-weight: bold;
}

.usage-info {
  margin-top: 10px;
  color: #606266;
}

.updated-time {
  margin-top: 15px;
  text-align: right;
  color: #909399;
  font-size: 12px;
}
</style> 
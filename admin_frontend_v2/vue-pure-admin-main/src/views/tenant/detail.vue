<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">租户详情</span>
          <div class="card-header-right">
            <el-button
              type="primary"
              :icon="Edit"
              @click="handleEdit"
            >
              编辑
            </el-button>
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
      
      <div v-loading="loading">
        <el-empty v-if="!tenant" description="未找到租户信息"></el-empty>
        
        <template v-else>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="租户ID">{{ tenant.id }}</el-descriptions-item>
            <el-descriptions-item label="租户名称">{{ tenant.name }}</el-descriptions-item>
            <el-descriptions-item label="租户域名">{{ tenant.domain }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="tenant.status === 'active' ? 'success' : 'danger'">
                {{ tenant.status === 'active' ? '正常' : '暂停' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="联系人">{{ tenant.contact_name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ tenant.contact_phone }}</el-descriptions-item>
            <el-descriptions-item label="联系邮箱">{{ tenant.contact_email }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ tenant.created_at }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ tenant.updated_at }}</el-descriptions-item>
            <el-descriptions-item label="租户描述" :span="2">
              {{ tenant.description || '无' }}
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="action-row">
            <el-button
              type="primary"
              :icon="SetUp"
              @click="handleQuota"
            >
              管理配额
            </el-button>
            
            <el-button
              v-if="tenant.status === 'active'"
              type="warning"
              :icon="VideoPause"
              @click="handleSuspend"
            >
              暂停租户
            </el-button>
            <el-button
              v-else
              type="success"
              :icon="VideoPlay"
              @click="handleActivate"
            >
              激活租户
            </el-button>
            
            <el-button
              type="danger"
              :icon="Delete"
              @click="handleDelete"
            >
              删除租户
            </el-button>
          </div>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useTenantStoreHook } from "@/store/modules/tenant";
import type { TenantDetail } from "../../../types/tenant";
import {
  Edit,
  Back,
  SetUp,
  VideoPause,
  VideoPlay,
  Delete
} from "@element-plus/icons-vue";

// 路由实例
const router = useRouter();
const route = useRoute();

// 租户store
const tenantStore = useTenantStoreHook();

// 租户详情数据
const tenant = ref<TenantDetail | null>(null);
const loading = ref(false);

// 获取租户ID
const tenantId = parseInt(route.params.id as string);

// 初始化
onMounted(async () => {
  if (tenantId) {
    await fetchTenantDetail();
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

// 编辑租户
const handleEdit = () => {
  router.push(`/tenant/edit/${tenantId}`);
};

// 管理配额
const handleQuota = () => {
  router.push(`/tenant/quota/${tenantId}`);
};

// 暂停租户
const handleSuspend = () => {
  if (!tenant.value) return;
  
  ElMessageBox.confirm(`确认要暂停租户 ${tenant.value.name} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await tenantStore.suspendTenant(tenantId);
      if (result && result.success) {
        ElMessage.success("租户已暂停");
        fetchTenantDetail();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 激活租户
const handleActivate = () => {
  if (!tenant.value) return;
  
  ElMessageBox.confirm(`确认要激活租户 ${tenant.value.name} 吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await tenantStore.activateTenant(tenantId);
      if (result && result.success) {
        ElMessage.success("租户已激活");
        fetchTenantDetail();
      } else {
        ElMessage.error(result?.message || "操作失败");
      }
    })
    .catch(() => {});
};

// 删除租户
const handleDelete = () => {
  if (!tenant.value) return;
  
  ElMessageBox.confirm(`确认要删除租户 ${tenant.value.name} 吗？此操作不可恢复！`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      const result = await tenantStore.deleteTenant(tenantId);
      if (result && result.success) {
        ElMessage.success("删除成功");
        goBack();
      } else {
        ElMessage.error(result?.message || "删除失败");
      }
    })
    .catch(() => {});
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

.action-row {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style> 
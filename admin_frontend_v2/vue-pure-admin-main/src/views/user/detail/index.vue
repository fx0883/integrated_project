<template>
  <div class="main-container">
    <div v-loading="loading" class="detail-card">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-title">用户详情</span>
        </template>
      </el-page-header>

      <div class="card-content">
        <div class="user-avatar-section">
          <el-avatar
            :size="100"
            :src="userInfo.avatar"
            class="user-avatar"
          />
          <div class="user-roles">
            <el-tag v-if="userInfo.is_super_admin" type="danger">超级管理员</el-tag>
            <el-tag v-else-if="userInfo.is_admin" type="warning">管理员</el-tag>
            <el-tag v-else>普通用户</el-tag>
            <el-tag
              :type="userInfo.status === 'active' ? 'success' : 'danger'"
              class="status-tag"
            >
              {{ userInfo.status === "active" ? "激活" : "禁用" }}
            </el-tag>
          </div>
        </div>

        <el-descriptions
          class="user-info-section"
          title="基本信息"
          :column="2"
          border
        >
          <el-descriptions-item label="用户名">
            {{ userInfo.username }}
          </el-descriptions-item>
          <el-descriptions-item label="昵称">
            {{ userInfo.nickname || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ userInfo.email }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号码">
            {{ userInfo.phone || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="租户">
            {{ userInfo.tenant_name || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            {{ userInfo.department || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="职位">
            {{ userInfo.position || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录">
            {{ userInfo.last_login || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ userInfo.created_at }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="action-section">
          <el-button type="primary" @click="handleEdit">编辑用户</el-button>
          <el-button type="success" @click="handleAssignRole">分配角色</el-button>
          <el-button :type="userInfo.status === 'active' ? 'warning' : 'success'" @click="handleToggleStatus">
            {{ userInfo.status === "active" ? "禁用用户" : "激活用户" }}
          </el-button>
          <el-button type="danger" @click="handleDelete">删除用户</el-button>
        </div>
      </div>
    </div>
    
    <!-- 角色分配对话框 -->
    <role-dialog
      v-model:visible="roleDialog.visible"
      :user-id="roleDialog.userId"
      @success="fetchUserInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { getUserById, deleteUser, activateUser, disableUser } from "@/api/user";
import type { UserInfo } from "@/types/user";
import RoleDialog from "../form/role.vue";

defineOptions({
  name: "UserDetail"
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);

// 用户信息
const userInfo = reactive<UserInfo>({
  id: 0,
  username: "",
  email: "",
  is_admin: false,
  is_super_admin: false,
  status: "active",
  created_at: "",
  updated_at: ""
});

// 角色分配对话框
const roleDialog = reactive({
  visible: false,
  userId: undefined as number | undefined
});

// 获取用户ID
const getUserId = (): number => {
  return Number(route.params.id);
};

// 获取用户详情
const fetchUserInfo = async () => {
  const id = getUserId();
  if (!id) return;
  
  loading.value = true;
  try {
    const { data } = await getUserById(id);
    Object.assign(userInfo, data);
  } catch (error) {
    console.error("获取用户详情失败", error);
    ElMessage.error("获取用户详情失败");
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  router.push("/user/list");
};

// 编辑用户
const handleEdit = () => {
  // 跳转到编辑页面或打开编辑对话框
  router.push(`/user/edit/${userInfo.id}`);
};

// 分配角色
const handleAssignRole = () => {
  roleDialog.userId = userInfo.id;
  roleDialog.visible = true;
};

// 切换用户状态（激活/禁用）
const handleToggleStatus = async () => {
  const action = userInfo.status === "active" ? "禁用" : "激活";
  
  ElMessageBox.confirm(`确认${action}该用户吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      if (userInfo.status === "active") {
        await disableUser(userInfo.id);
      } else {
        await activateUser(userInfo.id);
      }
      ElMessage.success(`${action}成功`);
      fetchUserInfo();
    } catch (error) {
      console.error(`${action}失败`, error);
      ElMessage.error(`${action}失败`);
    }
  }).catch(() => {});
};

// 删除用户
const handleDelete = () => {
  ElMessageBox.confirm("确认删除该用户吗？此操作不可恢复", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteUser(userInfo.id);
      ElMessage.success("删除成功");
      router.push("/user/list");
    } catch (error) {
      console.error("删除失败", error);
      ElMessage.error("删除失败");
    }
  }).catch(() => {});
};

// 初始化
onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
.main-container {
  padding: 16px;
}

.detail-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 18px;
  font-weight: bold;
}

.card-content {
  padding: 20px;
}

.user-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.user-avatar {
  margin-bottom: 16px;
}

.user-roles {
  display: flex;
  gap: 8px;
}

.status-tag {
  margin-left: 8px;
}

.user-info-section {
  margin-bottom: 24px;
}

.action-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}
</style> 
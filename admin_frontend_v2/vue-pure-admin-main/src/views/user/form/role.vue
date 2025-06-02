<template>
  <el-dialog
    v-model="dialogVisible"
    title="分配角色"
    width="500px"
    destroy-on-close
  >
    <div v-loading="loading">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox
            v-model="isSuperAdmin"
            @change="handleSuperAdminChange"
            :disabled="!canManageSuperAdmin"
          >
            超级管理员
          </el-checkbox>
          <el-divider />
          <el-checkbox-group v-model="selectedRoleIds">
            <el-checkbox
              v-for="role in roleList"
              :key="role.id"
              :label="role.id"
              :disabled="isSuperAdmin"
            >
              {{ role.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, defineProps, defineEmits } from "vue";
import { ElMessage } from "element-plus";
import { getUserById, updateUserRole, grantSuperAdmin, revokeSuperAdmin } from "@/api/user";
import { getAllRoleList } from "@/api/system";

interface RoleItem {
  id: number;
  name: string;
  code: string;
  description?: string;
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userId: {
    type: Number,
    default: undefined
  }
});

const emit = defineEmits(["update:visible", "success"]);

const dialogVisible = ref(props.visible);
const loading = ref(false);
const submitLoading = ref(false);
const roleList = ref<RoleItem[]>([]);
const selectedRoleIds = ref<number[]>([]);
const isSuperAdmin = ref(false);
const canManageSuperAdmin = ref(false);

// 用户信息
const userInfo = reactive({
  username: "",
  email: "",
  is_admin: false,
  is_super_admin: false
});

// 监听visible属性变化
watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
    if (val && props.userId) {
      fetchUserAndRoles();
    }
  }
);

// 监听dialogVisible变化，同步更新父组件
watch(
  () => dialogVisible.value,
  (val) => {
    emit("update:visible", val);
  }
);

// 获取用户信息和角色列表
const fetchUserAndRoles = async () => {
  if (!props.userId) return;
  
  loading.value = true;
  try {
    // 获取用户信息
    const userRes = await getUserById(props.userId);
    Object.assign(userInfo, {
      username: userRes.data.username,
      email: userRes.data.email,
      is_admin: userRes.data.is_admin,
      is_super_admin: userRes.data.is_super_admin
    });
    
    isSuperAdmin.value = userRes.data.is_super_admin;
    
    // 检查当前登录用户是否有管理超级管理员的权限
    // 通常需要从权限控制系统中获取
    canManageSuperAdmin.value = true; // 这里暂时设为true，实际应根据权限判断
    
    // 获取角色列表
    const roleRes = await getAllRoleList();
    roleList.value = roleRes.data || [];
    
    // 获取用户已分配的角色ID
    // 这里假设返回的用户信息中包含角色ID数组，实际可能需要额外请求
    selectedRoleIds.value = userRes.data.role_ids || [];
  } catch (error) {
    console.error("获取数据失败", error);
  } finally {
    loading.value = false;
  }
};

// 处理超级管理员状态变更
const handleSuperAdminChange = (val: boolean) => {
  if (val) {
    // 选中超级管理员时，清空其他角色选择
    selectedRoleIds.value = [];
  }
};

// 提交表单
const submitForm = async () => {
  if (!props.userId) return;
  
  submitLoading.value = true;
  try {
    // 处理超级管理员权限
    if (isSuperAdmin.value !== userInfo.is_super_admin) {
      if (isSuperAdmin.value) {
        await grantSuperAdmin(props.userId);
      } else {
        await revokeSuperAdmin(props.userId);
      }
    }
    
    // 如果不是超级管理员，则更新角色
    if (!isSuperAdmin.value) {
      await updateUserRole(props.userId, { role_ids: selectedRoleIds.value });
    }
    
    ElMessage.success("角色分配成功");
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    console.error("提交失败", error);
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 
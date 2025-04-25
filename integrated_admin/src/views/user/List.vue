<template>
  <div class="user-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="handleCreate">创建用户</el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="queryParams" ref="queryForm">
          <el-form-item label="搜索关键词">
            <el-input v-model="queryParams.search" placeholder="用户名/邮箱/昵称/手机号" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option label="活跃" value="active" />
              <el-option label="禁用" value="disabled" />
              <el-option label="未激活" value="pending" />
            </el-select>
          </el-form-item>
          <el-form-item label="租户" v-if="isSuperAdmin">
            <el-select 
              v-model="queryParams.tenant_id" 
              placeholder="请选择租户" 
              clearable
              filterable
              remote
              :remote-method="searchTenants"
              :loading="tenantsLoading"
            >
              <el-option
                v-for="item in tenantOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 用户表格 -->
      <el-table
        :data="userList"
        style="width: 100%"
        v-loading="loading"
        border
      >
        <el-table-column type="index" width="50" label="#" />
        <el-table-column label="头像" width="80" align="center">
          <template #default="scope">
            <div class="avatar-cell">
              <img v-if="scope.row.avatar" :src="scope.row.avatar" class="avatar-image" />
              <div v-else class="avatar-placeholder">{{ getUserInitials(scope.row) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column prop="nick_name" label="昵称" min-width="100" />
        <el-table-column prop="phone" label="电话" min-width="120" />
        <el-table-column prop="tenant_name" label="所属租户" min-width="150" v-if="isSuperAdmin" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.is_super_admin" type="danger">超级管理员</el-tag>
            <el-tag v-else-if="scope.row.is_admin" type="warning">租户管理员</el-tag>
            <el-tag v-else type="info">普通用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.is_active" type="success">活跃</el-tag>
            <el-tag v-else-if="!scope.row.is_active" type="info">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date_joined" label="注册时间" min-width="160" />
        <el-table-column fixed="right" label="操作" width="220">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row.id)">编辑</el-button>
            <el-button 
              v-if="canManageUser(scope.row)" 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >删除</el-button>
            <el-dropdown trigger="click" v-if="canManageUser(scope.row)">
              <el-button size="small" type="primary">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-if="!scope.row.is_active" 
                    @click="handleActivate(scope.row)"
                  >激活账号</el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.is_active" 
                    @click="handleDisable(scope.row)"
                  >禁用账号</el-dropdown-item>
                  <el-dropdown-item @click="handleResetPassword(scope.row)">重置密码</el-dropdown-item>
                  <el-dropdown-item 
                    v-if="isSuperAdmin && !scope.row.is_super_admin" 
                    @click="handleGrantSuperAdmin(scope.row)"
                  >设为超管</el-dropdown-item>
                  <el-dropdown-item 
                    v-if="isSuperAdmin && scope.row.is_super_admin && scope.row.username !== userInfo.username" 
                    @click="handleRevokeSuperAdmin(scope.row)"
                  >撤销超管</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi, tenantApi } from '../../api'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

// 路由
const router = useRouter()
const route = useRoute()

// 当前用户信息
const userInfo = computed(() => {
  const info = JSON.parse(localStorage.getItem('user_info') || '{}')
  return info
})

// 判断是否为超级管理员
const isSuperAdmin = computed(() => userInfo.value.is_super_admin)

// 查询参数
const queryParams = reactive({
  search: '',
  status: '',
  tenant_id: '',
  page: 1,
  page_size: 10
})

// 如果路由查询参数中有tenant_id，设置初始值
onMounted(() => {
  if (route.query.tenant_id) {
    queryParams.tenant_id = route.query.tenant_id
    // 获取租户信息
    searchTenants('')
  }
})

// 用户列表数据
const userList = ref([])
const total = ref(0)
const loading = ref(false)
const queryForm = ref(null)

// 租户选项
const tenantOptions = ref([])
const tenantsLoading = ref(false)

// 搜索租户
const searchTenants = async (query) => {
  try {
    tenantsLoading.value = true
    const response = await tenantApi.getTenants({
      search: query,
      page_size: 20,
      page: 1
    })
    tenantOptions.value = response.results || []
    tenantsLoading.value = false
  } catch (error) {
    console.error('搜索租户失败:', error)
    tenantsLoading.value = false
  }
}

// 判断是否可以管理该用户
const canManageUser = (user) => {
  // 超级管理员可以管理所有用户
  if (isSuperAdmin.value) return true
  
  // 租户管理员不能管理超级管理员和其他租户的管理员
  if (user.is_super_admin) return false
  
  // 租户管理员只能管理自己租户的用户
  return user.tenant_id === userInfo.value.tenant_id
}

// 获取用户列表
const getUserList = async () => {
  try {
    loading.value = true
    
    // 如果是租户管理员，强制只查询本租户的用户
    if (!isSuperAdmin.value) {
      queryParams.tenant_id = userInfo.value.tenant_id
    }
    
    // 调用API获取用户列表
    const response = await userApi.getUsers(queryParams)
    userList.value = response.results || []
    total.value = response.count || 0
    
    loading.value = false
  } catch (error) {
    console.error('获取用户列表失败:', error)
    loading.value = false
    ElMessage.error('获取用户列表失败')
  }
}

// 搜索
const handleQuery = () => {
  queryParams.page = 1
  getUserList()
}

// 重置搜索
const resetQuery = () => {
  queryForm.value.resetFields()
  // 如果是租户管理员，重置后仍然只显示自己租户的用户
  if (!isSuperAdmin.value) {
    queryParams.tenant_id = userInfo.value.tenant_id
  }
  handleQuery()
}

// 分页大小变化
const handleSizeChange = (size) => {
  queryParams.page_size = size
  getUserList()
}

// 页码变化
const handleCurrentChange = (page) => {
  queryParams.page = page
  getUserList()
}

// 创建用户
const handleCreate = () => {
  router.push('/users/create')
}

// 编辑用户
const handleEdit = (id) => {
  router.push(`/users/edit/${id}`)
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户"${row.username}"吗？这个操作不可逆。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userApi.deleteUser(row.id)
      ElMessage.success('删除用户成功')
      getUserList()
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error(error.response?.data?.message || '删除用户失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 激活用户
const handleActivate = (row) => {
  ElMessageBox.confirm(
    `确定要激活用户"${row.username}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      await userApi.activateUser(row.id)
      ElMessage.success('激活用户成功')
      getUserList()
    } catch (error) {
      console.error('激活用户失败:', error)
      ElMessage.error(error.response?.data?.message || '激活用户失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 禁用用户
const handleDisable = (row) => {
  ElMessageBox.confirm(
    `确定要禁用用户"${row.username}"吗？禁用后该用户将无法登录。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userApi.disableUser(row.id)
      ElMessage.success('禁用用户成功')
      getUserList()
    } catch (error) {
      console.error('禁用用户失败:', error)
      ElMessage.error(error.response?.data?.message || '禁用用户失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 重置密码
const handleResetPassword = (row) => {
  ElMessageBox.confirm(
    `确定要重置用户"${row.username}"的密码吗？系统将生成新密码并发送邮件通知用户。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userApi.resetPassword(row.id)
      ElMessage.success('密码重置成功，新密码已发送到用户邮箱')
    } catch (error) {
      console.error('重置密码失败:', error)
      ElMessage.error(error.response?.data?.message || '重置密码失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 授予超级管理员权限
const handleGrantSuperAdmin = (row) => {
  ElMessageBox.confirm(
    `确定要将用户"${row.username}"设为超级管理员吗？此操作将授予该用户所有权限。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userApi.grantSuperAdmin(row.id)
      ElMessage.success('已成功设置为超级管理员')
      getUserList()
    } catch (error) {
      console.error('设置超级管理员失败:', error)
      ElMessage.error(error.response?.data?.message || '设置超级管理员失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 撤销超级管理员权限
const handleRevokeSuperAdmin = (row) => {
  ElMessageBox.confirm(
    `确定要撤销用户"${row.username}"的超级管理员权限吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userApi.revokeSuperAdmin(row.id)
      ElMessage.success('已成功撤销超级管理员权限')
      getUserList()
    } catch (error) {
      console.error('撤销超级管理员权限失败:', error)
      ElMessage.error(error.response?.data?.message || '撤销超级管理员权限失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 获取用户初始字母
const getUserInitials = (user) => {
  if (!user) return '?';
  
  const name = user.nick_name || user.username;
  return name ? name.charAt(0).toUpperCase() : '?';
}

// 生命周期钩子
onMounted(() => {
  getUserList()
})
</script>

<style scoped>
.user-list-container {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 头像样式 */
.avatar-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  color: #95a5a6;
  background-color: #ecf0f1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>
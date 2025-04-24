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
          <el-form-item label="用户名">
            <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="queryParams.email" placeholder="请输入邮箱" clearable />
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
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="150" />
        <el-table-column prop="name" label="姓名" min-width="100" />
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
            <el-tag v-if="scope.row.status === 'active'" type="success">活跃</el-tag>
            <el-tag v-else-if="scope.row.status === 'pending'" type="warning">未激活</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" min-width="160" />
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
                    v-if="scope.row.status !== 'active'" 
                    @click="handleActivate(scope.row)"
                  >激活账号</el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.status === 'active'" 
                    @click="handleDisable(scope.row)"
                  >禁用账号</el-dropdown-item>
                  <el-dropdown-item @click="handleResetPassword(scope.row)">重置密码</el-dropdown-item>
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
          v-model:page-size="queryParams.limit"
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
  username: '',
  email: '',
  status: '',
  tenant_id: '',
  page: 1,
  limit: 10
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
      name: query,
      limit: 20,
      page: 1
    })
    tenantOptions.value = response.items || []
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
    console.log('获取用户列表，参数:', queryParams)
    
    // 如果是租户管理员，强制只查询本租户的用户
    if (!isSuperAdmin.value) {
      queryParams.tenant_id = userInfo.value.tenant_id
    }
    
    // 调用API获取用户列表
    const response = await userApi.getUsers(queryParams)
    userList.value = response.items || []
    total.value = response.total || 0
    
    loading.value = false
    console.log('用户列表加载完成')
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
  queryParams.limit = size
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
      ElMessage.error('删除用户失败')
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
      ElMessage.error('激活用户失败')
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
      ElMessage.error('禁用用户失败')
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
      ElMessage.error('重置密码失败')
    }
  }).catch(() => {
    // 取消操作
  })
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
</style>
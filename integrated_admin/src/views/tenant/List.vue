<template>
  <div class="tenant-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>租户列表</span>
          <el-button type="primary" @click="handleCreate">创建租户</el-button>
        </div>
      </template>
      
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="queryParams" ref="queryForm">
          <el-form-item label="租户名称">
            <el-input v-model="queryParams.name" placeholder="请输入租户名称" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option label="激活" value="active" />
              <el-option label="禁用" value="disabled" />
              <el-option label="暂停" value="suspended" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">搜索</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 租户表格 -->
      <el-table
        :data="tenantList"
        style="width: 100%"
        v-loading="loading"
        border
      >
        <el-table-column type="index" width="50" label="#" />
        <el-table-column prop="name" label="租户名称" min-width="120" />
        <el-table-column prop="domain" label="域名" min-width="150" />
        <el-table-column prop="industry" label="行业" min-width="100" />
        <el-table-column prop="contact_name" label="联系人" min-width="100" />
        <el-table-column prop="contact_phone" label="联系电话" min-width="120" />
        <el-table-column prop="admin_email" label="管理员邮箱" min-width="150" />
        <el-table-column prop="user_count" label="用户数" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'active'" type="success">激活</el-tag>
            <el-tag v-else-if="scope.row.status === 'suspended'" type="warning">暂停</el-tag>
            <el-tag v-else type="info">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column fixed="right" label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row.id)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >删除</el-button>
            <el-dropdown trigger="click">
              <el-button size="small" type="primary">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleViewUsers(scope.row.id)">查看用户</el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.status === 'active'" 
                    @click="handleSuspend(scope.row)"
                  >暂停租户</el-dropdown-item>
                  <el-dropdown-item 
                    v-if="scope.row.status === 'suspended'" 
                    @click="handleActivate(scope.row)"
                  >激活租户</el-dropdown-item>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tenantApi } from '../../api'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

// 路由
const router = useRouter()

// 查询参数
const queryParams = reactive({
  name: '',
  status: '',
  page: 1,
  limit: 10
})

// 租户列表数据
const tenantList = ref([])
const total = ref(0)
const loading = ref(false)
const queryForm = ref(null)

// 获取租户列表
const getTenantList = async () => {
  try {
    loading.value = true
    console.log('获取租户列表，参数:', queryParams)
    
    // 调用API获取租户列表
    const response = await tenantApi.getTenants(queryParams)
    tenantList.value = response.items || []
    total.value = response.total || 0
    
    loading.value = false
    console.log('租户列表加载完成')
  } catch (error) {
    console.error('获取租户列表失败:', error)
    loading.value = false
    ElMessage.error('获取租户列表失败')
  }
}

// 搜索
const handleQuery = () => {
  queryParams.page = 1
  getTenantList()
}

// 重置搜索
const resetQuery = () => {
  queryForm.value.resetFields()
  handleQuery()
}

// 分页大小变化
const handleSizeChange = (size) => {
  queryParams.limit = size
  getTenantList()
}

// 页码变化
const handleCurrentChange = (page) => {
  queryParams.page = page
  getTenantList()
}

// 创建租户
const handleCreate = () => {
  router.push('/tenants/create')
}

// 编辑租户
const handleEdit = (id) => {
  router.push(`/tenants/edit/${id}`)
}

// 删除租户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除租户"${row.name}"吗？这个操作不可逆。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await tenantApi.deleteTenant(row.id)
      ElMessage.success('删除租户成功')
      getTenantList()
    } catch (error) {
      console.error('删除租户失败:', error)
      ElMessage.error('删除租户失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 查看租户用户
const handleViewUsers = (id) => {
  router.push({
    path: '/users',
    query: {
      tenant_id: id
    }
  })
}

// 暂停租户
const handleSuspend = (row) => {
  ElMessageBox.confirm(
    `确定要暂停租户"${row.name}"吗？暂停后该租户的用户将无法登录。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await tenantApi.suspendTenant(row.id)
      ElMessage.success('暂停租户成功')
      getTenantList()
    } catch (error) {
      console.error('暂停租户失败:', error)
      ElMessage.error('暂停租户失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 激活租户
const handleActivate = (row) => {
  ElMessageBox.confirm(
    `确定要激活租户"${row.name}"吗？激活后该租户的用户将可以正常登录。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      await tenantApi.activateTenant(row.id)
      ElMessage.success('激活租户成功')
      getTenantList()
    } catch (error) {
      console.error('激活租户失败:', error)
      ElMessage.error('激活租户失败')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 生命周期钩子
onMounted(() => {
  getTenantList()
})
</script>

<style scoped>
.tenant-list-container {
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
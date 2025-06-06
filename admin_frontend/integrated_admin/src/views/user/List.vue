<template>
  <div class="user-list-container">
    <el-card shadow="never" class="filter-container">
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
          <el-form-item label="角色">
            <el-select v-model="queryParams.role" placeholder="请选择角色" clearable>
              <el-option label="超级管理员" value="super_admin" />
              <el-option label="租户管理员" value="admin" />
              <el-option label="普通用户" value="user" />
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
      <div class="table-container">
        <el-table
          :data="userList"
          v-loading="loading"
          border
          style="width: 100%; min-width: 1000px;"
        >
          <el-table-column type="index" width="50" label="#" align="center" />
          <el-table-column label="头像" width="80" align="center">
            <template #default="scope">
              <div class="avatar-cell">
                <img v-if="scope.row.avatar" :src="scope.row.avatar" class="avatar-image" />
                <div v-else class="avatar-placeholder">{{ getUserInitials(scope.row) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="用户名" min-width="120" align="center" />
          <el-table-column prop="email" label="邮箱" min-width="150" align="center" />
          <el-table-column prop="nick_name" label="昵称" min-width="100" align="center" />
          <el-table-column prop="phone" label="电话" min-width="120" align="center" />
          <el-table-column prop="tenant_name" label="所属租户" min-width="150" v-if="isSuperAdmin" align="center" />
          <el-table-column prop="role" label="角色" width="120" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.is_super_admin" type="danger">超级管理员</el-tag>
              <el-tag v-else-if="scope.row.is_admin" type="warning">租户管理员</el-tag>
              <el-tag v-else type="info">普通用户</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.is_active" type="success">活跃</el-tag>
              <el-tag v-else-if="!scope.row.is_active" type="info">禁用</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="date_joined" label="注册时间" min-width="160" align="center" />
          <el-table-column label="操作" width="220" align="center" class-name="small-padding fixed-width">
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
                    <el-dropdown-item 
                      v-if="isSuperAdmin && scope.row.is_admin && !scope.row.is_super_admin" 
                      @click="handleEditMenus(scope.row)"
                    >编辑菜单</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
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
    
    <!-- 菜单编辑对话框 -->
    <el-dialog
      v-model="showMenuDialog"
      :title="`编辑菜单权限 - ${currentUser?.username || ''}`"
      width="50%"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div v-loading="menuDialogLoading">
        <div class="menu-dialog-header">
          <p>请选择要分配给该租户管理员的菜单项：</p>
          <div>
            <el-button size="small" @click="handleUncheckAll">取消全选</el-button>
            <el-button size="small" type="primary" @click="handleCheckAll">全选</el-button>
          </div>
        </div>
        
        <el-tree
          ref="menuTreeRef"
          :data="menuTreeData"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{
            label: 'name',
            children: 'children'
          }"
          :check-strictly="false"
          @check="handleTreeCheck"
          class="menu-tree"
        >
          <template #default="{ node, data }">
            <span class="menu-tree-node">
              <span>{{ node.label }}</span>
              <span class="menu-tree-code">{{ data.code }}</span>
            </span>
          </template>
        </el-tree>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMenuDialog = false">取消</el-button>
          <el-button type="primary" @click="saveUserMenus" :loading="menuDialogLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userApi, tenantApi } from '../../api'
import { menuApi } from '../../api'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { request } from '../../utils/request'

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
  role: '',
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
  
  // 自动加载用户列表数据
  getUserList();
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
  // 如果不是超级管理员，不调用租户API
  if (!isSuperAdmin.value) {
    return;
  }
  
  try {
    tenantsLoading.value = true
    const response = await tenantApi.getTenants({
      search: query,
      page_size: 20,
      page: 1
    })
    
    // 处理API响应
    if (response && (response.success === true || response.results)) {
      // 处理数据
      let responseData = response;
      if (response.data) {
        responseData = response.data;
      }
      
      if (responseData.results) {
        tenantOptions.value = responseData.results;
      } else if (Array.isArray(responseData)) {
        tenantOptions.value = responseData;
      } else {
        tenantOptions.value = [];
      }
      
      console.log('获取租户列表成功:', tenantOptions.value);
    } else {
      console.error('搜索租户失败:', response?.message || '未知错误')
      ElMessage.error(response?.message || '搜索租户失败')
    }
    tenantsLoading.value = false
  } catch (error) {
    console.error('搜索租户失败:', error)
    ElMessage.error(error?.message || '搜索租户失败')
    tenantsLoading.value = false
    tenantOptions.value = []
  }
}

// 判断是否可以管理该用户
const canManageUser = (user) => {
  // 超级管理员可以管理所有用户
  if (isSuperAdmin.value) return true
  
  // 租户管理员不能管理超级管理员和其他租户的管理员
  if (user.is_super_admin) return false
  
  // 租户管理员只能管理自己租户的用户
  return user.tenant_id === userInfo.value.tenant_id || user.tenant === userInfo.value.tenant_id;
}

// 获取用户列表
const getUserList = async () => {
  try {
    loading.value = true
    
    // 如果是租户管理员，强制只查询本租户的用户
    if (!isSuperAdmin.value && userInfo.value.tenant_id) {
      queryParams.tenant_id = userInfo.value.tenant_id
    }
    
    // 转换角色参数为API需要的格式
    const params = { ...queryParams }
    if (params.role) {
      if (params.role === 'super_admin') {
        params.is_super_admin = true
      } else if (params.role === 'admin') {
        params.is_admin = true
        params.is_super_admin = false
      } else if (params.role === 'user') {
        params.is_admin = false
        params.is_super_admin = false
      }
      // 删除原始role字段，后端API不使用此字段
      delete params.role
    }
    
    console.log('获取用户列表，查询参数:', params);
    
    // 调用API获取用户列表
    const response = await userApi.getUsers(params)
    
    // 处理API响应
    if (response && (response.success === true || response.results)) {
      // 直接从data字段获取数据
      let responseData = response;
      if (response.data) {
        responseData = response.data;
      }
      
      // 处理分页数据
      if (responseData.pagination) {
        userList.value = responseData.results || []
        total.value = responseData.pagination.count || 0
      } else if (responseData.results) {
        userList.value = responseData.results
        total.value = responseData.count || 0
      } else {
        // 如果没有分页信息，直接使用data
        userList.value = Array.isArray(responseData) ? responseData : []
        total.value = userList.value.length
      }
      console.log('获取用户列表成功:', userList.value);
    } else {
      // 错误处理
      console.error('获取用户列表失败:', response.message);
      ElMessage.error(response.message || '获取用户列表失败');
      userList.value = [];
      total.value = 0;
    }
    loading.value = false
  } catch (error) {
    console.error('获取用户列表失败:', error)
    loading.value = false
    userList.value = [];
    total.value = 0;
    
    // 错误处理增强，显示更详细的错误信息
    let errorMessage = '获取用户列表失败';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    ElMessage.error(errorMessage)
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
  if (!isSuperAdmin.value && userInfo.value.tenant_id) {
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
      const response = await userApi.deleteUser(row.id)
      if (response.success) {
        // 可能有额外返回数据在data字段
        const responseData = request.getResponseData(response)
        ElMessage.success(response.message || '删除用户成功')
        getUserList()
      } else {
        ElMessage.error(response.message || '删除用户失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      ElMessage.error(error.message || '删除用户失败')
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
      const response = await userApi.activateUser(row.id)
      if (response.success) {
        // 可能有额外返回数据在data字段
        const responseData = request.getResponseData(response)
        ElMessage.success(response.message || '激活用户成功')
        getUserList()
      } else {
        ElMessage.error(response.message || '激活用户失败')
      }
    } catch (error) {
      console.error('激活用户失败:', error)
      ElMessage.error(error.message || '激活用户失败')
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
      const response = await userApi.disableUser(row.id)
      if (response.success) {
        // 可能有额外返回数据在data字段
        const responseData = request.getResponseData(response)
        ElMessage.success(response.message || '禁用用户成功')
        getUserList()
      } else {
        ElMessage.error(response.message || '禁用用户失败')
      }
    } catch (error) {
      console.error('禁用用户失败:', error)
      ElMessage.error(error.message || '禁用用户失败')
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
      const response = await userApi.resetPassword(row.id)
      if (response.success) {
        // 密码重置可能会在data字段返回新密码信息
        const responseData = request.getResponseData(response)
        // 如果返回了新密码，可以显示给管理员
        let successMsg = response.message || '密码重置成功，新密码已发送到用户邮箱'
        if (responseData && responseData.new_password) {
          successMsg += `：${responseData.new_password}`
        }
        ElMessage.success(successMsg)
      } else {
        ElMessage.error(response.message || '重置密码失败')
      }
    } catch (error) {
      console.error('重置密码失败:', error)
      ElMessage.error(error.message || '重置密码失败')
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
      const response = await userApi.grantSuperAdmin(row.id)
      if (response.success) {
        // 可能有额外返回数据在data字段
        const responseData = request.getResponseData(response)
        ElMessage.success(response.message || '已成功设置为超级管理员')
        getUserList()
      } else {
        ElMessage.error(response.message || '设置超级管理员失败')
      }
    } catch (error) {
      console.error('设置超级管理员失败:', error)
      ElMessage.error(error.message || '设置超级管理员失败')
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
      const response = await userApi.revokeSuperAdmin(row.id)
      if (response.success) {
        // 可能有额外返回数据在data字段
        const responseData = request.getResponseData(response)
        ElMessage.success(response.message || '已成功撤销超级管理员权限')
        getUserList()
      } else {
        ElMessage.error(response.message || '撤销超级管理员权限失败')
      }
    } catch (error) {
      console.error('撤销超级管理员权限失败:', error)
      ElMessage.error(error.message || '撤销超级管理员权限失败')
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

// 编辑菜单相关变量
const showMenuDialog = ref(false)
const currentUser = ref(null)
const menuTreeData = ref([])
const userMenuIds = ref([])
const checkedMenuIds = ref([])
const menuDialogLoading = ref(false)
const menuTreeRef = ref(null)

// 编辑用户菜单
const handleEditMenus = async (row) => {
  currentUser.value = row
  showMenuDialog.value = true
  menuDialogLoading.value = true
  
  try {
    // 获取菜单树形数据
    const treeResponse = await menuApi.getMenuTree()
    const treeData = request.getResponseData(treeResponse)
    menuTreeData.value = treeData || []
    
    // 获取用户当前的菜单
    const userMenuResponse = await menuApi.getAdminMenus(row.id)
    const userMenuData = request.getResponseData(userMenuResponse)
    
    if (userMenuData && userMenuData.menus) {
      // 提取菜单ID
      userMenuIds.value = userMenuData.menus.map(menu => menu.id)
      // 初始化选中项
      checkedMenuIds.value = [...userMenuIds.value]
      
      // 等待DOM更新完成后设置选中状态
      setTimeout(() => {
        if (menuTreeRef.value) {
          menuTreeRef.value.setCheckedKeys(checkedMenuIds.value)
          console.log('初始化菜单选中状态:', checkedMenuIds.value)
        }
      }, 100)
    } else {
      userMenuIds.value = []
      checkedMenuIds.value = []
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error)
    ElMessage.error('获取菜单数据失败')
  } finally {
    menuDialogLoading.value = false
  }
}

// 处理树节点选中状态变更
const handleTreeCheck = (data, checked) => {
  // 更新选中的节点ID列表
  if (menuTreeRef.value) {
    checkedMenuIds.value = menuTreeRef.value.getCheckedKeys()
    console.log('当前选中的菜单ID:', checkedMenuIds.value)
  }
}

// 修改保存用户菜单函数
const saveUserMenus = async () => {
  if (!currentUser.value) return
  
  // 重新获取最新选中的菜单ID
  if (menuTreeRef.value) {
    checkedMenuIds.value = menuTreeRef.value.getCheckedKeys()
  }
  
  // 检查是否选择了至少一个菜单项
  if (!checkedMenuIds.value.length) {
    ElMessage.warning('请至少选择一个菜单项')
    return
  }
  
  console.log('准备保存的菜单ID:', checkedMenuIds.value)
  
  menuDialogLoading.value = true
  try {
    const response = await menuApi.assignMenusToAdmin(
      currentUser.value.id, 
      checkedMenuIds.value
    )
    
    if (response.success) {
      ElMessage.success('菜单权限设置成功')
      showMenuDialog.value = false
    } else {
      ElMessage.error(response.message || '菜单权限设置失败')
    }
  } catch (error) {
    console.error('保存菜单权限失败:', error)
    ElMessage.error('保存菜单权限失败')
  } finally {
    menuDialogLoading.value = false
  }
}

// 获取所有菜单ID
const getAllMenuIds = (menuItems) => {
  let ids = []
  
  const collectIds = (items) => {
    if (!items || !items.length) return
    
    items.forEach(item => {
      ids.push(item.id)
      if (item.children && item.children.length > 0) {
        collectIds(item.children)
      }
    })
  }
  
  collectIds(menuItems)
  return ids
}

// 处理全选按钮
const handleCheckAll = () => {
  if (menuTreeData.value && menuTreeData.value.length > 0) {
    // 使用el-tree的setCheckedKeys方法设置所有选中项
    if (menuTreeRef.value) {
      const allIds = getAllMenuIds(menuTreeData.value)
      menuTreeRef.value.setCheckedKeys(allIds)
      checkedMenuIds.value = [...allIds] // 使用解构创建新数组以确保响应性
      console.log('全选后菜单ID:', checkedMenuIds.value)
    }
  }
}

// 处理取消全选按钮
const handleUncheckAll = () => {
  ElMessageBox.confirm(
    '取消全选将清空所有菜单选择，您需要至少选择一个菜单项才能保存。确定继续吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 使用el-tree的setCheckedKeys方法清空所有选中项
    if (menuTreeRef.value) {
      menuTreeRef.value.setCheckedKeys([])
      checkedMenuIds.value = []
      console.log('取消全选后菜单ID:', checkedMenuIds.value)
    }
  }).catch(() => {
    // 用户取消操作
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
  width: 100%;
  overflow-x: hidden; /* 防止整体页面出现滚动条 */
}

.filter-container {
  padding-bottom: 10px;
  max-width: 100%; /* 确保卡片不会超出父容器 */
  overflow: hidden; /* 防止溢出 */
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
  padding: 10px 16px;
  background: #fff;
  text-align: right;
}

/* 表格容器样式 */
.table-container {
  width: 100%;
  overflow-x: scroll; /* 强制显示滚动条 */
  margin-bottom: 15px;
  background: #fff;
  border: 1px solid #ebeef5;
  position: relative; /* 确保定位上下文 */
  max-width: 100%; /* 限制最大宽度为父容器宽度 */
}

/* 移除旧的样式 */
.app-container {
  display: none;
}

.table-scrollable {
  display: none;
}

/* 自定义滚动条样式 */
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 12px;
}

.table-container::-webkit-scrollbar-thumb {
  background-color: #909399;
  border-radius: 6px;
}

.table-container::-webkit-scrollbar-track {
  background-color: #f0f2f5;
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

/* 菜单对话框样式 */
.menu-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.menu-dialog-header p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.menu-tree {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 10px;
}

.menu-tree-node {
  display: flex;
  align-items: center;
}

.menu-tree-code {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.small-padding {
  padding-left: 5px;
  padding-right: 5px;
}

.fixed-width {
  min-width: 220px;
}
</style>
<template>
  <div class="menu-container">
    <div class="page-header">
      <h1 class="page-title">菜单管理</h1>
      <div class="page-actions">
        <el-button type="primary" @click="handleCreateMenu(null)" class="btn-primary">
          <el-icon><Plus /></el-icon>添加菜单
        </el-button>
      </div>
    </div>

    <div class="content-container">
      <el-card shadow="never">
        <div class="toolbar">
          <div class="left">
            <el-input
              v-model="searchQuery"
              placeholder="搜索菜单名称或标识"
              prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @input="handleSearch"
            >
            </el-input>
            <el-select v-model="activeFilter" placeholder="状态筛选" @change="handleSearch" class="status-filter">
              <el-option label="全部" value=""></el-option>
              <el-option label="启用" value="true"></el-option>
              <el-option label="禁用" value="false"></el-option>
            </el-select>
          </div>
          <div class="right">
            <el-button type="success" @click="expandAll">展开全部</el-button>
            <el-button type="info" @click="collapseAll">收起全部</el-button>
          </div>
        </div>

        <el-table
          ref="menuTableRef"
          :data="filteredMenus"
          row-key="id"
          border
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          v-loading="loading"
          default-expand-all
          class="menu-table"
        >
          <el-table-column prop="name" label="菜单名称" min-width="180">
            <template #default="scope">
              <span class="menu-name">{{ scope.row.name }}</span>
              <span class="menu-code">({{ scope.row.code }})</span>
            </template>
          </el-table-column>

          <el-table-column prop="icon" label="图标" width="80" align="center">
            <template #default="scope">
              <el-icon v-if="scope.row.icon">
                <component :is="scope.row.icon"></component>
              </el-icon>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="path" label="路径" min-width="150">
            <template #default="scope">
              <span>{{ scope.row.path || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="component" label="组件路径" min-width="180">
            <template #default="scope">
              <span>{{ scope.row.component || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="order" label="排序" width="80" align="center">
            <template #default="scope">
              <span>{{ scope.row.order || 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="is_active" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.is_active ? 'success' : 'info'" effect="light">
                {{ scope.row.is_active ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="230" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="handleEditMenu(scope.row)">编辑</el-button>
              <el-button size="small" type="primary" @click="handleCreateMenu(scope.row)">添加子菜单</el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDeleteMenu(scope.row)"
                :disabled="hasChildren(scope.row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 菜单表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formType === 'create' ? (parentMenu ? '添加子菜单' : '添加菜单') : '编辑菜单'"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="menuFormRef"
        :model="menuForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入菜单名称"></el-input>
        </el-form-item>

        <el-form-item label="菜单标识" prop="code">
          <el-input v-model="menuForm.code" placeholder="请输入菜单唯一标识"></el-input>
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-input v-model="menuForm.icon" placeholder="请输入图标名称">
            <template #append>
              <el-icon v-if="menuForm.icon">
                <component :is="menuForm.icon"></component>
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入前端路由路径"></el-input>
        </el-form-item>

        <el-form-item label="组件路径" prop="component">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径"></el-input>
        </el-form-item>

        <el-form-item label="排序序号" prop="order">
          <el-input-number v-model="menuForm.order" :min="0" :max="999"></el-input-number>
        </el-form-item>

        <el-form-item label="父级菜单">
          <el-cascader
            v-model="menuForm.parent_id"
            :options="menuCascaderOptions"
            :props="{ 
              checkStrictly: true,
              emitPath: false,
              value: 'id',
              label: 'name'
            }"
            :disabled="!!parentMenu"
            clearable
            placeholder="请选择父级菜单"
          ></el-cascader>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="menuForm.is_active"
            :active-color="variables.primaryColor"
            :inactive-color="variables.borderColor"
          ></el-switch>
          <span class="status-label">{{ menuForm.is_active ? '启用' : '禁用' }}</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="btn-primary">
            {{ formType === 'create' ? '确认创建' : '确认修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { 
  Plus, Search, Document, Edit, Delete, Setting, Menu,
  User, OfficeBuilding, Reading, Link, Collection, Folder, Switch, InfoFilled,
  List, ChatDotRound, DataAnalysis, RefreshRight, Calendar, PieChart
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { menuApi } from '@/api'
import { request } from '@/utils/request'

// 变量定义
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const formType = ref('create')
const parentMenu = ref(null)
const menuTableRef = ref(null)
const menuFormRef = ref(null)
const searchQuery = ref('')
const activeFilter = ref('')
const expandedRowKeys = ref([])

// 全局样式变量
const variables = {
  primaryColor: '#0abab5',
  borderColor: '#E8ECF4'
}

// 菜单数据，从API获取
const menus = ref([])

// 菜单表单数据
const menuForm = reactive({
  id: null,
  name: '',
  code: '',
  icon: '',
  path: '',
  component: '',
  order: 0,
  parent_id: null,
  is_active: true
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入菜单标识', trigger: 'blur' },
    { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ]
}

// 过滤后的菜单数据
const filteredMenus = computed(() => {
  if (!searchQuery.value && activeFilter.value === '') {
    return menus.value
  }
  
  const filterText = searchQuery.value.toLowerCase()
  const isActive = activeFilter.value === 'true'
  
  // 用于递归过滤菜单树
  const filterMenuTree = (menuItems) => {
    const result = []
    
    for (const item of menuItems) {
      // 根据搜索条件和状态过滤
      const matchesSearch = !filterText || 
        item.name.toLowerCase().includes(filterText) || 
        item.code.toLowerCase().includes(filterText)
      
      const matchesStatus = activeFilter.value === '' || 
        (activeFilter.value === 'true' && item.is_active) ||
        (activeFilter.value === 'false' && !item.is_active)
      
      // 递归处理子菜单
      let filteredChildren = []
      if (item.children && item.children.length > 0) {
        filteredChildren = filterMenuTree(item.children)
      }
      
      // 如果当前菜单匹配，或者子菜单中有匹配项，则添加到结果中
      if ((matchesSearch && matchesStatus) || filteredChildren.length > 0) {
        const cloneItem = { ...item }
        if (filteredChildren.length > 0) {
          cloneItem.children = filteredChildren
        } else if (item.children && item.children.length > 0) {
          cloneItem.children = []
        }
        result.push(cloneItem)
      }
    }
    
    return result
  }
  
  return filterMenuTree(menus.value)
})

// 菜单级联选择器选项
const menuCascaderOptions = computed(() => {
  // 转换菜单数据为级联选择器所需格式
  const transformMenus = (items, currentId = null) => {
    const result = []
    
    for (const item of items) {
      // 排除当前编辑的菜单及其子菜单
      if (formType.value === 'edit' && (item.id === currentId || isDescendantOf(item, currentId))) {
        continue
      }
      
      const option = {
        id: item.id,
        name: item.name,
        code: item.code,
      }
      
      if (item.children && item.children.length > 0) {
        option.children = transformMenus(item.children, currentId)
      }
      
      result.push(option)
    }
    
    return result
  }
  
  return transformMenus(menus.value, menuForm.id)
})

// 判断是否有子菜单
const hasChildren = (row) => {
  return row.children && row.children.length > 0
}

// 判断一个菜单是否是另一个菜单的后代
const isDescendantOf = (menu, ancestorId) => {
  if (!menu) return false
  if (menu.parent_id === ancestorId) return true
  
  const parent = findMenuById(menu.parent_id)
  if (parent) {
    return isDescendantOf(parent, ancestorId)
  }
  
  return false
}

// 根据ID查找菜单
const findMenuById = (id) => {
  if (!id) return null
  
  const findInTree = (items) => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children && item.children.length > 0) {
        const found = findInTree(item.children)
        if (found) return found
      }
    }
    return null
  }
  
  return findInTree(menus.value)
}

// 展开全部行
const expandAll = () => {
  if (menuTableRef.value) {
    // 获取所有数据的key
    const allKeys = getAllRowKeys(menus.value)
    expandedRowKeys.value = allKeys
    
    // 展开所有行
    allKeys.forEach(key => {
      menuTableRef.value.toggleRowExpansion(findMenuById(key), true)
    })
  }
}

// 收起全部行
const collapseAll = () => {
  if (menuTableRef.value) {
    // 收起所有行
    expandedRowKeys.value.forEach(key => {
      menuTableRef.value.toggleRowExpansion(findMenuById(key), false)
    })
    expandedRowKeys.value = []
  }
}

// 获取所有行的key
const getAllRowKeys = (items) => {
  let keys = []
  for (const item of items) {
    keys.push(item.id)
    if (item.children && item.children.length > 0) {
      keys = keys.concat(getAllRowKeys(item.children))
    }
  }
  return keys
}

// 处理搜索
const handleSearch = () => {
  console.log('搜索菜单:', searchQuery.value, '状态:', activeFilter.value)
  // filteredMenus计算属性会自动响应变化
}

// 重置表单
const resetForm = () => {
  if (menuFormRef.value) {
    menuFormRef.value.resetFields()
  }
  
  Object.assign(menuForm, {
    id: null,
    name: '',
    code: '',
    icon: '',
    path: '',
    component: '',
    order: 0,
    parent_id: parentMenu.value ? parentMenu.value.id : null,
    is_active: true
  })
  
  parentMenu.value = null
  formType.value = 'create'
}

// 处理创建菜单
const handleCreateMenu = (row) => {
  resetForm()
  formType.value = 'create'
  
  if (row) {
    // 创建子菜单
    parentMenu.value = row
    menuForm.parent_id = row.id
    
    // 根据父菜单预设子菜单的code前缀
    if (row.code) {
      menuForm.code = row.code + '_'
    }
  }
  
  dialogVisible.value = true
}

// 处理编辑菜单
const handleEditMenu = (row) => {
  resetForm()
  formType.value = 'edit'
  
  // 填充表单数据
  Object.assign(menuForm, {
    id: row.id,
    name: row.name,
    code: row.code,
    icon: row.icon || '',
    path: row.path || '',
    component: row.component || '',
    order: row.order || 0,
    parent_id: row.parent_id,
    is_active: row.is_active
  })
  
  dialogVisible.value = true
}

// 处理删除菜单
const handleDeleteMenu = (row) => {
  if (hasChildren(row)) {
    ElMessage.warning('该菜单包含子菜单，无法直接删除')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除菜单"${row.name}"吗？此操作不可恢复。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 模拟删除操作
    deleteMenu(row.id)
  }).catch(() => {
    // 取消操作
  })
}

// 从API获取菜单数据
const fetchMenus = async () => {
  loading.value = true
  
  try {
    const response = await menuApi.getMenuTree()
    const responseData = request.getResponseData(response)
    menus.value = responseData || []
    console.log('获取菜单数据成功:', menus.value)
    
    nextTick(() => {
      expandAll()
    })
  } catch (error) {
    console.error('获取菜单数据失败:', error)
    ElMessage.error('获取菜单数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 模拟删除菜单改为使用API
const deleteMenu = async (id) => {
  loading.value = true
  
  try {
    await menuApi.deleteMenu(id)
    
    // 刷新菜单数据
    await fetchMenus()
    
    ElMessage.success('菜单删除成功')
  } catch (error) {
    console.error('删除菜单失败:', error)
    ElMessage.error('删除菜单失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = () => {
  if (!menuFormRef.value) return
  
  menuFormRef.value.validate((valid) => {
    if (valid) {
      submitLoading.value = true
      
      // 检查菜单标识是否唯一
      const isDuplicate = checkDuplicateCode(menuForm.code, menuForm.id)
      if (isDuplicate) {
        ElMessage.error('菜单标识已存在，请更换一个唯一的标识')
        submitLoading.value = false
        return
      }
      
      // 根据表单类型执行创建或更新操作
      if (formType.value === 'create') {
        createMenu()
      } else {
        updateMenu()
      }
    }
  })
}

// 检查菜单标识是否重复
const checkDuplicateCode = (code, excludeId = null) => {
  const checkInTree = (items) => {
    for (const item of items) {
      if (item.code === code && item.id !== excludeId) {
        return true
      }
      
      if (item.children && item.children.length > 0) {
        if (checkInTree(item.children)) {
          return true
        }
      }
    }
    return false
  }
  
  return checkInTree(menus.value)
}

// 模拟创建菜单改为使用API
const createMenu = async () => {
  submitLoading.value = true
  
  try {
    const menuData = {
      name: menuForm.name,
      code: menuForm.code,
      icon: menuForm.icon,
      path: menuForm.path,
      component: menuForm.component,
      order: menuForm.order,
      is_active: menuForm.is_active,
      parent_id: menuForm.parent_id
    }
    
    const response = await menuApi.createMenu(menuData)
    const responseData = request.getResponseData(response)
    
    // 刷新菜单数据
    await fetchMenus()
    
    ElMessage.success('菜单创建成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('创建菜单失败:', error)
    ElMessage.error('创建菜单失败，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}

// 模拟更新菜单改为使用API
const updateMenu = async () => {
  submitLoading.value = true
  
  try {
    const menuData = {
      name: menuForm.name,
      code: menuForm.code,
      icon: menuForm.icon,
      path: menuForm.path,
      component: menuForm.component,
      order: menuForm.order,
      is_active: menuForm.is_active,
      parent_id: menuForm.parent_id
    }
    
    const response = await menuApi.updateMenu(menuForm.id, menuData)
    const responseData = request.getResponseData(response)
    
    // 刷新菜单数据
    await fetchMenus()
    
    ElMessage.success('菜单更新成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('更新菜单失败:', error)
    ElMessage.error('更新菜单失败，请稍后重试')
  } finally {
    submitLoading.value = false
  }
}

// 初始化
onMounted(() => {
  // 获取菜单数据
  fetchMenus()
})
</script>

<style scoped>
.menu-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.content-container {
  background-color: #fff;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-filter {
  width: 120px;
}

.menu-table {
  width: 100%;
}

.menu-name {
  font-weight: 500;
  margin-right: 8px;
}

.menu-code {
  font-size: 12px;
  color: #909399;
}

.status-label {
  margin-left: 8px;
  font-size: 14px;
  color: #606266;
}

.btn-primary {
  background-color: #0abab5;
  border-color: #0abab5;
}

.btn-primary:hover {
  background-color: #09a29d;
  border-color: #09a29d;
}

/* 适应小屏幕 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .left, .right {
    width: 100%;
  }
}
</style> 
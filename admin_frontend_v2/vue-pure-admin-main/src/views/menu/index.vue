<template>
  <div class="main-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" @click="openCreateDialog">创建菜单</el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="menus"
        style="width: 100%"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="path" label="路径" min-width="180" />
        <el-table-column prop="component" label="组件" min-width="180" />
        <el-table-column prop="redirect" label="重定向" min-width="180" />
        <el-table-column prop="meta.icon" label="图标" width="100">
          <template #default="{ row }">
            <el-icon v-if="row.meta && row.meta.icon">
              <component :is="row.meta.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm
              title="确定要删除此菜单吗？"
              @confirm="deleteMenuAction(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 菜单表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formType === 'create' ? '创建菜单' : '编辑菜单'"
      width="600px"
    >
      <el-form
        ref="menuFormRef"
        :model="menuForm"
        :rules="menuRules"
        label-width="100px"
      >
        <el-form-item label="上级菜单" prop="parent_id">
          <el-tree-select
            v-model="menuForm.parent_id"
            :data="menuOptions"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            placeholder="请选择上级菜单"
            clearable
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="menuForm.path" placeholder="请输入路径" />
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="menuForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item label="重定向" prop="redirect">
          <el-input v-model="menuForm.redirect" placeholder="请输入重定向路径" />
        </el-form-item>
        <el-form-item label="图标" prop="meta.icon">
          <el-input v-model="menuForm.meta.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="menuForm.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="menuForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '@/api/menu';

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const formType = ref('create');
const menus = ref([]);
const menuOptions = ref([]);
const menuFormRef = ref();

// 菜单表单
const menuForm = reactive({
  id: undefined,
  name: '',
  path: '',
  component: '',
  redirect: '',
  meta: {
    icon: '',
    roles: []
  },
  parent_id: null,
  sort: 0,
  status: 1
});

// 表单验证规则
const menuRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }]
};

// 初始化
onMounted(() => {
  fetchMenus();
});

// 展开所有节点
const expandAll = () => {
  // 默认展开所有节点的逻辑可以在这里实现
  console.log('展开所有节点');
};

// 从API获取菜单数据
const fetchMenus = async () => {
  loading.value = true;
  
  try {
    const response = await getMenuTree();
    if (response && response.success && response.data) {
      menus.value = response.data.list || [];
      menuOptions.value = [{ id: 0, name: '顶级菜单', children: menus.value }];
      console.log('获取菜单数据成功:', menus.value);
      
      nextTick(() => {
        expandAll();
      });
    } else {
      console.error('获取菜单数据失败:', response);
      ElMessage.error(response?.message || '获取菜单数据失败，请稍后重试');
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error);
    ElMessage.error('获取菜单数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 打开创建对话框
const openCreateDialog = () => {
  formType.value = 'create';
  resetForm();
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (row) => {
  formType.value = 'edit';
  resetForm();
  
  // 填充表单数据
  menuForm.id = row.id;
  menuForm.name = row.name;
  menuForm.path = row.path;
  menuForm.component = row.component;
  menuForm.redirect = row.redirect || '';
  menuForm.meta.icon = row.meta?.icon || '';
  menuForm.parent_id = row.parent_id;
  menuForm.sort = row.sort || 0;
  menuForm.status = row.status;
  
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  menuForm.id = undefined;
  menuForm.name = '';
  menuForm.path = '';
  menuForm.component = '';
  menuForm.redirect = '';
  menuForm.meta.icon = '';
  menuForm.parent_id = null;
  menuForm.sort = 0;
  menuForm.status = 1;
  
  nextTick(() => {
    menuFormRef.value?.resetFields();
  });
};

// 删除菜单
const deleteMenuAction = async (id: number) => {
  loading.value = true;
  
  try {
    const response = await deleteMenu(id);
    if (response && response.success) {
      // 刷新菜单数据
      await fetchMenus();
      ElMessage.success('菜单删除成功');
    } else {
      ElMessage.error(response?.message || '删除失败');
    }
  } catch (error) {
    console.error('删除菜单失败:', error);
    ElMessage.error('删除菜单失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 提交表单
const submitForm = () => {
  if (!menuFormRef.value) return;
  
  menuFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      
      try {
        // 准备提交的数据
        const menuData = {
          name: menuForm.name,
          path: menuForm.path,
          component: menuForm.component,
          redirect: menuForm.redirect,
          meta: {
            title: menuForm.name, // 使用name作为title
            icon: menuForm.meta.icon,
            roles: menuForm.meta.roles
          },
          parent_id: menuForm.parent_id,
          sort: menuForm.sort,
          status: menuForm.status
        };
        
        let response;
        if (formType.value === 'create') {
          response = await createMenu(menuData);
        } else {
          response = await updateMenu(menuForm.id!, menuData);
        }
        
        if (response && response.success) {
          // 刷新菜单数据
          await fetchMenus();
          
          ElMessage.success(formType.value === 'create' ? '菜单创建成功' : '菜单更新成功');
          dialogVisible.value = false;
        } else {
          ElMessage.error(response?.message || (formType.value === 'create' ? '创建失败' : '更新失败'));
        }
      } catch (error) {
        console.error(formType.value === 'create' ? '创建菜单失败:' : '更新菜单失败:', error);
        ElMessage.error(formType.value === 'create' ? '创建菜单失败，请稍后重试' : '更新菜单失败，请稍后重试');
      } finally {
        submitLoading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.main-container {
  padding: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 
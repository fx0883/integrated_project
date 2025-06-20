# 管理员用户菜单设置功能实现方案

## 1. 功能概述

管理员用户菜单设置功能允许租户管理员在管理员用户列表页面为本租户内的用户设置可访问的菜单，实现灵活的权限控制。通过该功能，租户管理员可以根据不同用户的职责和权限需求，自定义分配其可见的菜单项，从而实现精细化的访问控制。

### 1.1 主要功能点

- 在管理员用户列表页面添加"设置菜单"按钮，仅对租户管理员可见
- 点击按钮后弹出菜单设置对话框，以树形结构展示所有可配置的菜单项
- 支持多级菜单的层级显示和选择
- 提供全选/取消全选功能
- 实时预览菜单配置效果
- 保存菜单配置后即时生效

### 1.2 用户使用流程

1. 租户管理员登录系统
2. 进入管理员用户列表页面
3. 找到需要设置菜单的用户，点击对应行的"设置菜单"按钮
4. 在弹出的菜单设置对话框中，选择或取消选择菜单项
5. 可选择点击"预览"按钮查看菜单效果
6. 点击"保存"按钮确认设置
7. 系统保存菜单配置并显示成功提示

### 1.3 开发目标

- 提供直观易用的菜单配置界面
- 确保租户数据隔离，只能管理本租户内的用户菜单
- 遵循最小权限原则，根据用户角色限制菜单设置权限
- 保证界面操作流畅，提供即时反馈
- 实现与现有管理界面的风格一致性

## 2. 技术方案设计

### 2.1 总体架构

```
+------------------+     +-------------------+     +------------------+
| 管理员列表页面   | --> | 菜单设置对话框    | --> | 预览对话框       |
| AdminUserList    |     | MenuSettingDialog |     | MenuPreviewDialog|
+------------------+     +-------------------+     +------------------+
         |                        |                         |
         v                        v                         v
+----------------------------------------------------------+
|                        状态管理层                         |
|                   Vuex/Pinia Store                        |
+----------------------------------------------------------+
         |                        |                         |
         v                        v                         v
+------------------+     +-------------------+     +------------------+
| 获取用户菜单API  |     | 获取可用菜单API   |     | 保存用户菜单API  |
+------------------+     +-------------------+     +------------------+
```

### 2.2 主要组件设计

#### 1. `MenuSettingButton` 组件

负责在用户列表中添加"设置菜单"按钮，并根据当前用户和目标用户的关系决定是否显示按钮。

```vue
<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/store/modules/user';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

const userStore = useUserStore();
const currentUser = computed(() => userStore);

// 判断是否可以管理目标用户的菜单
const canManageUserMenu = computed(() => {
  // 超级管理员可管理所有用户
  if (currentUser.value.is_super_admin) {
    return true;
  }
  
  // 租户管理员只能管理同一租户的非超级管理员用户
  if (currentUser.value.is_tenant_admin && 
      props.user.tenant === currentUser.value.tenant && 
      !props.user.is_super_admin) {
    return true;
  }
  
  return false;
});

const handleClick = () => {
  emit('click', props.user);
};
</script>

<template>
  <el-button 
    v-if="canManageUserMenu" 
    size="small" 
    type="success" 
    @click="handleClick"
  >
    {{ $t('menu.setUserMenu') }}
  </el-button>
</template>
```

#### 2. `MenuSettingDialog` 组件

核心组件，负责显示菜单选择界面，支持树形选择和操作。

```vue
<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { useMenuStore } from '@/store/modules/menu';
import { useUserStore } from '@/store/modules/user';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userId: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const { t } = useI18n();
const menuStore = useMenuStore();
const userStore = useUserStore();

// 状态变量
const loading = ref(false);
const menuTree = ref([]);
const checkedKeys = ref([]);
const defaultProps = reactive({
  children: 'children',
  label: 'title',
  disabled: 'is_disabled'
});

// 是否显示预览对话框
const previewVisible = ref(false);
// 预览菜单数据
const previewMenus = ref([]);

// 监听对话框可见性变化
watch(() => props.visible, async (val) => {
  if (val) {
    // 对话框显示，加载数据
    await loadData();
  }
});

// 加载菜单数据
const loadData = async () => {
  loading.value = true;
  try {
    // 并行发起两个请求
    const [menuTreeResponse, userMenusResponse] = await Promise.all([
      // 获取菜单树
      menuStore.fetchMenuTree({ is_active: true }),
      // 获取用户当前菜单配置
      menuStore.fetchUserMenus(props.userId)
    ]);
    
    // 处理菜单树数据
    menuTree.value = menuTreeResponse.data || [];
    
    // 处理用户菜单数据，设置选中状态
    checkedKeys.value = (userMenusResponse.data?.menus || [])
      .filter(menu => menu.is_active)
      .map(menu => menu.id);
    
  } catch (error) {
    console.error('加载菜单数据失败', error);
    ElMessage.error(t('menu.loadFailed'));
  } finally {
    loading.value = false;
  }
};

// 处理对话框关闭
const handleClose = () => {
  emit('update:visible', false);
  emit('cancel');
};

// 处理全选/取消全选
const handleCheckAll = (checked) => {
  if (checked) {
    // 全选，收集所有菜单ID
    const collectIds = (menus) => {
      let ids = [];
      for (const menu of menus) {
        ids.push(menu.id);
        if (menu.children && menu.children.length > 0) {
          ids = ids.concat(collectIds(menu.children));
        }
      }
      return ids;
    };
    checkedKeys.value = collectIds(menuTree.value);
  } else {
    // 取消全选
    checkedKeys.value = [];
  }
};

// 处理预览
const handlePreview = () => {
  // 根据选中的ID过滤菜单树
  const filterMenus = (menus, checkedIds) => {
    return menus
      .filter(menu => checkedIds.includes(menu.id))
      .map(menu => {
        const newMenu = { ...menu };
        if (menu.children && menu.children.length > 0) {
          newMenu.children = filterMenus(menu.children, checkedIds);
        }
        return newMenu;
      });
  };
  
  previewMenus.value = filterMenus(menuTree.value, checkedKeys.value);
  previewVisible.value = true;
};

// 关闭预览
const handleClosePreview = () => {
  previewVisible.value = false;
};

// 处理保存
const handleSave = async () => {
  loading.value = true;
  try {
    await menuStore.assignUserMenus(props.userId, {
      menu_ids: checkedKeys.value
    });
    
    ElMessage.success(t('menu.saveSuccess'));
    emit('update:visible', false);
    emit('confirm');
  } catch (error) {
    console.error('保存菜单失败', error);
    ElMessage.error(t('menu.saveFailed'));
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <el-dialog
    :title="t('menu.setUserMenu') + ': ' + username"
    :visible.sync="visible"
    width="680px"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="menu-setting-dialog">
      <div class="menu-setting-header">
        <el-checkbox 
          :indeterminate="checkedKeys.length > 0 && checkedKeys.length < getTotalMenuCount(menuTree)"
          :checked="checkedKeys.length === getTotalMenuCount(menuTree)"
          @change="handleCheckAll"
        >
          {{ t('menu.allMenus') }}
        </el-checkbox>
        <el-input
          v-model="searchKeyword"
          :placeholder="t('menu.searchMenus')"
          prefix-icon="el-icon-search"
          clearable
          style="width: 220px"
        />
      </div>
      
      <div class="menu-setting-content" v-loading="loading">
        <el-tree
          ref="menuTreeRef"
          :data="menuTree"
          :props="defaultProps"
          show-checkbox
          node-key="id"
          v-model:checked-keys="checkedKeys"
          default-expand-all
          :filter-node-method="filterNode"
        />
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handlePreview">{{ t('menu.preview') }}</el-button>
        <el-button @click="handleClose">{{ t('menu.cancel') }}</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">
          {{ t('menu.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
  
  <!-- 预览对话框 -->
  <el-dialog
    :title="t('menu.preview')"
    v-model="previewVisible"
    width="580px"
    append-to-body
    destroy-on-close
  >
    <div class="menu-preview-content">
      <el-tree
        :data="previewMenus"
        :props="defaultProps"
        default-expand-all
      />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClosePreview">{{ t('menu.return') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.menu-setting-dialog {
  height: 460px;
  display: flex;
  flex-direction: column;
}

.menu-setting-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.menu-setting-content {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 10px;
}

.menu-preview-content {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 10px;
}
</style>
```

### 2.3 API接口设计

我们需要设计和实现以下API接口来支持菜单设置功能：

#### 1. 获取可配置的菜单列表

```typescript
/**
 * 获取菜单树形结构
 */
export function getMenuTree(params: { is_active?: boolean } = {}) {
  return http.request<ApiResponse<MenuTree[]>>(
    "get",
    "/menus/tree/",
    { params }
  );
}
```

#### 2. 获取用户当前菜单配置

```typescript
/**
 * 获取用户当前菜单配置
 * @param userId 用户ID
 */
export function getUserMenus(userId: number) {
  return http.request<ApiResponse<{
    user_id: number;
    username: string;
    menus: Array<{
      id: number;
      name: string;
      code: string;
      is_active: boolean;
    }>
  }>>(
    "get",
    `/menus/admins/${userId}/menus/`
  );
}
```

#### 3. 为用户分配菜单

```typescript
/**
 * 为用户分配菜单
 * @param userId 用户ID
 * @param menuIds 菜单ID列表
 */
export function assignUserMenus(userId: number, data: { menu_ids: number[] }) {
  return http.request<ApiResponse<{
    assigned_menus: Array<{
      id: number;
      name: string;
    }>
  }>>(
    "post",
    `/menus/admins/${userId}/menus/`,
    { data }
  );
}
```

## 5. 权限控制

### 5.1 前端权限控制

在前端实现中，我们需要确保只有有权限的用户才能看到和使用菜单设置功能。主要的权限控制点如下：

1. 显示控制：只对特定用户显示"设置菜单"按钮
2. 操作控制：在进行菜单操作前验证用户权限
3. API访问控制：每次API调用都要携带认证信息，并由后端进行权限验证

具体实现如下：

```javascript
// 权限检查函数
function canManageUserMenu(currentUser, targetUser) {
  // 超级管理员可以管理所有用户
  if (currentUser.is_super_admin) {
    return true;
  }
  
  // 租户管理员只能管理同租户的非超级管理员用户
  if (currentUser.is_tenant_admin && 
      targetUser.tenant === currentUser.tenant && 
      !targetUser.is_super_admin) {
    return true;
  }
  
  return false;
}
```

### 5.2 后端权限控制

在后端，我们需要对菜单API接口进行权限控制，确保只有有权限的用户才能操作相应的菜单。基本权限检查逻辑如下：

```python
def get_queryset(self):
    """获取用户菜单关联"""
    user_id = self.kwargs.get('user_id')
    current_user = self.request.user
    
    # 超级管理员可以管理所有用户菜单
    if current_user.is_super_admin:
        return UserMenu.objects.filter(user_id=user_id, is_active=True)
        
    # 租户管理员只能管理其租户内的用户菜单
    if current_user.is_tenant_admin:
        # 检查目标用户是否在同一租户内
        try:
            target_user = User.objects.get(id=user_id)
            if (target_user.tenant and 
                target_user.tenant == current_user.tenant and 
                not target_user.is_super_admin):
                return UserMenu.objects.filter(user_id=user_id, is_active=True)
        except User.DoesNotExist:
            pass
    
    # 其他情况不允许访问
    return UserMenu.objects.none()
```

## 6. 测试方案

### 6.1 单元测试

针对菜单设置功能的单元测试应涵盖以下方面：

1. 权限控制函数测试
2. API接口函数测试
3. Store actions测试

示例测试用例：

```javascript
// 测试权限控制函数
describe('Menu Permission Tests', () => {
  test('Superadmin can manage any user menu', () => {
    const currentUser = { is_super_admin: true, tenant: 1 };
    const targetUser = { id: 2, tenant: 2 };
    expect(canManageUserMenu(currentUser, targetUser)).toBe(true);
  });
  
  test('Tenant admin can manage user in same tenant', () => {
    const currentUser = { is_super_admin: false, is_tenant_admin: true, tenant: 1 };
    const targetUser = { id: 2, tenant: 1, is_super_admin: false };
    expect(canManageUserMenu(currentUser, targetUser)).toBe(true);
  });
  
  test('Tenant admin cannot manage user in different tenant', () => {
    const currentUser = { is_super_admin: false, is_tenant_admin: true, tenant: 1 };
    const targetUser = { id: 2, tenant: 2, is_super_admin: false };
    expect(canManageUserMenu(currentUser, targetUser)).toBe(false);
  });
  
  test('Tenant admin cannot manage superadmin', () => {
    const currentUser = { is_super_admin: false, is_tenant_admin: true, tenant: 1 };
    const targetUser = { id: 2, tenant: 1, is_super_admin: true };
    expect(canManageUserMenu(currentUser, targetUser)).toBe(false);
  });
});
```

### 6.2 集成测试

集成测试应关注组件间的交互和数据流，重点测试以下场景：

1. 管理员列表中"设置菜单"按钮的显示逻辑
2. 点击"设置菜单"按钮打开菜单设置对话框
3. 菜单树形结构的加载和显示
4. 菜单选择操作和父子菜单联动
5. 菜单预览功能
6. 保存菜单配置

### 6.3 E2E测试

端到端测试应模拟真实用户操作，覆盖完整的用户流程：

1. 不同角色用户登录系统
2. 导航到管理员用户列表
3. 验证"设置菜单"按钮的可见性
4. 点击"设置菜单"按钮，打开设置对话框
5. 选择/取消选择菜单项
6. 预览菜单配置
7. 保存菜单配置
8. 验证保存结果

## 7. 部署与配置指南

### 7.1 前端配置

1. 将新组件放置在正确的目录：
   - `src/components/AdminUserManagement/MenuSettingDialog.vue`

2. 在国际化配置文件中添加新的翻译键值：

```yaml
# locales/zh-CN.yaml
menu:
  setUserMenu: 设置菜单
  preview: 预览
  return: 返回
  save: 保存
  cancel: 取消
  allMenus: 全部菜单
  searchMenus: 搜索菜单
  loadFailed: 加载菜单失败
  saveSuccess: 保存菜单成功
  saveFailed: 保存菜单失败
  settingSuccess: 菜单设置成功
```

3. 确保API路径配置正确，尤其是在不同环境下：

```typescript
// src/config/index.ts
export default {
  // ...其他配置
  
  // API基础路径配置
  baseApi: process.env.NODE_ENV === 'development' 
    ? '/api/v1' 
    : 'https://api.example.com/api/v1',
    
  // ...其他配置
};
```

### 7.2 后端配置

确保后端API接口已正确实现并满足前端需求：

1. 路由配置：确保菜单管理相关路由已注册
2. 权限配置：配置正确的权限检查中间件
3. CORS配置：确保API可以被前端正常访问

### 7.3 部署检查清单

在部署菜单设置功能前，请确保以下事项：

1. 前端组件和API接口已完成实现和测试
2. 国际化配置已更新，支持所有目标语言
3. 权限控制逻辑在前后端都已实现
4. 所有单元测试、集成测试和E2E测试已通过
5. API路径配置在各环境中正确设置
6. 错误处理逻辑完备，提供良好的用户体验
7. 性能优化措施已实施，尤其是对大量菜单数据的处理

### 7.4 常见问题与解决方案

1. 菜单数据加载失败
   - 检查API路径配置
   - 验证用户认证状态和权限
   - 查看网络请求日志

2. 菜单设置保存失败
   - 确认请求格式和参数正确
   - 检查后端验证逻辑
   - 查看服务器错误日志

3. 菜单树显示不完整
   - 确认树形数据结构正确
   - 检查父子关系映射
   - 调整树组件配置参数

4. 权限判断错误
   - 复查权限检查逻辑
   - 确保用户角色和租户信息正确
   - 验证后端权限中间件配置

5. 菜单预览与实际不符
   - 检查菜单过滤逻辑
   - 验证树形结构构建过程
   - 对比原始数据和过滤后的数据

## 8. 结论

管理员用户菜单设置功能为租户管理员提供了精细化的权限控制能力，使其能够根据不同用户的职责和需求，自定义分配菜单访问权限。通过本文档提供的实现方案，前端开发人员可以高效地集成这一功能，并确保功能的安全性、可用性和性能。

实施过程中应特别关注权限控制、数据验证和用户体验，确保功能满足业务需求的同时，提供流畅的操作体验。 
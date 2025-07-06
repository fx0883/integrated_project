# 会员管理页面设计文档

本文档详细描述会员管理功能的各个页面的UI布局和功能实现细节。

## 1. 会员列表页 (MemberIndex)

### 1.1 页面路径

`/member/index`

### 1.2 页面功能

- 展示会员列表，支持分页
- 提供搜索和筛选功能
- 支持创建、编辑、查看详情和删除会员
- 显示会员基本信息和状态

### 1.3 UI 布局

```
+-----------------------------------------------------------------------+
| 会员管理                                                  + 创建会员   |
+-----------------------------------------------------------------------+
| 搜索: [____________] 状态: [____▼]  [搜索] [重置]        |
+-----------------------------------------------------------------------+
| [ ] 用户名      | 邮箱        | 电话      | 状态    | 租户     | 操作  |
|----------------------------------------------------------------------+
| [ ] user1      | u1@ex.com  | 1381111.. | 活跃    | 租户1    | ...   |
| [ ] user2      | u2@ex.com  | 1382222.. | 非活跃  | 租户2    | ...   |
| ...                                                                   |
+-----------------------------------------------------------------------+
|                          分页控件                                     |
+-----------------------------------------------------------------------+
```

### 1.4 组件结构

```vue
<template>
  <div class="member-index-container">
    <!-- 页面标题和创建按钮 -->
    <div class="page-header">
      <h2>{{ t("member.memberManagement") }}</h2>
      <el-button
        v-if="hasManagePermission"
        type="primary"
        @click="handleCreate"
      >
        {{ t("member.createMember") }}
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="t('common.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('member.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item :label="t('member.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('common.all')"
            clearable
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('member.tenant')" v-if="isSuperAdmin">
          <el-select
            v-model="searchForm.tenant_id"
            :placeholder="t('common.all')"
            clearable
          >
            <el-option
              v-for="tenant in tenants"
              :key="tenant.id"
              :label="tenant.name"
              :value="tenant.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            {{ t("common.search") }}
          </el-button>
          <el-button @click="handleResetSearch">
            {{ t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 会员列表表格 -->
    <el-table
      v-loading="tableLoading"
      :data="memberList"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" :label="t('member.username')" min-width="120" />
      <el-table-column prop="email" :label="t('member.email')" min-width="180" />
      <el-table-column prop="phone" :label="t('member.phone')" min-width="120" />
      <el-table-column :label="t('member.status')" width="100">
        <template #default="scope">
          <MemberStatusTag :status="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column prop="tenant_name" :label="t('member.tenant')" min-width="120" />
      <el-table-column :label="t('common.operations')" width="200" fixed="right">
        <template #default="scope">
          <el-button
            size="small"
            @click="handleView(scope.row)"
          >
            {{ t("common.view") }}
          </el-button>
          <el-button
            v-if="hasManagePermission"
            size="small"
            type="primary"
            @click="handleEdit(scope.row)"
          >
            {{ t("common.edit") }}
          </el-button>
          <el-button
            v-if="hasManagePermission"
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
          >
            {{ t("common.delete") }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />
  </div>
</template>
```

### 1.5 功能实现

1. **数据加载**
   - 页面加载时从 Vuex Store 获取会员列表
   - 支持分页、搜索和筛选

2. **搜索和筛选**
   - 根据用户名、邮箱、电话等关键词搜索
   - 根据状态和租户筛选
   - 重置搜索条件

3. **操作功能**
   - 查看会员详情：跳转到详情页
   - 编辑会员：跳转到编辑页
   - 删除会员：显示确认对话框，确认后调用删除API
   - 创建会员：跳转到创建页

4. **权限控制**
   - 根据用户角色控制编辑、删除和创建按钮的显示

## 2. 会员创建页 (MemberCreate)

### 2.1 页面路径

`/member/create`

### 2.2 页面功能

- 提供表单创建新会员
- 表单验证
- 提交成功后跳转到列表页或详情页

### 2.3 UI 布局

```
+-----------------------------------------------------------------------+
| 创建会员                                                               |
+-----------------------------------------------------------------------+
|                                                                       |
|  +-------------------------------------------------------------------+  |
|  |                         会员表单组件                               |  |
|  +-------------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 2.4 组件结构

```vue
<template>
  <div class="member-create-container">
    <div class="page-header">
      <h2>{{ t("member.createMember") }}</h2>
    </div>

    <div class="form-container">
      <MemberForm
        mode="create"
        :loading="loading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
```

### 2.5 功能实现

1. **表单处理**
   - 使用 MemberForm 组件
   - 设置模式为 "create"
   - 处理表单提交和取消事件

2. **数据提交**
   - 表单提交时调用 Vuex Store 的 createMember action
   - 提交成功后显示成功消息并跳转到列表页
   - 提交失败时显示错误消息

3. **取消操作**
   - 返回会员列表页

## 3. 会员编辑页 (MemberEdit)

### 3.1 页面路径

`/member/edit/:id`

### 3.2 页面功能

- 加载现有会员信息
- 提供表单编辑会员信息
- 表单验证
- 提交成功后跳转到详情页

### 3.3 UI 布局

```
+-----------------------------------------------------------------------+
| 编辑会员                                                               |
+-----------------------------------------------------------------------+
|                                                                       |
|  +-------------------------------------------------------------------+  |
|  |                         会员表单组件                               |  |
|  +-------------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 3.4 组件结构

```vue
<template>
  <div class="member-edit-container">
    <div class="page-header">
      <h2>{{ t("member.editMember") }}</h2>
    </div>

    <div v-loading="detailLoading" class="form-container">
      <MemberForm
        v-if="currentMember"
        mode="edit"
        :member="currentMember"
        :loading="updateLoading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
```

### 3.5 功能实现

1. **数据加载**
   - 根据路由参数获取会员ID
   - 调用 Vuex Store 的 fetchMemberDetail action 加载会员信息
   - 加载失败时跳转回列表页

2. **表单处理**
   - 使用 MemberForm 组件
   - 设置模式为 "edit"
   - 传入当前会员数据
   - 处理表单提交和取消事件

3. **数据提交**
   - 表单提交时调用 Vuex Store 的 updateMember action
   - 提交成功后显示成功消息并跳转到详情页
   - 提交失败时显示错误消息

4. **取消操作**
   - 返回会员详情页或列表页

## 4. 会员详情页 (MemberDetail)

### 4.1 页面路径

`/member/detail/:id`

### 4.2 页面功能

- 显示会员详细信息
- 管理会员与客户的关系
- 管理会员的子账号
- 上传头像
- 重置密码

### 4.3 UI 布局

```
+-----------------------------------------------------------------------+
| 会员详情                                         [编辑] [删除] [返回]  |
+-----------------------------------------------------------------------+
|                                                                       |
| +----------------------------+  +----------------------------------+   |
| |                            |  |                                  |   |
| |       基本信息             |  |           头像                   |   |
| |                            |  |                                  |   |
| +----------------------------+  +----------------------------------+   |
|                                                                       |
| +-------------------------------------------------------------------+ |
| | [基本信息] [客户关系] [子账号]                                    | |
| +-------------------------------------------------------------------+ |
| |                                                                   | |
| |                      标签页内容区域                               | |
| |                                                                   | |
| +-------------------------------------------------------------------+ |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 4.4 组件结构

```vue
<template>
  <div class="member-detail-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>{{ t("member.memberDetail") }}</h2>
      <div class="header-actions">
        <el-button
          v-if="hasManagePermission"
          type="primary"
          @click="handleEdit"
        >
          {{ t("common.edit") }}
        </el-button>
        <el-button
          v-if="hasManagePermission"
          type="danger"
          @click="handleDelete"
        >
          {{ t("common.delete") }}
        </el-button>
        <el-button @click="handleBack">
          {{ t("common.back") }}
        </el-button>
      </div>
    </div>

    <!-- 会员信息和头像 -->
    <div v-loading="detailLoading" class="member-info-container">
      <div class="member-basic-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('member.username')">
            {{ currentMember?.username }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('member.email')">
            {{ currentMember?.email }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('member.phone')">
            {{ currentMember?.phone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('member.nickName')">
            {{ currentMember?.nick_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('member.fullName')">
            {{ fullName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('member.status')">
            <MemberStatusTag :status="currentMember?.status || ''" />
          </el-descriptions-item>
          <el-descriptions-item :label="t('member.tenant')">
            {{ currentMember?.tenant_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('member.dateJoined')">
            {{ formatDate(currentMember?.date_joined) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="member-avatar-container">
        <div class="avatar-wrapper">
          <img
            v-if="currentMember?.avatar"
            :src="currentMember.avatar"
            alt="Avatar"
            class="member-avatar"
          />
          <el-avatar v-else :size="100" :icon="UserFilled" />
        </div>
        <div v-if="canManageAvatar" class="avatar-actions">
          <AvatarUpload
            :avatar="currentMember?.avatar"
            :loading="avatarLoading"
            @upload="handleAvatarUpload"
          />
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane :label="t('member.basicInfo')" name="basic">
        <div class="tab-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="t('member.isSubAccount')">
              {{ currentMember?.is_sub_account ? t('common.yes') : t('common.no') }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentMember?.is_sub_account" :label="t('member.parent')">
              {{ currentMember?.parent_username || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('member.customerCount')">
              {{ currentMember?.customer_count || 0 }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('member.subAccountCount')">
              {{ currentMember?.sub_account_count || 0 }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 密码重置按钮 -->
          <div v-if="hasManagePermission" class="password-reset-section">
            <el-divider>{{ t('member.passwordManagement') }}</el-divider>
            <el-button
              type="warning"
              @click="handleResetPassword"
            >
              {{ t('member.resetPassword') }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('member.customerRelations')" name="customers" lazy>
        <div class="tab-content" v-loading="relationsLoading">
          <!-- 客户关系列表 -->
          <div class="relations-header">
            <h3>{{ t('member.customerRelationsList') }}</h3>
            <el-button
              v-if="hasManagePermission"
              type="primary"
              size="small"
              @click="handleAddRelation"
            >
              {{ t('member.addCustomerRelation') }}
            </el-button>
          </div>

          <el-table
            :data="customerRelations"
            border
            style="width: 100%"
          >
            <el-table-column prop="customer_name" :label="t('member.relation.customerName')" min-width="150" />
            <el-table-column prop="role" :label="t('member.relation.role')" min-width="120" />
            <el-table-column :label="t('member.relation.isPrimary')" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.is_primary ? 'success' : ''">
                  {{ scope.row.is_primary ? t('common.yes') : t('common.no') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.operations')" width="250">
              <template #default="scope">
                <el-button
                  v-if="hasManagePermission && !scope.row.is_primary"
                  size="small"
                  type="success"
                  @click="handleSetPrimary(scope.row)"
                >
                  {{ t('member.relation.setPrimary') }}
                </el-button>
                <el-button
                  v-if="hasManagePermission"
                  size="small"
                  type="primary"
                  @click="handleEditRelation(scope.row)"
                >
                  {{ t('common.edit') }}
                </el-button>
                <el-button
                  v-if="hasManagePermission"
                  size="small"
                  type="danger"
                  @click="handleDeleteRelation(scope.row)"
                >
                  {{ t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('member.subAccounts')" name="subAccounts" lazy>
        <div class="tab-content" v-loading="subAccountsLoading">
          <!-- 子账号列表 -->
          <div class="sub-accounts-header">
            <h3>{{ t('member.subAccountsList') }}</h3>
            <el-button
              v-if="canManageSubAccounts"
              type="primary"
              size="small"
              @click="handleAddSubAccount"
            >
              {{ t('member.addSubAccount') }}
            </el-button>
          </div>

          <el-table
            :data="subAccounts"
            border
            style="width: 100%"
          >
            <el-table-column prop="username" :label="t('member.username')" min-width="120" />
            <el-table-column prop="email" :label="t('member.email')" min-width="180" />
            <el-table-column prop="nick_name" :label="t('member.nickName')" min-width="120" />
            <el-table-column :label="t('member.status')" width="100">
              <template #default="scope">
                <MemberStatusTag :status="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column :label="t('common.operations')" width="200">
              <template #default="scope">
                <el-button
                  v-if="canManageSubAccounts"
                  size="small"
                  type="primary"
                  @click="handleEditSubAccount(scope.row)"
                >
                  {{ t('common.edit') }}
                </el-button>
                <el-button
                  v-if="canManageSubAccounts"
                  size="small"
                  type="danger"
                  @click="handleDeleteSubAccount(scope.row)"
                >
                  {{ t('common.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      :loading="confirmDialog.loading"
      @confirm="handleConfirmDialogConfirm"
      @cancel="handleConfirmDialogCancel"
    />

    <!-- 客户关系表单对话框 -->
    <el-dialog
      v-model="relationDialog.visible"
      :title="relationDialog.mode === 'create' ? t('member.addCustomerRelation') : t('member.editCustomerRelation')"
      width="50%"
    >
      <CustomerRelationForm
        v-if="relationDialog.visible"
        :mode="relationDialog.mode"
        :relation="relationDialog.currentRelation"
        :member-id="memberId"
        :loading="relationDialog.loading"
        @submit="handleRelationSubmit"
        @cancel="relationDialog.visible = false"
      />
    </el-dialog>

    <!-- 子账号表单对话框 -->
    <el-dialog
      v-model="subAccountDialog.visible"
      :title="subAccountDialog.mode === 'create' ? t('member.addSubAccount') : t('member.editSubAccount')"
      width="50%"
    >
      <SubAccountForm
        v-if="subAccountDialog.visible"
        :mode="subAccountDialog.mode"
        :sub-account="subAccountDialog.currentSubAccount"
        :parent-id="memberId"
        :loading="subAccountDialog.loading"
        @submit="handleSubAccountSubmit"
        @cancel="subAccountDialog.visible = false"
      />
    </el-dialog>
  </div>
</template>
```

### 4.5 功能实现

1. **数据加载**
   - 根据路由参数获取会员ID
   - 调用 Vuex Store 的 fetchMemberDetail action 加载会员信息
   - 根据选择的标签页加载客户关系和子账号数据
   - 加载失败时跳转回列表页

2. **基本信息标签页**
   - 显示会员的详细信息
   - 提供密码重置功能（仅管理员可见）

3. **客户关系标签页**
   - 显示会员关联的客户列表
   - 支持添加、编辑、删除客户关系
   - 支持设置主要客户关系

4. **子账号标签页**
   - 显示会员的子账号列表
   - 支持创建、编辑、删除子账号

5. **头像管理**
   - 显示当前头像
   - 支持上传新头像

6. **权限控制**
   - 根据用户角色控制编辑、删除、重置密码等功能的可见性
   - 只有会员本人或管理员可以管理子账号
   - 只有管理员可以管理客户关系

## 5. 共享样式和布局

为了保持页面风格的一致性，所有会员管理页面共享以下样式和布局：

```scss
// 页面容器样式
.member-index-container,
.member-create-container,
.member-edit-container,
.member-detail-container {
  padding: 20px;
}

// 页面标题栏样式
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }
}

// 搜索栏样式
.search-bar {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

// 表单容器样式
.form-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

// 分页容器样式
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

// 会员详情页特有样式
.member-info-container {
  display: flex;
  margin-bottom: 20px;
  
  .member-basic-info {
    flex: 1;
    margin-right: 20px;
  }
  
  .member-avatar-container {
    width: 200px;
    text-align: center;
    
    .avatar-wrapper {
      margin-bottom: 10px;
    }
    
    .member-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
    }
  }
}

// 标签页内容样式
.detail-tabs {
  .tab-content {
    padding: 20px 0;
  }
}

// 关系和子账号列表头部样式
.relations-header,
.sub-accounts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }
}

// 密码重置区域样式
.password-reset-section {
  margin-top: 20px;
  text-align: center;
}
```

## 6. 响应式设计

所有页面都应适配不同屏幕尺寸，特别是：

1. **大屏幕**
   - 充分利用空间，表格可以显示更多列
   - 表单元素可以并排显示

2. **中等屏幕**
   - 会员详情页的基本信息和头像可能需要调整为垂直布局
   - 表格可能需要水平滚动

3. **小屏幕**
   - 搜索表单元素垂直排列
   - 表格可能需要适配移动视图或使用卡片式布局

## 7. 国际化

所有页面文本都使用 i18n 进行国际化处理，支持中英文切换：

```typescript
// 示例
const { t } = useI18n();

// 使用
t("member.memberManagement")
```

## 8. 页面间导航

1. **列表页 → 创建页**：点击"创建会员"按钮
2. **列表页 → 详情页**：点击"查看"按钮
3. **列表页 → 编辑页**：点击"编辑"按钮
4. **详情页 → 编辑页**：点击"编辑"按钮
5. **创建页 → 列表页**：提交成功后自动跳转或点击"取消"按钮
6. **编辑页 → 详情页**：提交成功后自动跳转或点击"取消"按钮
7. **详情页 → 列表页**：点击"返回"按钮或删除会员后自动跳转 
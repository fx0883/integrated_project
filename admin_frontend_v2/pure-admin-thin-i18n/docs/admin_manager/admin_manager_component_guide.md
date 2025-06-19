# 管理员用户管理模块 - 组件开发指南

本文档提供管理员用户管理模块的组件开发指南，包括组件结构、实现方式和最佳实践。

## 1. 组件概述

管理员用户管理模块主要包含以下组件：

- **页面组件**：完整的页面视图
- **共享组件**：可在多个页面中复用的组件
- **辅助组件**：提供特定功能的小型组件

## 2. 组件结构

### 2.1 页面组件

```
src/views/admin-user/
├── index.vue            # 管理员列表页面
├── detail.vue           # 管理员详情页面
├── create.vue           # 创建管理员页面
└── edit.vue             # 编辑管理员页面
```

### 2.2 共享组件

```
src/components/AdminUserManagement/
├── AdminUserForm.vue    # 管理员表单组件
├── AdminUserTable.vue   # 管理员表格组件
├── AvatarUpload.vue     # 头像上传组件
└── ConfirmDialog.vue    # 确认对话框组件
```

## 3. 关键组件实现指南

### 3.1 AdminUserTable 组件

管理员用户表格组件，用于展示管理员列表并提供操作按钮。

**主要功能**：
- 展示管理员列表数据
- 提供行操作按钮（查看、编辑、删除等）
- 支持分页、排序和筛选
- 支持多选和批量操作

**实现要点**：
- 使用 Element Plus 的 `el-table` 组件
- 支持数据加载状态显示
- 支持表格列自定义
- 支持权限控制，根据用户权限显示/隐藏操作按钮

```vue
<template>
  <div class="admin-user-table">
    <el-table
      v-loading="loading"
      :data="adminUsers"
      border
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" :label="t('adminUser.username')" />
      <el-table-column prop="email" :label="t('adminUser.email')" />
      <el-table-column :label="t('adminUser.roles')">
        <template #default="scope">
          <el-tag
            :type="scope.row.is_super_admin ? 'danger' : 'primary'"
          >
            {{ scope.row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- 更多列... -->
      <el-table-column :label="t('adminUser.actions')" width="230" fixed="right">
        <template #default="scope">
          <!-- 操作按钮... -->
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>
```

### 3.2 AdminUserForm 组件

管理员用户表单组件，用于创建和编辑管理员用户。

**主要功能**：
- 提供创建/编辑管理员的表单
- 支持表单验证
- 支持不同操作模式（创建/编辑）

**实现要点**：
- 使用 Element Plus 的 `el-form` 组件
- 实现表单验证规则
- 根据操作模式动态调整表单字段
- 支持表单提交和取消操作

```vue
<template>
  <div class="admin-user-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      status-icon
    >
      <!-- 基本信息部分 -->
      <h3>{{ t('adminUser.basicInfo') }}</h3>
      <el-form-item :label="t('adminUser.username')" prop="username">
        <el-input
          v-model="formData.username"
          :disabled="isEdit"
        />
      </el-form-item>
      <!-- 更多表单项... -->
      
      <!-- 操作按钮 -->
      <el-form-item>
        <el-button @click="cancel">{{ t('adminUser.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ t('adminUser.save') }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
```

### 3.3 AvatarUpload 组件

头像上传组件，用于上传和预览管理员头像。

**主要功能**：
- 支持图片选择和拖放上传
- 支持图片预览
- 支持图片裁剪

**实现要点**：
- 使用 Element Plus 的 `el-upload` 组件
- 集成图片裁剪功能
- 显示上传进度
- 处理上传错误情况

```vue
<template>
  <div class="avatar-upload">
    <el-upload
      :action="uploadAction"
      :show-file-list="false"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      :http-request="customUpload"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" />
      <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
    </el-upload>
  </div>
</template>
```

## 4. 页面组件实现指南

### 4.1 管理员列表页面

**文件**：`src/views/admin-user/index.vue`

**主要功能**：
- 展示管理员用户列表
- 提供搜索和筛选功能
- 支持创建、编辑、删除管理员等操作

**实现要点**：
- 使用 Pinia store 管理状态和 API 调用
- 集成 AdminUserTable 组件
- 实现搜索和筛选逻辑
- 实现权限控制

### 4.2 管理员详情页面

**文件**：`src/views/admin-user/detail.vue`

**主要功能**：
- 展示管理员详细信息
- 提供编辑、删除、授予/撤销权限等操作

**实现要点**：
- 获取并展示管理员详情
- 根据用户权限显示/隐藏操作按钮
- 实现各种操作的确认对话框

### 4.3 创建管理员页面

**文件**：`src/views/admin-user/create.vue`

**主要功能**：
- 提供创建管理员的表单界面

**实现要点**：
- 集成 AdminUserForm 组件
- 设置表单初始值
- 处理表单提交逻辑

### 4.4 编辑管理员页面

**文件**：`src/views/admin-user/edit.vue`

**主要功能**：
- 提供编辑管理员的表单界面

**实现要点**：
- 集成 AdminUserForm 组件
- 获取并填充管理员现有信息
- 处理表单提交逻辑

## 5. 组件开发最佳实践

### 5.1 组件通信

- **Props 下行通信**：父组件向子组件传递数据
- **Events 上行通信**：子组件向父组件发送事件
- **Provide/Inject**：跨多级组件传递数据
- **Pinia Store**：全局状态管理

### 5.2 响应式开发

- 使用 `ref` 和 `reactive` 创建响应式数据
- 使用 `computed` 派生计算属性
- 使用 `watch` 和 `watchEffect` 监听数据变化

### 5.3 性能优化

- 合理使用 `v-if` 和 `v-show`
- 为列表项添加唯一的 `key`
- 使用 `computed` 缓存计算结果
- 组件按需加载和懒加载

### 5.4 代码组织

- 按功能划分组件
- 使用 `<script setup>` 简化组件逻辑
- 将复杂逻辑提取到 Composition API 函数
- 使用 TypeScript 类型定义

## 6. 测试和质量保证

- **单元测试**：测试组件逻辑
- **组件测试**：测试组件渲染和交互
- **端到端测试**：测试完整流程
- **代码审查**：确保代码质量和一致性

## 7. 辅助工具

- **Vue DevTools**：调试 Vue 组件
- **Element Plus DevTools**：调试 Element Plus 组件
- **Chrome DevTools**：调试网络请求和性能
- **TypeScript**：类型检查和智能提示 
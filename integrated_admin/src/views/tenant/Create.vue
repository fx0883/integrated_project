<template>
  <div class="create-tenant-container">
    <div class="page-header">
      <h1 class="page-title">创建租户</h1>
      <div class="page-actions">
        <el-button @click="goBack" class="btn-secondary">
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>
    
    <div class="content-container" v-loading="loading">
      <!-- 基本信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><OfficeBuilding /></el-icon>
            <span>基本信息</span>
          </div>
        </template>
        
        <el-form
          ref="tenantFormRef"
          :model="tenantForm"
          :rules="rules"
          label-width="120px"
          class="tenant-form"
        >
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="租户名称" prop="name">
                <el-input v-model="tenantForm.name" placeholder="请输入租户名称" />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="租户状态" prop="status">
                <el-select v-model="tenantForm.status" placeholder="请选择状态" style="width: 100%">
                  <el-option label="激活" value="active" />
                  <el-option label="暂停" value="suspended" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          
          <el-form-item label="描述" prop="description">
            <el-input 
              v-model="tenantForm.description" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入租户描述" 
            />
          </el-form-item>
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="联系人" prop="contact_name">
                <el-input v-model="tenantForm.contact_name" placeholder="请输入联系人姓名" />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="联系电话" prop="contact_phone">
                <el-input v-model="tenantForm.contact_phone" placeholder="请输入联系电话" />
              </el-form-item>
            </div>
          </div>
          
          <el-form-item label="联系邮箱" prop="contact_email">
            <el-input v-model="tenantForm.contact_email" placeholder="请输入联系邮箱" />
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 配置信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><Setting /></el-icon>
            <span>租户配额</span>
          </div>
        </template>
        
        <div class="config-option">
          <div class="config-content">
            <div class="config-title">用户数量限制</div>
            <div class="config-desc">租户可创建的最大用户数量</div>
          </div>
          <el-input-number 
            v-model="tenantForm.max_users" 
            :min="5" 
            :max="1000" 
            :step="5"
            controls-position="right"
            class="config-input"
          />
        </div>
        
        <div class="config-option">
          <div class="config-content">
            <div class="config-title">存储空间限制(MB)</div>
            <div class="config-desc">租户可使用的最大存储空间</div>
          </div>
          <el-input-number 
            v-model="tenantForm.max_storage" 
            :min="100" 
            :max="102400" 
            :step="100"
            controls-position="right"
            class="config-input"
          />
        </div>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button type="primary" @click="submitForm" :loading="submitLoading" class="btn-primary">创建租户</el-button>
        <el-button @click="resetForm" class="btn-reset">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Setting, Back } from '@element-plus/icons-vue'
import { tenantApi } from '../../api'

// 路由
const router = useRouter()

// 表单引用
const tenantFormRef = ref(null)

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)

// 全局样式变量
const variables = {
  primaryColor: '#0abab5',
  secondaryColor: '#ff6600',
  borderColor: '#E8ECF4'
}

// 表单数据
const tenantForm = reactive({
  name: '',
  description: '',
  status: 'active',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  max_users: 50,
  max_storage: 10240
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择租户状态', trigger: 'change' }
  ],
  contact_name: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' }
  ],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  contact_email: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 提交表单
const submitForm = async () => {
  try {
    await tenantFormRef.value.validate()
    
    submitLoading.value = true
    console.log('提交租户表单', tenantForm)
    
    // 准备API所需数据
    const tenantData = {
      name: tenantForm.name,
      description: tenantForm.description,
      status: tenantForm.status,
      contact_name: tenantForm.contact_name,
      contact_phone: tenantForm.contact_phone,
      contact_email: tenantForm.contact_email
    }
    
    // 调用API创建租户
    try {
      const response = await tenantApi.createTenant(tenantData)
      console.log('租户创建成功:', response)
      
      // 如果成功创建租户，设置租户配额
      if (response && response.id) {
        const quotaData = {
          max_users: tenantForm.max_users,
          max_storage: tenantForm.max_storage
        }
        
        await tenantApi.updateTenantQuota(response.id, quotaData)
        console.log('租户配额设置成功')
      }
      
      submitLoading.value = false
      
      ElMessage({
        type: 'success',
        message: '租户创建成功'
      })
      
      // 创建成功后返回列表页
      router.push('/tenants')
    } catch (error) {
      console.error('创建租户失败:', error)
      submitLoading.value = false
      ElMessage.error('创建租户失败: ' + (error.message || '未知错误'))
    }
  } catch (error) {
    console.error('表单验证失败:', error)
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  tenantFormRef.value.resetFields()
}

// 返回列表页
const goBack = () => {
  router.push('/tenants')
}
</script>

<style scoped>
.create-tenant-container {
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-row {
  display: flex;
  margin: 0 -10px;
}

.form-col {
  flex: 1;
  padding: 0 10px;
}

.tenant-form {
  padding: 10px 0;
}

.config-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.config-option:last-child {
  border-bottom: none;
}

.config-content {
  flex: 1;
}

.config-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.config-desc {
  font-size: 13px;
  color: #999;
}

.config-input {
  width: 160px;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  padding: 10px 0;
}

.btn-primary {
  background-color: #0abab5;
  border-color: #0abab5;
}

.btn-primary:hover {
  background-color: #09a29e;
  border-color: #09a29e;
}

.btn-secondary {
  background-color: #fff;
  color: #333;
  border-color: #dcdfe6;
}

.btn-reset {
  color: #606266;
  border-color: #dcdfe6;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-label {
  font-size: 14px;
  color: #606266;
}
</style>
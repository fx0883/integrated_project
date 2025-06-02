<template>
  <div class="tenant-edit-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ isCreate ? '创建租户' : '编辑租户' }}</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-loading="loading"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="租户名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入租户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="激活" value="active" />
                <el-option label="暂停" value="suspended" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入租户描述"
            :rows="3"
          />
        </el-form-item>
        
        <el-divider content-position="left">联系人信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_name">
              <el-input v-model="form.contact_name" placeholder="请输入联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="联系邮箱" prop="contact_email">
          <el-input v-model="form.contact_email" placeholder="请输入联系邮箱" />
        </el-form-item>
        
        <el-divider content-position="left">配额信息</el-divider>
        
        <div v-if="!quotaLoading">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="最大用户数" prop="max_users">
                <el-input-number v-model="quotaForm.max_users" :min="5" :max="1000" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大存储(MB)" prop="max_storage">
                <el-input-number v-model="quotaForm.max_storage" :min="100" :max="102400" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row v-if="quotaUsage">
            <el-col :span="12">
              <el-form-item label="当前用户数">
                <el-tag size="medium">{{ quotaUsage.current_users || 0 }}</el-tag>
                <span class="usage-percent ml-10">
                  ({{ quotaUsage.users_usage_percent || 0 }}%)
                </span>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="当前存储(MB)">
                <el-tag size="medium">{{ quotaUsage.current_storage || 0 }}</el-tag>
                <span class="usage-percent ml-10">
                  ({{ quotaUsage.storage_usage_percent || 0 }}%)
                </span>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <div v-else class="quota-loading-placeholder">
          <el-skeleton :rows="2" animated />
        </div>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">{{ isCreate ? '创建' : '保存' }}</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tenantApi } from '../../api'
import { ElMessage } from 'element-plus'
import { request } from '../../utils/request'

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.id)
const isCreate = computed(() => !tenantId.value || tenantId.value === 'create')

// 表单引用
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

// 配额相关
const quotaLoading = ref(false)
const quotaUsage = ref(null)

// 表单数据
const form = reactive({
  name: '',
  description: '',
  status: 'active',
  contact_name: '',
  contact_phone: '',
  contact_email: ''
})

// 配额表单数据
const quotaForm = reactive({
  max_users: 100,
  max_storage: 10240
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符之间', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  contact_name: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' }
  ],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
  contact_email: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

// 获取租户详情
const getTenantDetail = async () => {
  if (!tenantId.value) return
  
  try {
    console.log('获取租户详情, ID:', tenantId.value)
    loading.value = true
    
    // 获取租户详情
    const response = await tenantApi.getTenantById(tenantId.value)
    console.log('租户详情API响应:', response)
    
    // 使用request.getResponseData从data字段获取数据
    const data = request.getResponseData(response)
    console.log('租户详情:', data)
    
    // 填充表单数据
    form.name = data.name || ''
    form.description = data.description || ''
    form.status = data.status || 'active'
    form.contact_name = data.contact_name || ''
    form.contact_phone = data.contact_phone || ''
    form.contact_email = data.contact_email || ''
    
    // 获取配额信息
    await getQuotaInfo()
    
    loading.value = false
  } catch (error) {
    console.error('获取租户详情失败:', error)
    loading.value = false
    ElMessage.error('获取租户详情失败')
  }
}

// 获取配额信息
const getQuotaInfo = async () => {
  if (isCreate.value) return
  
  try {
    quotaLoading.value = true
    
    // 获取配额使用情况
    const response = await tenantApi.getTenantQuotaUsage(tenantId.value)
    
    // 使用request.getResponseData从data字段获取数据
    const data = request.getResponseData(response)
    console.log('租户配额使用情况:', data)
    
    // 设置配额表单
    quotaForm.max_users = data.max_users || 100
    quotaForm.max_storage = data.max_storage || 10240
    
    // 设置使用情况
    quotaUsage.value = {
      current_users: data.current_users || 0,
      current_storage: data.current_storage || 0,
      users_usage_percent: data.users_usage_percent || 0,
      storage_usage_percent: data.storage_usage_percent || 0
    }
    
    quotaLoading.value = false
  } catch (error) {
    console.error('获取租户配额信息失败:', error)
    quotaLoading.value = false
    ElMessage.error('获取租户配额信息失败')
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async valid => {
    if (!valid) {
      ElMessage.warning('请修正表单中的错误')
      return
    }
    
    try {
      submitting.value = true
      
      // 处理租户基本信息
      const tenantData = {
        name: form.name,
        description: form.description,
        status: form.status,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email
      }
      
      // 更新租户
      await tenantApi.updateTenant(tenantId.value, tenantData)
      console.log('租户信息更新成功')
      
      // 更新配额信息
      const quotaData = {
        max_users: quotaForm.max_users,
        max_storage: quotaForm.max_storage
      }
      
      await tenantApi.updateTenantQuota(tenantId.value, quotaData)
      console.log('租户配额更新成功')
      
      ElMessage.success('更新租户成功')
      
      // 返回租户列表页
      router.push('/tenants')
    } catch (error) {
      console.error('保存租户信息失败:', error)
      ElMessage.error('保存租户信息失败')
    } finally {
      submitting.value = false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (isCreate.value) {
    formRef.value.resetFields()
  } else {
    getTenantDetail()
  }
}

// 返回租户列表页
const goBack = () => {
  router.push('/tenants')
}

// 生命周期钩子
onMounted(() => {
  getTenantDetail()
})
</script>

<style scoped>
.tenant-edit-container {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.quota-loading-placeholder {
  padding: 10px 0 20px;
}

.usage-percent {
  color: #909399;
  font-size: 13px;
}

.ml-10 {
  margin-left: 10px;
}
</style>
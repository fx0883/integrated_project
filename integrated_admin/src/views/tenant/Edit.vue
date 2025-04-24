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
            <el-form-item label="域名" prop="domain">
              <el-input v-model="form.domain" placeholder="请输入域名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行业" prop="industry">
              <el-select v-model="form.industry" placeholder="请选择行业" style="width: 100%">
                <el-option label="互联网/IT" value="互联网/IT" />
                <el-option label="金融" value="金融" />
                <el-option label="教育" value="教育" />
                <el-option label="医疗" value="医疗" />
                <el-option label="制造业" value="制造业" />
                <el-option label="零售" value="零售" />
                <el-option label="政府机构" value="政府机构" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="激活" value="active" />
                <el-option label="禁用" value="disabled" />
                <el-option label="暂停" value="suspended" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
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
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="contact_email">
              <el-input v-model="form.contact_email" placeholder="请输入联系邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系地址" prop="contact_address">
              <el-input v-model="form.contact_address" placeholder="请输入联系地址" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">管理员信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="管理员邮箱" prop="admin_email">
              <el-input v-model="form.admin_email" placeholder="请输入管理员邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="管理员姓名" prop="admin_name">
              <el-input v-model="form.admin_name" placeholder="请输入管理员姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row v-if="isCreate">
          <el-col :span="12">
            <el-form-item label="管理员密码" prop="admin_password">
              <el-input v-model="form.admin_password" type="password" placeholder="请设置管理员密码" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">配置信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="许可证数" prop="license_count">
              <el-input-number v-model="form.license_count" :min="1" :max="10000" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间" prop="expiry_date">
              <el-date-picker
                v-model="form.expiry_date"
                type="date"
                placeholder="选择过期日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="form.notes"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
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

const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.id)
const isCreate = computed(() => !tenantId.value || tenantId.value === 'create')

// 表单引用
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

// 表单数据
const form = reactive({
  name: '',
  domain: '',
  industry: '',
  status: 'active',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  admin_email: '',
  admin_name: '',
  admin_password: '',
  license_count: 10,
  expiry_date: '',
  notes: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符之间', trigger: 'blur' }
  ],
  domain: [
    { required: true, message: '请输入域名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/, message: '请输入有效的域名', trigger: 'blur' }
  ],
  industry: [
    { required: true, message: '请选择行业', trigger: 'change' }
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
  ],
  admin_email: [
    { required: true, message: '请输入管理员邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  admin_name: [
    { required: true, message: '请输入管理员姓名', trigger: 'blur' }
  ],
  admin_password: [
    { required: isCreate, message: '请设置管理员密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8个字符', trigger: 'blur' }
  ],
  license_count: [
    { required: true, message: '请输入许可证数量', trigger: 'blur' }
  ],
  expiry_date: [
    { required: true, message: '请选择过期日期', trigger: 'change' }
  ]
}

// 获取租户详情
const getTenantDetail = async () => {
  if (isCreate.value) return
  
  try {
    loading.value = true
    console.log('获取租户详情，ID:', tenantId.value)
    
    const data = await tenantApi.getTenant(tenantId.value)
    console.log('租户详情:', data)
    
    // 填充表单数据
    Object.keys(form).forEach(key => {
      if (data[key] !== undefined) {
        // 处理日期类型
        if (key === 'expiry_date' && data[key]) {
          form[key] = new Date(data[key])
        } else {
          form[key] = data[key]
        }
      }
    })
    
    loading.value = false
  } catch (error) {
    console.error('获取租户详情失败:', error)
    loading.value = false
    ElMessage.error('获取租户详情失败')
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
      
      // 克隆表单数据进行处理
      const formData = { ...form }
      
      // 处理日期格式
      if (formData.expiry_date && formData.expiry_date instanceof Date) {
        formData.expiry_date = formData.expiry_date.toISOString().split('T')[0]
      }
      
      // 如果是编辑模式且没有设置密码，移除password字段
      if (!isCreate.value && !formData.admin_password) {
        delete formData.admin_password
      }
      
      if (isCreate.value) {
        // 创建租户
        await tenantApi.createTenant(formData)
        ElMessage.success('创建租户成功')
      } else {
        // 更新租户
        await tenantApi.updateTenant(tenantId.value, formData)
        ElMessage.success('更新租户成功')
      }
      
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
</style>
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
            <el-icon><Office /></el-icon>
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
              <el-form-item label="租户编码" prop="code">
                <el-input v-model="tenantForm.code" placeholder="请输入租户编码" />
              </el-form-item>
            </div>
          </div>
          
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
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="联系邮箱" prop="contact_email">
                <el-input v-model="tenantForm.contact_email" placeholder="请输入联系邮箱" />
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="所在行业" prop="industry">
                <el-select v-model="tenantForm.industry" placeholder="请选择行业" style="width: 100%">
                  <el-option v-for="item in industryOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-col">
              <el-form-item label="公司规模" prop="size">
                <el-select v-model="tenantForm.size" placeholder="请选择公司规模" style="width: 100%">
                  <el-option v-for="item in sizeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-col">
              <el-form-item label="到期日期" prop="expire_date">
                <el-date-picker
                  v-model="tenantForm.expire_date"
                  type="date"
                  placeholder="选择到期日期"
                  style="width: 100%"
                />
              </el-form-item>
            </div>
          </div>
          
          <el-form-item label="地址" prop="address">
            <el-input v-model="tenantForm.address" placeholder="请输入详细地址" />
          </el-form-item>
          
          <el-form-item label="租户状态">
            <div class="switch-wrapper">
              <el-switch 
                v-model="tenantForm.status" 
                active-value="active" 
                inactive-value="disabled"
                :active-color="variables.primaryColor"
                :inactive-color="variables.borderColor"
              />
              <span class="switch-label">{{ tenantForm.status === 'active' ? '已激活' : '已禁用' }}</span>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 配置信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-title">
            <el-icon><Setting /></el-icon>
            <span>租户配置</span>
          </div>
        </template>
        
        <div class="config-option">
          <div class="config-content">
            <div class="config-title">用户数量限制</div>
            <div class="config-desc">租户可创建的最大用户数量</div>
          </div>
          <el-input-number 
            v-model="tenantForm.user_limit" 
            :min="5" 
            :max="500" 
            :step="5"
            controls-position="right"
            class="config-input"
          />
        </div>
        
        <div class="config-option">
          <div class="config-content">
            <div class="config-title">存储空间限制(GB)</div>
            <div class="config-desc">租户可使用的最大存储空间</div>
          </div>
          <el-input-number 
            v-model="tenantForm.storage_limit" 
            :min="1" 
            :max="1000" 
            :step="1"
            controls-position="right"
            class="config-input"
          />
        </div>
        
        <div class="config-option">
          <div class="config-content">
            <div class="config-title">允许自定义主题</div>
            <div class="config-desc">租户可以自定义平台主题和样式</div>
          </div>
          <el-switch 
            v-model="tenantForm.can_customize_theme" 
            :active-color="variables.primaryColor"
            :inactive-color="variables.borderColor"
          />
        </div>
        
        <div class="config-option">
          <div class="config-content">
            <div class="config-title">允许API接入</div>
            <div class="config-desc">租户可以通过API访问平台数据</div>
          </div>
          <el-switch 
            v-model="tenantForm.api_access_enabled" 
            :active-color="variables.primaryColor"
            :inactive-color="variables.borderColor"
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
import { Office, Setting, Back } from '@element-plus/icons-vue'

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

// 行业选项
const industryOptions = [
  { value: 'technology', label: '科技/互联网' },
  { value: 'finance', label: '金融/保险' },
  { value: 'manufacture', label: '制造业' },
  { value: 'education', label: '教育' },
  { value: 'healthcare', label: '医疗健康' },
  { value: 'retail', label: '零售/电商' },
  { value: 'real_estate', label: '房地产' },
  { value: 'logistics', label: '物流/运输' },
  { value: 'other', label: '其他' }
]

// 公司规模选项
const sizeOptions = [
  { value: 'micro', label: '微型企业(1-10人)' },
  { value: 'small', label: '小型企业(11-50人)' },
  { value: 'medium', label: '中型企业(51-200人)' },
  { value: 'large', label: '大型企业(201-500人)' },
  { value: 'enterprise', label: '超大型企业(500人以上)' }
]

// 表单数据
const tenantForm = reactive({
  name: '',
  code: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  industry: '',
  size: '',
  address: '',
  expire_date: '',
  status: 'active',
  user_limit: 50,
  storage_limit: 100,
  can_customize_theme: false,
  api_access_enabled: true
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入租户编码', trigger: 'blur' },
    { pattern: /^[a-z0-9_-]{3,20}$/, message: '编码只能包含小写字母、数字、下划线和连字符，长度3-20', trigger: 'blur' }
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
  ],
  industry: [
    { required: true, message: '请选择所在行业', trigger: 'change' }
  ],
  size: [
    { required: true, message: '请选择公司规模', trigger: 'change' }
  ],
  expire_date: [
    { required: true, message: '请选择到期日期', trigger: 'change' }
  ]
}

// 提交表单
const submitForm = async () => {
  try {
    await tenantFormRef.value.validate()
    
    submitLoading.value = true
    console.log('提交租户表单', tenantForm)
    
    // 实际项目中应该调用API创建租户
    // const response = await tenantApi.createTenant({
    //   name: tenantForm.name,
    //   code: tenantForm.code,
    //   contact_name: tenantForm.contact_name,
    //   contact_phone: tenantForm.contact_phone,
    //   contact_email: tenantForm.contact_email,
    //   industry: tenantForm.industry,
    //   size: tenantForm.size,
    //   address: tenantForm.address,
    //   expire_date: tenantForm.expire_date,
    //   status: tenantForm.status,
    //   user_limit: tenantForm.user_limit,
    //   storage_limit: tenantForm.storage_limit,
    //   can_customize_theme: tenantForm.can_customize_theme,
    //   api_access_enabled: tenantForm.api_access_enabled
    // })
    
    // 模拟请求
    setTimeout(() => {
      submitLoading.value = false
      
      ElMessage({
        type: 'success',
        message: '租户创建成功'
      })
      
      // 创建成功后返回列表页
      router.push('/tenants')
    }, 800)
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

.btn-primary {
  background-color: #0abab5;
  border-color: #0abab5;
}

.btn-primary:hover {
  background-color: #099490;
  border-color: #099490;
}

.btn-secondary {
  background-color: white;
  border-color: #E8ECF4;
  color: #6E7687;
}

.btn-secondary:hover {
  background-color: #e0f5f4;
  border-color: #0abab5;
  color: #0abab5;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-label {
  font-size: 14px;
  color: #666;
}

.config-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid #E8ECF4;
}

.config-option:last-child {
  border-bottom: none;
}

.config-content {
  flex: 1;
}

.config-title {
  font-weight: 500;
  font-size: 15px;
  color: #333;
  margin-bottom: 5px;
}

.config-desc {
  font-size: 13px;
  color: #666;
}

.config-input {
  width: 150px;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
  
  .config-input {
    width: 120px;
  }
}
</style> 
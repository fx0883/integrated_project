<template>
  <div class="about-container">
    <div class="page-header">
      <h1 class="page-title">关于我们</h1>
      <div class="page-actions">
        <el-button @click="goBack" class="btn-secondary">
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>
    
    <div class="content-container">
      <el-card shadow="never" class="about-card">
        <template #header>
          <div class="card-title">
            <el-icon><InfoFilled /></el-icon>
            <span>公司介绍</span>
          </div>
        </template>
        
        <div class="about-content">
          <div class="company-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          
          <h2 class="company-name">集成管理系统</h2>
          <div class="company-desc">
            <p>我们是一家专注于提供企业级集成管理解决方案的科技公司，致力于帮助企业简化管理流程、提高运营效率。通过我们的SaaS平台，企业可以轻松实现用户管理、租户管理和资源分配等核心功能。</p>
            <p>我们的使命是通过技术创新，为企业提供更高效、更安全、更易用的管理工具，助力企业数字化转型。</p>
          </div>
          
          <div class="company-info">
            <div class="info-item">
              <div class="info-label">成立时间</div>
              <div class="info-value">2020年</div>
            </div>
            <div class="info-item">
              <div class="info-label">总部</div>
              <div class="info-value">北京市朝阳区</div>
            </div>
            <div class="info-item">
              <div class="info-label">员工数</div>
              <div class="info-value">100+</div>
            </div>
            <div class="info-item">
              <div class="info-label">服务客户</div>
              <div class="info-value">1000+</div>
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card shadow="never" class="about-card">
        <template #header>
          <div class="card-title">
            <el-icon><Aim /></el-icon>
            <span>我们的优势</span>
          </div>
        </template>
        
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">安全可靠</h3>
              <p class="feature-desc">采用业界领先的安全技术，保障企业数据安全，支持多种身份验证方式和权限管理。</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">高度集成</h3>
              <p class="feature-desc">提供丰富的API接口和集成能力，可以与企业现有系统无缝对接，实现数据互通。</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">数据驱动</h3>
              <p class="feature-desc">内置强大的数据分析功能，帮助企业洞察关键指标，优化运营决策。</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="feature-content">
              <h3 class="feature-title">易用性强</h3>
              <p class="feature-desc">精心设计的用户界面，简洁直观，降低学习成本，提高工作效率。</p>
            </div>
          </div>
        </div>
      </el-card>
      
      <el-card shadow="never" class="about-card">
        <template #header>
          <div class="card-title">
            <el-icon><Phone /></el-icon>
            <span>联系我们</span>
          </div>
        </template>
        
        <div class="contact-info">
          <div class="contact-item">
            <div class="contact-icon">
              <el-icon><Location /></el-icon>
            </div>
            <div>
              <h4>公司地址</h4>
              <p>北京市朝阳区建国路88号 现代城 8层</p>
            </div>
          </div>
          
          <div class="contact-item">
            <div class="contact-icon">
              <el-icon><Message /></el-icon>
            </div>
            <div>
              <h4>电子邮箱</h4>
              <p>contact@example.com</p>
            </div>
          </div>
          
          <div class="contact-item">
            <div class="contact-icon">
              <el-icon><PhoneFilled /></el-icon>
            </div>
            <div>
              <h4>联系电话</h4>
              <p>400-888-8888</p>
            </div>
          </div>
        </div>
        
        <div class="contact-map">
          <div class="map-placeholder">
            <el-icon><MapLocation /></el-icon>
            <span>地图加载中...</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { 
  Back, 
  InfoFilled, 
  Aim, 
  Lock, 
  Connection, 
  TrendCharts, 
  Monitor,
  Phone,
  Location,
  Message,
  PhoneFilled,
  MapLocation
} from '@element-plus/icons-vue'

// 路由
const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.about-container {
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

.about-card {
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

.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
}

.company-logo {
  display: flex;
  justify-content: center;
  color: #0abab5;
}

.company-name {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
  text-align: center;
}

.company-desc {
  max-width: 800px;
  text-align: center;
  line-height: 1.6;
  color: #555;
}

.company-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
  margin-top: 20px;
  width: 100%;
}

.info-item {
  text-align: center;
  min-width: 120px;
}

.info-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #0abab5;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  padding: 20px 0;
}

.feature-item {
  display: flex;
  gap: 15px;
}

.feature-icon {
  font-size: 24px;
  color: #0abab5;
  padding-top: 5px;
}

.feature-content {
  flex: 1;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.feature-desc {
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.contact-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  padding: 20px 0;
}

.contact-item {
  display: flex;
  gap: 15px;
}

.contact-icon {
  font-size: 24px;
  color: #0abab5;
  padding-top: 5px;
}

.contact-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px 0;
}

.contact-item p {
  color: #555;
  margin: 0;
}

.contact-map {
  margin-top: 20px;
  height: 300px;
  background-color: #f5f7fa;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #909399;
}

.map-placeholder .el-icon {
  font-size: 40px;
}

@media (max-width: 768px) {
  .feature-list {
    grid-template-columns: 1fr;
  }
  
  .contact-info {
    grid-template-columns: 1fr;
  }
}
</style> 
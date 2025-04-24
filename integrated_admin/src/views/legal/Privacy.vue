<template>
  <div class="privacy-container">
    <div class="page-header">
      <h1 class="page-title">隐私政策</h1>
      <div class="page-actions">
        <el-button @click="goBack" class="btn-secondary">
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>
    
    <div class="content-container">
      <el-card shadow="never" class="content-card">
        <div class="last-updated">最近更新日期：2023年12月15日</div>
        
        <div class="policy-section">
          <h2 class="section-title">1. 引言</h2>
          <p>
            感谢您使用我们的集成管理系统服务。本隐私政策旨在帮助您了解我们如何收集、使用、存储和共享您的个人信息，以及您在使用我们服务时所拥有的隐私权利和选择。
          </p>
          <p>
            请您在使用我们的服务前仔细阅读本隐私政策。如果您不同意本政策的任何内容，请立即停止使用我们的服务。
          </p>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">2. 信息收集</h2>
          <h3 class="subsection-title">2.1 您主动提供的信息</h3>
          <p>
            当您注册账户、使用我们的服务或与我们联系时，我们可能会收集以下信息：
          </p>
          <ul class="policy-list">
            <li>基本身份信息：如姓名、电子邮件地址、电话号码等</li>
            <li>账户信息：如用户名、密码（加密存储）等</li>
            <li>付款信息：如账单地址、交易记录等</li>
            <li>通信内容：如您与我们的客服团队的通信记录</li>
          </ul>
          
          <h3 class="subsection-title">2.2 自动收集的信息</h3>
          <p>
            当您使用我们的服务时，我们可能会自动收集以下信息：
          </p>
          <ul class="policy-list">
            <li>设备信息：如IP地址、设备类型、操作系统等</li>
            <li>浏览器信息：如浏览器类型、版本等</li>
            <li>使用数据：如访问时间、浏览页面、停留时间等</li>
            <li>日志数据：如系统活动、错误报告等</li>
          </ul>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">3. 信息使用</h2>
          <p>
            我们收集的信息将用于：
          </p>
          <ul class="policy-list">
            <li>提供、维护和改进我们的服务</li>
            <li>处理您的交易和管理您的账户</li>
            <li>向您发送服务通知和更新</li>
            <li>响应您的请求和提供客户支持</li>
            <li>分析服务使用情况和改进用户体验</li>
            <li>检测和防止欺诈行为</li>
            <li>遵守法律法规要求</li>
          </ul>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">4. 信息共享</h2>
          <p>
            我们不会出售您的个人信息。我们可能在以下情况下共享您的信息：
          </p>
          <ul class="policy-list">
            <li>在获得您明确同意的情况下</li>
            <li>与我们的服务提供商和业务合作伙伴共享，他们帮助我们提供和改进服务</li>
            <li>在公司合并、收购或出售资产的情况下</li>
            <li>为遵守法律法规、法院命令或政府要求</li>
            <li>为保护我们的权利、财产或安全，以及我们用户或公众的权利、财产或安全</li>
          </ul>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">5. 数据安全</h2>
          <p>
            我们采取合理的技术和组织措施来保护您的个人信息，防止未经授权的访问、使用或披露。这些措施包括：
          </p>
          <ul class="policy-list">
            <li>使用加密技术保护数据传输和存储</li>
            <li>实施访问控制机制</li>
            <li>定期审查和更新安全策略</li>
            <li>对员工进行数据保护培训</li>
          </ul>
          <p>
            然而，请注意，互联网传输和电子存储并非绝对安全。尽管我们努力保护您的个人信息，但我们无法保证其绝对安全。
          </p>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">6. 您的权利</h2>
          <p>
            根据适用的数据保护法律，您可能拥有以下权利：
          </p>
          <ul class="policy-list">
            <li>访问权：了解我们是否处理您的个人信息，如果是，可以获取这些信息的副本</li>
            <li>纠正权：要求更正不准确或不完整的个人信息</li>
            <li>删除权：在某些情况下要求删除您的个人信息</li>
            <li>限制处理权：在某些情况下限制我们对您个人信息的处理</li>
            <li>数据可携权：在技术可行的情况下，以结构化、常用和机器可读的格式接收您的个人信息</li>
            <li>反对权：基于您特定情况反对我们处理您的个人信息</li>
          </ul>
          <p>
            如需行使上述权利，请通过本政策末尾提供的联系方式与我们联系。
          </p>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">7. Cookie和类似技术</h2>
          <p>
            我们使用Cookie和类似技术来收集和存储有关您使用我们服务的信息。您可以通过浏览器设置控制Cookie的使用，但请注意，禁用Cookie可能会影响某些服务功能的可用性。
          </p>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">8. 儿童隐私</h2>
          <p>
            我们的服务不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。如果您发现我们可能收集了13岁以下儿童的个人信息，请立即联系我们，我们将采取措施删除相关信息。
          </p>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">9. 政策变更</h2>
          <p>
            我们可能会不时更新本隐私政策。如有重大变更，我们将通过电子邮件或网站通知通知您。我们建议您定期查阅本政策，了解我们如何保护您的信息。
          </p>
        </div>
        
        <div class="policy-section">
          <h2 class="section-title">10. 联系我们</h2>
          <p>
            如果您对本隐私政策有任何疑问或顾虑，请通过以下方式联系我们：
          </p>
          <div class="contact-info">
            <p><strong>电子邮件：</strong> privacy@example.com</p>
            <p><strong>邮寄地址：</strong> 北京市朝阳区建国路88号 现代城 8层</p>
            <p><strong>电话：</strong> 400-888-8888</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'

// 路由
const router = useRouter()

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.privacy-container {
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

.content-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
  padding: 10px 20px;
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

.last-updated {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  text-align: right;
}

.policy-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 15px 0 10px;
}

.policy-list {
  margin: 10px 0;
  padding-left: 20px;
}

.policy-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.contact-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.contact-info p {
  margin: 5px 0;
}

p {
  line-height: 1.6;
  color: #555;
  margin-bottom: 10px;
}
</style> 
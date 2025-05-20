<template>
  <div class="help-container">
    <div class="page-header">
      <h1 class="page-title">帮助中心</h1>
      <div class="page-actions">
        <el-button @click="goBack" class="btn-secondary">
          <el-icon><Back /></el-icon>返回
        </el-button>
      </div>
    </div>
    
    <div class="content-container">
      <!-- 搜索框 -->
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索帮助内容..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="help-content">
        <!-- 常见问题导航 -->
        <div class="help-sidebar">
          <h2 class="sidebar-title">常见问题分类</h2>
          <el-menu
            :default-active="activeCategory"
            class="category-menu"
            @select="handleCategorySelect"
          >
            <el-menu-item v-for="category in categories" :key="category.id" :index="category.id">
              <el-icon><component :is="category.icon" /></el-icon>
              <span>{{ category.name }}</span>
            </el-menu-item>
          </el-menu>
          
          <div class="help-contact">
            <h3>需要更多帮助？</h3>
            <p>我们的客服团队随时为您提供支持</p>
            <el-button type="primary" class="contact-button">
              <el-icon><Message /></el-icon>联系客服
            </el-button>
          </div>
        </div>
        
        <!-- 问题列表 -->
        <div class="faq-container">
          <div class="category-header">
            <el-icon><component :is="currentCategory.icon" /></el-icon>
            <h2>{{ currentCategory.name }}</h2>
          </div>
          
          <div v-if="filteredFaqs.length > 0" class="faq-list">
            <el-collapse v-model="activeNames">
              <el-collapse-item 
                v-for="faq in filteredFaqs" 
                :key="faq.id" 
                :name="faq.id"
                class="faq-item"
              >
                <template #title>
                  <div class="faq-title">
                    <el-icon><QuestionFilled /></el-icon>
                    <span>{{ faq.question }}</span>
                  </div>
                </template>
                <div class="faq-answer" v-html="faq.answer"></div>
              </el-collapse-item>
            </el-collapse>
          </div>
          
          <el-empty 
            v-else 
            description="未找到相关问题" 
            :image-size="200"
          >
            <template #description>
              <p>{{ searchQuery ? '没有找到匹配的结果，请尝试其他关键词' : '当前分类暂无常见问题' }}</p>
            </template>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Back, 
  Search, 
  QuestionFilled, 
  Message,
  Setting,
  User,
  Document,
  CreditCard,
  Tools,
  Warning
} from '@element-plus/icons-vue'

// 路由
const router = useRouter()

// 搜索
const searchQuery = ref('')

// 激活的分类
const activeCategory = ref('account')
const activeNames = ref(['faq1', 'faq2'])

// 分类数据
const categories = [
  { id: 'account', name: '账户管理', icon: 'User' },
  { id: 'billing', name: '账单与付款', icon: 'CreditCard' },
  { id: 'features', name: '功能使用', icon: 'Document' },
  { id: 'settings', name: '系统设置', icon: 'Setting' },
  { id: 'troubleshooting', name: '故障排除', icon: 'Warning' },
  { id: 'integration', name: '系统集成', icon: 'Tools' }
]

// FAQ数据
const faqs = ref([
  // 账户管理
  {
    id: 'faq1',
    category: 'account',
    question: '如何创建新用户账户？',
    answer: `
      <p>创建新用户账户的步骤如下：</p>
      <ol>
        <li>登录到管理后台</li>
        <li>在左侧菜单中选择"用户管理"</li>
        <li>点击右上角的"创建用户"按钮</li>
        <li>填写用户信息表单，包括用户名、邮箱、密码等</li>
        <li>选择适当的用户角色和权限</li>
        <li>点击"创建"按钮完成创建</li>
      </ol>
      <p>注意：您需要有管理员或超级管理员权限才能创建新用户。</p>
    `
  },
  {
    id: 'faq2',
    category: 'account',
    question: '如何重置密码？',
    answer: `
      <p>重置密码有两种方式：</p>
      <p><strong>方式一：自助重置</strong></p>
      <ol>
        <li>在登录页面点击"忘记密码"</li>
        <li>输入您的注册邮箱</li>
        <li>系统会向您的邮箱发送一封包含重置链接的邮件</li>
        <li>点击邮件中的链接，设置新密码</li>
      </ol>
      <p><strong>方式二：管理员重置</strong></p>
      <ol>
        <li>管理员登录到系统</li>
        <li>进入"用户管理"模块</li>
        <li>找到需要重置密码的用户，点击"操作"列中的"重置密码"</li>
        <li>系统会生成一个临时密码或发送重置链接到用户邮箱</li>
      </ol>
    `
  },
  {
    id: 'faq3',
    category: 'account',
    question: '如何修改用户个人信息？',
    answer: `
      <p>修改个人信息的步骤如下：</p>
      <ol>
        <li>登录到系统</li>
        <li>点击右上角的个人头像或用户名</li>
        <li>在下拉菜单中选择"个人设置"</li>
        <li>在个人信息页面，您可以修改以下信息：</li>
        <ul>
          <li>头像</li>
          <li>真实姓名</li>
          <li>联系电话</li>
          <li>电子邮箱</li>
          <li>个人简介</li>
        </ul>
        <li>修改完成后，点击"保存"按钮</li>
      </ol>
      <p>注意：某些信息（如用户名）可能无法直接修改，如需更改请联系管理员。</p>
    `
  },
  
  // 账单与付款
  {
    id: 'faq4',
    category: 'billing',
    question: '如何查看账单历史？',
    answer: `
      <p>查看账单历史的步骤如下：</p>
      <ol>
        <li>登录到系统（需要管理员权限）</li>
        <li>在左侧菜单中选择"账单管理"</li>
        <li>默认显示最近的账单记录</li>
        <li>您可以通过顶部的日期选择器筛选特定时间段的账单</li>
        <li>点击每条账单记录可以查看详细信息</li>
        <li>在详情页面可以下载PDF格式的账单</li>
      </ol>
    `
  },
  {
    id: 'faq5',
    category: 'billing',
    question: '支持哪些付款方式？',
    answer: `
      <p>我们系统目前支持以下付款方式：</p>
      <ul>
        <li><strong>信用卡/借记卡</strong>：支持主流银行卡，包括Visa、MasterCard等</li>
        <li><strong>支付宝</strong>：中国用户的首选支付方式</li>
        <li><strong>微信支付</strong>：方便快捷的移动支付方式</li>
        <li><strong>银行转账</strong>：适合大额订单，处理时间较长</li>
        <li><strong>PayPal</strong>：国际用户常用的支付方式</li>
      </ul>
      <p>注意：不同地区的可用支付方式可能有所不同。</p>
    `
  },
  
  // 功能使用
  {
    id: 'faq6',
    category: 'features',
    question: '如何创建和管理租户？',
    answer: `
      <p>创建和管理租户的步骤如下（需要超级管理员权限）：</p>
      <p><strong>创建新租户：</strong></p>
      <ol>
        <li>登录到系统</li>
        <li>在左侧菜单中选择"租户管理"</li>
        <li>点击"创建租户"按钮</li>
        <li>填写租户信息，包括：</li>
        <ul>
          <li>租户名称</li>
          <li>租户编码</li>
          <li>联系人信息</li>
          <li>行业和规模</li>
          <li>配额设置（用户数、存储空间等）</li>
        </ul>
        <li>点击"创建"按钮完成</li>
      </ol>
      <p><strong>管理现有租户：</strong></p>
      <ol>
        <li>在租户列表中找到目标租户</li>
        <li>点击操作列中的"查看"、"编辑"或"删除"按钮</li>
        <li>在编辑页面可以修改租户的详细信息和配额</li>
        <li>在详情页面可以查看租户的使用统计和用户列表</li>
      </ol>
    `
  },
  {
    id: 'faq7',
    category: 'features',
    question: '如何导出数据报表？',
    answer: `
      <p>导出数据报表的步骤如下：</p>
      <ol>
        <li>登录到系统（需要相应权限）</li>
        <li>进入需要导出数据的模块（如"用户管理"、"订单管理"等）</li>
        <li>使用过滤器和搜索功能筛选需要的数据</li>
        <li>点击页面右上角的"导出"按钮</li>
        <li>在弹出的对话框中选择导出格式（Excel、CSV或PDF）</li>
        <li>选择要包含的字段和导出的数据范围</li>
        <li>点击"确认导出"按钮</li>
        <li>系统会生成报表文件并提供下载链接</li>
      </ol>
      <p>对于大型数据集，系统可能会在后台处理并通过邮件通知您下载链接。</p>
    `
  },
  
  // 系统设置
  {
    id: 'faq8',
    category: 'settings',
    question: '如何配置系统通知？',
    answer: `
      <p>配置系统通知的步骤如下（需要管理员权限）：</p>
      <ol>
        <li>登录到系统</li>
        <li>在左侧菜单中选择"系统设置"</li>
        <li>点击"通知设置"选项</li>
        <li>在通知设置页面，您可以配置以下类型的通知：</li>
        <ul>
          <li>系统公告：向所有用户发送的全局通知</li>
          <li>邮件通知：触发自动邮件发送的事件</li>
          <li>站内消息：显示在用户通知中心的消息</li>
          <li>短信通知：重要事件的短信提醒</li>
        </ul>
        <li>对于每种通知类型，您可以：</li>
        <ul>
          <li>启用或禁用</li>
          <li>设置接收人范围</li>
          <li>自定义通知内容模板</li>
          <li>设置触发条件和频率</li>
        </ul>
        <li>设置完成后点击"保存"按钮</li>
      </ol>
    `
  },
  {
    id: 'faq9',
    category: 'settings',
    question: '如何管理系统角色和权限？',
    answer: `
      <p>管理系统角色和权限的步骤如下（需要超级管理员权限）：</p>
      <p><strong>查看现有角色：</strong></p>
      <ol>
        <li>登录到系统</li>
        <li>在左侧菜单中选择"系统设置"</li>
        <li>点击"角色管理"选项</li>
        <li>系统会显示所有预定义和自定义角色的列表</li>
      </ol>
      <p><strong>创建新角色：</strong></p>
      <ol>
        <li>在角色管理页面，点击"创建角色"按钮</li>
        <li>输入角色名称和描述</li>
        <li>在权限设置部分，勾选该角色应具有的权限</li>
        <li>权限通常按模块分组，您可以展开每个模块查看详细权限</li>
        <li>点击"创建"按钮保存新角色</li>
      </ol>
      <p><strong>编辑现有角色：</strong></p>
      <ol>
        <li>在角色列表中，找到需要编辑的角色</li>
        <li>点击操作列中的"编辑"按钮</li>
        <li>修改角色信息和权限设置</li>
        <li>点击"保存"按钮应用更改</li>
      </ol>
      <p><strong>分配角色给用户：</strong></p>
      <ol>
        <li>进入"用户管理"模块</li>
        <li>找到需要分配角色的用户</li>
        <li>点击"编辑"进入用户编辑页面</li>
        <li>在角色设置部分，选择适当的角色</li>
        <li>点击"保存"按钮</li>
      </ol>
      <p>注意：系统预定义的基本角色（如超级管理员）可能无法被修改或删除。</p>
    `
  },
  
  // 故障排除
  {
    id: 'faq10',
    category: 'troubleshooting',
    question: '登录时遇到"账户已锁定"提示怎么办？',
    answer: `
      <p>如果您在登录时看到"账户已锁定"的提示，原因可能是：</p>
      <ul>
        <li>多次输入错误密码，触发了安全保护机制</li>
        <li>账户因违反使用条款被管理员手动锁定</li>
        <li>账户长时间未活动，被系统自动锁定</li>
      </ul>
      <p><strong>解决方法：</strong></p>
      <ol>
        <li><strong>等待自动解锁</strong>：如果是因为多次密码错误，系统通常会在30分钟后自动解锁账户</li>
        <li><strong>重置密码</strong>：点击登录页面的"忘记密码"链接，通过邮箱验证重新设置密码</li>
        <li><strong>联系管理员</strong>：如果上述方法无效，请联系系统管理员解锁账户</li>
      </ol>
      <p>为了避免账户被锁定，建议：</p>
      <ul>
        <li>使用密码管理器保存密码，避免输入错误</li>
        <li>定期登录系统，保持账户活跃</li>
        <li>遵守系统使用规定和条款</li>
      </ul>
    `
  },
  {
    id: 'faq11',
    category: 'troubleshooting',
    question: '系统运行缓慢怎么办？',
    answer: `
      <p>如果您发现系统运行速度变慢，可以尝试以下解决方法：</p>
      <p><strong>用户端解决方法：</strong></p>
      <ol>
        <li><strong>清理浏览器缓存</strong>：</li>
        <ul>
          <li>Chrome: 设置 → 隐私设置和安全性 → 清除浏览数据</li>
          <li>Firefox: 选项 → 隐私与安全 → Cookie和网站数据 → 清除数据</li>
          <li>Edge: 设置 → 隐私、搜索和服务 → 清除浏览数据</li>
        </ul>
        <li><strong>检查网络连接</strong>：使用<a href="https://www.speedtest.net/" target="_blank">速度测试工具</a>检查您的网络速度</li>
        <li><strong>关闭不必要的浏览器扩展</strong>：某些扩展可能会影响页面加载速度</li>
        <li><strong>尝试不同的浏览器</strong>：我们推荐使用最新版本的Chrome、Firefox或Edge</li>
        <li><strong>减少同时打开的标签页数量</strong>：过多标签页会消耗系统资源</li>
      </ol>
      <p><strong>管理员解决方法：</strong></p>
      <ol>
        <li><strong>检查系统负载</strong>：进入系统监控页面，查看服务器资源使用情况</li>
        <li><strong>优化数据库</strong>：定期清理不必要的数据和日志</li>
        <li><strong>调整缓存设置</strong>：在系统设置中优化缓存配置</li>
        <li><strong>联系技术支持</strong>：如果问题持续存在，请提交支持工单</li>
      </ol>
      <p>如果问题仍然存在，请描述具体症状（如哪些页面加载慢、执行哪些操作时系统变慢）并联系我们的技术支持团队。</p>
    `
  },
  
  // 系统集成
  {
    id: 'faq12',
    category: 'integration',
    question: '如何使用API接口？',
    answer: `
      <p>使用我们的API接口可以通过以下步骤：</p>
      <p><strong>准备工作：</strong></p>
      <ol>
        <li>确保您的账户有API访问权限（需要管理员在租户设置中启用）</li>
        <li>登录系统，进入"个人设置"→"API管理"</li>
        <li>创建API密钥和密钥对</li>
        <li>记录您的API密钥ID和密钥（请妥善保管，密钥只显示一次）</li>
      </ol>
      <p><strong>API文档：</strong></p>
      <ol>
        <li>访问我们的开发者门户：<code>https://api.example.com/docs</code></li>
        <li>浏览可用的API端点和功能</li>
        <li>每个端点都有详细的参数说明和示例代码</li>
      </ol>
      <p><strong>调用API示例：</strong></p>
      <pre><code>
  # 使用curl发起请求
  curl -X GET "https://api.example.com/v1/users" \\
    -H "Authorization: Bearer YOUR_API_KEY" \\
    -H "Content-Type: application/json"
  
  # Python示例
  import requests
  
  url = "https://api.example.com/v1/users"
  headers = {
      "Authorization": "Bearer YOUR_API_KEY",
      "Content-Type": "application/json"
  }
  
  response = requests.get(url, headers=headers)
  print(response.json())
      </code></pre>
      <p><strong>速率限制：</strong></p>
      <ul>
        <li>标准账户：每分钟60个请求</li>
        <li>高级账户：每分钟120个请求</li>
        <li>企业账户：根据合同自定义限制</li>
      </ul>
      <p>如果您需要更高的API调用限制或自定义集成方案，请联系我们的销售团队。</p>
    `
  },
  {
    id: 'faq13',
    category: 'integration',
    question: '如何将系统与其他应用集成？',
    answer: `
      <p>我们的系统支持多种集成方式：</p>
      <p><strong>1. 使用预建连接器</strong></p>
      <p>我们提供了与多种常用应用的现成连接器，包括：</p>
      <ul>
        <li>CRM系统：Salesforce, Microsoft Dynamics, HubSpot</li>
        <li>ERP系统：SAP, Oracle, NetSuite</li>
        <li>办公套件：Microsoft 365, Google Workspace</li>
        <li>通讯工具：Slack, Microsoft Teams</li>
        <li>文件存储：Dropbox, Google Drive, OneDrive</li>
      </ul>
      <p>设置步骤：</p>
      <ol>
        <li>进入"系统设置"→"集成管理"</li>
        <li>选择需要集成的应用</li>
        <li>按照向导进行授权和配置</li>
      </ol>
      
      <p><strong>2. 使用API进行自定义集成</strong></p>
      <ol>
        <li>查阅我们的API文档</li>
        <li>开发自定义集成方案</li>
        <li>测试和部署您的集成</li>
      </ol>
      
      <p><strong>3. 使用Webhook</strong></p>
      <p>配置Webhook可以在系统中发生特定事件时向外部系统推送通知：</p>
      <ol>
        <li>进入"系统设置"→"Webhook管理"</li>
        <li>创建新的Webhook</li>
        <li>设置触发事件（如"用户创建"、"租户更新"等）</li>
        <li>输入接收通知的URL</li>
        <li>设置安全密钥</li>
      </ol>
      
      <p><strong>4. 使用中间件和iPaaS平台</strong></p>
      <p>您也可以使用以下集成平台来构建更复杂的集成流程：</p>
      <ul>
        <li>Zapier</li>
        <li>Microsoft Power Automate</li>
        <li>Integromat</li>
        <li>MuleSoft</li>
      </ul>
      
      <p>如果您需要开发复杂的自定义集成，我们的专业服务团队可以提供咨询和实施支持。</p>
    `
  }
])

// 当前分类
const currentCategory = computed(() => {
  return categories.find(c => c.id === activeCategory.value) || categories[0]
})

// 根据搜索条件和分类过滤问题
const filteredFaqs = computed(() => {
  // 先按分类筛选
  let result = faqs.value.filter(faq => faq.category === activeCategory.value)
  
  // 如果有搜索关键词，再按关键词筛选
  if (searchQuery.value.trim()) {
    const keyword = searchQuery.value.toLowerCase().trim()
    result = result.filter(faq => 
      faq.question.toLowerCase().includes(keyword) || 
      faq.answer.toLowerCase().includes(keyword)
    )
  }
  
  return result
})

// 处理分类选择
const handleCategorySelect = (index) => {
  activeCategory.value = index
  // 重置展开状态
  activeNames.value = filteredFaqs.value.length > 0 ? [filteredFaqs.value[0].id] : []
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 生命周期钩子
onMounted(() => {
  // 如果有FAQ，默认展开第一个
  if (filteredFaqs.value.length > 0) {
    activeNames.value = [filteredFaqs.value[0].id]
  }
})
</script>

<style scoped>
.help-container {
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

.search-container {
  margin-bottom: 20px;
}

.search-input {
  max-width: 600px;
}

.help-content {
  display: flex;
  gap: 30px;
}

.help-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.category-menu {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-bottom: 30px;
}

.help-contact {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.help-contact h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.help-contact p {
  color: #666;
  margin-bottom: 15px;
}

.contact-button {
  width: 100%;
  background-color: #0abab5;
  border-color: #0abab5;
}

.contact-button:hover {
  background-color: #099490;
  border-color: #099490;
}

.faq-container {
  flex: 1;
  min-width: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.category-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.faq-list {
  margin-bottom: 30px;
}

.faq-item {
  margin-bottom: 10px;
}

.faq-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.faq-answer {
  color: #555;
  line-height: 1.6;
  padding: 10px 0;
}

.faq-answer h1, .faq-answer h2, .faq-answer h3 {
  margin-top: 16px;
  margin-bottom: 8px;
}

.faq-answer p {
  margin-bottom: 12px;
}

.faq-answer ul, .faq-answer ol {
  margin-bottom: 16px;
  padding-left: 20px;
}

.faq-answer li {
  margin-bottom: 6px;
}

.faq-answer code {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.faq-answer pre {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 15px 0;
}

@media (max-width: 992px) {
  .help-content {
    flex-direction: column;
  }
  
  .help-sidebar {
    width: 100%;
  }
}
</style> 
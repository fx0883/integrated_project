<template>
  <div class="article-view-page">
    <div class="page-header">
      <h2 class="page-title">文章详情</h2>
      <div class="page-actions">
        <el-button @click="goBack" icon="Back">返回</el-button>
        <el-button @click="handleEdit" type="primary" icon="Edit">编辑</el-button>
      </div>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="18">
        <!-- 文章主体内容 -->
        <el-card class="content-card">
          <template #header>
            <div class="article-header">
              <h1 class="article-title">{{ article.title }}</h1>
              <div class="article-meta">
                <el-tag v-if="article.status === 'published'" type="success">已发布</el-tag>
                <el-tag v-else-if="article.status === 'draft'" type="info">草稿</el-tag>
                <el-tag v-else-if="article.status === 'pending'" type="warning">待审核</el-tag>
                <el-tag v-else-if="article.status === 'archived'" type="danger">已归档</el-tag>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ article.published_at || article.created_at || '未发布' }}
                </span>
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ article.author?.username || '未知作者' }}
                </span>
                <span class="meta-item">
                  <el-icon><View /></el-icon>
                  {{ statistics.views_count || 0 }} 阅读
                </span>
                <span class="meta-item">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ statistics.comments_count || 0 }} 评论
                </span>
              </div>
            </div>
          </template>
          
          <div class="article-content" v-if="article.content_type === 'markdown'">
            <!-- 这里应该使用Markdown渲染库 -->
            <div v-html="article.content"></div>
          </div>
          <div class="article-content" v-else v-html="article.content"></div>
          
          <div class="article-footer">
            <div class="article-tags">
              <span class="tag-label">标签:</span>
              <el-tag 
                v-for="tag in article.tags" 
                :key="tag.id" 
                size="small" 
                effect="plain"
                class="tag-item"
              >
                {{ tag.name }}
              </el-tag>
              <span v-if="!article.tags || article.tags.length === 0">无标签</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <!-- 文章信息卡片 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>文章信息</span>
            </div>
          </template>
          
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ article.created_at || '-' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">更新时间</span>
            <span class="info-value">{{ article.updated_at || '-' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">发布时间</span>
            <span class="info-value">{{ article.published_at || '未发布' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">作者</span>
            <span class="info-value">{{ article.author?.username || '未知作者' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">状态</span>
            <span class="info-value">
              <el-tag v-if="article.status === 'published'" type="success" size="small">已发布</el-tag>
              <el-tag v-else-if="article.status === 'draft'" type="info" size="small">草稿</el-tag>
              <el-tag v-else-if="article.status === 'pending'" type="warning" size="small">待审核</el-tag>
              <el-tag v-else-if="article.status === 'archived'" type="danger" size="small">已归档</el-tag>
            </span>
          </div>
          
          <div class="info-item">
            <span class="info-label">文章ID</span>
            <span class="info-value">{{ article.id || '-' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">内容类型</span>
            <span class="info-value">{{ article.content_type === 'markdown' ? 'Markdown' : 'HTML' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">特色文章</span>
            <span class="info-value">
              <el-tag v-if="article.is_featured" type="warning" size="small">是</el-tag>
              <span v-else>否</span>
            </span>
          </div>
          
          <div class="info-item">
            <span class="info-label">置顶文章</span>
            <span class="info-value">
              <el-tag v-if="article.is_pinned" type="success" size="small">是</el-tag>
              <span v-else>否</span>
            </span>
          </div>
        </el-card>
        
        <!-- 分类卡片 -->
        <el-card class="category-card">
          <template #header>
            <div class="card-header">
              <span>文章分类</span>
            </div>
          </template>
          
          <div class="category-list">
            <el-tag 
              v-for="category in article.categories" 
              :key="category.id"
              effect="plain"
              class="category-item"
            >
              {{ category.name }}
            </el-tag>
            <div v-if="!article.categories || article.categories.length === 0" class="no-data">
              未分类
            </div>
          </div>
        </el-card>
        
        <!-- 统计数据卡片 -->
        <el-card class="statistics-card">
          <template #header>
            <div class="card-header">
              <span>统计数据</span>
              <el-button type="primary" link @click="refreshStatistics">刷新</el-button>
            </div>
          </template>
          
          <div class="statistics-list">
            <div class="statistic-item">
              <div class="statistic-value">{{ statistics.views_count || 0 }}</div>
              <div class="statistic-label">阅读量</div>
            </div>
            
            <div class="statistic-item">
              <div class="statistic-value">{{ statistics.comments_count || 0 }}</div>
              <div class="statistic-label">评论数</div>
            </div>
            
            <div class="statistic-item">
              <div class="statistic-value">{{ statistics.likes_count || 0 }}</div>
              <div class="statistic-label">点赞数</div>
            </div>
            
            <div class="statistic-item">
              <div class="statistic-value">{{ statistics.shares_count || 0 }}</div>
              <div class="statistic-label">分享数</div>
            </div>
          </div>
          
          <el-divider />
          
          <h4 class="chart-title">访问趋势</h4>
          <div class="chart-container" ref="chartContainer"></div>
        </el-card>
        
        <!-- SEO信息卡片 -->
        <el-card class="seo-card" v-if="article.meta">
          <template #header>
            <div class="card-header">
              <span>SEO信息</span>
            </div>
          </template>
          
          <div class="info-item">
            <span class="info-label">Meta标题</span>
            <span class="info-value">{{ article.meta.title || article.title || '-' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Meta描述</span>
            <span class="info-value">{{ article.meta.description || article.excerpt || '-' }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Meta关键词</span>
            <span class="info-value">{{ article.meta.keywords || '-' }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, Edit, Calendar, User, View, ChatDotRound } from '@element-plus/icons-vue'
import { articleApi } from '@/api/article'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { 
  TitleComponent, 
  TooltipComponent, 
  GridComponent, 
  LegendComponent 
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册 ECharts 组件
echarts.use([
  TitleComponent, 
  TooltipComponent, 
  GridComponent, 
  LegendComponent,
  LineChart,
  CanvasRenderer
])

const route = useRoute()
const router = useRouter()

// 获取文章ID
const articleId = computed(() => route.params.id)

// 状态变量
const loading = ref(false)
const article = ref({})
const statistics = ref({})
const chartContainer = ref(null)
let chart = null

// 获取文章详情
const getArticleDetail = async () => {
  loading.value = true
  try {
    const response = await articleApi.getArticleById(articleId.value)
    article.value = response.data
    
    // 获取文章统计数据
    await getArticleStatistics()
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

// 获取文章统计数据
const getArticleStatistics = async () => {
  try {
    const response = await articleApi.getArticleStatistics(articleId.value)
    statistics.value = response.data
    
    // 初始化图表
    nextTick(() => {
      initChart()
    })
  } catch (error) {
    console.error('获取文章统计数据失败:', error)
    ElMessage.error('获取文章统计数据失败')
  }
}

// 刷新统计数据
const refreshStatistics = async () => {
  await getArticleStatistics()
}

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return
  
  // 销毁旧图表
  if (chart) {
    chart.dispose()
  }
  
  // 创建新图表
  chart = echarts.init(chartContainer.value)
  
  // 假设后端返回的访问趋势数据格式如下
  const viewsData = statistics.value.views_trend || []
  
  const option = {
    title: {
      show: false
    },
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: viewsData.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        data: viewsData.map(item => item.count),
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      }
    ],
    color: ['#409EFF']
  }
  
  chart.setOption(option)
  
  // 添加窗口调整事件
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

// 返回列表
const goBack = () => {
  router.push('/cms/articles')
}

// 编辑文章
const handleEdit = () => {
  router.push(`/cms/articles/edit/${articleId.value}`)
}

// 生命周期钩子
onMounted(() => {
  getArticleDetail()
})
</script>

<style scoped>
.article-view-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.content-card,
.info-card,
.category-card,
.statistics-card,
.seo-card {
  margin-bottom: 20px;
}

.article-header {
  padding-bottom: 15px;
}

.article-title {
  font-size: 24px;
  margin: 0 0 15px 0;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  color: #909399;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.article-content {
  line-height: 1.8;
  font-size: 16px;
}

.article-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #EBEEF5;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag-label {
  color: #606266;
  font-size: 14px;
}

.tag-item {
  margin-right: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-label {
  color: #606266;
}

.info-value {
  color: #303133;
  word-break: break-all;
}

.category-list,
.statistics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-item {
  margin-bottom: 5px;
}

.no-data {
  color: #909399;
  font-size: 14px;
  padding: 10px 0;
}

.statistics-list {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.statistic-item {
  text-align: center;
  flex: 1;
}

.statistic-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.statistic-label {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.chart-title {
  font-size: 16px;
  margin: 10px 0;
  color: #303133;
}

.chart-container {
  height: 200px;
  margin-top: 10px;
}
</style> 
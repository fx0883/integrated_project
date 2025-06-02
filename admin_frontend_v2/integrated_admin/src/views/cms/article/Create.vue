<template>
  <div class="article-create-page">
    <div class="page-header">
      <h2 class="page-title">创建文章</h2>
      <div class="page-actions">
        <el-button @click="saveAsDraft">保存草稿</el-button>
        <el-button @click="previewArticle" type="info">预览</el-button>
        <el-button @click="publishArticle" type="primary">发布</el-button>
      </div>
    </div>

    <el-form
      ref="articleFormRef"
      :model="articleForm"
      :rules="rules"
      label-position="top"
      class="article-form"
    >
      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 主要内容区 -->
          <el-card class="content-card">
            <el-form-item label="文章标题" prop="title">
              <el-input 
                v-model="articleForm.title" 
                placeholder="请输入文章标题" 
                maxlength="200" 
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="内容" prop="content">
              <div class="editor-toolbar">
                <el-radio-group v-model="articleForm.content_type" size="small">
                  <el-radio-button value="markdown" label="Markdown">Markdown</el-radio-button>
                  <el-radio-button value="html" label="富文本">富文本</el-radio-button>
                </el-radio-group>
              </div>
              
              <!-- Markdown编辑器 -->
              <div v-if="articleForm.content_type === 'markdown'" class="markdown-editor">
                <el-input
                  v-model="articleForm.content"
                  type="textarea"
                  :rows="15"
                  placeholder="请输入文章内容（Markdown格式）"
                />
              </div>
              
              <!-- 富文本编辑器 -->
              <div v-else class="rich-text-editor">
                <el-input
                  v-model="articleForm.content"
                  type="textarea"
                  :rows="15"
                  placeholder="请输入文章内容（HTML格式）"
                />
              </div>
            </el-form-item>

            <el-form-item label="摘要" prop="excerpt">
              <el-input
                v-model="articleForm.excerpt"
                type="textarea"
                :rows="3"
                placeholder="请输入文章摘要（可选）"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-card>

          <!-- SEO设置 -->
          <el-card class="seo-card">
            <template #header>
              <div class="card-header">
                <span>SEO设置</span>
                <el-switch v-model="showSeoSettings" />
              </div>
            </template>
            
            <div v-if="showSeoSettings">
              <el-form-item label="Meta标题" prop="meta_title">
                <el-input
                  v-model="articleForm.meta_title"
                  placeholder="Meta标题（留空则使用文章标题）"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item label="Meta描述" prop="meta_description">
                <el-input
                  v-model="articleForm.meta_description"
                  type="textarea"
                  :rows="2"
                  placeholder="Meta描述（留空则使用文章摘要）"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item label="Meta关键词" prop="meta_keywords">
                <el-input
                  v-model="articleForm.meta_keywords"
                  placeholder="关键词，多个关键词用逗号分隔"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <!-- 发布设置 -->
          <el-card class="settings-card">
            <template #header>
              <div class="card-header">
                <span>发布设置</span>
              </div>
            </template>
            
            <el-form-item label="状态">
              <el-select v-model="articleForm.status" placeholder="请选择状态" class="w-full">
                <el-option label="草稿" value="draft" />
                <el-option label="待审核" value="pending" />
                <el-option label="已发布" value="published" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="发布时间">
              <el-date-picker
                v-model="articleForm.published_at"
                type="datetime"
                placeholder="选择发布时间"
                format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </el-form-item>
            
            <el-form-item label="作者">
              <el-input v-model="articleForm.author_name" placeholder="作者名称" disabled />
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="articleForm.is_featured">设为特色文章</el-checkbox>
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="articleForm.is_pinned">文章置顶</el-checkbox>
            </el-form-item>
          </el-card>
          
          <!-- 分类设置 -->
          <el-card class="category-card">
            <template #header>
              <div class="card-header">
                <span>分类设置</span>
              </div>
            </template>
            
            <el-form-item label="选择分类" prop="category_ids">
              <el-tree-select
                v-model="articleForm.category_ids"
                :data="categories"
                show-checkbox
                check-strictly
                node-key="id"
                :props="{
                  label: 'name',
                  children: 'children'
                }"
                placeholder="请选择分类"
                class="w-full"
              />
            </el-form-item>
          </el-card>
          
          <!-- 标签设置 -->
          <el-card class="tag-card">
            <template #header>
              <div class="card-header">
                <span>标签设置</span>
              </div>
            </template>
            
            <el-form-item label="选择标签" prop="tag_ids">
              <el-select
                v-model="articleForm.tag_ids"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择标签（可创建新标签）"
                class="w-full"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                />
              </el-select>
            </el-form-item>
          </el-card>
          
          <!-- 封面图片 -->
          <el-card class="cover-card">
            <template #header>
              <div class="card-header">
                <span>封面图片</span>
              </div>
            </template>
            
            <el-form-item label="上传封面" prop="cover_image">
              <el-upload
                class="cover-uploader"
                :action="uploadAction"
                :headers="uploadHeaders"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :on-success="handleCoverSuccess"
                :on-error="handleCoverError"
              >
                <img v-if="articleForm.cover_image" :src="articleForm.cover_image" class="cover-image" />
                <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="cover-tip">建议尺寸: 1200 x 675 像素</div>
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>
    </el-form>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="文章预览" fullscreen>
      <div class="preview-container">
        <h1 class="preview-title">{{ articleForm.title }}</h1>
        <div class="preview-meta">
          <span>作者: {{ articleForm.author_name }}</span>
          <span>发布时间: {{ articleForm.published_at || '未发布' }}</span>
        </div>
        <div class="preview-content" v-html="renderContent"></div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="publishArticle">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { articleApi } from '@/api/article'
import { categoryApi } from '@/api/category'
import { tagApi } from '@/api/tag'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 状态变量
const articleFormRef = ref(null)
const loading = ref(false)
const categories = ref([])
const tags = ref([])
const previewVisible = ref(false)
const showSeoSettings = ref(false)

// 表单数据
const articleForm = reactive({
  title: '',
  content: '',
  content_type: 'markdown',
  excerpt: '',
  status: 'draft',
  published_at: null,
  category_ids: [],
  tag_ids: [],
  cover_image: '',
  author_name: userStore.userInfo?.username || '系统用户',
  is_featured: false,
  is_pinned: false,
  // SEO字段
  meta_title: '',
  meta_description: '',
  meta_keywords: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在2到200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ]
}

// 上传相关
const uploadAction = computed(() => {
  // 临时使用，实际环境中应根据后端API配置
  return '/api/cms/articles/upload-temp/'
})

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  }
})

// 计算属性
const renderContent = computed(() => {
  // 简单实现，实际项目中应该使用专业的Markdown解析库
  if (articleForm.content_type === 'markdown') {
    // 这里应该使用Markdown解析库
    return articleForm.content
  } else {
    return articleForm.content
  }
})

// 方法
const getCategories = async () => {
  try {
    const response = await categoryApi.getCategories({ with_tree: true })
    categories.value = response.data.items
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  }
}

const getTags = async () => {
  try {
    const response = await tagApi.getTags()
    tags.value = response.data.items
  } catch (error) {
    console.error('获取标签列表失败:', error)
    ElMessage.error('获取标签列表失败')
  }
}

const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  return true
}

const handleCoverSuccess = (response) => {
  articleForm.cover_image = response.data.url
  ElMessage.success('封面图片上传成功')
}

const handleCoverError = () => {
  ElMessage.error('封面图片上传失败')
}

const validateForm = async () => {
  if (!articleFormRef.value) return false
  
  return await new Promise(resolve => {
    articleFormRef.value.validate((valid) => {
      resolve(valid)
    })
  })
}

const saveAsDraft = async () => {
  articleForm.status = 'draft'
  await saveArticle()
}

const publishArticle = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    ElMessage.warning('请完善表单信息')
    return
  }
  
  articleForm.status = 'published'
  if (!articleForm.published_at) {
    articleForm.published_at = new Date()
  }
  
  await saveArticle()
}

const previewArticle = async () => {
  const isValid = await validateForm()
  if (!isValid) {
    ElMessage.warning('请完善表单信息')
    return
  }
  
  previewVisible.value = true
}

const saveArticle = async () => {
  loading.value = true
  try {
    // 构建提交数据
    const data = {
      title: articleForm.title,
      content: articleForm.content,
      content_type: articleForm.content_type,
      excerpt: articleForm.excerpt,
      status: articleForm.status,
      published_at: articleForm.published_at,
      category_ids: articleForm.category_ids,
      tag_ids: articleForm.tag_ids,
      cover_image: articleForm.cover_image,
      is_featured: articleForm.is_featured,
      is_pinned: articleForm.is_pinned,
      meta: {
        title: articleForm.meta_title,
        description: articleForm.meta_description,
        keywords: articleForm.meta_keywords
      }
    }
    
    const response = await articleApi.createArticle(data)
    ElMessage.success('文章保存成功')
    
    // 重定向到文章编辑页面
    router.push(`/cms/articles/edit/${response.data.id}`)
  } catch (error) {
    console.error('保存文章失败:', error)
    ElMessage.error('保存文章失败')
  } finally {
    loading.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  getCategories()
  getTags()
})
</script>

<style scoped>
.article-create-page {
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

.article-form {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-card,
.seo-card,
.settings-card,
.category-card,
.tag-card,
.cover-card {
  margin-bottom: 20px;
}

.editor-toolbar {
  margin-bottom: 10px;
}

.w-full {
  width: 100%;
}

.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.cover-uploader:hover {
  border-color: #409EFF;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100%;
  height: 178px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-image {
  width: 100%;
  display: block;
}

.cover-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.preview-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.preview-title {
  font-size: 24px;
  margin-bottom: 20px;
}

.preview-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
}

.preview-content {
  line-height: 1.8;
}
</style> 
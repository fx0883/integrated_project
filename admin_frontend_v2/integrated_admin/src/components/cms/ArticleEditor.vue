<template>
  <div class="article-editor">
    <div v-if="loading" class="editor-loading">
      <el-skeleton :rows="10" animated />
    </div>
    <div v-else>
      <slot name="before-editor"></slot>
      
      <div class="editor-header">
        <div class="editor-tools">
          <el-tooltip content="加粗" placement="top">
            <el-button type="text" @click="handleFormat('bold')">
              <el-icon><BoldI /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="斜体" placement="top">
            <el-button type="text" @click="handleFormat('italic')">
              <el-icon><Italic /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="引用" placement="top">
            <el-button type="text" @click="handleFormat('quote')">
              <el-icon><QuoteR /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="代码" placement="top">
            <el-button type="text" @click="handleFormat('code')">
              <el-icon><Code /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="链接" placement="top">
            <el-button type="text" @click="showLinkDialog">
              <el-icon><Link /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="图片" placement="top">
            <el-button type="text" @click="showImageDialog">
              <el-icon><PictureRounded /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="无序列表" placement="top">
            <el-button type="text" @click="handleFormat('ul')">
              <el-icon><ListUl /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="有序列表" placement="top">
            <el-button type="text" @click="handleFormat('ol')">
              <el-icon><ListOl /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="标题" placement="top">
            <el-dropdown trigger="click" @command="handleHeading">
              <el-button type="text">
                <el-icon><QuoteL /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="h1">H1</el-dropdown-item>
                  <el-dropdown-item command="h2">H2</el-dropdown-item>
                  <el-dropdown-item command="h3">H3</el-dropdown-item>
                  <el-dropdown-item command="h4">H4</el-dropdown-item>
                  <el-dropdown-item command="h5">H5</el-dropdown-item>
                  <el-dropdown-item command="h6">H6</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-tooltip>
        </div>
        
        <div class="editor-mode">
          <el-radio-group v-model="editorMode" size="small">
            <el-radio-button label="edit">编辑</el-radio-button>
            <el-radio-button label="split">分屏</el-radio-button>
            <el-radio-button label="preview">预览</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <div class="editor-container" :class="editorMode">
        <div v-show="editorMode !== 'preview'" class="editor-input">
          <el-input
            v-model="localContent"
            type="textarea"
            :rows="rows"
            :placeholder="placeholder"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            @keydown="handleKeydown"
            resize="none"
          />
        </div>
        
        <div v-show="editorMode !== 'edit'" class="editor-preview markdown-body" v-html="renderedContent"></div>
      </div>
      
      <div class="editor-footer">
        <div class="editor-stats">
          <span>{{ countWords() }} 字 / {{ countLines() }} 行</span>
        </div>
      </div>
      
      <slot name="after-editor"></slot>
    </div>
    
    <!-- 链接对话框 -->
    <el-dialog
      v-model="linkDialogVisible"
      title="插入链接"
      width="500px"
    >
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="链接文本">
          <el-input v-model="linkForm.text" placeholder="请输入链接文本" />
        </el-form-item>
        <el-form-item label="链接地址">
          <el-input v-model="linkForm.url" placeholder="请输入链接地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="linkDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="insertLink">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 图片对话框 -->
    <el-dialog
      v-model="imageDialogVisible"
      title="插入图片"
      width="500px"
    >
      <el-tabs v-model="imageTabActive">
        <el-tab-pane label="上传图片" name="upload">
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :show-file-list="false"
          >
            <el-image v-if="imageForm.url" :src="imageForm.url" class="preview-image" />
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <div class="upload-text">点击上传</div>
            </div>
          </el-upload>
        </el-tab-pane>
        <el-tab-pane label="外部图片" name="external">
          <el-form :model="imageForm" label-width="80px">
            <el-form-item label="图片描述">
              <el-input v-model="imageForm.alt" placeholder="请输入图片描述（可选）" />
            </el-form-item>
            <el-form-item label="图片地址">
              <el-input v-model="imageForm.url" placeholder="请输入图片地址" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="imageDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="insertImage">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { 
  BoldI, Italic, QuoteR, Code, Link, PictureRounded, 
  ListUl, ListOl, QuoteL, Plus 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入文章内容...'
  },
  rows: {
    type: Number,
    default: 20
  },
  loading: {
    type: Boolean,
    default: false
  },
  uploadUrl: {
    type: String,
    default: '/api/upload/image'
  },
  uploadHeaders: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'focus', 'blur', 'change'])

// 编辑器状态
const localContent = ref(props.modelValue)
const editorMode = ref('edit')
const linkDialogVisible = ref(false)
const imageDialogVisible = ref(false)
const imageTabActive = ref('upload')

// 表单数据
const linkForm = ref({
  text: '',
  url: ''
})

const imageForm = ref({
  alt: '',
  url: ''
})

// 渲染的Markdown内容
const renderedContent = computed(() => {
  return localContent.value ? DOMPurify.sanitize(marked.parse(localContent.value)) : ''
})

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue
  }
})

// 编辑器事件处理
const handleInput = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const handleFocus = (e) => {
  emit('focus', e)
}

const handleBlur = (e) => {
  emit('blur', e)
}

const handleKeydown = (e) => {
  // Tab键处理，插入两个空格
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = e.target.selectionStart
    const end = e.target.selectionEnd
    
    // 更新文本
    const newText = localContent.value.substring(0, start) + '  ' + localContent.value.substring(end)
    localContent.value = newText
    emit('update:modelValue', newText)
    
    // 将光标放在新位置
    nextTick(() => {
      e.target.selectionStart = e.target.selectionEnd = start + 2
    })
  }
  
  // Ctrl+S保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    emit('save')
  }
}

// 文本格式化处理
const handleFormat = (type) => {
  const textarea = document.querySelector('.editor-input textarea')
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = localContent.value.substring(start, end)
  
  let newText = ''
  let newCursorPos = 0
  
  switch (type) {
    case 'bold':
      newText = localContent.value.substring(0, start) + `**${selectedText}**` + localContent.value.substring(end)
      newCursorPos = selectedText ? end + 4 : start + 2
      break
    case 'italic':
      newText = localContent.value.substring(0, start) + `*${selectedText}*` + localContent.value.substring(end)
      newCursorPos = selectedText ? end + 2 : start + 1
      break
    case 'quote':
      newText = localContent.value.substring(0, start) + `> ${selectedText}` + localContent.value.substring(end)
      newCursorPos = selectedText ? end + 2 : start + 2
      break
    case 'code':
      newText = localContent.value.substring(0, start) + '`' + selectedText + '`' + localContent.value.substring(end)
      newCursorPos = selectedText ? end + 2 : start + 1
      break
    case 'ul':
      newText = localContent.value.substring(0, start) + `- ${selectedText}` + localContent.value.substring(end)
      newCursorPos = selectedText ? end + 2 : start + 2
      break
    case 'ol':
      newText = localContent.value.substring(0, start) + `1. ${selectedText}` + localContent.value.substring(end)
      newCursorPos = selectedText ? end + 3 : start + 3
      break
    default:
      return
  }
  
  // 更新内容
  localContent.value = newText
  emit('update:modelValue', newText)
  
  // 设置光标位置
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = newCursorPos
  }, 0)
}

// 处理标题
const handleHeading = (level) => {
  const textarea = document.querySelector('.editor-input textarea')
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = localContent.value.substring(start, end)
  
  let prefix = ''
  switch (level) {
    case 'h1': prefix = '# '; break
    case 'h2': prefix = '## '; break
    case 'h3': prefix = '### '; break
    case 'h4': prefix = '#### '; break
    case 'h5': prefix = '##### '; break
    case 'h6': prefix = '###### '; break
    default: return
  }
  
  const newText = localContent.value.substring(0, start) + prefix + selectedText + localContent.value.substring(end)
  localContent.value = newText
  emit('update:modelValue', newText)
  
  // 设置光标位置
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = selectedText ? end + prefix.length : start + prefix.length
  }, 0)
}

// 显示链接对话框
const showLinkDialog = () => {
  const textarea = document.querySelector('.editor-input textarea')
  if (!textarea) return
  
  const selectedText = localContent.value.substring(textarea.selectionStart, textarea.selectionEnd)
  linkForm.value = {
    text: selectedText || '链接文本',
    url: ''
  }
  
  linkDialogVisible.value = true
}

// 插入链接
const insertLink = () => {
  const textarea = document.querySelector('.editor-input textarea')
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  const markdownLink = `[${linkForm.value.text}](${linkForm.value.url})`
  const newText = localContent.value.substring(0, start) + markdownLink + localContent.value.substring(end)
  
  localContent.value = newText
  emit('update:modelValue', newText)
  
  linkDialogVisible.value = false
}

// 显示图片对话框
const showImageDialog = () => {
  imageForm.value = {
    alt: '',
    url: ''
  }
  
  imageTabActive.value = 'upload'
  imageDialogVisible.value = true
}

// 插入图片
const insertImage = () => {
  const textarea = document.querySelector('.editor-input textarea')
  if (!textarea) return
  
  if (!imageForm.value.url) {
    ElMessage.warning('请先上传或输入图片地址')
    return
  }
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  const markdownImage = `![${imageForm.value.alt || '图片'}](${imageForm.value.url})`
  const newText = localContent.value.substring(0, start) + markdownImage + localContent.value.substring(end)
  
  localContent.value = newText
  emit('update:modelValue', newText)
  
  imageDialogVisible.value = false
}

// 上传相关方法
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  return true
}

const handleUploadSuccess = (res) => {
  if (res.code === 0 && res.data) {
    imageForm.value.url = res.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

const handleUploadError = () => {
  ElMessage.error('图片上传失败')
}

// 统计相关方法
const countWords = () => {
  return localContent.value.length
}

const countLines = () => {
  return localContent.value.split('\n').length
}

onMounted(() => {
  // 初始化编辑器
})
</script>

<style scoped>
.article-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-loading {
  padding: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.editor-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.editor-container {
  display: flex;
  min-height: 300px;
}

.editor-container.edit .editor-input {
  width: 100%;
}

.editor-container.preview .editor-preview {
  width: 100%;
}

.editor-container.split .editor-input,
.editor-container.split .editor-preview {
  width: 50%;
}

.editor-input {
  position: relative;
}

.editor-input :deep(textarea) {
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  height: 100%;
  border: none;
  outline: none;
}

.editor-preview {
  padding: 16px;
  overflow-y: auto;
  border-left: 1px solid #dcdfe6;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-top: 1px solid #dcdfe6;
  background-color: #f5f7fa;
}

.editor-stats {
  font-size: 12px;
  color: #909399;
}

/* 图片上传样式 */
.image-uploader {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 200px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
}

.upload-placeholder:hover {
  border-color: #409eff;
}

.upload-text {
  margin-top: 8px;
  color: #909399;
  font-size: 14px;
}

.preview-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

/* Markdown 预览样式 */
.markdown-body {
  padding: 16px;
}

:deep(.markdown-body h1) {
  font-size: 2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

:deep(.markdown-body h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

:deep(.markdown-body h3) {
  font-size: 1.25em;
}

:deep(.markdown-body h4) {
  font-size: 1em;
}

:deep(.markdown-body h5) {
  font-size: 0.875em;
}

:deep(.markdown-body h6) {
  font-size: 0.85em;
  color: #6a737d;
}

:deep(.markdown-body pre) {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 16px;
  overflow: auto;
}

:deep(.markdown-body code) {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-family: 'Consolas', 'Monaco', 'Courier New', Courier, monospace;
}

:deep(.markdown-body blockquote) {
  border-left: 4px solid #dfe2e5;
  padding: 0 1em;
  color: #6a737d;
}

:deep(.markdown-body img) {
  max-width: 100%;
}
</style> 
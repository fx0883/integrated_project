<template>
  <div class="image-uploader-component">
    <div class="uploader-header" v-if="showHeader">
      <div class="uploader-title">{{ title }}</div>
      <div v-if="showTips" class="uploader-tips">
        <el-tooltip content="支持jpg、png、gif格式，大小不超过2MB" placement="top">
          <el-icon><InfoFilled /></el-icon>
        </el-tooltip>
      </div>
    </div>
    
    <div class="uploader-content">
      <el-upload
        :class="{ 'upload-disabled': disabled }"
        :action="uploadUrl"
        :headers="uploadHeaders"
        :data="uploadData"
        :multiple="multiple"
        :limit="limit"
        :disabled="disabled"
        :accept="accept"
        :list-type="listType"
        :file-list="fileList"
        :on-preview="handlePreview"
        :on-remove="handleRemove"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-exceed="handleExceed"
        :before-upload="beforeUpload"
        :on-change="handleChange"
        :show-file-list="showFileList"
        :drag="enableDrag"
        :auto-upload="autoUpload"
        ref="uploadRef"
      >
        <template v-if="enableDrag">
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
        </template>
        
        <template v-else-if="listType === 'picture-card'">
          <div>
            <el-icon><plus /></el-icon>
          </div>
        </template>
        
        <template v-else>
          <el-button type="primary" :disabled="disabled">点击上传</el-button>
        </template>
        
        <template #tip v-if="showTipSlot">
          <div class="el-upload__tip">
            {{ tipText }}
          </div>
        </template>
      </el-upload>
      
      <div v-if="showControls" class="upload-controls">
        <el-button v-if="!autoUpload" type="primary" size="small" @click="submitUpload" :disabled="disabled">
          开始上传
        </el-button>
        <el-button v-if="clearable" type="danger" size="small" @click="clearFiles" :disabled="disabled || fileList.length === 0">
          清空
        </el-button>
      </div>
    </div>
    
    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览">
      <div class="preview-container">
        <img :src="previewUrl" class="preview-image" alt="预览图片" />
      </div>
    </el-dialog>
    
    <!-- 图片裁剪对话框 -->
    <el-dialog v-model="cropperVisible" title="图片裁剪" width="800px">
      <div class="cropper-container">
        <vue-cropper
          ref="cropperRef"
          :img="cropperImage"
          :info="true"
          :autoCrop="true"
          :autoCropWidth="cropperOptions.width"
          :autoCropHeight="cropperOptions.height"
          :fixedBox="cropperOptions.fixed"
          :fixedNumber="cropperOptions.fixed ? [cropperOptions.width, cropperOptions.height] : [0, 0]"
          :outputType="cropperOptions.outputType"
          :outputSize="cropperOptions.outputSize"
          :canMoveBox="true"
          :centerBox="true"
          :canScale="true"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelCrop">取消</el-button>
          <el-button type="primary" @click="confirmCrop">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Plus, UploadFilled } from '@element-plus/icons-vue'
import { VueCropper } from 'vue-cropper'

const props = defineProps({
  // 基本配置
  modelValue: {
    type: [String, Array],
    default: ''
  },
  title: {
    type: String,
    default: '图片上传'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showTips: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  
  // 上传配置
  uploadUrl: {
    type: String,
    default: '/api/upload/image'
  },
  uploadHeaders: {
    type: Object,
    default: () => ({})
  },
  uploadData: {
    type: Object,
    default: () => ({})
  },
  multiple: {
    type: Boolean,
    default: false
  },
  limit: {
    type: Number,
    default: 1
  },
  accept: {
    type: String,
    default: 'image/jpeg,image/png,image/gif'
  },
  maxSize: {
    type: Number,
    default: 2 // MB
  },
  
  // 显示配置
  listType: {
    type: String,
    default: 'picture-card', // 'text', 'picture', 'picture-card'
  },
  showFileList: {
    type: Boolean,
    default: true
  },
  enableDrag: {
    type: Boolean,
    default: false
  },
  autoUpload: {
    type: Boolean,
    default: true
  },
  clearable: {
    type: Boolean,
    default: true
  },
  showControls: {
    type: Boolean,
    default: true
  },
  showTipSlot: {
    type: Boolean,
    default: true
  },
  tipText: {
    type: String,
    default: '支持jpg、png、gif格式，大小不超过2MB'
  },
  
  // 裁剪配置
  enableCrop: {
    type: Boolean,
    default: false
  },
  cropperOptions: {
    type: Object,
    default: () => ({
      width: 200,
      height: 200,
      fixed: true,
      outputType: 'png',
      outputSize: 1
    })
  }
})

const emit = defineEmits([
  'update:modelValue',
  'success',
  'error',
  'remove',
  'change',
  'exceed',
  'preview'
])

// 组件状态
const uploadRef = ref(null)
const fileList = ref([])
const previewVisible = ref(false)
const previewUrl = ref('')
const cropperVisible = ref(false)
const cropperRef = ref(null)
const cropperImage = ref('')
const currentFile = ref(null)

// 初始化文件列表
const initFileList = () => {
  if (!props.modelValue) {
    fileList.value = []
    return
  }
  
  if (Array.isArray(props.modelValue)) {
    fileList.value = props.modelValue.map((url, index) => ({
      name: `图片${index + 1}`,
      url
    }))
  } else {
    fileList.value = [{
      name: '图片',
      url: props.modelValue
    }]
  }
}

// 监听值变化
watch(() => props.modelValue, () => {
  initFileList()
}, { immediate: true })

// 提交上传
const submitUpload = () => {
  uploadRef.value.submit()
}

// 清空文件
const clearFiles = () => {
  uploadRef.value.clearFiles()
  fileList.value = []
  emit('update:modelValue', props.multiple ? [] : '')
}

// 处理文件预览
const handlePreview = (file) => {
  previewUrl.value = file.url || URL.createObjectURL(file.raw)
  previewVisible.value = true
  emit('preview', file)
}

// 处理文件移除
const handleRemove = (file, fileList) => {
  const newFileList = fileList
  
  if (props.multiple) {
    emit('update:modelValue', newFileList.map(file => file.url || ''))
  } else {
    emit('update:modelValue', newFileList.length > 0 ? newFileList[0].url || '' : '')
  }
  
  emit('remove', file, newFileList)
}

// 处理上传成功
const handleSuccess = (response, file, fileList) => {
  if (response.code === 0 && response.data) {
    // 更新文件URL
    file.url = response.data.url
    
    if (props.multiple) {
      emit('update:modelValue', fileList.map(file => file.url || ''))
    } else {
      emit('update:modelValue', file.url)
    }
    
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
    handleRemove(file, fileList.filter(item => item.uid !== file.uid))
  }
  
  emit('success', response, file, fileList)
}

// 处理上传错误
const handleError = (error, file, fileList) => {
  ElMessage.error('上传失败')
  emit('error', error, file, fileList)
}

// 处理超出限制
const handleExceed = (files, fileList) => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
  emit('exceed', files, fileList)
}

// 处理文件变化
const handleChange = (file, fileList) => {
  emit('change', file, fileList)
}

// 上传前处理
const beforeUpload = (file) => {
  // 检查文件类型
  const isAccepted = file.type.startsWith('image/')
  if (!isAccepted) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB!`)
    return false
  }
  
  // 如果启用裁剪，拦截上传过程
  if (props.enableCrop) {
    cropperImage.value = URL.createObjectURL(file)
    cropperVisible.value = true
    currentFile.value = file
    return false
  }
  
  return true
}

// 取消裁剪
const cancelCrop = () => {
  cropperVisible.value = false
  cropperImage.value = ''
  currentFile.value = null
}

// 确认裁剪
const confirmCrop = () => {
  if (!cropperRef.value) return
  
  cropperRef.value.getCropBlob((blob) => {
    // 创建新文件
    const fileName = currentFile.value.name
    const fileType = props.cropperOptions.outputType ? `image/${props.cropperOptions.outputType}` : currentFile.value.type
    const newFile = new File([blob], fileName, { type: fileType })
    
    // 手动上传
    const formData = new FormData()
    formData.append('file', newFile)
    
    // 添加自定义上传数据
    Object.keys(props.uploadData).forEach(key => {
      formData.append(key, props.uploadData[key])
    })
    
    // 执行上传
    const xhr = new XMLHttpRequest()
    xhr.open('POST', props.uploadUrl, true)
    
    // 设置请求头
    Object.keys(props.uploadHeaders).forEach(key => {
      xhr.setRequestHeader(key, props.uploadHeaders[key])
    })
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText)
          
          // 创建文件对象
          const uploadFile = {
            name: fileName,
            size: blob.size,
            type: fileType,
            uid: Date.now(),
            status: 'success'
          }
          
          // 处理上传结果
          handleSuccess(response, uploadFile, [...fileList.value, uploadFile])
        } catch (e) {
          ElMessage.error('上传失败')
        }
      } else {
        ElMessage.error('上传失败')
      }
      
      // 关闭裁剪对话框
      cropperVisible.value = false
      cropperImage.value = ''
      currentFile.value = null
    }
    
    xhr.onerror = () => {
      ElMessage.error('上传失败')
      cropperVisible.value = false
      cropperImage.value = ''
      currentFile.value = null
    }
    
    xhr.send(formData)
  })
}

// 暴露方法
defineExpose({
  uploadRef,
  fileList,
  submitUpload,
  clearFiles
})
</script>

<style scoped>
.image-uploader-component {
  width: 100%;
}

.uploader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.uploader-title {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.uploader-tips {
  color: #909399;
  font-size: 14px;
  cursor: help;
}

.uploader-content {
  position: relative;
}

.upload-controls {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-start;
}

.upload-disabled :deep(.el-upload),
.upload-disabled :deep(.el-upload--picture-card) {
  cursor: not-allowed;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
}

/* 预览样式 */
.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
}

/* 裁剪器样式 */
.cropper-container {
  height: 400px;
  width: 100%;
}
</style> 
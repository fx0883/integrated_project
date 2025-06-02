<template>
  <div class="tag-selector">
    <div v-if="loading" class="selector-loading">
      <el-skeleton animated />
    </div>
    <div v-else>
      <slot name="before"></slot>
      
      <div class="selector-container">
        <el-select
          v-if="mode === 'select'"
          v-model="localValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :clearable="clearable"
          :filterable="filterable"
          :multiple="multiple"
          :collapse-tags="collapseTags"
          :size="size"
          :teleported="false"
          @change="handleChange"
        >
          <template v-if="showGroups && tagGroups.length > 0">
            <el-option-group 
              v-for="group in tagGroups" 
              :key="group.id" 
              :label="group.name"
            >
              <el-option
                v-for="tag in getTagsByGroupId(group.id)"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
                :disabled="tag.status === 'disabled'"
              >
                <span class="tag-label">
                  {{ tag.name }}
                  <span v-if="showCount && tag.articles_count !== undefined" class="tag-count">
                    ({{ tag.articles_count }})
                  </span>
                </span>
              </el-option>
            </el-option-group>
            
            <el-option-group v-if="hasUngroupedTags" label="未分组标签">
              <el-option
                v-for="tag in getTagsByGroupId(null)"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
                :disabled="tag.status === 'disabled'"
              >
                <span class="tag-label">
                  {{ tag.name }}
                  <span v-if="showCount && tag.articles_count !== undefined" class="tag-count">
                    ({{ tag.articles_count }})
                  </span>
                </span>
              </el-option>
            </el-option-group>
          </template>
          
          <template v-else>
            <el-option
              v-for="tag in filteredTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
              :disabled="tag.status === 'disabled'"
            >
              <span class="tag-label">
                {{ tag.name }}
                <span v-if="showCount && tag.articles_count !== undefined" class="tag-count">
                  ({{ tag.articles_count }})
                </span>
              </span>
            </el-option>
          </template>
        </el-select>
        
        <div v-else-if="mode === 'checkbox'" class="checkbox-container">
          <div v-if="filterKey.trim()" class="filter-input">
            <el-input
              v-model="filterKey"
              :placeholder="filterPlaceholder"
              clearable
              :prefix-icon="Search"
              :disabled="disabled"
            />
          </div>
          
          <div v-if="showGroups && tagGroups.length > 0" class="group-container">
            <div 
              v-for="group in tagGroups" 
              :key="group.id" 
              class="tag-group"
            >
              <div class="group-header">{{ group.name }}</div>
              <div class="group-content">
                <el-checkbox-group 
                  v-model="localValue"
                  @change="handleChange"
                >
                  <el-checkbox
                    v-for="tag in filterTagsByKey(getTagsByGroupId(group.id))"
                    :key="tag.id"
                    :label="tag.id"
                    :disabled="disabled || tag.status === 'disabled'"
                  >
                    <span class="tag-label">
                      {{ tag.name }}
                      <span v-if="showCount && tag.articles_count !== undefined" class="tag-count">
                        ({{ tag.articles_count }})
                      </span>
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
            
            <div v-if="hasUngroupedTags" class="tag-group">
              <div class="group-header">未分组标签</div>
              <div class="group-content">
                <el-checkbox-group 
                  v-model="localValue"
                  @change="handleChange"
                >
                  <el-checkbox
                    v-for="tag in filterTagsByKey(getTagsByGroupId(null))"
                    :key="tag.id"
                    :label="tag.id"
                    :disabled="disabled || tag.status === 'disabled'"
                  >
                    <span class="tag-label">
                      {{ tag.name }}
                      <span v-if="showCount && tag.articles_count !== undefined" class="tag-count">
                        ({{ tag.articles_count }})
                      </span>
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </div>
          
          <div v-else class="flat-container">
            <el-checkbox-group 
              v-model="localValue"
              @change="handleChange"
            >
              <el-checkbox
                v-for="tag in filteredTags"
                :key="tag.id"
                :label="tag.id"
                :disabled="disabled || tag.status === 'disabled'"
              >
                <span class="tag-label">
                  {{ tag.name }}
                  <span v-if="showCount && tag.articles_count !== undefined" class="tag-count">
                    ({{ tag.articles_count }})
                  </span>
                </span>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
        
        <div v-else-if="mode === 'tag'" class="tag-container">
          <div v-if="showFilterInput" class="filter-input">
            <el-input
              v-model="filterKey"
              :placeholder="filterPlaceholder"
              clearable
              :prefix-icon="Search"
              :disabled="disabled"
            />
          </div>
          
          <div class="tags-wrapper">
            <div v-for="tag in filteredTags" :key="tag.id" 
                class="tag-item"
                :class="{ 
                  'is-active': isTagSelected(tag.id),
                  'is-disabled': disabled || tag.status === 'disabled'
                }"
                @click="toggleTag(tag)"
            >
              <span class="tag-text">
                {{ tag.name }}
                <span v-if="showCount && tag.articles_count !== undefined" class="tag-count">
                  ({{ tag.articles_count }})
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="showSelected && (mode === 'checkbox' || mode === 'tag') && localValue.length > 0" class="selected-tags">
        <div class="selected-header">已选择 ({{ localValue.length }})</div>
        <div class="selected-content">
          <el-tag
            v-for="tagId in localValue"
            :key="tagId"
            closable
            :disable-transitions="false"
            @close="removeTag(tagId)"
          >
            {{ getTagName(tagId) }}
          </el-tag>
        </div>
      </div>
      
      <slot name="after"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTagStore } from '@/stores/tag'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请选择标签'
  },
  filterPlaceholder: {
    type: String,
    default: '搜索标签'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: true
  },
  filterable: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: true
  },
  collapseTags: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'default'
  },
  mode: {
    type: String,
    default: 'select', // select, checkbox, tag
  },
  showGroups: {
    type: Boolean,
    default: true
  },
  showCount: {
    type: Boolean,
    default: true
  },
  showSelected: {
    type: Boolean,
    default: true
  },
  showFilterInput: {
    type: Boolean,
    default: true
  },
  onlyActiveTags: {
    type: Boolean,
    default: true
  },
  sortBy: {
    type: String,
    default: 'name', // name, articles_count, id
  },
  sortOrder: {
    type: String,
    default: 'asc', // asc, desc
  },
  autoLoadData: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 状态
const tagStore = useTagStore()
const loading = ref(false)
const filterKey = ref('')

// 计算属性
const localValue = computed({
  get: () => {
    // 如果是单选但传入的是数组，取第一个值
    if (!props.multiple && Array.isArray(props.modelValue) && props.modelValue.length > 0) {
      return props.modelValue[0]
    }
    
    // 如果是多选但传入的是单个值，转换为数组
    if (props.multiple && !Array.isArray(props.modelValue)) {
      return props.modelValue ? [props.modelValue] : []
    }
    
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  }
})

// 获取标签数据
const loadTagData = async () => {
  if (tagStore.tags.length === 0) {
    loading.value = true
    try {
      await Promise.all([
        tagStore.fetchTags(),
        tagStore.fetchTagGroups()
      ])
    } catch (error) {
      ElMessage.error('获取标签数据失败')
      console.error('获取标签数据失败:', error)
    } finally {
      loading.value = false
    }
  }
}

// 处理值变化
const handleChange = (value) => {
  emit('change', value)
}

// 过滤标签
const filterTagsByKey = (tags) => {
  if (!filterKey.value.trim()) return tags
  
  return tags.filter(tag => 
    tag.name.toLowerCase().includes(filterKey.value.toLowerCase())
  )
}

// 过滤后的标签
const filteredTags = computed(() => {
  let tags = tagStore.tags
  
  // 仅显示活跃标签
  if (props.onlyActiveTags) {
    tags = tags.filter(tag => tag.status !== 'disabled')
  }
  
  // 根据关键字过滤
  if (filterKey.value.trim()) {
    tags = tags.filter(tag => 
      tag.name.toLowerCase().includes(filterKey.value.toLowerCase())
    )
  }
  
  // 排序
  tags = [...tags].sort((a, b) => {
    let valueA, valueB
    
    if (props.sortBy === 'articles_count') {
      valueA = a.articles_count || 0
      valueB = b.articles_count || 0
    } else if (props.sortBy === 'id') {
      valueA = a.id
      valueB = b.id
    } else {
      valueA = a.name
      valueB = b.name
    }
    
    if (props.sortOrder === 'desc') {
      return valueB > valueA ? 1 : valueB < valueA ? -1 : 0
    } else {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
    }
  })
  
  return tags
})

// 获取标签组
const tagGroups = computed(() => {
  return tagStore.tagGroups
})

// 判断是否有未分组标签
const hasUngroupedTags = computed(() => {
  return tagStore.tags.some(tag => !tag.group_id)
})

// 根据组ID获取标签
const getTagsByGroupId = (groupId) => {
  let tags = tagStore.tags.filter(tag => tag.group_id === groupId)
  
  // 仅显示活跃标签
  if (props.onlyActiveTags) {
    tags = tags.filter(tag => tag.status !== 'disabled')
  }
  
  // 排序
  tags = [...tags].sort((a, b) => {
    let valueA, valueB
    
    if (props.sortBy === 'articles_count') {
      valueA = a.articles_count || 0
      valueB = b.articles_count || 0
    } else if (props.sortBy === 'id') {
      valueA = a.id
      valueB = b.id
    } else {
      valueA = a.name
      valueB = b.name
    }
    
    if (props.sortOrder === 'desc') {
      return valueB > valueA ? 1 : valueB < valueA ? -1 : 0
    } else {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
    }
  })
  
  return tags
}

// 判断标签是否已选择
const isTagSelected = (tagId) => {
  if (Array.isArray(localValue.value)) {
    return localValue.value.includes(tagId)
  } else {
    return localValue.value === tagId
  }
}

// 切换标签选择状态
const toggleTag = (tag) => {
  if (props.disabled || tag.status === 'disabled') return
  
  if (props.multiple) {
    const value = [...localValue.value]
    const index = value.indexOf(tag.id)
    
    if (index === -1) {
      value.push(tag.id)
    } else {
      value.splice(index, 1)
    }
    
    localValue.value = value
    emit('change', value)
  } else {
    localValue.value = tag.id
    emit('change', tag.id)
  }
}

// 移除已选标签
const removeTag = (tagId) => {
  if (props.disabled) return
  
  if (props.multiple) {
    const value = [...localValue.value]
    const index = value.indexOf(tagId)
    
    if (index !== -1) {
      value.splice(index, 1)
      localValue.value = value
      emit('change', value)
    }
  }
}

// 获取标签名称
const getTagName = (tagId) => {
  const tag = tagStore.tags.find(tag => tag.id === tagId)
  return tag ? tag.name : tagId
}

// 组件挂载时自动加载数据
onMounted(() => {
  if (props.autoLoadData) {
    loadTagData()
  }
})

// 暴露方法
defineExpose({
  loadTagData
})
</script>

<style scoped>
.tag-selector {
  width: 100%;
}

.selector-loading {
  padding: 8px 0;
}

.selector-container {
  width: 100%;
}

.filter-input {
  margin-bottom: 16px;
}

/* 复选框模式样式 */
.checkbox-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.flat-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag-group {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 12px;
}

.tag-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.group-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.group-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 标签模式样式 */
.tag-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.tag-item {
  padding: 6px 12px;
  background-color: #f4f4f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.tag-item:hover {
  background-color: #ecf5ff;
}

.tag-item.is-active {
  background-color: #409eff;
  color: white;
}

.tag-item.is-active .tag-count {
  color: rgba(255, 255, 255, 0.8);
}

.tag-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: #f4f4f5;
  color: #c0c4cc;
}

.tag-text {
  font-size: 14px;
}

.tag-label {
  display: flex;
  align-items: center;
}

.tag-count {
  margin-left: 4px;
  font-size: 12px;
  color: #909399;
}

/* 已选标签区域 */
.selected-tags {
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.selected-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.selected-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style> 
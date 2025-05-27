<template>
  <div class="category-selector">
    <div v-if="loading" class="selector-loading">
      <el-skeleton animated />
    </div>
    <div v-else>
      <slot name="before"></slot>
      
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
        @change="handleChange"
      >
        <el-option-group v-if="showGroups" label="根分类">
          <el-option
            v-for="category in rootCategories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
            :disabled="category.status === 'disabled'"
          />
        </el-option-group>
        
        <template v-if="showGroups">
          <el-option-group 
            v-for="(group, index) in childrenGroups" 
            :key="index" 
            :label="group.label"
          >
            <el-option
              v-for="category in group.options"
              :key="category.id"
              :label="getIndentedLabel(category, true)"
              :value="category.id"
              :disabled="category.status === 'disabled'"
            />
          </el-option-group>
        </template>
        
        <template v-else>
          <el-option
            v-for="category in flattenedCategories"
            :key="category.id"
            :label="getIndentedLabel(category)"
            :value="category.id"
            :disabled="category.status === 'disabled'"
          />
        </template>
      </el-select>
      
      <el-cascader
        v-else-if="mode === 'cascader'"
        v-model="localValue"
        :options="categoriesOptions"
        :placeholder="placeholder"
        :disabled="disabled"
        :clearable="clearable"
        :filterable="filterable"
        :props="cascaderProps"
        :size="size"
        @change="handleChange"
      />
      
      <el-tree
        v-else-if="mode === 'tree'"
        ref="treeRef"
        :data="categoriesTree"
        :props="treeProps"
        :node-key="valueKey"
        :default-expanded-keys="defaultExpandedKeys"
        :expand-on-click-node="false"
        :check-on-click-node="checkOnClickNode"
        :show-checkbox="multiple"
        :default-checked-keys="multiple ? localValue : []"
        :current-node-key="!multiple ? localValue : undefined"
        :highlight-current="!multiple"
        :check-strictly="checkStrictly"
        :disabled="disabled"
        @check="handleTreeCheck"
        @node-click="handleTreeNodeClick"
      >
        <template #default="{ node, data }">
          <span class="category-node" :class="{ 'disabled': data.status === 'disabled' }">
            <span>{{ node.label }}</span>
            <span v-if="showCount && data.articles_count !== undefined" class="category-count">
              ({{ data.articles_count }})
            </span>
          </span>
        </template>
      </el-tree>
      
      <div v-if="mode === 'radio'" class="radio-group">
        <el-radio-group 
          v-model="localValue"
          :disabled="disabled"
          :size="size"
          @change="handleChange"
        >
          <template v-if="!showAsTree">
            <el-radio 
              v-for="category in flattenedCategories"
              :key="category.id"
              :label="category.id"
              :disabled="category.status === 'disabled'"
            >
              {{ getIndentedLabel(category) }}
            </el-radio>
          </template>
          <template v-else>
            <div class="radio-tree">
              <div 
                v-for="category in rootCategories" 
                :key="category.id"
                class="radio-tree-item"
              >
                <el-radio 
                  :label="category.id"
                  :disabled="category.status === 'disabled'"
                >
                  {{ category.name }}
                </el-radio>
                
                <div 
                  v-if="category.children && category.children.length > 0"
                  class="radio-tree-children"
                >
                  <div 
                    v-for="child in category.children" 
                    :key="child.id"
                    class="radio-tree-item"
                  >
                    <el-radio 
                      :label="child.id"
                      :disabled="child.status === 'disabled'"
                    >
                      {{ child.name }}
                    </el-radio>
                    
                    <div 
                      v-if="child.children && child.children.length > 0"
                      class="radio-tree-children"
                    >
                      <div 
                        v-for="grandchild in child.children" 
                        :key="grandchild.id"
                        class="radio-tree-item"
                      >
                        <el-radio 
                          :label="grandchild.id"
                          :disabled="grandchild.status === 'disabled'"
                        >
                          {{ grandchild.name }}
                        </el-radio>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-radio-group>
      </div>
      
      <div v-if="mode === 'checkbox'" class="checkbox-group">
        <el-checkbox-group 
          v-model="localValue"
          :disabled="disabled"
          :size="size"
          @change="handleChange"
        >
          <template v-if="!showAsTree">
            <el-checkbox 
              v-for="category in flattenedCategories"
              :key="category.id"
              :label="category.id"
              :disabled="category.status === 'disabled'"
            >
              {{ getIndentedLabel(category) }}
            </el-checkbox>
          </template>
          <template v-else>
            <div class="checkbox-tree">
              <div 
                v-for="category in rootCategories" 
                :key="category.id"
                class="checkbox-tree-item"
              >
                <el-checkbox 
                  :label="category.id"
                  :disabled="category.status === 'disabled'"
                >
                  {{ category.name }}
                </el-checkbox>
                
                <div 
                  v-if="category.children && category.children.length > 0"
                  class="checkbox-tree-children"
                >
                  <div 
                    v-for="child in category.children" 
                    :key="child.id"
                    class="checkbox-tree-item"
                  >
                    <el-checkbox 
                      :label="child.id"
                      :disabled="child.status === 'disabled'"
                    >
                      {{ child.name }}
                    </el-checkbox>
                    
                    <div 
                      v-if="child.children && child.children.length > 0"
                      class="checkbox-tree-children"
                    >
                      <div 
                        v-for="grandchild in child.children" 
                        :key="grandchild.id"
                        class="checkbox-tree-item"
                      >
                        <el-checkbox 
                          :label="grandchild.id"
                          :disabled="grandchild.status === 'disabled'"
                        >
                          {{ grandchild.name }}
                        </el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-checkbox-group>
      </div>
      
      <slot name="after"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: [String, Number, Array],
    default: ''
  },
  placeholder: {
    type: String,
    default: '请选择分类'
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
    default: false
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
    default: 'select', // select, cascader, tree, radio, checkbox
  },
  showGroups: {
    type: Boolean,
    default: true
  },
  showAsTree: {
    type: Boolean,
    default: true
  },
  showCount: {
    type: Boolean,
    default: true
  },
  valueKey: {
    type: String,
    default: 'id'
  },
  labelKey: {
    type: String,
    default: 'name'
  },
  childrenKey: {
    type: String,
    default: 'children'
  },
  checkStrictly: {
    type: Boolean,
    default: false
  },
  checkOnClickNode: {
    type: Boolean,
    default: true
  },
  defaultExpandAll: {
    type: Boolean,
    default: false
  },
  defaultExpandedKeys: {
    type: Array,
    default: () => []
  },
  onlyActiveCategories: {
    type: Boolean,
    default: true
  },
  maxLevel: {
    type: Number,
    default: 0 // 0 表示不限制
  },
  autoLoadData: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'node-click'])

// 状态
const categoryStore = useCategoryStore()
const loading = ref(false)
const localValue = ref(props.modelValue)
const treeRef = ref(null)

// 级联选择器配置
const cascaderProps = computed(() => ({
  checkStrictly: props.checkStrictly,
  multiple: props.multiple,
  value: props.valueKey,
  label: props.labelKey,
  children: props.childrenKey,
  expandTrigger: 'hover',
  emitPath: false
}))

// 树组件配置
const treeProps = computed(() => ({
  label: props.labelKey,
  children: props.childrenKey,
  disabled: 'disabled'
}))

// 获取分类数据
const loadCategoryData = async () => {
  if (categoryStore.categories.length === 0 || categoryStore.categoryTree.length === 0) {
    loading.value = true
    try {
      await categoryStore.fetchCategories()
    } catch (error) {
      ElMessage.error('获取分类数据失败')
      console.error('获取分类数据失败:', error)
    } finally {
      loading.value = false
    }
  }
}

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

// 处理值变化
const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

// 处理树节点点击
const handleTreeNodeClick = (data, node) => {
  if (!props.multiple) {
    localValue.value = data[props.valueKey]
    emit('update:modelValue', localValue.value)
  }
  emit('node-click', data, node)
}

// 处理树节点选中
const handleTreeCheck = (data, { checkedKeys }) => {
  if (props.multiple) {
    localValue.value = checkedKeys
    emit('update:modelValue', localValue.value)
  }
}

// 获取缩进标签
const getIndentedLabel = (category, removeIndent = false) => {
  if (!category.level || category.level === 0 || removeIndent) {
    return category.name
  }
  
  const indent = '　'.repeat(category.level)
  return `${indent}${category.name}`
}

// 过滤活跃分类
const filterActiveCategories = (categories) => {
  if (!props.onlyActiveCategories) return categories
  
  return categories.filter(category => {
    const isActive = category.status !== 'disabled'
    
    if (category.children && category.children.length > 0) {
      category.children = filterActiveCategories(category.children)
    }
    
    return isActive
  })
}

// 限制分类层级
const limitCategoryLevel = (categories, level = 0) => {
  if (props.maxLevel === 0) return categories
  
  return categories.map(category => {
    const newCategory = { ...category }
    
    if (level < props.maxLevel - 1 && newCategory.children && newCategory.children.length > 0) {
      newCategory.children = limitCategoryLevel(newCategory.children, level + 1)
    } else {
      newCategory.children = []
    }
    
    return newCategory
  })
}

// 计算根分类
const rootCategories = computed(() => {
  let categories = categoryStore.categories.filter(category => !category.parent_id)
  
  if (props.onlyActiveCategories) {
    categories = categories.filter(category => category.status !== 'disabled')
  }
  
  return categories
})

// 计算分类树
const categoriesTree = computed(() => {
  let tree = JSON.parse(JSON.stringify(categoryStore.categoryTree))
  
  if (props.onlyActiveCategories) {
    tree = filterActiveCategories(tree)
  }
  
  if (props.maxLevel > 0) {
    tree = limitCategoryLevel(tree)
  }
  
  return tree
})

// 计算级联选择器选项
const categoriesOptions = computed(() => {
  return categoriesTree.value.map(category => transformToCascaderOption(category))
})

// 转换为级联选择器选项
const transformToCascaderOption = (category) => {
  const option = {
    [props.valueKey]: category[props.valueKey],
    [props.labelKey]: category[props.labelKey],
    disabled: category.status === 'disabled'
  }
  
  if (category.children && category.children.length > 0) {
    option[props.childrenKey] = category.children.map(child => transformToCascaderOption(child))
  }
  
  return option
}

// 计算扁平化分类列表
const flattenedCategories = computed(() => {
  const result = []
  
  const flatten = (categories, level = 0) => {
    categories.forEach(category => {
      const newCategory = { ...category, level }
      result.push(newCategory)
      
      if (category.children && category.children.length > 0) {
        flatten(category.children, level + 1)
      }
    })
  }
  
  flatten(categoriesTree.value)
  return result
})

// 计算子分类分组
const childrenGroups = computed(() => {
  const groups = []
  
  rootCategories.value.forEach(rootCategory => {
    const children = categoryStore.categories.filter(category => 
      category.parent_id === rootCategory.id && 
      (!props.onlyActiveCategories || category.status !== 'disabled')
    )
    
    if (children.length > 0) {
      groups.push({
        label: rootCategory.name,
        options: children
      })
    }
  })
  
  return groups
})

// 组件挂载时自动加载数据
onMounted(() => {
  if (props.autoLoadData) {
    loadCategoryData()
  }
})

// 暴露方法
defineExpose({
  loadCategoryData,
  treeRef
})
</script>

<style scoped>
.category-selector {
  width: 100%;
}

.selector-loading {
  padding: 8px 0;
}

.radio-group,
.checkbox-group {
  max-height: 300px;
  overflow-y: auto;
}

.radio-group :deep(.el-radio),
.checkbox-group :deep(.el-checkbox) {
  display: block;
  margin-right: 0;
  margin-bottom: 8px;
}

.radio-tree,
.checkbox-tree {
  padding-left: 0;
}

.radio-tree-item,
.checkbox-tree-item {
  margin-bottom: 8px;
}

.radio-tree-children,
.checkbox-tree-children {
  padding-left: 20px;
  margin-top: 8px;
}

.category-node {
  display: flex;
  align-items: center;
}

.category-node.disabled {
  color: #c0c4cc;
}

.category-count {
  margin-left: 4px;
  font-size: 12px;
  color: #909399;
}
</style> 
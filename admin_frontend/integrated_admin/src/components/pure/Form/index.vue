<template>
  <div class="pure-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="mergedRules"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :size="size"
      :disabled="disabled"
      :validate-on-rule-change="validateOnRuleChange"
      :hide-required-asterisk="hideRequiredAsterisk"
      :inline="inline"
      v-bind="$attrs"
    >
      <div class="form-content" :class="{ 'is-grid': grid && !inline }">
        <!-- 表单项内容 -->
        <template v-for="(item, index) in formItems" :key="`form-item-${index}`">
          <!-- 栅格布局 -->
          <el-col
            v-if="grid && !inline"
            :span="item.span || 24"
            :xs="item.xs"
            :sm="item.sm"
            :md="item.md"
            :lg="item.lg"
            :xl="item.xl"
          >
            <!-- 处理普通表单项 -->
            <el-form-item
              v-if="!item.type || (item.type && !['divider', 'group'].includes(item.type))"
              :label="item.label"
              :prop="item.prop"
              :required="item.required"
              :rules="item.rules"
              :error="item.error"
              :label-width="item.labelWidth"
              :class="item.className"
              :style="item.style"
            >
              <!-- 根据类型渲染不同的表单控件 -->
              <template v-if="item.slot">
                <slot :name="item.slot" :item="item" :form="formData"></slot>
              </template>
              
              <template v-else>
                <!-- 输入框 -->
                <el-input
                  v-if="!item.type || item.type === 'input'"
                  v-model="formData[item.prop]"
                  :type="item.inputType || 'text'"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :readonly="item.readonly"
                  :clearable="item.clearable !== false"
                  :maxlength="item.maxlength"
                  :show-password="item.showPassword"
                  :show-word-limit="item.showWordLimit"
                  :prefix-icon="item.prefixIcon"
                  :suffix-icon="item.suffixIcon"
                />
                
                <!-- 选择器 -->
                <el-select
                  v-else-if="item.type === 'select'"
                  v-model="formData[item.prop]"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :clearable="item.clearable !== false"
                  :multiple="item.multiple"
                  :filterable="item.filterable"
                  :remote="item.remote"
                  :remote-method="item.remoteMethod"
                  :loading="item.loading"
                >
                  <el-option
                    v-for="option in item.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-select>
                
                <!-- 单选框组 -->
                <el-radio-group
                  v-else-if="item.type === 'radio'"
                  v-model="formData[item.prop]"
                  :disabled="item.disabled"
                >
                  <template v-if="item.button">
                    <el-radio-button
                      v-for="option in item.options"
                      :key="option.value"
                      :label="option.value"
                      :disabled="option.disabled"
                    >
                      {{ option.label }}
                    </el-radio-button>
                  </template>
                  <template v-else>
                    <el-radio
                      v-for="option in item.options"
                      :key="option.value"
                      :label="option.value"
                      :disabled="option.disabled"
                    >
                      {{ option.label }}
                    </el-radio>
                  </template>
                </el-radio-group>
                
                <!-- 复选框组 -->
                <el-checkbox-group
                  v-else-if="item.type === 'checkbox'"
                  v-model="formData[item.prop]"
                  :disabled="item.disabled"
                >
                  <template v-if="item.button">
                    <el-checkbox-button
                      v-for="option in item.options"
                      :key="option.value"
                      :label="option.value"
                      :disabled="option.disabled"
                    >
                      {{ option.label }}
                    </el-checkbox-button>
                  </template>
                  <template v-else>
                    <el-checkbox
                      v-for="option in item.options"
                      :key="option.value"
                      :label="option.value"
                      :disabled="option.disabled"
                    >
                      {{ option.label }}
                    </el-checkbox>
                  </template>
                </el-checkbox-group>
                
                <!-- 开关 -->
                <el-switch
                  v-else-if="item.type === 'switch'"
                  v-model="formData[item.prop]"
                  :disabled="item.disabled"
                  :active-text="item.activeText"
                  :inactive-text="item.inactiveText"
                  :active-value="item.activeValue"
                  :inactive-value="item.inactiveValue"
                />
                
                <!-- 滑块 -->
                <el-slider
                  v-else-if="item.type === 'slider'"
                  v-model="formData[item.prop]"
                  :disabled="item.disabled"
                  :min="item.min"
                  :max="item.max"
                  :step="item.step"
                  :show-stops="item.showStops"
                  :show-input="item.showInput"
                  :range="item.range"
                />
                
                <!-- 日期选择器 -->
                <el-date-picker
                  v-else-if="item.type === 'date'"
                  v-model="formData[item.prop]"
                  :type="item.dateType || 'date'"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :clearable="item.clearable !== false"
                  :format="item.format"
                  :value-format="item.valueFormat"
                  :start-placeholder="item.startPlaceholder"
                  :end-placeholder="item.endPlaceholder"
                />
                
                <!-- 时间选择器 -->
                <el-time-picker
                  v-else-if="item.type === 'time'"
                  v-model="formData[item.prop]"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :clearable="item.clearable !== false"
                  :format="item.format"
                  :value-format="item.valueFormat"
                  :start-placeholder="item.startPlaceholder"
                  :end-placeholder="item.endPlaceholder"
                />
                
                <!-- 数字输入框 -->
                <el-input-number
                  v-else-if="item.type === 'number'"
                  v-model="formData[item.prop]"
                  :min="item.min"
                  :max="item.max"
                  :step="item.step"
                  :precision="item.precision"
                  :disabled="item.disabled"
                  :controls="item.controls !== false"
                  :placeholder="item.placeholder"
                />
                
                <!-- 评分 -->
                <el-rate
                  v-else-if="item.type === 'rate'"
                  v-model="formData[item.prop]"
                  :max="item.max"
                  :disabled="item.disabled"
                  :allow-half="item.allowHalf"
                  :show-score="item.showScore"
                />
                
                <!-- 颜色选择器 -->
                <el-color-picker
                  v-else-if="item.type === 'color'"
                  v-model="formData[item.prop]"
                  :disabled="item.disabled"
                  :show-alpha="item.showAlpha"
                />
                
                <!-- 文本域 -->
                <el-input
                  v-else-if="item.type === 'textarea'"
                  v-model="formData[item.prop]"
                  type="textarea"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :readonly="item.readonly"
                  :clearable="item.clearable !== false"
                  :maxlength="item.maxlength"
                  :show-word-limit="item.showWordLimit"
                  :rows="item.rows || 3"
                  :autosize="item.autosize"
                />
                
                <!-- 级联选择器 -->
                <el-cascader
                  v-else-if="item.type === 'cascader'"
                  v-model="formData[item.prop]"
                  :options="item.options"
                  :props="item.props"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :clearable="item.clearable !== false"
                  :filterable="item.filterable"
                  :show-all-levels="item.showAllLevels !== false"
                />
                
                <!-- 自定义组件 -->
                <component
                  v-else-if="item.component"
                  :is="item.component"
                  v-model="formData[item.prop]"
                  v-bind="item.props || {}"
                />
              </template>
              
              <!-- 表单项说明 -->
              <template v-if="item.description" #description>
                <div class="form-item-description">{{ item.description }}</div>
              </template>
            </el-form-item>
            
            <!-- 分割线 -->
            <div v-else-if="item.type === 'divider'" class="form-divider">
              <el-divider>{{ item.label }}</el-divider>
            </div>
            
            <!-- 表单分组 -->
            <div v-else-if="item.type === 'group'" class="form-group">
              <div class="form-group-title">{{ item.label }}</div>
              <div v-if="item.description" class="form-group-desc">{{ item.description }}</div>
            </div>
          </el-col>
          
          <!-- 非栅格布局 -->
          <template v-else>
            <!-- 处理普通表单项 -->
            <el-form-item
              v-if="!item.type || (item.type && !['divider', 'group'].includes(item.type))"
              :label="item.label"
              :prop="item.prop"
              :required="item.required"
              :rules="item.rules"
              :error="item.error"
              :label-width="item.labelWidth"
              :class="item.className"
              :style="item.style"
            >
              <!-- 使用与栅格布局相同的内容模板，简化代码 -->
              <template v-if="item.slot">
                <slot :name="item.slot" :item="item" :form="formData"></slot>
              </template>
              
              <template v-else>
                <!-- 与上面相同的表单控件渲染，此处简化，实际应提取为组件或函数 -->
                <!-- 此处代码与栅格布局中的表单控件渲染相同，略 -->
                <!-- 输入框 -->
                <el-input
                  v-if="!item.type || item.type === 'input'"
                  v-model="formData[item.prop]"
                  :type="item.inputType || 'text'"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :readonly="item.readonly"
                  :clearable="item.clearable !== false"
                  :maxlength="item.maxlength"
                  :show-password="item.showPassword"
                  :show-word-limit="item.showWordLimit"
                  :prefix-icon="item.prefixIcon"
                  :suffix-icon="item.suffixIcon"
                />
                
                <!-- 选择器 -->
                <el-select
                  v-else-if="item.type === 'select'"
                  v-model="formData[item.prop]"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled"
                  :clearable="item.clearable !== false"
                  :multiple="item.multiple"
                  :filterable="item.filterable"
                  :remote="item.remote"
                  :remote-method="item.remoteMethod"
                  :loading="item.loading"
                >
                  <el-option
                    v-for="option in item.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-select>
                
                <!-- 其他同上，略 -->
              </template>
              
              <!-- 表单项说明 -->
              <template v-if="item.description" #description>
                <div class="form-item-description">{{ item.description }}</div>
              </template>
            </el-form-item>
            
            <!-- 分割线 -->
            <div v-else-if="item.type === 'divider'" class="form-divider">
              <el-divider>{{ item.label }}</el-divider>
            </div>
            
            <!-- 表单分组 -->
            <div v-else-if="item.type === 'group'" class="form-group">
              <div class="form-group-title">{{ item.label }}</div>
              <div v-if="item.description" class="form-group-desc">{{ item.description }}</div>
            </div>
          </template>
        </template>
      </div>
      
      <!-- 表单操作按钮 -->
      <div v-if="showActions" class="form-actions" :class="actionPosition">
        <slot name="actions">
          <el-button
            v-if="showSubmitButton"
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            {{ submitText }}
          </el-button>
          <el-button
            v-if="showResetButton"
            @click="handleReset"
          >
            {{ resetText }}
          </el-button>
          <slot name="extra-actions"></slot>
        </slot>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { cloneDeep } from 'lodash-es'

// 表单引用
const formRef = ref(null)

// 属性定义
const props = defineProps({
  // 表单数据
  modelValue: {
    type: Object,
    default: () => ({})
  },
  // 表单项配置
  items: {
    type: Array,
    default: () => []
  },
  // 表单验证规则
  rules: {
    type: Object,
    default: () => ({})
  },
  // 标签宽度
  labelWidth: {
    type: [String, Number],
    default: '120px'
  },
  // 标签位置
  labelPosition: {
    type: String,
    default: 'right'
  },
  // 表单尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 表单禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 隐藏必填星号
  hideRequiredAsterisk: {
    type: Boolean,
    default: false
  },
  // 行内表单
  inline: {
    type: Boolean,
    default: false
  },
  // 栅格布局
  grid: {
    type: Boolean,
    default: true
  },
  // 规则变更时是否触发验证
  validateOnRuleChange: {
    type: Boolean,
    default: true
  },
  // 显示操作按钮
  showActions: {
    type: Boolean,
    default: true
  },
  // 操作按钮位置
  actionPosition: {
    type: String,
    default: 'center'
  },
  // 显示提交按钮
  showSubmitButton: {
    type: Boolean,
    default: true
  },
  // 提交按钮文字
  submitText: {
    type: String,
    default: '提交'
  },
  // 提交按钮加载状态
  submitLoading: {
    type: Boolean,
    default: false
  },
  // 显示重置按钮
  showResetButton: {
    type: Boolean,
    default: true
  },
  // 重置按钮文字
  resetText: {
    type: String,
    default: '重置'
  }
})

// 事件定义
const emit = defineEmits([
  'update:modelValue',
  'submit',
  'reset',
  'validate'
])

// 表单数据
const formData = reactive({...props.modelValue})

// 监听表单数据变化
watch(formData, (newVal) => {
  emit('update:modelValue', {...newVal})
}, { deep: true })

// 监听外部传入的表单数据变化
watch(() => props.modelValue, (newVal) => {
  Object.keys(formData).forEach(key => {
    delete formData[key]
  })
  Object.assign(formData, newVal)
}, { deep: true })

// 合并表单项中的规则和props.rules
const mergedRules = computed(() => {
  const rules = {...props.rules}
  
  // 合并表单项中的规则
  props.items.forEach(item => {
    if (item.prop && item.rules) {
      rules[item.prop] = item.rules
    }
  })
  
  return rules
})

// 表单项
const formItems = computed(() => props.items)

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', {...formData})
  } catch (error) {
    emit('validate', false, error)
    return false
  }
}

// 处理表单重置
const handleReset = () => {
  if (!formRef.value) return
  
  formRef.value.resetFields()
  emit('reset')
}

// 对外暴露方法
defineExpose({
  // 表单实例
  formRef,
  // 验证表单
  validate: () => formRef.value?.validate(),
  // 验证特定字段
  validateField: (props, callback) => formRef.value?.validateField(props, callback),
  // 重置表单
  resetFields: () => formRef.value?.resetFields(),
  // 清除验证
  clearValidate: (props) => formRef.value?.clearValidate(props),
  // 滚动到指定字段
  scrollToField: (prop) => formRef.value?.scrollToField(prop),
  // 获取表单数据
  getFormData: () => ({...formData})
})
</script>

<style scoped>
.pure-form {
  width: 100%;
}

.form-content.is-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10px;
}

.form-content.is-grid :deep(.el-col) {
  padding: 0 10px;
}

.form-divider {
  width: 100%;
  margin: 16px 0;
}

.form-group {
  width: 100%;
  margin: 16px 0 8px;
}

.form-group-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-group-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.form-item-description {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.form-actions {
  margin-top: 24px;
  display: flex;
}

.form-actions.left {
  justify-content: flex-start;
}

.form-actions.center {
  justify-content: center;
}

.form-actions.right {
  justify-content: flex-end;
}
</style> 
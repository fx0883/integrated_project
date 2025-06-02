<template>
  <div class="re-tag-selector">
    <el-select
      v-model="selectedTags"
      :multiple="multiple"
      :filterable="filterable"
      :allow-create="allowCreate"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :loading="loading"
      :remote="remote"
      :remote-method="handleRemoteSearch"
      class="tag-select"
      @change="handleChange"
      @visible-change="handleVisibleChange"
      @remove-tag="handleRemoveTag"
      @clear="handleClear"
    >
      <el-option
        v-for="item in tagOptions"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      >
        <div class="tag-option">
          <span>{{ item.name }}</span>
          <el-tag size="small" type="info" v-if="item.count !== undefined">
            {{ item.count }}
          </el-tag>
        </div>
      </el-option>
    </el-select>
    
    <div class="selected-tags" v-if="showSelected && selectedTags.length > 0">
      <el-tag
        v-for="tag in displaySelectedTags"
        :key="tag.id"
        :type="tagType"
        :effect="tagEffect"
        :closable="!disabled"
        class="selected-tag"
        @close="handleTagClose(tag)"
      >
        {{ tag.name }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useTagStoreHook } from "@/store/modules/cms/tag";

// 定义标签类型
interface Tag {
  id: number;
  name: string;
  count?: number;
}

// 组件属性
const props = defineProps({
  modelValue: {
    type: [Number, String, Array],
    default: () => []
  },
  placeholder: {
    type: String,
    default: "请选择标签"
  },
  multiple: {
    type: Boolean,
    default: true
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
  allowCreate: {
    type: Boolean,
    default: false
  },
  showSelected: {
    type: Boolean,
    default: false
  },
  tagType: {
    type: String,
    default: ""
  },
  tagEffect: {
    type: String,
    default: "light"
  },
  remote: {
    type: Boolean,
    default: false
  },
  remoteMethod: {
    type: Function,
    default: null
  }
});

// 事件
const emit = defineEmits(["update:modelValue", "change", "tag-click", "tag-close"]);

// 数据
const tagStore = useTagStoreHook();
const loading = ref(false);
const tagOptions = ref<Tag[]>([]);
const selectedTags = ref<number[]>([]);

// 获取已选标签的详细信息
const displaySelectedTags = computed(() => {
  return selectedTags.value.map(id => {
    const tag = tagOptions.value.find(item => item.id === id);
    return tag || { id, name: `标签 ${id}` };
  });
});

// 初始化
onMounted(async () => {
  await fetchTags();
  initSelectedTags();
});

// 监听值变化
watch(
  () => props.modelValue,
  () => {
    initSelectedTags();
  }
);

// 初始化选中的标签
const initSelectedTags = () => {
  const value = props.modelValue;
  
  if (!value) {
    selectedTags.value = [];
    return;
  }
  
  if (props.multiple) {
    // 多选模式
    if (Array.isArray(value)) {
      selectedTags.value = value.map(item => {
        return typeof item === "object" ? item.id : Number(item);
      });
    } else {
      selectedTags.value = [Number(value)];
    }
  } else {
    // 单选模式
    selectedTags.value = typeof value === "object" ? [value.id] : [Number(value)];
  }
};

// 获取标签列表
const fetchTags = async () => {
  loading.value = true;
  try {
    const result = await tagStore.fetchTags();
    if (result && result.list) {
      tagOptions.value = result.list;
    }
  } catch (error) {
    console.error("获取标签列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 处理选择变化
const handleChange = (value) => {
  // 更新v-model值
  const newValue = props.multiple ? value : (value.length > 0 ? value[0] : null);
  emit("update:modelValue", newValue);
  emit("change", newValue);
};

// 处理远程搜索
const handleRemoteSearch = async (query) => {
  if (props.remoteMethod) {
    loading.value = true;
    try {
      const result = await props.remoteMethod(query);
      if (result && Array.isArray(result)) {
        tagOptions.value = result;
      }
    } finally {
      loading.value = false;
    }
  } else if (props.remote) {
    loading.value = true;
    try {
      const result = await tagStore.fetchTags({ keyword: query });
      if (result && result.list) {
        tagOptions.value = result.list;
      }
    } catch (error) {
      console.error("搜索标签失败:", error);
    } finally {
      loading.value = false;
    }
  }
};

// 处理下拉框可见性变化
const handleVisibleChange = (visible) => {
  if (visible && !props.remote) {
    fetchTags();
  }
};

// 处理移除标签
const handleRemoveTag = (tag) => {
  // 从选中列表中移除
  selectedTags.value = selectedTags.value.filter(id => id !== tag);
  
  // 更新v-model值
  const newValue = props.multiple ? selectedTags.value : null;
  emit("update:modelValue", newValue);
  emit("change", newValue);
};

// 处理清空
const handleClear = () => {
  selectedTags.value = [];
  emit("update:modelValue", props.multiple ? [] : null);
  emit("change", props.multiple ? [] : null);
};

// 处理标签关闭
const handleTagClose = (tag) => {
  // 从选中列表中移除
  selectedTags.value = selectedTags.value.filter(id => id !== tag.id);
  
  // 更新v-model值
  const newValue = props.multiple ? selectedTags.value : null;
  emit("update:modelValue", newValue);
  emit("change", newValue);
  emit("tag-close", tag);
};

// 创建新标签
const createNewTag = async (name) => {
  try {
    loading.value = true;
    const result = await tagStore.createTag({ name });
    if (result && result.id) {
      // 添加到选项列表
      tagOptions.value.push(result);
      return result;
    }
    return null;
  } catch (error) {
    console.error("创建标签失败:", error);
    return null;
  } finally {
    loading.value = false;
  }
};

// 刷新标签列表
const refreshTags = () => {
  fetchTags();
};

// 暴露方法
defineExpose({
  fetchTags,
  createNewTag,
  refreshTags,
  selectedTags,
  tagOptions
});
</script>

<style scoped>
.re-tag-selector {
  width: 100%;
}

.tag-select {
  width: 100%;
}

.tag-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.selected-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}
</style> 
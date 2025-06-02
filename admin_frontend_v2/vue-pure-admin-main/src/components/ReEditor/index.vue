<template>
  <div class="re-editor">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import "@wangeditor/editor/dist/css/style.css";
import { Boot, IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";

// 定义组件接收的属性
const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  placeholder: {
    type: String,
    default: "请输入内容..."
  },
  height: {
    type: [String, Number],
    default: "400px"
  },
  mode: {
    type: String,
    default: "default"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  toolbarConfig: {
    type: Object,
    default: () => ({})
  },
  editorConfig: {
    type: Object,
    default: () => ({})
  },
  uploadImageAction: {
    type: String,
    default: ""
  },
  uploadImageHeaders: {
    type: Object,
    default: () => ({})
  }
});

// 定义事件
const emit = defineEmits(["update:modelValue", "change", "focus", "blur", "created"]);

// 编辑器实例，必须用 shallowRef
const editorRef = ref();
const editorInstance = shallowRef<IDomEditor>();

// 初始化编辑器配置
const initEditor = () => {
  // 工具栏配置
  const defaultToolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: []
  };
  
  // 编辑器配置
  const defaultEditorConfig: Partial<IEditorConfig> = {
    placeholder: props.placeholder,
    readOnly: props.disabled,
    autoFocus: false,
    scroll: true,
    maxLength: 100000
  };
  
  // 合并配置
  const toolbarConfig = Object.assign({}, defaultToolbarConfig, props.toolbarConfig);
  const editorConfig = Object.assign({}, defaultEditorConfig, props.editorConfig);
  
  // 配置上传图片
  if (props.uploadImageAction) {
    editorConfig.MENU_CONF = {};
    editorConfig.MENU_CONF["uploadImage"] = {
      server: props.uploadImageAction,
      headers: props.uploadImageHeaders,
      // 自定义上传图片格式
      customInsert(res: any, insertFn: any) {
        if (res && res.data && res.success) {
          const url = res.data.url || res.data;
          insertFn(url);
        } else {
          console.error("图片上传失败", res);
        }
      }
    };
  }
  
  // 创建编辑器
  import("@wangeditor/editor").then(({ createEditor, createToolbar }) => {
    // 创建编辑器实例
    const editor = createEditor({
      selector: editorRef.value,
      html: props.modelValue,
      config: editorConfig
    });
    
    editorInstance.value = editor;
    
    // 创建工具栏
    if (props.mode !== "simple") {
      const toolbar = createToolbar({
        editor,
        selector: `#toolbar-${editorInstanceId}`,
        config: toolbarConfig,
        mode: "default"
      });
    }
    
    // 监听编辑器内容变化
    editor.on("change", () => {
      const html = editor.getHtml();
      emit("update:modelValue", html);
      emit("change", html);
    });
    
    // 监听编辑器获取焦点
    editor.on("focus", () => {
      emit("focus");
    });
    
    // 监听编辑器失去焦点
    editor.on("blur", () => {
      emit("blur");
    });
    
    // 触发创建事件
    emit("created", editor);
  });
};

// 生成唯一ID
const editorInstanceId = `editor-${Math.random().toString(36).slice(2)}`;

// 设置编辑器高度
const setEditorHeight = () => {
  if (editorRef.value) {
    editorRef.value.style.height = typeof props.height === "number" ? 
      `${props.height}px` : props.height;
  }
};

// 销毁编辑器
const destroyEditor = () => {
  if (editorInstance.value) {
    editorInstance.value.destroy();
    editorInstance.value = undefined;
  }
};

// 监听值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorInstance.value && newValue !== editorInstance.value.getHtml()) {
      editorInstance.value.setHtml(newValue);
    }
  }
);

// 监听禁用状态变化
watch(
  () => props.disabled,
  (newValue) => {
    if (editorInstance.value) {
      editorInstance.value.updateConfig({
        readOnly: newValue
      });
    }
  }
);

// 组件挂载
onMounted(() => {
  setEditorHeight();
  nextTick(() => {
    initEditor();
  });
});

// 组件卸载
onBeforeUnmount(() => {
  destroyEditor();
});

// 暴露方法
defineExpose({
  getEditorInstance: () => editorInstance.value,
  setHtml: (html: string) => editorInstance.value?.setHtml(html),
  getHtml: () => editorInstance.value?.getHtml(),
  getSelectionText: () => editorInstance.value?.getSelectionText(),
  clear: () => editorInstance.value?.clear(),
  focus: () => editorInstance.value?.focus(),
  blur: () => editorInstance.value?.blur(),
  isEmpty: () => editorInstance.value?.isEmpty()
});
</script>

<style scoped>
.re-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.editor-container {
  width: 100%;
  overflow-y: auto;
}

:deep(.w-e-text-container) {
  z-index: 1;
}

:deep(.w-e-toolbar) {
  z-index: 2;
  border-bottom: 1px solid #dcdfe6;
}
</style> 
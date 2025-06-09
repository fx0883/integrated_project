<script setup lang="ts">
import { computed } from "vue";
import { isUrl } from "@pureadmin/utils";
import { menuType } from "@/layout/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";

const props = defineProps<{
  to: menuType;
}>();

const isExternalLink = computed(() => isUrl(props.to.name));
const getLinkProps = (item: menuType) => {
  if (isExternalLink.value) {
    return {
      href: item.name,
      target: "_blank",
      rel: "noopener"
    };
  }
  return {
    to: item
  };
};

// 添加点击事件处理函数，确保点击菜单时添加标签页
const handleClick = () => {
  if (!isExternalLink.value && props.to) {
    // 如果不是外部链接，添加标签页
    const { path, name, meta } = props.to;
    
    // 只有当路径有效时才添加标签页
    if (path) {
      // 检查标签是否已存在
      const multiTagsStore = useMultiTagsStoreHook();
      const tagExists = multiTagsStore.multiTags.some(item => item.path === path);
      
      // 如果标签不存在，添加新标签
      if (!tagExists) {
        multiTagsStore.handleTags("push", {
          path,
          name,
          meta
        });
      }
    }
  }
};
</script>

<template>
  <component
    :is="isExternalLink ? 'a' : 'router-link'"
    v-bind="getLinkProps(to)"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

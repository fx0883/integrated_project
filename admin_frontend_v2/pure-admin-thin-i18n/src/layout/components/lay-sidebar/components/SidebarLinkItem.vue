<script setup lang="ts">
import { computed } from "vue";
import { isUrl } from "@pureadmin/utils";
import { menuType } from "@/layout/types";
import logger from "@/utils/logger";

const props = defineProps<{
  to: menuType;
}>();

const isExternalLink = computed(() => isUrl(props.to.name));
const getLinkProps = (item: menuType) => {
  logger.debug("[菜单导航] 菜单项导航属性:", item);
  if (isExternalLink.value) {
    logger.debug("[菜单导航] 外部链接:", item.name);
    return {
      href: item.name,
      target: "_blank",
      rel: "noopener"
    };
  }
  logger.debug("[菜单导航] 内部路由导航:", item.path);
  return {
    to: item
  };
};
</script>

<template>
  <component
    :is="isExternalLink ? 'a' : 'router-link'"
    v-bind="getLinkProps(to)"
    @click="() => logger.debug('[菜单导航] 点击菜单项:', to.path)"
  >
    <slot />
  </component>
</template>

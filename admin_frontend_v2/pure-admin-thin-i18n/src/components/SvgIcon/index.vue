<template>
  <div class="svg-icon" :style="getStyle">
    <svg-icon-loading v-if="name === 'loading'" />
    <svg-icon-no-data v-else-if="name === 'no-data'" />
    <svg-icon-failed v-else-if="name === 'failed'" />
    <el-icon v-else :size="size" :color="color">
      <component :is="name" v-if="name" />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SvgIconLoading from "./loading.vue";
import SvgIconNoData from "./no-data.vue";
import SvgIconFailed from "./failed.vue";

const { t } = useI18n();

defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 16
  },
  color: {
    type: String,
    default: ""
  },
  width: {
    type: [Number, String],
    default: ""
  },
  height: {
    type: [Number, String],
    default: ""
  }
});

const getStyle = computed(() => {
  const style: Record<string, string> = {};
  if (typeof width === "number" || typeof width === "string") {
    style.width = `${width}px`;
  }
  if (typeof height === "number" || typeof height === "string") {
    style.height = `${height}px`;
  }
  return style;
});
</script>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
</style>

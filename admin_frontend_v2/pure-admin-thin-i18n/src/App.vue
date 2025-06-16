<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
    <StagewiseToolbar :config="stagewise" />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";

// Import Stagewise components
import { StagewiseToolbar } from "@stagewise/toolbar-vue";
import { VuePlugin } from "@stagewise-plugins/vue";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
    StagewiseToolbar
  },
  computed: {
    currentLocale() {
      return this.$storage.locale?.locale === "zh" ? zhCn : en;
    },
    stagewise() {
      // Only enable in development mode
      return {
        plugins: [VuePlugin],
        enabled: import.meta.env.DEV
      };
    }
  }
});
</script>

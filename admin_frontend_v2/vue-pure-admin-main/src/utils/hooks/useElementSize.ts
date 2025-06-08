import { App } from "vue";
import { useElementSize as vueUseElementSize } from "@vueuse/core";

/**
 * 元素尺寸钩子
 */
export const useElementSize = {
  install(app: App) {
    // 全局注册useElementSize
    app.config.globalProperties.$elementSize = vueUseElementSize;
    
    console.log("[钩子] 注册useElementSize钩子");
  }
}; 
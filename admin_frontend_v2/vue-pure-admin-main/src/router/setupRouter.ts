import { App } from "vue";
import { router } from "./index";

/**
 * 设置路由
 * @param app Vue应用实例
 */
export function setupRouter(app: App) {
  console.log("[路由] 设置路由");
  
  // 这里可以添加全局路由相关的设置
  // 例如路由错误处理、全局导航守卫等
  
  return router;
} 
import { App } from 'vue';
import iconifyIconOnline from "./src/iconifyIconOnline";
import { withInstall } from "@/utils/withInstall";

// 注册组件
const IconifyIconOnline = withInstall(iconifyIconOnline);

// 导出组件
export { IconifyIconOnline };

// 导出默认组件
export default {
  install(app: App) {
    app.component(IconifyIconOnline.name, IconifyIconOnline);
  }
}; 
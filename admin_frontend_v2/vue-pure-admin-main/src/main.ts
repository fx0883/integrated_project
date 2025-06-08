import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { useI18n } from "@/plugins/i18n";
import { getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { useEcharts } from "@/plugins/echarts";
import { createApp, type Directive } from "vue";
import { useVxeTable } from "@/plugins/vxeTable";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";
import { usePermissionStoreHook } from "@/store/modules/permission";

// 添加应用初始化日志
console.group("[应用初始化] 开始加载应用");
console.time("[应用初始化] 总耗时");
console.log(`[应用初始化] 时间: ${new Date().toLocaleString()}`);

import Table from "@pureadmin/table";
import PureDescriptions from "@pureadmin/descriptions";

// 引入重置样式
import "./style/reset.scss";
// 导入公共样式
import "./style/index.scss";
// 一定要在main.ts中导入tailwind.css，防止vite每次hmr都会请求src/style/index.scss整体css文件导致热更新慢的问题
import "./style/tailwind.css";
import "element-plus/dist/index.css";
// 导入字体图标
import "./assets/iconfont/iconfont.js";
import "./assets/iconfont/iconfont.css";

console.log("[应用初始化] 样式和图标加载完成");

const app = createApp(App);
console.log("[应用初始化] Vue应用实例创建完成");

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 注册权限指令
import { setupPermissionDirectives } from "@/directives/permission";
setupPermissionDirectives(app);
console.log("[应用初始化] 指令注册完成");

// 全局注册@iconify/vue图标库
import {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon
} from "./components/ReIcon";
app.component("IconifyIconOffline", IconifyIconOffline);
app.component("IconifyIconOnline", IconifyIconOnline);
app.component("FontIcon", FontIcon);

// 全局注册按钮级别权限组件
import { Auth } from "@/components/ReAuth";
import { Perms } from "@/components/RePerms";
app.component("Auth", Auth);
app.component("Perms", Perms);

// 全局注册自定义组件
import ReEditor from "@/components/ReEditor/index.vue";
import ReImageUploader from "@/components/ReImageUploader/index.vue";
import ReTagSelector from "@/components/ReTagSelector/index.vue";
import ReTenantSelector from "@/components/ReTenantSelector/index.vue";
app.component("ReEditor", ReEditor);
app.component("ReImageUploader", ReImageUploader);
app.component("ReTagSelector", ReTagSelector);
app.component("ReTenantSelector", ReTenantSelector);
console.log("[应用初始化] 全局组件注册完成");

// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
app.use(VueTippy);

// 导入图片懒加载指令
import lazyLoad from "@/directives/lazyLoad";

// 注册图片懒加载指令
app.use(lazyLoad);
console.log("[应用初始化] 插件注册完成");

getPlatformConfig(app).then(async config => {
  console.log("[应用初始化] 平台配置加载完成", config);
  
  console.log("[应用初始化] 开始设置状态管理");
  setupStore(app);
  
  console.log("[应用初始化] 开始设置路由");
  app.use(router);
  
  console.log("[应用初始化] 等待路由就绪");
  await router.isReady();
  console.log("[应用初始化] 路由就绪完成");
  
  injectResponsiveStorage(app, config);
  console.log("[应用初始化] 响应式存储注入完成");
  
  app
    .use(MotionPlugin)
    .use(useI18n)
    .use(useElementPlus)
    .use(Table)
    .use(useVxeTable)
    .use(PureDescriptions)
    .use(useEcharts);
  
  console.log("[应用初始化] 所有插件加载完成，准备挂载应用");
  
  app.mount("#app");
  console.log("[应用初始化] 应用挂载完成");
  console.timeEnd("[应用初始化] 总耗时");
  console.groupEnd();
});

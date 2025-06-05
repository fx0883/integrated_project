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

const app = createApp(App);

// 自定义指令
import * as directives from "@/directives";
Object.keys(directives).forEach(key => {
  app.directive(key, (directives as { [key: string]: Directive })[key]);
});

// 注册权限指令
import { setupPermissionDirectives } from "@/directives/permission";
setupPermissionDirectives(app);

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

// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
app.use(VueTippy);

// 导入图片懒加载指令
import lazyLoad from "@/directives/lazyLoad";

// 注册图片懒加载指令
app.use(lazyLoad);

// 添加全局错误捕获并记录日志，帮助定位循环引用问题
// 这个必须添加在最前面，所有其他导入之前
window.addEventListener('error', (event) => {
  if (event.error?.stack?.includes('@pureadmin_utils')) {
    console.error('========================');
    console.error('[错误捕获] @pureadmin/utils 模块错误:');
    console.error('错误消息:', event.error?.message);
    console.error('错误堆栈:', event.error?.stack);
    console.error('错误对象:', event.error);
    console.error('错误位置:', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    console.error('========================');
    
    // 防止错误传播导致应用崩溃
    event.preventDefault();
  }
});

getPlatformConfig(app).then(async config => {
  setupStore(app);
  app.use(router);
  await router.isReady();
  injectResponsiveStorage(app, config);
  app
    .use(MotionPlugin)
    .use(useI18n)
    .use(useElementPlus)
    .use(Table)
    .use(useVxeTable)
    .use(PureDescriptions)
    .use(useEcharts);
  app.mount("#app");
});

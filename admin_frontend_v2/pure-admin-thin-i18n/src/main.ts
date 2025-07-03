import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { useI18n } from "@/plugins/i18n";
import { getPlatformConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { useEcharts } from "@/plugins/echarts";
import { createApp, type Directive } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { injectResponsiveStorage } from "@/utils/responsive";
import logger from "@/utils/logger"; // 导入日志工具

import Table from "@pureadmin/table";
// import PureDescriptions from "@pureadmin/descriptions";

import { registerGlobalComponents } from "@/components";

// 初始化日志配置
logger.configure({
  enabled: true,
  level: logger.LogLevel.DEBUG,
  apiLogging: true,
  apiLogFullResponse: true,
  useColors: true,
  consoleOutput: true // 设置为false可以禁止输出到控制台
});

// 测试日志输出
console.log("原生console.log测试");
logger.debug("测试日志输出 - DEBUG");
logger.info("测试日志输出 - INFO");
logger.warn("测试日志输出 - WARN");
logger.error("测试日志输出 - ERROR");

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

// 全局注册vue-tippy
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import VueTippy from "vue-tippy";
app.use(VueTippy);

// 注册全局组件
registerGlobalComponents(app);

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
    // .use(PureDescriptions)
    .use(useEcharts);
  app.mount("#app");

  // 应用挂载后再次测试日志
  console.log("应用挂载后 - 原生console.log测试");
  logger.debug("应用挂载后 - 测试日志输出 - DEBUG");
  logger.info("应用挂载后 - 测试日志输出 - INFO");
  logger.warn("应用挂载后 - 测试日志输出 - WARN");
  logger.error("应用挂载后 - 测试日志输出 - ERROR");
});

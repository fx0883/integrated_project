import SvgIcon from './SvgIcon/index.vue';
import type { App } from 'vue';

// 注册全局组件
export function registerGlobalComponents(app: App): void {
  app.component('svg-icon', SvgIcon);
}

export {
  SvgIcon
}; 
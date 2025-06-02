import { App, Component } from 'vue';

/**
 * 组件注册函数
 * 用于将组件转换为支持app.use()的插件格式
 */
export const withInstall = <T extends Component>(component: T) => {
  (component as any).install = (app: App) => {
    app.component((component as any).name, component);
  };
  return component as T & { install: (app: App) => void };
}; 
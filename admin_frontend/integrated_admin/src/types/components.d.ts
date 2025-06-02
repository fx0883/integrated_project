// 组件类型定义
import { DefineComponent } from 'vue'

// ElementPlus组件类型增强
declare module 'element-plus/es/components' {
  // 可以在这里添加Element Plus组件的类型扩展
}

// 全局组件类型声明
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    // 在这里声明全局组件类型
  }
} 
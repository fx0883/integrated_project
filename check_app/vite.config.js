import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  server: {
    hmr: {
      overlay: false  // 禁用HMR错误覆盖层
    }
  },
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/src'  // 设置路径别名，减少相对路径的使用
    }
  },
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       // 全局引入uni.scss，确保所有SCSS文件都能访问变量
  //       additionalData: `@import "@/uni.scss";`
  //     }
  //   }
  // },
  // 日志，方便调试
  // eslint-disable-next-line no-console
  // Vite 配置已加载
  // console.log('Vite SCSS additionalData 配置已生效');
})

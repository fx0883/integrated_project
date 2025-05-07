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
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  optimizeDeps: {
    include: ['vue-cropper'] // 预构建vue-cropper
  },
  build: {
    chunkSizeWarningLimit: 1000, // 增加块大小警告限制
    reportCompressedSize: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-cropper': ['vue-cropper'], // 将vue-cropper单独打包
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    hmr: true,
    watch: {
      usePolling: true // 使用轮询监听文件变化，解决某些环境下的文件监听问题
    }
  }
}) 
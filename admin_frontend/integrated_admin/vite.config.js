import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  optimizeDeps: {
    include: ['vue-cropper'] // 预构建vue-cropper
  },
  build: {
    chunkSizeWarningLimit: 1000, // 增加块大小警告限制
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-cropper': ['vue-cropper'] // 将vue-cropper单独打包
        }
      }
    }
  },
  server: {
    hmr: true,
    watch: {
      usePolling: true // 使用轮询监听文件变化，解决某些环境下的文件监听问题
    }
  }
})

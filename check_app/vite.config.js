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


// 原来的代码
 
// 添加代码
/** ==== 处理 tailwind cli 的自动启动和打包 ==== */
const child_process = require('child_process');
let tailwindMode = process.env.NODE_ENV;
// 主进程输出
console.log(`[tailwindcss] 开始${tailwindMode == 'production' ? '生产环境打包' : '开发模式监听'}`);
child_process.exec(
    // 这里指令对应 package.json 中的 npm scripts  
    tailwindMode == 'production'?'npm run tailwind-build':'npm run tailwind-dev',
    {
        cwd: __dirname, // 切换目录到当前项目，必须
    },
    (error, stdout, stderr) => {
        // tailwind --watch 是一个持久进程，不会立即执行回调  
        // process.stdout.write('tailwind success')  
        if (error) {  
            console.error('[tailwindcss] 异常，请检查');  
            console.error(error);  
            console.error(stdout);  
            console.error(stderr);  
        }  
        if(tailwindMode == 'production'){  
            console.log('[tailwindcss] 生产环境打包完成');  
        }  
    }
)
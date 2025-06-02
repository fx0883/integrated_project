import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import router from './router'
import './assets/styles/index.css'
// 预加载vue-cropper样式
import 'vue-cropper/dist/index.css'

// 引入并注册所有Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 添加路由调试信息
console.log('===== 应用初始化 =====')
console.log('已注册的路由:', router.getRoutes().map(route => ({ 
  path: route.path,
  name: route.name,
  components: Object.keys(route.components || {})
})))

const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(ElementPlus)
app.use(createPinia())
app.use(router)

app.mount('#app')

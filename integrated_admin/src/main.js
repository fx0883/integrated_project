import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import router from './router'
import './assets/styles/index.css'

const app = createApp(App)

// 使用插件
app.use(ElementPlus)
app.use(createPinia())
app.use(router)

app.mount('#app')

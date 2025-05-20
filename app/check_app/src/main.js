import {
	createSSRApp
} from "vue";
import { createPinia } from 'pinia'
import App from "./App.vue";

// 导入国际化设置
import i18n from './i18n'

// 导入全局样式
import './uni.scss'

export function createApp() {
	const app = createSSRApp(App);
	
	// 使用 Pinia 状态管理
	const pinia = createPinia()
	app.use(pinia)
	
	// 使用国际化
	app.use(i18n)
	
	// 全局错误处理
	app.config.errorHandler = (err, vm, info) => {
		console.error('全局错误:', err, info)
	}

	return {
		app,
	};
}

import { createPinia } from 'pinia'
import useAuthStore from './modules/auth'

const pinia = createPinia()

export {
  useAuthStore
}

export default pinia 
import { createPinia } from 'pinia'
import useAuthStore from './modules/auth'
import useArticleStore from './modules/article'
import useCategoryStore from './modules/category'
import useTagStore from './modules/tag'
import useCommentStore from './modules/comment'
import useStatisticsStore from './modules/statistics'

const pinia = createPinia()

export {
  useAuthStore,
  useArticleStore,
  useCategoryStore,
  useTagStore,
  useCommentStore,
  useStatisticsStore
}

export default pinia 
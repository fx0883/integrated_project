import authApi from './auth'
import userApi from './user'
import tenantApi from './tenant'
import articleApi from './article'
import categoryApi from './category'
import tagApi from './tag'
import commentApi from './comment'
import statisticsApi from './statistics'
import checkApi from './check'
import menuApi from './menu'

export {
  authApi,
  userApi,
  tenantApi,
  articleApi,
  categoryApi,
  tagApi,
  commentApi,
  statisticsApi,
  checkApi,
  menuApi
}

export default {
  auth: authApi,
  user: userApi,
  tenant: tenantApi,
  article: articleApi,
  category: categoryApi,
  tag: tagApi,
  comment: commentApi,
  statistics: statisticsApi,
  check: checkApi,
  menu: menuApi
} 
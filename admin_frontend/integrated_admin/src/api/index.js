import authApi from './auth'
import userApi from './user'
import tenantApi from './tenant'
import articleApi from './article'
import categoryApi from './category'
import tagApi from './tag'
import commentApi from './comment'
import statisticsApi from './statistics'
import checkApi from './check'

export {
  authApi,
  userApi,
  tenantApi,
  articleApi,
  categoryApi,
  tagApi,
  commentApi,
  statisticsApi,
  checkApi
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
  check: checkApi
} 
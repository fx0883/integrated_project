import authApi from './auth'
import userApi from './user'
import tenantApi from './tenant'

export {
  authApi,
  userApi,
  tenantApi
}

export default {
  auth: authApi,
  user: userApi,
  tenant: tenantApi
} 
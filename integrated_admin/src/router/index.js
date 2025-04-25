import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '../stores'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 导航守卫
router.beforeEach(async (to, from, next) => {
  console.log('===== 路由导航开始 =====')
  console.log(`从路由: ${from.path} 导航到: ${to.path}`)
  
  // 获取认证状态
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated // 确保使用正确的getter名称
  console.log('当前认证状态:', isAuthenticated ? '已认证' : '未认证')
  
  // 获取路由元数据
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const requiredRoles = to.matched.find(record => record.meta.roles)?.meta.roles
  
  console.log('目标路由信息:', {
    path: to.path,
    requiresAuth,
    requiredRoles: requiredRoles || '无角色要求'
  })
  
  // 记录原始路径，用于登录后重定向
  if (requiresAuth && !isAuthenticated && to.path !== '/login') {
    console.log('需要登录认证但未认证，重定向到登录页')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // 如果不需要登录认证，直接放行
  if (!requiresAuth) {
    console.log('路由不需要认证，直接放行')
    next()
    return
  }
  
  // 确保用户已登录且获取了用户信息
  if (isAuthenticated) {
    console.log('用户已认证，检查用户信息')
    if (!authStore.user) {
      console.log('用户已认证但缺少用户信息，正在获取用户信息')
      try {
        await authStore.getProfile()
        console.log('成功获取用户信息')
      } catch (error) {
        console.error('获取用户信息失败', error)
        // 如果获取用户信息失败，可能是token无效，清除登录状态并重定向到登录页
        console.log('获取用户信息失败，执行登出操作')
        authStore.logout()
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }
    
    console.log('用户角色:', authStore.user.is_super_admin ? '超级管理员' : (authStore.user.is_admin ? '租户管理员' : '普通用户'))
    
    // 登录成功后，检查是否为租户管理员或超级管理员
    if (!authStore.user.is_admin && !authStore.user.is_super_admin) {
      console.log('用户既不是超级管理员也不是租户管理员，重定向到403页面')
      next({ path: '/403' })
      return
    }
    
    // 检查特定路由的角色权限
    // if (requiredRoles) {
    //   console.log('检查路由所需角色:', requiredRoles)
    //   // 路由需要超级管理员权限，但用户不是超级管理员
    //   if (requiredRoles.includes('super_admin') && !authStore.user.is_super_admin) {
    //     console.log('路由需要超级管理员权限，但用户不是超级管理员，重定向到403页面')
    //     next({ path: '/403' })
    //     return
    //   }
    // }
    
    // 租户管理员不能访问租户管理页面
    if (authStore.user.is_admin && !authStore.user.is_super_admin && 
        to.path.startsWith('/tenants')) {
      console.log('租户管理员尝试访问租户管理页面，重定向到403页面')
      next({ path: '/403' })
      return
    }
    
    // 通过所有检查，放行请求
    console.log('用户权限验证通过，允许访问路由:', to.path)
    next()
  } else {
    // 未登录，重定向到登录页
    console.log('用户未登录，重定向到登录页面')
    next({ path: '/login', query: { redirect: to.fullPath } })
  }
  
  console.log('===== 路由导航处理完成 =====')
})

export default router
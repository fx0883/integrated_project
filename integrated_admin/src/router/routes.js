// 路由配置
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { 
      requiresAuth: false,
      title: '登录' 
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { 
      requiresAuth: false,
      title: '注册'
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPassword.vue'),
    meta: { 
      requiresAuth: false,
      title: '忘记密码'
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Index.vue'),
        meta: { 
          title: '仪表盘', 
          icon: 'Odometer'
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/user/List.vue'),
        meta: { 
          title: '用户列表', 
          icon: 'User', 
          roles: ['admin', 'super_admin'] 
        }
      },
      {
        path: 'users/create',
        name: 'CreateUser',
        component: () => import('../views/user/Create.vue'),
        meta: { 
          title: '创建用户',
          roles: ['admin', 'super_admin']
        }
      },
      {
        path: 'users/edit/:id',
        name: 'EditUser',
        component: () => import('../views/user/Edit.vue'),
        meta: { 
          title: '编辑用户', 
          hidden: true,
          roles: ['admin', 'super_admin']
        }
      },
      {
        path: 'users/view/:id',
        name: 'ViewUser',
        component: () => import('../views/user/View.vue'),
        meta: { 
          title: '查看用户', 
          hidden: true,
          roles: ['admin', 'super_admin']
        }
      },
      {
        path: 'users/login-history/:id',
        name: 'UserLoginHistory',
        component: () => import('../views/user/LoginHistory.vue'),
        meta: { 
          title: '登录历史', 
          hidden: true,
          roles: ['admin', 'super_admin']
        }
      },
      {
        path: 'tenants',
        name: 'Tenants',
        component: () => import('../views/tenant/List.vue'),
        meta: { 
          title: '租户列表', 
          icon: 'OfficeBuilding', 
          roles: ['super_admin'] 
        }
      },
      {
        path: 'tenants/create',
        name: 'CreateTenant',
        component: () => import('../views/tenant/Create.vue'),
        meta: { 
          title: '创建租户',
          roles: ['super_admin']
        }
      },
      {
        path: 'tenants/edit/:id',
        name: 'EditTenant',
        component: () => import('../views/tenant/Edit.vue'),
        meta: { 
          title: '编辑租户', 
          hidden: true,
          roles: ['super_admin']
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/Index.vue'),
        meta: { 
          title: '个人设置', 
          icon: 'Setting' 
        }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('../views/about/Index.vue'),
        meta: { 
          title: '关于我们',
          hidden: true
        }
      },
      {
        path: 'privacy',
        name: 'Privacy',
        component: () => import('../views/legal/Privacy.vue'),
        meta: { 
          title: '隐私政策',
          hidden: true
        }
      },
      {
        path: 'terms',
        name: 'Terms',
        component: () => import('../views/legal/Terms.vue'),
        meta: { 
          title: '使用条款',
          hidden: true 
        }
      },
      {
        path: 'help',
        name: 'Help',
        component: () => import('../views/help/Index.vue'),
        meta: { 
          title: '帮助中心',
          hidden: true
        }
      }
    ]
  },
  // 错误页面
  {
    path: '/403',
    name: '403',
    component: () => import('../views/error/403.vue'),
    meta: { 
      requiresAuth: false, 
      hidden: true,
      title: '403 - 禁止访问'
    }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('../views/error/404.vue'),
    meta: { 
      requiresAuth: false, 
      hidden: true,
      title: '404 - 页面未找到'
    }
  },
  // 通配符路由，匹配所有未定义的路由，重定向到404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

export default routes 
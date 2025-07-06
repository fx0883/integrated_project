# 会员管理路由配置示例

以下是会员管理功能的路由配置示例代码，包括会员列表、详情、创建和编辑等页面的路由定义。

## 会员路由模块 (`src/router/modules/member.ts`)

```typescript
import { RouteRecordRaw } from "vue-router";

// 会员管理相关路由
const memberRoutes: RouteRecordRaw = {
  path: "/member",
  name: "MemberManagement",
  component: () => import("@/layout/index.vue"),
  redirect: "/member/index",
  meta: {
    title: "member.memberManagement",
    icon: "user-group",
    rank: 5 // 菜单排序
  },
  children: [
    {
      path: "index",
      name: "MemberList",
      component: () => import("@/views/member/index.vue"),
      meta: {
        title: "member.memberList",
        icon: "user-list",
        roles: ["super", "admin"] // 超级管理员和租户管理员可访问
      }
    },
    {
      path: "create",
      name: "MemberCreate",
      component: () => import("@/views/member/create.vue"),
      meta: {
        title: "member.createMember",
        icon: "user-add",
        roles: ["super", "admin"], // 超级管理员和租户管理员可访问
        hidden: true // 在菜单中隐藏
      }
    },
    {
      path: "edit/:id",
      name: "MemberEdit",
      component: () => import("@/views/member/edit.vue"),
      meta: {
        title: "member.editMember",
        roles: ["super", "admin"], // 超级管理员和租户管理员可访问
        hidden: true, // 在菜单中隐藏
        activeMenu: "/member/index" // 激活菜单项
      },
      props: route => ({
        id: Number(route.params.id)
      })
    },
    {
      path: "detail/:id",
      name: "MemberDetail",
      component: () => import("@/views/member/detail.vue"),
      meta: {
        title: "member.memberDetail",
        roles: ["super", "admin", "member"], // 超级管理员、租户管理员和普通成员可访问
        hidden: true, // 在菜单中隐藏
        activeMenu: "/member/index" // 激活菜单项
      },
      props: route => ({
        id: Number(route.params.id)
      })
    }
  ]
};

export default memberRoutes;
```

## 在主路由配置中注册会员路由 (`src/router/index.ts`)

```typescript
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useUserStoreHook } from "@/store/modules/user";
import { useNProgress } from "@/hooks/useNProgress";
import { getToken } from "@/utils/auth";
import { isEmpty } from "@/utils/is";

// 引入路由模块
import memberRoutes from "./modules/member";
// 引入其他路由模块...

// 静态路由
const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "login"
    }
  },
  {
    path: "/",
    name: "Home",
    component: () => import("@/layout/index.vue"),
    redirect: "/welcome",
    children: [
      {
        path: "welcome",
        name: "Welcome",
        component: () => import("@/views/welcome/index.vue"),
        meta: {
          title: "welcome",
          icon: "home"
        }
      }
    ]
  },
  // 其他静态路由...
];

// 动态路由
const asyncRoutes: RouteRecordRaw[] = [
  memberRoutes,
  // 其他动态路由...
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          const top: number = document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        }
      }
    });
  }
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  useNProgress().start();
  const userStore = useUserStoreHook();
  const permissionStore = usePermissionStoreHook();
  
  // 判断是否有Token
  if (getToken()) {
    // 如果是登录页，直接跳转到首页
    if (to.path === "/login") {
      next({ path: "/" });
      useNProgress().done();
    } else {
      // 判断用户信息是否存在
      if (userStore.username) {
        // 判断是否已经加载了权限路由
        if (permissionStore.wholeMenus.length === 0) {
          permissionStore.generateRoutes(asyncRoutes).then(() => {
            permissionStore.wholeMenus.forEach((route: RouteRecordRaw) => {
              router.addRoute(route);
            });
            // 确保路由已添加完成
            next({ ...to, replace: true });
          });
        } else {
          next();
        }
      } else {
        // 获取用户信息
        userStore.getUserInfo().then(() => {
          permissionStore.generateRoutes(asyncRoutes).then(() => {
            permissionStore.wholeMenus.forEach((route: RouteRecordRaw) => {
              router.addRoute(route);
            });
            // 确保路由已添加完成
            next({ ...to, replace: true });
          });
        }).catch(() => {
          userStore.logout().then(() => {
            next({ path: "/login", query: { redirect: to.path } });
          });
        });
      }
    }
  } else {
    // 没有Token
    if (to.meta.requiresAuth === false) {
      // 不需要Token的页面
      next();
    } else {
      // 需要Token的页面，跳转到登录页
      next({ path: "/login", query: { redirect: to.path } });
      useNProgress().done();
    }
  }
});

router.afterEach(() => {
  useNProgress().done();
});

export default router;
```

## 权限控制

会员管理功能的权限控制是基于角色和权限的。在路由配置中，我们使用`roles`属性来定义哪些角色可以访问特定的路由。例如，只有超级管理员和租户管理员可以访问会员列表和创建/编辑会员页面，而普通成员只能访问自己的详情页面。

此外，我们还可以使用权限指令来控制页面中特定元素的显示：

```vue
<template>
  <!-- 只有具有member:create权限的用户才能看到创建按钮 -->
  <el-button v-auth="'member:create'" type="primary">
    {{ t("member.createMember") }}
  </el-button>
  
  <!-- 使用ReAuth组件控制内容显示 -->
  <ReAuth auth="member:edit">
    <el-button type="primary">
      {{ t("member.editMember") }}
    </el-button>
  </ReAuth>
</template>
```

在实际开发中，我们需要根据后端提供的权限控制API来实现前端的权限控制。通常，我们会在用户登录后获取用户的角色和权限信息，然后根据这些信息来控制路由和UI元素的显示。 
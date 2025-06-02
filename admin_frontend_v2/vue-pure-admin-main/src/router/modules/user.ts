import { RouteRecordRaw } from "vue-router";
import { permission } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

const userRoutes: RouteRecordRaw = {
  path: "/user",
  component: Layout,
  redirect: "/user/list",
  meta: {
    title: "用户管理",
    icon: "ri:user-line",
    rank: permission
  },
  children: [
    {
      path: "list",
      name: "UserList",
      component: () => import("@/views/user/list/index.vue"),
      meta: {
        title: "用户列表",
        roles: ["admin"]
      }
    },
    {
      path: "detail/:id",
      name: "UserDetail",
      component: () => import("@/views/user/detail/index.vue"),
      meta: {
        title: "用户详情",
        showLink: false,
        activePath: "/user/list",
        roles: ["admin"]
      }
    }
  ]
};

export default userRoutes; 
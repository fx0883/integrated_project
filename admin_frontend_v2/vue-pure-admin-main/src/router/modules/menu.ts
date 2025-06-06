import { $t } from "@/plugins/i18n";
import { permission } from "@/router/enums";
import { RouteRecordRaw } from "vue-router";

const Layout = () => import("@/layout/index.vue");

const menuRoutes: RouteRecordRaw = {
  path: "/menu",
  name: "Menu",
  component: Layout,
  redirect: "/menu/list",
  meta: {
    icon: "ep/menu",
    title: "菜单管理",
    rank: permission,
    roles: ["super_admin"]  // 只有超级管理员可见
  },
  children: [
    {
      path: "list",
      name: "MenuList",
      component: () => import("@/views/menu/index.vue"),
      meta: {
        title: "菜单列表",
        roles: ["super_admin"]  // 只有超级管理员可见
      }
    }
  ]
};

export default menuRoutes; 
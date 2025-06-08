import { $t } from "@/plugins/i18n";
import { error } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/error",
  redirect: "/error/404",
  component: Layout,
  meta: {
    icon: "ri/information-line",
    showLink: false,
    title: $t("menus.pureAbnormal"),
    rank: error
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: $t("menus.pureFourZeroOne"),
        showLink: false
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: $t("menus.pureFourZeroFour"),
        showLink: false
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: $t("menus.pureFive"),
        showLink: false
      }
    },
    {
      path: "/error/route-error",
      name: "RouteError",
      component: () => import("@/views/error/route-error.vue"),
      meta: {
        title: "路由错误",
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;

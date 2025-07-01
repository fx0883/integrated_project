import { $t } from "@/plugins/i18n";

export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri/information-line",
    showLink: false,
    title: $t("menus.pureAbnormal"),
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      showLink: false,
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: $t("menus.pureFourZeroThree")
      }
    },
    {
      path: "/error/404",
      name: "404",
      showLink: false,
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: $t("menus.pureFourZeroFour")
      }
    },
    {
      path: "/error/500",
      name: "500",
      showLink: false,
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: $t("menus.pureFiveZeroZero")
      }
    }
  ]
} satisfies RouteConfigsTable;

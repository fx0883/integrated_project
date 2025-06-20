import { $t } from "@/plugins/i18n";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/profile",
  name: "Profile",
  component: Layout,
  redirect: "/profile/index",
  meta: {
    icon: "ep/user",
    title: $t("menus.profile"),
    rank: 10
  },
  children: [
    {
      path: "index",
      name: "ProfileIndex",
      component: () => import("@/views/admin-user/profile.vue"),
      meta: {
        title: $t("menus.profile")
      }
    }
  ]
} satisfies RouteConfigsTable; 
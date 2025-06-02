import { $t } from "@/plugins/i18n";
import { home } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/dashboard",
  name: "Dashboard",
  component: Layout,
  redirect: "/dashboard/index",
  meta: {
    icon: "ep/data-analysis",
    title: "仪表盘",
    rank: home
  },
  children: [
    {
      path: "/dashboard/index",
      name: "DashboardIndex",
      component: () => import("@/views/dashboard/index.vue"),
      meta: {
        title: "系统仪表盘",
        icon: "ep/monitor"
      }
    },
    {
      path: "/dashboard/admin",
      name: "AdminDashboard",
      component: () => import("@/views/dashboard/admin.vue"),
      meta: {
        title: "管理员仪表盘",
        icon: "ep/management",
        roles: ["super_admin"],
        showLink: false
      }
    },
    {
      path: "/dashboard/tenant",
      name: "TenantDashboard",
      component: () => import("@/views/dashboard/tenant.vue"),
      meta: {
        title: "租户仪表盘",
        icon: "ep/office-building",
        roles: ["tenant_admin"],
        showLink: false
      }
    },
    {
      path: "/dashboard/user",
      name: "UserDashboard",
      component: () => import("@/views/dashboard/user.vue"),
      meta: {
        title: "用户仪表盘",
        icon: "ep/user",
        roles: ["user"],
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable; 
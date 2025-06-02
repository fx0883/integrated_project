import { $t } from "@/plugins/i18n";
import { permission } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/tenant",
  name: "Tenant",
  component: Layout,
  redirect: "/tenant/list",
  meta: {
    icon: "ep/office-building",
    title: "租户管理",
    rank: permission
  },
  children: [
    {
      path: "/tenant/list",
      name: "TenantList",
      component: () => import("@/views/tenant/list.vue"),
      meta: {
        title: "租户列表"
      }
    },
    {
      path: "/tenant/detail/:id",
      name: "TenantDetail",
      component: () => import("@/views/tenant/detail.vue"),
      meta: {
        title: "租户详情",
        showLink: false,
        activePath: "/tenant/list"
      }
    },
    {
      path: "/tenant/create",
      name: "TenantCreate",
      component: () => import("@/views/tenant/form.vue"),
      meta: {
        title: "创建租户",
        showLink: false,
        activePath: "/tenant/list"
      }
    },
    {
      path: "/tenant/edit/:id",
      name: "TenantEdit",
      component: () => import("@/views/tenant/form.vue"),
      meta: {
        title: "编辑租户",
        showLink: false,
        activePath: "/tenant/list"
      }
    },
    {
      path: "/tenant/quota/:id",
      name: "TenantQuota",
      component: () => import("@/views/tenant/quota.vue"),
      meta: {
        title: "租户配额",
        showLink: false,
        activePath: "/tenant/list"
      }
    }
  ]
} satisfies RouteConfigsTable; 
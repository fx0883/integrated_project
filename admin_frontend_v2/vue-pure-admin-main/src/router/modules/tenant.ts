import { $t } from "@/plugins/i18n";
import { permission } from "@/router/enums";
import { RouteRecordRaw } from "vue-router";

const Layout = () => import("@/layout/index.vue");

const tenantRoutes: RouteRecordRaw = {
  path: "/tenant",
  name: "Tenant",
  component: Layout,
  redirect: "/tenant/list",
  meta: {
    icon: "ep/office-building",
    title: "租户管理",
    rank: permission,
    roles: ["super_admin"]
  },
  children: [
    {
      path: "list",
      name: "TenantList",
      component: () => import("@/views/tenant/list.vue"),
      meta: {
        title: "租户列表",
        roles: ["super_admin"]
      }
    },
    {
      path: "detail/:id",
      name: "TenantDetail",
      component: () => import("@/views/tenant/detail.vue"),
      meta: {
        title: "租户详情",
        showLink: false,
        activePath: "/tenant/list",
        roles: ["super_admin"]
      }
    },
    {
      path: "create",
      name: "TenantCreate",
      component: () => import("@/views/tenant/form.vue"),
      meta: {
        title: "创建租户",
        showLink: false,
        activePath: "/tenant/list",
        roles: ["super_admin"]
      }
    },
    {
      path: "edit/:id",
      name: "TenantEdit",
      component: () => import("@/views/tenant/form.vue"),
      meta: {
        title: "编辑租户",
        showLink: false,
        activePath: "/tenant/list",
        roles: ["super_admin"]
      }
    },
    {
      path: "quota/:id",
      name: "TenantQuota",
      component: () => import("@/views/tenant/quota.vue"),
      meta: {
        title: "租户配额",
        showLink: false,
        activePath: "/tenant/list",
        roles: ["super_admin"]
      }
    }
  ]
};

export default tenantRoutes; 
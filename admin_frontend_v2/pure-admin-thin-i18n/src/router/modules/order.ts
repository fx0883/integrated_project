import { $t } from "@/plugins/i18n";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/order",
  name: "Order",
  component: Layout,
  redirect: "/order/index",
  meta: {
    icon: "ep/tickets",
    title: $t("menus.pureOrder"),
    rank: 5 // 设置菜单显示顺序，数字越小越靠前
  },
  children: [
    {
      path: "/order/index",
      name: "OrderIndex",
      component: () => import("@/views/order/index.vue"),
      meta: {
        title: $t("order.orderList"),
        roles: ["admin", "common"]
      }
    },
    {
      path: "/order/statistics",
      name: "OrderStatistics",
      component: () => import("@/views/order/statistics.vue"),
      meta: {
        title: $t("order.statisticsTitle"),
        roles: ["admin", "common"]
      }
    },
    {
      path: "/order/create",
      name: "OrderCreate",
      component: () => import("@/views/order/create.vue"),
      meta: {
        title: $t("order.createOrder"),
        showLink: false, // 不在菜单中显示
        roles: ["admin"]
      }
    },
    {
      path: "/order/edit/:id",
      name: "OrderEdit",
      component: () => import("@/views/order/edit.vue"),
      meta: {
        title: $t("order.editOrder"),
        showLink: false, // 不在菜单中显示
        roles: ["admin"]
      }
    },
    {
      path: "/order/detail/:id",
      name: "OrderDetail",
      component: () => import("@/views/order/detail.vue"),
      meta: {
        title: $t("order.orderDetail"),
        showLink: false, // 不在菜单中显示
        roles: ["admin", "common"]
      }
    }
  ]
} satisfies RouteConfigsTable; 
import { $t } from "@/plugins/i18n";

export default {
  path: "/customer",
  name: "Customer",
  redirect: "/customer/index",
  meta: {
    title: $t("menus.customer"),
    icon: "ri:customer-service-2-line",
    rank: 7
  },
  children: [
    {
      path: "/customer/index",
      name: "CustomerList",
      component: () => import("@/views/customer/index.vue"),
      meta: {
        title: $t("menus.customerList"),
        icon: "ri:list-check"
      }
    },
    {
      path: "/customer/create",
      name: "CustomerCreate",
      component: () => import("@/views/customer/create.vue"),
      meta: {
        title: $t("menus.customerCreate"),
        icon: "ri:add-line",
        showLink: false
      }
    },
    {
      path: "/customer/edit/:id",
      name: "CustomerEdit",
      component: () => import("@/views/customer/edit.vue"),
      meta: {
        title: $t("menus.customerEdit"),
        icon: "ri:edit-line",
        showLink: false
      }
    },
    {
      path: "/customer/detail/:id",
      name: "CustomerDetail",
      component: () => import("@/views/customer/detail.vue"),
      meta: {
        title: $t("menus.customerDetail"),
        icon: "ri:file-list-line",
        showLink: false
      }
    }
  ]
}; 
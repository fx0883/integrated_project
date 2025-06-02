import { $t } from "@/plugins/i18n";
import { monitor } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/check",
  name: "Check",
  component: Layout,
  redirect: "/check/task/list",
  meta: {
    icon: "ep/calendar",
    title: "打卡系统",
    rank: monitor
  },
  children: [
    {
      path: "/check/category",
      name: "CheckCategory",
      component: () => import("@/views/check/category/index.vue"),
      meta: {
        title: "打卡类型"
      }
    },
    {
      path: "/check/task",
      name: "CheckTask",
      redirect: "/check/task/list",
      meta: {
        title: "打卡任务"
      },
      children: [
        {
          path: "/check/task/list",
          name: "CheckTaskList",
          component: () => import("@/views/check/task/list.vue"),
          meta: {
            title: "任务列表"
          }
        },
        {
          path: "/check/task/detail/:id",
          name: "CheckTaskDetail",
          component: () => import("@/views/check/task/detail.vue"),
          meta: {
            title: "任务详情",
            showLink: false,
            activePath: "/check/task/list"
          }
        },
        {
          path: "/check/task/create",
          name: "CheckTaskCreate",
          component: () => import("@/views/check/task/form.vue"),
          meta: {
            title: "创建任务",
            showLink: false,
            activePath: "/check/task/list"
          }
        },
        {
          path: "/check/task/edit/:id",
          name: "CheckTaskEdit",
          component: () => import("@/views/check/task/form.vue"),
          meta: {
            title: "编辑任务",
            showLink: false,
            activePath: "/check/task/list"
          }
        },
        {
          path: "/check/task/statistic/:id",
          name: "CheckTaskStatistic",
          component: () => import("@/views/check/task/statistic.vue"),
          meta: {
            title: "任务统计",
            showLink: false,
            activePath: "/check/task/list"
          }
        }
      ]
    },
    {
      path: "/check/record",
      name: "CheckRecord",
      component: () => import("@/views/check/record/index.vue"),
      meta: {
        title: "打卡记录"
      }
    },
    {
      path: "/check/report",
      name: "CheckReport",
      component: () => import("@/views/check/report/index.vue"),
      meta: {
        title: "统计报表"
      }
    }
  ]
} satisfies RouteConfigsTable; 
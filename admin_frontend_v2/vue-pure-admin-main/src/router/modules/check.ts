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
      path: "category",
      name: "CheckCategory",
      component: () => import("@/views/check/category/index.vue"),
      meta: {
        title: "打卡类型"
      }
    },
    {
      path: "task",
      name: "CheckTask",
      redirect: "task/list",
      meta: {
        title: "打卡任务"
      },
      children: [
        {
          path: "list",
          name: "CheckTaskList",
          component: () => import("@/views/check/task/list.vue"),
          meta: {
            title: "任务列表"
          }
        },
        {
          path: "detail/:id",
          name: "CheckTaskDetail",
          component: () => import("@/views/check/task/detail.vue"),
          meta: {
            title: "任务详情",
            showLink: false,
            activePath: "/check/task/list"
          }
        },
        {
          path: "create",
          name: "CheckTaskCreate",
          component: () => import("@/views/check/task/form.vue"),
          meta: {
            title: "创建任务",
            showLink: false,
            activePath: "/check/task/list"
          }
        },
        {
          path: "edit/:id",
          name: "CheckTaskEdit",
          component: () => import("@/views/check/task/form.vue"),
          meta: {
            title: "编辑任务",
            showLink: false,
            activePath: "/check/task/list"
          }
        },
        {
          path: "statistic/:id",
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
      path: "record",
      name: "CheckRecord",
      component: () => import("@/views/check/record/index.vue"),
      meta: {
        title: "打卡记录"
      }
    },
    {
      path: "report",
      name: "CheckReport",
      component: () => import("@/views/check/report/index.vue"),
      meta: {
        title: "统计报表"
      }
    }
  ]
} satisfies RouteConfigsTable; 
import { $t } from "@/plugins/i18n";
import { system } from "@/router/enums";

const Layout = () => import("@/layout/index.vue");

export default {
  path: "/cms",
  name: "CMS",
  component: Layout,
  redirect: "/cms/article/list",
  meta: {
    icon: "ep/document",
    title: "内容管理",
    rank: system
  },
  children: [
    {
      path: "statistics",
      name: "CMSStatistics",
      component: () => import("@/views/cms/statistics/index.vue"),
      meta: {
        title: "统计分析",
        icon: "ep/data-analysis"
      }
    },
    {
      path: "article",
      name: "CMSArticle",
      redirect: "article/list",
      meta: {
        title: "文章管理"
      },
      children: [
        {
          path: "list",
          name: "ArticleList",
          component: () => import("@/views/cms/article/list.vue"),
          meta: {
            title: "文章列表"
          }
        },
        {
          path: "detail/:id",
          name: "ArticleDetail",
          component: () => import("@/views/cms/article/detail.vue"),
          meta: {
            title: "文章详情",
            showLink: false,
            activePath: "/cms/article/list"
          }
        },
        {
          path: "create",
          name: "ArticleCreate",
          component: () => import("@/views/cms/article/form.vue"),
          meta: {
            title: "创建文章",
            showLink: false,
            activePath: "/cms/article/list"
          }
        },
        {
          path: "edit/:id",
          name: "ArticleEdit",
          component: () => import("@/views/cms/article/form.vue"),
          meta: {
            title: "编辑文章",
            showLink: false,
            activePath: "/cms/article/list"
          }
        }
      ]
    },
    {
      path: "category",
      name: "CMSCategory",
      component: () => import("@/views/cms/category/index.vue"),
      meta: {
        title: "分类管理"
      }
    },
    {
      path: "tag",
      name: "CMSTag",
      component: () => import("@/views/cms/tag/index.vue"),
      meta: {
        title: "标签管理"
      }
    },
    {
      path: "comment",
      name: "CMSComment",
      component: () => import("@/views/cms/comment/list.vue"),
      meta: {
        title: "评论管理"
      }
    }
  ]
} satisfies RouteConfigsTable; 
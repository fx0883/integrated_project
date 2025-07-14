export default {
  "path": "/order",
  "name": "Order",
  "meta": {
    "title": "menus.pureOrder",
    "rank": 5,
    "showLink": true,
    "icon": "ep:tickets",
    "showParent": true,
    "keepAlive": true,
    "frameLoading": false,
    "hiddenTag": false
  },
  "redirect": "/order/index",
  "children": [
    {
      "path": "/order/index",
      "name": "OrderIndex",
      "meta": {
        "title": "order.orderList",
        "rank": 0,
        "showLink": true,
        "icon": "ri:menu-line",
        "showParent": true,
        "keepAlive": false,
        "frameLoading": false,
        "hiddenTag": false,
        "roles": ["admin", "common"]
      },
      "component": "/src/views/order/index.vue"
    },
    {
      "path": "/order/statistics",
      "name": "OrderStatistics",
      "meta": {
        "title": "order.statisticsTitle",
        "rank": 0,
        "showLink": true,
        "icon": "ri:line-chart-line",
        "showParent": true,
        "keepAlive": false,
        "frameLoading": false,
        "hiddenTag": false,
        "roles": ["admin", "common"]
      },
      "component": "/src/views/order/statistics.vue"
    },
    {
      "path": "/order/create",
      "name": "OrderCreate",
      "meta": {
        "title": "order.createOrder",
        "rank": 0,
        "showLink": false,
        "showParent": false,
        "keepAlive": false,
        "frameLoading": false,
        "hiddenTag": false,
        "roles": ["admin"]
      },
      "component": "/src/views/order/create.vue"
    },
    {
      "path": "/order/edit/:id",
      "name": "OrderEdit",
      "meta": {
        "title": "order.editOrder",
        "rank": 0,
        "showLink": false,
        "showParent": false,
        "keepAlive": false,
        "frameLoading": false,
        "hiddenTag": false,
        "roles": ["admin"]
      },
      "component": "/src/views/order/edit.vue"
    },
    {
      "path": "/order/detail/:id",
      "name": "OrderDetail",
      "meta": {
        "title": "order.orderDetail",
        "rank": 0,
        "showLink": false,
        "showParent": false,
        "keepAlive": false,
        "frameLoading": false,
        "hiddenTag": false,
        "roles": ["admin", "common"]
      },
      "component": "/src/views/order/detail.vue"
    }
  ]
} 
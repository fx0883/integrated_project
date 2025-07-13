import SvgIcon from './SvgIcon/index.vue';
import type { App } from 'vue';

// 订单管理组件
import OrderStatusTag from './OrderManagement/OrderStatusTag.vue';
import OrderForm from './OrderManagement/OrderForm.vue';
import OrderFilter from './OrderManagement/OrderFilter.vue';
import OrderDetail from './OrderManagement/OrderDetail.vue';
import OrderHistory from './OrderManagement/OrderHistory.vue';
import OrderVersionCompare from './OrderManagement/OrderVersionCompare.vue';
import OrderChangeLog from './OrderManagement/OrderChangeLog.vue';
import CustomerOrderList from './OrderManagement/CustomerOrderList.vue';
import MemberOrderList from './OrderManagement/MemberOrderList.vue';
import ConfirmDialog from './OrderManagement/ConfirmDialog.vue';

// 注册全局组件
export function registerGlobalComponents(app: App): void {
  app.component('svg-icon', SvgIcon);
  
  // 注册订单组件
  app.component('order-status-tag', OrderStatusTag);
  app.component('order-form', OrderForm);
  app.component('order-filter', OrderFilter);
  app.component('order-detail', OrderDetail);
  app.component('order-history', OrderHistory);
  app.component('order-version-compare', OrderVersionCompare);
  app.component('order-change-log', OrderChangeLog);
  app.component('customer-order-list', CustomerOrderList);
  app.component('member-order-list', MemberOrderList);
  app.component('order-confirm-dialog', ConfirmDialog);
}

export {
  SvgIcon,
  
  // 订单组件导出
  OrderStatusTag,
  OrderForm,
  OrderFilter,
  OrderDetail,
  OrderHistory,
  OrderVersionCompare,
  OrderChangeLog,
  CustomerOrderList,
  MemberOrderList,
  ConfirmDialog as OrderConfirmDialog
}; 
import { defineStore } from "pinia";
import {
  getOrderList,
  getOrderDetail,
  createOrder,
  updateOrder,
  deleteOrder,
  searchOrders,
  getOrderStatistics,
  bulkUpdateOrders,
  bulkDeleteOrders,
  exportOrders,
  downloadOrderImportTemplate,
  importOrders,
  getOrderReminders,
  getOrderHistoryList,
  getOrderHistoryDetail,
  restoreOrderVersion,
  getCustomerOrderList,
  getMemberOrderList
} from "@/api/modules/order";
import type {
  Order,
  OrderListParams,
  OrderCreateUpdateParams,
  OrderHistory,
  OrderStatistics,
  OrderReminders,
  OrderBulkOperationParams,
  OrderBulkOperationResponse,
  OrderImportResponse
} from "@/types/order";
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";

interface OrderState {
  // 订单列表数据
  orderList: PaginationData<Order>;
  // 当前选中的订单
  currentOrder: Order | null;
  // 订单统计数据
  statistics: OrderStatistics | null;
  // 订单提醒数据
  reminders: OrderReminders | null;
  // 订单历史记录列表
  orderHistory: PaginationData<OrderHistory>;
  // 当前选中的历史记录
  currentHistory: OrderHistory | null;
  // 按客户ID存储的订单列表映射
  customerOrdersMap: Record<number, PaginationData<Order>>;
  // 按联系人ID存储的订单列表映射
  memberOrdersMap: Record<number, PaginationData<Order>>;
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    statistics: boolean;
    bulkUpdate: boolean;
    bulkDelete: boolean;
    export: boolean;
    import: boolean;
    reminders: boolean;
    history: boolean;
    historyDetail: boolean;
    restore: boolean;
    customerOrders: boolean;
    memberOrders: boolean;
  };
  // 错误信息
  error: string | null;
}

export const useOrderStore = defineStore("order", {
  state: (): OrderState => ({
    orderList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentOrder: null,
    statistics: null,
    reminders: null,
    orderHistory: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentHistory: null,
    customerOrdersMap: {},
    memberOrdersMap: {},
    loading: {
      list: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      statistics: false,
      bulkUpdate: false,
      bulkDelete: false,
      export: false,
      import: false,
      reminders: false,
      history: false,
      historyDetail: false,
      restore: false,
      customerOrders: false,
      memberOrders: false
    },
    error: null
  }),
  
  getters: {
    // 获取订单列表
    getOrders: (state) => state.orderList.data,
    
    // 获取当前订单
    getCurrentOrder: (state) => state.currentOrder,
    
    // 获取订单统计数据
    getStatistics: (state) => state.statistics,
    
    // 获取订单提醒数据
    getReminders: (state) => state.reminders,
    
    // 获取订单历史记录列表
    getOrderHistory: (state) => state.orderHistory.data,
    
    // 获取当前历史记录
    getCurrentHistory: (state) => state.currentHistory,
    
    // 根据客户ID获取订单列表
    getCustomerOrders: (state) => (customerId: number) => 
      state.customerOrdersMap[customerId]?.data || [],
    
    // 根据联系人ID获取订单列表
    getMemberOrders: (state) => (memberId: number) => 
      state.memberOrdersMap[memberId]?.data || [],
    
    // 获取加载状态
    isLoading: (state) => (key: keyof OrderState['loading']) => state.loading[key],
    
    // 获取错误信息
    getError: (state) => state.error
  },
  
  actions: {
    /**
     * 获取订单列表
     */
    async fetchOrderList(params: OrderListParams = {}) {
      this.loading.list = true;
      this.error = null;
      
      try {
        const response = await getOrderList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.orderList = {
              total: response.data.pagination.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              total_pages: response.data.pagination.total_pages || 1,
              data: response.data.results || []
            };
          } else {
            logger.warn("订单列表数据结构不符合预期", response.data);
            this.orderList.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          this.error = response.message || "获取订单列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取订单列表失败", error);
        this.error = error.message || "获取订单列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取订单详情
     */
    async fetchOrderDetail(id: number) {
      this.loading.detail = true;
      this.error = null;
      
      try {
        const response = await getOrderDetail(id);
        if (response.success) {
          this.currentOrder = response.data;
          
          // 确保有客户名称
          if (!this.currentOrder.customer_name && this.currentOrder.customer) {
            try {
              // 这里可以添加获取客户名称的额外API调用
              // 或者从客户缓存中获取
              logger.info(`订单 ${id} 缺少客户名称信息`);
            } catch (err) {
              logger.error("获取客户名称失败", err);
            }
          }
          
          // 确保有联系人信息
          if (this.currentOrder.customer_contact && !this.currentOrder.customer_contact_info) {
            try {
              // 这里可以添加获取联系人信息的额外API调用
              // 或者从联系人缓存中获取
              logger.info(`订单 ${id} 缺少联系人信息`);
            } catch (err) {
              logger.error("获取联系人信息失败", err);
            }
          }
          
          return response;
        } else {
          this.error = response.message || "获取订单详情失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取订单详情失败", error);
        this.error = error.message || "获取订单详情失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 创建新订单
     */
    async createNewOrder(data: OrderCreateUpdateParams) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const response = await createOrder(data);
        if (response.success) {
          ElMessage.success("订单创建成功");
          this.currentOrder = response.data;
          return response;
        } else {
          this.error = response.message || "创建订单失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("创建订单失败", error);
        this.error = error.message || "创建订单失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新订单信息
     */
    async updateOrderInfo(id: number, data: OrderCreateUpdateParams) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await updateOrder(id, data);
        if (response.success) {
          ElMessage.success("订单更新成功");
          // 更新当前订单数据
          if (this.currentOrder && this.currentOrder.id === id) {
            this.currentOrder = response.data;
          }
          // 更新订单列表中的数据
          const index = this.orderList.data.findIndex(item => item.id === id);
          if (index !== -1) {
            this.orderList.data[index] = response.data;
          }
          return response;
        } else {
          this.error = response.message || "更新订单失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("更新订单失败", error);
        this.error = error.message || "更新订单失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除订单
     */
    async removeOrder(id: number) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        const response = await deleteOrder(id);
        if (response.success) {
          ElMessage.success("订单删除成功");
          // 从订单列表中移除
          this.orderList.data = this.orderList.data.filter(item => item.id !== id);
          // 如果当前订单是被删除的订单，则清空
          if (this.currentOrder && this.currentOrder.id === id) {
            this.currentOrder = null;
          }
          return response;
        } else {
          this.error = response.message || "删除订单失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("删除订单失败", error);
        this.error = error.message || "删除订单失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 获取订单统计数据
     */
    async fetchOrderStatistics(params: {
      period?: string;
      start_date?: string;
      end_date?: string;
    } = {}) {
      this.loading.statistics = true;
      this.error = null;
      
      try {
        const response = await getOrderStatistics(params);
        if (response.success) {
          this.statistics = response.data;
          return response;
        } else {
          this.error = response.message || "获取订单统计数据失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取订单统计数据失败", error);
        this.error = error.message || "获取订单统计数据失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.statistics = false;
      }
    },
    
    /**
     * 获取订单提醒数据
     */
    async fetchOrderReminders(params: {
      days?: number;
      limit?: number;
    } = {}) {
      this.loading.reminders = true;
      this.error = null;
      
      try {
        const response = await getOrderReminders(params);
        if (response.success) {
          this.reminders = response.data;
          return response;
        } else {
          this.error = response.message || "获取订单提醒失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取订单提醒失败", error);
        this.error = error.message || "获取订单提醒失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.reminders = false;
      }
    },
    
    /**
     * 批量更新订单
     */
    async bulkUpdateOrders(data: OrderBulkOperationParams) {
      this.loading.bulkUpdate = true;
      this.error = null;
      
      try {
        const response = await bulkUpdateOrders(data);
        if (response.success) {
          ElMessage.success(`成功更新 ${response.data.success_count} 条订单数据`);
          // 更新成功后重新获取列表
          await this.fetchOrderList({
            page: this.orderList.page,
            page_size: this.orderList.limit
          });
          return response;
        } else {
          this.error = response.message || "批量更新订单失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量更新订单失败", error);
        this.error = error.message || "批量更新订单失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.bulkUpdate = false;
      }
    },
    
    /**
     * 批量删除订单
     */
    async bulkDeleteOrders(orderIds: number[]) {
      this.loading.bulkDelete = true;
      this.error = null;
      
      try {
        const response = await bulkDeleteOrders(orderIds);
        if (response.success) {
          ElMessage.success(`成功删除 ${response.data.success_count} 条订单数据`);
          // 从订单列表中移除被删除的订单
          this.orderList.data = this.orderList.data.filter(
            item => !orderIds.includes(item.id)
          );
          // 如果当前订单在删除列表中，则清空
          if (this.currentOrder && orderIds.includes(this.currentOrder.id)) {
            this.currentOrder = null;
          }
          return response;
        } else {
          this.error = response.message || "批量删除订单失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量删除订单失败", error);
        this.error = error.message || "批量删除订单失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.bulkDelete = false;
      }
    },
    
    /**
     * 导出订单数据
     */
    async exportOrderData(params: OrderListParams = {}) {
      this.loading.export = true;
      this.error = null;
      
      try {
        const response = await exportOrders(params);
        // Blob数据处理
        const url = window.URL.createObjectURL(response);
        const link = document.createElement("a");
        link.href = url;
        
        // 设置文件名（从headers或默认）
        const contentDisposition = response.headers?.["content-disposition"];
        let filename = "订单数据.xlsx";
        if (contentDisposition) {
          const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }
        
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ElMessage.success("订单数据导出成功");
        return response;
      } catch (error) {
        logger.error("导出订单数据失败", error);
        this.error = error.message || "导出订单数据失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.export = false;
      }
    },
    
    /**
     * 下载订单导入模板
     */
    async downloadImportTemplate() {
      try {
        const response = await downloadOrderImportTemplate();
        // Blob数据处理
        const url = window.URL.createObjectURL(response);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "订单导入模板.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ElMessage.success("订单导入模板下载成功");
        return response;
      } catch (error) {
        logger.error("下载订单导入模板失败", error);
        this.error = error.message || "下载订单导入模板失败";
        ElMessage.error(this.error);
        throw error;
      }
    },
    
    /**
     * 导入订单数据
     */
    async importOrderData(file: File) {
      this.loading.import = true;
      this.error = null;
      
      try {
        const response = await importOrders(file);
        if (response.success) {
          ElMessage.success(`成功导入 ${response.data.success_count} 条订单数据`);
          // 导入成功后重新获取列表
          await this.fetchOrderList({
            page: 1,
            page_size: this.orderList.limit
          });
          return response;
        } else {
          this.error = response.message || "导入订单数据失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("导入订单数据失败", error);
        this.error = error.message || "导入订单数据失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.import = false;
      }
    },
    
    /**
     * 获取订单历史记录列表
     */
    async fetchOrderHistoryList(orderId: number, params: {
      page?: number;
      page_size?: number;
    } = {}) {
      this.loading.history = true;
      this.error = null;
      
      try {
        const response = await getOrderHistoryList(orderId, params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.orderHistory = {
              total: response.data.pagination.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              total_pages: response.data.pagination.total_pages || 1,
              data: response.data.results || []
            };
          } else {
            logger.warn("订单历史记录数据结构不符合预期", response.data);
            this.orderHistory.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          this.error = response.message || "获取订单历史记录失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取订单历史记录失败", error);
        this.error = error.message || "获取订单历史记录失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.history = false;
      }
    },
    
    /**
     * 获取订单历史记录详情
     */
    async fetchOrderHistoryDetail(orderId: number, historyId: number) {
      this.loading.historyDetail = true;
      this.error = null;
      
      try {
        const response = await getOrderHistoryDetail(orderId, historyId);
        if (response.success) {
          this.currentHistory = response.data;
          
          // 解析JSON字符串
          if (typeof this.currentHistory.change_details === 'string') {
            try {
              this.currentHistory.change_details_data = JSON.parse(this.currentHistory.change_details);
            } catch (e) {
              logger.warn("解析订单变更详情JSON失败", e);
            }
          }
          
          if (typeof this.currentHistory.snapshot === 'string') {
            try {
              this.currentHistory.snapshot_data = JSON.parse(this.currentHistory.snapshot);
            } catch (e) {
              logger.warn("解析订单快照JSON失败", e);
            }
          }
          
          return response;
        } else {
          this.error = response.message || "获取订单历史记录详情失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取订单历史记录详情失败", error);
        this.error = error.message || "获取订单历史记录详情失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.historyDetail = false;
      }
    },
    
    /**
     * 恢复订单到历史版本
     */
    async restoreOrderToVersion(orderId: number, historyId: number) {
      this.loading.restore = true;
      this.error = null;
      
      try {
        const response = await restoreOrderVersion(orderId, historyId);
        if (response.success) {
          ElMessage.success("订单已恢复到历史版本");
          // 更新当前订单数据
          this.currentOrder = response.data;
          return response;
        } else {
          this.error = response.message || "恢复订单历史版本失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("恢复订单历史版本失败", error);
        this.error = error.message || "恢复订单历史版本失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.restore = false;
      }
    },
    
    /**
     * 获取客户的订单列表
     */
    async fetchCustomerOrderList(customerId: number, params: OrderListParams = {}) {
      this.loading.customerOrders = true;
      this.error = null;
      
      try {
        const response = await getCustomerOrderList(customerId, params);
        if (response.success) {
          const paginationData = {
            total: response.data.pagination.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10,
            total_pages: response.data.pagination.total_pages || 1,
            data: response.data.results || []
          };
          // 存储在客户订单映射中
          this.customerOrdersMap[customerId] = paginationData;
          return response;
        } else {
          this.error = response.message || "获取客户订单列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取客户订单列表失败", error);
        this.error = error.message || "获取客户订单列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.customerOrders = false;
      }
    },
    
    /**
     * 获取联系人的订单列表
     */
    async fetchMemberOrderList(memberId: number, params: OrderListParams = {}) {
      this.loading.memberOrders = true;
      this.error = null;
      
      try {
        const response = await getMemberOrderList(memberId, params);
        if (response.success) {
          const paginationData = {
            total: response.data.pagination.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10,
            total_pages: response.data.pagination.total_pages || 1,
            data: response.data.results || []
          };
          // 存储在联系人订单映射中
          this.memberOrdersMap[memberId] = paginationData;
          return response;
        } else {
          this.error = response.message || "获取联系人订单列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取联系人订单列表失败", error);
        this.error = error.message || "获取联系人订单列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.memberOrders = false;
      }
    },
    
    /**
     * 重置订单状态
     */
    resetOrderState() {
      this.orderList = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentOrder = null;
      this.statistics = null;
      this.reminders = null;
      this.orderHistory = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentHistory = null;
      this.customerOrdersMap = {};
      this.memberOrdersMap = {};
      this.error = null;
    }
  }
});

// 导出便捷使用的钩子函数
export function useOrderStoreHook() {
  return useOrderStore();
} 
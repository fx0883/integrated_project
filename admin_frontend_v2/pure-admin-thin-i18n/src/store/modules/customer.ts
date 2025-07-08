import { defineStore } from "pinia";
import {
  getCustomerList,
  getCustomerDetail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomerStatistics,
  bulkCreateCustomers,
  bulkUpdateCustomers,
  bulkDeleteCustomers,
  getCustomerMemberRelations,
  createCustomerMemberRelation,
  getCustomerMemberRelationDetail,
  updateCustomerMemberRelation,
  deleteCustomerMemberRelation,
  setPrimaryMemberRelation,
  getPrimaryMemberRelation,
  getCustomerTenantRelations,
  createCustomerTenantRelation,
  getCustomerTenantRelationDetail,
  updateCustomerTenantRelation,
  deleteCustomerTenantRelation,
  setPrimaryTenantRelation,
  getPrimaryTenantRelation,
  batchDeleteCustomerMemberRelations,
  batchDeleteCustomerMembersByIds
} from "@/api/modules/customer";
import type {
  Customer,
  CustomerListParams,
  CustomerCreateUpdateParams,
  CustomerMemberRelation,
  CustomerMemberRelationCreateUpdateParams,
  CustomerTenantRelation,
  CustomerTenantRelationCreateUpdateParams,
  CustomerBulkOperationParams,
  CustomerStatistics
} from "@/types/customer";
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";

interface CustomerState {
  // 客户列表数据
  customerList: PaginationData<Customer>;
  // 当前选中的客户
  currentCustomer: Customer | null;
  // 客户统计数据
  statistics: CustomerStatistics | null;
  // 当前客户的联系人关系列表
  customerMemberRelations: PaginationData<CustomerMemberRelation>;
  // 按客户ID存储的联系人关系列表映射
  customerMemberRelationsMap: Record<number, PaginationData<CustomerMemberRelation>>;
  // 当前客户的租户关系列表
  customerTenantRelations: PaginationData<CustomerTenantRelation>;
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    statistics: boolean;
    bulkCreate: boolean;
    bulkUpdate: boolean;
    bulkDelete: boolean;
    memberRelations: boolean;
    createMemberRelation: boolean;
    updateMemberRelation: boolean;
    deleteMemberRelation: boolean;
    batchDeleteMemberRelations: boolean;
    tenantRelations: boolean;
    createTenantRelation: boolean;
    updateTenantRelation: boolean;
    deleteTenantRelation: boolean;
  };
  // 错误信息
  error: string | null;
}

export const useCustomerStore = defineStore("customer", {
  state: (): CustomerState => ({
    customerList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentCustomer: null,
    statistics: null,
    customerMemberRelations: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    customerMemberRelationsMap: {},
    customerTenantRelations: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    loading: {
      list: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      statistics: false,
      bulkCreate: false,
      bulkUpdate: false,
      bulkDelete: false,
      memberRelations: false,
      createMemberRelation: false,
      updateMemberRelation: false,
      deleteMemberRelation: false,
      batchDeleteMemberRelations: false,
      tenantRelations: false,
      createTenantRelation: false,
      updateTenantRelation: false,
      deleteTenantRelation: false
    },
    error: null
  }),
  
  getters: {
    // 获取客户列表
    getCustomers: (state) => state.customerList.data,
    
    // 获取当前客户
    getCurrentCustomer: (state) => state.currentCustomer,
    
    // 获取客户统计数据
    getStatistics: (state) => state.statistics,
    
    // 获取客户的联系人关系列表
    getMemberRelations: (state) => state.customerMemberRelations.data,
    
    // 根据客户ID获取对应的会员关系数据
    getCustomerMemberRelationsByCustomerId: (state) => (customerId: number) => 
      state.customerMemberRelationsMap[customerId]?.data || [],
    
    // 获取客户的租户关系列表
    getTenantRelations: (state) => state.customerTenantRelations.data,
    
    // 获取加载状态
    isLoading: (state) => (key: keyof CustomerState['loading']) => state.loading[key],
    
    // 获取错误信息
    getError: (state) => state.error
  },
  
  actions: {
    /**
     * 获取客户列表
     */
    async fetchCustomerList(params: CustomerListParams = {}) {
      this.loading.list = true;
      this.error = null;
      
      try {
        const response = await getCustomerList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.customerList = {
              total: response.data.pagination.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              total_pages: response.data.pagination.total_pages || 1,
              data: response.data.results || []
            };
          } else {
            logger.warn("客户列表数据结构不符合预期", response.data);
            this.customerList.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          this.error = response.message || "获取客户列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取客户列表失败", error);
        this.error = error.message || "获取客户列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取客户详情
     */
    async fetchCustomerDetail(id: number) {
      this.loading.detail = true;
      this.error = null;
      
      try {
        const response = await getCustomerDetail(id);
        if (response.success) {
          this.currentCustomer = response.data;
          return response;
        } else {
          this.error = response.message || "获取客户详情失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取客户详情失败", error);
        this.error = error.message || "获取客户详情失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 创建客户
     */
    async createNewCustomer(data: CustomerCreateUpdateParams) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const response = await createCustomer(data);
        if (response.success) {
          ElMessage.success(response.message || "创建客户成功");
          return response;
        } else {
          this.error = response.message || "创建客户失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("创建客户失败", error);
        this.error = error.message || "创建客户失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新客户信息
     */
    async updateCustomerInfo(id: number, data: CustomerCreateUpdateParams) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await updateCustomer(id, data);
        if (response.success) {
          // 如果当前选中的客户是被更新的客户，则更新当前选中的客户信息
          if (this.currentCustomer && this.currentCustomer.id === id) {
            this.currentCustomer = response.data;
          }
          
          // 更新客户列表中的客户信息
          const index = this.customerList.data.findIndex(customer => customer.id === id);
          if (index !== -1) {
            this.customerList.data[index] = response.data;
          }
          
          ElMessage.success(response.message || "更新客户成功");
          return response;
        } else {
          this.error = response.message || "更新客户失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("更新客户失败", error);
        this.error = error.message || "更新客户失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除客户
     */
    async removeCustomer(id: number) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        const response = await deleteCustomer(id);
        if (response.success) {
          // 如果删除的是当前选中的客户，则清空当前选中的客户
          if (this.currentCustomer && this.currentCustomer.id === id) {
            this.currentCustomer = null;
          }
          
          // 从客户列表中移除被删除的客户
          this.customerList.data = this.customerList.data.filter(customer => customer.id !== id);
          this.customerList.total--;
          
          ElMessage.success(response.message || "删除客户成功");
          return response;
        } else {
          this.error = response.message || "删除客户失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("删除客户失败", error);
        this.error = error.message || "删除客户失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 获取客户统计数据
     */
    async fetchCustomerStatistics() {
      this.loading.statistics = true;
      this.error = null;
      
      try {
        const response = await getCustomerStatistics();
        if (response.success) {
          this.statistics = response.data;
          return response;
        } else {
          this.error = response.message || "获取客户统计数据失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取客户统计数据失败", error);
        this.error = error.message || "获取客户统计数据失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.statistics = false;
      }
    },
    
    /**
     * 批量创建客户
     */
    async bulkCreateCustomers(data: CustomerCreateUpdateParams[]) {
      this.loading.bulkCreate = true;
      this.error = null;
      
      try {
        const response = await bulkCreateCustomers(data);
        if (response.success) {
          ElMessage.success(response.message || `成功创建 ${response.data.success_count} 个客户`);
          return response;
        } else {
          this.error = response.message || "批量创建客户失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量创建客户失败", error);
        this.error = error.message || "批量创建客户失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.bulkCreate = false;
      }
    },
    
    /**
     * 批量更新客户
     */
    async bulkUpdateCustomers(data: CustomerBulkOperationParams) {
      this.loading.bulkUpdate = true;
      this.error = null;
      
      try {
        const response = await bulkUpdateCustomers(data);
        if (response.success) {
          ElMessage.success(response.message || `成功更新 ${response.data.success_count} 个客户`);
          
          // 刷新客户列表
          await this.fetchCustomerList();
          
          return response;
        } else {
          this.error = response.message || "批量更新客户失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量更新客户失败", error);
        this.error = error.message || "批量更新客户失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.bulkUpdate = false;
      }
    },
    
    /**
     * 批量删除客户
     */
    async bulkDeleteCustomers(customerIds: number[]) {
      this.loading.bulkDelete = true;
      this.error = null;
      
      try {
        const response = await bulkDeleteCustomers(customerIds);
        if (response.success) {
          ElMessage.success(response.message || `成功删除 ${response.data.success_count} 个客户`);
          
          // 如果当前选中的客户在被删除的客户列表中，则清空当前选中的客户
          if (this.currentCustomer && customerIds.includes(this.currentCustomer.id)) {
            this.currentCustomer = null;
          }
          
          // 从客户列表中移除被删除的客户
          this.customerList.data = this.customerList.data.filter(customer => !customerIds.includes(customer.id));
          this.customerList.total -= response.data.success_count;
          
          return response;
        } else {
          this.error = response.message || "批量删除客户失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量删除客户失败", error);
        this.error = error.message || "批量删除客户失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.bulkDelete = false;
      }
    },
    
    /**
     * 获取客户的联系人关系列表
     */
    async fetchCustomerMemberRelations(customerId: number, params: { page?: number; page_size?: number } = {}) {
      this.loading.memberRelations = true;
      this.error = null;
      
      try {
        const response = await getCustomerMemberRelations(customerId, params);
        if (response.success) {
          // 将会员数据转换为关系数据，使用新的API返回结构
          const memberRelations = response.data.map(member => ({
            id: member.relation?.id || member.id, // 使用relation中的ID作为关系ID
            member: {
              id: member.id,
              name: member.nick_name || `${member.first_name} ${member.last_name}`.trim() || member.username,
              username: member.username,
              email: member.email,
              phone: member.phone,
              avatar: member.avatar
            },
            customer: {
              id: customerId,
              name: this.currentCustomer?.name || '',
              type: this.currentCustomer?.type || ''
            },
            role: member.relation?.role || '',
            is_primary: member.relation?.is_primary || false,
            remarks: member.relation?.remarks !== null ? member.relation?.remarks || '' : '',
            created_at: member.relation?.created_at || member.date_joined,
            updated_at: member.relation?.updated_at || ''
          }));
          
          // 更新全局状态
          this.customerMemberRelations = {
            total: response.data.length,
            page: params.page || 1,
            limit: params.page_size || 10,
            data: memberRelations
          };
          
          // 按客户ID存储会员关系数据
          this.customerMemberRelationsMap[customerId] = {
            total: response.data.length,
            page: params.page || 1,
            limit: params.page_size || 10,
            data: memberRelations
          };
          
          return response;
        } else {
          this.error = response.message || "获取客户联系人关系列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取客户联系人关系列表失败", error);
        this.error = error.message || "获取客户联系人关系列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.memberRelations = false;
      }
    },
    
    /**
     * 创建客户-联系人关系
     */
    async createCustomerMemberRelation(data: CustomerMemberRelationCreateUpdateParams) {
      this.loading.createMemberRelation = true;
      this.error = null;
      
      try {
        const response = await createCustomerMemberRelation(data);
        if (response.success) {
          // 将新创建的关系添加到关系列表中
          this.customerMemberRelations.data.unshift(response.data);
          this.customerMemberRelations.total++;
          
          // 将新创建的关系添加到对应客户的关系映射中
          const customerId = data.customer_id;
          if (!this.customerMemberRelationsMap[customerId]) {
            this.customerMemberRelationsMap[customerId] = {
              total: 0,
              page: 1,
              limit: 10,
              data: []
            };
          }
          this.customerMemberRelationsMap[customerId].data.unshift(response.data);
          this.customerMemberRelationsMap[customerId].total++;
          
          ElMessage.success(response.message || "创建客户-联系人关系成功");
          return response;
        } else {
          this.error = response.message || "创建客户-联系人关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("创建客户-联系人关系失败", error);
        this.error = error.message || "创建客户-联系人关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.createMemberRelation = false;
      }
    },
    
    /**
     * 更新客户-联系人关系
     */
    async updateCustomerMemberRelation(customerId: number, relationId: number, data: Omit<CustomerMemberRelationCreateUpdateParams, 'customer_id'>) {
      this.loading.updateMemberRelation = true;
      this.error = null;
      
      try {
        const response = await updateCustomerMemberRelation(customerId, relationId, data);
        if (response.success) {
          // 更新关系列表中的关系信息
          const index = this.customerMemberRelations.data.findIndex(relation => relation.id === relationId);
          if (index !== -1) {
            this.customerMemberRelations.data[index] = response.data;
          }
          
          // 更新客户关系映射中的关系信息
          if (this.customerMemberRelationsMap[customerId]) {
            const mapIndex = this.customerMemberRelationsMap[customerId].data.findIndex(relation => relation.id === relationId);
            if (mapIndex !== -1) {
              this.customerMemberRelationsMap[customerId].data[mapIndex] = response.data;
            }
          }
          
          ElMessage.success(response.message || "更新客户-联系人关系成功");
          return response;
        } else {
          this.error = response.message || "更新客户-联系人关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("更新客户-联系人关系失败", error);
        this.error = error.message || "更新客户-联系人关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.updateMemberRelation = false;
      }
    },
    
    /**
     * 删除客户-联系人关系
     */
    async removeCustomerMemberRelation(customerId: number, relationId: number) {
      this.loading.deleteMemberRelation = true;
      this.error = null;
      
      try {
        const response = await deleteCustomerMemberRelation(customerId, relationId);
        if (response.success) {
          // 从关系列表中移除被删除的关系
          this.customerMemberRelations.data = this.customerMemberRelations.data.filter(relation => relation.id !== relationId);
          this.customerMemberRelations.total--;
          
          // 从客户关系映射中移除被删除的关系
          if (this.customerMemberRelationsMap[customerId]) {
            this.customerMemberRelationsMap[customerId].data = this.customerMemberRelationsMap[customerId].data.filter(relation => relation.id !== relationId);
            this.customerMemberRelationsMap[customerId].total--;
          }
          
          ElMessage.success(response.message || "删除客户-联系人关系成功");
          return response;
        } else {
          this.error = response.message || "删除客户-联系人关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("删除客户-联系人关系失败", error);
        this.error = error.message || "删除客户-联系人关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.deleteMemberRelation = false;
      }
    },
    
    /**
     * 设置主要联系人
     */
    async setPrimaryMemberRelation(customerId: number, relationId: number) {
      this.loading.updateMemberRelation = true;
      this.error = null;
      
      try {
        const response = await setPrimaryMemberRelation(customerId, relationId);
        if (response.success) {
          // 更新关系列表中的关系信息
          this.customerMemberRelations.data = this.customerMemberRelations.data.map(relation => ({
            ...relation,
            is_primary: relation.id === relationId
          }));
          
          // 更新客户关系映射中的关系信息
          if (this.customerMemberRelationsMap[customerId]) {
            this.customerMemberRelationsMap[customerId].data = this.customerMemberRelationsMap[customerId].data.map(relation => ({
              ...relation,
              is_primary: relation.id === relationId
            }));
          }
          
          ElMessage.success(response.message || "设置主要联系人成功");
          return response;
        } else {
          this.error = response.message || "设置主要联系人失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("设置主要联系人失败", error);
        this.error = error.message || "设置主要联系人失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.updateMemberRelation = false;
      }
    },
    
    /**
     * 获取客户的租户关系列表
     */
    async fetchCustomerTenantRelations(customerId: number, params: { page?: number; page_size?: number } = {}) {
      this.loading.tenantRelations = true;
      this.error = null;
      
      try {
        const response = await getCustomerTenantRelations(customerId, params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.customerTenantRelations = {
              total: response.data.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              data: response.data.results || []
            };
          } else {
            logger.warn("客户租户关系列表数据结构不符合预期", response.data);
            this.customerTenantRelations.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          this.error = response.message || "获取客户租户关系列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取客户租户关系列表失败", error);
        this.error = error.message || "获取客户租户关系列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.tenantRelations = false;
      }
    },
    
    /**
     * 创建客户-租户关系
     */
    async createCustomerTenantRelation(data: CustomerTenantRelationCreateUpdateParams) {
      this.loading.createTenantRelation = true;
      this.error = null;
      
      try {
        const response = await createCustomerTenantRelation(data);
        if (response.success) {
          // 将新创建的关系添加到关系列表中
          this.customerTenantRelations.data.unshift(response.data);
          this.customerTenantRelations.total++;
          
          ElMessage.success(response.message || "创建客户-租户关系成功");
          return response;
        } else {
          this.error = response.message || "创建客户-租户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("创建客户-租户关系失败", error);
        this.error = error.message || "创建客户-租户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.createTenantRelation = false;
      }
    },
    
    /**
     * 更新客户-租户关系
     */
    async updateCustomerTenantRelation(customerId: number, relationId: number, data: Omit<CustomerTenantRelationCreateUpdateParams, 'customer_id'>) {
      this.loading.updateTenantRelation = true;
      this.error = null;
      
      try {
        const response = await updateCustomerTenantRelation(customerId, relationId, data);
        if (response.success) {
          // 更新关系列表中的关系信息
          const index = this.customerTenantRelations.data.findIndex(relation => relation.id === relationId);
          if (index !== -1) {
            this.customerTenantRelations.data[index] = response.data;
          }
          
          ElMessage.success(response.message || "更新客户-租户关系成功");
          return response;
        } else {
          this.error = response.message || "更新客户-租户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("更新客户-租户关系失败", error);
        this.error = error.message || "更新客户-租户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.updateTenantRelation = false;
      }
    },
    
    /**
     * 删除客户-租户关系
     */
    async removeCustomerTenantRelation(customerId: number, relationId: number) {
      this.loading.deleteTenantRelation = true;
      this.error = null;
      
      try {
        const response = await deleteCustomerTenantRelation(customerId, relationId);
        if (response.success) {
          // 从关系列表中移除被删除的关系
          this.customerTenantRelations.data = this.customerTenantRelations.data.filter(relation => relation.id !== relationId);
          this.customerTenantRelations.total--;
          
          ElMessage.success(response.message || "删除客户-租户关系成功");
          return response;
        } else {
          this.error = response.message || "删除客户-租户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("删除客户-租户关系失败", error);
        this.error = error.message || "删除客户-租户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.deleteTenantRelation = false;
      }
    },
    
    /**
     * 设置主要租户关系
     */
    async setPrimaryTenantRelation(customerId: number, relationId: number) {
      this.loading.updateTenantRelation = true;
      this.error = null;
      
      try {
        const response = await setPrimaryTenantRelation(customerId, relationId);
        if (response.success) {
          // 更新关系列表中的关系信息
          this.customerTenantRelations.data = this.customerTenantRelations.data.map(relation => ({
            ...relation,
            is_primary: relation.id === relationId
          }));
          
          ElMessage.success(response.message || "设置主要租户关系成功");
          return response;
        } else {
          this.error = response.message || "设置主要租户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("设置主要租户关系失败", error);
        this.error = error.message || "设置主要租户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.updateTenantRelation = false;
      }
    },
    
    /**
     * 批量删除客户-会员关系
     */
    async batchDeleteCustomerMemberRelations(relationIds: number[]) {
      this.loading.batchDeleteMemberRelations = true;
      this.error = null;
      
      try {
        const response = await batchDeleteCustomerMemberRelations(relationIds);
        if (response.success) {
          // 从关系列表中移除被删除的关系
          this.customerMemberRelations.data = this.customerMemberRelations.data.filter(
            relation => !relationIds.includes(relation.id)
          );
          this.customerMemberRelations.total -= response.data.success_count || relationIds.length;
          
          // 从客户关系映射中移除被删除的关系
          // 需要先找出这些关系所属的客户ID
          const relationsToDelete = this.customerMemberRelations.data.filter(
            relation => relationIds.includes(relation.id)
          );
          
          // 按客户ID分组
          const customerIds = [...new Set(relationsToDelete.map(relation => relation.customer.id))];
          
          // 从每个客户的关系映射中移除
          customerIds.forEach(customerId => {
            if (this.customerMemberRelationsMap[customerId]) {
              this.customerMemberRelationsMap[customerId].data = this.customerMemberRelationsMap[customerId].data.filter(
                relation => !relationIds.includes(relation.id)
              );
              // 更新计数
              const deletedCount = relationsToDelete.filter(
                relation => relation.customer.id === customerId
              ).length;
              this.customerMemberRelationsMap[customerId].total -= deletedCount;
            }
          });
          
          ElMessage.success(response.message || "批量删除客户-会员关系成功");
          return response;
        } else {
          this.error = response.message || "批量删除客户-会员关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量删除客户-会员关系失败", error);
        this.error = error.message || "批量删除客户-会员关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.batchDeleteMemberRelations = false;
      }
    },
    
    /**
     * 按客户ID和会员ID数组批量删除客户-会员关系
     */
    async batchDeleteCustomerMembersByIds(customerId: number, memberIds: number[]) {
      this.loading.batchDeleteMemberRelations = true;
      this.error = null;
      
      try {
        const response = await batchDeleteCustomerMembersByIds(customerId, memberIds);
        if (response.success) {
          // 从关系列表中移除被删除的关系
          // 需要找出会员ID对应的关系ID
          const relationsToDelete = this.customerMemberRelations.data.filter(
            relation => relation.customer.id === customerId && memberIds.includes(relation.member.id)
          );
          
          const relationIds = relationsToDelete.map(relation => relation.id);
          
          // 从全局关系列表中移除
          this.customerMemberRelations.data = this.customerMemberRelations.data.filter(
            relation => !relationIds.includes(relation.id)
          );
          this.customerMemberRelations.total -= response.data.success_count || relationIds.length;
          
          // 从客户关系映射中移除
          if (this.customerMemberRelationsMap[customerId]) {
            this.customerMemberRelationsMap[customerId].data = this.customerMemberRelationsMap[customerId].data.filter(
              relation => !relationIds.includes(relation.id)
            );
            this.customerMemberRelationsMap[customerId].total -= response.data.success_count || relationIds.length;
          }
          
          ElMessage.success(response.message || "批量删除客户-会员关系成功");
          return response;
        } else {
          this.error = response.message || "批量删除客户-会员关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量删除客户-会员关系失败", error);
        this.error = error.message || "批量删除客户-会员关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.batchDeleteMemberRelations = false;
      }
    },
    
    /**
     * 重置客户管理状态
     */
    resetCustomerState() {
      this.customerList = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentCustomer = null;
      this.statistics = null;
      this.customerMemberRelations = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.customerMemberRelationsMap = {};
      this.customerTenantRelations = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.error = null;
    }
  }
});

// 导出组合式API
export function useCustomerStoreHook() {
  return useCustomerStore();
} 
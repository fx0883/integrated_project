import { defineStore } from "pinia";
import { 
  getTenantList, 
  createTenant,
  getTenantDetail,
  updateTenant,
  deleteTenant,
  suspendTenant,
  activateTenant,
  getTenantQuota,
  updateTenantQuota,
  getTenantQuotaUsage,
  getTenantUsers
} from "@/api/modules/tenantManagement";
import type { 
  Tenant,
  TenantQuota,
  TenantUser,
  TenantListParams,
  TenantCreateUpdateParams,
  TenantQuotaUpdateParams,
  TenantUserListParams
} from "@/types/tenant";
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";

interface TenantState {
  // 租户列表数据
  tenantList: PaginationData<Tenant>;
  // 当前选中的租户
  currentTenant: Tenant | null;
  // 当前租户配额
  currentQuota: TenantQuota | null;
  // 当前租户用户列表
  tenantUsers: PaginationData<TenantUser>;
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    suspend: boolean;
    activate: boolean;
    quota: boolean;
    updateQuota: boolean;
    users: boolean;
  };
}

export const useTenantStore = defineStore("tenant", {
  state: (): TenantState => ({
    tenantList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentTenant: null,
    currentQuota: null,
    tenantUsers: {
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
      suspend: false,
      activate: false,
      quota: false,
      updateQuota: false,
      users: false
    }
  }),
  
  actions: {
    /**
     * 获取租户列表
     */
    async fetchTenantList(params: TenantListParams = {}) {
      this.loading.list = true;
      try {
        const response = await getTenantList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.tenantList = {
              total: response.data.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              data: response.data.results || []
            };
          } else {
            logger.warn("租户列表数据结构不符合预期", response.data);
            this.tenantList.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          ElMessage.error(response.message || "获取租户列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取租户列表失败", error);
        ElMessage.error(error.message || "获取租户列表失败");
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取租户详情
     */
    async fetchTenantDetail(id: number) {
      this.loading.detail = true;
      try {
        const response = await getTenantDetail(id);
        if (response.success) {
          this.currentTenant = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取租户详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取租户详情失败", error);
        ElMessage.error(error.message || "获取租户详情失败");
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 创建租户
     */
    async createNewTenant(data: TenantCreateUpdateParams) {
      this.loading.create = true;
      try {
        const response = await createTenant(data);
        if (response.success) {
          ElMessage.success(response.message || "创建租户成功");
          return response;
        } else {
          ElMessage.error(response.message || "创建租户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建租户失败", error);
        ElMessage.error(error.message || "创建租户失败");
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新租户
     */
    async updateTenantInfo(id: number, data: TenantCreateUpdateParams) {
      this.loading.update = true;
      try {
        const response = await updateTenant(id, data);
        if (response.success) {
          // 如果当前选中的租户是被更新的租户，则更新当前选中的租户信息
          if (this.currentTenant && this.currentTenant.id === id) {
            this.currentTenant = response.data;
          }
          ElMessage.success(response.message || "更新租户成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新租户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新租户失败", error);
        ElMessage.error(error.message || "更新租户失败");
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除租户
     */
    async removeTenant(id: number) {
      this.loading.delete = true;
      try {
        const response = await deleteTenant(id);
        if (response.success) {
          // 如果删除的是当前选中的租户，则清空当前选中的租户
          if (this.currentTenant && this.currentTenant.id === id) {
            this.currentTenant = null;
          }
          // 从租户列表中移除被删除的租户
          this.tenantList.data = this.tenantList.data.filter(tenant => tenant.id !== id);
          this.tenantList.total--;
          
          ElMessage.success(response.message || "删除租户成功");
          return response;
        } else {
          ElMessage.error(response.message || "删除租户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除租户失败", error);
        ElMessage.error(error.message || "删除租户失败");
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 暂停租户
     */
    async suspendTenantAction(id: number) {
      this.loading.suspend = true;
      try {
        const response = await suspendTenant(id);
        if (response.success) {
          // 更新租户状态
          if (this.currentTenant && this.currentTenant.id === id) {
            this.currentTenant.status = 'suspended';
          }
          
          // 更新租户列表中的租户状态
          const targetTenant = this.tenantList.data.find(tenant => tenant.id === id);
          if (targetTenant) {
            targetTenant.status = 'suspended';
          }
          
          ElMessage.success(response.message || "暂停租户成功");
          return response;
        } else {
          ElMessage.error(response.message || "暂停租户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("暂停租户失败", error);
        ElMessage.error(error.message || "暂停租户失败");
        throw error;
      } finally {
        this.loading.suspend = false;
      }
    },
    
    /**
     * 激活租户
     */
    async activateTenantAction(id: number) {
      this.loading.activate = true;
      try {
        const response = await activateTenant(id);
        if (response.success) {
          // 更新租户状态
          if (this.currentTenant && this.currentTenant.id === id) {
            this.currentTenant.status = 'active';
          }
          
          // 更新租户列表中的租户状态
          const targetTenant = this.tenantList.data.find(tenant => tenant.id === id);
          if (targetTenant) {
            targetTenant.status = 'active';
          }
          
          ElMessage.success(response.message || "激活租户成功");
          return response;
        } else {
          ElMessage.error(response.message || "激活租户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("激活租户失败", error);
        ElMessage.error(error.message || "激活租户失败");
        throw error;
      } finally {
        this.loading.activate = false;
      }
    },
    
    /**
     * 获取租户配额
     */
    async fetchTenantQuota(id: number) {
      this.loading.quota = true;
      try {
        const response = await getTenantQuota(id);
        if (response.success) {
          this.currentQuota = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取租户配额失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取租户配额失败", error);
        ElMessage.error(error.message || "获取租户配额失败");
        throw error;
      } finally {
        this.loading.quota = false;
      }
    },
    
    /**
     * 获取租户配额使用情况
     */
    async fetchTenantQuotaUsage(id: number) {
      this.loading.quota = true;
      try {
        const response = await getTenantQuotaUsage(id);
        if (response.success) {
          this.currentQuota = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取租户配额使用情况失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取租户配额使用情况失败", error);
        ElMessage.error(error.message || "获取租户配额使用情况失败");
        throw error;
      } finally {
        this.loading.quota = false;
      }
    },
    
    /**
     * 更新租户配额
     */
    async updateTenantQuotaAction(id: number, data: TenantQuotaUpdateParams) {
      this.loading.updateQuota = true;
      try {
        const response = await updateTenantQuota(id, data);
        if (response.success) {
          this.currentQuota = response.data;
          ElMessage.success(response.message || "更新租户配额成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新租户配额失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新租户配额失败", error);
        ElMessage.error(error.message || "更新租户配额失败");
        throw error;
      } finally {
        this.loading.updateQuota = false;
      }
    },
    
    /**
     * 获取租户用户列表
     */
    async fetchTenantUsers(id: number, params: TenantUserListParams = {}) {
      this.loading.users = true;
      try {
        const response = await getTenantUsers(id, params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.tenantUsers = {
              total: response.data.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              data: response.data.results || []
            };
          } else {
            logger.warn("租户用户列表数据结构不符合预期", response.data);
            this.tenantUsers.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          ElMessage.error(response.message || "获取租户用户列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取租户用户列表失败", error);
        ElMessage.error(error.message || "获取租户用户列表失败");
        throw error;
      } finally {
        this.loading.users = false;
      }
    },
    
    /**
     * 重置租户状态
     */
    resetTenantState() {
      this.currentTenant = null;
      this.currentQuota = null;
      this.tenantUsers = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
    }
  }
});

// 导出组合式API风格的hook
export function useTenantStoreHook() {
  return useTenantStore();
} 
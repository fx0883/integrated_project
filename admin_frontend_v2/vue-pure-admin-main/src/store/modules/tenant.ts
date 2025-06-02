import { defineStore } from "pinia";
import { store } from "../utils";
import type { TenantState, TenantListItem, TenantDetail } from "../../../types/tenant";
import { 
  getTenants, 
  getTenantById, 
  createTenant, 
  updateTenant, 
  deleteTenant, 
  getTenantQuota, 
  updateTenantQuota, 
  getTenantQuotaUsage, 
  suspendTenant, 
  activateTenant 
} from "@/api/tenant";

export const useTenantStore = defineStore("tenant", {
  state: (): TenantState => ({
    tenants: [],
    total: 0,
    loading: false,
    currentTenant: null
  }),
  getters: {
    getTenantById: state => (id: number): TenantListItem | undefined => {
      return state.tenants.find(tenant => tenant.id === id);
    }
  },
  actions: {
    /** 获取租户列表 */
    async fetchTenants(params: any = {}) {
      this.loading = true;
      try {
        const { data } = await getTenants(params);
        if (data) {
          this.tenants = data.list;
          this.total = data.total;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取租户列表失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取租户详情 */
    async fetchTenantDetail(id: number) {
      this.loading = true;
      try {
        const { data } = await getTenantById(id);
        if (data) {
          this.currentTenant = data;
          return data;
        }
        return null;
      } catch (error) {
        console.error("获取租户详情失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 创建租户 */
    async createTenant(tenantData: any) {
      this.loading = true;
      try {
        const result = await createTenant(tenantData);
        return result;
      } catch (error) {
        console.error("创建租户失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 更新租户 */
    async updateTenant(id: number, tenantData: any) {
      this.loading = true;
      try {
        const result = await updateTenant(id, tenantData);
        return result;
      } catch (error) {
        console.error("更新租户失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 删除租户 */
    async deleteTenant(id: number) {
      this.loading = true;
      try {
        const result = await deleteTenant(id);
        if (result.success) {
          // 删除成功后更新列表
          this.tenants = this.tenants.filter(tenant => tenant.id !== id);
        }
        return result;
      } catch (error) {
        console.error("删除租户失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取租户配额 */
    async fetchTenantQuota(id: number) {
      try {
        const result = await getTenantQuota(id);
        return result;
      } catch (error) {
        console.error("获取租户配额失败:", error);
        return null;
      }
    },

    /** 更新租户配额 */
    async updateTenantQuota(id: number, quotaData: any) {
      this.loading = true;
      try {
        const result = await updateTenantQuota(id, quotaData);
        return result;
      } catch (error) {
        console.error("更新租户配额失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 获取租户配额使用情况 */
    async fetchTenantQuotaUsage(id: number) {
      try {
        const result = await getTenantQuotaUsage(id);
        return result;
      } catch (error) {
        console.error("获取租户配额使用情况失败:", error);
        return null;
      }
    },

    /** 暂停租户 */
    async suspendTenant(id: number) {
      this.loading = true;
      try {
        const result = await suspendTenant(id);
        if (result.success && this.currentTenant && this.currentTenant.id === id) {
          this.currentTenant.status = "suspended";
        }
        return result;
      } catch (error) {
        console.error("暂停租户失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 激活租户 */
    async activateTenant(id: number) {
      this.loading = true;
      try {
        const result = await activateTenant(id);
        if (result.success && this.currentTenant && this.currentTenant.id === id) {
          this.currentTenant.status = "active";
        }
        return result;
      } catch (error) {
        console.error("激活租户失败:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /** 重置状态 */
    resetState() {
      this.tenants = [];
      this.total = 0;
      this.currentTenant = null;
    }
  }
});

export function useTenantStoreHook() {
  return useTenantStore(store);
} 
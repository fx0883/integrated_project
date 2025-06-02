import { defineStore } from "pinia";
import { message } from "@/utils/message";
import { formatResponse, handleResponse } from "@/utils/http/response";
import { apiCache, cacheApiResult } from "@/utils/cache";
import { 
  getSuperAdminDashboard,
  getTenantAdminDashboard,
  getUserDashboard,
  getSystemOverview,
  getTenantStatistics,
  getUserActivity,
  getContentStatistics,
  getCheckInCompletion
} from "@/api/dashboard";
import { useUserStoreHook } from "../user";

// 仪表盘状态接口
interface DashboardState {
  superAdminData: any | null;
  tenantAdminData: any | null;
  userData: any | null;
  loading: boolean;
}

// 缓存过期时间配置(毫秒)
const CACHE_EXPIRES = {
  DASHBOARD: 5 * 60 * 1000, // 仪表盘数据缓存5分钟
  ACTIVITY: 15 * 60 * 1000, // 活跃度数据缓存15分钟
  STATISTICS: 30 * 60 * 1000 // 统计数据缓存30分钟
};

export const useDashboardStore = defineStore("dashboard", {
  state: (): DashboardState => ({
    superAdminData: null,
    tenantAdminData: null,
    userData: null,
    loading: false
  }),

  getters: {
    // 根据当前用户角色获取相应的仪表盘数据
    currentDashboardData(state) {
      const userStore = useUserStoreHook();
      const roles = userStore.roles || [];
      
      if (roles.includes("super_admin") && state.superAdminData) {
        return state.superAdminData;
      }
      
      if (roles.includes("tenant_admin") && state.tenantAdminData) {
        return state.tenantAdminData;
      }
      
      return state.userData;
    }
  },

  actions: {
    /**
     * 根据用户角色获取对应的仪表盘数据
     * @param forceRefresh 是否强制刷新数据
     */
    async fetchDashboardByRole(forceRefresh = false) {
      this.loading = true;
      
      try {
        const userStore = useUserStoreHook();
        const roles = userStore.roles || [];
        
        if (roles.includes("super_admin")) {
          await this.fetchSuperAdminDashboard(forceRefresh);
          return this.superAdminData;
        }
        
        if (roles.includes("tenant_admin")) {
          const tenantId = userStore.getCurrentTenantId();
          await this.fetchTenantAdminDashboard(tenantId, forceRefresh);
          return this.tenantAdminData;
        }
        
        await this.fetchUserDashboard(forceRefresh);
        return this.userData;
      } catch (error) {
        console.error("获取仪表盘数据失败:", error);
        message("获取仪表盘数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 获取超级管理员仪表盘数据
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchSuperAdminDashboard(forceRefresh = false) {
      this.loading = true;
      
      try {
        const cacheKey = "dashboard:super_admin";
        
        const data = await cacheApiResult(
          () => getSuperAdminDashboard(),
          cacheKey,
          CACHE_EXPIRES.DASHBOARD,
          forceRefresh
        );
        
        if (data) {
          this.superAdminData = data;
          return this.superAdminData;
        }
        return null;
      } catch (error) {
        console.error("获取超级管理员仪表盘数据失败:", error);
        message("获取超级管理员仪表盘数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 获取租户管理员仪表盘数据
     * @param tenantId 租户ID
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchTenantAdminDashboard(tenantId?: number, forceRefresh = false) {
      this.loading = true;
      
      try {
        const cacheKey = `dashboard:tenant_admin:${tenantId || 'default'}`;
        
        const data = await cacheApiResult(
          () => getTenantAdminDashboard(tenantId),
          cacheKey,
          CACHE_EXPIRES.DASHBOARD,
          forceRefresh
        );
        
        if (data) {
          this.tenantAdminData = data;
          return this.tenantAdminData;
        }
        return null;
      } catch (error) {
        console.error("获取租户管理员仪表盘数据失败:", error);
        message("获取租户管理员仪表盘数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 获取普通用户仪表盘数据
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchUserDashboard(forceRefresh = false) {
      this.loading = true;
      
      try {
        const cacheKey = "dashboard:user";
        
        const data = await cacheApiResult(
          () => getUserDashboard(),
          cacheKey,
          CACHE_EXPIRES.DASHBOARD,
          forceRefresh
        );
        
        if (data) {
          this.userData = data;
          return this.userData;
        }
        return null;
      } catch (error) {
        console.error("获取用户仪表盘数据失败:", error);
        message("获取用户仪表盘数据失败", { type: "error" });
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 获取系统概况数据
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchSystemOverview(forceRefresh = false) {
      try {
        const cacheKey = "dashboard:system_overview";
        
        return await cacheApiResult(
          () => getSystemOverview(),
          cacheKey,
          CACHE_EXPIRES.STATISTICS,
          forceRefresh
        );
      } catch (error) {
        console.error("获取系统概况数据失败:", error);
        message("获取系统概况数据失败", { type: "error" });
        return null;
      }
    },
    
    /**
     * 获取租户统计数据
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchTenantStatistics(forceRefresh = false) {
      try {
        const cacheKey = "dashboard:tenant_statistics";
        
        return await cacheApiResult(
          () => getTenantStatistics(),
          cacheKey,
          CACHE_EXPIRES.STATISTICS,
          forceRefresh
        );
      } catch (error) {
        console.error("获取租户统计数据失败:", error);
        message("获取租户统计数据失败", { type: "error" });
        return null;
      }
    },
    
    /**
     * 获取用户活跃度数据
     * @param params 查询参数
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchUserActivity(params?: any, forceRefresh = false) {
      try {
        // 根据参数生成不同的缓存键
        const paramStr = params ? JSON.stringify(params) : 'default';
        const cacheKey = `dashboard:user_activity:${paramStr}`;
        
        return await cacheApiResult(
          () => getUserActivity(params),
          cacheKey,
          CACHE_EXPIRES.ACTIVITY,
          forceRefresh
        );
      } catch (error) {
        console.error("获取用户活跃度数据失败:", error);
        message("获取用户活跃度数据失败", { type: "error" });
        return null;
      }
    },
    
    /**
     * 获取内容统计数据
     * @param params 查询参数
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchContentStatistics(params?: any, forceRefresh = false) {
      try {
        // 根据参数生成不同的缓存键
        const paramStr = params ? JSON.stringify(params) : 'default';
        const cacheKey = `dashboard:content_statistics:${paramStr}`;
        
        return await cacheApiResult(
          () => getContentStatistics(params),
          cacheKey,
          CACHE_EXPIRES.STATISTICS,
          forceRefresh
        );
      } catch (error) {
        console.error("获取内容统计数据失败:", error);
        message("获取内容统计数据失败", { type: "error" });
        return null;
      }
    },
    
    /**
     * 获取打卡完成率数据
     * @param params 查询参数
     * @param forceRefresh 是否强制刷新缓存
     */
    async fetchCheckInCompletion(params?: any, forceRefresh = false) {
      try {
        // 根据参数生成不同的缓存键
        const paramStr = params ? JSON.stringify(params) : 'default';
        const cacheKey = `dashboard:check_in_completion:${paramStr}`;
        
        return await cacheApiResult(
          () => getCheckInCompletion(params),
          cacheKey,
          CACHE_EXPIRES.STATISTICS,
          forceRefresh
        );
      } catch (error) {
        console.error("获取打卡完成率数据失败:", error);
        message("获取打卡完成率数据失败", { type: "error" });
        return null;
      }
    },
    
    /**
     * 重置仪表盘数据和缓存
     */
    resetDashboard() {
      this.superAdminData = null;
      this.tenantAdminData = null;
      this.userData = null;
      
      // 清除所有仪表盘相关缓存
      apiCache.clearByPrefix('dashboard:');
    }
  }
});

export function useDashboardStoreHook() {
  return useDashboardStore();
} 
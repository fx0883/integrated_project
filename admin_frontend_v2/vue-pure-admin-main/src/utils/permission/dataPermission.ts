import { useUserStoreHook } from "@/store/modules/user";
import { useTenantStoreHook } from "@/store/modules/tenant";

/**
 * 数据权限类型
 * - none: 无数据权限
 * - self: 仅本人数据
 * - dept: 本部门数据
 * - tenant: 本租户数据
 * - all: 所有数据
 */
export type DataPermissionType = "none" | "self" | "dept" | "tenant" | "all";

/**
 * 数据权限控制器
 */
class DataPermissionController {
  /**
   * 获取当前用户的数据权限类型
   * @returns 数据权限类型
   */
  getDataPermissionType(): DataPermissionType {
    const userStore = useUserStoreHook();
    const roles = userStore.roles || [];
    
    // 超级管理员拥有所有数据权限
    if (roles.includes("super_admin")) {
      return "all";
    }
    
    // 租户管理员拥有租户内数据权限
    if (roles.includes("tenant_admin")) {
      return "tenant";
    }
    
    // 部门管理员拥有部门数据权限
    if (roles.includes("dept_admin")) {
      return "dept";
    }
    
    // 普通用户仅拥有自己的数据权限
    return "self";
  }
  
  /**
   * 获取当前用户的租户ID
   * @returns 租户ID
   */
  getCurrentTenantId(): number | null {
    const userStore = useUserStoreHook();
    return userStore.tenantId || null;
  }
  
  /**
   * 获取当前用户的部门ID
   * @returns 部门ID
   */
  getCurrentDeptId(): number | null {
    const userStore = useUserStoreHook();
    return userStore.deptId || null;
  }
  
  /**
   * 获取当前用户ID
   * @returns 用户ID
   */
  getCurrentUserId(): number | null {
    const userStore = useUserStoreHook();
    return userStore.userId || null;
  }
  
  /**
   * 根据数据权限类型获取过滤参数
   * @returns 过滤参数对象
   */
  getFilterParams() {
    const permissionType = this.getDataPermissionType();
    const params: Record<string, any> = {};
    
    switch (permissionType) {
      case "all":
        // 超级管理员无需过滤
        break;
      case "tenant":
        // 租户管理员过滤租户
        const tenantId = this.getCurrentTenantId();
        if (tenantId) {
          params.tenant_id = tenantId;
        }
        break;
      case "dept":
        // 部门管理员过滤部门
        const deptId = this.getCurrentDeptId();
        if (deptId) {
          params.dept_id = deptId;
        }
        break;
      case "self":
        // 普通用户过滤用户
        const userId = this.getCurrentUserId();
        if (userId) {
          params.user_id = userId;
          params.created_by = userId;
        }
        break;
      case "none":
      default:
        // 无数据权限，返回空数据
        params._none = true;
        break;
    }
    
    return params;
  }
  
  /**
   * 判断是否有权限访问某条数据
   * @param data 数据对象
   * @returns 是否有权限
   */
  hasPermission(data: any): boolean {
    if (!data) return false;
    
    const permissionType = this.getDataPermissionType();
    
    // 超级管理员有所有权限
    if (permissionType === "all") {
      return true;
    }
    
    // 租户管理员可访问本租户数据
    if (permissionType === "tenant") {
      const tenantId = this.getCurrentTenantId();
      return data.tenant_id === tenantId;
    }
    
    // 部门管理员可访问本部门数据
    if (permissionType === "dept") {
      const deptId = this.getCurrentDeptId();
      return data.dept_id === deptId;
    }
    
    // 普通用户只能访问自己的数据
    if (permissionType === "self") {
      const userId = this.getCurrentUserId();
      return data.user_id === userId || data.created_by === userId;
    }
    
    return false;
  }
  
  /**
   * 数据过滤器
   * @param dataList 数据列表
   * @returns 过滤后的数据列表
   */
  filterData<T extends Record<string, any>>(dataList: T[]): T[] {
    if (!dataList || dataList.length === 0) {
      return [];
    }
    
    const permissionType = this.getDataPermissionType();
    
    // 超级管理员无需过滤
    if (permissionType === "all") {
      return dataList;
    }
    
    // 根据权限类型过滤数据
    return dataList.filter(item => this.hasPermission(item));
  }
}

// 导出单例
export const dataPermission = new DataPermissionController(); 
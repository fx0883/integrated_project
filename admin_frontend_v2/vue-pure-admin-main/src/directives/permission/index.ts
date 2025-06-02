import type { App, Directive } from "vue";
import { usePermissionStoreHook } from "@/store/modules/permission";

/**
 * 按钮级别权限控制指令
 * 使用方式：v-permission="'user:add'"
 */
const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const permissionStore = usePermissionStoreHook();
    
    if (value && typeof value === 'string') {
      const hasPermission = permissionStore.hasPermission(value);
      
      if (!hasPermission) {
        // 无权限，移除元素
        el.parentNode?.removeChild(el);
      }
    } else {
      throw new Error("使用方式：v-permission=\"'xxx'\", 其中xxx为权限标识");
    }
  }
};

/**
 * 角色级别权限控制指令
 * 使用方式：v-role="'admin'"
 */
const role: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const permissionStore = usePermissionStoreHook();
    
    if (value && typeof value === 'string') {
      const hasRole = permissionStore.hasRole(value);
      
      if (!hasRole) {
        // 无权限，移除元素
        el.parentNode?.removeChild(el);
      }
    } else {
      throw new Error("使用方式：v-role=\"'xxx'\", 其中xxx为角色标识");
    }
  }
};

export function setupPermissionDirectives(app: App) {
  // 注册 v-permission 指令
  app.directive('permission', permission);
  
  // 注册 v-role 指令
  app.directive('role', role);
}

export default permission; 
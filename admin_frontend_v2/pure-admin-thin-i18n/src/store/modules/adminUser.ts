import { defineStore } from "pinia";
import {
  getAdminUserList,
  getAdminUserDetail,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  grantSuperAdmin,
  revokeSuperAdmin,
  activateAdminUser,
  deactivateAdminUser,
  createSuperAdmin,
  resetAdminUserPassword,
  uploadAdminUserAvatar
} from "@/api/modules/adminUser";
import type {
  AdminUser,
  AdminUserListParams,
  AdminUserCreateParams,
  AdminUserUpdateParams,
  ResetPasswordParams
} from "@/types/adminUser";
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";

interface AdminUserState {
  // 管理员用户列表数据
  adminUserList: PaginationData<AdminUser>;
  // 当前选中的管理员用户
  currentAdminUser: AdminUser | null;
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    grantSuperAdmin: boolean;
    revokeSuperAdmin: boolean;
    activate: boolean;
    deactivate: boolean;
    resetPassword: boolean;
    uploadAvatar: boolean;
    createSuperAdmin: boolean;
  };
}

export const useAdminUserStore = defineStore("adminUser", {
  state: (): AdminUserState => ({
    adminUserList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentAdminUser: null,
    loading: {
      list: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      grantSuperAdmin: false,
      revokeSuperAdmin: false,
      activate: false,
      deactivate: false,
      resetPassword: false,
      uploadAvatar: false,
      createSuperAdmin: false
    }
  }),
  
  actions: {
    /**
     * 获取管理员用户列表
     */
    async fetchAdminUserList(params: AdminUserListParams = {}) {
      this.loading.list = true;
      try {
        const response = await getAdminUserList(params);
        if (response.success) {
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.adminUserList = {
              total: response.data.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              data: response.data.results || []
            };
          } else {
            logger.warn("管理员用户列表数据结构不符合预期", response.data);
            this.adminUserList.data = Array.isArray(response.data) ? response.data : [];
          }
          return response;
        } else {
          ElMessage.error(response.message || "获取管理员用户列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取管理员用户列表失败", error);
        ElMessage.error(error.message || "获取管理员用户列表失败");
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取管理员用户详情
     */
    async fetchAdminUserDetail(id: number) {
      this.loading.detail = true;
      try {
        const response = await getAdminUserDetail(id);
        if (response.success) {
          this.currentAdminUser = response.data;
          return response;
        } else {
          ElMessage.error(response.message || "获取管理员用户详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取管理员用户详情失败", error);
        ElMessage.error(error.message || "获取管理员用户详情失败");
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 创建管理员用户
     */
    async createNewAdminUser(data: AdminUserCreateParams) {
      this.loading.create = true;
      try {
        const response = await createAdminUser(data);
        if (response.success) {
          ElMessage.success(response.message || "创建管理员用户成功");
          return response;
        } else {
          ElMessage.error(response.message || "创建管理员用户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建管理员用户失败", error);
        ElMessage.error(error.message || "创建管理员用户失败");
        throw error;
      } finally {
        this.loading.create = false;
      }
    },

    /**
     * 创建超级管理员用户
     */
    async createNewSuperAdmin(data: AdminUserCreateParams) {
      this.loading.createSuperAdmin = true;
      try {
        const response = await createSuperAdmin(data);
        if (response.success) {
          ElMessage.success(response.message || "创建超级管理员成功");
          return response;
        } else {
          ElMessage.error(response.message || "创建超级管理员失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建超级管理员失败", error);
        ElMessage.error(error.message || "创建超级管理员失败");
        throw error;
      } finally {
        this.loading.createSuperAdmin = false;
      }
    },
    
    /**
     * 更新管理员用户
     */
    async updateAdminUserInfo(id: number, data: AdminUserUpdateParams) {
      this.loading.update = true;
      try {
        const response = await updateAdminUser(id, data);
        if (response.success) {
          // 如果当前选中的管理员用户是被更新的用户，则更新当前选中的用户信息
          if (this.currentAdminUser && this.currentAdminUser.id === id) {
            this.currentAdminUser = response.data;
          }
          ElMessage.success(response.message || "更新管理员用户成功");
          return response;
        } else {
          ElMessage.error(response.message || "更新管理员用户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新管理员用户失败", error);
        ElMessage.error(error.message || "更新管理员用户失败");
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除管理员用户
     */
    async removeAdminUser(id: number) {
      this.loading.delete = true;
      try {
        const response = await deleteAdminUser(id);
        if (response.success) {
          // 如果删除的是当前选中的管理员用户，则清空当前选中的用户
          if (this.currentAdminUser && this.currentAdminUser.id === id) {
            this.currentAdminUser = null;
          }
          // 刷新列表
          this.adminUserList.data = this.adminUserList.data.filter(item => item.id !== id);
          ElMessage.success(response.message || "删除管理员用户成功");
          return response;
        } else {
          ElMessage.error(response.message || "删除管理员用户失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除管理员用户失败", error);
        ElMessage.error(error.message || "删除管理员用户失败");
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 授予超级管理员权限
     */
    async grantSuperAdminAction(id: number) {
      this.loading.grantSuperAdmin = true;
      try {
        const response = await grantSuperAdmin(id);
        if (response.success) {
          // 如果授权的是当前选中的管理员用户，则更新当前选中的用户信息
          if (this.currentAdminUser && this.currentAdminUser.id === id) {
            this.currentAdminUser = response.data;
          }
          // 更新列表中的数据
          const index = this.adminUserList.data.findIndex(item => item.id === id);
          if (index !== -1) {
            this.adminUserList.data[index] = {
              ...this.adminUserList.data[index],
              is_super_admin: true,
              role: "超级管理员"
            };
          }
          ElMessage.success(response.message || "授予超级管理员权限成功");
          return response;
        } else {
          ElMessage.error(response.message || "授予超级管理员权限失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("授予超级管理员权限失败", error);
        ElMessage.error(error.message || "授予超级管理员权限失败");
        throw error;
      } finally {
        this.loading.grantSuperAdmin = false;
      }
    },
    
    /**
     * 撤销超级管理员权限
     */
    async revokeSuperAdminAction(id: number, tenantId?: number) {
      logger.debug("Store Action: 开始执行撤销超级管理员权限", { id, tenantId });
      this.loading.revokeSuperAdmin = true;
      try {
        // 如果没有提供租户ID，则使用第一个可用的租户ID
        let targetTenantId = tenantId;
        if (!targetTenantId) {
          // 这里我们需要获取可用的租户列表或使用默认租户
          // 理想情况下，应该调用获取租户列表的API，但为了简化，这里使用一个默认值
          targetTenantId = 1; // 默认使用ID为1的租户
          logger.warn("撤销超级管理员权限时未提供租户ID，使用默认租户ID", { defaultTenantId: targetTenantId });
        }

        logger.debug("Store Action: 调用API撤销超级管理员权限", { id, targetTenantId });
        const response = await revokeSuperAdmin(id, targetTenantId);
        logger.debug("Store Action: API返回结果", response);
        if (response.success) {
          // 如果撤销的是当前选中的管理员用户，则更新当前选中的用户信息
          if (this.currentAdminUser && this.currentAdminUser.id === id) {
            this.currentAdminUser = response.data;
          }
          // 更新列表中的数据
          const index = this.adminUserList.data.findIndex(item => item.id === id);
          if (index !== -1) {
            this.adminUserList.data[index] = {
              ...this.adminUserList.data[index],
              is_super_admin: false,
              role: "管理员",
              // 更新租户信息
              tenant: targetTenantId,
              tenant_name: response.data?.tenant_name || "未知租户"
            };
          }
          ElMessage.success(response.message || "撤销超级管理员权限成功");
          return response;
        } else {
          ElMessage.error(response.message || "撤销超级管理员权限失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("撤销超级管理员权限失败", error);
        ElMessage.error(error.message || "撤销超级管理员权限失败");
        throw error;
      } finally {
        this.loading.revokeSuperAdmin = false;
      }
    },
    
    /**
     * 激活管理员账号
     */
    async activateAdminUserAction(id: number) {
      this.loading.activate = true;
      try {
        const response = await activateAdminUser(id);
        if (response.success) {
          // 如果激活的是当前选中的管理员用户，则更新当前选中的用户信息
          if (this.currentAdminUser && this.currentAdminUser.id === id) {
            this.currentAdminUser = response.data;
          }
          // 更新列表中的数据
          const index = this.adminUserList.data.findIndex(item => item.id === id);
          if (index !== -1) {
            this.adminUserList.data[index] = {
              ...this.adminUserList.data[index],
              is_active: true,
              status: "active"
            };
          }
          ElMessage.success(response.message || "激活管理员账号成功");
          return response;
        } else {
          ElMessage.error(response.message || "激活管理员账号失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("激活管理员账号失败", error);
        ElMessage.error(error.message || "激活管理员账号失败");
        throw error;
      } finally {
        this.loading.activate = false;
      }
    },
    
    /**
     * 停用管理员账号
     */
    async deactivateAdminUserAction(id: number) {
      this.loading.deactivate = true;
      try {
        const response = await deactivateAdminUser(id);
        if (response.success) {
          // 如果停用的是当前选中的管理员用户，则更新当前选中的用户信息
          if (this.currentAdminUser && this.currentAdminUser.id === id) {
            this.currentAdminUser = response.data;
          }
          // 更新列表中的数据
          const index = this.adminUserList.data.findIndex(item => item.id === id);
          if (index !== -1) {
            this.adminUserList.data[index] = {
              ...this.adminUserList.data[index],
              is_active: false,
              status: "inactive"
            };
          }
          ElMessage.success(response.message || "停用管理员账号成功");
          return response;
        } else {
          ElMessage.error(response.message || "停用管理员账号失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("停用管理员账号失败", error);
        ElMessage.error(error.message || "停用管理员账号失败");
        throw error;
      } finally {
        this.loading.deactivate = false;
      }
    },

    /**
     * 重置管理员密码
     */
    async resetAdminUserPasswordAction(id: number, data: ResetPasswordParams) {
      this.loading.resetPassword = true;
      try {
        const response = await resetAdminUserPassword(id, data);
        if (response.success) {
          ElMessage.success(response.message || "重置管理员密码成功");
          return response;
        } else {
          ElMessage.error(response.message || "重置管理员密码失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("重置管理员密码失败", error);
        ElMessage.error(error.message || "重置管理员密码失败");
        throw error;
      } finally {
        this.loading.resetPassword = false;
      }
    },

    /**
     * 上传管理员头像
     */
    async uploadAdminUserAvatarAction(id: number, formData: FormData) {
      this.loading.uploadAvatar = true;
      try {
        const response = await uploadAdminUserAvatar(id, formData);
        if (response.success) {
          // 如果上传的是当前选中的管理员用户的头像，则更新当前选中的用户信息
          if (this.currentAdminUser && this.currentAdminUser.id === id) {
            this.currentAdminUser = {
              ...this.currentAdminUser,
              avatar: response.data.avatar
            };
          }
          ElMessage.success(response.message || "上传头像成功");
          return response;
        } else {
          ElMessage.error(response.message || "上传头像失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("上传头像失败", error);
        ElMessage.error(error.message || "上传头像失败");
        throw error;
      } finally {
        this.loading.uploadAvatar = false;
      }
    },
    
    /**
     * 重置状态
     */
    resetAdminUserState() {
      this.adminUserList = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentAdminUser = null;
    }
  }
});

/**
 * 封装使用管理员用户Store的hook
 */
export function useAdminUserStoreHook() {
  return useAdminUserStore();
} 
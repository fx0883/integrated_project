/**
 * 会员管理Vuex Store模块
 * 
 * 本模块提供与会员管理相关的状态管理，包括会员列表、详情、子账号管理、
 * 会员-客户关系管理和头像管理等功能。
 */

import { defineStore } from "pinia";
import {
  getMemberList,
  getMemberDetail,
  createMember,
  updateMember,
  deleteMember,
  getCurrentMember,
  getSubAccountList,
  getSubAccountDetail,
  createSubAccount,
  updateSubAccount,
  deleteSubAccount,
  getMemberCustomerRelations,
  createMemberCustomerRelation,
  getMemberCustomerRelationDetail,
  updateMemberCustomerRelation,
  deleteMemberCustomerRelation,
  setPrimaryCustomerRelation,
  getPrimaryCustomerRelation,
  uploadCurrentAvatar,
  uploadMemberAvatar,
  changePassword,
  resetMemberPassword
} from "@/api/modules/member";
import type {
  Member,
  MemberListParams,
  MemberCreateUpdateParams,
  SubAccount,
  SubAccountCreateUpdateParams,
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams
} from "@/types/member";
import type { PaginationData } from "@/types/api";
import { ElMessage } from "element-plus";
import logger from "@/utils/logger";

interface MemberState {
  // 会员列表数据
  memberList: PaginationData<Member>;
  // 当前选中的会员
  currentMember: Member | null;
  // 子账号列表数据
  subAccounts: PaginationData<SubAccount>;
  // 会员-客户关系列表数据
  memberCustomerRelations: PaginationData<MemberCustomerRelation>;
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    subAccounts: boolean;
    createSubAccount: boolean;
    updateSubAccount: boolean;
    deleteSubAccount: boolean;
    customerRelations: boolean;
    createCustomerRelation: boolean;
    updateCustomerRelation: boolean;
    deleteCustomerRelation: boolean;
    setPrimaryRelation: boolean;
    uploadAvatar: boolean;
    changePassword: boolean;
    resetPassword: boolean;
  };
  // 错误信息
  error: string | null;
}

export const useMemberStore = defineStore("member", {
  state: (): MemberState => ({
    memberList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentMember: null,
    subAccounts: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    memberCustomerRelations: {
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
      subAccounts: false,
      createSubAccount: false,
      updateSubAccount: false,
      deleteSubAccount: false,
      customerRelations: false,
      createCustomerRelation: false,
      updateCustomerRelation: false,
      deleteCustomerRelation: false,
      setPrimaryRelation: false,
      uploadAvatar: false,
      changePassword: false,
      resetPassword: false
    },
    error: null
  }),
  
  getters: {
    // 获取会员列表
    getMembers: (state) => state.memberList.data,
    
    // 获取当前会员
    getCurrentMember: (state) => state.currentMember,
    
    // 获取子账号列表
    getSubAccounts: (state) => state.subAccounts.data,
    
    // 获取会员-客户关系列表
    getCustomerRelations: (state) => state.memberCustomerRelations.data,
    
    // 获取加载状态
    isLoading: (state) => (key: keyof MemberState['loading']) => state.loading[key],
    
    // 获取错误信息
    getError: (state) => state.error
  },
  
  actions: {
    /**
     * 获取会员列表
     */
    async fetchMemberList(params: MemberListParams = {}) {
      this.loading.list = true;
      this.error = null;
      
      try {
        const response = await getMemberList(params);
        if (response.success) {
          this.memberList = {
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10,
            data: response.data.results || []
          };
          return response;
        } else {
          this.error = response.message || "获取会员列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取会员列表失败", error);
        this.error = error.message || "获取会员列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取会员详情
     */
    async fetchMemberDetail(id: number) {
      this.loading.detail = true;
      this.error = null;
      
      try {
        const response = await getMemberDetail(id);
        if (response.success) {
          this.currentMember = response.data;
          return response;
        } else {
          this.error = response.message || "获取会员详情失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取会员详情失败", error);
        this.error = error.message || "获取会员详情失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 创建会员
     */
    async createNewMember(data: MemberCreateUpdateParams) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const response = await createMember(data);
        if (response.success) {
          ElMessage.success(response.message || "创建会员成功");
          return response;
        } else {
          this.error = response.message || "创建会员失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("创建会员失败", error);
        this.error = error.message || "创建会员失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新会员
     */
    async updateMemberInfo(id: number, data: MemberCreateUpdateParams) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await updateMember(id, data);
        if (response.success) {
          // 如果更新的是当前会员，则更新currentMember
          if (this.currentMember && this.currentMember.id === id) {
            this.currentMember = response.data;
          }
          ElMessage.success(response.message || "更新会员成功");
          return response;
        } else {
          this.error = response.message || "更新会员失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("更新会员失败", error);
        this.error = error.message || "更新会员失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除会员
     */
    async removeMember(id: number) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        const response = await deleteMember(id);
        if (response.success) {
          // 如果删除的是当前会员，则清空currentMember
          if (this.currentMember && this.currentMember.id === id) {
            this.currentMember = null;
          }
          // 从列表中移除被删除的会员
          this.memberList.data = this.memberList.data.filter(member => member.id !== id);
          ElMessage.success(response.message || "删除会员成功");
          return response;
        } else {
          this.error = response.message || "删除会员失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("删除会员失败", error);
        this.error = error.message || "删除会员失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 获取子账号列表
     */
    async fetchSubAccounts(params: MemberListParams = {}) {
      this.loading.subAccounts = true;
      this.error = null;
      
      try {
        const response = await getSubAccountList(params);
        if (response.success) {
          this.subAccounts = {
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10,
            data: response.data.results || []
          };
          return response;
        } else {
          this.error = response.message || "获取子账号列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取子账号列表失败", error);
        this.error = error.message || "获取子账号列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.subAccounts = false;
      }
    },
    
    /**
     * 创建子账号
     */
    async createNewSubAccount(data: SubAccountCreateUpdateParams) {
      this.loading.createSubAccount = true;
      this.error = null;
      
      try {
        const response = await createSubAccount(data);
        if (response.success) {
          ElMessage.success(response.message || "创建子账号成功");
          return response;
        } else {
          this.error = response.message || "创建子账号失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("创建子账号失败", error);
        this.error = error.message || "创建子账号失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.createSubAccount = false;
      }
    },
    
    /**
     * 获取会员-客户关系列表
     */
    async fetchCustomerRelations(memberId: number, params: any = {}) {
      this.loading.customerRelations = true;
      this.error = null;
      
      try {
        const response = await getMemberCustomerRelations(memberId, params);
        if (response.success) {
          this.memberCustomerRelations = {
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10,
            data: response.data.results || []
          };
          return response;
        } else {
          this.error = response.message || "获取会员-客户关系列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取会员-客户关系列表失败", error);
        this.error = error.message || "获取会员-客户关系列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.customerRelations = false;
      }
    },
    
    /**
     * 创建会员-客户关系
     */
    async createCustomerRelation(data: MemberCustomerRelationCreateUpdateParams) {
      this.loading.createCustomerRelation = true;
      this.error = null;
      
      try {
        const response = await createMemberCustomerRelation(data);
        if (response.success) {
          ElMessage.success(response.message || "创建会员-客户关系成功");
          return response;
        } else {
          this.error = response.message || "创建会员-客户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("创建会员-客户关系失败", error);
        this.error = error.message || "创建会员-客户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.createCustomerRelation = false;
      }
    },
    
    /**
     * 上传会员头像
     */
    async uploadAvatar(id: number | null, formData: FormData) {
      this.loading.uploadAvatar = true;
      this.error = null;
      
      try {
        let response;
        if (id === null) {
          // 上传当前会员头像
          response = await uploadCurrentAvatar(formData);
        } else {
          // 上传指定会员头像
          response = await uploadMemberAvatar(id, formData);
        }
        
        if (response.success) {
          // 如果上传的是当前会员的头像，则更新currentMember
          if (this.currentMember && (id === null || this.currentMember.id === id)) {
            this.currentMember = {
              ...this.currentMember,
              avatar: response.data.avatar
            };
          }
          ElMessage.success(response.message || "上传头像成功");
          return response;
        } else {
          this.error = response.message || "上传头像失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("上传头像失败", error);
        this.error = error.message || "上传头像失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.uploadAvatar = false;
      }
    },
    
    /**
     * 重置会员状态
     */
    resetMemberState() {
      this.memberList = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.currentMember = null;
      this.subAccounts = {
        total: 0,
        page: 1,
        limit: 10,
        data: []
      };
      this.memberCustomerRelations = {
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
export function useMemberStoreHook() {
  return useMemberStore();
} 
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import {
  getMemberList,
  getMemberDetail,
  createMember,
  updateMember,
  deleteMember,
  searchMembers,
  bulkUpdateMembers,
  bulkDeleteMembers,
  getMemberCustomerRelations,
  createMemberCustomerRelation,
  getMemberCustomerRelationDetail,
  updateMemberCustomerRelation,
  deleteMemberCustomerRelations,
  setPrimaryCustomerRelation,
  getPrimaryCustomerRelation,
  resetMemberPassword,
  uploadMemberAvatar
} from "@/api/modules/member";
import { http } from "@/utils/http";
import type {
  Member,
  MemberListParams,
  MemberCreateUpdateParams,
  MemberCustomerRelation,
  MemberCustomerRelationCreateUpdateParams,
  MemberPasswordResetParams,
  MemberBulkOperationParams
} from "@/types/member";
import type { PaginationData, ApiResponse } from "@/types/api";
import logger from "@/utils/logger";

interface MemberState {
  // 会员列表数据
  memberList: PaginationData<Member>;
  // 当前选中的会员
  currentMember: Member | null;
  // 当前会员的客户关系列表
  memberCustomerRelations: PaginationData<MemberCustomerRelation>;
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    bulkUpdate: boolean;
    bulkDelete: boolean;
    customerRelations: boolean;
    createCustomerRelation: boolean;
    updateCustomerRelation: boolean;
    deleteCustomerRelation: boolean;
    resetPassword: boolean;
    uploadAvatar: boolean;
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
      bulkUpdate: false,
      bulkDelete: false,
      customerRelations: false,
      createCustomerRelation: false,
      updateCustomerRelation: false,
      deleteCustomerRelation: false,
      resetPassword: false,
      uploadAvatar: false
    },
    error: null
  }),
  
  getters: {
    // 获取会员列表
    getMembers: (state) => state.memberList.data,
    
    // 获取当前会员
    getCurrentMember: (state) => state.currentMember,
    
    // 获取会员的客户关系列表
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
          // 处理分页数据结构适配
          if (response.data && 'results' in response.data) {
            this.memberList = {
              total: response.data.pagination.count || 0,
              page: params.page || 1,
              limit: params.page_size || 10,
              total_pages: response.data.pagination.total_pages || 1,
              data: response.data.results || []
            };
          } else {
            logger.warn("会员列表数据结构不符合预期", response.data);
            this.memberList.data = Array.isArray(response.data) ? response.data : [];
          }
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
     * 更新会员信息
     */
    async updateMemberInfo(id: number, data: MemberCreateUpdateParams) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await updateMember(id, data);
        if (response.success) {
          // 如果更新的是当前选中的会员，更新本地数据
          if (this.currentMember && this.currentMember.id === id) {
            this.currentMember = {
              ...this.currentMember,
              username: data.username || this.currentMember.username,
              nick_name: data.nick_name || this.currentMember.nick_name,
              first_name: data.first_name || this.currentMember.first_name,
              last_name: data.last_name || this.currentMember.last_name,
              email: data.email || this.currentMember.email,
              phone: data.phone || this.currentMember.phone,
              status: data.status || this.currentMember.status,
              notes: data.notes || this.currentMember.notes
            };
          }
          
          ElMessage.success(response.message || "更新会员信息成功");
          return response;
        } else {
          this.error = response.message || "更新会员信息失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("更新会员信息失败", error);
        this.error = error.message || "更新会员信息失败";
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
          // 如果当前选中的会员是被删除的会员，则清空当前选中的会员
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
     * 批量更新会员
     */
    async bulkUpdateMembers(data: MemberBulkOperationParams) {
      this.loading.bulkUpdate = true;
      this.error = null;
      
      try {
        const response = await bulkUpdateMembers(data);
        if (response.success) {
          ElMessage.success(response.message || `成功更新 ${response.data.success_count} 个会员`);
          // 刷新会员列表
          await this.fetchMemberList({
            page: this.memberList.page,
            page_size: this.memberList.limit
          });
          return response;
        } else {
          this.error = response.message || "批量更新会员失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量更新会员失败", error);
        this.error = error.message || "批量更新会员失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.bulkUpdate = false;
      }
    },
    
    /**
     * 批量删除会员
     */
    async bulkDeleteMembers(memberIds: number[]) {
      this.loading.bulkDelete = true;
      this.error = null;
      
      try {
        const response = await bulkDeleteMembers(memberIds);
        if (response.success) {
          // 如果当前选中的会员在被删除的会员中，则清空当前选中的会员
          if (this.currentMember && memberIds.includes(this.currentMember.id)) {
            this.currentMember = null;
          }
          // 从列表中移除被删除的会员
          this.memberList.data = this.memberList.data.filter(member => !memberIds.includes(member.id));
          ElMessage.success(response.message || `成功删除 ${response.data.success_count} 个会员`);
          return response;
        } else {
          this.error = response.message || "批量删除会员失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("批量删除会员失败", error);
        this.error = error.message || "批量删除会员失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.bulkDelete = false;
      }
    },
    
    /**
     * 获取会员的客户关系列表
     */
    async fetchMemberCustomerRelations(memberId: number, params: { page?: number; page_size?: number } = {}) {
      this.loading.customerRelations = true;
      this.error = null;
      
      try {
        const response = await getMemberCustomerRelations(memberId, params);
        if (response.success) {
          // 新API直接返回客户数组，需要转换为内部使用的格式
          if (Array.isArray(response.data)) {
            // 将客户数据转换为会员-客户关系数据
            this.memberCustomerRelations = {
              total: response.data.length,
              page: 1,
              limit: response.data.length,
              total_pages: 1,
              data: response.data.map(customer => ({
                id: customer.id,
                member: {
                  id: memberId,
                  name: this.currentMember?.nick_name || '',
                  username: this.currentMember?.username || ''
                },
                customer: {
                  id: customer.id,
                  name: customer.name,
                  type: customer.type
                },
                role: '', // 新API没有提供角色信息
                is_primary: false, // 新API没有提供是否为主要客户的信息
                department: '', // 新API没有提供部门信息
                created_at: customer.created_at,
                updated_at: customer.created_at
              }))
            };
          } else {
            logger.warn("会员客户关系列表数据结构不符合预期", response.data);
            this.memberCustomerRelations.data = [];
          }
          return response;
        } else {
          this.error = response.message || "获取会员客户关系列表失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("获取会员客户关系列表失败", error);
        this.error = error.message || "获取会员客户关系列表失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.customerRelations = false;
      }
    },
    
    /**
     * 创建会员-客户关系
     */
    async createMemberCustomerRelation(data: MemberCustomerRelationCreateUpdateParams) {
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
     * 更新会员-客户关系
     */
    async updateMemberCustomerRelation(memberId: number, relationId: number, data: Omit<MemberCustomerRelationCreateUpdateParams, 'member_id'>) {
      this.loading.updateCustomerRelation = true;
      this.error = null;
      
      try {
        const response = await updateMemberCustomerRelation(memberId, relationId, data);
        if (response.success) {
          // 更新关系列表中的数据
          const index = this.memberCustomerRelations.data.findIndex(relation => relation.id === relationId);
          if (index !== -1) {
            this.memberCustomerRelations.data[index] = response.data;
          }
          ElMessage.success(response.message || "更新会员-客户关系成功");
          return response;
        } else {
          this.error = response.message || "更新会员-客户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("更新会员-客户关系失败", error);
        this.error = error.message || "更新会员-客户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.updateCustomerRelation = false;
      }
    },
    
    /**
     * 删除会员-客户关系
     */
    async removeMemberCustomerRelation(memberId: number, customerId: number) {
      this.loading.deleteCustomerRelation = true;
      this.error = null;
      
      try {
        // 使用新的API，传递会员ID和客户ID数组
        const response = await deleteMemberCustomerRelations(memberId, [customerId]);
        if (response.success || response.status === 204) { // 新API返回204状态码表示成功
          // 从关系列表中移除被删除的关系
          this.memberCustomerRelations.data = this.memberCustomerRelations.data.filter(relation => relation.customer.id !== customerId);
          ElMessage.success("删除会员-客户关系成功");
          return response;
        } else {
          this.error = response.message || "删除会员-客户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("删除会员-客户关系失败", error);
        this.error = error.message || "删除会员-客户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.deleteCustomerRelation = false;
      }
    },
    
    /**
     * 设置主要客户关系
     */
    async setPrimaryCustomerRelation(memberId: number, relationId: number) {
      this.loading.updateCustomerRelation = true;
      this.error = null;
      
      try {
        const response = await setPrimaryCustomerRelation(memberId, relationId);
        if (response.success) {
          // 更新关系列表中的数据，将所有关系的is_primary设为false，然后将当前关系的is_primary设为true
          this.memberCustomerRelations.data = this.memberCustomerRelations.data.map(relation => ({
            ...relation,
            is_primary: relation.id === relationId
          }));
          ElMessage.success(response.message || "设置主要客户关系成功");
          return response;
        } else {
          this.error = response.message || "设置主要客户关系失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("设置主要客户关系失败", error);
        this.error = error.message || "设置主要客户关系失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.updateCustomerRelation = false;
      }
    },
    
    /**
     * 重置会员密码
     */
    async resetMemberPassword(memberId: number, data: MemberPasswordResetParams) {
      this.loading.resetPassword = true;
      this.error = null;
      
      try {
        const response = await resetMemberPassword(memberId, data);
        if (response.success) {
          ElMessage.success(response.message || "重置会员密码成功");
          return response;
        } else {
          this.error = response.message || "重置会员密码失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("重置会员密码失败", error);
        this.error = error.message || "重置会员密码失败";
        ElMessage.error(this.error);
        throw error;
      } finally {
        this.loading.resetPassword = false;
      }
    },
    
    /**
     * 搜索会员
     */
    async searchMembers(query: string, params: MemberListParams = {}) {
      this.error = null;
      
      try {
        // 使用 API 模块中定义的 searchMembers 函数
        const response = await searchMembers(query, params);
        
        if (response.success) {
          return response;
        } else {
          this.error = response.message || "搜索会员失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("搜索会员失败", error);
        this.error = error.message || "搜索会员失败";
        ElMessage.error(this.error);
        throw error;
      }
    },
    
    /**
     * 上传会员头像
     */
    async uploadMemberAvatar(memberId: number, formData: FormData) {
      this.loading.uploadAvatar = true;
      this.error = null;
      
      try {
        const response = await uploadMemberAvatar(memberId, formData);
        if (response.success) {
          // 如果当前选中的会员是被更新的会员，则更新当前选中的会员头像
          if (this.currentMember && this.currentMember.id === memberId && response.data) {
            // 使用 response.data.avatar 而不是 response.data.avatar_url
            const avatarUrl = response.data.avatar || response.data.avatar_url;
            if (avatarUrl) {
              this.currentMember = {
                ...this.currentMember,
                avatar: avatarUrl
              };
            }
          }
          ElMessage.success(response.message || "上传会员头像成功");
          return response;
        } else {
          this.error = response.message || "上传会员头像失败";
          ElMessage.error(this.error);
          return Promise.reject(new Error(this.error));
        }
      } catch (error) {
        logger.error("上传会员头像失败", error);
        this.error = error.message || "上传会员头像失败";
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

/**
 * 导出会员Store Hook，方便在组件中使用
 */
export function useMemberStoreHook() {
  return useMemberStore();
} 
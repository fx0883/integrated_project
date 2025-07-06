# 会员管理Vuex Store模块示例

以下是会员管理Vuex Store模块的示例代码，包括状态定义、mutations和actions等。

## 会员Store模块 (`src/store/modules/member.ts`)

```typescript
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import * as memberApi from "@/api/modules/member";
import type {
  Member,
  MemberListParams,
  MemberCreateUpdateParams,
  SubAccount,
  SubAccountCreateUpdateParams,
  CustomerMemberRelation,
  CustomerMemberRelationCreateUpdateParams
} from "@/types/member";
import logger from "@/utils/logger";

interface MemberState {
  // 会员列表
  memberList: {
    data: Member[];
    total: number;
    total_pages: number;
  };
  // 当前会员
  currentMember: Member | null;
  // 子账号列表
  subAccounts: {
    data: SubAccount[];
    total: number;
    total_pages: number;
  };
  // 客户关系列表
  customerRelations: {
    data: CustomerMemberRelation[];
    total: number;
    total_pages: number;
  };
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    subAccounts: boolean;
    customerRelations: boolean;
    avatar: boolean;
    password: boolean;
  };
  // 错误信息
  error: string | null;
}

export const useMemberStore = defineStore({
  id: "member",
  
  state: (): MemberState => ({
    memberList: {
      data: [],
      total: 0,
      total_pages: 0
    },
    currentMember: null,
    subAccounts: {
      data: [],
      total: 0,
      total_pages: 0
    },
    customerRelations: {
      data: [],
      total: 0,
      total_pages: 0
    },
    loading: {
      list: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      subAccounts: false,
      customerRelations: false,
      avatar: false,
      password: false
    },
    error: null
  }),
  
  getters: {
    // 获取会员列表
    getMemberList: (state) => state.memberList.data,
    
    // 获取会员总数
    getMemberTotal: (state) => state.memberList.total,
    
    // 获取当前会员
    getCurrentMember: (state) => state.currentMember,
    
    // 获取子账号列表
    getSubAccounts: (state) => state.subAccounts.data,
    
    // 获取子账号总数
    getSubAccountsTotal: (state) => state.subAccounts.total,
    
    // 获取客户关系列表
    getCustomerRelations: (state) => state.customerRelations.data,
    
    // 获取客户关系总数
    getCustomerRelationsTotal: (state) => state.customerRelations.total,
    
    // 获取主要客户关系
    getPrimaryCustomerRelation: (state) => {
      return state.customerRelations.data.find(relation => relation.is_primary) || null;
    }
  },
  
  actions: {
    /**
     * 获取会员列表
     * @param params 查询参数
     */
    async fetchMemberList(params: MemberListParams) {
      this.loading.list = true;
      this.error = null;
      
      try {
        const response = await memberApi.fetchMemberList(params);
        this.memberList = {
          data: response.data.results,
          total: response.data.count,
          total_pages: Math.ceil(response.data.count / (params.page_size || 10))
        };
        return response;
      } catch (error) {
        logger.error("获取会员列表失败", error);
        this.error = "获取会员列表失败";
        throw error;
      } finally {
        this.loading.list = false;
      }
    },
    
    /**
     * 获取会员详情
     * @param id 会员ID
     */
    async fetchMemberDetail(id: number) {
      this.loading.detail = true;
      this.error = null;
      
      try {
        const response = await memberApi.fetchMemberDetail(id);
        this.currentMember = response.data;
        return response;
      } catch (error) {
        logger.error("获取会员详情失败", error);
        this.error = "获取会员详情失败";
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },
    
    /**
     * 创建会员
     * @param data 会员数据
     */
    async createMember(data: MemberCreateUpdateParams) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const response = await memberApi.createMember(data);
        return response;
      } catch (error) {
        logger.error("创建会员失败", error);
        this.error = "创建会员失败";
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新会员信息
     * @param id 会员ID
     * @param data 会员数据
     */
    async updateMember(id: number, data: MemberCreateUpdateParams) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await memberApi.updateMember(id, data);
        if (this.currentMember && this.currentMember.id === id) {
          this.currentMember = response.data;
        }
        return response;
      } catch (error) {
        logger.error("更新会员失败", error);
        this.error = "更新会员失败";
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除会员
     * @param id 会员ID
     */
    async deleteMember(id: number) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        const response = await memberApi.deleteMember(id);
        // 从列表中移除已删除的会员
        this.memberList.data = this.memberList.data.filter(member => member.id !== id);
        this.memberList.total -= 1;
        return response;
      } catch (error) {
        logger.error("删除会员失败", error);
        this.error = "删除会员失败";
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 批量删除会员
     * @param ids 会员ID数组
     */
    async batchDeleteMembers(ids: number[]) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        const response = await memberApi.batchDeleteMembers(ids);
        // 从列表中移除已删除的会员
        this.memberList.data = this.memberList.data.filter(member => !ids.includes(member.id));
        this.memberList.total -= ids.length;
        return response;
      } catch (error) {
        logger.error("批量删除会员失败", error);
        this.error = "批量删除会员失败";
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 获取子账号列表
     * @param params 查询参数
     */
    async fetchSubAccounts(params: {
      search?: string;
      parent?: number;
      page?: number;
      page_size?: number;
    }) {
      this.loading.subAccounts = true;
      this.error = null;
      
      try {
        const response = await memberApi.fetchSubAccountList(params);
        this.subAccounts = {
          data: response.data.results,
          total: response.data.count,
          total_pages: Math.ceil(response.data.count / (params.page_size || 10))
        };
        return response;
      } catch (error) {
        logger.error("获取子账号列表失败", error);
        this.error = "获取子账号列表失败";
        throw error;
      } finally {
        this.loading.subAccounts = false;
      }
    },
    
    /**
     * 创建子账号
     * @param data 子账号数据
     */
    async createSubAccount(data: SubAccountCreateUpdateParams) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const response = await memberApi.createSubAccount(data);
        return response;
      } catch (error) {
        logger.error("创建子账号失败", error);
        this.error = "创建子账号失败";
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新子账号
     * @param id 子账号ID
     * @param data 子账号数据
     */
    async updateSubAccount(id: number, data: SubAccountCreateUpdateParams) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await memberApi.updateSubAccount(id, data);
        return response;
      } catch (error) {
        logger.error("更新子账号失败", error);
        this.error = "更新子账号失败";
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除子账号
     * @param id 子账号ID
     */
    async deleteSubAccount(id: number) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        const response = await memberApi.deleteSubAccount(id);
        // 从列表中移除已删除的子账号
        this.subAccounts.data = this.subAccounts.data.filter(subAccount => subAccount.id !== id);
        this.subAccounts.total -= 1;
        return response;
      } catch (error) {
        logger.error("删除子账号失败", error);
        this.error = "删除子账号失败";
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 获取会员的客户关系列表
     * @param params 查询参数
     */
    async fetchCustomerRelations(params: {
      member_id?: number;
      customer_id?: number;
      page?: number;
      limit?: number;
    }) {
      this.loading.customerRelations = true;
      this.error = null;
      
      try {
        const response = await memberApi.fetchCustomerRelations(params);
        this.customerRelations = {
          data: response.data.results,
          total: response.data.pagination.count,
          total_pages: response.data.pagination.total_pages
        };
        return response;
      } catch (error) {
        logger.error("获取客户关系列表失败", error);
        this.error = "获取客户关系列表失败";
        throw error;
      } finally {
        this.loading.customerRelations = false;
      }
    },
    
    /**
     * 创建客户关系
     * @param data 关系数据
     */
    async createCustomerRelation(data: CustomerMemberRelationCreateUpdateParams) {
      this.loading.create = true;
      this.error = null;
      
      try {
        const response = await memberApi.createCustomerRelation(data);
        return response;
      } catch (error) {
        logger.error("创建客户关系失败", error);
        this.error = "创建客户关系失败";
        throw error;
      } finally {
        this.loading.create = false;
      }
    },
    
    /**
     * 更新客户关系
     * @param id 关系ID
     * @param data 关系数据
     */
    async updateCustomerRelation(id: number, data: CustomerMemberRelationCreateUpdateParams) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await memberApi.updateCustomerRelation(id, data);
        return response;
      } catch (error) {
        logger.error("更新客户关系失败", error);
        this.error = "更新客户关系失败";
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 删除客户关系
     * @param id 关系ID
     */
    async deleteCustomerRelation(id: number) {
      this.loading.delete = true;
      this.error = null;
      
      try {
        const response = await memberApi.deleteCustomerRelation(id);
        // 从列表中移除已删除的关系
        this.customerRelations.data = this.customerRelations.data.filter(relation => relation.id !== id);
        this.customerRelations.total -= 1;
        return response;
      } catch (error) {
        logger.error("删除客户关系失败", error);
        this.error = "删除客户关系失败";
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
    
    /**
     * 设置主要客户关系
     * @param id 关系ID
     */
    async setPrimaryCustomerRelation(id: number) {
      this.loading.update = true;
      this.error = null;
      
      try {
        const response = await memberApi.setPrimaryCustomerRelation(id);
        // 更新关系列表中的主要关系标记
        this.customerRelations.data = this.customerRelations.data.map(relation => ({
          ...relation,
          is_primary: relation.id === id
        }));
        return response;
      } catch (error) {
        logger.error("设置主要客户关系失败", error);
        this.error = "设置主要客户关系失败";
        throw error;
      } finally {
        this.loading.update = false;
      }
    },
    
    /**
     * 上传会员头像
     * @param id 会员ID
     * @param file 头像文件
     */
    async uploadAvatar(id: number, file: File) {
      this.loading.avatar = true;
      this.error = null;
      
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        
        let response;
        if (id) {
          response = await memberApi.uploadMemberAvatar(id, formData);
        } else {
          response = await memberApi.uploadCurrentAvatar(formData);
        }
        
        // 如果是当前会员，更新头像
        if (this.currentMember && this.currentMember.id === id) {
          this.currentMember = {
            ...this.currentMember,
            avatar: response.data.avatar
          };
        }
        
        return response;
      } catch (error) {
        logger.error("上传头像失败", error);
        this.error = "上传头像失败";
        throw error;
      } finally {
        this.loading.avatar = false;
      }
    },
    
    /**
     * 重置会员密码
     * @param id 会员ID
     */
    async resetPassword(id: number) {
      this.loading.password = true;
      this.error = null;
      
      try {
        const response = await memberApi.resetMemberPassword(id);
        return response;
      } catch (error) {
        logger.error("重置密码失败", error);
        this.error = "重置密码失败";
        throw error;
      } finally {
        this.loading.password = false;
      }
    },
    
    /**
     * 修改当前会员密码
     * @param data 密码数据
     */
    async changePassword(data: {
      old_password: string;
      new_password: string;
      confirm_password: string;
    }) {
      this.loading.password = true;
      this.error = null;
      
      try {
        const response = await memberApi.changePassword(data);
        return response;
      } catch (error) {
        logger.error("修改密码失败", error);
        this.error = "修改密码失败";
        throw error;
      } finally {
        this.loading.password = false;
      }
    }
  }
});

// 导出会员Store的Hook
export function useMemberStoreHook() {
  return useMemberStore();
}
```

## 在主Store中注册会员模块 (`src/store/index.ts`)

```typescript
import { createPinia } from "pinia";
import { useMemberStore } from "./modules/member";
// 导入其他模块...

const pinia = createPinia();

export { useMemberStore };
// 导出其他模块...

export default pinia;
``` 
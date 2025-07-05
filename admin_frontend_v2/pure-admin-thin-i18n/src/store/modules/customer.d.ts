import type { PaginationData } from "@/types/api";
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

export interface CustomerState {
  // 客户列表数据
  customerList: PaginationData<Customer>;
  // 当前选中的客户
  currentCustomer: Customer | null;
  // 客户统计数据
  statistics: CustomerStatistics | null;
  // 当前客户的联系人关系列表
  customerMemberRelations: PaginationData<CustomerMemberRelation>;
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
    tenantRelations: boolean;
    createTenantRelation: boolean;
    updateTenantRelation: boolean;
    deleteTenantRelation: boolean;
  };
  // 错误信息
  error: string | null;
}

export interface CustomerGetters {
  // 获取客户列表
  getCustomers: Customer[];
  // 获取当前客户
  getCurrentCustomer: Customer | null;
  // 获取客户统计数据
  getStatistics: CustomerStatistics | null;
  // 获取客户的联系人关系列表
  getMemberRelations: CustomerMemberRelation[];
  // 获取客户的租户关系列表
  getTenantRelations: CustomerTenantRelation[];
  // 获取加载状态
  isLoading: (key: keyof CustomerState['loading']) => boolean;
  // 获取错误信息
  getError: string | null;
}

export interface CustomerActions {
  // 获取客户列表
  fetchCustomerList: (params?: CustomerListParams) => Promise<any>;
  // 获取客户详情
  fetchCustomerDetail: (id: number) => Promise<any>;
  // 创建客户
  createNewCustomer: (data: CustomerCreateUpdateParams) => Promise<any>;
  // 更新客户信息
  updateCustomerInfo: (id: number, data: CustomerCreateUpdateParams) => Promise<any>;
  // 删除客户
  removeCustomer: (id: number) => Promise<any>;
  // 获取客户统计数据
  fetchCustomerStatistics: () => Promise<any>;
  // 批量创建客户
  bulkCreateCustomers: (data: CustomerCreateUpdateParams[]) => Promise<any>;
  // 批量更新客户
  bulkUpdateCustomers: (data: CustomerBulkOperationParams) => Promise<any>;
  // 批量删除客户
  bulkDeleteCustomers: (customerIds: number[]) => Promise<any>;
  // 获取客户的联系人关系列表
  fetchCustomerMemberRelations: (customerId: number, params?: { page?: number; page_size?: number }) => Promise<any>;
  // 创建客户-联系人关系
  createCustomerMemberRelation: (data: CustomerMemberRelationCreateUpdateParams) => Promise<any>;
  // 更新客户-联系人关系
  updateCustomerMemberRelation: (customerId: number, relationId: number, data: Omit<CustomerMemberRelationCreateUpdateParams, 'customer_id'>) => Promise<any>;
  // 删除客户-联系人关系
  removeCustomerMemberRelation: (customerId: number, relationId: number) => Promise<any>;
  // 设置主要联系人
  setPrimaryMemberRelation: (customerId: number, relationId: number) => Promise<any>;
  // 获取客户的租户关系列表
  fetchCustomerTenantRelations: (customerId: number, params?: { page?: number; page_size?: number }) => Promise<any>;
  // 创建客户-租户关系
  createCustomerTenantRelation: (data: CustomerTenantRelationCreateUpdateParams) => Promise<any>;
  // 更新客户-租户关系
  updateCustomerTenantRelation: (customerId: number, relationId: number, data: Omit<CustomerTenantRelationCreateUpdateParams, 'customer_id'>) => Promise<any>;
  // 删除客户-租户关系
  removeCustomerTenantRelation: (customerId: number, relationId: number) => Promise<any>;
  // 设置主要租户关系
  setPrimaryTenantRelation: (customerId: number, relationId: number) => Promise<any>;
  // 重置客户管理状态
  resetCustomerState: () => void;
}

export type CustomerStore = CustomerState & {
  getters: CustomerGetters;
  actions: CustomerActions;
}; 
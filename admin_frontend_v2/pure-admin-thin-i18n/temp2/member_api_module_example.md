# 会员管理API模块示例

以下是会员管理API模块的示例代码，包括会员基本操作、子账号管理、客户关系管理和头像管理等功能。

## 会员API模块 (`src/api/modules/member.ts`)

```typescript
import request from "@/utils/http";
import type {
  Member,
  MemberListParams,
  MemberCreateUpdateParams,
  SubAccount,
  SubAccountCreateUpdateParams,
  CustomerMemberRelation,
  CustomerMemberRelationCreateUpdateParams
} from "@/types/member";

/**
 * 获取会员列表
 * @param params 查询参数
 */
export function fetchMemberList(params: MemberListParams) {
  return request<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Member[];
  }>({
    url: "/api/v1/members/",
    method: "get",
    params
  });
}

/**
 * 获取会员详情
 * @param id 会员ID
 */
export function fetchMemberDetail(id: number) {
  return request<Member>({
    url: `/api/v1/members/${id}/`,
    method: "get"
  });
}

/**
 * 创建会员
 * @param data 会员数据
 */
export function createMember(data: MemberCreateUpdateParams) {
  return request<Member>({
    url: "/api/v1/members/",
    method: "post",
    data
  });
}

/**
 * 更新会员信息
 * @param id 会员ID
 * @param data 会员数据
 */
export function updateMember(id: number, data: MemberCreateUpdateParams) {
  return request<Member>({
    url: `/api/v1/members/${id}/`,
    method: "put",
    data
  });
}

/**
 * 部分更新会员信息
 * @param id 会员ID
 * @param data 部分会员数据
 */
export function partialUpdateMember(id: number, data: Partial<MemberCreateUpdateParams>) {
  return request<Member>({
    url: `/api/v1/members/${id}/`,
    method: "patch",
    data
  });
}

/**
 * 删除会员
 * @param id 会员ID
 */
export function deleteMember(id: number) {
  return request<null>({
    url: `/api/v1/members/${id}/`,
    method: "delete"
  });
}

/**
 * 批量删除会员
 * @param ids 会员ID数组
 */
export function batchDeleteMembers(ids: number[]) {
  return request<null>({
    url: "/api/v1/members/batch-delete/",
    method: "post",
    data: { ids }
  });
}

/**
 * 获取当前登录会员信息
 */
export function fetchCurrentMember() {
  return request<Member>({
    url: "/api/v1/members/me/",
    method: "get"
  });
}

/**
 * 获取子账号列表
 * @param params 查询参数
 */
export function fetchSubAccountList(params: {
  search?: string;
  parent?: number;
  page?: number;
  page_size?: number;
}) {
  return request<{
    count: number;
    next: string | null;
    previous: string | null;
    results: SubAccount[];
  }>({
    url: "/api/v1/members/sub-accounts/",
    method: "get",
    params
  });
}

/**
 * 获取子账号详情
 * @param id 子账号ID
 */
export function fetchSubAccountDetail(id: number) {
  return request<SubAccount>({
    url: `/api/v1/members/sub-accounts/${id}/`,
    method: "get"
  });
}

/**
 * 创建子账号
 * @param data 子账号数据
 */
export function createSubAccount(data: SubAccountCreateUpdateParams) {
  return request<SubAccount>({
    url: "/api/v1/members/sub-accounts/",
    method: "post",
    data
  });
}

/**
 * 更新子账号
 * @param id 子账号ID
 * @param data 子账号数据
 */
export function updateSubAccount(id: number, data: SubAccountCreateUpdateParams) {
  return request<SubAccount>({
    url: `/api/v1/members/sub-accounts/${id}/`,
    method: "put",
    data
  });
}

/**
 * 部分更新子账号
 * @param id 子账号ID
 * @param data 部分子账号数据
 */
export function partialUpdateSubAccount(id: number, data: Partial<SubAccountCreateUpdateParams>) {
  return request<SubAccount>({
    url: `/api/v1/members/sub-accounts/${id}/`,
    method: "patch",
    data
  });
}

/**
 * 删除子账号
 * @param id 子账号ID
 */
export function deleteSubAccount(id: number) {
  return request<null>({
    url: `/api/v1/members/sub-accounts/${id}/`,
    method: "delete"
  });
}

/**
 * 获取会员的客户关系列表
 * @param params 查询参数
 */
export function fetchCustomerRelations(params: {
  member_id?: number;
  customer_id?: number;
  page?: number;
  limit?: number;
}) {
  return request<{
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      page_size: number;
      current_page: number;
      total_pages: number;
    };
    results: CustomerMemberRelation[];
  }>({
    url: "/api/v1/customers/members/relations/",
    method: "get",
    params
  });
}

/**
 * 获取客户关系详情
 * @param id 关系ID
 */
export function fetchCustomerRelationDetail(id: number) {
  return request<CustomerMemberRelation>({
    url: `/api/v1/customers/members/relations/${id}/`,
    method: "get"
  });
}

/**
 * 创建客户关系
 * @param data 关系数据
 */
export function createCustomerRelation(data: CustomerMemberRelationCreateUpdateParams) {
  return request<CustomerMemberRelation>({
    url: "/api/v1/customers/members/relations/",
    method: "post",
    data
  });
}

/**
 * 更新客户关系
 * @param id 关系ID
 * @param data 关系数据
 */
export function updateCustomerRelation(
  id: number,
  data: CustomerMemberRelationCreateUpdateParams
) {
  return request<CustomerMemberRelation>({
    url: `/api/v1/customers/members/relations/${id}/`,
    method: "put",
    data
  });
}

/**
 * 部分更新客户关系
 * @param id 关系ID
 * @param data 部分关系数据
 */
export function partialUpdateCustomerRelation(
  id: number,
  data: Partial<CustomerMemberRelationCreateUpdateParams>
) {
  return request<CustomerMemberRelation>({
    url: `/api/v1/customers/members/relations/${id}/`,
    method: "patch",
    data
  });
}

/**
 * 删除客户关系
 * @param id 关系ID
 */
export function deleteCustomerRelation(id: number) {
  return request<null>({
    url: `/api/v1/customers/members/relations/${id}/`,
    method: "delete"
  });
}

/**
 * 设置主要客户关系
 * @param id 关系ID
 */
export function setPrimaryCustomerRelation(id: number) {
  return request<CustomerMemberRelation>({
    url: `/api/v1/customers/members/relations/${id}/set-primary/`,
    method: "post"
  });
}

/**
 * 获取客户的主要联系人
 * @param customerId 客户ID
 */
export function getPrimaryCustomerRelation(customerId: number) {
  return request<CustomerMemberRelation>({
    url: "/api/v1/customers/members/relations/primary/",
    method: "get",
    params: { customer_id: customerId }
  });
}

/**
 * 上传当前会员头像
 * @param formData 包含头像文件的FormData
 */
export function uploadCurrentAvatar(formData: FormData) {
  return request<{ avatar: string }>({
    url: "/api/v1/members/avatar/upload/",
    method: "post",
    headers: {
      "Content-Type": "multipart/form-data"
    },
    data: formData
  });
}

/**
 * 为特定会员上传头像
 * @param id 会员ID
 * @param formData 包含头像文件的FormData
 */
export function uploadMemberAvatar(id: number, formData: FormData) {
  return request<{ avatar: string }>({
    url: `/api/v1/members/${id}/avatar/upload/`,
    method: "post",
    headers: {
      "Content-Type": "multipart/form-data"
    },
    data: formData
  });
}

/**
 * 重置会员密码
 * @param id 会员ID
 */
export function resetMemberPassword(id: number) {
  return request<{ message: string }>({
    url: `/api/v1/members/${id}/reset-password/`,
    method: "post"
  });
}

/**
 * 修改当前会员密码
 * @param data 密码数据
 */
export function changePassword(data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) {
  return request<{ message: string }>({
    url: "/api/v1/members/me/password/",
    method: "post",
    data
  });
}
```

## 会员类型定义 (`src/types/member.ts`)

```typescript
// 会员状态类型
export type MemberStatus = "active" | "inactive" | "suspended";

// 会员接口
export interface Member {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  nick_name: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  avatar: string | null;
  tenant: number;
  tenant_name: string;
  is_sub_account: boolean;
  parent: number | null;
  parent_username: string | null;
  date_joined: string;
  status: MemberStatus;
}

// 会员创建/更新参数
export interface MemberCreateUpdateParams {
  username: string;
  email: string;
  password?: string;
  password_confirm?: string;
  phone?: string;
  nick_name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  tenant_id?: number;
  status?: MemberStatus;
  is_active?: boolean;
}

// 会员列表查询参数
export interface MemberListParams {
  search?: string;
  status?: MemberStatus;
  is_sub_account?: boolean;
  parent?: number;
  tenant_id?: number;
  page?: number;
  page_size?: number;
}

// 子账号接口（与Member相同，但is_sub_account始终为true）
export interface SubAccount extends Member {
  is_sub_account: true;
  parent: number;
}

// 子账号创建/更新参数
export interface SubAccountCreateUpdateParams {
  username: string;
  email: string;
  phone?: string;
  nick_name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  status?: MemberStatus;
}

// 客户-会员关系接口
export interface CustomerMemberRelation {
  id: number;
  customer_id: number;
  customer_name: string;
  member_id: number;
  member_name: string;
  member_email: string;
  member_phone: string | null;
  role: string;
  is_primary: boolean;
  department?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 客户-会员关系创建/更新参数
export interface CustomerMemberRelationCreateUpdateParams {
  customer_id: number;
  member_id: number;
  role: string;
  is_primary?: boolean;
  department?: string;
  notes?: string;
}
``` 
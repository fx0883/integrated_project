import { request } from '../utils/request'

// 租户相关API
export const tenantApi = {
  // 获取租户列表
  getTenants(params) {
    return request.get('/tenants/', params)
  },
  
  // 获取租户详情
  getTenantById(id) {
    return request.get(`/tenants/${id}/`)
  },
  
  // 创建租户
  createTenant(data) {
    return request.post('/tenants/', data)
  },
  
  // 更新租户
  updateTenant(id, data) {
    return request.put(`/tenants/${id}/`, data)
  },
  
  // 删除租户
  deleteTenant(id) {
    return request.delete(`/tenants/${id}/`)
  },
  
  // 更新租户配额
  updateTenantQuota(id, data) {
    return request.put(`/tenants/${id}/quota/`, data)
  },
  
  // 获取租户用户列表
  getTenantUsers(id, params) {
    return request.get(`/tenants/${id}/users/`, params)
  },
  
  // 暂停租户
  suspendTenant(id) {
    return request.post(`/tenants/${id}/suspend/`)
  },
  
  // 激活租户
  activateTenant(id) {
    return request.post(`/tenants/${id}/activate/`)
  }
}

export default tenantApi 
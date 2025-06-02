import { request } from '../utils/request'

// 菜单管理相关API
export const menuApi = {
  // 获取菜单列表
  getMenus(params) {
    return request.get('/menus/', { params })
  },

  // 获取菜单树形结构
  getMenuTree(params) {
    return request.get('/menus/tree/', { params })
  },

  // 获取单个菜单详情
  getMenuById(id) {
    return request.get(`/menus/${id}/`)
  },

  // 创建菜单
  createMenu(data) {
    return request.post('/menus/', data)
  },

  // 更新菜单
  updateMenu(id, data) {
    return request.put(`/menus/${id}/`, data)
  },

  // 删除菜单
  deleteMenu(id) {
    return request.delete(`/menus/${id}/`)
  },

  // 获取管理员菜单列表
  getAdminMenus(userId) {
    return request.get(`/menus/admins/${userId}/menus/`)
  },

  // 分配菜单给管理员
  assignMenusToAdmin(userId, menuIds) {
    return request.post(`/menus/admins/${userId}/menus/`, { menu_ids: menuIds })
  },

  // 取消分配给管理员的菜单
  removeAdminMenu(userId, menuId) {
    return request.delete(`/menus/admins/${userId}/menus/${menuId}/`)
  },

  // 批量取消分配给管理员的菜单
  batchRemoveAdminMenus(userId, menuIds) {
    return request.delete(`/menus/admins/${userId}/menus/batch/`, {
      data: { menu_ids: menuIds }
    })
  },

  // 获取当前用户的菜单
  getCurrentUserMenus() {
    return request.get('/menus/user/')
  }
}

export default menuApi 
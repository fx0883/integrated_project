import { request } from '@/utils/request'

/**
 * 打卡类型相关API
 */

// 获取打卡类型列表
export function getTaskCategories(params) {
  return request.get('/check-system/task-categories/', params)
}

// 创建打卡类型
export function createTaskCategory(data) {
  console.log('【API调用】开始创建打卡类型:', data)
  return request.post('/check-system/task-categories/', data)
    .then(response => {
      console.log('【API响应】创建打卡类型成功:', response)
      return response
    })
    .catch(error => {
      console.error('【API错误】创建打卡类型失败:', error)
      throw error
    })
}

// 获取打卡类型详情
export function getTaskCategory(id) {
  return request.get(`/check-system/task-categories/${id}/`)
}

// 更新打卡类型
export function updateTaskCategory(id, data) {
  return request.put(`/check-system/task-categories/${id}/`, data)
}

// 部分更新打卡类型
export function patchTaskCategory(id, data) {
  return request.patch(`/check-system/task-categories/${id}/`, data)
}

// 删除打卡类型
export function deleteTaskCategory(id) {
  return request.delete(`/check-system/task-categories/${id}/`)
}

/**
 * 打卡任务相关API
 */

// 获取任务列表
export function getTasks(params) {
  return request.get('/tasks/', params)
}

// 创建任务
export function createTask(data) {
  return request.post('/tasks/', data)
}

// 获取任务详情
export function getTask(id) {
  return request.get(`/tasks/${id}/`)
}

// 更新任务
export function updateTask(id, data) {
  return request.put(`/tasks/${id}/`, data)
}

// 删除任务
export function deleteTask(id) {
  return request.delete(`/tasks/${id}/`)
}

/**
 * 打卡记录相关API
 */

// 获取打卡记录列表
export function getCheckRecords(params) {
  return request.get('/check-records/', params)
}

// 创建打卡记录
export function createCheckRecord(data) {
  return request.post('/check-records/', data)
}

// 获取打卡记录详情
export function getCheckRecord(id) {
  return request.get(`/check-records/${id}/`)
}

// 更新打卡记录
export function updateCheckRecord(id, data) {
  return request.put(`/check-records/${id}/`, data)
}

// 删除打卡记录
export function deleteCheckRecord(id) {
  return request.delete(`/check-records/${id}/`)
} 
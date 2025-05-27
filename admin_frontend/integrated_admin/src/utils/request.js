import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authApi } from '../api'

// 创建Axios实例
const service = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',
  timeout: 15000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加Token到请求头
    const token = localStorage.getItem('access_token')
    console.log('当前请求路径:', config.url, '获取到的token:', token ? '有效' : '无效或未定义')
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    } else {
      // 如果是需要认证的接口但没有token，打印警告
      if (!config.url.includes('/auth/login/') && 
          !config.url.includes('/auth/register/') && 
          !config.url.includes('/auth/token/refresh/')) {
        console.warn('访问需要认证的接口，但未找到有效token:', config.url)
      }
    }
    return config
  },
  error => {
    console.error('请求错误:', error) 
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    console.log('响应数据结构:', res)
    
    // 统一处理API响应格式，确保所有响应都符合标准格式
    // 标准格式：{ success: true/false, code: 2000, message: "操作成功/失败信息", data: {} }
    
    // 已经符合标准格式的响应直接返回
    if (res.success !== undefined && res.code !== undefined && res.message !== undefined) {
      return res
    }
    
    // 处理不符合标准格式的响应，将其转换为标准格式
    let standardResponse = {
      success: true,
      code: 2000,
      message: '操作成功',
      data: null
    }
    
    // 将原始数据放入data字段
    if (res) {
      // 处理已经带有分页信息的响应
      if (res.count !== undefined && res.results !== undefined) {
        standardResponse.data = {
          pagination: {
            count: res.count,
            next: res.next,
            previous: res.previous,
            page_size: response.config.params?.page_size || 10,
            current_page: response.config.params?.page || 1,
            total_pages: Math.ceil(res.count / (response.config.params?.page_size || 10))
          },
          results: res.results
        }
      } else {
        // 处理普通响应
        standardResponse.data = res
      }
    }
    
    console.log('标准化后的响应:', standardResponse)
    return standardResponse
  },
  async error => {
    console.error('API请求错误:', error.response || error)
    
    const { response } = error
    
    // 创建统一的错误响应格式
    let errorResponse = {
      success: false,
      code: 5000,  // 默认服务器错误
      message: '服务器内部错误',
      data: null
    }
    
    if (response) {
      // 根据HTTP状态码设置业务状态码
      switch (response.status) {
        case 400:
          errorResponse.code = 4000
          errorResponse.message = '请求参数错误'
          break
        case 401:
          errorResponse.code = 4001
          errorResponse.message = '认证失败，请登录'
          // 尝试刷新Token
          await handleUnauthorized()
          break
        case 403:
          errorResponse.code = 4003
          errorResponse.message = '您没有权限执行此操作'
          break
        case 404:
          errorResponse.code = 4004
          errorResponse.message = '请求的资源不存在'
          break
        case 405:
          errorResponse.code = 4005
          errorResponse.message = '方法不允许'
          break
        case 429:
          errorResponse.code = 4029
          errorResponse.message = '请求过于频繁'
          break
        case 500:
          errorResponse.code = 5000
          errorResponse.message = '服务器内部错误'
          break
        default:
          errorResponse.code = 5000
          errorResponse.message = '请求失败'
      }
      
      // 尝试从响应中获取更详细的错误信息
      try {
        if (response.data) {
          // 保存原始错误数据
          errorResponse.data = response.data
          
          // 如果响应已经符合标准格式，直接使用
          if (response.data.success === false && response.data.code && response.data.message) {
            errorResponse = response.data
          } else {
            // 提取错误消息
            if (response.data.message) {
              errorResponse.message = response.data.message
            } else if (response.data.detail) {
              errorResponse.message = response.data.detail
            }
          }
        }
      } catch (e) {
        console.error('解析错误响应失败:', e)
      }
    } else {
      // 网络错误
      errorResponse.code = 5000
      errorResponse.message = '网络连接失败，请检查您的网络'
    }
    
    // 显示错误消息
    ElMessage({
      message: errorResponse.message,
      type: 'error',
      duration: 5 * 1000
    })
    
    return Promise.reject(errorResponse)
  }
)

// 处理401未授权（Token过期）
async function handleUnauthorized() {
  // 获取刷新Token
  const refreshToken = localStorage.getItem('refresh_token')
  
  if (!refreshToken) {
    // 没有刷新Token，直接退出登录
    logout()
    return
  }
  
  try {
    // 显示确认弹窗
    await ElMessageBox.confirm(
      '您的登录状态已过期，是否继续停留在当前页面?',
      '登录过期',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    try {
      // 调用刷新Token接口
      const response = await authApi.refreshToken({
        refresh: refreshToken
      })
      
      // 使用辅助函数获取响应数据
      const responseData = request.getResponseData(response)
      
      // 尝试从不同格式中获取token
      let newToken = null
      
      if (responseData?.token) {
        // 新的API格式
        newToken = responseData.token
      } else if (responseData?.access) {
        // 旧的API格式
        newToken = responseData.access
      }
      
      if (newToken) {
        localStorage.setItem('access_token', newToken)
        
        // 提示用户
        ElMessage({
          message: '登录已续期，请重新操作',
          type: 'success',
          duration: 3 * 1000
        })
        
        // 刷新页面以应用新Token
        window.location.reload()
      } else {
        console.error('刷新令牌失败: 返回的数据格式不正确', response)
        // Token刷新失败，退出登录
        logout()
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      // 刷新Token失败，退出登录
      logout()
    }
  } catch {
    // 用户取消，退出登录
    logout()
  }
}

// 退出登录
function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_info')
  
  // 提示用户
  ElMessage({
    message: '您已退出登录，请重新登录',
    type: 'warning',
    duration: 3 * 1000
  })
  
  // 重定向到登录页
  setTimeout(() => {
    window.location.href = '/login'
  }, 1000)
}

// 请求方法封装
export const request = {
  get(url, params, config = {}) {
    return service({
      method: 'get',
      url,
      params,
      ...config
    })
  },
  post(url, data, config = {}) {
    return service({
      method: 'post',
      url,
      data,
      ...config
    })
  },
  put(url, data, config = {}) {
    return service({
      method: 'put',
      url,
      data,
      ...config
    })
  },
  patch(url, data, config = {}) {
    return service({
      method: 'patch',
      url,
      data,
      ...config
    })
  },
  delete(url, config = {}) {
    return service({
      method: 'delete',
      url,
      ...config
    })
  },
  upload(url, file, config = {}) {
    const formData = new FormData()
    formData.append('file', file)
    
    return service({
      method: 'post',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
  },
  download(url, params, config = {}) {
    return service({
      method: 'get',
      url,
      params,
      responseType: 'blob',
      ...config
    })
  },
  
  // 辅助函数：安全获取响应数据
  getResponseData(response) {
    // 确保从标准响应格式的data字段获取数据
    if (response && response.success !== undefined) {
      return response.data
    }
    // 如果响应不符合标准格式，返回整个响应（兼容旧代码）
    return response
  }
}

export default request 
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
    
    // 请求成功
    if (res.code === 0 || res.code === 2000 || (res.code >= 2000 && res.code < 3000)) {
      return res.data
    }
    
    // 处理业务错误
    const errorMsg = res.message || '请求失败'
    console.error('API请求业务错误:', errorMsg, res)
    
    ElMessage({
      message: errorMsg,
      type: 'error',
      duration: 5 * 1000
    })
    
    return Promise.reject(new Error(errorMsg))
  },
  async error => {
    console.error('API请求错误:', error.response || error)
    
    const { response } = error
    
    if (response) {
      // 处理HTTP错误状态码
      switch (response.status) {
        case 401: // 未授权
          // 尝试刷新Token
          await handleUnauthorized()
          break
        case 403: // 禁止访问
          ElMessage({
            message: '您没有权限执行此操作',
            type: 'error',
            duration: 5 * 1000
          })
          break
        case 404: // 资源不存在
          ElMessage({
            message: '请求的资源不存在',
            type: 'error',
            duration: 5 * 1000
          })
          break
        case 500: // 服务器错误
          ElMessage({
            message: '服务器内部错误，请稍后再试',
            type: 'error',
            duration: 5 * 1000
          })
          break
        default:
          // 尝试从响应中获取错误信息
          let errorMsg = '请求失败'
          
          try {
            if (response.data && response.data.message) {
              errorMsg = response.data.message
            } else if (response.data && response.data.detail) {
              errorMsg = response.data.detail
            }
          } catch (e) {
            console.error('解析错误响应失败:', e)
          }
          
          ElMessage({
            message: errorMsg,
            type: 'error',
            duration: 5 * 1000
          })
      }
    } else {
      // 处理网络错误
      ElMessage({
        message: '网络连接失败，请检查您的网络',
        type: 'error',
        duration: 5 * 1000
      })
    }
    
    return Promise.reject(error)
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
      
      // 更新Token
      const access = response.access
      if (access) {
        localStorage.setItem('access_token', access)
        
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
  }
}

export default request 
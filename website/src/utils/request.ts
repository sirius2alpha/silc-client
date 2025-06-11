import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth'

// 创建axios实例
const request = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useAuthStore()
    const accessToken = userStore.accessToken
    
    if (accessToken) {
      // 确保token格式正确
      const authToken = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
      // 设置Authorization头
      if (config.headers) {
        config.headers.Authorization = authToken
      }
      console.log('完整的请求配置:', {
        url: config.url,
        method: config.method,
        headers: config.headers
      })
    } else {
      console.warn('未找到accessToken，请先登录')
    }
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    console.log('响应数据:', response.data)
    
    // 登录接口返回完整响应数据（包含success字段）
    if (response.config.url?.includes('/login')) {
      return response.data
    }
    
    // 其他接口按照标准格式处理
    const { code, message, data, success } = response.data
    
    // 检查请求是否成功
    if (code !== 0 && code !== 200) {
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message || '请求失败'))
    }
    
    // 返回 data 字段
    return data
  },
  async (error) => {
    console.error('请求错误:', error)
    
    // 检查是否是401错误且有refresh token
    if (error.response?.status === 401) {
      const userStore = useAuthStore()
      
      // 如果有refresh token，尝试刷新
      if (userStore.refreshToken && !error.config._retry) {
        error.config._retry = true
        
        try {
          const refreshSuccess = await userStore.refreshTokens()
          
          if (refreshSuccess) {
            // 刷新成功，重新设置Authorization header并重试请求
            const newAccessToken = userStore.accessToken
            if (newAccessToken) {
              error.config.headers.Authorization = `Bearer ${newAccessToken}`
              return request(error.config)
            }
          }
        } catch (refreshError) {
          console.error('自动刷新token失败:', refreshError)
        }
      }
      
      // 刷新失败或没有refresh token，退出登录
      userStore.logout()
    }
    
    ElMessage.error(error.response?.data?.message || error.message || '请求失败')
    return Promise.reject(error)
  }
)

// 封装请求方法
const requestMethods = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.put(url, data, config)
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config)
  }
}

export default requestMethods 
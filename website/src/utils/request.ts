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
    const token = userStore.token
    
    if (token) {
      // 确保token格式正确
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
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
      console.warn('未找到token，请先登录')
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
    if (response.config.url?.includes('/login')) {
      return response.data
    }
    const { code, message, data } = response.data
    if (code !== 0) {
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message || '请求失败'))
    }
    return data
  },
  (error) => {
    console.error('请求错误:', error)
    if (error.response?.status === 401) {
      const userStore = useAuthStore()
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
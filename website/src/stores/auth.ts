import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin, refreshToken as refreshTokenApi } from '@/api/admin'
import type { User, LoginForm, AuthResponse } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<User | null>(null)
  const isAuthenticated = ref(!!accessToken.value)

  const login = async (form: LoginForm) => {
    try {
      const response = await adminLogin(form)
      console.log('登录响应:', response)
      
      if (response.success && response.data) {
        // 从 response.data 中获取 access_token、refresh_token 和 user
        const { 
          accessToken: accessTokenData, 
          refreshToken: refreshTokenData, 
          access_token, 
          refresh_token, 
          user: userData 
        } = response.data
        
        // 兼容两种字段名格式
        const finalAccessToken = access_token || accessTokenData
        const finalRefreshToken = refresh_token || refreshTokenData
        
        if (finalAccessToken && userData) {
          accessToken.value = finalAccessToken
          refreshToken.value = finalRefreshToken
          user.value = userData
          isAuthenticated.value = true
          localStorage.setItem('accessToken', finalAccessToken)
          if (finalRefreshToken) {
            localStorage.setItem('refreshToken', finalRefreshToken)
          }
          localStorage.setItem('userInfo', JSON.stringify(userData))
          return true
        }
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  const refreshTokens = async () => {
    try {
      if (!refreshToken.value) {
        return false
      }
      
      const response = await refreshTokenApi(refreshToken.value)
      console.log('刷新token响应:', response)
      
      if (response.success && response.data) {
        const { token, refresh_token } = response.data
        
        if (token) {
          accessToken.value = token
          localStorage.setItem('accessToken', token)
          
          // 如果返回了新的refresh token，更新它
          if (refresh_token) {
            refreshToken.value = refresh_token
            localStorage.setItem('refreshToken', refresh_token)
          }
          
          isAuthenticated.value = true
          return true
        }
      }
      return false
    } catch (error) {
      console.error('刷新token失败:', error)
      // 刷新失败，清除登录状态
      logout()
      return false
    }
  }

  const logout = () => {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userInfo')
    // 清理旧的token字段（兼容性处理）
    localStorage.removeItem('token')
  }

  const checkLoginStatus = () => {
    const storedAccessToken = localStorage.getItem('accessToken')
    const storedUserInfo = localStorage.getItem('userInfo')
    
    if (storedAccessToken && storedUserInfo) {
      accessToken.value = storedAccessToken
      refreshToken.value = localStorage.getItem('refreshToken')
      user.value = JSON.parse(storedUserInfo)
      isAuthenticated.value = true
      return true
    }
    
    return false
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    login,
    refreshTokens,
    logout,
    checkLoginStatus
  }
}) 
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin } from '@/api/admin'
import type { User, LoginForm, AuthResponse } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const isAuthenticated = ref(!!token.value)

  const login = async (form: LoginForm) => {
    try {
      const response = await adminLogin(form)
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        isAuthenticated.value = true
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const checkLoginStatus = () => {
    const storedToken = localStorage.getItem('token')
    const storedUserInfo = localStorage.getItem('userInfo')
    
    if (storedToken && storedUserInfo) {
      token.value = storedToken
      user.value = JSON.parse(storedUserInfo)
      isAuthenticated.value = true
      return true
    }
    
    return false
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    checkLoginStatus
  }
}) 
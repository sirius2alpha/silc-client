export interface User {
  id: string
  username: string
  role: string
  nickname?: string
  avatar?: string
  status: number
  isAdmin?: boolean
  selectedRobot?: string
  lastLogin?: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginForm {
  account: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    accessToken: string
    refreshToken: string
    user: User
  }
} 
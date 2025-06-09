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
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    token: string
    user: User
  }
} 
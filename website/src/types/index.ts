import type { User } from './user'

// 登录表单
export interface LoginForm {
    account: string
    password: string
  }
  
  // 用户信息
  export interface UserInfo {
    id: string
    username: string
    avatar?: string
    status: number
    createdAt: string
    updatedAt: string
  }
  
  // 用户列表查询参数
  export interface UserListParams {
    page: number
    pageSize: number
    keyword?: string
    status?: number
  }
  
  // 用户列表响应
  export interface UserListResponse {
    total: number
    list: User[]
  }
  
  // 对话记录
  export interface ChatRecord {
    id: string
    userId: string
    username: string
    content: string
    createdAt: string
  }
  
  // 对话记录查询参数
  export interface ChatListParams {
    page: number
    pageSize: number
    userId?: string
    startDate?: string
    endDate?: string
  }
  
  // 对话记录响应
  export interface ChatListResponse {
    total: number
    list: ChatRecord[]
  }
  
  // 知识库
  export interface Knowledge {
    id: string
    name: string
    description?: string
    fileSize: number
    status: number
    createdAt: string
    updatedAt: string
  }
  
  // 知识库查询参数
  export interface KnowledgeListParams {
    page: number
    pageSize: number
    keyword?: string
    status?: number
  }
  
  // 知识库响应
  export interface KnowledgeListResponse {
    total: number
    list: Knowledge[]
  }
  
  // 系统设置
  export interface SystemSettings {
    siteName: string
    siteDescription?: string
    siteKeywords?: string
    siteLogo?: string
    siteFavicon?: string
    siteCopyright?: string
    siteIcp?: string
    siteAnalytics?: string
    siteFooter?: string
  }
  
  // 统计数据
  export interface Stats {
    totalUsers: number
    totalChats: number
    totalKnowledge: number
    todayUsers: number
    todayChats: number
    todayKnowledge: number
  } 
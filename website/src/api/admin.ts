import request from '../utils/request'

// 管理员登录
export const adminLogin = (data: { username: string; password: string }) => {
  return request.post('/api/admin/login', data)
}

/*dashboard*/

// 获取统计数据
export const getStats = () => {
  return request.get('/api/admin/stats')
}

/*knowledge*/

// 获取知识库列表
export const getKnowledgeList = (params: { page: number; pageSize: number; category?: string; keyword?: string }) => {
  return request.get('/api/admin/knowledge', { params })
}

// 上传知识库文件
export const uploadKnowledge = (data: FormData) => {    // TODO 传参标明要传递什么参数，还以为是上传文件
  return request.post('/api/admin/knowledge/upload', data)
}

// 修改知识库
export const updateKnowledge = (id: string, data: any) => {// TODO 传参标明要传递什么参数
  return request.put(`/api/admin/knowledge/${id}`, data)
}

// 删除知识库
export const deleteKnowledge = (id: string) => {
  return request.delete(`/api/admin/knowledge/${id}`)
}

/*chat*/

// 获取对话记录列表
export const getChatList = (params: { 
  page: number; 
  pageSize: number;
  search?: string;
  username?: string;
  tag?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return request.get('/api/admin/chats', { params })
}

// 获取对话记录详情
export const getChatDetail = (chatId: string) => {
  return request.get(`/api/admin/chats/${chatId}`)
}

/*feedback*/

// 获取用户反馈
export const getFeedbackList = (params: { 
    page: number; 
    pageSize: number; 
    search?: string; 
    type?: string; 
    status?: string;
    username?: string;
    startDate?: string;
    endDate?: string;
}) => {
    return request.get('/api/admin/feedback', { params })
}

/*user*/

// 获取用户列表
export const getUserList = (params: { 
  page: number; 
  pageSize: number;
  search?: string;
  username?: string;
  nickname?: string;
  role?: string;
  status?: string;
  email?: string;
  registerStartDate?: string;
  registerEndDate?: string;
  updateStartDate?: string;
  updateEndDate?: string;
}) => {
  return request.get('/api/admin/users', { params })
}

// 获取用户详情
export const getUserDetail = (userId: string) => {
  return request.get(`/api/admin/users/${userId}`)
}

// 更新用户状态
export const updateUserStatus = (userId: string, data: { status: string }) => {
  return request.put(`/api/admin/users/${userId}/status`, data)
}

// 重置用户密码
export const resetUserPassword = (userId: string, password: string) => {
  return request.put(`/api/admin/users/${userId}/password`, { password })
}

/*store*/

// 获取商品列表
export const getStoreItems = (params: { page: number; pageSize: number }) => {
  return request.get('/api/admin/store/items', { params })
}

// 添加商品
export const addStoreItem = (data: { name: string; points: number; description: string; image: string; stock: number }) => {
  return request.post('/api/admin/store/items', data)
}

// 更新商品
export const updateStoreItem = (id: string, data: { name: string; points: number; description: string; image: string; stock: number }) => {
  return request.put(`/api/admin/store/items/${id}`, data)
}

// 更新商品状态
export const updateStoreItemStatus = (id: string, status: 'active' | 'inactive') => {
  return request.put(`/api/admin/store/items/${id}/status`, { status })
}

// 删除商品
export const deleteStoreItem = (id: string) => {
  return request.delete<{
    message: string;
    hasRecords: boolean;
  }>(`/api/admin/store/items/${id}`)
}

/*exchange*/

// 获取兑换记录
export const getExchangeRecords = (params: { 
  page: number; 
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return request.get('/api/admin/store/records', { params })
}

// 核销兑换码
export const verifyByCode = (code: string) => {
  return request.post('/api/admin/store/records/verify', { code })  // TODO 核销失败返回500
}

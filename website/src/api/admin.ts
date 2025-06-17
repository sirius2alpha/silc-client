import request from '../utils/request'

export enum KnowledgeOperation {
  CREATE = 0,   // 上传知识
  UPDATE = 1,   // 更新知识
  DELETE = 2,   // 删除知识
}

// 管理员登录
export const adminLogin = (data: { account: string; password: string }) => {
  return request.post('/api/admin/login', data)
}

// 刷新token
export const refreshToken = (refreshToken: string) => {
  return request.post('/api/auth/refresh', { refresh_token: refreshToken })
}

/*dashboard*/

// 获取统计信息
export const getStats = () => {
  return request.get('/api/admin/stats')
}

/*knowledge*/

// 获取知识库列表
export const getKnowledgeList = (params: {
  page: number;
  pageSize: number;
  keyword?: string;
}) => {
  const queryParams: any = {
    "pagination.page": params.page,
    "pagination.page_size": params.pageSize,
  }

  // 只添加有值的参数
  if (params.keyword) queryParams.keyword = params.keyword

  return request.get('/api/admin/knowledge', { params: queryParams })
}

// 管理知识
export const manageKnowledge = (
  data: {
    operation: KnowledgeOperation; 
    knowledge_id: string; 
    knowledge_data: { 
      title: string;
      content: string; 
      tags: string[];
    };
  }
) => {
  return request.post('/api/admin/knowledge', data)
}

// 批量上传知识
export const batchUploadKnowledge = (
  knowledgeItems: {
    title: string;
    content: string;
    tags: string[];
  }[]
) => {
  return request.post('/api/admin/knowledge/batch', { knowledge_items: knowledgeItems })
}


/*chat*/

// 获取对话记录列表
export const getChatList = (params: {
  page: number;
  pageSize: number;
  search?: string;
  username?: string;
  tag?: string;
  robotId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams: any = {
    "pagination.page": params.page,
    "pagination.page_size": params.pageSize,
  }

  // 只添加有值的参数
  if (params.search) queryParams.search = params.search
  if (params.username) queryParams.username = params.username
  if (params.tag) queryParams.tag = params.tag
  if (params.robotId) queryParams.robot_id = params.robotId
  if (params.startDate) queryParams.start_date = params.startDate
  if (params.endDate) queryParams.end_date = params.endDate

  return request.get('/api/admin/chats', { params: queryParams })
}

// 获取对话详情
export const getChatDetail = (chatId: string) => {
  return request.get(`/api/admin/chats/detail`, { params: { chat_id: chatId } })
}

/*feedback*/

// 获取用户反馈
export const getFeedbackList = (params: {
  page: number;
  pageSize: number;
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams: any = {
    "pagination.page": params.page,
    "pagination.page_size": params.pageSize,
  }

  // 只添加有值的参数
  if (params.search) queryParams.search = params.search
  if (params.type) queryParams.type = params.type
  if (params.status) queryParams.status = params.status
  if (params.startDate) queryParams.start_date = params.startDate
  if (params.endDate) queryParams.end_date = params.endDate

  return request.get('/api/admin/feedback', { params: queryParams })
}

// 更新反馈状态
export const updateFeedbackStatus = (feedbackId: string, status: string) => {
  return request.put('/api/admin/feedback/status', {
    feedback_id: feedbackId,
    status: status
  })
}

/*user*/

// 获取用户列表
export const getUserList = (params: {
  page: number;
  pageSize: number;
  search?: string;
  userId?: string;
  username?: string;
  nickname?: string;
  role?: string;
  status?: string;
  selectedRobot?: string;
  phone?: string;
  pointsMin?: number;
  pointsMax?: number;
  registerStartDate?: string;
  registerEndDate?: string;
  updateStartDate?: string;
  updateEndDate?: string;
}) => {
  const queryParams: any = {
    "pagination.page": params.page,
    "pagination.page_size": params.pageSize,
  }

  // 只添加有值的参数
  if (params.search) queryParams.search = params.search
  if (params.userId) queryParams.user_id = params.userId
  if (params.username) queryParams.username = params.username
  if (params.nickname) queryParams.nickname = params.nickname
  if (params.role) queryParams.role = params.role
  if (params.status) queryParams.status = params.status
  if (params.selectedRobot) queryParams.selected_robot = params.selectedRobot
  if (params.phone) queryParams.phone = params.phone
  if (params.pointsMin !== undefined && params.pointsMin !== null) queryParams.points_min = params.pointsMin
  if (params.pointsMax !== undefined && params.pointsMax !== null) queryParams.points_max = params.pointsMax
  if (params.registerStartDate) queryParams.register_start_date = params.registerStartDate
  if (params.registerEndDate) queryParams.register_end_date = params.registerEndDate
  if (params.updateStartDate) queryParams.update_start_date = params.updateStartDate
  if (params.updateEndDate) queryParams.update_end_date = params.updateEndDate

  return request.get('/api/admin/users', { params: queryParams })
}

// 获取用户详情
export const getUserDetail = (userId: string) => {
  return request.get(`/api/admin/users/detail`, { params: { user_id: userId } })
}

// 更新用户状态
export const updateUserStatus = (userId: string, data: { status: string }) => {
  return request.put(`/api/admin/users/status`, { user_id: userId, status: data.status })
}

// 重置用户密码
export const resetUserPassword = (userId: string, password: string) => {
  return request.put(`/api/auth/admin/user`, { user_id: userId, new_password: password })
}

/*store*/

// 获取商品列表
export const getStoreItems = (params: { page: number; pageSize: number }) => {
  const queryParams = {
    "pagination.page": params.page,
    "pagination.page_size": params.pageSize
  }
  return request.get('/api/admin/store/items', { params: queryParams })
}

// 添加商品
export const addStoreItem = (data: any) => {
  const requestData = {
    operation: 0, // CREATE
    item_id: "",
    item_data: {
      name: data.name,
      points: data.points,
      description: data.description,
      image: data.image,
      stock: data.stock,
      status: data.status
    }
  }
  return request.post('/api/admin/store/items', requestData)
}

// 更新商品
export const updateStoreItem = (id: string, data: any) => {
  const requestData = {
    operation: 1, // UPDATE
    item_id: id,
    item_data: {
      name: data.name,
      points: data.points,
      description: data.description,
      image: data.image,
      stock: data.stock,
      status: data.status
    }
  }
  return request.post('/api/admin/store/items', requestData)
}

// 删除商品
export const deleteStoreItem = (id: string) => {
  const requestData = {
    operation: 2, // DELETE
    item_id: id,
    item_data: {}
  }
  return request.post('/api/admin/store/items', requestData)
}

// 更新商品状态
export const updateStoreItemStatus = (id: string, status: string) => {
  const requestData = {
    operation: 3, // STATUS
    item_id: id,
    item_data: {
      status: status
    }
  }
  return request.post('/api/admin/store/items', requestData)
}

// 获取兑换记录
export const getExchangeRecords = (params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams: any = {
    "pagination.page": params.page,
    "pagination.page_size": params.pageSize,
  }

  // 只添加有值的参数
  if (params.search) queryParams.search = params.search
  if (params.status) queryParams.status = params.status
  if (params.startDate) queryParams.start_date = params.startDate
  if (params.endDate) queryParams.end_date = params.endDate

  return request.get('/api/admin/store/records', { params: queryParams })
}

// 核销兑换码
export const verifyByCode = (recordId: string) => {
  return request.post('/api/admin/store/records/verify', {
    record_id: recordId,
    admin_id: "" // 后端会从token中获取管理员ID
  })
}

// 生成上传URL
export const generateUploadURL = (fileType: string) => {
  return request.post('/api/admin/upload-url', {
    file_type: fileType
  })
}

/*notifications*/

// 获取通知列表
export const getNotificationList = (params: {
  page: number;
  pageSize: number;
  status?: string;
  type?: string;
  keyword?: string;
}) => {
  const queryParams: any = {
    "pagination.page": params.page,
    "pagination.page_size": params.pageSize,
  }

  // 只添加有值的参数
  if (params.status) queryParams.status = params.status
  if (params.type) queryParams.type = params.type
  if (params.keyword) queryParams.keyword = params.keyword

  return request.get('/api/admin/notifications', { params: queryParams })
}

// 创建通知
export const createNotification = (data: {
  title: string;
  content: string;
  type: string;
}) => {
  return request.post('/api/admin/notifications', data)
}

// 更新通知状态
export const updateNotificationStatus = (notificationId: string, status: string) => {
  return request.put('/api/admin/notifications/status', {
    notification_id: notificationId,
    status: status
  })
}

// 删除通知
export const deleteNotification = (notificationId: string) => {
  return request.delete('/api/admin/notifications', {
    data: { notification_id: notificationId }
  })
}

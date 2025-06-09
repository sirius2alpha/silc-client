import request from '../utils/request'

// 发送消息
export const sendMessage = (data) => {
  return request.post('/api/chat/message', data)
}

// 获取聊天历史
export const getChatHistory = (robot_id, params = {}) => {
  const { page = 1, pageSize = 20 } = params
  return request.get(`/api/chat/history`, { 
    robot_id,
    pagination: {
      page,
      page_size: pageSize
    }
  })
}

// 获取历史记录详情
export const getHistoryDetail = (id) => {
  return request.get(`/api/history/detail/${id}`)
}

// 获取热门问题
export const getHotQuestions = () => {
  return request.get('/api/history/hot-questions')
} 
import request from '../utils/request'

// 获取积分统计
export const getPointsStatus = () => {
  return request.get('/api/points/status')
}

// 获取积分明细
export const getPointsHistory = (pagination) => {
  const { page = 1, pageSize = 10 } = pagination || {}
  return request.get('/api/points/history', {
    pagination: {
      page,
      page_size: pageSize
    }
  })
}

// 获取可兑换商品列表
export const getExchangeItems = () => {
  return request.get('/api/points/exchange/items')
}

// 兑换商品
export const exchangeItem = (itemId) => {
  return request.post('/api/points/exchange', { itemId })
}

// 获取积分规则
export const getPointsRules = () => {
  return request.get('/api/points/rules')
}

// 获取兑换记录
export const getExchangeRecords = (pagination) => {
  const { page = 1, pageSize = 10 } = pagination || {}
  return request.get('/api/points/records', {
    pagination: {
      page,
      page_size: pageSize
    }
  })
} 
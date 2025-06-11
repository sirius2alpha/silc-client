const request = require('../utils/request')

// 通知相关API
const notificationApi = {
  // 获取用户通知列表
  getUserNotifications: (params = {}) => {
    const queryParams = {
      'pagination.page': params.page || 1,
      'pagination.page_size': params.pageSize || 20
    }
    
    if (params.unreadOnly !== undefined) {
      queryParams.unread_only = params.unreadOnly
    }
    
    return request.get('/api/user/notifications', queryParams)
  },

  // 标记通知为已读
  markAsRead: (notificationId) => {
    return request.put('/api/user/notifications/read', {
      notification_id: notificationId
    })
  },

  // 标记所有通知为已读
  markAllAsRead: () => {
    return request.put('/api/user/notifications/read-all', {})
  },

  // 获取未读通知数量
  getUnreadCount: () => {
    return request.get('/api/user/notifications/unread-count')
  }
}

module.exports = notificationApi 
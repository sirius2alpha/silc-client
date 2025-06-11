// pages/notifications/notifications.js
const notificationApi = require('../../api/notification.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    notifications: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    unreadCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getNotifications();
    this.getUnreadCount();
  },

  /**
   * 获取通知列表
   */
  async getNotifications(loadMore = false) {
    try {
      this.setData({ loading: true });
      
      const page = loadMore ? this.data.page + 1 : 1;
      
      const response = await notificationApi.getUserNotifications({
        page: page,
        pageSize: this.data.pageSize
      });
      
      if (response && (response.code === 200 || response.success)) {
        const newNotifications = response.data?.notifications || [];
        const notifications = loadMore ? 
          [...this.data.notifications, ...newNotifications] : 
          newNotifications;
        
        // 格式化通知数据
        const formattedNotifications = notifications.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          time: this.formatTime(item.created_at),
          read: item.is_read,
          type: item.type
        }));
        
        this.setData({
          notifications: formattedNotifications,
          page: page,
          hasMore: newNotifications.length === this.data.pageSize,
          loading: false
        });
      } else {
        throw new Error(response?.message || '获取通知失败');
      }
    } catch (error) {
      console.error('获取通知失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: error.message || '获取通知失败',
        icon: 'none'
      });
    }
  },

  /**
   * 获取未读通知数量
   */
  async getUnreadCount() {
    try {
      const response = await notificationApi.getUnreadCount();
      if (response && (response.code === 200 || response.success)) {
        this.setData({
          unreadCount: response.data?.unread_count || 0
        });
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  },

  /**
   * 标记通知为已读
   */
  async markAsRead(e) {
    const { id } = e.currentTarget.dataset;
    const { notifications } = this.data;
    
    try {
      const response = await notificationApi.markAsRead(id);
      
      if (response && (response.code === 200 || response.success)) {
        const updatedNotifications = notifications.map(item => {
          if (item.id === id) {
            return { ...item, read: true };
          }
          return item;
        });
        
        this.setData({ notifications: updatedNotifications });
        this.getUnreadCount(); // 更新未读数量
        
        wx.showToast({
          title: '已标记为已读',
          icon: 'success'
        });
      } else {
        throw new Error(response?.message || '标记已读失败');
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      wx.showToast({
        title: error.message || '标记已读失败',
        icon: 'none'
      });
    }
  },

  /**
   * 全部标记为已读
   */
  async markAllAsRead() {
    try {
      const response = await notificationApi.markAllAsRead();
      
      if (response && (response.code === 200 || response.success)) {
        const { notifications } = this.data;
        const updatedNotifications = notifications.map(item => {
          return { ...item, read: true };
        });
        
        this.setData({ 
          notifications: updatedNotifications,
          unreadCount: 0
        });
        
        wx.showToast({
          title: '全部已读',
          icon: 'success'
        });
      } else {
        throw new Error(response?.message || '全部标记已读失败');
      }
    } catch (error) {
      console.error('全部标记已读失败:', error);
      wx.showToast({
        title: error.message || '全部标记已读失败',
        icon: 'none'
      });
    }
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 一分钟内
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    // 一小时内
    else if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    // 一天内
    else if (diff < 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }
    // 超过一天
    else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.getNotifications();
    this.getUnreadCount();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件处理函数
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.getNotifications(true);
    }
  }
}); 
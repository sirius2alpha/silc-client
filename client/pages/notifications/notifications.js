// pages/notifications/notifications.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    notifications: [],
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getNotifications();
  },

  /**
   * 获取通知列表
   */
  async getNotifications() {
    try {
      this.setData({ loading: true });
      
      // 这里应该调用API获取通知，但现在使用模拟数据
      const notifications = [
        { id: 1, title: '系统通知', content: '欢迎使用SILC智能助手', time: '2025-04-06 18:00', read: false },
        { id: 2, title: '更新提示', content: '系统已更新到最新版本', time: '2025-04-05 15:30', read: true },
        { id: 3, title: '重要消息', content: '您的账户安全检查已完成', time: '2025-04-04 10:15', read: false }
      ];
      
      setTimeout(() => {
        this.setData({
          notifications: notifications,
          loading: false
        });
      }, 500);
    } catch (error) {
      console.error('获取通知失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '获取通知失败',
        icon: 'none'
      });
    }
  },

  /**
   * 标记通知为已读
   */
  markAsRead(e) {
    const { id } = e.currentTarget.dataset;
    const { notifications } = this.data;
    
    const updatedNotifications = notifications.map(item => {
      if (item.id === id) {
        return { ...item, read: true };
      }
      return item;
    });
    
    this.setData({ notifications: updatedNotifications });
    
    // 这里应该调用API更新通知状态
    wx.showToast({
      title: '已标记为已读',
      icon: 'success'
    });
  },

  /**
   * 全部标记为已读
   */
  markAllAsRead() {
    const { notifications } = this.data;
    
    const updatedNotifications = notifications.map(item => {
      return { ...item, read: true };
    });
    
    this.setData({ notifications: updatedNotifications });
    
    // 这里应该调用API更新所有通知状态
    wx.showToast({
      title: '全部已读',
      icon: 'success'
    });
  },

  /**
   * 删除通知
   */
  deleteNotification(e) {
    const { id } = e.currentTarget.dataset;
    const { notifications } = this.data;
    
    const updatedNotifications = notifications.filter(item => item.id !== id);
    
    this.setData({ notifications: updatedNotifications });
    
    // 这里应该调用API删除通知
    wx.showToast({
      title: '已删除',
      icon: 'success'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getNotifications();
    wx.stopPullDownRefresh();
  }
}); 
// pages/profile/profile.js
import { getUserInfo, updateUserInfo } from '../../api/user'
const notificationApi = require('../../api/notification.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    username: '',
    nickname: '',
    avatarUrl: '',
    points: 0,
    selectedRobot: '',
    hasUserInfo: false,
    showNotificationBadge: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('accessToken')
    if (token) {
      this.getUserInfo()
      this.getNotifications()
    } else {
      // 未登录，提示用户登录
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
    }
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    try {
      wx.showLoading({
        title: '加载中...'
      })
      
      const res = await getUserInfo()
      if (res.success === false || res.code === 401) {
        wx.hideLoading()
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none'
        })
        return
      }
      
      // 处理不同的响应格式
      let userInfo = res.data?.user || res.data || res
      
      this.setData({
        username: userInfo.username || '',
        nickname: userInfo.nickname || '',
        avatarUrl: userInfo.avatarUrl || userInfo.avatar || '',
        selectedRobot: userInfo.selectedRobot || '',
        points: userInfo.points || 0,
      })

      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error('获取用户信息失败:', error)
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      })
    }
  },

  /**
   * 获取通知消息
   */
  async getNotifications() {
    try {
      // 获取未读通知数量
      const response = await notificationApi.getUnreadCount()
      
      if (response && (response.code === 200 || response.success)) {
        const unreadCount = response.data?.unread_count || 0
        this.setData({
          showNotificationBadge: unreadCount > 0
        })
      } else {
        this.setData({
          showNotificationBadge: false
        })
      }
    } catch (error) {
      console.error('获取通知失败:', error)
      this.setData({
        showNotificationBadge: false
      })
    }
  },

  /**
   * 读取所有通知
   */
  readAllNotifications() {
    // 跳转到通知页面
    wx.navigateTo({
      url: '/pages/notifications/notifications'
    })
  },

  /**
   * 跳转到个人信息设置页面
   */
  goToUserInfo() {
    wx.navigateTo({
      url: '/pages/info/info'
    })
  },

  /**
   * 跳转到意见反馈页面
   */
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  /**
   * 跳转到关于我们页面
   */
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    if (wx.getStorageSync('accessToken')) {
      this.getUserInfo()
      this.getNotifications() // 每次显示都刷新红点状态
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新
    if (wx.getStorageSync('accessToken')) {
      this.getUserInfo()
      this.getNotifications()
    }
    wx.stopPullDownRefresh()
  }
})
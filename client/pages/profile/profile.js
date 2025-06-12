// pages/profile/profile.js
import { getUserInfo, updateUserInfo } from '../../api/user'
import { logout } from '../../api/auth'
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
    showNotificationBadge: false,
    loading: false,
    
    // 添加数据缓存状态
    lastLoadTime: 0,
    dataLoaded: false,
    cacheTimeout: 2 * 60 * 1000 // 2分钟缓存时间（profile数据变化较少）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('accessToken')
    if (token) {
      this.refreshProfileData()
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
      const res = await getUserInfo()
      if (res.success === false || res.code === 401) {
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

    } catch (error) {
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
        const unreadCount = response.data?.unreadCount || 0
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
   * 处理退出登录
   */
  async handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({
              title: '退出中...'
            })

            // 调用退出登录API
            await logout()

            // 跳转到登录页面
            wx.reLaunch({
              url: '/pages/login/login'
            })

            // 清空本地存储的用户信息
            wx.removeStorageSync('accessToken')
            wx.removeStorageSync('refreshToken')
            wx.removeStorageSync('userId')
            wx.removeStorageSync('userInfo')
            wx.removeStorageSync('username')
            wx.removeStorageSync('nickname')
            wx.removeStorageSync('avatarUrl')
            wx.removeStorageSync('selectedRobot')

            // 清空页面数据
            this.setData({
              username: '',
              nickname: '',
              avatarUrl: '',
              points: 0,
              selectedRobot: '',
              hasUserInfo: false,
              showNotificationBadge: false
            })

            wx.hideLoading()

            wx.showToast({
              title: '退出登录成功',
              icon: 'success'
            })

          } catch (error) {
            wx.hideLoading()
            console.error('退出登录失败:', error)

            // 即使API调用失败，也要清空本地缓存
            wx.removeStorageSync('accessToken')
            wx.removeStorageSync('refreshToken')
            wx.removeStorageSync('userId')
            wx.removeStorageSync('userInfo')
            wx.removeStorageSync('username')
            wx.removeStorageSync('nickname')
            wx.removeStorageSync('avatarUrl')
            wx.removeStorageSync('selectedRobot')

            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            })

            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/login/login'
              })
            }, 1000)
          }
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const token = wx.getStorageSync('accessToken')
    if (!token) return
    
    // 切换到profile页面时调用unread和status（getUserInfo包含status）
    this.refreshProfileData()
  },

  /**
   * 刷新profile页面数据（unread + status）
   */
  async refreshProfileData() {
    const token = wx.getStorageSync('accessToken')
    if (!token) return
    
    try {
      this.setData({ loading: true })
      
      // 并行加载用户信息（包含status）和通知未读数量
      await Promise.allSettled([
        this.getUserInfo(),        // 包含用户信息和积分状态
        this.getNotifications()    // 获取未读通知数量
      ])
      
      this.setData({ 
        lastLoadTime: Date.now(),
        dataLoaded: true
      })
    } catch (error) {
      console.error('刷新profile数据失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新时调用unread和status
    this.refreshProfileData().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})
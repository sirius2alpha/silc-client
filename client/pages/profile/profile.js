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
    showAvatar: true,
    
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
    
    // 添加用户信息更新事件监听
    const app = getApp()
    if (typeof app.addUserInfoUpdateListener === 'function') {
      app.addUserInfoUpdateListener(this.onUserInfoUpdate.bind(this))
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
    
    // 🔧 强化：每次onShow都强制检查并更新用户信息
    this.checkAndUpdateUserInfo()
    
    // 🔧 新增：强制重新获取用户信息，确保头像等数据是最新的
    this.forceRefreshUserInfo()
    
    // 🔧 确保从最新存储和全局数据中获取用户信息
    const app = getApp()
    const latestUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (latestUserInfo) {
      this.setData({
        username: latestUserInfo.username || '',
        nickname: latestUserInfo.nickname || '',
        avatarUrl: latestUserInfo.avatar || latestUserInfo.avatarUrl || '',
        selectedRobot: latestUserInfo.selectedRobot || '',
        points: latestUserInfo.points || 0
      })
    }
    
    // 切换到profile页面时调用unread和status（getUserInfo包含status）
    this.refreshProfileData()
  },

  // 🔧 新增：强制刷新用户信息
  async forceRefreshUserInfo() {
    try {
      console.log('profile页面强制刷新用户信息');
      
      // 从全局数据获取最新用户信息
      const app = getApp();
      const latestUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
      
      if (latestUserInfo) {
        console.log('使用最新的全局用户信息更新profile页面');
        this.setData({
          username: latestUserInfo.username || '',
          nickname: latestUserInfo.nickname || '',
          avatarUrl: latestUserInfo.avatar || latestUserInfo.avatarUrl || '',
          selectedRobot: latestUserInfo.selectedRobot || '',
          points: latestUserInfo.points || 0
        });
      }
      
      // 🔧 同时从服务器获取最新数据（异步进行，不阻塞UI）
      setTimeout(async () => {
        try {
          await this.getUserInfo();
          console.log('profile页面从服务器获取最新用户信息成功');
        } catch (error) {
          console.warn('profile页面从服务器获取用户信息失败:', error);
        }
      }, 100);
      
    } catch (error) {
      console.error('profile页面强制刷新用户信息失败:', error);
    }
  },

  // 🔧 新增：检查并更新用户信息
  checkAndUpdateUserInfo() {
    const app = getApp()
    const latestUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    
    if (latestUserInfo) {
      // 检查头像是否有更新
      const currentAvatar = this.data.avatarUrl
      const latestAvatar = latestUserInfo.avatar || latestUserInfo.avatarUrl
      
      // 检查昵称是否有更新
      const currentNickname = this.data.nickname
      const latestNickname = latestUserInfo.nickname
      
      if (latestAvatar !== currentAvatar || latestNickname !== currentNickname) {
        console.log('检测到用户信息更新，刷新profile页面数据')
        this.setData({
          username: latestUserInfo.username || '',
          nickname: latestNickname || '',
          avatarUrl: latestAvatar || '',
          selectedRobot: latestUserInfo.selectedRobot || '',
          points: latestUserInfo.points || 0
        })
      }
    }
  },

  // 🔧 新增：响应用户信息更新事件
  onUserInfoUpdate(updatedUserInfo) {
    console.log('profile页面收到用户信息更新事件:', updatedUserInfo)
    
    // 如果有强制刷新标记或显示数据，优先使用显示数据
    let avatarToShow = updatedUserInfo.avatar || updatedUserInfo.avatarUrl || ''
    
    if (updatedUserInfo._forceRefresh && updatedUserInfo._displayAvatar) {
      avatarToShow = updatedUserInfo._displayAvatar
      console.log('profile页面使用强制刷新头像:', avatarToShow)
    }
    
    const newData = {
      username: updatedUserInfo.username || '',
      nickname: updatedUserInfo.nickname || '',
      avatarUrl: avatarToShow,
      selectedRobot: updatedUserInfo.selectedRobot || '',
      points: updatedUserInfo.points || 0
    }
    
    console.log('profile页面更新数据:', newData)
    this.setData(newData, () => {
      console.log('profile页面setData完成')
    })
    
    // 更新本地存储确保数据一致性（存储原始数据，不带时间戳）
    const storageData = {
      ...updatedUserInfo,
      avatar: updatedUserInfo.avatar,
      bgpic: updatedUserInfo.bgpic
    }
    // 移除内部标记
    delete storageData._displayAvatar
    delete storageData._displayBgpic
    delete storageData._forceRefresh
    delete storageData._timestamp
    
    wx.setStorageSync('userInfo', storageData)
    const app = getApp()
    if (app.globalData) {
      app.globalData.userInfo = storageData
    }
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
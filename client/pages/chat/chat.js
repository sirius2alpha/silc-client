import { safeFormatTime } from '../../utils/util'
import { sendMessage, getChatHistory } from '../../api/chat'
import { createPage, withUserInfo, withRobot } from '../../utils/page-helper'

// 创建事件中心
if (!wx.eventCenter) {
  wx.eventCenter = {
    events: {},
    on: function (eventName, callback) {
      this.events[eventName] = this.events[eventName] || []
      this.events[eventName].push(callback)
    },
    trigger: function (eventName, data) {
      const callbacks = this.events[eventName] || []
      callbacks.forEach(callback => callback(data))
    },
    off: function (eventName, callback) {
      if (!eventName) {
        this.events = {}
        return
      }
      if (!callback) {
        this.events[eventName] = []
        return
      }
      this.events[eventName] = (this.events[eventName] || []).filter(cb => cb !== callback)
    }
  }
}

const chatPage = createPage(withUserInfo(withRobot({
  data: {
    messages: [],
    inputValue: '',
    sending: false,
    inputFocus: false,
    keyboardHeight: 0,
    robot: null,
    robotInfo: null,
    userInfo: null,
    isPulling: false,
    pullDistance: 0,
    lastScrollTop: 0,
    loadingHistory: false,
    chatBackgroundImage: '',
    preloadedBackgroundImage: '',
  },

  async onLoad() {
    if (!this.checkLoginStatus()) return

    const app = getApp()
    await this.initializePageData(app)
    this.loadHistory()
    this.initializeUserBackground()
    
    // 添加用户信息更新事件监听
    if (typeof app.addUserInfoUpdateListener === 'function') {
      app.addUserInfoUpdateListener(this.onUserInfoUpdate.bind(this))
    }
  },

  onShow() {
    if (!this.checkLoginStatus()) return
    
    // 强制更新用户信息，确保头像和背景图是最新的
    this.forceUpdateUserInfo()
    this.checkAndUpdateRobot()
    
    // 🔧 确保从最新存储和全局数据中获取用户信息
    const app = getApp()
    const latestUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (latestUserInfo) {
      const currentUserInfo = this.data.userInfo || {}
      const hasAvatarChange = currentUserInfo.avatar !== latestUserInfo.avatar
      const hasBgpicChange = currentUserInfo.bgpic !== latestUserInfo.bgpic
      
      this.setData({ userInfo: latestUserInfo })
      
      // 如果头像或背景图有变化，立即更新显示
      if (hasAvatarChange) {
        setTimeout(() => {
          this.setData({ messages: [...this.data.messages] })
        }, 100)
      }
      
      if (hasBgpicChange) {
        this.preloadAndUpdateBackground(latestUserInfo.bgpic)
      }
    }
  },

  /**
   * 初始化页面数据
   */
  async initializePageData(app) {
    let userId = app.globalData.userInfo?.id || wx.getStorageSync('userId') || wx.getStorageSync('userInfo')?.id
    let nickname = app.globalData.userInfo?.nickname || wx.getStorageSync('userInfo')?.nickname || '我'
    let robotInfo = this.getSelectedRobot()

    // 如果缺少必要数据，则加载用户信息
    if (!userId || !nickname || !robotInfo || !robotInfo.id) {
      await this.loadUserInfo()
      userId = app.globalData.userInfo?.id || wx.getStorageSync('userId')
      nickname = app.globalData.userInfo?.nickname || wx.getStorageSync('userInfo')?.nickname || '我'
      robotInfo = this.getSelectedRobot()
      
      if (!robotInfo || !robotInfo.id) {
        const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
        if (userInfo?.selectedRobot) {
          robotInfo = app.findRobotInfo(userInfo.selectedRobot)
          if (robotInfo) {
            this.updateSelectedRobot(robotInfo)
          }
        }
      }
    } else {
      await this.loadUserInfo()
      app.globalData.userId = userId
      this.updateSelectedRobot(robotInfo)
      wx.setStorageSync('userId', userId)
    }

    this.setData({ robot: robotInfo })

    if (!robotInfo || !robotInfo.id) {
      wx.showModal({
        title: '提示',
        content: '请先选择成长伙伴',
        showCancel: false,
        success: () => {
          wx.reLaunch({ url: '/pages/robot-select/robot-select' })
        }
      })
      return
    }
  },

  /**
   * 检查并更新机器人选择状态
   */
  checkAndUpdateRobot() {
    let selectedRobot = this.getSelectedRobot()

    if (!selectedRobot) {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo?.selectedRobot) {
        const app = getApp()
        selectedRobot = app.findRobotInfo(userInfo.selectedRobot)
        if (selectedRobot) {
          this.updateSelectedRobot(selectedRobot)
        }
      }
    }

    if (!selectedRobot) {
      wx.showModal({
        title: '提示',
        content: '请先选择成长伙伴',
        showCancel: false,
        success: () => {
          wx.reLaunch({ url: '/pages/robot-select/robot-select' })
        }
      })
      return
    }

    if (!this.data.robot && selectedRobot) {
      this.setData({ robot: selectedRobot }, () => {
        this.loadHistory()
      })
    }
  },

  /**
   * 强制更新用户信息
   */
  forceUpdateUserInfo() {
    const app = getApp()
    const latestUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    
    if (latestUserInfo) {
      const currentUserInfo = this.data.userInfo || {}
      const hasAvatarChange = currentUserInfo.avatar !== latestUserInfo.avatar
      const hasBgpicChange = currentUserInfo.bgpic !== latestUserInfo.bgpic
      
      this.setData({ userInfo: latestUserInfo })
      
      // 头像变化时强制刷新消息列表
      if (hasAvatarChange) {
        setTimeout(() => {
          this.setData({ messages: [...this.data.messages] })
        }, 100)
      }
      
      // 背景图变化时预加载更新
      if (hasBgpicChange || !this.data.chatBackgroundImage) {
        this.preloadAndUpdateBackground(latestUserInfo.bgpic)
      }
    }
  },

  /**
   * 响应用户信息更新事件
   */
  onUserInfoUpdate(updatedUserInfo) {
    console.log('chat页面收到用户信息更新事件:', updatedUserInfo)
    
    // 准备显示用的用户信息（优先使用强制刷新的显示数据）
    let displayUserInfo = { ...updatedUserInfo }
    
    if (updatedUserInfo._forceRefresh) {
      console.log('chat页面检测到强制刷新标记')
      if (updatedUserInfo._displayAvatar) {
        displayUserInfo.avatar = updatedUserInfo._displayAvatar
      }
      if (updatedUserInfo._displayBgpic) {
        displayUserInfo.bgpic = updatedUserInfo._displayBgpic
      }
    }
    
    const currentUserInfo = this.data.userInfo || {}
    const hasAvatarChange = currentUserInfo.avatar !== displayUserInfo.avatar
    const hasBgpicChange = currentUserInfo.bgpic !== displayUserInfo.bgpic
    
    // 更新用户信息和背景图
    this.setData({ 
      userInfo: displayUserInfo,
      chatBackgroundImage: displayUserInfo.bgpic || '',
      preloadedBackgroundImage: displayUserInfo.bgpic || ''
    }, () => {
      console.log('chat页面userInfo更新完成')
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
    
    // 头像或背景图变化时强制刷新消息列表显示
    if (hasAvatarChange || hasBgpicChange) {
      console.log('检测到图片变化，刷新消息列表和背景')
      setTimeout(() => {
        const currentMessages = this.data.messages || []
        this.setData({ 
          messages: [...currentMessages] 
        }, () => {
          console.log('chat页面消息列表刷新完成')
        })
      }, 100)
    }
  },

  /**
   * 响应用户信息更新事件
   */
  onUserInfoUpdate(updatedUserInfo) {
    console.log('chat页面收到用户信息更新事件:', updatedUserInfo)
    
    // 检查是否有强制更新标记
    const isForceUpdate = updatedUserInfo._forceUpdate
    
    if (!isForceUpdate) {
      const currentUserInfo = this.data.userInfo || {}
      
      // 检查是否真的需要更新（只有在非强制更新时才检查）
      const needAvatarUpdate = currentUserInfo.avatar !== updatedUserInfo.avatar
      const needBgpicUpdate = currentUserInfo.bgpic !== updatedUserInfo.bgpic
      
      if (!needAvatarUpdate && !needBgpicUpdate) {
        console.log('chat页面: 图片无变化，跳过更新')
        return
      }
    }
    
    console.log('chat页面: 开始更新图片', isForceUpdate ? '(强制更新)' : '(检测到变化)')
    
    // 生成带缓存破解参数的URL
    const timestamp = updatedUserInfo._updateTime || Date.now()
    const processedUserInfo = {
      ...updatedUserInfo,
      avatar: updatedUserInfo.avatar ? `${updatedUserInfo.avatar.split('?')[0]}?_t=${timestamp}` : '',
      bgpic: updatedUserInfo.bgpic ? `${updatedUserInfo.bgpic.split('?')[0]}?_t=${timestamp}` : ''
    }
    
    // 如果是强制更新，才预加载
    if (isForceUpdate) {
      Promise.all([
        this.preloadImage(processedUserInfo.avatar),
        this.preloadImage(processedUserInfo.bgpic)
      ]).catch(error => {
        console.log('图片预加载失败，继续更新:', error)
      }).finally(() => {
        this.updateChatDisplay(processedUserInfo, timestamp)
      })
    } else {
      this.updateChatDisplay(processedUserInfo, timestamp)
    }
  },

  /**
   * 更新聊天页面显示
   */
  updateChatDisplay(processedUserInfo, timestamp) {
    // 预加载完成后，直接更新数据
    this.setData({
      userInfo: processedUserInfo,
      chatBackgroundImage: processedUserInfo.bgpic,
      preloadedBackgroundImage: processedUserInfo.bgpic,
      imageUpdateKey: timestamp
    }, () => {
      console.log('✅ chat页面图片更新完成')
      
      // 通过更新imageUpdateKey来触发消息列表中头像的重新渲染
      const currentMessages = this.data.messages || []
      this.setData({ 
        messages: [...currentMessages] // 触发重新渲染
      }, () => {
        console.log('✅ chat页面消息头像更新完成')
      })
    })
    
    // 更新本地存储确保数据一致性
    wx.setStorageSync('userInfo', processedUserInfo)
    const app = getApp()
    if (app.globalData) {
      app.globalData.userInfo = processedUserInfo
    }
  },

  /**
   * 预加载并更新背景图
   */
  preloadAndUpdateBackground(bgpicUrl) {
    if (!bgpicUrl) {
      this.setData({
        chatBackgroundImage: '',
        preloadedBackgroundImage: ''
      })
      return
    }
    
    // 使用图片组件的预加载机制
    wx.getImageInfo({
      src: bgpicUrl,
      success: () => {
        this.setData({
          chatBackgroundImage: bgpicUrl,
          preloadedBackgroundImage: bgpicUrl
        })
      },
      fail: () => {
        // 预加载失败，直接设置背景图
        this.setData({ chatBackgroundImage: bgpicUrl })
      }
    })
  },

  /**
   * 加载聊天历史
   */
  async loadHistory() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const robotId = this.getRobotId()
      if (!robotId) {
        throw new Error('未选择机器人')
      }

      const res = await getChatHistory(robotId, {
        page: 1,
        pageSize: 20
      })

      let messages = []
      if (res && res.success && res.data) {
        if (res.data.messages && Array.isArray(res.data.messages)) {
          messages = res.data.messages
            .map(msg => ({
              ...msg,
              formattedTime: safeFormatTime(msg.createdAt || msg.time)
            }))
        }
      }

      messages.reverse()

      this.setData({
        messages: messages,
        loading: false
      }, () => {
        this.scrollToBottom()
      })

    } catch (error) {
      this.handleError(error, '加载历史消息失败')
      this.setData({
        loading: false,
        messages: []
      })
    }
  },

  /**
   * 获取机器人ID
   */
  getRobotId() {
    const app = getApp()
    
    if (this.data.robot && this.data.robot.id) {
      return this.data.robot.id
    }
    
    if (app.globalData.selectedRobot && app.globalData.selectedRobot.id) {
      return app.globalData.selectedRobot.id
    }
    
    const storedRobot = wx.getStorageSync('selectedRobot')
    if (storedRobot && storedRobot.id) {
      return storedRobot.id
    }
    
    return null
  },

  /**
   * 发送消息
   */
  async handleSend() {
    if (this.data.sending) return

    const { inputValue, robot } = this.data
    if (!inputValue.trim()) return

    if (!robot || !robot.id) {
      const validRobot = this.restoreRobotData()
      if (!validRobot) {
        wx.showToast({
          title: '请先选择机器人',
          icon: 'none'
        })
        wx.navigateTo({ url: '/pages/robot-select/robot-select' })
        return
      }
      setTimeout(() => this.handleSend(), 100)
      return
    }

    this.setData({ sending: true })

    try {
      const res = await sendMessage({
        content: inputValue,
        robot_id: robot.id,
      })

      if (!res?.success || !res.data) {
        throw new Error(res.message || res.error || '发送失败')
      }

      const currentMessages = Array.isArray(this.data.messages) ? this.data.messages : []
      const newMessages = [...currentMessages]

      // 添加用户消息
      if (res.data.userMessage) {
        const userMessage = {
          id: res.data.userMessage.id,
          content: res.data.userMessage.content,
          createdAt: res.data.userMessage.createdAt || new Date().toISOString(),
          type: 'user',
          isUser: true,
          formattedTime: safeFormatTime(res.data.userMessage.createdAt || res.data.userMessage.time || new Date().toISOString())
        }
        newMessages.push(userMessage)
      }

      // 添加机器人回复
      if (res.data.robotReply) {
        const robotMessage = {
          id: res.data.robotReply.id,
          content: res.data.robotReply.content,
          createdAt: res.data.robotReply.createdAt || new Date().toISOString(),
          robotName: robot.name || '智能助手',
          robotAvatar: robot.avatar,
          type: 'robot',
          isUser: false,
          formattedTime: safeFormatTime(res.data.robotReply.createdAt || res.data.robotReply.time || new Date().toISOString())
        }
        newMessages.push(robotMessage)
      }

      this.setData({
        messages: newMessages,
        inputValue: '',
        sending: false
      }, () => {
        this.scrollToBottom()
      })

    } catch (error) {
      this.handleError(error, '发送失败')
      this.setData({ sending: false })
    }
  },

  /**
   * 恢复机器人数据
   */
  restoreRobotData() {
    const app = getApp()
    const globalRobot = app.globalData.selectedRobot
    const storedRobot = wx.getStorageSync('selectedRobot')
    
    let validRobot = null
    if (globalRobot && globalRobot.id) {
      validRobot = globalRobot
    } else if (storedRobot && storedRobot.id) {
      validRobot = storedRobot
    } else {
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
      if (userInfo?.selectedRobot) {
        validRobot = app.findRobotInfo(userInfo.selectedRobot)
      }
    }
    
    if (validRobot && validRobot.id) {
      this.setData({ robot: validRobot })
      return validRobot
    }
    
    return null
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    if (this.data.messages?.length > 0) {
      const lastMessage = this.data.messages[this.data.messages.length - 1]
      this.setData({ scrollToMessage: `msg-${lastMessage.id}` })
    }
  },

  /**
   * 加载聊天历史记录（上拉加载更多）
   */
  async loadChatHistory() {
    if (this.data.loadingHistory) return

    this.setData({ loadingHistory: true })

    try {
      const robotId = this.getRobotId()
      if (!robotId) {
        wx.showToast({
          title: '请先选择AI助手',
          icon: 'none'
        })
        return
      }

      const res = await getChatHistory(robotId, {
        page: 1,
        pageSize: 20
      })

      if (res.success) {
        const messagesData = res.data?.messages || []
        const formattedMessages = Array.isArray(messagesData)
          ? messagesData.map(msg => ({
              ...msg,
              isUser: msg.type === 'user',
              formattedTime: safeFormatTime(msg.createdAt || msg.time)
            }))
          : []

        const currentMessages = this.data.messages || []
        const existingIds = new Set(currentMessages.map(msg => msg.id))
        const newMessages = formattedMessages.filter(msg => !existingIds.has(msg.id))

        if (newMessages.length > 0) {
          this.setData({
            messages: [...currentMessages, ...newMessages].sort((a, b) => {
              const timeA = new Date(a.createdAt || a.time || new Date()).getTime()
              const timeB = new Date(b.createdAt || b.time || new Date()).getTime()
              return timeA - timeB
            })
          })
        }
      }
    } catch (error) {
      this.handleError(error, '加载聊天历史失败')
    } finally {
      this.setData({ loadingHistory: false })
    }
  },

  /**
   * 初始化用户背景图
   */
  initializeUserBackground() {
    const app = getApp()
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    
    if (userInfo && userInfo.bgpic) {
      this.setData({ userInfo: userInfo })
      this.preloadAndUpdateBackground(userInfo.bgpic)
    }
  },

  /**
   * 更新页面背景
   */
  updatePageBackground(bgpicUrl) {
    if (this.data.chatBackgroundImage === bgpicUrl) return
    
    if (!bgpicUrl) {
      this.setData({
        chatBackgroundImage: '',
        preloadedBackgroundImage: ''
      })
      return
    }
    
    if (this.data.preloadedBackgroundImage === bgpicUrl) {
      this.setData({ chatBackgroundImage: bgpicUrl })
      return
    }
    
    wx.getImageInfo({
      src: bgpicUrl,
      success: () => {
        this.setData({
          chatBackgroundImage: bgpicUrl,
          preloadedBackgroundImage: bgpicUrl
        })
      },
      fail: () => {
        this.setData({ chatBackgroundImage: bgpicUrl })
      }
    })
  },

  // 事件处理
  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  onSend() {
    this.handleSend()
  },

  onConfirm() {
    this.handleSend()
  },

  onReachBottom() {
    this.loadChatHistory()
  },

  onScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.detail
    this.setData({ lastScrollTop: scrollTop })

    if (scrollTop + clientHeight >= scrollHeight && this.data.isPulling && !this.data.loadingHistory) {
      this.loadChatHistory()
      this.setData({ isPulling: false, pullDistance: 0 })
    }
  },

  onTouchStart(e) {
    const scrollTop = this.data.lastScrollTop
    const { scrollHeight, clientHeight } = e.detail

    if (scrollTop + clientHeight >= scrollHeight && !this.data.loadingHistory) {
      this.setData({
        isPulling: true,
        startY: e.touches[0].clientY
      })
    }
  },

  onTouchMove(e) {
    if (this.data.isPulling && !this.data.loadingHistory) {
      const { startY } = this.data
      const currentY = e.touches[0].clientY
      const pullDistance = startY - currentY
      this.setData({ pullDistance })
    }
  },

  onTouchEnd() {
    if (this.data.isPulling) {
      this.setData({ isPulling: false, pullDistance: 0 })
    }
  },

  onInputFocus(e) {
    const keyboardHeight = e.detail.height || 0
    const finalKeyboardHeight = Math.max(0, keyboardHeight - 98)

    this.setData({
      inputFocus: true,
      keyboardHeight: finalKeyboardHeight
    })

    setTimeout(() => {
      this.scrollToBottom()
    }, 300)
  },

  onInputBlur() {
    this.setData({
      inputFocus: false,
      keyboardHeight: 0
    })
  },

  onKeyboardHeightChange(e) {
    const keyboardHeight = e.detail.height
    const finalKeyboardHeight = Math.max(0, keyboardHeight - 98)

    this.setData({ keyboardHeight: finalKeyboardHeight })

    if (keyboardHeight > 0) {
      this.scrollToBottom()
    }
  },

  onBackgroundImageError() {
    this.setData({
      chatBackgroundImage: '',
      preloadedBackgroundImage: ''
    })
  },

  onUserAvatarError() {
    // 用户头像加载失败处理
  }
})))

Page(chatPage) 
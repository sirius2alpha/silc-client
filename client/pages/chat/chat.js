import { safeFormatTime } from '../../utils/util'
import { sendMessage, getChatHistory } from '../../api/chat'
import { getUserInfo } from '../../api/user'
import request from '../../utils/request'

// 创建事件中心（如果不存在）
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

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    sending: false,
    inputFocus: false,
    keyboardHeight: 0,
    robot: null,
    robotInfo: null,  // wxml中使用
    userInfo: null,
    isPulling: false,
    pullDistance: 0,
    lastScrollTop: 0,
    loadingHistory: false,  // 添加加载历史消息的状态
  },

  async onLoad() {
    // 检查登录状态
    const token = wx.getStorageSync('accessToken')
    if (!token) {
      console.log('在chat页面未检测到token，跳转到登录页')
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    // 从全局数据或者本地数据加载userid nickname seletedRobot
    const app = getApp()
    let userId = app.globalData.userInfo?.id || wx.getStorageSync('userId')
    let nickname = app.globalData.userInfo?.nickname || wx.getStorageSync('userInfo')?.nickname || '我'
    let RobotInfo = app.globalData.selectedRobot || wx.getStorageSync('selectedRobot')

    // 如果这三个数据缺失 则调用loadUserInfo方法获取
    if (!userId || !nickname || !RobotInfo) {
      console.log('缺少用户信息或机器人信息，尝试加载用户信息')
      await this.loadUserInfo()
      // 重新获取全局数据
      userId = app.globalData.userInfo?.id || wx.getStorageSync('userId')
      nickname = app.globalData.userInfo?.nickname || wx.getStorageSync('userInfo')?.nickname || '我'
      RobotInfo = app.globalData.selectedRobot || wx.getStorageSync('selectedRobot')
    } else {
      console.log('已加载用户信息:', { userId, username: nickname, RobotInfo })
      // 仍然调用loadUserInfo获取最新的用户信息（包括bgpic）
      await this.loadUserInfo()
      // 更新全局数据
      app.globalData.userId = userId
      app.globalData.selectedRobot = RobotInfo
      wx.setStorageSync('userId', userId)
      wx.setStorageSync('selectedRobot', RobotInfo)
    }

    // 设置页面数据，userInfo会在loadUserInfo中更新
    this.setData({
      robot: RobotInfo
    })

    if (!RobotInfo) {
      console.log('无法获取机器人信息，提示用户并跳转')
      wx.showModal({
        title: '提示',
        content: '请先选择AI助手',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/robot-select/robot-select'
          })
        }
      })
      return
    }

    console.log('使用机器人:', RobotInfo)
    this.loadHistory()
    
    // 初始化背景图
    this.updateUserBackground()
  },

  onShow() {
    // 检查登录状态
    const token = wx.getStorageSync('accessToken')
    if (!token) {
      console.log('未检测到token，跳转到登录页')
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    // 检查并更新用户背景图
    this.updateUserBackground()

    // 检查机器人选择状态
    const app = getApp()
    let selectedRobot = app.globalData.selectedRobot || wx.getStorageSync('selectedRobot')

    if (!selectedRobot) {
      // 尝试从用户信息中获取已选择的机器人
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo?.selectedRobot) {
        // 使用app.js中的方法获取机器人信息
        selectedRobot = app.findRobotInfo(userInfo.selectedRobot)

        if (selectedRobot) {
          app.globalData.selectedRobot = selectedRobot
          wx.setStorageSync('selectedRobot', selectedRobot)
        }
      }
    }

    if (!selectedRobot) {
      console.log('未选择机器人，跳转到选择页面')
      wx.showModal({
        title: '提示',
        content: '请先选择AI助手',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/robot-select/robot-select'
          })
        }
      })
      return
    }

    // 如果当前没有机器人数据，但全局有，则更新
    if (!this.data.robot && selectedRobot) {
      console.log('更新页面机器人数据')
      this.setData({ robot: selectedRobot }, () => {
        this.loadHistory()
      })
    }
  },

  async loadHistory() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      // 获取机器人ID，从多个可能的来源获取
      const app = getApp()
      let robotId = null

      // 尝试从页面数据获取 - 兼容性写法
      if (this.data.robot && this.data.robot.id) {
        robotId = this.data.robot.id
      }
      // 尝试从全局数据获取 - 兼容性写法
      else if (app.globalData.selectedRobot && app.globalData.selectedRobot.id) {
        robotId = app.globalData.selectedRobot.id
      }
      // 尝试从本地存储获取
      else {
        const storedRobot = wx.getStorageSync('selectedRobot')
        if (storedRobot && storedRobot.id) {
          robotId = storedRobot.id
        }
      }

      console.log('加载历史消息, 机器人ID:', robotId)

      if (!robotId) {
        throw new Error('未选择机器人')
      }

      // 使用API获取聊天历史
      const res = await getChatHistory(robotId, {
        page: 1,
        pageSize: 20
      })
      console.log('获取聊天历史响应:', res)

      // 处理不同的响应格式
      let messages = []

      if (res && res.success && res.data) {
        // 处理messages字段
        if (res.data.messages && Array.isArray(res.data.messages)) {
          messages = res.data.messages
            .map(msg => ({
              ...msg,
              formattedTime: safeFormatTime(msg.createdAt || msg.time)
            }))
        }
      }

      messages.reverse()

      console.log(`加载了 ${messages.length} 条历史消息`)

      this.setData({
        messages: messages,
        loading: false
      }, () => {
        this.scrollToBottom()
      })

    } catch (error) {
      console.error('加载历史消息失败:', error)
      wx.showToast({
        title: error.message || '加载历史消息失败',
        icon: 'none'
      })
      this.setData({
        loading: false,
        messages: []
      })
    }
  },

  // 输入框事件
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  // 发送消息
  async handleSend() {
    if (this.data.sending) return

    const { inputValue, robot } = this.data
    if (!inputValue.trim()) return

    if (!robot) {
      wx.showToast({
        title: '请先选择机器人',
        icon: 'none'
      })
      return
    }

    this.setData({ sending: true })

    try {
      console.log('开始发送消息:', {
        content: inputValue,
        robot_id: robot.id,
      })

      // 发送消息到服务器
      const res = await sendMessage({
        content: inputValue,
        robot_id: robot.id,
      })

      console.log('发送消息响应:', res)

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

      // 更新消息列表
      this.setData({
        messages: newMessages,
        inputValue: '',
        sending: false
      }, () => {
        this.scrollToBottom()
      })

    } catch (error) {
      console.error('发送消息错误', error)
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      })
      this.setData({ sending: false })
    }
  },

  scrollToBottom() {
    if (this.data.messages?.length > 0) {
      const lastMessage = this.data.messages[this.data.messages.length - 1]
      this.setData({
        scrollToMessage: `msg-${lastMessage.id}`
      })
    }
  },

  onUnload() {
    // 页面卸载时的清理工作
  },

  // 加载机器人信息
  async loadRobotInfo() {
    try {
      const app = getApp()
      const robotId = app.globalData.selectedRobot?.id

      if (!robotId) {
        console.error('未找到机器人ID')
        return
      }

      const res = await request.get(`/api/robot/${robotId}`)
      console.log('机器人信息API返回:', res)

      if ((res.success || res.code === 0) && res.data) {
        console.log('获取到机器人信息:', res.data)
        this.setData({ robotInfo: res.data })
      } else {
        console.error('加载机器人信息失败:', res)
        this.setData({
          robotInfo: {
            name: '智能助手',
            description: '随时为您解答问题'
          }
        })
      }
    } catch (error) {
      console.error('加载机器人信息失败:', error)
      this.setData({
        robotInfo: {
          name: '智能助手',
          description: '随时为您解答问题'
        }
      })
    }
  },

  // 上拉加载更多
  onReachBottom() {
    console.log('触发onReachBottom')
    this.loadChatHistory()
  },

  // 加载聊天历史
  async loadChatHistory() {
    // 防止重复请求
    if (this.data.loadingHistory) {
      console.log('正在加载历史消息，跳过重复请求')
      return
    }

    this.setData({ loadingHistory: true })

    try {
      const app = getApp()
      let robotId = app.globalData.selectedRobot?.id

      if (!robotId) {
        console.warn('未找到机器人ID，无法加载聊天历史')
        wx.showToast({
          title: '请先选择AI助手',
          icon: 'none'
        })
        return
      }

      console.log('加载聊天历史，robotId:', robotId)
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
          : [];
        console.log('formattedMessages:', formattedMessages)

        // 消息去重：基于ID去重，避免重复消息
        const currentMessages = this.data.messages || []
        const existingIds = new Set(currentMessages.map(msg => msg.id))
        const newMessages = formattedMessages.filter(msg => !existingIds.has(msg.id))

        if (newMessages.length > 0) {
          console.log(`添加 ${newMessages.length} 条新消息`)
          // 将新消息追加到现有消息列表的末尾，保持时间顺序
          this.setData({
            messages: [...currentMessages, ...newMessages].sort((a, b) => {
              const timeA = new Date(a.createdAt || a.time || new Date()).getTime()
              const timeB = new Date(b.createdAt || b.time || new Date()).getTime()
              return timeA - timeB
            })
          })
        } else {
          console.log('没有新消息需要添加')
        }
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error)
      wx.showToast({
        title: error.message || '加载聊天历史失败',
        icon: 'none'
      })
    } finally {
      // 确保loadingHistory状态被重置
      this.setData({ loadingHistory: false })
    }
  },

  // 点击发送按钮
  onSend() {
    this.handleSend()
  },

  // 回车发送
  onConfirm() {
    this.handleSend()
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await getUserInfo()
      console.debug('用户信息API返回:', res)

      // 检查用户信息响应格式并处理
      if (res.success === false || res.code === 401) {
        console.warn('获取用户信息API返回错误:', res)
        this.setData({ userInfo: { nickname: '我' } })
        return
      }

      // 处理不同的响应格式
      let userData = res.data?.user || res.data || res

      console.log('设置用户信息:', userData)

      // 更新全局数据
      const app = getApp()
      if (app?.globalData) {
        app.globalData.userInfo = userData
      }

      // 更新本地存储
      wx.setStorageSync('userInfo', userData)
      this.setData({ userInfo: userData })

      console.log('用户信息加载完成，包含bgpic:', userData.bgpic)
      
      // 强制更新背景图
      this.updatePageBackground(userData.bgpic)
    } catch (error) {
      console.error('加载用户信息失败:', error)
      this.setData({ userInfo: { nickname: '我' } })
    }
  },

  // 滚动事件处理
  onScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.detail

    // 记录滚动位置
    this.setData({ lastScrollTop: scrollTop })

    // 如果已经滚动到底部，且正在下拉，且没有正在加载历史消息
    if (scrollTop + clientHeight >= scrollHeight && this.data.isPulling && !this.data.loadingHistory) {
      console.log('触发onScroll下拉加载')
      this.loadChatHistory()
      this.setData({ isPulling: false, pullDistance: 0 })
    }
  },

  // 触摸开始事件
  onTouchStart(e) {
    const scrollTop = this.data.lastScrollTop
    const { scrollHeight, clientHeight } = e.detail

    // 如果已经滚动到底部，且没有正在加载历史消息，开始记录下拉
    if (scrollTop + clientHeight >= scrollHeight && !this.data.loadingHistory) {
      this.setData({
        isPulling: true,
        startY: e.touches[0].clientY
      })
    }
  },

  // 触摸移动事件
  onTouchMove(e) {
    if (this.data.isPulling && !this.data.loadingHistory) {
      const { startY } = this.data
      const currentY = e.touches[0].clientY
      const pullDistance = startY - currentY

      this.setData({ pullDistance })
    }
  },

  // 触摸结束事件
  onTouchEnd() {
    if (this.data.isPulling) {
      this.setData({ isPulling: false, pullDistance: 0 })
    }
  },

  onInputFocus(e) {
    const keyboardHeight = e.detail.height || 0
    // 减去tabbar的高度（98rpx）
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

  // 监听键盘高度变化
  onKeyboardHeightChange(e) {
    const keyboardHeight = e.detail.height
    // 减去tabbar的高度（98rpx）
    const finalKeyboardHeight = Math.max(0, keyboardHeight - 98)

    this.setData({
      keyboardHeight: finalKeyboardHeight
    })

    if (keyboardHeight > 0) {
      this.scrollToBottom()
    }
  },

  // 更新用户背景图
  updateUserBackground() {
    const app = getApp()
    const latestUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    
    console.log('检查背景图更新:', {
      hasLatestUserInfo: !!latestUserInfo,
      currentBgpic: this.data.userInfo?.bgpic,
      latestBgpic: latestUserInfo?.bgpic
    })
    
    if (latestUserInfo) {
      // 检查背景图是否有更新（包括首次加载的情况）
      const currentBgpic = this.data.userInfo?.bgpic
      const latestBgpic = latestUserInfo.bgpic
      
      if (latestBgpic !== currentBgpic) {
        console.log('检测到背景图更新，刷新页面背景:', latestBgpic)
        
        // 更新userInfo数据
        this.setData({
          userInfo: {
            ...this.data.userInfo,
            bgpic: latestBgpic
          }
        })
        
        // 通知页面重新渲染背景
        this.updatePageBackground(latestBgpic)
      }
    }
  },

  // 更新页面背景
  updatePageBackground(bgpicUrl) {
    console.log('更新页面背景图:', bgpicUrl)
    
    if (bgpicUrl) {
      // 如果有背景图，设置页面背景
      this.setData({
        chatBackgroundImage: bgpicUrl
      })
    } else {
      // 如果没有背景图，清除背景
      this.setData({
        chatBackgroundImage: ''
      })
    }
  }
}) 
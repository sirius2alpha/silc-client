const { getRobotList, bindRobot } = require('../../api/robot')

Page({
  data: {
    robots: [],
    selectedRobot: null,
    loading: false,
    initialized: false,
    retryCount: 0
  },

  onLoad() {
    console.log('index page onLoad')
    this.initPage()
  },

  async initPage() {
    console.log('initPage started')
    const app = getApp()
    
    // 先检查登录状态
    if (!app.globalData.userInfo) {
      console.log('No userInfo, redirecting to login')
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    // 获取机器人列表
    try {
      console.log('Fetching robots...')
      wx.showLoading({
        title: '加载中...',
        mask: true
      })

      const res = await getRobotList()
      console.log('Robots fetched:', res.data)

      if (!res.data || res.data.length === 0) {
        throw new Error('没有可用的机器人')
      }

      this.setData({
        robots: res.data,
        selectedRobot: app.globalData.selectedRobot,
        initialized: true
      })

      wx.hideLoading()
    } catch (error) {
      console.error('获取机器人列表失败:', error)
      wx.hideLoading()

      // 如果重试次数小于3次，则重试
      if (this.data.retryCount < 3) {
        console.log(`Retrying... (${this.data.retryCount + 1}/3)`)
        this.setData({ retryCount: this.data.retryCount + 1 })
        setTimeout(() => {
          this.initPage()
        }, 1000)
      } else {
        wx.showToast({
          title: error.message || '获取机器人列表失败',
          icon: 'none',
          duration: 2000,
          success: () => {
            // 如果获取机器人列表失败，延迟返回登录页
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/login/login'
              })
            }, 2000)
          }
        })
      }
    }
  },

  onShow() {
    console.log('index page onShow')
    if (!this.data.initialized) {
      this.initPage()
    }
  },

  async handleSelectRobot(e) {
    if (this.data.loading) return
    
    const robotId = e.currentTarget.dataset.robotId
    if (!robotId) {
      wx.showToast({
        title: '无效的机器人ID',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      await bindRobot(robotId)
      
      const robot = this.data.robots.find(r => r.id === robotId)
      if (!robot) {
        throw new Error('未找到对应的机器人')
      }

      const app = getApp()
      app.globalData.selectedRobot = robot
      wx.setStorageSync('selectedRobot', robot)

      this.setData({ selectedRobot: robot })

      wx.showToast({
        title: '选择成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 延迟跳转到聊天页面
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/chat/chat'
            })
          }, 1500)
        }
      })

    } catch (error) {
      console.error('选择机器人失败:', error)
      wx.showToast({
        title: error.message || '选择失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 
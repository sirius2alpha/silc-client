import config from './config.js'
import { verifyToken } from './api/auth.js'
import { getUserInfo } from './api/user.js'

App({
  globalData: {
    userInfo: null,
    accessToken: null,
    refreshToken: null,
    selectedRobot: null,
    isCheckingLogin: true
  },

  onLaunch() {
    this.initGlobalUserInfoUpdate()
    this.checkLoginStatus()
  },

  /**
   * 初始化全局用户信息更新事件机制
   */
  initGlobalUserInfoUpdate() {
    wx.triggerGlobalUserInfoUpdate = (updatedUserInfo) => {
      console.log('app.js 触发全局用户信息更新:', updatedUserInfo)
      
      // 更新全局数据和本地存储
      this.globalData.userInfo = updatedUserInfo
      wx.setStorageSync('userInfo', updatedUserInfo)
      
      // 更新用户ID存储
      if (updatedUserInfo.id) {
        wx.setStorageSync('userId', updatedUserInfo.id)
      }
      
      // 通知所有活跃页面
      const pages = getCurrentPages()
      console.log('当前活跃页面数量:', pages.length)
      
      pages.forEach((page, index) => {
        console.log(`通知页面 ${index}: ${page.route}`)
        
        if (typeof page.onUserInfoUpdate === 'function') {
          page.onUserInfoUpdate(updatedUserInfo)
        }
        
        // 为特定页面提供额外的更新方法
        if (page.route === 'pages/profile/profile') {
          if (typeof page.forceRefreshUserInfo === 'function') {
            setTimeout(() => page.forceRefreshUserInfo(), 100)
          }
        }
        
        if (page.route === 'pages/chat/chat') {
          if (typeof page.forceUpdateUserInfo === 'function') {
            setTimeout(() => page.forceUpdateUserInfo(), 100)
          }
        }
      })
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('accessToken')

    if (!token) {
      this.globalData.isCheckingLogin = false
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }

    verifyToken(token).then(() => {
      this.loadUserInfoAfterTokenVerify()
      wx.reLaunch({ url: '/pages/chat/chat' })
    }).catch(() => {
      this.handleLoginFailure()
    })
  },

  /**
   * token验证成功后加载用户信息
   */
  async loadUserInfoAfterTokenVerify() {
    try {
      // 先从本地存储恢复
      const storedUserInfo = wx.getStorageSync('userInfo')
      const storedSelectedRobot = wx.getStorageSync('selectedRobot')
      
      if (storedUserInfo) {
        this.globalData.userInfo = storedUserInfo
        
        if (storedSelectedRobot) {
          this.globalData.selectedRobot = storedSelectedRobot
        } else if (storedUserInfo.selectedRobot) {
          const selectedRobotInfo = this.findRobotInfo(storedUserInfo.selectedRobot)
          if (selectedRobotInfo) {
            this.globalData.selectedRobot = selectedRobotInfo
            wx.setStorageSync('selectedRobot', selectedRobotInfo)
          }
        }
      }
      
      // 异步获取最新用户信息
      setTimeout(async () => {
        try {
          const userInfoRes = await getUserInfo()
          const latestUserInfo = userInfoRes.data?.user || userInfoRes.data
          
          if (latestUserInfo) {
            this.globalData.userInfo = latestUserInfo
            wx.setStorageSync('userInfo', latestUserInfo)
            wx.setStorageSync('userId', latestUserInfo.id)
            
            if (latestUserInfo.selectedRobot) {
              const selectedRobotInfo = this.findRobotInfo(latestUserInfo.selectedRobot)
              if (selectedRobotInfo) {
                this.globalData.selectedRobot = selectedRobotInfo
                wx.setStorageSync('selectedRobot', selectedRobotInfo)
              }
            }
            
            if (typeof wx.triggerGlobalUserInfoUpdate === 'function') {
              wx.triggerGlobalUserInfoUpdate(latestUserInfo)
            }
          }
        } catch (error) {
          console.warn('异步获取用户信息失败:', error)
        }
      }, 1000)
      
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  /**
   * 处理登录失败
   */
  handleLoginFailure() {
    // 清除所有存储的数据
    wx.removeStorageSync('accessToken')
    wx.removeStorageSync('refreshToken')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('selectedRobot')

    // 重置全局数据
    this.globalData = {
      accessToken: null,
      refreshToken: null,
      userInfo: null,
      selectedRobot: null
    }

    wx.reLaunch({ url: '/pages/login/login' })
  },

  /**
   * 根据机器人标识查找对应的机器人信息
   */
  findRobotInfo(robotIdentifier) {
    // 如果已经是完整的机器人对象，直接返回
    if (robotIdentifier && typeof robotIdentifier === 'object' && robotIdentifier.id) {
      return robotIdentifier
    }
    
    const defaultRobots = [
      {
        id: 'xiwen',
        name: '悉文',
        avatar: '/assets/images/xiwen.png',
        description: '专业、稳重的男性机器人助手',
        personality: 'male'
      },
      {
        id: 'xihui',
        name: '悉荟',
        avatar: '/assets/images/xihui.png',
        description: '温柔、贴心的女性机器人助手',
        personality: 'female'
      }
    ]

    const identifier = String(robotIdentifier).toLowerCase()
    
    // 根据id匹配
    let matchedRobot = defaultRobots.find(robot => robot.id === identifier)
    
    // 根据name匹配
    if (!matchedRobot) {
      matchedRobot = defaultRobots.find(robot => robot.name === robotIdentifier)
    }
    
    // 兼容性处理
    if (!matchedRobot) {
      if (identifier === 'xiwen' || identifier === '悉文') {
        matchedRobot = defaultRobots[0]
      } else if (identifier === 'xihui' || identifier === '悉荟') {
        matchedRobot = defaultRobots[1]
      }
    }
    
    return matchedRobot || null
  },

  /**
   * 获取用户信息
   */
  getUserInfoFromApp() {
    return new Promise((resolve, reject) => {
      // 检查全局数据
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo)
        return
      }

      // 检查本地存储
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
        resolve(userInfo)
        return
      }

      // 检查token
      const token = wx.getStorageSync('accessToken')
      if (!token) {
        reject(new Error('用户未登录'))
        return
      }

      // 从服务器获取
      getUserInfo().then(userInfo => {
        this.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        resolve(userInfo)
      }).catch(reject)
    })
  }
})

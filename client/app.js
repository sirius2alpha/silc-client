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
    console.log('App onLaunch')
    console.log('BASE_URL:', config.BASE_URL)
    // 检查登录状态
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    console.log('Checking login status...')
    const token = wx.getStorageSync('accessToken')
    console.log('Token from storage:', token ? '存在' : '不存在')

    if (!token) {
      console.log('No token found, redirecting to login')
      this.globalData.isCheckingLogin = false
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    // 验证token有效性
    console.log('Sending verify request...')
    verifyToken(token).then(claim => {
      console.log('Token验证成功，用户已登录')

      // 跳转到chat页面
      wx.reLaunch({
        url: '/pages/chat/chat'
      })
    }).catch(err => {
      console.error('Token验证失败:', err)
      // 处理登录失败的情况
      this.handleLoginFailure()
    })
  },

  // 处理登录失败的情况
  handleLoginFailure() {
    console.log('处理登录失败')
    // 清除所有存储的数据
    wx.removeStorageSync('accessToken')
    wx.removeStorageSync('refreshToken')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('selectedRobot')

    // 重置全局数据
    this.globalData.accessToken = null
    this.globalData.refreshToken = null
    this.globalData.userInfo = null
    this.globalData.selectedRobot = null

    // 跳转到登录页面
    wx.reLaunch({
      url: '/pages/login/login'
    })
  },

  // 根据机器人名称查找对应的机器人信息
  findRobotInfo(robotName) {
    console.log('调用app.js findRobotInfo查找机器人信息:', robotName)
    // 默认的机器人信息
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
    ];

    // 尝试根据名称匹配
    if (robotName === 'xiwen') {
      return defaultRobots[0];
    } else if (robotName === 'xihui') {
      return defaultRobots[1];
    }
    return null;
  },

  getUserInfoFromApp() {
    return new Promise((resolve, reject) => {
      // 首先检查全局数据中是否有用户信息
      if (this.globalData.userInfo) {
        console.log('从全局数据获取用户信息');
        resolve(this.globalData.userInfo);
        return;
      }

      // 检查本地存储
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        console.log('从本地存储获取用户信息');
        this.globalData.userInfo = userInfo;
        resolve(userInfo);
        return;
      }

      // 如果没有找到用户信息，检查是否有token
      const token = wx.getStorageSync('accessToken');
      if (!token) {
        console.log('未找到token，用户未登录');
        reject(new Error('用户未登录'));
        return;
      }

      // 从服务器获取用户信息
      console.log('从服务器获取用户信息');
      getUserInfo().then(userInfo => {
        this.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo); // 缓存用户信息
        resolve(userInfo);
      }).catch(err => {
        console.error('获取用户信息失败:', err);
        reject(err);
      });
    });
  }
})

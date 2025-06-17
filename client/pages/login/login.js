import { showToast, reLaunch } from '../../utils/util'
import { login, wechatLogin } from '../../api/auth'
import { getUserInfo } from '../../api/user'
import { createPage } from '../../utils/page-helper'

const loginPage = createPage({
  data: {
    account: '',
    password: '',
    loading: false,
    counting: false,
    countDown: 60,
    showPassword: false
  },

  /**
   * 开始倒计时
   */
  startCountDown() {
    let count = 60
    const timer = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(timer)
        this.setData({
          counting: false,
          countDown: 60
        })
      } else {
        this.setData({ countDown: count })
      }
    }, 1000)
  },

  /**
   * 保存登录信息并处理导航
   */
  async saveLoginInfo(loginData) {
    try {
      // 保存登录凭证
      wx.setStorageSync('accessToken', loginData.accessToken)
      wx.setStorageSync('refreshToken', loginData.refreshToken)

      // 获取完整用户信息
      const userInfoRes = await getUserInfo()
      const userInfo = userInfoRes.data.user

      const app = getApp()
      let selectedRobotInfo = null
      
      // 处理已选择的机器人
      if (userInfo.selectedRobot) {
        selectedRobotInfo = app.findRobotInfo(userInfo.selectedRobot)
      }

      // 设置全局数据
      if (app?.globalData) {
        app.globalData.userInfo = userInfo
        app.globalData.accessToken = loginData.accessToken
        app.globalData.refreshToken = loginData.refreshToken
        app.globalData.selectedRobot = selectedRobotInfo
      }

      // 保存用户信息到本地存储
      wx.setStorageSync('userInfo', userInfo)
      wx.setStorageSync('userId', userInfo.id)
      
      if (selectedRobotInfo) {
        wx.setStorageSync('selectedRobot', selectedRobotInfo)
      }

      return userInfo
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 使用登录返回的基本信息作为降级方案
      const basicUserInfo = loginData.user

      const app = getApp()
      if (app?.globalData) {
        app.globalData.userInfo = basicUserInfo
        app.globalData.accessToken = loginData.accessToken
        app.globalData.refreshToken = loginData.refreshToken
        
        if (basicUserInfo?.selectedRobot) {
          const selectedRobotInfo = app.findRobotInfo(basicUserInfo.selectedRobot)
          app.globalData.selectedRobot = selectedRobotInfo
          if (selectedRobotInfo) {
            wx.setStorageSync('selectedRobot', selectedRobotInfo)
          }
        }
      }

      wx.setStorageSync('userInfo', basicUserInfo)
      wx.setStorageSync('userId', basicUserInfo?.id)

      return basicUserInfo
    }
  },

  /**
   * 处理登录成功后的导航
   */
  handleLoginNavigation(userInfo) {
    if (userInfo?.selectedRobot) {
      reLaunch('/pages/chat/chat')
    } else {
      reLaunch('/pages/robot-select/robot-select')
    }
  },

  /**
   * 账号密码登录
   */
  async handleLogin() {
    const { account, password, loading } = this.data
    if (loading) return

    if (!account.trim() || !password.trim()) {
      showToast('请输入账号和密码')
      return
    }

    this.setLoading(true)

    try {
      const res = await login({ account, password })

      if (!res?.data?.accessToken) {
        throw new Error('登录失败：无效的响应格式')
      }

      const userInfo = await this.saveLoginInfo(res.data)
      this.handleLoginNavigation(userInfo)

    } catch (error) {
      this.handleError(error, '登录失败')
    } finally {
      this.setLoading(false)
    }
  },

  /**
   * 微信登录
   */
  async handleWechatLogin() {
    try {
      const { code } = await wx.login()
      
      const res = await wechatLogin({ code })

      if (!res?.data?.accessToken) {
        throw new Error('微信登录失败：无效的响应格式')
      }

      const userInfo = await this.saveLoginInfo(res.data)
      this.handleLoginNavigation(userInfo)

    } catch (error) {
      this.handleError(error, '微信登录失败')
    }
  },

  /**
   * 跳转到注册页
   */
  navigateToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  },

  /**
   * 跳转到重置密码页
   */
  navigateToReset() {
    wx.navigateTo({
      url: '/pages/reset/reset'
    })
  },

  /**
   * 输入框事件
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [field]: e.detail.value
    })
  }
})

Page(loginPage) 
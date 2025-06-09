import { showToast, reLaunch } from '../../utils/util'
import { login, register, wechatLogin } from '../../api/auth'
import { getUserInfo } from '../../api/user'

Page({
  data: {
    account: '',
    password: '',
    loading: false,
    counting: false,
    countDown: 60,
    showPassword: false
  },

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

  // 保存登录信息并处理导航
  async saveLoginInfo(loginData) {
    try {
      // 保存登录凭证
      wx.setStorageSync('accessToken', loginData.accessToken)
      wx.setStorageSync('refreshToken', loginData.refreshToken)

      // 使用 user.js 中的 getUserInfo 获取完整用户信息
      const userInfoRes = await getUserInfo()
      const userInfo = userInfoRes.data.user

      // 保存用户信息到 storage 和 全局数据
      wx.setStorageSync('userInfo', userInfo)
      const app = getApp()
      if (app?.globalData) {
        app.globalData.userInfo = userInfo
      }

      return userInfo
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果获取用户信息失败，使用登录返回的基本信息
      const basicUserInfo = loginData.user
      wx.setStorageSync('userInfo', basicUserInfo)

      const app = getApp()
      if (app?.globalData) {
        app.globalData.userInfo = basicUserInfo
      }

      return basicUserInfo
    }
  },

  // 处理登录成功后的导航
  handleLoginNavigation(userInfo) {
      // 根据用户是否已选择机器人决定跳转页面
      if (userInfo?.selectedRobot) {
        console.log('用户已选择机器人，跳转到聊天页面')
        reLaunch('/pages/chat/chat')
      } else {
        console.log('用户未选择机器人，跳转到机器人选择页面')
        reLaunch('/pages/robot-select/robot-select')
      }
  },

  // 账号密码登录 - 使用 auth.js 中的 login 函数
  async handleLogin() {
    const { account, password, loading } = this.data
    if (loading) return

    if (!account.trim() || !password.trim()) {
      showToast('请输入账号和密码')
      return
    }

    this.setData({ loading: true })

    try {
      // 使用 auth.js 中的 login 函数
      const res = await login({ account, password })

      if (!res?.data?.accessToken) {
        throw new Error('登录失败：无效的响应格式')
      }

      // 保存登录信息并获取用户信息
      const userInfo = await this.saveLoginInfo(res.data)

      // 处理导航
      this.handleLoginNavigation(userInfo)

    } catch (error) {
      console.error('登录失败:', error)
      showToast(error.message || '登录失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 微信登录 - 使用 auth.js 中的 wechatLogin 函数
  async handleWechatLogin() {
    try {
      const { code } = await wx.login()
      
      // 使用 auth.js 中的 wechatLogin 函数
      const res = await wechatLogin({
        code,
      })

      if (!res?.data?.accessToken) {
        throw new Error('微信登录失败：无效的响应格式')
      }

      // 保存登录信息并获取用户信息
      const userInfo = await this.saveLoginInfo(res.data)

      // 处理导航
      this.handleLoginNavigation(userInfo)

    } catch (error) {
      console.error('微信登录失败:', error)
      showToast(error.message || '微信登录失败')
    }
  },

  // 注册 - 使用 auth.js 中的 register 函数
  async handleRegister() {
    const { account, password, loading } = this.data
    if (loading) return

    if (!account.trim() || !password.trim()) {
      showToast('请输入账号和密码')
      return
    }

    this.setData({ loading: true })

    try {
      // 使用 auth.js 中的 register 函数
      const res = await register({ account, password })

      if (res?.code === 200) {
        showToast('注册成功，请登录')
        // 注册成功后可以自动登录或让用户手动登录
      } else {
        throw new Error(res.message || '注册失败')
      }

    } catch (error) {
      console.error('注册失败:', error)
      showToast(error.message || '注册失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 跳转到注册页
  navigateToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  },

  // 跳转到重置密码页
  navigateToReset() {
    wx.navigateTo({
      url: '/pages/reset/reset'
    })
  },

  // 输入框事件
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [field]: e.detail.value
    })
  }
}) 
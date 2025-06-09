const { showToast } = require('../../utils/util')
const request = require('../../utils/request')

Page({
  data: {
    phone: '',
    verifyCode: '',
    password: '',
    confirmPassword: '',
    loading: false,
    counting: false,
    countDown: 60,
    showPassword: false,
    showConfirmPassword: false
  },

  // 切换密码显示状态
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  // 切换确认密码显示状态
  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
  },

  // 发送验证码
  async sendVerifyCode() {
    const { phone, counting } = this.data
    if (counting) return
    
    if (!phone || !/^1\d{10}$/.test(phone)) {
      showToast('请输入正确的手机号')
      return
    }

    try {
      await request.post('/api/user/send-code', { phone })
      
      this.setData({ counting: true })
      this.startCountDown()
      
      showToast('验证码已发送', 'success')
    } catch (error) {
      showToast(error.message || '发送失败')
    }
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

  // 注册
  async handleRegister() {
    const { phone, verifyCode, password, confirmPassword, loading } = this.data
    if (loading) return
    
    if (!phone || !verifyCode || !password || !confirmPassword) {
      showToast('请填写完整信息')
      return
    }

    if (password !== confirmPassword) {
      showToast('两次密码不一致')
      return
    }

    this.setData({ loading: true })
    
    try {
      await request.post('/api/user/register', {
        phone,
        verifyCode,
        password
      })

      showToast('注册成功', 'success')

      // 延迟返回登录页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      showToast(error.message || '注册失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 返回登录页
  navigateToLogin() {
    wx.navigateBack()
  }
}) 
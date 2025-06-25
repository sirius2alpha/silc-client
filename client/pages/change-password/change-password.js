import { changePassword } from '../../api/auth'

Page({
  data: {
    newPassword: '',
    confirmPassword: '',
    showNewPassword: false,
    showConfirmPassword: false,
    loading: false
  },

  onLoad(options) { },

  // 新密码输入
  onNewPasswordInput(e) {
    this.setData({
      newPassword: e.detail.value
    })
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    })
  },

  // 切换新密码可见性
  toggleNewPasswordVisibility() {
    this.setData({
      showNewPassword: !this.data.showNewPassword
    })
  },

  // 切换确认密码可见性
  toggleConfirmPasswordVisibility() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
  },

  // 验证密码格式
  validatePassword(password) {
    if (!password) {
      return { valid: false, message: '密码不能为空' }
    }
    if (password.length < 6) {
      return { valid: false, message: '密码至少需要6位' }
    }
    if (password.length > 20) {
      return { valid: false, message: '密码长度不能超过20位' }
    }
    return { valid: true }
  },

  // 提交修改密码
  async handleSubmit() {
    const { newPassword, confirmPassword } = this.data

    // 验证新密码
    const newPasswordValidation = this.validatePassword(newPassword)
    if (!newPasswordValidation.valid) {
      wx.showToast({
        title: newPasswordValidation.message,
        icon: 'none'
      })
      return
    }

    // 验证确认密码
    if (!confirmPassword) {
      wx.showToast({
        title: '请确认新密码',
        icon: 'none'
      })
      return
    }

    // 验证两次密码是否一致
    if (newPassword !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    try {
      wx.showLoading({
        title: '修改中...'
      })

      const result = await changePassword({
        newPassword: newPassword
      })

      wx.hideLoading()

      if (result.success || result.code === 200) {
        wx.showModal({
          title: '修改成功',
          content: '密码修改成功，请重新登录',
          showCancel: false,
          confirmText: '去登录',
          success: () => {
            // 清除本地存储
            wx.removeStorageSync('accessToken')
            wx.removeStorageSync('refreshToken')
            wx.removeStorageSync('userInfo')

            // 跳转到登录页面
            wx.reLaunch({
              url: '/pages/login/login'
            })
          }
        })
      } else {
        wx.showToast({
          title: result.message || '修改失败，请重试',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('修改密码失败:', error)
      wx.showToast({
        title: '修改失败，请检查网络连接',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 取消修改
  handleCancel() {
    wx.navigateBack()
  }
}) 
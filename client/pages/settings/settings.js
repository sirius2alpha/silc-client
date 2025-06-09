import { getUserSettings, updateUserSettings } from '../../api/user'

Page({
  data: {
    settings: null,
    loading: false,
    saving: false
  },

  onLoad() {
    this.loadSettings()
  },

  async loadSettings() {
    try {
      this.setData({ loading: true })
      const res = await getUserSettings()
      this.setData({ settings: res })
    } catch (error) {
      wx.showToast({
        title: error.message || '获取设置失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 更新设置
  async handleSave() {
    try {
      this.setData({ saving: true })
      await updateUserSettings(this.data.settings)
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  // 开关切换
  handleSwitchChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`settings.${field}`]: e.detail.value
    })
  },

  // 清除缓存
  handleClearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除所有缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({
            title: '清除成功',
            icon: 'success'
          })
        }
      }
    })
  }
}) 
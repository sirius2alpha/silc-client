import { getPointsRules } from '../../../api/points'

Page({
  data: {
    rules: [],
    loading: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '积分规则'
    })
    this.loadRules()
  },

  // 获取积分规则
  async loadRules() {
    this.setData({ loading: true })
    
    try {
      const res = await getPointsRules()
      if (res.success) {
        this.setData({
          rules: res.data.rules || []
        })
      } else {
        wx.showToast({
          title: res.message || '获取积分规则失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取积分规则失败:', error)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  }
}) 
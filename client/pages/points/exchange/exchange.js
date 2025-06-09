import { getGiftList, exchangeGift } from '../../../api/points'

Page({
  data: {
    gifts: [],
    loading: false
  },

  onLoad() {
    this.loadGiftList()
  },

  // 获取礼品列表
  async loadGiftList() {
    try {
      this.setData({ loading: true })
      const res = await getGiftList()
      this.setData({ gifts: res.gifts })
    } catch (error) {
      wx.showToast({
        title: error.message || '获取礼品列表失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 兑换礼品
  async handleExchange(e) {
    const { giftId, points } = e.currentTarget.dataset
    
    try {
      await wx.showModal({
        title: '确认兑换',
        content: `确定要消耗${points}积分兑换该礼品吗？`,
        confirmText: '确定兑换'
      })

      await exchangeGift({ giftId })

      wx.showToast({
        title: '兑换成功',
        icon: 'success'
      })

      // 刷新列表
      this.loadGiftList()

    } catch (error) {
      if (error.errMsg !== 'showModal:cancel') {
        wx.showToast({
          title: error.message || '兑换失败',
          icon: 'none'
        })
      }
    }
  }
}) 
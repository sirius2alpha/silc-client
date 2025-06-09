import { 
  getPointsStatus,
  getExchangeItems,
  exchangeItem
} from '../../../api/points'

Page({
  data: {
    balance: 0,
    exchangeItems: [],
    loading: false,
    showConfirmModal: false,
    showRedeemModal: false,
    currentItem: {},
    currentItemIndex: 0,
    redeemCode: ''
  },

  onLoad() {
    this.loadPointsBalance()
    this.loadExchangeItems()
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadPointsBalance(),
      this.loadExchangeItems()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onShow() {
    // 每次页面显示时刷新积分余额
    this.loadPointsBalance()
  },

  // 加载积分余额
  async loadPointsBalance() {
    try {
      wx.showNavigationBarLoading()
      const res = await getPointsStatus()
      if(res.success && res.data) {
        this.setData({ balance: res.data.totalPoints || 0 })
      }
    } catch (error) {
      wx.showToast({
        title: '获取积分余额失败',
        icon: 'none'
      })
      console.error('获取积分余额失败:', error)
    } finally {
      wx.hideNavigationBarLoading()
    }
  },

  // 加载兑换商品
  async loadExchangeItems() {
    try {
      this.setData({ loading: true })
      wx.showNavigationBarLoading()
      
      const res = await getExchangeItems()
      if(res.success && res.data && res.data.items) {
        this.setData({ 
          exchangeItems: res.data.items.map(item => ({
            ...item,
            // 确保description有值
            description: item.description || '暂无描述'
          }))
        })
      } else {
        console.warn('兑换商品数据格式异常:', res)
        this.setData({ exchangeItems: [] })
      }
    } catch (error) {
      wx.showToast({
        title: '获取商品列表失败',
        icon: 'none'
      })
      console.error('获取商品列表失败:', error)
      this.setData({ exchangeItems: [] })
    } finally {
      this.setData({ loading: false })
      wx.hideNavigationBarLoading()
    }
  },

  // 点击商品
  handleItemTap(e) {
    // 可以添加更详细的商品展示逻辑
    console.log('商品点击:', e.currentTarget.dataset.item)
  },

  // 兑换商品
  handleExchange(e) {
    // 阻止冒泡，避免触发父级的点击事件
    if(e && e.stopPropagation) {
      e.stopPropagation()
    }

    const { id, name, points } = e.currentTarget.dataset
    const item = this.data.exchangeItems.find(item => item.id === id)
    
    if (!item) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      return
    }

    if (this.data.balance < points) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }

    // 找出当前商品的索引，用于显示默认图片
    const itemIndex = this.data.exchangeItems.findIndex(i => i.id === id)

    // 显示确认弹窗
    this.setData({
      showConfirmModal: true,
      currentItem: item,
      currentItemIndex: itemIndex >= 0 ? itemIndex : 0
    })
  },

  // 隐藏确认兑换弹窗
  hideConfirmModal() {
    this.setData({ showConfirmModal: false })
  },

  // 确认兑换
  async confirmExchange() {
    const item = this.data.currentItem
    
    if (!item || !item.id) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '兑换中' })
      const result = await exchangeItem(item.id)
      
      if (result.success && result.data) {
        // 显示兑换码
        this.setData({
          showRedeemModal: true,
          redeemCode: result.data.data.redeemCode || '兑换成功'
        })
        
        // 刷新积分余额和商品列表
        await Promise.all([
          this.loadPointsBalance(),
          this.loadExchangeItems()
        ])
        
        // 隐藏确认弹窗
        this.hideConfirmModal()
      } else {
        throw new Error(result.message || '兑换失败')
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '兑换失败',
        icon: 'none'
      })
      console.error('兑换失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  // 隐藏兑换码弹窗
  hideRedeemModal() {
    this.setData({
      showRedeemModal: false,
      redeemCode: ''
    })
  },

  // 错误图片处理
  handleImageError(e) {
    const index = e.currentTarget.dataset.index
    const defaultImage = `/assets/images/items/item${(index % 6) + 1}.png`
    
    // 更新商品图片为默认图片
    const items = this.data.exchangeItems
    if(items[index]) {
      items[index].image = defaultImage
      this.setData({ exchangeItems: items })
    }
  },
  
  // 分享功能
  onShareAppMessage() {
    return {
      title: '积分兑好礼，快来看看吧！',
      path: '/pages/points/mall/mall'
    }
  }
}) 
import {
  getPointsStatus,
  getPointsHistory,
  getExchangeItems,
  exchangeItem,
  getPointsRules,
} from '../../api/points'

import { formatTime } from '../../utils/util'

Page({
  data: {
    pointsList: [],
    exchangeItems: [],
    rules: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    totalPoints: 0, // 总积分
    monthPoints: 0, // 本月积分
    usedPoints: 0, // 已使用积分
    dateRanges: ['全部', '本周', '本月', '今年'],
    dateRangeIndex: 0,
    
    // 添加数据缓存状态
    lastLoadTime: 0, // 上次加载时间
    dataLoaded: false, // 数据是否已加载
    cacheTimeout: 5 * 60 * 1000 // 5分钟缓存时间
  },

  onLoad() { 
    // 初始加载数据
    this.initData()
  },

  onShow() {
    // 每次切换到points页面都调用status和history
    this.refreshPointsData()
  },

  // 初始化数据（首次加载）
  async initData() {
    try {
      wx.showLoading({ title: '加载中...' })
      
      // 初始加载只需要积分状态和历史记录
      await Promise.allSettled([
        this.loadPointsStatus(),
        this.loadPointsList(true)
      ])
      
      this.setData({ 
        dataLoaded: true,
        lastLoadTime: Date.now()
      })
    } catch (error) {
      console.error('初始化数据失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  // 刷新积分相关数据（status + history）
  async refreshPointsData() {
    try {
      this.setData({ loading: true })
      
      // 重置分页状态并清空历史数据
      this.setData({
        page: 1,
        hasMore: true,
        pointsList: [] // 清空历史数据，确保重新加载
      })

      // 并行加载积分状态和历史记录
      await Promise.allSettled([
        this.loadPointsStatus(),
        this.loadPointsListInternal(true) // 使用内部方法避免loading冲突
      ])
      
      this.setData({ 
        lastLoadTime: Date.now(),
        dataLoaded: true
      })
    } catch (error) {
      console.error('刷新积分数据失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载积分统计
  async loadPointsStatus() {
    try {
      const res = await getPointsStatus()
      if (res.success) {
        this.setData({
          totalPoints: res.data.totalPoints,
          monthPoints: res.data.monthPoints,
          usedPoints: res.data.usedPoints
        })
      }
    } catch (error) {
      console.error('加载积分统计失败:', error)

      // 提供一个默认值，防止UI显示错误
      this.setData({
        totalPoints: 0,
        monthPoints: 0,
        usedPoints: 0
      })

      // 判断是否未登录
      if (error.statusCode === 401) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
      } else {
        wx.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        })
      }
    }
  },

  // 内部加载积分明细方法，避免loading状态冲突
  async loadPointsListInternal(refresh = false) {
    const { page, pageSize, pointsList, dateRangeIndex } = this.data

    try {
      const params = {
        page: refresh ? 1 : page,
        pageSize
      }

      // 根据日期范围筛选
      if (dateRangeIndex !== 0) {
        const now = new Date()
        let startDate

        if (dateRangeIndex === 1) { // 本周
          const day = now.getDay() || 7
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
        } else if (dateRangeIndex === 2) { // 本月
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        } else if (dateRangeIndex === 3) { // 今年
          startDate = new Date(now.getFullYear(), 0, 1)
        }

        if (startDate) {
          params.startDate = startDate.toISOString()
          params.endDate = now.toISOString()
        }
      }

      const res = await getPointsHistory(params)

      if (res.success && res.data && res.data.list) {
        // 格式化数据
        const formattedList = res.data.list.map(item => {
          // 根据类型设置显示内容
          let typeText = ''
          if (item.type === 'earn') {
            typeText = '积分获取'
          } else if (item.type === 'spend') {
            typeText = '积分使用'
          } else if (item.type === 'admin') {
            typeText = '管理员操作'
          } else if (item.type === 'refund') {
            typeText = '积分退还'
          }

          // 处理时间显示 - 特殊处理Z结尾的时间格式
          let displayTime = ''
          if (item.createdAt.endsWith('Z')) {
            // 去掉Z后缀，当作本地时间处理（因为数据库存储的就是本地时间）
            const timeWithoutZ = item.createdAt.slice(0, -1)
            displayTime = formatTime(new Date(timeWithoutZ))
          } else {
            displayTime = formatTime(new Date(item.createdAt))
          }

          return {
            id: item.id,
            title: typeText,
            type: item.type,
            description: item.description,
            time: displayTime,
            points: item.amount
          }
        })

        const currentPage = refresh ? 1 : page
        this.setData({
          pointsList: refresh ? formattedList : [...pointsList, ...formattedList],
          hasMore: formattedList.length === pageSize,
          page: currentPage + 1
        })
      } else {
        // 处理返回数据异常的情况
        console.warn('积分历史数据格式异常:', res)
        this.setData({
          pointsList: refresh ? [] : pointsList,
          hasMore: false
        })
      }
    } catch (error) {
      console.error('加载积分明细失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })

      // 发生错误时重置hasMore，避免无限重试
      this.setData({
        hasMore: false
      })
    }
  },

  // 加载兑换商品
  async loadExchangeItems() {
    try {
      const res = await getExchangeItems()
      this.setData({ exchangeItems: res.data })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载积分规则
  async loadPointsRules() {
    try {
      const res = await getPointsRules()
      this.setData({ rules: res.data })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 兑换商品
  async handleExchange(e) {
    const { id } = e.currentTarget.dataset
    const item = this.data.exchangeItems.find(item => item.id === id)

    if (!item) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      return
    }

    if (this.data.totalPoints < item.points) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认兑换',
      content: `确定使用${item.points}积分兑换"${item.name}"吗？`,
      async success(res) {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '兑换中' })
            const result = await exchangeItem(id)

            if (result.success) {
              wx.showToast({
                title: '兑换成功',
                icon: 'success'
              })

              // 兑换成功后只刷新积分状态
              await this.loadPointsStatus()
              
              // 更新缓存时间
              this.setData({ lastLoadTime: Date.now() })
            }
          } catch (error) {
            wx.showToast({
              title: error.message || '兑换失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 日期范围变化
  handleDateRangeChange(e) {
    const dateRangeIndex = Number(e.detail.value)
    this.setData({ dateRangeIndex })
    this.loadPointsList(true)
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPointsList()
    }
  },

  formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },

  // 下拉刷新
  onPullDownRefresh() {
    // 下拉刷新时只刷新积分数据（status + history）
    this.refreshPointsData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadPointsList()
    }
  },

  // 加载积分明细（用于上拉加载更多）
  async loadPointsList(refresh = false) {
    if (this.data.loading) return

    const { page, pageSize, pointsList } = this.data

    if (refresh) {
      this.setData({
        page: 1,
        pointsList: [],
        hasMore: true
      })
    }

    this.setData({ loading: true })

    try {
      await this.loadPointsListInternal(refresh)
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  }
}) 
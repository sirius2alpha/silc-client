import {
  getPointsStatus,
  getPointsHistory,
  getExchangeItems,
  exchangeItem,
  getPointsRules,
} from '../../api/points'

import { formatTime } from '../../utils/util'
import { createPaginationPage } from '../../utils/page-helper'

const pointsPage = createPaginationPage({
  data: {
    exchangeItems: [],
    rules: [],
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
    this.initData()
  },

  onShow() {
    // 只有在数据已加载过的情况下才刷新，避免与onLoad重复
    if (this.data.dataLoaded) {
      this.refreshPointsData()
    }
  },

  /**
   * 初始化数据
   */
  async initData() {
    try {
      // 先加载积分列表（因为它有自己的loading管理）
      await this.loadPointsList(true)
      
      // 再加载积分状态
      await this.loadPointsStatus()
      
      this.updateCacheTime()
    } catch (error) {
      this.handleError(error, '初始化数据失败')
    }
  },

  /**
   * 刷新积分相关数据
   */
  async refreshPointsData() {
    try {
      this.resetPagination()
      
      await Promise.all([
        this.loadPointsStatus(),
        this.loadPointsList(true)
      ])
      
      this.updateCacheTime()
    } catch (error) {
      this.handleError(error, '刷新积分数据失败')
    }
  },

  /**
   * 加载积分统计
   */
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
      // 提供默认值，防止UI显示错误
      this.setData({
        totalPoints: 0,
        monthPoints: 0,
        usedPoints: 0
      })

      if (error.statusCode === 401) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
      } else {
        this.handleError(error, '加载积分统计失败')
      }
    }
  },



  /**
   * 获取日期范围参数
   */
  getDateRangeParams(dateRangeIndex) {
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

    return startDate ? {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    } : {}
  },

  /**
   * 获取类型文本
   */
  getTypeText(type) {
    const typeMap = {
      'earn': '积分获取',
      'spend': '积分使用',
      'admin': '管理员操作',
      'refund': '积分退还'
    }
    return typeMap[type] || type
  },

  /**
   * 格式化时间显示
   */
  formatItemTime(createdAt) {
    if (createdAt.endsWith('Z')) {
      const timeWithoutZ = createdAt.slice(0, -1)
      return formatTime(new Date(timeWithoutZ))
    } else {
      return formatTime(new Date(createdAt))
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

  /**
   * 兑换商品
   */
  async handleExchange(e) {
    const { id } = e.currentTarget.dataset
    const item = this.data.exchangeItems?.find(item => item.id === id)

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

    try {
      await wx.showModal({
        title: '确认兑换',
        content: `确定使用${item.points}积分兑换"${item.name}"吗？`,
        confirmText: '确定兑换'
      })

      this.setLoading(true, '兑换中')
      const result = await exchangeItem(id)

      if (result.success) {
        wx.showToast({
          title: '兑换成功',
          icon: 'success'
        })

        await this.loadPointsStatus()
        this.updateCacheTime()
      }
    } catch (error) {
      if (error.errMsg !== 'showModal:cancel') {
        this.handleError(error, '兑换失败')
      }
    } finally {
      this.setLoading(false)
    }
  },

  /**
   * 日期范围变化
   */
  handleDateRangeChange(e) {
    const dateRangeIndex = Number(e.detail.value)
    this.setData({ dateRangeIndex }, () => {
      this.loadPointsList(true)
    })
  },

  /**
   * 加载更多（点击触发）
   */
  loadMoreData() {
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

  // 加载积分明细
  async loadPointsList(refresh = false) {
    const { dateRangeIndex } = this.data

    try {
      const result = await this.loadMore(
        async (page, pageSize) => {
          const params = { page, pageSize }

          // 根据日期范围筛选
          if (dateRangeIndex !== 0) {
            const dateParams = this.getDateRangeParams(dateRangeIndex)
            Object.assign(params, dateParams)
          }

          const res = await getPointsHistory({
            pagination: {
              page: params.page,
              page_size: params.pageSize
            },
            ...Object.keys(params).filter(key => !['page', 'pageSize'].includes(key))
              .reduce((obj, key) => ({ ...obj, [key]: params[key] }), {})
          })

          if (res.success && res.data && res.data.list) {
            const formattedList = res.data.list.map(item => {
              const typeText = this.getTypeText(item.type)
              const displayTime = this.formatItemTime(item.createdAt)

              return {
                id: item.id,
                title: typeText,
                type: item.type,
                description: item.description,
                time: displayTime,
                points: item.amount
              }
            })

            return {
              list: formattedList,
              total: res.data.total || formattedList.length
            }
          } else {
            return { list: [], total: 0 }
          }
        },
        refresh
      )

      return result
    } catch (error) {
      this.handleError(error, '加载积分明细失败')
      this.setData({ hasMore: false })
    }
  }
})

Page(pointsPage) 
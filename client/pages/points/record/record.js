import { getExchangeRecords } from '../../../api/points'
import { formatTime } from '../../../utils/util'

Page({
  data: {
    recordList: [],
    loading: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    showDetail: false,
    currentRecord: null
  },

  onLoad() {
    this.loadRecordList()
  },

  // 加载兑换记录
  async loadRecordList(isLoadMore = false) {
    if (this.data.loading) return

    try {
      this.setData({ loading: true })
      
      const { page, pageSize, recordList } = this.data
      const currentPage = isLoadMore ? page : 1
      
      const res = await getExchangeRecords({
        page: currentPage,
        pageSize
      })

      if (res.success && res.data) {
        const { list = [], total = 0 } = res.data
        
        // 格式化数据，处理时间显示
        const formattedList = list.map(item => {
          // 处理创建时间 - 特殊处理Z结尾的时间格式
          let createdAtDisplay = ''
          if (item.createdAt.endsWith('Z')) {
            // 去掉Z后缀，当作本地时间处理（因为数据库存储的就是本地时间）
            const timeWithoutZ = item.createdAt.slice(0, -1)
            createdAtDisplay = formatTime(new Date(timeWithoutZ))
          } else {
            createdAtDisplay = formatTime(new Date(item.createdAt))
          }

          // 处理核销时间
          let redeemedAtDisplay = ''
          if (item.redeemedAt) {
            if (item.redeemedAt.endsWith('Z')) {
              // 去掉Z后缀，当作本地时间处理
              const timeWithoutZ = item.redeemedAt.slice(0, -1)
              redeemedAtDisplay = formatTime(new Date(timeWithoutZ))
            } else {
              redeemedAtDisplay = formatTime(new Date(item.redeemedAt))
            }
          }

          return {
            ...item,
            createdAt: createdAtDisplay,
            redeemedAt: redeemedAtDisplay
          }
        })
        
        const newList = isLoadMore ? [...recordList, ...formattedList] : formattedList
        const newPage = isLoadMore ? page + 1 : 2
        
        this.setData({
          recordList: newList,
          page: newPage,
          hasMore: newList.length < total && formattedList.length === pageSize
        })
      } else {
        // 处理返回数据异常的情况
        console.warn('兑换记录数据格式异常:', res)
        this.setData({
          recordList: isLoadMore ? recordList : [],
          hasMore: false
        })
      }
    } catch (error) {
      console.error('加载兑换记录失败:', error)
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      
      // 发生错误时重置hasMore，避免无限重试
      this.setData({
        hasMore: false
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 显示记录详情
  showRecordDetail(e) {
    const { id } = e.currentTarget.dataset
    const record = this.data.recordList.find(item => item.id === id)
    
    if (record) {
      this.setData({
        showDetail: true,
        currentRecord: record
      })
    }
  },

  // 隐藏记录详情
  hideRecordDetail() {
    this.setData({
      showDetail: false
    })
  },

  // 取消兑换
  cancelExchange() {
    const { currentRecord } = this.data

    wx.showModal({
      title: '确认取消',
      content: '确定要取消该兑换记录吗？',
      success: res => {
        if (res.confirm) {
          // TODO: 调用取消兑换API
          wx.showLoading({ title: '取消中' })

          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({
              title: '取消成功',
              icon: 'success'
            })

            // 更新记录列表
            const recordList = this.data.recordList.map(item => {
              if (item.id === currentRecord.id) {
                return {
                  ...item,
                  status: 'failed',
                  statusText: '已取消'
                }
              }
              return item
            })

            this.setData({
              recordList,
              showDetail: false
            })
          }, 1500)
        }
      }
    })
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecordList(true)
    }
  },

  // 阻止弹窗背景滚动
  preventTouchMove() {
    return false
  },

  // 阻止事件冒泡
  stopPropagation() {
    return false
  },



  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      recordList: []
    })
    this.loadRecordList(false)
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadRecordList(true)
    }
  },

  // 隐藏详情
  hideDetail() {
    this.setData({
      showDetail: false,
      currentRecord: null
    })
  },

  // 加载更多记录 - 移除重复方法
  loadMoreRecords() {
    this.loadMore()
  }
})
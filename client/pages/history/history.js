import { deleteHistory, getHotQuestions, getChatHistory } from '../../api/chat'
import { safeFormatTime } from '../../utils/util'
import { createPaginationPage, withRobot } from '../../utils/page-helper'

const historyPage = createPaginationPage(withRobot({
  data: {
    historyList: [],
    hotQuestions: [],
    robotName: '',
    dateRanges: ['全部', '本周', '本月', '今年'],
    dateRangeIndex: 0,
  },

  onLoad() {
    this.refreshData()
  },

  onShow() {
    this.refreshData()
  },

  /**
   * 刷新页面数据
   */
  async refreshData() {
    try {
      await Promise.all([
        this.loadHistoryList(true),
        this.loadHotQuestions()
      ])
    } catch (error) {
      this.handleError(error, '刷新数据失败')
    }
  },

  /**
   * 加载历史记录列表
   */
  async loadHistoryList(refresh = false) {
    try {
      const robotId = this.getRobotId()
      if (!robotId) {
        this.handleError(new Error('请先选择机器人'), '无法加载历史记录')
        return
      }

      this.setData({ robotName: robotId })

      const result = await this.loadMore(
        async (page, pageSize) => {
          const res = await getChatHistory(robotId, { page, pageSize })
          
          if (!res || !res.data) {
            throw new Error('服务器返回数据格式错误')
          }

          const chats = res.data.chats || []
          const formattedList = chats
            .filter(item => item) // 过滤空项
            .map(item => ({
              ...item,
              time: safeFormatTime(item.time)
            }))

          return {
            list: formattedList,
            total: res.data.total || formattedList.length
          }
        },
        refresh
      )

      if (result) {
        this.setData({ historyList: this.data.list })
      }
    } catch (error) {
      this.handleError(error, '加载历史记录失败')
      this.setData({ historyList: [] })
    }
  },

  /**
   * 获取机器人ID
   */
  getRobotId() {
    const app = getApp()
    
    if (this.data.robot && this.data.robot.id) {
      return this.data.robot.id
    }
    
    if (app.globalData.selectedRobot && app.globalData.selectedRobot.id) {
      return app.globalData.selectedRobot.id
    }
    
    const storedRobot = wx.getStorageSync('selectedRobot')
    if (storedRobot && storedRobot.id) {
      return storedRobot.id
    }
    
    return null
  },

  /**
   * 加载热门问题
   */
  async loadHotQuestions() {
    try {
      const res = await getHotQuestions()
      if (res && res.success && res.data && res.data.questions) {
        this.setData({
          hotQuestions: res.data.questions.slice(0, 5)
        })
      } else {
        this.setData({ hotQuestions: [] })
      }
    } catch (error) {
      this.setData({ hotQuestions: [] })
    }
  },

  /**
   * 删除历史记录
   */
  async handleDelete(e) {
    const { history } = e.currentTarget.dataset
    if (!history) return

    try {
      await wx.showModal({
        title: '确认删除',
        content: '确定要删除这条历史记录吗？',
        confirmText: '删除'
      })

      await deleteHistory(history.id)

      const historyList = this.data.historyList.filter(
        item => item.id !== history.id
      )

      this.setData({ historyList })

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } catch (error) {
      if (error.errMsg !== 'showModal:cancel') {
        this.handleError(error, '删除失败')
      }
    }
  },

  /**
   * 查看详情
   */
  handleViewDetail(e) {
    const { history } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/history/detail/detail?id=${history.id}`
    })
  },

  /**
   * 搜索处理
   */
  handleSearch(e) {
    const { value } = e.detail
    this.setData({ keyword: value }, () => {
      this.loadHistoryList(true)
    })
  },

  /**
   * 日期范围变化
   */
  onDateRangeChange(e) {
    const dateRangeIndex = Number(e.detail.value)
    this.setData({ dateRangeIndex }, () => {
      this.loadHistoryList(true)
    })
  }
}))

Page(historyPage) 
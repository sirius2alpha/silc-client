import { deleteHistory, getHotQuestions, getChatHistory } from '../../api/chat'
import { formatTime } from '../../utils/util'

Page({
  data: {
    historyList: [],
    hotQuestions: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: false,
    robotName: '',
  },

  onLoad() {
    this.loadHistoryList()
    this.getHotQuestions()
  },

  // 加载历史记录列表
  async loadHistoryList(refresh = false) {
    if (this.data.loading) return

    const { page, pageSize, historyList } = this.data

    if (refresh) {  
      this.setData({
        page: 1,
        historyList: [],
      })
    }

    this.setData({ loading: true })

    try {
      // 获取机器人ID，从多个可能的来源获取
      const app = getApp()
      let robotId = null

      // 尝试从页面数据获取
      if (this.data.robot?.id) {
        robotId = this.data.robot.id
      }
      // 尝试从全局数据获取
      else if (app.globalData.selectedRobot?.id) {
        robotId = app.globalData.selectedRobot.id
      }
      // 尝试从本地存储获取
      else {
        const storedRobot = wx.getStorageSync('selectedRobot')
        if (storedRobot?.id) {
          robotId = storedRobot.id
        }
      }
      this.setData({ robotName: robotId })
      
      // 添加分页参数
      const res = await getChatHistory(robotId, {
        page: refresh ? 1 : page,
        pageSize
      })
      
      const formattedList = res.data?.chats?.map(item => {
        return {
          ...item,
          time: formatTime(new Date(item.time))
        };
      }) || []

      // 修改hasMore的判断逻辑
      const hasMore = formattedList.length === pageSize

      this.setData({
        historyList: refresh ? formattedList : [...historyList, ...formattedList],
        hasMore,
        page: refresh ? 2 : page + 1,
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 搜索
  handleSearch(e) {
    const { value } = e.detail
    this.setData({ keyword: value }, () => {
      this.loadHistoryList(true)
    })
  },

  // 删除历史记录
  async handleDelete() {
    const { currentHistory } = this.data
    if (!currentHistory) return

    try {
      await deleteHistory(currentHistory.id)

      // 更新列表
      const historyList = this.data.historyList.filter(
        item => item.id !== currentHistory.id
      )

      this.setData({ historyList })

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      })
    } finally {
      this.handleHideAction()
    }
  },

  // 查看详情
  handleViewDetail(e) {
    const { history } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/history/detail/detail?id=${history.id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHistoryList(true)
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore) {
      this.loadHistoryList()
    }
  },

  // 获取热门问题
  async getHotQuestions() {
    try {
      const res = await getHotQuestions()
      if (res.success) {
        this.setData({
          hotQuestions: res.data.questions.slice(0, 5)
        })
      }
    } catch (error) {
      console.error('获取热门问题失败:', error)
      wx.showToast({
        title: '获取热门问题失败',
        icon: 'none'
      })
    }
  },
}) 
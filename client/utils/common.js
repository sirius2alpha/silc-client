// 通用工具模块
import { getUserInfo } from '../api/user'

/**
 * 页面基础混入对象
 */
export const PageMixin = {
  data: {
    loading: false,
    dataLoaded: false,
    lastLoadTime: 0,
    cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('accessToken')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return false
    }
    return true
  },

  /**
   * 安全的loading状态管理
   */
  setLoading(loading, title = '加载中...', callback) {
    // 如果是函数类型的title参数，说明是callback
    if (typeof title === 'function') {
      callback = title
      title = '加载中...'
    }
    
    this.setData({ loading }, callback)
    
    if (loading) {
      wx.showLoading({ title })
    } else {
      wx.hideLoading()
    }
  },

  /**
   * 标准错误处理
   */
  handleError(error, defaultMessage = '操作失败') {
    console.error(error)
    const message = error.message || defaultMessage
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },

  /**
   * 数据缓存检查
   */
  shouldRefreshData() {
    const now = Date.now()
    return !this.data.dataLoaded || (now - this.data.lastLoadTime) > this.data.cacheTimeout
  },

  /**
   * 更新缓存时间
   */
  updateCacheTime() {
    this.setData({
      dataLoaded: true,
      lastLoadTime: Date.now()
    })
  }
}

/**
 * 分页加载混入对象
 */
export const PaginationMixin = {
  data: {
    page: 1,
    pageSize: 20,
    hasMore: true,
    list: []
  },

  /**
   * 重置分页状态
   */
  resetPagination() {
    this.setData({
      page: 1,
      hasMore: true,
      list: []
    })
  },

  /**
   * 加载更多数据
   */
  async loadMore(loadFunction, refresh = false) {
    if (this.data.loading) return
    if (!refresh && !this.data.hasMore) return

    if (refresh) {
      this.resetPagination()
    }

    this.setData({ loading: true })

    try {
      const { page, pageSize, list } = this.data
      const result = await loadFunction(page, pageSize)
      
      const newList = refresh ? result.list : [...list, ...result.list]
      
      this.setData({
        list: newList,
        page: page + 1,
        hasMore: result.list.length === pageSize
      })

      return result
    } catch (error) {
      this.handleError(error, '加载数据失败')
      this.setData({ hasMore: false })
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  }
}

/**
 * 用户信息管理器
 */
export const UserInfoManager = {
  /**
   * 获取用户信息（优先从缓存）
   */
  async getUserInfo(forceRefresh = false) {
    if (!forceRefresh) {
      const cachedInfo = this.getCachedUserInfo()
      if (cachedInfo) return cachedInfo
    }

    try {
      const res = await getUserInfo()
      const userInfo = res.data?.user || res.data || res
      this.updateUserInfo(userInfo)
      return userInfo
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return this.getCachedUserInfo() || { nickname: '我' }
    }
  },

  /**
   * 加载用户信息（兼容性别名）
   */
  async loadUserInfo(forceRefresh = false) {
    return this.getUserInfo(forceRefresh)
  },

  /**
   * 获取缓存的用户信息
   */
  getCachedUserInfo() {
    const app = getApp()
    return app.globalData.userInfo || wx.getStorageSync('userInfo')
  },

  /**
   * 更新用户信息（仅用于页面内部调用，不触发全局事件）
   */
  updateUserInfo(userInfo) {
    console.log('UserInfoManager 更新用户信息:', userInfo)
    
    const app = getApp()
    if (app.globalData) {
      app.globalData.userInfo = userInfo
    }
    wx.setStorageSync('userInfo', userInfo)
    
    // 如果有用户ID，也要更新存储
    if (userInfo.id) {
      wx.setStorageSync('userId', userInfo.id)
    }
  },

  /**
   * 响应用户信息更新事件
   */
  onUserInfoUpdate(callback) {
    return function(updatedUserInfo) {
      if (typeof callback === 'function') {
        callback.call(this, updatedUserInfo)
      }
    }
  }
}

/**
 * 机器人信息管理器
 */
export const RobotManager = {
  /**
   * 获取当前选中的机器人
   */
  getSelectedRobot() {
    const app = getApp()
    let robot = app.globalData.selectedRobot || wx.getStorageSync('selectedRobot')
    
    if (!robot || !robot.id) {
      const userInfo = this.getCachedUserInfo()
      if (userInfo?.selectedRobot) {
        robot = app.findRobotInfo(userInfo.selectedRobot)
        if (robot) {
          this.updateSelectedRobot(robot)
        }
      }
    }
    
    return robot
  },

  /**
   * 更新选中的机器人
   */
  updateSelectedRobot(robot) {
    const app = getApp()
    if (app.globalData) {
      app.globalData.selectedRobot = robot
    }
    wx.setStorageSync('selectedRobot', robot)
  },

  /**
   * 检查机器人选择状态
   */
  checkRobotSelection() {
    const robot = this.getSelectedRobot()
    if (!robot || !robot.id) {
      wx.showModal({
        title: '提示',
        content: '请先选择AI助手',
        showCancel: false,
        success: () => {
          wx.reLaunch({
            url: '/pages/robot-select/robot-select'
          })
        }
      })
      return false
    }
    return true
  }
}

/**
 * 通用页面方法
 */
export const CommonMethods = {
  /**
   * 下拉刷新处理
   */
  onPullDownRefresh() {
    if (typeof this.refreshData === 'function') {
      this.refreshData().finally(() => {
        wx.stopPullDownRefresh()
      })
    } else {
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 上拉加载更多处理
   */
  onReachBottom() {
    if (typeof this.loadMoreData === 'function' && this.data.hasMore) {
      this.loadMoreData()
    }
  }
} 
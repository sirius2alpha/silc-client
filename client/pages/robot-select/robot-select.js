import { createPage, withUserInfo } from '../../utils/page-helper'
const api = require('../../api/index')
const { Toast } = require('../../utils/toast')

const robotSelectPage = createPage(withUserInfo({
  data: {
    hasUserInfo: false,
    isHasLogin: false,
    robots: [],
    selectedRobot: null,
    currentRobotId: '',
    currentRobotIndex: 0,
    audioContext: null,
  },

  async onLoad() {
    this.createAudioContext()
    await this.initPage()
  },

  onUnload() {
    this.destroyAudioContext()
  },

  /**
   * 创建音频上下文
   */
  createAudioContext() {
    const audioContext = wx.createInnerAudioContext()
    this.setData({ audioContext })
  },

  /**
   * 销毁音频上下文
   */
  destroyAudioContext() {
    if (this.data.audioContext) {
      this.data.audioContext.destroy()
    }
  },

  /**
   * 初始化页面
   */
  async initPage() {
    try {
      const token = wx.getStorageSync('accessToken')

      if (token) {
        this.setData({ isHasLogin: true })
        await this.loadUserInfo()
      }

      await this.loadRobots()

      // 播放第一个机器人的音频
      if (this.data.robots.length > 0) {
        this.playRobotAudio(this.data.robots[0])
      }
    } catch (error) {
      this.handleError(error, '页面加载失败，请重试')
    }
  },

  /**
   * 获取用户信息
   */
  async loadUserInfo() {
    try {
      const res = await api.user.getUserInfo()

      if (res && res.data) {
        const userData = res.data.user
        
        this.setData({ hasUserInfo: true })
        wx.setStorageSync('userInfo', userData)

        // 检查用户是否已绑定机器人
        if (userData.selectedRobot) {
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/chat/chat'
            })
          }, 500)
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  /**
   * 加载机器人列表
   */
  async loadRobots() {
    this.setLoading(true, '加载中...')
    
    try {
      const res = await api.robot.getRobotList()

      if (res && res.data && res.data.robots.length > 0) {
        const robotsWithPersonality = res.data.robots.map(robot => {
          const isMale = robot.id === 'xiwen'
          let videoUrl = ''

          if (robot.id === 'xiwen') {
            videoUrl = 'https://silcai-1355235059.cos.ap-shanghai.myqcloud.com/xiwen_video.mp4'
          } else if (robot.id === 'xihui') {
            videoUrl = 'https://silcai-1355235059.cos.ap-shanghai.myqcloud.com/xihui_video.mp4'
          }

          return {
            ...robot,
            personality: isMale ? 'male' : 'female',
            greeting: isMale 
              ? '你好，我是悉文，很高兴认识你！我可以为你解答专业问题。' 
              : '嗨，我是悉荟，很开心能帮到你！有任何问题都可以问我哦~',
            videoUrl: videoUrl
          }
        })

        this.setData({
          robots: robotsWithPersonality,
          selectedRobot: robotsWithPersonality[0],
          currentRobotId: robotsWithPersonality[0].id,
          currentRobotIndex: 0
        })
      } else {
        this.handleError(new Error('机器人列表为空'), '获取机器人列表失败')
      }
    } catch (error) {
      this.handleError(error, '获取机器人列表失败')
    } finally {
      this.setLoading(false)
    }
  },

  /**
   * 视频播放错误处理
   */
  onVideoError(e) {
    wx.showToast({
      title: `视频错误: ${e.detail.errMsg}`,
      icon: 'none',
      duration: 3000
    })
  },

  /**
   * 视频开始播放
   */
  onVideoPlay() {
    wx.showToast({
      title: '视频开始播放！',
      icon: 'success',
      duration: 1500
    })
  },

  /**
   * 轮播图变化
   */
  onSwiperChange(e) {
    const { current } = e.detail
    const robot = this.data.robots[current]

    if (robot) {
      this.setData({
        currentRobotIndex: current,
        currentRobotId: robot.id,
        selectedRobot: robot
      })

      this.playRobotAudio(robot)
    }
  },

  /**
   * 切换机器人
   */
  switchRobot(e) {
    const index = e.currentTarget.dataset.index
    const robot = this.data.robots[index]

    if (robot) {
      this.setData({
        currentRobotIndex: index,
        currentRobotId: robot.id,
        selectedRobot: robot
      })

      this.playRobotAudio(robot)
    }
  },

  /**
   * 播放机器人音频
   */
  playRobotAudio(robot) {
    if (!this.data.audioContext) return

    this.data.audioContext.stop()

    this.data.audioContext.src = robot.personality === 'male'
      ? '/assets/xiwen.mp3'
      : '/assets/xihui.mp3'

    this.data.audioContext.play()
  },

  /**
   * 选择机器人
   */
  handleSelect(e) {
    const robot = e.currentTarget.dataset.robot
    if (robot) {
      this.setData({
        selectedRobot: robot,
        currentRobotId: robot.id,
        currentRobotIndex: this.data.robots.findIndex(r => r.id === robot.id)
      })
    }
  },

  /**
   * 绑定机器人
   */
  async handleBind() {
    if (!this.data.selectedRobot) {
      Toast.fail('请先选择一个机器人')
      return
    }

    // 未登录，需要先登录
    if (!this.data.isHasLogin) {
      wx.navigateTo({
        url: '/pages/login/login',
        events: {
          loginSuccess: () => {
            this.setData({ isHasLogin: true })
            this.handleBind()
          }
        }
      })
      return
    }

    this.setLoading(true, '绑定中...')

    try {
      const robotId = this.data.selectedRobot.id
      const res = await api.user.selectRobot(robotId)

      // 更新本地存储的机器人和用户信息
      const app = getApp()
      app.globalData.selectedRobot = this.data.selectedRobot
      wx.setStorageSync('selectedRobot', this.data.selectedRobot)

      let userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        userInfo.selectedRobot = robotId
        wx.setStorageSync('userInfo', userInfo)
      }

      Toast.success('选择成功')

      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/chat/chat'
        })
      }, 1000)
    } catch (error) {
      this.handleError(error, '选择失败')
    } finally {
      this.setLoading(false)
    }
  }
}))

Page(robotSelectPage) 
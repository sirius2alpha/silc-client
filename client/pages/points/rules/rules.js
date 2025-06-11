import { getPointsRules } from '../../../api/points'

Page({
  data: {
    rules: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        title: '每日聊天',
        description: '每天与机器人聊天可获得1积分',
        points: 1
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: '反馈问题',
        description: '反馈有效问题可获得2积分',
        points: 2
      }
    ],
    loading: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '积分规则'
    })
  },
}) 
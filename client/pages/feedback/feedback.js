import { postFeedback } from '../../api/feedback'
import { createPage } from '../../utils/page-helper'

const feedbackPage = createPage({
  data: {
    feedbackContent: '',
    contactInfo: '',
    wordCount: 0,
    typeArray: ['功能建议', '问题反馈', '其他'],
    typeIndex: 0
  },

  /**
   * 反馈内容输入
   */
  onInput(e) {
    const value = e.detail.value
    this.setData({
      feedbackContent: value,
      wordCount: value.length
    })
  },

  /**
   * 联系方式输入
   */
  onContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    })
  },

  /**
   * 反馈类型选择
   */
  onTypeChange(e) {
    this.setData({
      typeIndex: e.detail.value
    })
  },

  /**
   * 提交反馈
   */
  async submitFeedback() {
    const { feedbackContent, contactInfo, typeArray, typeIndex } = this.data
    
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      })
      return
    }

    this.setLoading(true)

    try {
      const res = await postFeedback({
        content: feedbackContent,
        contact_info: contactInfo,
        type: typeArray[typeIndex]
      })

      if (res.success) {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        })
        
        // 重置表单
        this.setData({
          feedbackContent: '',
          contactInfo: '',
          wordCount: 0,
          typeIndex: 0
        })
      } else {
        this.handleError(new Error(res.message), '提交失败')
      }
    } catch (error) {
      this.handleError(error, '网络错误')
    } finally {
      this.setLoading(false)
    }
  }
})

Page(feedbackPage)

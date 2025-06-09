import { postFeedback } from '../../api/feedback'

Page({
  data: {
    feedbackContent: '',
    contactInfo: '',
    wordCount: 0,
    typeArray: ['功能建议', '问题反馈', '其他'],
    typeIndex: 0
  },

  onInput(e) {
    const value = e.detail.value;
    this.setData({
      feedbackContent: value,
      wordCount: value.length
    });
  },

  onContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    });
  },

  onTypeChange(e) {
    this.setData({
      typeIndex: e.detail.value
    });
  },

  async submitFeedback() {
    const { feedbackContent, contactInfo, typeArray, typeIndex } = this.data;
    
    if (!feedbackContent.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await postFeedback({
        content: feedbackContent,
        contact_info: contactInfo,
        type: typeArray[typeIndex]
      });

      if (res.success) {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        this.setData({
          feedbackContent: '',
          contactInfo: '',
          wordCount: 0,
          typeIndex: 0
        });
      } else {
        wx.showToast({
          title: res.message || '提交失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  }
});

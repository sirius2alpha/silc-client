Component({
  properties: {
    message: {
      type: Object,
      value: {}
    },
    isSelf: {
      type: Boolean,
      value: false
    }
  },

  data: {
    showEvaluation: false
  },

  methods: {
    // 显示评价面板
    handleShowEvaluation() {
      this.setData({ showEvaluation: true })
    },

    // 提交评价
    handleEvaluate(e) {
      const { score } = e.currentTarget.dataset
      this.triggerEvent('evaluate', {
        messageId: this.properties.message.id,
        score
      })
      this.setData({ showEvaluation: false })
    }
  }
}) 
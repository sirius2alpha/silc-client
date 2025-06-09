/**
 * 微信小程序Toast提示工具类
 */
const Toast = {
  /**
   * 显示加载提示
   * @param {string} title 提示内容
   * @param {boolean} mask 是否显示透明蒙层
   */
  showLoading: (title = '加载中...', mask = true) => {
    wx.showLoading({
      title,
      mask
    });
  },

  /**
   * 隐藏加载提示
   */
  hideLoading: () => {
    wx.hideLoading();
  },

  /**
   * 显示成功提示
   * @param {string} title 提示内容
   * @param {number} duration 显示时长(ms)
   */
  success: (title, duration = 1500) => {
    wx.showToast({
      title,
      icon: 'success',
      duration
    });
  },

  /**
   * 显示失败提示
   * @param {string} title 提示内容
   * @param {number} duration 显示时长(ms)
   */
  fail: (title, duration = 1500) => {
    wx.showToast({
      title,
      icon: 'error',
      duration
    });
  },

  /**
   * 显示普通提示
   * @param {string} title 提示内容
   * @param {number} duration 显示时长(ms)
   */
  info: (title, duration = 1500) => {
    wx.showToast({
      title,
      icon: 'none',
      duration
    });
  },

  /**
   * 显示确认模态框
   * @param {string} title 标题
   * @param {string} content 内容
   * @param {boolean} showCancel 是否显示取消按钮
   * @returns {Promise} 返回Promise对象
   */
  confirm: (title, content, showCancel = true) => {
    return new Promise((resolve, reject) => {
      wx.showModal({
        title,
        content,
        showCancel,
        success: (res) => {
          if (res.confirm) {
            resolve(true);
          } else if (res.cancel) {
            resolve(false);
          }
        },
        fail: reject
      });
    });
  }
};

module.exports = {
  Toast
}; 
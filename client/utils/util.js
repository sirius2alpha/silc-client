/**
 * 通用工具函数
 */

// 格式化时间
const formatTime = date => {
  // 确保传入的是有效的 Date 对象
  if (!(date instanceof Date) || isNaN(date)) {
    console.error('Invalid date:', date);
    return '无效时间';
  }
  
  // 获取本地时间
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  // 使用中文格式
  return `${year}年${formatNumber(month)}月${formatNumber(day)}日 ${formatNumber(hour)}:${formatNumber(minute)}`;
};

// 格式化UTC时间为本地时间显示（避免时区问题）
const formatUTCTime = dateString => {
  // 如果传入的是字符串，先转换为Date对象
  let date;
  if (typeof dateString === 'string') {
    date = new Date(dateString);
  } else if (dateString instanceof Date) {
    date = dateString;
  } else {
    console.error('Invalid date:', dateString);
    return '无效时间';
  }
  
  // 检查是否为有效日期
  if (isNaN(date)) {
    console.error('Invalid date:', dateString);
    return '无效时间';
  }
  
  // 获取本地时间（Date对象自动处理时区转换）
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  // 使用中文格式
  return `${year}年${formatNumber(month)}月${formatNumber(day)}日 ${formatNumber(hour)}:${formatNumber(minute)}`;
};

// 格式化数字
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

// 防抖函数
const debounce = (func, wait = 500) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
};

// 节流函数
const throttle = (func, wait = 500) => {
  let previous = 0;
  return function (...args) {
    let now = Date.now();
    if (now - previous > wait) {
      func.apply(this, args);
      previous = now;
    }
  };
};

// 深拷贝
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
};

// 检查网络状态
const checkNetwork = () => {
  return new Promise((resolve, reject) => {
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          reject(new Error('无网络连接'));
        } else {
          resolve(res.networkType);
        }
      },
      fail: reject
    });
  });
};

// 显示加载提示
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  });
};

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading();
};

// 显示提示信息
const showToast = (title, icon = 'none') => {
  wx.showToast({
    title,
    icon,
    duration: 2000
  });
};

// 显示模态对话框
const showModal = (title, content, confirmText = '确定', cancelText = '取消') => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        if (res.confirm) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: reject
    });
  });
};

// 页面跳转
const navigateTo = (url) => {
  return new Promise((resolve, reject) => {
    wx.navigateTo({
      url,
      success: resolve,
      fail: reject
    });
  });
};

// 重定向页面
const redirectTo = (url) => {
  return new Promise((resolve, reject) => {
    wx.redirectTo({
      url,
      success: resolve,
      fail: reject
    });
  });
};

// 返回上一页
const navigateBack = (delta = 1) => {
  return new Promise((resolve, reject) => {
    wx.navigateBack({
      delta,
      success: resolve,
      fail: reject
    });
  });
};

// 切换Tab
const switchTab = (url) => {
  return new Promise((resolve, reject) => {
    wx.switchTab({
      url,
      success: resolve,
      fail: reject
    });
  });
};

// 重新启动应用
const reLaunch = (url) => {
  return new Promise((resolve, reject) => {
    wx.reLaunch({
      url,
      success: resolve,
      fail: reject
    });
  });
};

module.exports = {
  formatTime,
  formatUTCTime,
  formatNumber,
  debounce,
  throttle,
  deepClone,
  checkNetwork,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  navigateTo,
  redirectTo,
  navigateBack,
  switchTab,
  reLaunch
}; 
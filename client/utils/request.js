const config = require('../config.js')
const BASE_URL = config.BASE_URL

// 自定义参数序列化函数，替代URLSearchParams
function serializeParams(params) {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

const request = {
  get: (url, data) => {
    return new Promise((resolve, reject) => {
      console.log(`发起GET请求: ${BASE_URL}${url}`, data || '无参数');
      wx.request({
        url: `${BASE_URL}${url}`,
        method: 'GET',
        data,
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('accessToken')}`
        },
        success: (res) => {
          console.log(`GET请求成功: ${url}`, res);
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            console.error(`GET请求失败: ${url}`, res.statusCode, res.data);
            
            // 更友好地处理错误
            let errorMessage = '请求失败';
            
            // 尝试从响应中提取错误信息
            if (res.data) {
              if (typeof res.data === 'string') {
                errorMessage = res.data;
              } else if (res.data.error) {
                errorMessage = res.data.error;
              } else if (res.data.message) {
                errorMessage = res.data.message;
              } else if (res.data.status && res.data.status.message) {
                errorMessage = res.data.status.message;
              }
            }
            
            // 创建带有statusCode、url和message的错误对象
            const error = new Error(errorMessage);
            error.statusCode = res.statusCode;
            error.url = url;
            error.response = res.data;
            
            reject(error);
          }
        },
        fail: (err) => {
          console.error(`GET请求错误: ${url}`, err);
          
          // 创建网络错误
          const error = new Error(err.errMsg || '网络请求失败');
          error.original = err;
          error.url = url;
          
          reject(error);
        }
      });
    });
  },

  post: (url, data) => {
    return new Promise((resolve, reject) => {
      console.log(`发起POST请求: ${BASE_URL}${url}`, data);
      
      wx.request({
        url: `${BASE_URL}${url}`,
        method: 'POST',
        data,
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('accessToken')}`,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          console.log(`POST请求响应: ${url}`, res.statusCode, res.data);
          
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            console.error(`POST请求失败: ${url}`, res.statusCode, res.data);
            const errorMsg = res.data && (res.data.message || res.data.error) ? 
              (res.data.message || res.data.error) : 
              `请求失败 (${res.statusCode})`;
            
            reject(new Error(errorMsg));
          }
        },
        fail: (err) => {
          console.error(`POST请求错误: ${url}`, err);
          reject(err);
        }
      });
    });
  },

  put: (url, data) => {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${BASE_URL}${url}`,
        method: 'PUT',
        data,
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('accessToken')}`
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.error || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  delete: (url, data) => {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${BASE_URL}${url}`,
        method: 'DELETE',
        data,
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('accessToken')}`
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.error || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
};

module.exports = request; 
// pages/info/info.js
import { getUserInfo, updateUserInfo } from '../../api/user'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    editMode: false,
    formData: {
      nickname: '',
      avatar: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserData();
  },

  /**
   * 获取用户信息
   */
  async getUserData() {
    try {
      wx.showLoading({
        title: '加载中...'
      });
      
      const res = await getUserInfo();
      
      if (res.success === false || res.code === 401) {
        wx.hideLoading();
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none'
        });
        return;
      }
      
      // 处理不同的响应格式，与profile页面保持一致
      let userData = res.data?.user || res.data || res;
      
      this.setData({
        userInfo: userData,
        formData: {
          nickname: userData.nickname || userData.username || '',
          avatar: userData.avatar || userData.avatarUrl || ''
        }
      });
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('获取用户信息失败:', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.setData({
      editMode: !this.data.editMode
    });
  },

  /**
   * 表单输入事件
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  /**
   * 选择头像
   */
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 这里应该上传头像图片到服务器，获取URL
        // 暂时直接使用本地路径
        this.setData({
          'formData.avatar': tempFilePath
        });
      }
    });
  },

  /**
   * 保存用户信息
   */
  async saveUserInfo() {
    try {
      const { formData } = this.data;
      
      // 表单验证
      if (!formData.nickname.trim()) {
        wx.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }
      
      wx.showLoading({
        title: '保存中...'
      });
      
      const res = await updateUserInfo({
        nickname: formData.nickname,
        avatar: formData.avatar
      });
      
      wx.hideLoading();
      
      if (res.success === false) {
        wx.showToast({
          title: res.error || '保存失败',
          icon: 'none'
        });
        return;
      }
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 更新本地数据并退出编辑模式
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          nickname: formData.nickname,
          avatar: formData.avatar
        },
        editMode: false
      });
    } catch (error) {
      wx.hideLoading();
      console.error('保存用户信息失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getUserData();
    wx.stopPullDownRefresh();
  }
}); 
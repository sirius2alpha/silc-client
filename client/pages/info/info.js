// pages/info/info.js
import { getUserInfo, updateUserInfo } from '../../api/user'
import request from '../../utils/request'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    editMode: false,
    formData: {
      nickname: '',
      avatar: '',
      bgpic: ''
    },
    // 临时存储待上传的文件
    pendingFiles: {
      avatar: null,
      bgpic: null
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
          avatar: userData.avatar || userData.avatarUrl || '',
          bgpic: userData.bgpic || ''
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
    if (this.data.editMode) {
      // 退出编辑模式时，恢复原始数据并清理暂存文件
      this.setData({
        formData: {
          nickname: this.data.userInfo.nickname || this.data.userInfo.username || '',
          avatar: this.data.userInfo.avatar || this.data.userInfo.avatarUrl || '',
          bgpic: this.data.userInfo.bgpic || ''
        },
        pendingFiles: {
          avatar: null,
          bgpic: null
        },
        editMode: false
      });
    } else {
      this.setData({
        editMode: true
      });
    }
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
    this.chooseAndUploadFile('avatar');
  },

  /**
   * 选择背景图
   */
  chooseBgpic() {
    this.chooseAndUploadFile('bgpic');
  },

  /**
   * 清空头像
   */
  clearAvatar() {
    wx.showModal({
      title: '确认',
      content: '确定要清空头像吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'formData.avatar': '',
            'pendingFiles.avatar': { action: 'clear' }
          });
          wx.showToast({
            title: '头像已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 清空背景图
   */
  clearBgpic() {
    wx.showModal({
      title: '确认',
      content: '确定要清空聊天背景吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'formData.bgpic': '',
            'pendingFiles.bgpic': { action: 'clear' }
          });
          wx.showToast({
            title: '背景图已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 选择文件并暂存
   */
  async chooseAndUploadFile(fileType) {
    try {
      // 选择图片
      const chooseRes = await this.chooseImage();
      const tempFilePath = chooseRes.tempFilePaths[0];

      wx.showLoading({
        title: '处理中...'
      });

      // 读取文件内容为base64
      const fileData = await this.readFileAsBase64(tempFilePath);

      // 暂存文件数据，不立即上传
              this.setData({
          [`pendingFiles.${fileType}`]: {
            fileData: fileData,
            filename: this.getFilenameFromPath(tempFilePath),
            tempPath: tempFilePath
          },
          [`formData.${fileType}`]: tempFilePath // 临时显示本地路径
        });
        
        console.log(`${fileType}文件已暂存:`, tempFilePath);

      wx.hideLoading();
      wx.showToast({
        title: '图片已选择',
        icon: 'success'
      });

    } catch (error) {
      wx.hideLoading();
      console.error('选择文件失败:', error);
      wx.showToast({
        title: error.message || '选择失败',
        icon: 'none'
      });
    }
  },

  /**
   * 选择图片
   */
  chooseImage() {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      });
    });
  },

  /**
   * 读取文件为base64格式
   */
  readFileAsBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data);
        },
        fail: reject
      });
    });
  },

  /**
   * 从文件路径提取文件名
   */
  getFilenameFromPath(filePath) {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'upload.jpg';
  },

  /**
   * 保存用户信息
   */
  async saveUserInfo() {
    try {
      const { formData, pendingFiles } = this.data;
      
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

      let finalFormData = {
        nickname: formData.nickname,
        avatar: formData.avatar,
        bgpic: formData.bgpic
      };

      // 处理需要上传的文件
      for (const fileType of ['avatar', 'bgpic']) {
        const pendingFile = pendingFiles[fileType];
        if (pendingFile) {
          if (pendingFile.action === 'clear') {
            // 清空操作
            finalFormData[fileType] = '';
          } else if (pendingFile.fileData) {
            // 上传新文件
            try {
              const uploadRes = await request.post('/api/user/upload', {
                file_type: fileType,
                file_data: pendingFile.fileData,
                filename: pendingFile.filename
              });

              if (!uploadRes.success) {
                throw new Error(uploadRes.message || '上传失败');
              }

              finalFormData[fileType] = uploadRes.data.accessUrl;
            } catch (uploadError) {
              wx.hideLoading();
              wx.showToast({
                title: `${fileType === 'avatar' ? '头像' : '背景图'}上传失败`,
                icon: 'none'
              });
              return;
            }
          }
        }
      }
      
      const res = await updateUserInfo(finalFormData);
      
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
      
      console.log('保存成功，更新本地数据:', finalFormData);
      
      // 更新本地数据并退出编辑模式
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          nickname: finalFormData.nickname,
          avatar: finalFormData.avatar,
          bgpic: finalFormData.bgpic
        },
        formData: {
          nickname: finalFormData.nickname,
          avatar: finalFormData.avatar,
          bgpic: finalFormData.bgpic
        },
        pendingFiles: {
          avatar: null,
          bgpic: null
        },
        editMode: false
      }, () => {
        console.log('页面数据更新完成:', this.data.userInfo);
        
        // 强制刷新界面，确保图片显示更新
        setTimeout(() => {
          this.setData({
            userInfo: { ...this.data.userInfo }
          });
          console.log('强制刷新界面完成, 当前bgpic:', this.data.userInfo.bgpic);
        }, 100);
      });

      // 更新全局数据
      const app = getApp();
      if (app.globalData) {
        app.globalData.userInfo = {
          ...app.globalData.userInfo,
          nickname: finalFormData.nickname,
          avatar: finalFormData.avatar,
          bgpic: finalFormData.bgpic
        };
        wx.setStorageSync('userInfo', app.globalData.userInfo);
      }

      // 通知其他页面更新 - 通过全局数据已经实现同步

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
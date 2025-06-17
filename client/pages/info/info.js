// pages/info/info.js
import { getUserInfo, updateUserInfo } from '../../api/user'
import request from '../../utils/request'
import { createPage, withUserInfo } from '../../utils/page-helper'

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const infoPage = createPage(withUserInfo({
  data: {
    editMode: false,
    userInfo: null,
    formData: {},
    pendingFiles: {
      avatar: null,
      bgpic: null
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.loadUserData()
    
    // 添加用户信息更新事件监听
    const app = getApp()
    if (typeof app.addUserInfoUpdateListener === 'function') {
      app.addUserInfoUpdateListener(this.onUserInfoUpdate.bind(this))
    }
  },

  /**
   * 获取用户数据
   */
  async loadUserData() {
    this.setLoading(true)

    try {
      const res = await getUserInfo()
      
      if (res.success === false || res.code === 401) {
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none'
        })
        return
      }
      
      const userData = res.data?.user || res.data || res
      
      this.setData({
        userInfo: userData,
        formData: {
          nickname: userData.nickname || userData.username || '',
          avatar: userData.avatar || userData.avatarUrl || '',
          bgpic: userData.bgpic || ''
        }
      })
      
    } catch (error) {
      this.handleError(error, '获取用户信息失败')
    } finally {
      this.setLoading(false)
    }
  },

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    if (this.data.editMode) {
      // 退出编辑模式时，恢复原始数据并清理暂存文件
      this.resetForm()
    }
    
    this.setData({
      editMode: !this.data.editMode
    })
  },

  /**
   * 重置表单
   */
  resetForm() {
    this.setData({
      formData: {
        nickname: this.data.userInfo.nickname || this.data.userInfo.username || '',
        avatar: this.data.userInfo.avatar || this.data.userInfo.avatarUrl || '',
        bgpic: this.data.userInfo.bgpic || ''
      },
      pendingFiles: {
        avatar: null,
        bgpic: null
      }
    })
  },

  /**
   * 表单输入事件
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`formData.${field}`]: value
    })
  },

  /**
   * 微信原生头像选择回调
   */
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    
    try {
      this.setLoading(true, '处理头像中...')
      
      // 将微信头像临时路径转换为base64并上传
      const fileData = await this.readFileAsBase64(avatarUrl)
      
      this.setData({
        'pendingFiles.avatar': {
          fileData: fileData,
          filename: 'wechat_avatar.jpg',
          tempPath: avatarUrl
        },
        'formData.avatar': avatarUrl
      })

      wx.showToast({
        title: '头像已选择',
        icon: 'success'
      })
      
    } catch (error) {
      this.handleError(error, '处理微信头像失败')
    } finally {
      this.setLoading(false)
    }
  },



  /**
   * 选择背景图
   */
  chooseBgpic() {
    this.chooseAndUploadFile('bgpic')
  },

  /**
   * 清空头像
   */
  clearAvatar() {
    wx.showModal({
      title: '确认',
      content: `确定要清空头像吗？`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'formData.avatar': '',
            'pendingFiles.avatar': { action: 'clear' }
          })
          wx.showToast({
            title: '头像已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 清空背景图
   */
  clearBgpic() {
    this.clearFile('bgpic', '聊天背景')
  },

  /**
   * 清空文件的通用方法
   */
  clearFile(fileType, displayName) {
    wx.showModal({
      title: '确认',
      content: `确定要清空${displayName}吗？`,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            [`formData.${fileType}`]: '',
            [`pendingFiles.${fileType}`]: { action: 'clear' }
          })
          wx.showToast({
            title: `${displayName}已清空`,
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 选择文件并暂存
   */
  async chooseAndUploadFile(fileType) {
    try {
      const chooseRes = await this.chooseImage()
      const tempFilePath = chooseRes.tempFilePaths[0]

      this.setLoading(true, '处理中...')

      const fileData = await this.readFileAsBase64(tempFilePath)

      this.setData({
        [`pendingFiles.${fileType}`]: {
          fileData: fileData,
          filename: this.getFilenameFromPath(tempFilePath),
          tempPath: tempFilePath
        },
        [`formData.${fileType}`]: tempFilePath
      })

      wx.showToast({
        title: '图片已选择',
        icon: 'success'
      })

    } catch (error) {
      this.handleError(error, '选择失败')
    } finally {
      this.setLoading(false)
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
      })
    })
  },

  /**
   * 读取文件为base64格式
   */
  readFileAsBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => resolve(res.data),
        fail: reject
      })
    })
  },

  /**
   * 从文件路径提取文件名
   */
  getFilenameFromPath(filePath) {
    const parts = filePath.split('/')
    return parts[parts.length - 1] || 'upload.jpg'
  },

  /**
   * 保存用户信息
   */
  async saveUserInfo() {
    const { formData, pendingFiles } = this.data
    
    // 表单验证
    if (!formData.nickname.trim()) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
      return
    }
    
    this.setLoading(true, '保存中...')

    try {
      let finalFormData = {
        nickname: formData.nickname,
        avatar: formData.avatar || '',
        bgpic: formData.bgpic
      }

      // 处理需要上传的文件
      for (const fileType of ['avatar', 'bgpic']) {
        const pendingFile = pendingFiles[fileType]
        if (pendingFile) {
          if (pendingFile.action === 'clear') {
            finalFormData[fileType] = ''
          } else if (pendingFile.fileData) {
            try {
              const uploadRes = await request.post('/api/user/upload', {
                file_type: fileType,
                file_data: pendingFile.fileData,
                filename: pendingFile.filename
              })

              if (!uploadRes.success) {
                throw new Error(uploadRes.message || '上传失败')
              }

              finalFormData[fileType] = uploadRes.data.accessUrl
            } catch (uploadError) {
              this.handleError(uploadError, `${fileType === 'avatar' ? '头像' : '背景图'}上传失败`)
              return
            }
          }
        }
      }
      
      const res = await updateUserInfo(finalFormData)
      
      if (res.success === false) {
        throw new Error(res.error || '保存失败')
      }
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 更新本地数据
      const updatedUserInfo = {
        ...this.data.userInfo,
        nickname: finalFormData.nickname,
        avatar: finalFormData.avatar,
        bgpic: finalFormData.bgpic
      }
      
      // 生成带时间戳的图片URL，强制破解缓存
      const timestamp = Date.now()
      const displayUserInfo = {
        ...updatedUserInfo,
        avatar: updatedUserInfo.avatar ? `${updatedUserInfo.avatar}?_t=${timestamp}` : '',
        bgpic: updatedUserInfo.bgpic ? `${updatedUserInfo.bgpic}?_t=${timestamp}` : ''
      }
      
      // 先退出编辑模式并更新页面数据（使用带时间戳的URL显示）
      this.setData({
        editMode: false,
        userInfo: displayUserInfo,
        formData: {
          nickname: finalFormData.nickname,
          avatar: displayUserInfo.avatar,
          bgpic: displayUserInfo.bgpic
        },
        pendingFiles: {
          avatar: null,
          bgpic: null
        }
      })

      // 更新全局数据和存储（存储原始URL，显示带时间戳的URL）
      const app = getApp()
      if (app.globalData) {
        app.globalData.userInfo = updatedUserInfo // 存储原始URL
      }
      wx.setStorageSync('userInfo', updatedUserInfo) // 存储原始URL
      wx.setStorageSync('userId', updatedUserInfo.id)

      // 触发全局用户信息更新事件（发送带时间戳的显示数据）
      if (typeof wx.triggerGlobalUserInfoUpdate === 'function') {
        wx.triggerGlobalUserInfoUpdate({
          ...updatedUserInfo,
          _displayAvatar: displayUserInfo.avatar,
          _displayBgpic: displayUserInfo.bgpic,
          _forceRefresh: true,
          _timestamp: timestamp
        })
      }

      // 重新拉取服务器数据确保同步（不显示loading）
      setTimeout(async () => {
        try {
          const res = await getUserInfo()
          if (res.success !== false && res.code !== 401) {
            const userData = res.data?.user || res.data || res
            // 更新全局数据，但不更新页面显示（避免覆盖带时间戳的显示URL）
            const app = getApp()
            if (app.globalData) {
              app.globalData.userInfo = userData
            }
            wx.setStorageSync('userInfo', userData)
          }
        } catch (error) {
          console.log('后台同步用户数据失败:', error)
        }
      }, 500)

    } catch (error) {
      this.handleError(error, '保存失败')
    } finally {
      this.setLoading(false)
    }
  },

  /**
   * 响应用户信息更新事件
   */
  onUserInfoUpdate(updatedUserInfo) {
    console.log('info页面收到用户信息更新事件:', updatedUserInfo)
    console.log('当前editMode状态:', this.data.editMode)
    
    // 如果是自己发出的强制刷新事件，跳过处理避免死循环
    if (updatedUserInfo._forceRefresh) {
      console.log('info页面跳过自己发出的强制刷新事件')
      return
    }
    
    // 始终更新userInfo，formData只在非编辑模式下更新
    const updateData = {
      userInfo: updatedUserInfo
    }
    
    // 如果不在编辑模式，也更新formData
    if (!this.data.editMode) {
      updateData.formData = {
        nickname: updatedUserInfo.nickname || updatedUserInfo.username || '',
        avatar: updatedUserInfo.avatar || updatedUserInfo.avatarUrl || '',
        bgpic: updatedUserInfo.bgpic || ''
      }
      console.log('info页面更新formData:', updateData.formData)
    }
    
    console.log('info页面即将setData:', updateData)
    this.setData(updateData, () => {
      console.log('info页面setData完成，当前数据:', {
        userInfo: this.data.userInfo,
        formData: this.data.formData,
        editMode: this.data.editMode
      })
    })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadUserData()
    wx.stopPullDownRefresh()
  }
}))

Page(infoPage) 
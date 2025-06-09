import request from '../utils/request'

// 获取用户信息
export const getUserInfo = () => {
  return request.get('/api/user/info')
}

// 更新用户信息
export const updateUserInfo = (data) => {
  return request.put('/api/user/info', data)
}

// 绑定机器人
export const bindRobot = async (robotId) => {
  console.log('开始绑定机器人，ID:', robotId)
  try {
    const result = await request.post(`/api/robot/${robotId}/bind`)
    console.log('绑定机器人成功:', result)
    return result
  } catch (error) {
    console.error('绑定机器人失败:', error)
    throw error
  }
}

// 获取用户统计信息
// ~ 没有使用
export const getUserStats = () => {
  return request.get('/api/user/stats')
}

// 获取用户设置
// ~ 没有使用
export const getUserSettings = () => {
  return request.get('/api/user/settings')
}

// 更新用户设置
// ~ 没有使用
export const updateUserSettings = (data) => {
  return request.put('/api/user/settings', data)
}

// 获取用户个人资料
// ~ 没有使用
export const getUserProfile = () => {
  return request.get('/api/user/profile')
}

// 获取用户积分
// ~ 没有使用
export const getUserPoints = () => {
  return request.get('/api/user/points')
}

// 选择机器人
export const selectRobot = (selectedRobot) => {
  return request.post('/api/user/select-robot', { selectedRobot })
} 
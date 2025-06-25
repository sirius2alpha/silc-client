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

// 选择机器人
export const selectRobot = (selectedRobot) => {
  return request.post('/api/user/select-robot', { selectedRobot })
} 
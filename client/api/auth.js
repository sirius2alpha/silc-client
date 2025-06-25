import request from '../utils/request'

/**
 * 用户认证相关API
 */

/**
 * 验证token有效性
 * @param {string} token 用户token
 * @returns {Promise<Object>} 返回用户数据或错误信息
 */
export const verifyToken = (token) => {
    console.log('Sending verify request...')
    return request.post('/api/auth/verify', null, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(res => {
            console.log('Verify response:', res)

            if (res.code === 200 || res.success === true) {
                // 提取用户数据
                let claim = null
                if (res.data) {
                    claim = res.data.claims
                }

                if (!claim) {
                    console.error('未能获取有效的用户数据')
                    throw new Error('Invalid user data')
                }

                return claim
            } else {
                throw new Error(res.message || 'Token验证失败')
            }
        })
        .catch(err => {
            console.error('Token验证失败:', err)
            throw err
        })
}

// 登录
export const login = async ({ account, password }) => {
    try {
        console.log('发送登录请求，参数:', { account, password })
        const result = await request.post('/api/user/login', { account, password })
        return result
    } catch (error) {
        console.error('登录请求失败:', error)
        throw error
    }
}

// 注册
export const register = (data) => {
    return request.post('/api/user/register', data)
}

// 微信登录
export const wechatLogin = async ({ code }) => {
    try {
        console.log('发送微信登录请求，参数:', { code })
        const result = await request.post('/api/user/wx-login', { code })
        return result
    } catch (error) {
        console.error('微信登录请求失败:', error)
        throw error
    }
}

// 退出登录
export const logout = async () => {
    try {
        const token = wx.getStorageSync('accessToken')
        console.log('发送退出登录请求')
        const result = await request.post('/api/auth/logout', null, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        return result
    } catch (error) {
        console.error('退出登录请求失败:', error)
        throw error
    }
}

// 修改密码
export const changePassword = async ({ newPassword }) => {
    try {
        const token = wx.getStorageSync('accessToken')
        console.log('发送修改密码请求')
        const result = await request.put('/api/auth/user/password', { new_password: newPassword }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        return result
    } catch (error) {
        console.error('修改密码请求失败:', error)
        throw error
    }
}

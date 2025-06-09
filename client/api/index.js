// 导入所有API模块
const auth = require('./auth');
const user = require('./user');
const robot = require('./robot');
const chat = require('./chat');
const points = require('./points');
const feedback = require('./feedback');

// 导出统一的API对象
module.exports = {
  auth,
  user,
  robot,
  chat,
  points,
  feedback
}; 
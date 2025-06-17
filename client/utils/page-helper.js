// 页面助手模块
import { PageMixin, PaginationMixin, UserInfoManager, RobotManager, CommonMethods } from './common.js'

/**
 * 创建页面对象，自动混入通用方法
 */
export function createPage(pageConfig) {
  return Object.assign(
    {},
    PageMixin,
    CommonMethods,
    pageConfig
  )
}

/**
 * 创建带分页功能的页面对象
 */
export function createPaginationPage(pageConfig) {
  return Object.assign(
    {},
    PageMixin,
    PaginationMixin,
    CommonMethods,
    pageConfig
  )
}

/**
 * 混入用户信息管理功能
 */
export function withUserInfo(pageConfig) {
  return Object.assign(
    {},
    UserInfoManager,
    pageConfig
  )
}

/**
 * 混入机器人管理功能
 */
export function withRobot(pageConfig) {
  return Object.assign(
    {},
    RobotManager,
    pageConfig
  )
} 
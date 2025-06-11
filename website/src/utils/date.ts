/**
 * 格式化日期时间
 * @param date 日期字符串、Date对象或Unix时间戳字符串
 * @param format 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export const formatDateTime = (date: string | Date | null | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) {
    return '-'
  }
  
  let d: Date
  
  if (typeof date === 'string') {
    // 检查是否是Unix时间戳（秒级）
    if (/^\d+$/.test(date)) {
      d = new Date(parseInt(date) * 1000)
    } else {
      d = new Date(date)
    }
  } else {
    d = date
  }
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    return '-'
  }
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串，格式为 'YYYY-MM-DD'
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的时间字符串，格式为 'HH:mm:ss'
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  return formatDateTime(date, 'HH:mm:ss')
} 
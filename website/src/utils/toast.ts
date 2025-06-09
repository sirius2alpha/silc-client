import { ElMessage, ElMessageBox } from 'element-plus'

export const showSuccess = (message: string) => {
  ElMessage.success(message)
}

export const showError = (message: string) => {
  ElMessage.error(message)
}

export const showWarning = (message: string) => {
  ElMessage.warning(message)
}

export const showInfo = (message: string) => {
  ElMessage.info(message)
}

export const confirm = (message: string, title = '提示') => {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
}

export const alert = (message: string, title = '提示') => {
  return ElMessageBox.alert(message, title, {
    confirmButtonText: '确定'
  })
} 
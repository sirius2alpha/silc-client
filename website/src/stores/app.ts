import { defineStore } from 'pinia'

interface AppState {
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: false,
    theme: 'light',
    language: 'zh-CN'
  }),

  getters: {
    isDark: (state) => state.theme === 'dark'
  },

  actions: {
    // 切换侧边栏折叠状态
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    // 切换主题
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', this.theme)
    },

    // 切换语言
    toggleLanguage() {
      this.language = this.language === 'zh-CN' ? 'en-US' : 'zh-CN'
    }
  }
}) 
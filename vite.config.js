import { defineConfig } from 'vite'

export default defineConfig({
  // Build options
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        dashboard: 'leader-dashboard.html',
        admin: 'admin-dashboard.html',
        pic: 'pic-dashboard.html',
        checker: 'checker-dashboard.html',
        koordinator: 'koordinator-dashboard.html',
      }
    }
  }
})

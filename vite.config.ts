import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiBaseUrl = process.env.VITE_API_URL || 'https://gpt-agent.cc'
const apiUrl = (() => {
  try {
    return new URL(apiBaseUrl)
  } catch {
    return new URL('https://gpt-agent.cc')
  }
})()
const apiPath = apiUrl.pathname.replace(/\/$/, '')

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      // API proxy for local development to avoid CORS preflight failures.
      '/codex': {
        target: apiUrl.origin,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => `${apiPath}${path.replace(/^\/codex/, '')}`,
      },
    },
  },
})

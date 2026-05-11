import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BUILD_TARGET=android → relative base for Capacitor (WebView root).
const isAndroidBuild = process.env.BUILD_TARGET === 'android'

export default defineConfig({
  plugins: [react()],
  base: isAndroidBuild ? './' : '/matemagia/',
  build: { chunkSizeWarningLimit: 800 },
})

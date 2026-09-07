import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const httpsCertificate = process.env.COSMIC_HTTPS_CERT
const httpsKey = process.env.COSMIC_HTTPS_KEY
const https = httpsCertificate && httpsKey
  ? {
      cert: fs.readFileSync(httpsCertificate),
      key: fs.readFileSync(httpsKey),
    }
  : undefined

const configuredBase = process.env.VITE_APP_BASE?.trim() || "/"
const appBase = configuredBase.endsWith("/")
  ? configuredBase
  : `${configuredBase}/`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: appBase,
  server: {
    host: '0.0.0.0',
    ...(https ? { https } : {}),
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
      },
    },
  },
})

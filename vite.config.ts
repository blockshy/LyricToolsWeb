import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 关键配置：设置部署的子路径，与 Nginx 的 location 对应
  build: {
    assetsDir: 'assets',   // 默认就是 assets，可明确写上
    emptyOutDir: true,     // 打包前清空 dist（推荐）
  }
})
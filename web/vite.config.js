import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // 相对路径：兼容 GitHub Pages 子路径（/Agent_Demo/）与本地 file:// 打开
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' }
  }
});

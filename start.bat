@echo off
chcp 65001 >nul
cd /d %~dp0
echo ============================================
echo  TubeInsight 一键启动
echo  浏览器将自动打开 http://localhost:3000
echo  关闭本窗口 = 停止服务
echo ============================================
start "" http://localhost:3000
node server\server.js
pause

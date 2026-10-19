@echo off
chcp 65001 >nul
title 翁法罗斯·如我所书 - 开发模式
cd /d "%~dp0"
echo.
echo   正在启动开发服务器（热更新）...
echo   启动后用浏览器打开终端里显示的地址即可。
echo.
call npm run dev:h5
pause

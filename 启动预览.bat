@echo off
chcp 65001 >nul
title 翁法罗斯·如我所书 - H5 预览
cd /d "%~dp0"
echo.
echo   正在构建并启动预览服务...
echo.
call npm run preview
pause

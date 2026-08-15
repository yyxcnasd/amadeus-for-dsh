@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\Amadeus-OneClick.ps1"
echo.
pause

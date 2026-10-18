@echo off
title GeoUIUC dev server
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org, then run this again.
  pause
  exit /b 1
)

if not exist "node_modules\next" (
  echo Installing libraries - first time only, this takes a minute...
  call npm install
  if errorlevel 1 ( echo. & echo Install failed - see the messages above. & pause & exit /b 1 )
)

echo Starting the site. Your browser will open at http://localhost:3000
echo Leave this window open while you use the site. Close it to stop the site.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3000"
call npm run dev
echo.
echo The site stopped. If there was an error, it is shown above.
pause

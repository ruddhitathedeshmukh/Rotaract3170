@echo off
echo ========================================
echo Starting Rotaract 3170 Application with ngrok
echo ========================================
echo.

REM Set ngrok path
set NGROK_PATH=C:\Users\Admin\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe

REM Check if ngrok exists
if not exist "%NGROK_PATH%" (
    echo ERROR: ngrok not found at %NGROK_PATH%
    echo Please update the NGROK_PATH in this script
    pause
    exit /b 1
)

echo Step 1: Starting Django Backend on port 8000...
start "Django Backend" cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"
timeout /t 5 /nobreak >nul

echo Step 2: Starting Vite Frontend on port 3000...
start "Vite Frontend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo Step 3: Starting ngrok tunnels...
echo.
echo Starting ngrok for backend (port 8000)...
start "ngrok Backend" cmd /k "%NGROK_PATH%" http 8000 --log=stdout

timeout /t 3 /nobreak >nul

echo Starting ngrok for frontend (port 3000)...
start "ngrok Frontend" cmd /k "%NGROK_PATH%" http 3000 --log=stdout

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Please check the ngrok terminal windows for your public URLs:
echo - Backend ngrok URL: Check "ngrok Backend" window
echo - Frontend ngrok URL: Check "ngrok Frontend" window
echo.
echo IMPORTANT: Update the API_BASE_URL in api.ts with your backend ngrok URL
echo Example: const API_BASE_URL = 'https://your-backend-url.ngrok-free.app/api';
echo.
echo Press any key to open ngrok dashboard in browser...
pause >nul
start http://localhost:4040
echo.
echo Press any key to exit (this will NOT stop the services)...
pause >nul
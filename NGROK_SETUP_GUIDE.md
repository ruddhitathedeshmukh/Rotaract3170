# Ngrok Setup Guide for Rotaract 3170 Application

## Overview
This guide explains how to host your Rotaract 3170 application using ngrok, which allows you to expose both your frontend (port 3000) and backend (port 8000) to the internet.

## Prerequisites
- Ngrok installed at: `C:\Users\Admin\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe`
- Ngrok auth token: `3ANQNyrR181Dgp9GYQqq29cC9Ok_2SvbAAmtMSZg8MNmhuEs9`

## Quick Start

### Option 1: Automated Startup (Recommended)
Simply run the batch file:
```bash
start-with-ngrok.bat
```

This will automatically:
1. Start Django backend on port 8000
2. Start Vite frontend on port 3000
3. Start ngrok tunnels for both services
4. Open ngrok dashboard in your browser

### Option 2: Manual Setup

#### Step 1: Start Backend
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

#### Step 2: Start Frontend
```bash
npm run dev
```

#### Step 3: Start Ngrok for Backend
```bash
C:\Users\Admin\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe http 8000
```

#### Step 4: Start Ngrok for Frontend (in a new terminal)
```bash
C:\Users\Admin\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe http 3000
```

## Configuration

### 1. Django Settings (Already Configured)
The Django backend has been configured to accept ngrok hosts in `backend/rotaract_project/settings.py`:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '.ngrok-free.app', '.ngrok.io']
```

### 2. Vite Configuration (Already Configured)
The Vite frontend has been configured to accept ngrok hosts in `vite.config.ts`:
```typescript
server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [".ngrok-free.app"]
}
```

### 3. Update API Configuration
After starting ngrok, you'll get two public URLs. You need to update the frontend to use the backend ngrok URL:

1. Check the ngrok Backend terminal window for your backend URL (e.g., `https://abc123.ngrok-free.app`)
2. Open `api.ts` and update the `API_BASE_URL`:
```typescript
const API_BASE_URL = 'https://your-backend-url.ngrok-free.app/api';
```
3. Save the file and the frontend will hot-reload

## Accessing Your Application

### Frontend
- Local: `http://localhost:3000`
- Ngrok: `https://your-frontend-url.ngrok-free.app`

### Backend
- Local: `http://localhost:8000`
- Ngrok: `https://your-backend-url.ngrok-free.app`

### Ngrok Dashboard
- URL: `http://localhost:4040`
- Shows all requests, response times, and tunnel status

## Important Notes

### Ngrok Free Tier Limitations
- URLs change every time you restart ngrok
- Limited to 40 connections per minute
- Session timeout after 2 hours
- You'll need to update `api.ts` with the new backend URL each time

### CORS Configuration
The backend is already configured to accept requests from any origin for development. For production, you should restrict this in `settings.py`.

### Database
Make sure your MySQL database is running before starting the backend:
```bash
# Check if MySQL is running
mysql -u root -p
```

## Troubleshooting

### Issue: "This site can't be reached"
- Check if all services are running (backend, frontend, ngrok)
- Verify ngrok tunnels are active in the ngrok dashboard

### Issue: API calls failing
- Ensure you've updated `API_BASE_URL` in `api.ts` with the correct ngrok backend URL
- Check the ngrok Backend terminal for the correct URL
- Verify CORS settings in Django

### Issue: Ngrok not found
- Update the `NGROK_PATH` in `start-with-ngrok.bat` to match your ngrok location
- Or add ngrok to your system PATH

### Issue: "ERR_NGROK_3200"
- Your ngrok auth token may be invalid
- Run: `C:\Users\Admin\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe config add-authtoken 3ANQNyrR181Dgp9GYQqq29cC9Ok_2SvbAAmtMSZg8MNmhuEs9`

## Sharing Your Application

Once ngrok is running, share the **frontend ngrok URL** with others:
- Example: `https://abc123.ngrok-free.app`
- Users may see an ngrok warning page first - click "Visit Site" to continue
- The application will work exactly like localhost, but accessible from anywhere

## Stopping Services

To stop all services:
1. Close all terminal windows (Django, Vite, ngrok Backend, ngrok Frontend)
2. Or press `Ctrl+C` in each terminal

## Production Deployment

For production deployment, consider:
- Using a proper domain name instead of ngrok
- Setting up a reverse proxy (nginx)
- Using environment variables for configuration
- Enabling HTTPS with proper SSL certificates
- Restricting CORS to specific domains
- Using a production-grade WSGI server (gunicorn, uwsgi)

## Support

If you encounter issues:
1. Check the ngrok dashboard at `http://localhost:4040`
2. Review Django logs in the backend terminal
3. Check browser console for frontend errors
4. Verify all services are running on correct ports
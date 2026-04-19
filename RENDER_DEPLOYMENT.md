# Render Deployment Guide

## Overview
Your app has:
- **Backend**: Django REST API
- **Frontend**: React + Vite
- **Database**: PostgreSQL

Render will host both on the same account.

## Step 1: Prepare Your Repository

### 1.1 Backend - Add `Procfile`
```
web: gunicorn config.wsgi --log-file -
release: python manage.py migrate
```

### 1.2 Backend - Add `runtime.txt` (Optional but recommended)
```
python-3.11.0
```

### 1.3 Backend - Update `backend/config/settings.py` (Already mostly done, verify)
   ```python
# settings.py should have:
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
```

### 1.4 Install production dependencies
Your `backend/requirements.txt` needs `gunicorn`:
```
gunicorn==21.2.0
```

## Step 2: Create Render Services

### 2.1 Create PostgreSQL Database
1. Go to [render.com](https://render.com)
2. Click **New +** → **PostgreSQL**
3. Name: `soms-db` (or similar)
4. Region: Choose closest to you
5. PostgreSQL Version: 15
6. Copy the connection string - you'll need it

### 2.2 Deploy Backend
1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. **Name**: `soms-backend`
4. **Environment**: Python 3
5. **Region**: Same as database
6. **Build Command**: 
   ```
   pip install -r backend/requirements.txt
   ```
7. **Start Command**:
   ```
   cd backend && gunicorn config.wsgi
   ```
8. **Environment Variables** (click "Add Environment Variable"):
   ```
   SECRET_KEY=generate-a-new-random-key-here
   DEBUG=False
   ALLOWED_HOSTS=soms-backend.onrender.com
   
   # Database (Render provides this)
   DATABASE_URL=postgresql://user:password@host:5432/db  
   
   # Email
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-brevo-user
   EMAIL_HOST_PASSWORD=your-brevo-key
   DEFAULT_FROM_EMAIL=your-email@example.com
   
   # CORS - Allow frontend
   CORS_ALLOWED_ORIGINS=https://soms-frontend.onrender.com
   ```

9. Click **Create Web Service**

### 2.3 Deploy Frontend
1. Click **New +** → **Static Site**
2. Connect your GitHub repo
3. **Name**: `soms-frontend`
4. **Build Command**:
   ```
   cd frontend && npm install && npm run build
   ```
5. **Publish Directory**: `frontend/dist`
6. **Add Environment Variable**:
   ```
   VITE_API_URL=https://soms-backend.onrender.com/api
   ```
7. Click **Create Static Site**

## Step 3: Update Backend for Production

### 3.1 Update `backend/config/settings.py`

```python
import os
from pathlib import Path

# ... existing code ...

# Database
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600
    )
}

# CORS
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
```

### 3.2 Add to `backend/requirements.txt`
```
gunicorn==21.2.0
dj-database-url==2.1.0
whitenoise==6.6.0  # For serving static files
```

### 3.3 Update `backend/config/settings.py` - Add WhiteNoise
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this line
    'django.contrib.sessions.middleware.SessionMiddleware',
    # ... rest of middleware ...
]

# Enable compression
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

## Step 4: Update Frontend for API

### 4.1 Update `frontend/src/api/client.js` (or wherever axios is configured)
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### 4.2 Build command verification
In `frontend/package.json`, ensure you have:
```json
"scripts": {
  "build": "vite build",
  "dev": "vite",
  "preview": "vite preview"
}
```

## Step 5: Run Database Migrations

After backend deploys:
1. Go to your backend in Render dashboard
2. Click **Shell**
3. Run:
   ```bash
   cd backend
   python manage.py migrate
   ```

## Step 6: Create Superuser (Optional)

In the Shell:
```bash
python manage.py createsuperuser
```

## Step 7: Test

1. Visit: `https://soms-frontend.onrender.com`
2. Check backend at: `https://soms-backend.onrender.com/api/`
3. Admin panel: `https://soms-backend.onrender.com/admin/`

## Troubleshooting

**502 Bad Gateway on Backend?**
- Check logs in Render dashboard
- Verify all environment variables are set
- Make sure migrations ran successfully

**Frontend can't reach API?**
- Check CORS_ALLOWED_ORIGINS matches frontend URL
- Check VITE_API_URL environment variable
- Check browser console for errors

**404 Error on Refresh (SPA Routing Issue)**
- This happens when the frontend is deployed as a Static Site - it tries to find that exact URL path instead of routing to index.html
- **Solution**: The project now includes:
  1. `render.yaml` - Configuration file for Render deployment
  2. `frontend/server.js` - Express server for proper SPA routing
  3. Updated `frontend/package.json` - Includes express dependency and start script
- **To deploy**:
  ```bash
  git add render.yaml frontend/server.js frontend/package.json
  git commit -m "Fix SPA routing for Render deployment"
  git push
  ```
  Then redeploy on Render dashboard. The frontend will now be deployed as a Web Service (not Static Site) with proper SPA routing.

**Database connection errors?**
- Verify DATABASE_URL is correct
- Run migrations through Shell
- Check PostgreSQL service is running

## Scaling Tips

- **Free tier**: Renders to sleep after 15 min inactivity. Upgrade to Paid for production ($7+/month)
- **Database backups**: Enable in Render dashboard
- **Custom domain**: Add under Settings in Render


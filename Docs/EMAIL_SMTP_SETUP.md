# Email SMTP Implementation Guide

## Overview
This guide walks you through the complete setup and implementation of email SMTP functionality for temporary password generation and account creation in the Students Outcomes Assessment System.

## What Has Been Implemented

### 1. **Backend Configuration**

#### A. Django Settings (`backend/config/settings.py`)
- Added email backend configuration
- Configured SMTP server details (host, port, TLS)
- Set up environment variables for email credentials

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@assessmentsystem.com')
```

#### B. Environment Variables (`.env`)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@assessmentsystem.com
```

#### C. Utility Functions (`backend/users/utils.py`)
- `generate_temporary_password()`: Generates secure random 12-character passwords with mixed character types
- `send_account_creation_email()`: Sends account creation email with temporary password
- `send_password_reset_email()`: (Optional) Sends password reset emails

#### D. API Endpoints
New endpoint created: `POST /api/users/create_account/`

**Request Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin",  // or "staff" or "student"
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "department": "Computer Science",
    "created_at": "2025-12-16T...",
    "updated_at": "2025-12-16T..."
  },
  "email_sent": true,
  "message": "Account created successfully. Temporary password sent to email."
}
```

### 2. **Frontend Updates**

#### Login Component (`frontend/src/pages/Login.jsx`)
- Integrated actual authentication with the backend
- Added JWT token management
- Implemented role-based routing:
  - **admin** role → `/programchair/dashboard`
  - **staff** role → `/staff/dashboard`
- Added error handling and loading states
- Displays user-friendly error messages

**Key Features:**
- Email and password form submission
- Role selection (Admin/Program Chair or Staff)
- Stores JWT tokens in localStorage
- Automatically routes to correct dashboard after login
- Error handling for failed login attempts

## Setup Instructions

### Step 1: Configure Email Provider

#### Using Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password

3. **Update `.env` file**:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx  # 16-char app password (remove spaces)
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

#### Using Other Email Providers

- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.region.amazonaws.com:587`
- **Office 365**: `smtp.office365.com:587`

### Step 2: Verify Backend Configuration

1. Navigate to backend directory:
```bash
cd backend
```

2. Test email configuration (optional):
```bash
python manage.py shell
from django.core.mail import send_mail
send_mail(
    'Test Subject',
    'Test Message',
    'your-email@gmail.com',  # FROM
    ['recipient@example.com'],  # TO
    fail_silently=False,
)
```

### Step 3: Create User Accounts (Developer/Admin)

Use the new endpoint to create accounts with temporary passwords:

#### Option A: Using curl
```bash
curl -X POST http://localhost:8000/api/users/create_account/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "programchair@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "admin",
    "department": "Engineering"
  }'
```

#### Option B: Using Python
```python
import requests

response = requests.post(
    'http://localhost:8000/api/users/create_account/',
    json={
        'email': 'programchair@example.com',
        'first_name': 'Jane',
        'last_name': 'Smith',
        'role': 'admin',
        'department': 'Engineering'
    }
)
print(response.json())
```

#### Option C: Using Django Admin
```bash
cd backend
python manage.py createsuperuser  # Create admin account
python manage.py runserver
# Go to http://localhost:8000/admin and use custom user creation form
```

### Step 4: User Login Flow

1. **User receives email** with:
   - Account creation notification
   - Temporary password
   - Dashboard URL based on role

2. **User logs in** at the login page:
   - Selects role (Program Chair or Staff)
   - Enters email and temporary password
   - Click "Sign In"

3. **Frontend authentication**:
   - Calls `/api/token/` endpoint
   - Receives JWT access & refresh tokens
   - Stores tokens in localStorage
   - Fetches user role from `/api/users/{id}/`

4. **Automatic routing**:
   - **Admin users** → `/programchair/dashboard`
   - **Staff users** → `/staff/dashboard`

### Step 5: Change Password (Optional - Implement Later)

Consider adding a "Change Password" endpoint:
```python
@action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
def change_password(self, request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not user.check_password(old_password):
        return Response({'detail': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password changed successfully'})
```

## Testing the System

### 1. Start Backend Server
```bash
cd backend
python manage.py runserver
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```

### 3. Create a Test Account
```bash
curl -X POST http://localhost:8000/api/users/create_account/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststaff@example.com",
    "first_name": "Test",
    "last_name": "Staff",
    "role": "staff",
    "department": "IT"
  }'
```

### 4. Check Email
- Check your email inbox for the account creation message
- Copy the temporary password

### 5. Login
- Go to http://localhost:5173
- Select "Staff" role
- Enter email: `teststaff@example.com`
- Enter password: (the temporary password from email)
- Should redirect to `/staff/dashboard`

## File Structure

```
backend/
├── config/
│   └── settings.py          # Email configuration added
├── users/
│   ├── views.py            # New create_account endpoint
│   ├── serializers.py       # UserCreateSerializer added
│   └── utils.py             # NEW - Email utilities
└── .env                      # Email credentials

frontend/
└── src/pages/
    └── Login.jsx            # Updated with auth logic
```

## Security Considerations

1. **Never commit `.env`** with real credentials
2. **Use App Passwords** for Gmail, not the account password
3. **Rotate credentials** regularly
4. **Use HTTPS** in production
5. **Implement rate limiting** on account creation endpoint
6. **Add admin protection** to account creation endpoint:

```python
@action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
def create_account(self, request):
    # Admin-only account creation
```

7. **Force password change** on first login (implement later)

## Troubleshooting

### Email Not Sending

1. **Check credentials**: Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env
2. **Check firewall**: Ensure port 587 is not blocked
3. **Check Gmail settings**: Enable "Less secure app access" (alternative to app passwords)
4. **Test SMTP connection**:
```python
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('your-email@gmail.com', 'app-password')
print("Connection successful!")
```

### Login Not Working

1. **Check backend running**: `http://localhost:8000/api/`
2. **Check CORS settings**: Frontend URL should be in CORS_ALLOWED_ORIGINS
3. **Check JWT token**: Verify tokens are stored correctly
4. **Check browser console**: Look for API errors

### Dashboard Not Loading

1. **Check role value**: User.role should be exactly "admin" or "staff"
2. **Check dashboard files**: Ensure `/programchair/dashboard` and `/staff/dashboard` components exist
3. **Check localStorage**: Verify tokens are being stored

## Next Steps

1. Implement "Forgot Password" functionality
2. Add password change requirement on first login
3. Implement email verification
4. Add admin panel for user management
5. Add activity logging
6. Set up email templates (HTML emails)


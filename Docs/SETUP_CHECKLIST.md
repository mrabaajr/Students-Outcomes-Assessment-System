# Email SMTP Implementation - Setup Checklist

## Pre-Implementation Checklist

- [x] Review current user creation system
- [x] Design temporary password generation
- [x] Plan email SMTP configuration
- [x] Design JWT authentication flow
- [x] Design role-based routing

---

## Implementation Checklist

### Backend Setup

- [x] **Email Configuration in Settings**
  - File: `backend/config/settings.py`
  - Added EMAIL_BACKEND, EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS
  - Added EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, DEFAULT_FROM_EMAIL

- [x] **Environment Variables**
  - File: `backend/.env`
  - Added all email configuration variables

- [x] **Utility Functions**
  - File: `backend/users/utils.py` (NEW)
  - Implemented: `generate_temporary_password()`
  - Implemented: `send_account_creation_email()`
  - Implemented: `send_password_reset_email()`

- [x] **API Endpoint for Account Creation**
  - File: `backend/users/views.py`
  - Added: `@action create_account`
  - Validation for email, role
  - Generates temporary password
  - Sends email with password
  - Returns user data and status

- [x] **User Serializer**
  - File: `backend/users/serializers.py`
  - Added: `UserCreateSerializer`
  - Validates role field

### Frontend Setup

- [x] **Login Component Update**
  - File: `frontend/src/pages/Login.jsx`
  - Installed jwt-decode library
  - Added axios for API calls
  - Implemented handleSubmit with authentication
  - Added JWT token storage in localStorage
  - Implemented role-based routing
  - Added error handling and loading states

### Documentation

- [x] **Setup Guide**
  - File: `EMAIL_SMTP_SETUP.md`
  - Comprehensive configuration instructions
  - Multiple email provider examples
  - Troubleshooting guide
  - Security considerations

- [x] **Implementation Summary**
  - File: `IMPLEMENTATION_SUMMARY.md`
  - Quick reference guide
  - File changes summary
  - Testing checklist
  - Next steps

- [x] **Process Walkthrough**
  - File: `PROCESS_WALKTHROUGH.md`
  - Visual architecture diagrams
  - Step-by-step flows
  - Detailed system interactions

### Testing Resources

- [x] **Python Test Script**
  - File: `test_account_creation.py`
  - Test account creation function
  - Test login function
  - Easy-to-use interface

- [x] **Postman Collection**
  - File: `Assessment_System_API.postman_collection.json`
  - Pre-configured API requests
  - All endpoints included
  - Token management variables

---

## Pre-Launch Checklist

### Configuration

- [ ] **Gmail Setup** (if using Gmail)
  - [ ] Enable 2-Factor Authentication
  - [ ] Generate App Password
  - [ ] Copy 16-character app password

- [ ] **Update .env File**
  - [ ] Set EMAIL_HOST correctly
  - [ ] Set EMAIL_PORT correctly
  - [ ] Set EMAIL_USE_TLS correctly
  - [ ] Set EMAIL_HOST_USER (your email)
  - [ ] Set EMAIL_HOST_PASSWORD (app password)
  - [ ] Set DEFAULT_FROM_EMAIL

- [ ] **Backend Configuration**
  - [ ] Verify settings.py has email config
  - [ ] Verify .env file in backend folder
  - [ ] No hardcoded credentials in code

### Code Verification

- [ ] **users/utils.py exists**
  - [ ] generate_temporary_password() function
  - [ ] send_account_creation_email() function
  - [ ] send_password_reset_email() function

- [ ] **users/views.py has create_account endpoint**
  - [ ] @action decorator present
  - [ ] create_account method exists
  - [ ] Validation implemented
  - [ ] Email sending implemented

- [ ] **Frontend Login.jsx is updated**
  - [ ] JWT imports present (jwtDecode)
  - [ ] axios imported
  - [ ] useNavigate hook used
  - [ ] handleSubmit function implemented
  - [ ] Role-based routing present

### Database

- [ ] **Database is initialized**
  - [ ] db.sqlite3 exists
  - [ ] Migrations are applied
  - Run: `python manage.py migrate`

- [ ] **Superuser created** (optional but recommended)
  - [ ] Run: `python manage.py createsuperuser`
  - [ ] Access admin at http://localhost:8000/admin

---

## Testing Checklist

### Setup Phase

- [ ] **Start Backend Server**
  ```bash
  cd backend
  python manage.py runserver
  ```
  - [ ] Server runs on http://localhost:8000
  - [ ] Django admin accessible at /admin

- [ ] **Start Frontend Server**
  ```bash
  cd frontend
  npm run dev
  ```
  - [ ] Server runs on http://localhost:5173
  - [ ] No build errors

- [ ] **Test Backend Connection**
  - [ ] Visit http://localhost:8000/api/
  - [ ] Should see API root with available endpoints

### Account Creation Testing

- [ ] **Test Account Creation Endpoint**
  - [ ] Use curl, Postman, or Python script
  - [ ] Create program chair account
  - [ ] Create staff account
  - [ ] Check response includes email_sent: true

- [ ] **Check Email Delivery**
  - [ ] Check inbox for account creation email
  - [ ] Email contains temporary password
  - [ ] Email is properly formatted
  - [ ] Temporary password is 12 characters

### Authentication Testing

- [ ] **Test Login with Temporary Password**
  - [ ] Go to http://localhost:5173
  - [ ] Select "Program Chair" role
  - [ ] Enter email from created account
  - [ ] Enter temporary password from email
  - [ ] Click Sign In

- [ ] **Verify Login Success**
  - [ ] No error messages
  - [ ] Page redirects
  - [ ] Check browser console for no JS errors

### Routing Testing

- [ ] **Test Admin Routing**
  - [ ] Login with admin account
  - [ ] Should redirect to /programchair/dashboard
  - [ ] URL should show /programchair/dashboard

- [ ] **Test Staff Routing**
  - [ ] Login with staff account
  - [ ] Should redirect to /staff/dashboard
  - [ ] URL should show /staff/dashboard

### Token Testing

- [ ] **Verify Tokens in Browser**
  - [ ] Open Developer Tools (F12)
  - [ ] Go to Application/Storage
  - [ ] Click localStorage
  - [ ] See "accessToken" present
  - [ ] See "refreshToken" present
  - [ ] Tokens are long strings starting with "eyJ..."

- [ ] **Test Token Persistence**
  - [ ] Refresh page (F5)
  - [ ] Should remain logged in
  - [ ] Tokens should still be in localStorage
  - [ ] Should not require re-login

### API Testing

- [ ] **Test GET /api/users/me/**
  - [ ] After login, tokens exist
  - [ ] Call: `curl -H "Authorization: Bearer {token}" http://localhost:8000/api/users/me/`
  - [ ] Should return current user data
  - [ ] Should include role field

- [ ] **Test GET /api/users/{id}/**
  - [ ] After login, get user by ID
  - [ ] Should return user data
  - [ ] Should include role field for routing

### Error Handling Testing

- [ ] **Test Invalid Credentials**
  - [ ] Try login with wrong password
  - [ ] Should show error message
  - [ ] Should not redirect
  - [ ] Tokens should NOT be stored

- [ ] **Test Duplicate Email**
  - [ ] Try creating account with existing email
  - [ ] Should return error message
  - [ ] User should not be created

- [ ] **Test Missing Email**
  - [ ] Try creating account without email
  - [ ] Should return validation error

---

## Post-Launch Checklist

### Production Preparation

- [ ] **Security Review**
  - [ ] Remove DEBUG=True from settings.py
  - [ ] Change SECRET_KEY to unique value
  - [ ] Implement admin protection on create_account endpoint
  - [ ] Add rate limiting to account creation
  - [ ] Review CORS settings

- [ ] **Performance**
  - [ ] Test with multiple accounts
  - [ ] Monitor email sending speed
  - [ ] Check database query efficiency

- [ ] **Monitoring**
  - [ ] Setup email delivery tracking
  - [ ] Setup authentication logging
  - [ ] Monitor token expiration issues

### Future Enhancements

- [ ] **Implement Force Password Change**
  - [ ] On first login, require password change
  - [ ] Don't allow account use until changed

- [ ] **Implement Forgot Password**
  - [ ] Add password reset flow
  - [ ] Secure token generation for reset
  - [ ] Email with reset link

- [ ] **Email Templates**
  - [ ] Create HTML email templates
  - [ ] Customize email branding
  - [ ] Multi-language support

- [ ] **User Management Dashboard**
  - [ ] Admin panel to create/edit users
  - [ ] Bulk user creation
  - [ ] User activity logging

- [ ] **Two-Factor Authentication**
  - [ ] Add 2FA option for users
  - [ ] Email or authenticator app

---

## Troubleshooting Checklist

If something doesn't work, check:

### Email Not Sending

- [ ] `.env` file has correct EMAIL_HOST_USER
- [ ] `.env` file has correct EMAIL_HOST_PASSWORD
- [ ] No spaces in app password (if using Gmail)
- [ ] Gmail 2FA is enabled
- [ ] Gmail app password was generated
- [ ] Firewall doesn't block port 587
- [ ] EMAIL_USE_TLS is True
- [ ] TEST: Run `python manage.py shell` and test email sending

### Login Not Working

- [ ] Backend server is running on 8000
- [ ] Frontend server is running on 5173
- [ ] Email and password are correct
- [ ] Account was created successfully
- [ ] Check browser console for errors
- [ ] Check Django server logs for errors

### Routing to Wrong Dashboard

- [ ] User role is exactly "admin" or "staff" (check database)
- [ ] Login component has role-based routing logic
- [ ] Dashboard components exist:
  - [ ] /frontend/src/pages/programchair/Dashboard.jsx
  - [ ] /frontend/src/pages/staff/Dashboard.jsx

### Tokens Not Storing

- [ ] Browser localStorage is enabled
- [ ] Frontend has localStorage.setItem() calls
- [ ] No 3rd-party cookies being blocked
- [ ] Check in DevTools → Application → localStorage

---

## Quick Reference Commands

```bash
# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend setup
cd frontend
npm install
npm run dev

# Test account creation
python test_account_creation.py

# Django shell test
python manage.py shell

# Check email in Django shell
from django.core.mail import send_mail
send_mail('Test', 'Message', 'from@email.com', ['to@email.com'])
```

---

## Documentation Files

1. **EMAIL_SMTP_SETUP.md** - Start here for detailed setup
2. **IMPLEMENTATION_SUMMARY.md** - Quick overview of what was done
3. **PROCESS_WALKTHROUGH.md** - Visual diagrams and detailed flows
4. **SETUP_CHECKLIST.md** - This file (step-by-step verification)

---

**Last Updated:** December 16, 2025
**Status:** Implementation Complete - Ready for Testing

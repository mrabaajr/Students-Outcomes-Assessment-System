# Email SMTP Implementation - Process Walkthrough

## System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVELOPER/ADMIN                         │
│                  (Maintaining the System)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  Create Account Endpoint │
              │  POST /api/users/        │
              │      create_account/     │
              └────────────┬─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Generate Temp    Create User       Send Email
   Password        in Database         via SMTP
   (12 chars)      (role: admin or    (with temp
                    staff)             password)
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ▼
                ┌──────────────────────┐
                │  User Email Inbox    │
                │  (Receives Email)    │
                └─────────┬────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│  USER (Program Chair or Staff)                                 │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
                  ┌─────────────────┐
                  │  Login Page      │
                  │  (Frontend)      │
                  └────────┬─────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Select Role    Enter Email    Enter Temp
     (Admin/Staff)  @example.com    Password
          │                │                │
          └────────────────┼────────────────┘
                           ▼
              ┌────────────────────────┐
              │  Authenticate User     │
              │  POST /api/token/      │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Issue JWT Tokens      │
              │  - Access Token        │
              │  - Refresh Token       │
              └────────────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
    Store in         Fetch User      Determine
    localStorage    Details          Role
            │              │              │
            └──────────────┼──────────────┘
                           ▼
              ┌────────────────────────────┐
              │  Role-Based Routing        │
              └────────┬─────────┬─────────┘
                       │         │
        ┌──────────────┘         └──────────────┐
        │                                       │
        ▼                                       ▼
    Admin User                            Staff User
    (role="admin")                    (role="staff")
        │                                       │
        ▼                                       ▼
    /programchair/dashboard            /staff/dashboard
        │                                       │
        ▼                                       ▼
    Program Chair                            Staff
    Dashboard (Admin)                    Dashboard
```

## User Account Creation Flow (Detailed)

### Step 1: Administrator Creates Account

```
Developer/Admin calls:

POST /api/users/create_account/
{
  "email": "programchair@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "role": "admin",                    ← Determines dashboard
  "department": "Engineering"
}
```

### Step 2: Backend Processing

```
1. Validate Input
   ✓ Email provided
   ✓ Role is valid (admin/staff/student)
   ✗ Email already exists → return error

2. Generate Temporary Password
   Input:  length=12
   Output: "K7#mP9$xQ2@L"  (random, secure)
   
   Characters used:
   - Uppercase: A-Z
   - Lowercase: a-z
   - Numbers: 0-9
   - Special: !@#$%^&*

3. Create User in Database
   User(
     email="programchair@example.com",
     password="K7#mP9$xQ2@L"  (hashed),
     first_name="John",
     last_name="Smith",
     role="admin",              ← Critical for routing
     department="Engineering",
     username="programchair@example.com"
   )

4. Send Email via SMTP
   From: noreply@assessmentsystem.com
   To: programchair@example.com
   Subject: Your Assessment System Account Created
   
   Body:
   ┌────────────────────────────────────┐
   │ Hello John Smith,                  │
   │                                    │
   │ Your account has been created.     │
   │                                    │
   │ Email: programchair@example.com    │
   │ Temp Password: K7#mP9$xQ2@L        │
   │                                    │
   │ Dashboard: /programchair/dashboard │
   │                                    │
   │ Please change your password...     │
   └────────────────────────────────────┘

5. Return Response
   {
     "user": { ... user data ... },
     "email_sent": true,
     "message": "Account created successfully..."
   }
```

## User Login Flow (Detailed)

### Step 1: User Receives Email and Logs In

```
Frontend: http://localhost:5173

┌─────────────────────────────────────┐
│  Assessment System Login Page       │
├─────────────────────────────────────┤
│  Select Role:                       │
│  [X] Program Chair    [ ] Staff     │
├─────────────────────────────────────┤
│  Email: programchair@example.com    │
│  Password: K7#mP9$xQ2@L             │
│  [Sign In]                          │
└─────────────────────────────────────┘
```

### Step 2: Frontend Authentication

```
JavaScript (Login.jsx):

1. User submits form
   → preventDefault()
   → Get email & password from form

2. Call API: POST /api/token/
   Body: {
     "email": "programchair@example.com",
     "password": "K7#mP9$xQ2@L"
   }

3. Receive Response:
   {
     "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
   }

4. Store Tokens
   localStorage.setItem("accessToken", access)
   localStorage.setItem("refreshToken", refresh)

5. Decode Access Token
   const decoded = jwtDecode(access)
   userId = decoded.user_id  // e.g., 1

6. Fetch User Details
   GET /api/users/1/
   Headers: Authorization: Bearer {access}
   
   Response:
   {
     "id": 1,
     "email": "programchair@example.com",
     "first_name": "John",
     "last_name": "Smith",
     "role": "admin",  ← KEY FIELD
     "department": "Engineering"
   }

7. Route Based on Role
   if (role === "admin") {
     navigate("/programchair/dashboard")
   } else if (role === "staff") {
     navigate("/staff/dashboard")
   }
```

### Step 3: Dashboard Access

```
Admin User (role="admin")
│
├─ JWT Token stored in localStorage
├─ User data cached in state/context
│
└─ Route: /programchair/dashboard
   │
   ├─ Page renders: ProgramChairDashboard component
   ├─ Shows admin-specific content
   └─ Can perform admin functions

Staff User (role="staff")
│
├─ JWT Token stored in localStorage
├─ User data cached in state/context
│
└─ Route: /staff/dashboard
   │
   ├─ Page renders: StaffDashboard component
   ├─ Shows staff-specific content
   └─ Can perform staff functions
```

## Email Configuration (SMTP Setup)

### Gmail Setup Example

```
1. User Account Security Settings
   https://myaccount.google.com/security
   
   ✓ Enable 2-Step Verification
   ✓ Create App Password

2. Copy 16-Character App Password
   Example: xxxx xxxx xxxx xxxx

3. Update .env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=xxxxxxxxxxxx  (remove spaces)
   DEFAULT_FROM_EMAIL=your-email@gmail.com

4. Django Settings (Already configured)
   config/settings.py:
   
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
   EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
   EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
   EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
   EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
   DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', '...')

5. Test Connection (Django Shell)
   python manage.py shell
   
   >>> from django.core.mail import send_mail
   >>> send_mail(
   ...   'Test',
   ...   'Message',
   ...   'your-email@gmail.com',
   ...   ['recipient@example.com'],
   ...   fail_silently=False,
   ... )
   
   If no error → Email works!
```

## Data Models & Authentication

### User Model (Extended Django AbstractUser)

```python
class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('instructor', 'Instructor'),
        ('student', 'Student'),
    )
    
    role = CharField(max_length=20, choices=ROLE_CHOICES)
    department = CharField(max_length=255, blank=True, null=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

Example User:
┌──────────────────────────────────┐
│ User (id=1)                      │
├──────────────────────────────────┤
│ email: programchair@example.com  │
│ password: (hashed)               │
│ first_name: John                 │
│ last_name: Smith                 │
│ role: admin      ← Determines UI │
│ department: Engineering          │
│ is_active: True                  │
│ created_at: 2025-12-16T...       │
└──────────────────────────────────┘
```

### JWT Token Structure

```
Access Token Payload:
{
  "token_type": "access",
  "exp": 1734429600,          // Expires in 60 minutes
  "iat": 1734426000,          // Issued at
  "jti": "abc123...",
  "user_id": 1                // Key field
}

Refresh Token Payload:
{
  "token_type": "refresh",
  "exp": 1735034400,          // Expires in 7 days
  "iat": 1734426000,
  "jti": "def456...",
  "user_id": 1
}
```

## Security Considerations

### Password Storage

```
Plaintext:    K7#mP9$xQ2@L
               │
               ▼
          (hashing algorithm: PBKDF2)
               │
               ▼
Database:  pbkdf2_sha256$600000$salt$hash...

When user logs in:
Input:    K7#mP9$xQ2@L
           │
           ▼ (hash with same salt)
           │
Matches DB hash? → True → Login successful
```

### Token Usage

```
1. Frontend requests protected resource
   GET /api/users/me/
   Headers: Authorization: Bearer {access_token}

2. Backend validates token
   - Is token valid format?
   - Is token not expired?
   - Is signature valid?
   
3. If valid → Return user data
   If invalid → Return 401 Unauthorized

4. Token expires → User calls /api/token/refresh/
   Sends refresh token → Gets new access token
```

## Testing Workflow

```
1. Start Servers
   Terminal 1: cd backend && python manage.py runserver
   Terminal 2: cd frontend && npm run dev

2. Create Account (as Admin/Developer)
   curl -X POST http://localhost:8000/api/users/create_account/ \
     -H "Content-Type: application/json" \
     -d '{...}' 

3. Check Email
   Email arrives with temporary password

4. Login (as User)
   Go to http://localhost:5173
   Enter email and temporary password
   Click Sign In

5. Verify Routing
   Admin → /programchair/dashboard
   Staff → /staff/dashboard

6. Check Developer Tools
   localStorage has accessToken & refreshToken
   Network tab shows API calls with Authorization header
```

---

This walkthrough covers the entire system flow. Refer to `EMAIL_SMTP_SETUP.md` for detailed configuration instructions.

# 🎨 Quick Visual Reference Guide

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────┬────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    │  GMAIL   │ (SMTP)
    │ SENDGRID │
    │ MAILGUN  │ etc
    └────┬────┘
         │
         │ Email with Temp Password
         ▼
    ┌────────────────────────────────────────┐
    │      USER MAILBOX                      │
    │  ┌──────────────────────────────────┐  │
    │  │ Account Created!                 │  │
    │  │ Email: user@example.com          │  │
    │  │ Password: K7#mP9$xQ2@L           │  │
    │  │ Dashboard: /programchair/...     │  │
    │  └──────────────────────────────────┘  │
    └────┬────────────────────────────────────┘
         │
         │ User opens login page
         ▼
    ┌────────────────────────────────────────┐
    │      FRONTEND (React)                  │
    │  http://localhost:5173                 │
    │                                        │
    │  ┌──────────────────────────────────┐  │
    │  │ [✓] Program Chair  [ ] Staff     │  │
    │  │                                  │  │
    │  │ Email: user@example.com          │  │
    │  │ Password: ••••••••               │  │
    │  │ [Sign In]                        │  │
    │  └──────────────────────────────────┘  │
    └────┬────────────────────────────────────┘
         │
         │ POST /api/token/
         │ {"email": "...", "password": "..."}
         ▼
    ┌────────────────────────────────────────┐
    │      BACKEND (Django)                  │
    │  http://localhost:8000/api             │
    │                                        │
    │  1. Validate credentials               │
    │  2. Generate JWT tokens                │
    │  3. Return access & refresh            │
    └────┬────────────────────────────────────┘
         │
         │ Response: {"access": "...", "refresh": "..."}
         ▼
    ┌────────────────────────────────────────┐
    │      FRONTEND                          │
    │                                        │
    │  localStorage:                         │
    │  ├─ accessToken: "eyJ..."              │
    │  └─ refreshToken: "eyJ..."             │
    │                                        │
    │  1. Decode token → get user_id         │
    │  2. GET /api/users/{id}/ with token    │
    │  3. Read user.role                     │
    │  4. Route to dashboard                 │
    └────┬────────────────────────────────────┘
         │
    ┌────┴──────────────────────┐
    │                           │
    ▼                           ▼
Admin (role="admin")      Staff (role="staff")
    │                           │
    ▼                           ▼
/programchair/dashboard   /staff/dashboard
    │                           │
    └─────────┬─────────────────┘
              ▼
        [Dashboard Shows]
```

## Step-by-Step Account Creation

```
STEP 1: Developer Creates Account
┌─────────────────────────────────────────┐
│ curl -X POST http://localhost:8000/api/ │
│     users/create_account/ \             │
│   -H "Content-Type: application/json" \ │
│   -d '{                                 │
│     "email": "user@example.com",        │
│     "first_name": "John",               │
│     "last_name": "Smith",               │
│     "role": "admin",                    │
│     "department": "Engineering"         │
│   }'                                    │
└────────────────────┬────────────────────┘
                     ▼
STEP 2: Backend Processing
┌─────────────────────────────────────────┐
│ 1. Check email not exists ✓             │
│ 2. Generate password: K7#mP9$xQ2@L      │
│ 3. Hash password                        │
│ 4. Create user in DB:                   │
│    - email: user@example.com            │
│    - password: (hashed)                 │
│    - role: admin                        │
│    - department: Engineering            │
│ 5. Send email via SMTP                  │
└────────────────────┬────────────────────┘
                     ▼
STEP 3: Email Delivery
┌─────────────────────────────────────────┐
│ From: noreply@assessmentsystem.com      │
│ To: user@example.com                    │
│ Subject: Account Created                │
│                                         │
│ Hello John Smith,                       │
│ Your account has been created.          │
│                                         │
│ Email: user@example.com                 │
│ Temp Password: K7#mP9$xQ2@L             │
│                                         │
│ Dashboard: /programchair/dashboard      │
│ Password: Please change on first login  │
└─────────────────────────────────────────┘
```

## Step-by-Step Login Process

```
STEP 1: User Visits Login Page
┌──────────────────────────────────────────┐
│ http://localhost:5173                    │
│                                          │
│ Assessment System Login                  │
│ ┌──────────────────────────────────────┐ │
│ │ Select your role to continue         │ │
│ │                                      │ │
│ │ [✓ Program Chair]  [  Staff  ]       │ │
│ │                                      │ │
│ │ Email: [user@example.com       ]     │ │
│ │ Password: [••••••••            ]     │ │
│ │ [Sign In as Program Chair]           │ │
│ └──────────────────────────────────────┘ │
└────────────────────┬─────────────────────┘
                     │ User clicks Sign In
                     ▼

STEP 2: Frontend Submits Login Request
┌──────────────────────────────────────────┐
│ POST /api/token/                         │
│ Content-Type: application/json           │
│                                          │
│ {                                        │
│   "email": "user@example.com",           │
│   "password": "K7#mP9$xQ2@L"             │
│ }                                        │
└────────────────────┬─────────────────────┘
                     │ HTTP Request
                     ▼

STEP 3: Backend Validates & Issues Tokens
┌──────────────────────────────────────────┐
│ 1. Lookup user by email ✓                │
│ 2. Check password hash ✓                 │
│ 3. User is active ✓                      │
│ 4. Generate JWT tokens                   │
│                                          │
│ Response: 200 OK                         │
│ {                                        │
│   "access": "eyJ0eXAi...",               │
│   "refresh": "eyJ0eXAi..."               │
│ }                                        │
└────────────────────┬─────────────────────┘
                     │ HTTP Response
                     ▼

STEP 4: Frontend Stores & Processes
┌──────────────────────────────────────────┐
│ 1. Store tokens in localStorage          │
│    ├─ accessToken: "eyJ0eXAi..."         │
│    └─ refreshToken: "eyJ0eXAi..."        │
│                                          │
│ 2. Decode accessToken                    │
│    └─ user_id: 1                         │
│                                          │
│ 3. GET /api/users/1/                     │
│    Headers: Authorization: Bearer ...    │
│                                          │
│    Response:                             │
│    {                                     │
│      "id": 1,                            │
│      "email": "user@example.com",        │
│      "first_name": "John",               │
│      "role": "admin",  ← KEY FIELD!      │
│      "department": "Engineering"         │
│    }                                     │
└────────────────────┬─────────────────────┘
                     │ Check role
                     ▼

STEP 5: Route Based on Role
┌─────────────────────────────────┐
│ if role === "admin"              │
│   navigate("/programchair/...")  │
│ else if role === "staff"         │
│   navigate("/staff/dashboard")   │
│ else                             │
│   navigate("/")                  │
└─────────────────────┬───────────┘
                      ▼

STEP 6: Dashboard Loads
┌──────────────────────────────────────────┐
│ Admin Path: /programchair/dashboard      │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │      Program Chair Dashboard         │ │
│ │                                      │ │
│ │ Logged in as: John Smith             │ │
│ │ Role: Program Chair (Admin)          │ │
│ │                                      │ │
│ │ [Manage Users] [View Reports] ...    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ OR                                       │
│                                          │
│ Staff Path: /staff/dashboard             │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │      Staff Dashboard                 │ │
│ │                                      │ │
│ │ Logged in as: Jane Doe               │ │
│ │ Role: Staff                          │ │
│ │                                      │ │
│ │ [View Assessments] [Submit Data] ... │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## File Dependency Tree

```
FRONTEND
└── src/pages/
    └── Login.jsx
        ├── imports axios (HTTP calls)
        ├── imports jwtDecode (token parsing)
        ├── imports useNavigate (routing)
        └── calls:
            ├── POST /api/token/ (authentication)
            └── GET /api/users/{id}/ (get role)

BACKEND
├── config/
│   └── settings.py
│       ├── EMAIL_BACKEND configuration
│       ├── EMAIL_HOST (Gmail/SendGrid/etc)
│       ├── EMAIL_PORT (587)
│       ├── EMAIL_USE_TLS (True)
│       ├── EMAIL_HOST_USER (from .env)
│       └── EMAIL_HOST_PASSWORD (from .env)
│
├── users/
│   ├── views.py
│   │   ├── UserViewSet
│   │   ├── @action login (POST /api/token/)
│   │   ├── @action register (POST /api/users/register/)
│   │   ├── @action create_account (NEW!)
│   │   │   └── uses generate_temporary_password()
│   │   │   └── uses send_account_creation_email()
│   │   └── @action me (GET /api/users/me/)
│   │
│   ├── serializers.py
│   │   ├── UserSerializer
│   │   ├── UserDetailSerializer (includes role)
│   │   └── UserCreateSerializer
│   │
│   ├── models.py
│   │   └── User (extends AbstractUser)
│   │       ├── role (admin, staff, student)
│   │       ├── department
│   │       └── timestamps
│   │
│   └── utils.py (NEW!)
│       ├── generate_temporary_password()
│       │   └── returns: "K7#mP9$xQ2@L" (12 chars)
│       │
│       ├── send_account_creation_email()
│       │   ├── uses Django email backend
│       │   ├── uses SMTP settings
│       │   ├── sends email with temp password
│       │   └── dashboard URL based on role
│       │
│       └── send_password_reset_email() (optional)
│
└── .env (CREDENTIALS)
    ├── EMAIL_HOST=smtp.gmail.com
    ├── EMAIL_PORT=587
    ├── EMAIL_USE_TLS=True
    ├── EMAIL_HOST_USER=your-email@gmail.com
    ├── EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
    └── DEFAULT_FROM_EMAIL=noreply@...
```

## API Endpoints Diagram

```
┌─────────────────────────────────────────────────────────┐
│             API ENDPOINTS (http://localhost:8000/api/)  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Authentication (No Auth Required)                      │
│  ├─ POST /token/                                        │
│  │   ├─ email: "user@example.com"                       │
│  │   ├─ password: "K7#mP9$xQ2@L"                        │
│  │   └─ returns: { access, refresh }                    │
│  │                                                     │
│  ├─ POST /token/refresh/                               │
│  │   ├─ refresh: "eyJ..."                              │
│  │   └─ returns: { access }                            │
│  │                                                     │
│  └─ POST /users/register/                              │
│      ├─ email, password, first_name, last_name         │
│      └─ returns: user data                             │
│                                                         │
│  Account Creation (Developer Use)                       │
│  └─ POST /users/create_account/                        │
│      ├─ email, first_name, last_name, role, dept       │
│      ├─ generates temporary password                    │
│      ├─ sends email with password                       │
│      └─ returns: { user, email_sent, message }          │
│                                                         │
│  User Endpoints (Auth Required - Bearer Token)          │
│  ├─ GET /users/                                         │
│  │   └─ returns: list of users (admin only)            │
│  │                                                     │
│  ├─ GET /users/{id}/                                   │
│  │   └─ returns: { id, email, first_name, last_name,   │
│  │               role, department, ... }                │
│  │                                                     │
│  ├─ GET /users/me/                                     │
│  │   └─ returns: current user data                     │
│  │                                                     │
│  └─ PATCH /users/{id}/                                 │
│      └─ update: { first_name, last_name, etc }         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## JWT Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                  JWT TOKEN LIFECYCLE                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. GENERATION (Login)                                   │
│    User submits credentials                             │
│            ↓                                             │
│    Backend validates                                    │
│            ↓                                             │
│    Access Token Generated        Refresh Token          │
│    ├─ Expires: 60 minutes        Generated              │
│    ├─ Contains: user_id          ├─ Expires: 7 days    │
│    └─ Signed with: SECRET_KEY    └─ For getting new    │
│                                     access tokens       │
│                                                         │
│ 2. STORAGE (Frontend)                                   │
│    localStorage:                                        │
│    ├─ accessToken: "eyJ0eXAiOiJKV1QiLCJhbGc..."         │
│    └─ refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGc..."        │
│                                                         │
│ 3. USAGE (Protected Requests)                           │
│    All requests to protected endpoints:                 │
│    Headers:                                             │
│    Authorization: Bearer {accessToken}                  │
│                                                         │
│ 4. VALIDATION (Backend)                                 │
│    ├─ Is format correct? ✓                              │
│    ├─ Is signature valid? ✓                             │
│    ├─ Is token expired? ✗ (within 60 min)              │
│    └─ If valid → Request allowed                        │
│                                                         │
│ 5. REFRESH (When Expired)                               │
│    Frontend detects expiry:                             │
│    POST /token/refresh/                                 │
│    ├─ Send: { refresh: refreshToken }                   │
│    ├─ Get: { access: newAccessToken }                   │
│    └─ Update localStorage                               │
│                                                         │
│ 6. LOGOUT (Optional)                                    │
│    Frontend removes tokens:                             │
│    localStorage.removeItem('accessToken')               │
│    localStorage.removeItem('refreshToken')              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Role-Based Access Flow

```
ROLE DETERMINATION
┌───────────────────────────────────────┐
│ User Logs In                          │
│         │                             │
│         ▼                             │
│ Backend Issues Token                  │
│         │                             │
│         ▼                             │
│ Token stored in localStorage           │
│         │                             │
│         ▼                             │
│ Frontend decodes token → user_id      │
│         │                             │
│         ▼                             │
│ GET /api/users/{user_id}/             │
│ Headers: Authorization: Bearer ...    │
│         │                             │
│         ▼                             │
│ Response includes: { ..., role, ... } │
│         │                             │
│    ┌────┴───────────────────┐         │
│    │                        │         │
│    ▼                        ▼         │
│  role="admin"            role="staff" │
│    │                        │         │
│    ▼                        ▼         │
│  /programchair/          /staff/      │
│  dashboard               dashboard    │
│    │                        │         │
│    └────────────┬───────────┘         │
│                 ▼                     │
│         USER LOGGED IN ✓              │
│         & ROUTED ✓                    │
└───────────────────────────────────────┘
```

## Security Flow

```
PASSWORD SECURITY
Plaintext: K7#mP9$xQ2@L
    │
    ▼ (PBKDF2 Hashing Algorithm)
Database: pbkdf2_sha256$iterations$salt$hash
    │
    └─ Contains: salt (prevents rainbow tables)
    └─ Contains: iterations (600,000 by default)
    └─ Contains: hash (one-way function)

LOGIN VALIDATION
Input Password: K7#mP9$xQ2@L
    │
    ▼ (Hash with same salt)
Computed Hash: pbkdf2_sha256$...
    │
    ▼ (Compare)
Database Hash: pbkdf2_sha256$...
    │
    ├─ Match? → Login Success ✓
    └─ No Match? → Login Denied ✗
```

---

**This visual guide helps you understand the complete system at a glance!**

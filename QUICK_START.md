# 🚀 Email SMTP Setup - QUICK START (5 Minutes)

## Step 1️⃣: Configure Email (1 minute)

### Using Gmail? (Easiest)

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Go to: https://myaccount.google.com/apppasswords
4. Generate "App Password" (you'll get 16 chars)
5. Edit `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=xxxxxxxxxxxx  # 16-char password, remove spaces
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Not using Gmail?** Check EMAIL_SMTP_SETUP.md for other providers.

---

## Step 2️⃣: Start Servers (1 minute)

### Terminal 1 - Backend:
```bash
cd backend
python manage.py runserver
```
✅ Should see: "Starting development server at http://127.0.0.1:8000/"

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
✅ Should see: "VITE ... ready in XXX ms"

---

## Step 3️⃣: Create Your First Account (1 minute)

### Copy & Run This:

```bash
curl -X POST http://localhost:8000/api/users/create_account/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@example.com",
    "first_name": "Test",
    "last_name": "Admin",
    "role": "admin",
    "department": "IT"
  }'
```

✅ You should see:
```json
{
  "user": { "id": 1, "email": "testadmin@example.com", ... },
  "email_sent": true,
  "message": "Account created successfully..."
}
```

---

## Step 4️⃣: Check Your Email (1 minute)

📧 **Check your email inbox!**

You should see an email with:
- Email address
- **Temporary Password** (copy this)
- Dashboard URL

---

## Step 5️⃣: Login to Dashboard (1 minute)

1. Open: http://localhost:5173
2. Click: **"Program Chair"** button
3. Email: `testadmin@example.com`
4. Password: (paste from email)
5. Click: **"Sign In"**

🎉 **You should be on the admin dashboard!**

---

## 🎯 What Just Happened?

1. ✅ Created account with generated temporary password
2. ✅ Sent password via email (SMTP)
3. ✅ User logged in and got JWT tokens
4. ✅ User routed to correct dashboard (admin → `/programchair/dashboard`)

---

## ❌ Issues? Quick Fixes

### Email didn't arrive
- Check spam folder
- Check EMAIL_HOST_USER is correct in .env
- Check you copied the 16-char app password correctly (no spaces!)

### Login says "Invalid credentials"
- Make sure you copied the password from email correctly
- Try copy-pasting directly (watch for spaces)

### Redirecting to wrong dashboard
- Check the email for what role was created
- Try logging out (localStorage will clear)

### Can't connect to backend
- Make sure backend is running on port 8000
- Go to http://localhost:8000/api/ to verify

---

## 📚 Next Steps

1. **Read IMPLEMENTATION_SUMMARY.md** - Overview of what was built
2. **Read EMAIL_SMTP_SETUP.md** - Detailed configuration guide
3. **Check PROCESS_WALKTHROUGH.md** - Visual diagrams of how it works
4. **Review SETUP_CHECKLIST.md** - Full testing checklist

---

## 📝 Create More Test Accounts

### Test Staff Account:
```bash
curl -X POST http://localhost:8000/api/users/create_account/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststaff@example.com",
    "first_name": "Test",
    "last_name": "Staff",
    "role": "staff",
    "department": "Teaching"
  }'
```

Then login with this account → should go to `/staff/dashboard`

---

## 🔑 Key Files Changed

| File | What Changed |
|------|-------------|
| `backend/.env` | Added email config |
| `backend/config/settings.py` | Added EMAIL_BACKEND config |
| `backend/users/utils.py` | NEW - Password generation & email sending |
| `backend/users/views.py` | Added create_account endpoint |
| `frontend/src/pages/Login.jsx` | Real auth + routing |

---

## ✅ Success Indicators

You're good if you see:
- [ ] Emails arriving with temporary passwords
- [ ] Users can login with email + temp password
- [ ] Admin redirects to `/programchair/dashboard`
- [ ] Staff redirects to `/staff/dashboard`
- [ ] JWT tokens in browser localStorage
- [ ] No "Invalid credentials" errors

---

## 🆘 Still Stuck?

Check these in order:
1. Is `backend/.env` updated with your Gmail credentials?
2. Is backend running? (`http://localhost:8000/api/`)
3. Is frontend running? (`http://localhost:5173`)
4. Check browser console for JavaScript errors (F12)
5. Check Django server terminal for errors
6. Read `EMAIL_SMTP_SETUP.md` troubleshooting section

---

## 🎓 Understanding the Flow

```
Developer Creates Account (curl/API)
    ↓
Temporary Password Generated (random)
    ↓
Email Sent via SMTP (Gmail/SendGrid/etc)
    ↓
User Gets Email with Password
    ↓
User Logs In (email + temp password)
    ↓
JWT Tokens Generated & Stored
    ↓
User Routed to Dashboard (by role)
    ↓
✅ Done!
```

---

**Created:** December 16, 2025  
**Time to Setup:** ~5 minutes  
**Status:** 🟢 Ready to Use

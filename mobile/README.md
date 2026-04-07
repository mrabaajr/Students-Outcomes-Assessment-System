# SOAS Mobile

This folder contains the React Native app for the Students Outcomes Assessment System.

## Stack

- Expo
- React Native
- React Navigation
- Axios
- Expo Secure Store

## Setup

1. Install dependencies:

```powershell
cd mobile
npm install
```

2. Copy the environment file and point it to your Django API:

```powershell
Copy-Item .env.example .env
```

3. Update `EXPO_PUBLIC_API_URL` in `.env`.

Use one of these values:

- Android emulator: `http://10.0.2.2:8000/api`
- iOS simulator: `http://127.0.0.1:8000/api`
- Physical phone on same Wi-Fi: `http://YOUR_COMPUTER_LAN_IP:8000/api`

4. Start the app:

```powershell
npm run start
```

## Current status

- Authentication shell is wired
- Secure token storage is wired
- Navigation is wired
- Dashboard is a starter placeholder

## Recommended next work

- Port the existing login logic completely
- Add role-based navigation for program chair and faculty
- Move shared API calls into `src/services`
- Rebuild dashboard, classes, courses, assessment, and reports screens
